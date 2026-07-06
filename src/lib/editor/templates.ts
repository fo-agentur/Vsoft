import { wallsFromPolygon } from "./geometry";
import type { EditorWall } from "./types";

/**
 * Standard-Raumformen als Startpunkt. Maße = Innenmaße in mm,
 * Ursprung oben links, y nach unten, Umlauf im Uhrzeigersinn.
 */

export type RaumVorlage = "rechteck" | "l-form" | "frei";

export const VORLAGEN_LABELS: Record<RaumVorlage, string> = {
  rechteck: "Rechteck",
  "l-form": "L-Form",
  frei: "Frei zeichnen",
};

export function rechteckWalls(
  breiteMm: number,
  tiefeMm: number,
): EditorWall[] {
  return wallsFromPolygon([
    { x: 0, y: 0 },
    { x: breiteMm, y: 0 },
    { x: breiteMm, y: tiefeMm },
    { x: 0, y: tiefeMm },
  ]);
}

/**
 * L-Form: Rechteck breite×tiefe mit rechteckigem Ausschnitt
 * (ausschnittBreite×ausschnittTiefe) in der Ecke rechts unten.
 */
export function lFormWalls(
  breiteMm: number,
  tiefeMm: number,
  ausschnittBreiteMm: number,
  ausschnittTiefeMm: number,
): EditorWall[] {
  const ab = Math.min(ausschnittBreiteMm, breiteMm - 100);
  const at = Math.min(ausschnittTiefeMm, tiefeMm - 100);
  return wallsFromPolygon([
    { x: 0, y: 0 },
    { x: breiteMm, y: 0 },
    { x: breiteMm, y: tiefeMm - at },
    { x: breiteMm - ab, y: tiefeMm - at },
    { x: breiteMm - ab, y: tiefeMm },
    { x: 0, y: tiefeMm },
  ]);
}

export function vorlageWalls(
  vorlage: RaumVorlage,
  breiteMm: number,
  tiefeMm: number,
  ausschnittBreiteMm?: number,
  ausschnittTiefeMm?: number,
): EditorWall[] {
  switch (vorlage) {
    case "rechteck":
      return rechteckWalls(breiteMm, tiefeMm);
    case "l-form":
      return lFormWalls(
        breiteMm,
        tiefeMm,
        ausschnittBreiteMm ?? Math.round(breiteMm * 0.4),
        ausschnittTiefeMm ?? Math.round(tiefeMm * 0.4),
      );
    case "frei":
      return [];
  }
}
