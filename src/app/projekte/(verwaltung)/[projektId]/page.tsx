import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { raumLoeschen } from "../../actions";
import { NeuerRaumForm } from "./neuer-raum-form";

export const metadata = { title: "Projekt – Vsoft" };

export default async function ProjektDetailPage({
  params,
}: {
  params: Promise<{ projektId: string }>;
}) {
  const { projektId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: projekt } = await supabase
    .from("projects")
    .select("id, name, description, customers(name)")
    .eq("id", projektId)
    .maybeSingle();

  if (!projekt) notFound();

  const { data: raeume } = await supabase
    .from("rooms")
    .select("id, name, ceiling_height_mm, walls(id)")
    .eq("project_id", projektId)
    .order("created_at", { ascending: true });

  return (
    <main className="mx-auto max-w-4xl px-5 py-8">
      <div className="mb-1 text-sm">
        <Link href="/projekte" className="opacity-60 hover:opacity-100">
          ← Alle Projekte
        </Link>
      </div>
      <h1 className="text-xl font-semibold tracking-tight">{projekt.name}</h1>
      <p className="mb-6 mt-1 text-sm opacity-60">
        {projekt.customers?.name ?? "Ohne Kunde"}
      </p>

      <h2 className="mb-3 text-sm font-medium uppercase tracking-wider opacity-50">
        Räume
      </h2>

      <NeuerRaumForm projektId={projektId} />

      {(raeume ?? []).length === 0 && (
        <p className="mt-8 text-center text-sm opacity-60">
          Noch keine Räume – oben den ersten anlegen (Raumform wählen, Maße
          eintragen, fertig).
        </p>
      )}

      <ul className="mt-6 grid gap-3 sm:grid-cols-2">
        {(raeume ?? []).map((r) => (
          <li
            key={r.id}
            className="group relative rounded-lg border border-foreground/10 bg-background p-4 transition-colors hover:border-foreground/25"
          >
            <Link
              href={`/projekte/${projektId}/raum/${r.id}`}
              className="absolute inset-0"
            />
            <h3 className="font-medium">{r.name}</h3>
            <p className="text-sm opacity-60">
              {r.walls.length === 0
                ? "Noch kein Grundriss"
                : `${r.walls.length} Wände`}{" "}
              · Raumhöhe {(r.ceiling_height_mm / 10).toLocaleString("de-AT")}{" "}
              cm
            </p>
            <form action={raumLoeschen} className="relative mt-3">
              <input type="hidden" name="raumId" value={r.id} />
              <input type="hidden" name="projektId" value={projektId} />
              <button
                type="submit"
                className="text-xs text-red-700 opacity-0 transition-opacity hover:underline group-hover:opacity-70 dark:text-red-400"
              >
                Raum löschen
              </button>
            </form>
          </li>
        ))}
      </ul>
    </main>
  );
}
