import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { projektLoeschen } from "../actions";
import { NeuesProjektForm } from "./neues-projekt-form";

export const metadata = { title: "Projekte – Vsoft" };

const statusLabels: Record<string, string> = {
  draft: "Entwurf",
  active: "Aktiv",
  completed: "Abgeschlossen",
  archived: "Archiviert",
};

export default async function ProjektePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: projekte, error } = await supabase
    .from("projects")
    .select("id, name, status, created_at, customers(name), rooms(id)")
    .order("created_at", { ascending: false });

  return (
    <main className="mx-auto max-w-4xl px-5 py-8">
      <div className="mb-6 flex items-center justify-between gap-4">
        <h1 className="text-xl font-semibold tracking-tight">Projekte</h1>
      </div>

      <NeuesProjektForm />

      {error && (
        <p className="mt-6 rounded-md bg-red-500/10 px-3 py-2 text-sm text-red-700 dark:text-red-400">
          Projekte konnten nicht geladen werden: {error.message}
        </p>
      )}

      {projekte && projekte.length === 0 && (
        <p className="mt-10 text-center text-sm opacity-60">
          Noch keine Projekte – oben das erste anlegen.
        </p>
      )}

      <ul className="mt-6 grid gap-3 sm:grid-cols-2">
        {(projekte ?? []).map((p) => (
          <li
            key={p.id}
            className="group relative rounded-lg border border-foreground/10 bg-background p-4 transition-colors hover:border-foreground/25"
          >
            <Link href={`/projekte/${p.id}`} className="absolute inset-0" />
            <div className="mb-1 flex items-start justify-between gap-2">
              <h2 className="font-medium">{p.name}</h2>
              <span className="rounded-full bg-foreground/5 px-2 py-0.5 text-xs">
                {statusLabels[p.status] ?? p.status}
              </span>
            </div>
            <p className="text-sm opacity-60">
              {p.customers?.name ?? "Ohne Kunde"} ·{" "}
              {p.rooms.length === 1 ? "1 Raum" : `${p.rooms.length} Räume`}
            </p>
            <form action={projektLoeschen} className="relative mt-3">
              <input type="hidden" name="id" value={p.id} />
              <button
                type="submit"
                className="text-xs text-red-700 opacity-0 transition-opacity hover:underline group-hover:opacity-70 dark:text-red-400"
              >
                Projekt löschen
              </button>
            </form>
          </li>
        ))}
      </ul>
    </main>
  );
}
