/**
 * Zugriff auf die öffentlichen Supabase-Umgebungsvariablen.
 * Wichtig: `process.env.NEXT_PUBLIC_*` muss wörtlich im Code stehen,
 * damit Next.js die Werte ins Client-Bundle einsetzen kann.
 */

export function supabaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL ist nicht gesetzt. Siehe .env.example.",
    );
  }
  return url;
}

export function supabaseAnonKey(): string {
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!key) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY oder NEXT_PUBLIC_SUPABASE_ANON_KEY ist nicht gesetzt. Siehe .env.example.",
    );
  }
  return key;
}
