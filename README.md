# Vsoft

Eigenständiges Raumaufmaß- und Fliesenplanungs-Tool für Fliesenleger-Betriebe:
Aufmaß erfassen, Grundriss in 2D bearbeiten, Raum in 3D visualisieren, Fliesen
und Sanitärobjekte aus dem eigenen Katalog platzieren und daraus Stückliste
und PDF-Angebot erzeugen.

Der Funktionsumfang ist von marktüblichen Planungs-Tools *inspiriert* – Code,
Design und Assets sind vollständig eigenständig.

## Tech-Stack

- **Frontend:** Next.js 15 (App Router, Turbopack), React 19, Tailwind CSS 4
- **3D (ab Schritt 4):** React Three Fiber + three.js
- **Backend:** Supabase (Postgres, Auth, Storage)
- **ORM/Migrationen:** Drizzle ORM + drizzle-kit
- **Validierung:** Zod (JSONB-Spalten, Formulare)

## Setup

1. **Abhängigkeiten installieren**

   ```bash
   npm install
   ```

2. **Supabase-Projekt anlegen** (<https://supabase.com/dashboard>) und
   Umgebungsvariablen setzen:

   ```bash
   cp .env.example .env.local
   # Werte aus dem Supabase-Dashboard eintragen
   ```

3. **Datenbank migrieren**

   ```bash
   npm run db:migrate
   ```

4. **Dev-Server starten**

   ```bash
   npm run dev
   ```

## Scripts

| Script | Zweck |
| --- | --- |
| `npm run dev` | Dev-Server (Turbopack) |
| `npm run build` / `start` | Produktions-Build / -Server |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript ohne Emit |
| `npm run db:generate` | Migration aus Schema-Änderungen erzeugen |
| `npm run db:migrate` | Migrationen auf die DB anwenden |
| `npm run db:push` | Schema direkt pushen (nur lokale Entwicklung) |
| `npm run db:studio` | Drizzle Studio (DB-Browser) |

## Projektstruktur

```
src/
  app/                    App Router (Seiten, Layout)
  lib/
    db/
      schema.ts           Drizzle-Schema: alle Tabellen, Enums, RLS-Policies
      index.ts            Server-seitiger DB-Client (lazy, gepoolt)
    supabase/             Supabase-Clients (Browser/Server) + Env-Helper
    validation.ts         Zod-Schemas für JSONB-Strukturen
drizzle/                  Generierte SQL-Migrationen
docs/
  datenmodell.md          Entitäten, Konventionen, RLS-Konzept
  ux-flow-referenz.md     Recherchierter Referenz-Ablauf + eigenes Screen-Konzept
```

## Roadmap

- [x] **1. Projekt-Setup** – Next.js 15, Supabase, Drizzle, Tailwind
- [x] **2. Datenmodell** – Project, Room, Wall, Opening, CatalogItem,
      Placement (+ Customer), RLS-Policies, initiale Migration
- [ ] **3. 2D-Grundriss-Editor** – Wände zeichnen/verschieben, Türen/Fenster,
      Live-Bemaßung
- [ ] **4. 3D-Ansicht** – Grundriss als Three.js-Szene, Orbit-Kamera,
      Material-Zuweisung
- [ ] **5. Katalog-Verwaltung** – CRUD für Fliesen/Sanitär inkl. Uploads
- [ ] **6. Platzierung** – Drag & Drop, Verlegemuster, Fugen
- [ ] **7. Stückliste + PDF-Angebot**
- [ ] **8. (Stretch) AR-Vorschau**

Details zum Datenmodell: [`docs/datenmodell.md`](docs/datenmodell.md) ·
UX-Referenz: [`docs/ux-flow-referenz.md`](docs/ux-flow-referenz.md)
