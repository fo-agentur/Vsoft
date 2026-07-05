import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

/**
 * Server-seitiger Drizzle-Client (nur in Server Components, Server Actions
 * und Route Handlers verwenden – nie im Client-Bundle).
 *
 * Wird lazy initialisiert, damit Builds ohne gesetzte DATABASE_URL
 * funktionieren. In der Entwicklung wird die Verbindung auf `globalThis`
 * gecacht, damit Hot Reload keine Verbindungen anhäuft.
 */

function createDb() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL ist nicht gesetzt. Siehe .env.example für die Supabase-Verbindung.",
    );
  }
  // prepare: false → kompatibel mit dem Supabase-Transaction-Pooler (Port 6543).
  const client = postgres(url, { prepare: false });
  return drizzle(client, { schema });
}

export type Db = ReturnType<typeof createDb>;

const globalForDb = globalThis as unknown as { __vsoftDb?: Db };

export function getDb(): Db {
  return (globalForDb.__vsoftDb ??= createDb());
}

export { schema };
