# EuroDeal

Aggregator für Immobilien, Wohnungen, Autos und Motorräder aus ganz Europa mit
Preis-Intelligenz (Median/IQR-Bewertung), Mehrsprachigkeit (DE/EN/SQ), PWA-Offline-Modus
und Push-Benachrichtigungen für gespeicherte Suchen.

## Stack

- TanStack Start (React 19, Vite 7), SSR/Multipage
- Tailwind CSS v4 mit semantischen Design-Tokens
- PostgreSQL + Auth + Realtime (Lovable Cloud / Supabase)
- `vite-plugin-pwa` (Workbox) für Installierbarkeit und Offline-Cache

## Lokal starten

```bash
npm install
npm run dev
```

## Environment-Variablen

Client (Build-Zeit):

```
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
VITE_SUPABASE_PROJECT_ID=
```

Server (Runtime):

```
SUPABASE_URL=
SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SERVICE_ROLE_KEY=
LOVABLE_API_KEY=        # Auto-Übersetzung der Anzeigen
INGEST_SECRET=          # Shared Secret für den externen Ingest-Worker
```

## Deployment auf Vercel

1. Repository auf GitHub pushen.
2. In Vercel importieren – `vercel.json` setzt Build-Command und Output-Verzeichnis.
3. Alle Variablen oben unter *Project Settings → Environment Variables* hinterlegen.
4. Deploy. Der Service Worker registriert sich ausschließlich in Produktion.

## Ingest-Schnittstelle

Externe Scraper/Worker liefern Anzeigen an:

```
POST /api/public/ingest/run
x-ingest-secret: <INGEST_SECRET>

{
  "source_slug": "kleinanzeigen-de",
  "status": "ok",
  "listings": [
    {
      "external_id": "123",
      "url": "https://…",
      "category": "cars",
      "title": "…",
      "price_eur": 4200,
      "country_code": "DE",
      "city_name": "Berlin",
      "images": ["https://…"],
      "attributes": { "km": 120000, "year": 2012 },
      "source_lang": "de"
    }
  ]
}
```

Status, Fehlerzähler und Ereignisse laufen ins Monitoring-Dashboard unter `/monitoring`.
