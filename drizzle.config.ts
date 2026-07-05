import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

// Next.js nutzt .env.local, drizzle-kit läuft außerhalb von Next –
// deshalb beide Dateien laden (erste gefundene Variable gewinnt).
config({ path: [".env.local", ".env"] });

export default defineConfig({
  schema: "./src/lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "",
  },
  // Rollen wie `authenticated` verwaltet Supabase – nicht von drizzle-kit
  // anlegen/löschen lassen.
  entities: {
    roles: {
      provider: "supabase",
    },
  },
  strict: true,
  verbose: true,
});
