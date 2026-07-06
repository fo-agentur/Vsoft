import { notFound, redirect } from "next/navigation";
import { RoomEditorScreen } from "@/components/editor/RoomEditorScreen";
import { geometryFromRows } from "@/lib/data/rooms";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Aufmaß – Vsoft" };

export default async function RaumEditorPage({
  params,
}: {
  params: Promise<{ projektId: string; raumId: string }>;
}) {
  const { projektId, raumId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: raum } = await supabase
    .from("rooms")
    .select("id, name, ceiling_height_mm, project_id, projects(name)")
    .eq("id", raumId)
    .maybeSingle();

  if (!raum || raum.project_id !== projektId) notFound();

  const { data: walls } = await supabase
    .from("walls")
    .select("*")
    .eq("room_id", raumId)
    .order("order_index", { ascending: true });

  const wallIds = (walls ?? []).map((w) => w.id);
  const { data: openings } =
    wallIds.length > 0
      ? await supabase.from("openings").select("*").in("wall_id", wallIds)
      : { data: [] };

  const geometry = geometryFromRows(walls ?? [], openings ?? []);

  return (
    <RoomEditorScreen
      modus={{
        art: "db",
        roomId: raum.id,
        zurueckHref: `/projekte/${projektId}`,
      }}
      initialName={raum.name}
      initialCeilingHeightMm={raum.ceiling_height_mm}
      initialGeometry={geometry}
      untertitel={raum.projects?.name}
    />
  );
}
