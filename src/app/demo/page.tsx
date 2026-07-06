import { RoomEditorScreen } from "@/components/editor/RoomEditorScreen";
import { neueId, wallsFromPolygon } from "@/lib/editor/geometry";
import type { RoomGeometry } from "@/lib/editor/types";

export const metadata = { title: "Editor-Demo – Vsoft" };

/** Öffentliche Demo des 2D-Editors mit Beispielraum, ohne Anmeldung/DB. */
export default function DemoPage() {
  const walls = wallsFromPolygon([
    { x: 0, y: 0 },
    { x: 3600, y: 0 },
    { x: 3600, y: 1900 },
    { x: 2400, y: 1900 },
    { x: 2400, y: 2800 },
    { x: 0, y: 2800 },
  ]);

  const geometry: RoomGeometry = {
    walls,
    openings: [
      {
        id: neueId(),
        wallId: walls[5].id,
        type: "door",
        offsetMm: 1000,
        widthMm: 900,
        heightMm: 2050,
        bottomMm: 0,
      },
      {
        id: neueId(),
        wallId: walls[0].id,
        type: "window",
        offsetMm: 1200,
        widthMm: 1200,
        heightMm: 1300,
        bottomMm: 900,
      },
    ],
  };

  return (
    <RoomEditorScreen
      modus={{ art: "demo" }}
      initialName="Beispielbad"
      initialCeilingHeightMm={2500}
      initialGeometry={geometry}
      untertitel="Editor-Demo"
    />
  );
}
