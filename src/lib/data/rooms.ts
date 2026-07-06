import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Tables } from "@/types/database";
import type { RoomGeometry } from "@/lib/editor/types";

type Client = SupabaseClient<Database>;

export interface RoomPatch {
  name: string;
  ceilingHeightMm: number;
}

/** DB-Zeilen → Editor-Geometrie. */
export function geometryFromRows(
  walls: Tables<"walls">[],
  openings: Tables<"openings">[],
): RoomGeometry {
  return {
    walls: walls.map((w) => ({
      id: w.id,
      sx: w.start_x_mm,
      sy: w.start_y_mm,
      ex: w.end_x_mm,
      ey: w.end_y_mm,
      thicknessMm: w.thickness_mm,
      heightMm: w.height_mm,
    })),
    openings: openings.map((o) => ({
      id: o.id,
      wallId: o.wall_id,
      type: o.type,
      offsetMm: o.offset_mm,
      widthMm: o.width_mm,
      heightMm: o.height_mm,
      bottomMm: o.bottom_mm,
    })),
  };
}

/**
 * Persistiert den kompletten Raumzustand (Diff gegen die bekannten
 * Ausgangs-IDs: upsert für Bestehendes/Neues, delete für Entferntes).
 * Wand-IDs bleiben dabei stabil – wichtig für spätere Placements.
 */
export async function saveRoomGeometry(
  supabase: Client,
  roomId: string,
  geometry: RoomGeometry,
  room: RoomPatch,
  bekannteWallIds: string[],
  bekannteOpeningIds: string[],
): Promise<void> {
  const wallRows = geometry.walls.map((w, i) => ({
    id: w.id,
    room_id: roomId,
    order_index: i,
    start_x_mm: Math.round(w.sx),
    start_y_mm: Math.round(w.sy),
    end_x_mm: Math.round(w.ex),
    end_y_mm: Math.round(w.ey),
    thickness_mm: Math.round(w.thicknessMm),
    height_mm: w.heightMm === null ? null : Math.round(w.heightMm),
  }));

  const openingRows = geometry.openings.map((o) => ({
    id: o.id,
    wall_id: o.wallId,
    type: o.type,
    offset_mm: Math.round(o.offsetMm),
    width_mm: Math.round(o.widthMm),
    height_mm: Math.round(o.heightMm),
    bottom_mm: Math.round(o.bottomMm),
  }));

  const aktuelleWallIds = new Set(wallRows.map((w) => w.id));
  const aktuelleOpeningIds = new Set(openingRows.map((o) => o.id));
  const wallsZuLoeschen = bekannteWallIds.filter(
    (id) => !aktuelleWallIds.has(id),
  );
  const openingsZuLoeschen = bekannteOpeningIds.filter(
    (id) => !aktuelleOpeningIds.has(id),
  );

  // Reihenfolge: erst Wände (Öffnungen referenzieren sie), dann Öffnungen,
  // dann Aufräumen, zuletzt Raum-Eigenschaften.
  if (wallRows.length > 0) {
    const { error } = await supabase.from("walls").upsert(wallRows);
    if (error) throw new Error(`Wände speichern: ${error.message}`);
  }

  if (openingsZuLoeschen.length > 0) {
    const { error } = await supabase
      .from("openings")
      .delete()
      .in("id", openingsZuLoeschen);
    if (error) throw new Error(`Öffnungen löschen: ${error.message}`);
  }

  if (openingRows.length > 0) {
    const { error } = await supabase.from("openings").upsert(openingRows);
    if (error) throw new Error(`Öffnungen speichern: ${error.message}`);
  }

  if (wallsZuLoeschen.length > 0) {
    const { error } = await supabase
      .from("walls")
      .delete()
      .in("id", wallsZuLoeschen);
    if (error) throw new Error(`Wände löschen: ${error.message}`);
  }

  const { error } = await supabase
    .from("rooms")
    .update({
      name: room.name,
      ceiling_height_mm: Math.round(room.ceilingHeightMm),
      updated_at: new Date().toISOString(),
    })
    .eq("id", roomId);
  if (error) throw new Error(`Raum speichern: ${error.message}`);
}
