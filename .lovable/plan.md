## Ausgangslage & ehrliche Einschätzung

Zwei Punkte vorab, weil sie den ganzen Plan prägen:

1. **Massen-Scraping mit Proxy-/IP-Rotation ist auf dieser Plattform nicht umsetzbar** und rechtlich in der EU heikel (AGB-Verstoß, Datenbank-Schutzrecht §87b UrhG / Richtlinie 96/9/EG, DSGVO bei privaten Inseraten). Puppeteer/Selenium mit Proxy-Pools brauchen einen eigenen Server — die App läuft in einer Edge-Runtime ohne Browser-Binaries.
2. Der **rechtssichere und technisch stabile Weg** ist eine Hybrid-Strategie: offizielle APIs/Feeds wo vorhanden, respektvolles serverseitiges Abrufen (robots.txt, Rate-Limits, Attribution, Deep-Link zur Quelle) wo erlaubt — plus ein austauschbarer Konnektor-Layer, an den du später einen externen Scraping-Worker hängen kannst.

Der Plan baut die komplette App inkl. Preis-Intelligenz, aber mit dieser Datenschicht.

## 1. Feature-Liste mit Priorisierung

**MVP (Phase 1)**
- Haupt-Feed: Freitextsuche, Kategorien (Immobilien, Wohnungen, Fahrzeuge, Motorräder)
- Geo-Filter: Land (EU + Balkan) → Stadt-Dropdown → optionaler Radius
- Quellen-Filter (alle vorausgewählt), Sortierung (Preis aufsteigend = Default, Relevanz, Aktualität, Preis-Score)
- Ergebnis-Cards mit Bild, Preis, Preis-Score-Badge, Key-Facts
- Detailseite als eigene Route: Galerie, alle Daten, „Zur Original-Anzeige", „Teilen", „Speichern"
- Favoriten + eigene Gespeichert-Seite
- i18n DE/EN/SQ mit Geräteerkennung + manueller Umschaltung
- Persistente Settings (Sprache, Filter, Quellen, Sortierung)
- Footer: Info, Support-Formular, Impressum, Bewertungen (5 Sterne, öffentlich), Freunde einladen, Copyright
- Zurück-Button auf jeder Seite + Hardware-Back-Handling
- Responsive, modernes UI

**Phase 2**
- Preis-Intelligenz v2 (Regressionsmodell statt Median-Bänder)
- Push-Benachrichtigungen für gespeicherte Suchen
- PWA mit Offline-Fallback
- Nutzer-Accounts (Favoriten geräteübergreifend)

**Phase 3**
- Weitere Quellen-Konnektoren, Monitoring/Alerting, Preisverlauf pro Inserat, Duplikat-Erkennung über Quellen hinweg

## 2. Technologie-Stack

| Schicht | Technologie | Begründung |
|---|---|---|
| Frontend | TanStack Start (React 19, Vite 7) | echtes Multi-Page-Routing mit SSR — genau die geforderte Nicht-SPA-Struktur, gut für SEO/Sharing |
| Styling | Tailwind v4 + Design-Tokens | konsistentes, modernes UI ohne Ad-hoc-Styles |
| Backend | Server Functions + Server Routes (gleiche Codebase) | kein separater Dienst nötig, typsicher |
| DB | PostgreSQL (Lovable Cloud) | relationale Preisstatistiken, GIN-Index für Volltext, PostGIS-artige Radiussuche via lat/lng |
| Auth | Lovable Cloud Auth | für Favoriten/Bewertungen |
| Jobs | pg_cron → `/api/public/ingest/*` | periodische Datenaktualisierung |
| i18n | eigener leichter i18n-Provider (DE/EN/SQ) | keine schwere Abhängigkeit, alle Strings in JSON-Katalogen |
| Push | Web Push (VAPID) über Service Worker | keine Firebase-Abhängigkeit nötig |
| PWA | vite-plugin-pwa (generateSW), Preview-Guards | installierbar + Offline-Fallback |

## 3. Datenmodell

```text
countries (code, name_de/en/sq)
cities (id, country_code→countries, name, lat, lng, population)

sources (id, slug, name, country_code, categories[], base_url,
         legal_mode: 'api'|'feed'|'manual', enabled, last_run_at, health)

listings (id, source_id→sources, external_id, url, category,
          title, description, price, currency, price_eur,
          country_code, city_id→cities, lat, lng,
          images jsonb, attributes jsonb,   -- km, baujahr, m2, zimmer, ccm...
          posted_at, fetched_at, active,
          price_score numeric, price_band: 'great'|'good'|'fair'|'high',
          UNIQUE(source_id, external_id))

price_stats (id, category, segment_key, country_code,
             n, median_eur, p25, p75, mad, updated_at)

favorites (id, user_id, listing_id, created_at, UNIQUE(user_id, listing_id))
user_settings (user_id PK, language, filters jsonb, sources uuid[], sort)
saved_searches (id, user_id, query jsonb, notify bool, last_notified_at)
push_subscriptions (id, user_id, endpoint, keys jsonb)
reviews (id, user_id, rating 1-5, body, created_at, published)
support_messages (id, name, email, message, created_at, handled)
```

RLS: `listings`, `cities`, `countries`, `sources`, veröffentlichte `reviews` → `anon` SELECT. `favorites`, `user_settings`, `saved_searches`, `push_subscriptions` → nur `auth.uid()`. `support_messages` → INSERT für alle, SELECT nur Admin (Rolle in separater `user_roles`-Tabelle, nie im Profil).

## 4. API-Endpoints

Server Functions (App-intern): `searchListings`, `getListing`, `listCities`, `listSources`, `toggleFavorite`, `listFavorites`, `getSettings`/`saveSettings`, `listReviews`/`createReview`, `submitSupport`, `saveSearch`, `subscribePush`.

Server Routes (extern): `POST /api/public/ingest/run` (Cron, HMAC-signiert), `POST /api/public/ingest/recompute-stats`, `GET /api/public/health`.

## 5. Daten-/Quellenstrategie

**Kategorie-Quellen (konkret, gestaffelt nach Zulässigkeit):**
- *Immobilien:* Immobilienscout24 & Immowelt (DE, Partner-API), Idealista (ES/IT/PT, offizielle API), SeLoger/Leboncoin (FR), Funda (NL), Otodom/OLX (PL), Imot.bg (BG), Njuskalo/Index Oglasi (HR), HalloOglasi/Nekretnine.rs (RS), Merrjep & Gjirafa50 (AL/XK), Bazaraki (CY)
- *Fahrzeuge/Motorräder:* Mobile.de (Partner-API), AutoScout24 (Partner-API), Autovit (PL/RO), Polovni Automobili (RS), Njuskalo (HR), Mobile.bg (BG), Merrjep (AL/XK)

**Vorgehen pro Quelle:** zuerst offizielle Partner-/Affiliate-API oder RSS/Sitemap-Feed. Nur wo die Nutzungsbedingungen es zulassen, HTTP-Abruf mit: `robots.txt`-Prüfung, 1 Request / 2–5 s pro Domain, Backoff bei 429/503, ehrlicher User-Agent mit Kontakt-URL, nur Metadaten + Deep-Link (keine Volltext-Kopie, Bilder als Hotlink/Thumbnail).

**Ausfallsicherheit statt IP-Rotation:** `sources.health` + Fehlerzähler; nach 3 Fehlläufen Quelle automatisch deaktivieren und im Quellen-Filter als „vorübergehend nicht verfügbar" ausweisen; Feed weiter aus Cache. Wenn du später bewusst Proxy-Rotation willst, gehört das in einen externen Worker, der die gleiche `/api/public/ingest`-Schnittstelle bedient — die App bleibt unverändert.

**Frequenz:** Fahrzeuge alle 30 min, Immobilien alle 60 min, Inaktiv-Prüfung täglich, Statistik-Neuberechnung stündlich.

## 6. Preisanalyse-Logik (nachvollziehbar, kein „AI-Zauber")

1. **Segmentierung:** `segment_key` = Kategorie + Land + normalisiertes Merkmalsbündel.
   - Autos/Motorräder: Marke + Modell + Baujahr-Bucket (±2 J.) + km-Bucket (25k) + Kraftstoff
   - Immobilien: Typ + Stadt + Zimmer-Bucket + m²-Bucket (20 m²)
2. **Robuste Statistik:** pro Segment Median, P25, P75 und MAD (Median Absolute Deviation) über aktive Inserate der letzten 90 Tage, nur bei n ≥ 20 (sonst Fallback auf gröberes Segment: Land → Region → EU).
3. **Score:** `z = (preis − median) / (1.4826 × MAD)` — MAD statt Standardabweichung, weil Ausreißer den Schnitt sonst verzerren.
4. **Bänder:** z ≤ −1.0 „Sehr günstig" · −1.0 < z ≤ −0.25 „Guter Preis" · −0.25 < z ≤ 0.75 „Marktpreis" · z > 0.75 „Überteuert".
5. **Plausibilitätsfilter:** Preise unter 15 % des Segment-Medians werden als „Prüfen" markiert statt als Top-Deal (Lockangebote/Tippfehler).
6. Jedes Badge zeigt beim Antippen die Herleitung: „Median 18.400 € aus 63 vergleichbaren Angeboten, dieses Angebot liegt 22 % darunter."

## 7. Lokalisierung
JSON-Kataloge `de.json`, `en.json`, `sq.json`; Erkennung über `navigator.language` beim ersten Start, danach Persistenz in `user_settings`/localStorage. Länder-, Stadt- und Kategorienamen kommen übersetzt aus der DB, keine hartcodierten UI-Strings.

## 8. PWA
Manifest mit Icons, `display: standalone`, Theme-Farben; Service Worker über `vite-plugin-pwa` (`generateSW`, `registerType: autoUpdate`), NetworkFirst für Navigationen, CacheFirst nur für gehashte Assets, Offline-Fallback-Seite. Registrierung strikt nur in Produktion (nie in Preview/iframe/dev), plus `?sw=off`-Kill-Switch.

## 9. Push-Flow
Nutzer speichert Suche → aktiviert Benachrichtigung → Browser-Permission → VAPID-Subscription in `push_subscriptions`. Ingest-Job vergleicht neue Inserate gegen `saved_searches`, sendet gebündelt max. 1 Push/Stunde/Suche, Deep-Link auf die Detailseite. Abschaltbar pro Suche und global.

## 10. Sicherheit & Datenschutz
Zod-Validierung aller Eingaben, RLS auf jeder Tabelle, Rollen in separater `user_roles`-Tabelle mit `has_role()`-Security-Definer, keine Klartext-Secrets im Frontend, Support-Formular ohne Logging personenbezogener Inhalte. DSGVO: Datenschutzerklärung + Impressum (Berat Konjusha), Rechtsgrundlage berechtigtes Interesse für Inserats-Metadaten, Löschung von Inseraten binnen 24 h nach Quellen-Deaktivierung, Auskunfts-/Löschkontakt im Impressum, keine Tracking-Cookies ohne Consent.

## 11. Phasen
- **Phase 1 (MVP):** Design-System, alle Seiten & Navigation, i18n, DB + RLS, Suche/Filter/Sortierung, Detailseite, Favoriten, Footer-Bereiche, Preis-Score v1 (Median/MAD), 3–5 Konnektoren mit Seed-Daten
- **Phase 2:** PWA + Offline, Push + gespeicherte Suchen, Auth, Quellen-Health-Monitoring, weitere Konnektoren
- **Phase 3:** Preismodell v2 (Regression auf km/Alter/m²), Duplikat-Erkennung, Preisverlauf, Admin-Dashboard

## Technische Hinweise
- Routing: eigene Route-Dateien pro Seite (`/`, `/listing/$id`, `/saved`, `/settings`, `/reviews`, `/impressum`, `/support`) — echte Multi-Page-Struktur, jede mit eigenen Meta-Tags fürs Teilen.
- Hardware-Back funktioniert bei echtem History-Routing automatisch; zusätzlich sichtbarer Zurück-Button pro Seite.
- Radius-Suche über Haversine-Filter auf `lat/lng` mit vorgelagertem Bounding-Box-Index.

## Offene Frage vor Start
Für Phase 1 brauche ich eine Entscheidung: Starte ich mit **Seed-/Demo-Daten** für alle Kategorien und Länder (App komplett bedienbar, Konnektoren folgen), oder soll ich zuerst **einen realen Konnektor** (z. B. eine Quelle mit offenem Feed) anbinden und die App drumherum bauen?
