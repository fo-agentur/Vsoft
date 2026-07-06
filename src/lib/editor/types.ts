/** Editor-Datentypen. Alle Koordinaten/Längen in Millimetern, y nach unten. */

export type OpeningType = "door" | "window" | "niche";

export interface Pt {
  x: number;
  y: number;
}

export interface EditorWall {
  id: string;
  sx: number;
  sy: number;
  ex: number;
  ey: number;
  thicknessMm: number;
  /** null → Raumhöhe gilt */
  heightMm: number | null;
}

export interface EditorOpening {
  id: string;
  wallId: string;
  type: OpeningType;
  /** Abstand Wandanfang → Anfangskante der Öffnung (entlang der Wand) */
  offsetMm: number;
  widthMm: number;
  heightMm: number;
  /** Unterkante über Boden (Tür 0, Fenster/Nische Brüstungshöhe) */
  bottomMm: number;
}

export interface RoomGeometry {
  /** Geordneter, geschlossener Wandzug: walls[i].end == walls[i+1].start */
  walls: EditorWall[];
  openings: EditorOpening[];
}

export type Selection =
  | { kind: "wall"; id: string }
  | { kind: "vertex"; index: number }
  | { kind: "opening"; id: string }
  | null;

export const OPENING_DEFAULTS: Record<
  OpeningType,
  { widthMm: number; heightMm: number; bottomMm: number; label: string }
> = {
  door: { widthMm: 900, heightMm: 2050, bottomMm: 0, label: "Tür" },
  window: { widthMm: 1200, heightMm: 1300, bottomMm: 900, label: "Fenster" },
  niche: { widthMm: 600, heightMm: 900, bottomMm: 900, label: "Nische" },
};

export const DEFAULT_WALL_THICKNESS_MM = 115;
export const GRID_MM = 10;
