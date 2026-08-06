# EuroDeal Ingest-Worker – Leitfaden

Die App selbst crawlt nicht. Sie läuft in einer Edge-Runtime (kein Browser, keine
Proxies, keine langen Laufzeiten). Echte Anzeigen kommen von einem **externen
Worker**, den du auf eigener Infrastruktur betreibst (z. B. Hetzner/Fly.io,
Node + Playwright). Der Worker liefert fertige Daten an die App-API.

---

## 1. Datenfluss

```
Worker (dein Server)  ──POST /api/public/ingest/run──►  EuroDeal
                      ◄── 200 { ok, upserted, retry_after_seconds }

EuroDeal ──POST INGEST_WORKER_URL──►  Worker   (Live-Suche des Nutzers)
```

- **Pull-Betrieb (Cron):** Worker holt periodisch Anzeigen und pusht sie.
- **Live-Suche:** Tippt ein Nutzer eine Suche, ruft EuroDeal `INGEST_WORKER_URL`
  mit den aktuellen Filtern auf. Der Worker crawlt gezielt und pusht das Ergebnis
  an `/api/public/ingest/run`. Der Feed aktualisiert sich danach automatisch.

## 2. Benötigte Secrets

| Name | Ort | Zweck |
| --- | --- | --- |
| `INGEST_SECRET` | EuroDeal + Worker | Shared Secret, Header `x-ingest-secret` |
| `INGEST_WORKER_URL` | EuroDeal | HTTPS-Endpunkt des Workers für Live-Suchen |
| `INGEST_WORKER_TOKEN` | EuroDeal + Worker | Bearer-Token für den Live-Aufruf |

Ohne `INGEST_WORKER_URL`/`INGEST_WORKER_TOKEN` antwortet die Live-Suche mit
`not_configured` – der Feed zeigt dann nur, was bereits per Cron eingespielt wurde.

## 3. Quellen – rechtlich sauber priorisiert

**Stufe A – offizielle APIs / Feeds (immer zuerst):**

| Portal | Land | Zugang |
| --- | --- | --- |
| Kleinanzeigen.de (ehem. eBay Kleinanzeigen) | DE | Partner-/Händler-Feed, kein offener Zugang – Vertrag nötig |
| mobile.de | DE/AT | Offizielle Seller-API (API-Key beim Portal beantragen) |
| AutoScout24 | DE/AT/IT/NL/BE | Partner-API |
| ImmoScout24 | DE/AT | Partner-API (IS24 Web-API) |
| Immowelt / Immonet | DE | Partner-Schnittstelle |
| Willhaben | AT | Partner-Feed |
| Subito.it, Idealista, Leboncoin, Marktplaats, Blocket, OLX (PL/RO/BG/PT), Merrjep/Gjirafa (AL/XK) | EU | jeweils Partner-/Affiliate-API |

**Stufe B – öffentliche Sitemaps & strukturierte Daten:** viele Portale liefern
`schema.org/Product`- bzw. `Offer`-JSON-LD in der HTML-Seite. Das ist die
zuverlässigste Quelle für Titel, Preis, Ort **und Originalbilder**.

**Stufe C – HTML-Parsing:** nur wenn `robots.txt` es erlaubt und die AGB nicht
widersprechen. Sonst Quelle in der DB auf `enabled = false` lassen.

> Wichtig: Bilder immer als **Original-URL** der Quelle übernehmen
> (`images: ["https://…"]`). Keine Platzhalter, keine Stock-Bilder – sonst
> passen Bild und Anzeige nicht zusammen.

## 4. Blockaden vermeiden

- `robots.txt` respektieren, Crawl-Delay einhalten (1 Request / 2–5 s pro Host).
- Residential-/Rotating-Proxy-Pool, ein Exit-Node pro Domain und Session.
- Echter Browser (Playwright, `headless=new`), realistische Viewports,
  `Accept-Language` passend zum Land.
- Exponentielles Backoff bei 403/429 – die App macht dasselbe serverseitig und
  meldet Health-Status im Monitoring (`/monitoring`).
- Nie parallel dieselbe Domain hämmern; Queue pro Host.
- Kein Login-Bypass, keine Captcha-Umgehung, keine Paywall-Inhalte.

## 5. Payload-Kontrakt

```http
POST https://<deine-app>/api/public/ingest/run
x-ingest-secret: <INGEST_SECRET>
Content-Type: application/json
```

```json
{
  "source_slug": "kleinanzeigen-de",
  "run_id": "2026-08-06T08:00Z",
  "status": "ok",
  "listings": [
    {
      "external_id": "3021994711",
      "url": "https://www.kleinanzeigen.de/s-anzeige/…",
      "category": "cars",
      "title": "VW Golf VI 1.6 TDI",
      "description": "…",
      "price_eur": 4200,
      "currency": "EUR",
      "country_code": "DE",
      "city_name": "Berlin",
      "postal_code": "10115",
      "lat": 52.52,
      "lng": 13.405,
      "images": ["https://img.kleinanzeigen.de/api/v1/prod-ads/images/…"],
      "attributes": { "km": 120000, "year": 2012, "fuel": "diesel" },
      "source_lang": "de",
      "posted_at": "2026-08-06T07:41:00Z"
    }
  ]
}
```

`status`: `ok` | `degraded` | `blocked` | `down`. Alles außer `ok` erhöht den
Fail-Count, setzt Backoff (5 Min → max. 6 h) und aktiviert ab 3 Fehlversuchen die
hinterlegte `fallback_slug`-Quelle.

Nach jedem Lauf zusätzlich:

```http
POST /api/public/ingest/recompute-stats
x-ingest-secret: <INGEST_SECRET>
```

Damit werden Median/IQR und die Preis-Bänder neu berechnet.

## 6. Live-Such-Endpunkt im Worker

EuroDeal ruft `INGEST_WORKER_URL` so auf:

```json
{
  "type": "live-search",
  "requestedAt": "2026-08-06T08:12:00Z",
  "filters": {
    "q": "golf tdi",
    "category": "cars",
    "country": "DE",
    "regionId": "",
    "cityId": "",
    "radius": 50,
    "sourceIds": [],
    "priceMin": "",
    "priceMax": ""
  }
}
```

Header: `Authorization: Bearer <INGEST_WORKER_TOKEN>`.
Antwort: `202 { "jobId": "…" }`, Timeout 12 s. Die eigentliche Arbeit läuft
asynchron; Ergebnisse kommen per `/api/public/ingest/run` zurück.

## 7. Frische & Deaktivierung

- Bei jedem Lauf `last_seen_at` aktualisieren (macht der Endpunkt automatisch).
- Anzeigen, die eine Quelle über mehrere Läufe nicht mehr liefert, per
  Worker-Meldung als `status: "degraded"` markieren bzw. die App setzt sie über
  die Bereinigung inaktiv. Gespeicherte Anzeigen der Nutzer bleiben dank
  Offline-Snapshot sichtbar.

## 8. DSGVO

- Keine personenbezogenen Daten (Verkäufername, Telefonnummer, E-Mail) speichern.
- Nur Titel, Beschreibung, Preis, Ort (Stadt-Ebene), Bilder-URL, Original-Link.
- Original-Link immer prominent anzeigen – die App ist ein Verweis-Aggregator.
- Löschanfragen: Anzeige über `source_id` + `external_id` auf `active = false`.
