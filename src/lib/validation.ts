import { z } from "zod";

/**
 * Zod-Schemas für alle JSONB-Spalten des Datenmodells.
 * Längen sind grundsätzlich in Millimetern (mm), Preise in Cent.
 */

// ---------------------------------------------------------------------------
// Katalog: Abmessungen
// ---------------------------------------------------------------------------

export const tileShapeSchema = z.enum(["rectangle", "hexagon", "custom"]);

/** Abmessungen einer Fliese (Draufsicht: width × length, Stärke optional). */
export const tileDimensionsSchema = z.object({
  widthMm: z.number().positive(),
  lengthMm: z.number().positive(),
  thicknessMm: z.number().positive().optional(),
  shape: tileShapeSchema.default("rectangle"),
});

/** Umschließende Box eines Sanitärobjekts (Breite × Tiefe × Höhe). */
export const sanitaryDimensionsSchema = z.object({
  widthMm: z.number().positive(),
  depthMm: z.number().positive(),
  heightMm: z.number().positive(),
});

export const catalogDimensionsSchema = z.union([
  tileDimensionsSchema,
  sanitaryDimensionsSchema,
]);

export type TileShape = z.infer<typeof tileShapeSchema>;
export type TileDimensions = z.infer<typeof tileDimensionsSchema>;
export type SanitaryDimensions = z.infer<typeof sanitaryDimensionsSchema>;
export type CatalogDimensions = z.infer<typeof catalogDimensionsSchema>;

// ---------------------------------------------------------------------------
// Material-Konfiguration (Fallback-Optik für Flächen ohne Fliesen-Placement)
// ---------------------------------------------------------------------------

export const materialConfigSchema = z.object({
  /** Farbe als Hex-Wert, z. B. "#e7e0d8" */
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  /** Optionale Textur (Supabase-Storage-URL) */
  textureUrl: z.url().optional(),
});

export type MaterialConfig = z.infer<typeof materialConfigSchema>;

// ---------------------------------------------------------------------------
// Platzierung: Position im Raum
// ---------------------------------------------------------------------------

/**
 * Position in mm.
 * - Fliesen-Placement: x/y = Versatz des Verlegemuster-Ursprungs auf der
 *   Fläche, z bleibt 0.
 * - Sanitär-Placement: x/y = Grundriss-Koordinaten, z = Höhe über Boden
 *   (z. B. für Hängeobjekte).
 */
export const positionMmSchema = z.object({
  x: z.number(),
  y: z.number(),
  z: z.number().default(0),
});

export type PositionMm = z.infer<typeof positionMmSchema>;
