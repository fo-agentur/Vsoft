import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  integer,
  jsonb,
  pgEnum,
  pgPolicy,
  pgTable,
  real,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { authenticatedRole, authUsers } from "drizzle-orm/supabase";
import { relations } from "drizzle-orm";
import type {
  CatalogDimensions,
  MaterialConfig,
  PositionMm,
} from "../validation";

/**
 * Vsoft-Datenmodell (Supabase/Postgres).
 *
 * Konventionen:
 * - Alle Längen/Koordinaten in Millimetern (integer, Suffix `_mm`).
 * - Preise in Euro-Cent (integer, Suffix `_cents`).
 * - Grundriss-Koordinatensystem: x nach rechts, y nach unten (2D-Editor),
 *   Ursprung frei pro Raum. Wände sind gerichtete Strecken (start → end).
 * - RLS: Jede Tabelle gehört (direkt oder über den Projekt-/Raum-Pfad) einem
 *   Besitzer (`auth.users`). Policies erlauben dem Besitzer alles, anderen
 *   nichts. Server-seitiger Zugriff über Drizzle (Tabellen-Owner) umgeht RLS
 *   und muss selbst autorisieren.
 */

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

export const projectStatusEnum = pgEnum("project_status", [
  "draft",
  "active",
  "completed",
  "archived",
]);

export const openingTypeEnum = pgEnum("opening_type", [
  "door",
  "window",
  "niche",
]);

export const catalogItemTypeEnum = pgEnum("catalog_item_type", [
  "tile",
  "sanitary",
]);

export const priceUnitEnum = pgEnum("price_unit", ["per_sqm", "per_piece"]);

export const surfaceTypeEnum = pgEnum("surface_type", [
  "floor",
  "ceiling",
  "wall",
]);

export const tilePatternEnum = pgEnum("tile_pattern", [
  "grid", // gerader Verband
  "running_bond", // versetzt / Halbverband (Versatz konfigurierbar)
  "herringbone", // Fischgrät
]);

// ---------------------------------------------------------------------------
// Kunden
// ---------------------------------------------------------------------------

export const customers = pgTable(
  "customers",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    ownerId: uuid("owner_id")
      .notNull()
      .references(() => authUsers.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    email: text("email"),
    phone: text("phone"),
    address: text("address"),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    index("customers_owner_id_idx").on(t.ownerId),
    pgPolicy("customers_owner_all", {
      for: "all",
      to: authenticatedRole,
      using: sql`${t.ownerId} = (select auth.uid())`,
      withCheck: sql`${t.ownerId} = (select auth.uid())`,
    }),
  ],
);

// ---------------------------------------------------------------------------
// Projekte
// ---------------------------------------------------------------------------

export const projects = pgTable(
  "projects",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    ownerId: uuid("owner_id")
      .notNull()
      .references(() => authUsers.id, { onDelete: "cascade" }),
    customerId: uuid("customer_id").references(() => customers.id, {
      onDelete: "set null",
    }),
    name: text("name").notNull(),
    description: text("description"),
    status: projectStatusEnum("status").notNull().default("draft"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    index("projects_owner_id_idx").on(t.ownerId),
    index("projects_customer_id_idx").on(t.customerId),
    pgPolicy("projects_owner_all", {
      for: "all",
      to: authenticatedRole,
      using: sql`${t.ownerId} = (select auth.uid())`,
      withCheck: sql`${t.ownerId} = (select auth.uid())`,
    }),
  ],
);

// ---------------------------------------------------------------------------
// Räume
// ---------------------------------------------------------------------------

export const rooms = pgTable(
  "rooms",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    /** Standard-Raumhöhe; einzelne Wände können abweichen (walls.height_mm). */
    ceilingHeightMm: integer("ceiling_height_mm").notNull().default(2500),
    /** Fallback-Optik für Flächen ohne Fliesen-Placement. */
    floorMaterial: jsonb("floor_material").$type<MaterialConfig>(),
    ceilingMaterial: jsonb("ceiling_material").$type<MaterialConfig>(),
    wallMaterial: jsonb("wall_material").$type<MaterialConfig>(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    index("rooms_project_id_idx").on(t.projectId),
    pgPolicy("rooms_owner_all", {
      for: "all",
      to: authenticatedRole,
      using: sql`exists (select 1 from ${projects} where ${projects.id} = ${t.projectId} and ${projects.ownerId} = (select auth.uid()))`,
      withCheck: sql`exists (select 1 from ${projects} where ${projects.id} = ${t.projectId} and ${projects.ownerId} = (select auth.uid()))`,
    }),
  ],
);

// ---------------------------------------------------------------------------
// Wände
// ---------------------------------------------------------------------------

export const walls = pgTable(
  "walls",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    roomId: uuid("room_id")
      .notNull()
      .references(() => rooms.id, { onDelete: "cascade" }),
    /** Reihenfolge im Grundriss-Polygon (für geschlossene Raumumrisse). */
    orderIndex: integer("order_index").notNull().default(0),
    startXMm: integer("start_x_mm").notNull(),
    startYMm: integer("start_y_mm").notNull(),
    endXMm: integer("end_x_mm").notNull(),
    endYMm: integer("end_y_mm").notNull(),
    /** null = Raumhöhe (rooms.ceiling_height_mm) gilt. */
    heightMm: integer("height_mm"),
    thicknessMm: integer("thickness_mm").notNull().default(115),
    /** Optische Override-Konfiguration nur für diese Wand. */
    material: jsonb("material").$type<MaterialConfig>(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    index("walls_room_id_idx").on(t.roomId),
    check("walls_thickness_positive", sql`${t.thicknessMm} > 0`),
    check(
      "walls_height_positive",
      sql`${t.heightMm} is null or ${t.heightMm} > 0`,
    ),
    pgPolicy("walls_owner_all", {
      for: "all",
      to: authenticatedRole,
      using: sql`exists (select 1 from ${rooms} join ${projects} on ${projects.id} = ${rooms.projectId} where ${rooms.id} = ${t.roomId} and ${projects.ownerId} = (select auth.uid()))`,
      withCheck: sql`exists (select 1 from ${rooms} join ${projects} on ${projects.id} = ${rooms.projectId} where ${rooms.id} = ${t.roomId} and ${projects.ownerId} = (select auth.uid()))`,
    }),
  ],
);

// ---------------------------------------------------------------------------
// Öffnungen (Türen, Fenster, Nischen)
// ---------------------------------------------------------------------------

export const openings = pgTable(
  "openings",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    wallId: uuid("wall_id")
      .notNull()
      .references(() => walls.id, { onDelete: "cascade" }),
    type: openingTypeEnum("type").notNull(),
    /** Abstand vom Wand-Startpunkt zur linken Kante der Öffnung. */
    offsetMm: integer("offset_mm").notNull(),
    widthMm: integer("width_mm").notNull(),
    heightMm: integer("height_mm").notNull(),
    /** Unterkante über Boden (Türen 0, Fenster z. B. 900 = Brüstungshöhe). */
    bottomMm: integer("bottom_mm").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    index("openings_wall_id_idx").on(t.wallId),
    check("openings_offset_non_negative", sql`${t.offsetMm} >= 0`),
    check(
      "openings_size_positive",
      sql`${t.widthMm} > 0 and ${t.heightMm} > 0`,
    ),
    check("openings_bottom_non_negative", sql`${t.bottomMm} >= 0`),
    pgPolicy("openings_owner_all", {
      for: "all",
      to: authenticatedRole,
      using: sql`exists (select 1 from ${walls} join ${rooms} on ${rooms.id} = ${walls.roomId} join ${projects} on ${projects.id} = ${rooms.projectId} where ${walls.id} = ${t.wallId} and ${projects.ownerId} = (select auth.uid()))`,
      withCheck: sql`exists (select 1 from ${walls} join ${rooms} on ${rooms.id} = ${walls.roomId} join ${projects} on ${projects.id} = ${rooms.projectId} where ${walls.id} = ${t.wallId} and ${projects.ownerId} = (select auth.uid()))`,
    }),
  ],
);

// ---------------------------------------------------------------------------
// Katalog (Fliesen & Sanitärobjekte)
// ---------------------------------------------------------------------------

export const catalogItems = pgTable(
  "catalog_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    ownerId: uuid("owner_id")
      .notNull()
      .references(() => authUsers.id, { onDelete: "cascade" }),
    type: catalogItemTypeEnum("type").notNull(),
    name: text("name").notNull(),
    manufacturer: text("manufacturer"),
    series: text("series"),
    sku: text("sku"),
    colorName: text("color_name"),
    /** Typabhängige Abmessungen, siehe `catalogDimensionsSchema`. */
    dimensions: jsonb("dimensions").$type<CatalogDimensions>().notNull(),
    /** Kachelbare Textur (Fliesen) – Supabase Storage. */
    textureUrl: text("texture_url"),
    /** Vorschaubild für Katalog-Listen. */
    thumbnailUrl: text("thumbnail_url"),
    /** 3D-Modell (Sanitär, glTF/GLB) – Supabase Storage. */
    modelUrl: text("model_url"),
    /** Netto-Preis in Euro-Cent; null = Preis noch offen. */
    priceCents: integer("price_cents"),
    priceUnit: priceUnitEnum("price_unit").notNull(),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    index("catalog_items_owner_id_idx").on(t.ownerId),
    index("catalog_items_type_idx").on(t.type),
    check(
      "catalog_items_price_non_negative",
      sql`${t.priceCents} is null or ${t.priceCents} >= 0`,
    ),
    pgPolicy("catalog_items_owner_all", {
      for: "all",
      to: authenticatedRole,
      using: sql`${t.ownerId} = (select auth.uid())`,
      withCheck: sql`${t.ownerId} = (select auth.uid())`,
    }),
  ],
);

// ---------------------------------------------------------------------------
// Platzierungen (Fliesen auf Flächen, Sanitärobjekte im Raum)
// ---------------------------------------------------------------------------

export const placements = pgTable(
  "placements",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    roomId: uuid("room_id")
      .notNull()
      .references(() => rooms.id, { onDelete: "cascade" }),
    catalogItemId: uuid("catalog_item_id")
      .notNull()
      .references(() => catalogItems.id, { onDelete: "restrict" }),
    surface: surfaceTypeEnum("surface").notNull(),
    /** Pflicht bei surface = 'wall', sonst null. */
    wallId: uuid("wall_id").references(() => walls.id, {
      onDelete: "cascade",
    }),
    /** Nur für Fliesen-Placements. */
    pattern: tilePatternEnum("pattern"),
    /** Versatz bei running_bond als Bruchteil (0.5 = Halbverband). */
    patternOffsetFraction: real("pattern_offset_fraction"),
    groutWidthMm: real("grout_width_mm"),
    /** Fugenfarbe als Hex-Wert, z. B. "#c8c4bc". */
    groutColor: text("grout_color"),
    /** Siehe `positionMmSchema` (Muster-Ursprung bzw. Objekt-Position). */
    position: jsonb("position").$type<PositionMm>(),
    rotationDeg: real("rotation_deg").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    index("placements_room_id_idx").on(t.roomId),
    index("placements_catalog_item_id_idx").on(t.catalogItemId),
    index("placements_wall_id_idx").on(t.wallId),
    check(
      "placements_wall_surface_requires_wall_id",
      sql`(${t.surface} <> 'wall' and ${t.wallId} is null) or (${t.surface} = 'wall' and ${t.wallId} is not null)`,
    ),
    check(
      "placements_grout_non_negative",
      sql`${t.groutWidthMm} is null or ${t.groutWidthMm} >= 0`,
    ),
    pgPolicy("placements_owner_all", {
      for: "all",
      to: authenticatedRole,
      using: sql`exists (select 1 from ${rooms} join ${projects} on ${projects.id} = ${rooms.projectId} where ${rooms.id} = ${t.roomId} and ${projects.ownerId} = (select auth.uid()))`,
      withCheck: sql`exists (select 1 from ${rooms} join ${projects} on ${projects.id} = ${rooms.projectId} where ${rooms.id} = ${t.roomId} and ${projects.ownerId} = (select auth.uid()))`,
    }),
  ],
);

// ---------------------------------------------------------------------------
// Relationen (Drizzle Query API)
// ---------------------------------------------------------------------------

export const customersRelations = relations(customers, ({ many }) => ({
  projects: many(projects),
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
  customer: one(customers, {
    fields: [projects.customerId],
    references: [customers.id],
  }),
  rooms: many(rooms),
}));

export const roomsRelations = relations(rooms, ({ one, many }) => ({
  project: one(projects, {
    fields: [rooms.projectId],
    references: [projects.id],
  }),
  walls: many(walls),
  placements: many(placements),
}));

export const wallsRelations = relations(walls, ({ one, many }) => ({
  room: one(rooms, { fields: [walls.roomId], references: [rooms.id] }),
  openings: many(openings),
  placements: many(placements),
}));

export const openingsRelations = relations(openings, ({ one }) => ({
  wall: one(walls, { fields: [openings.wallId], references: [walls.id] }),
}));

export const catalogItemsRelations = relations(catalogItems, ({ many }) => ({
  placements: many(placements),
}));

export const placementsRelations = relations(placements, ({ one }) => ({
  room: one(rooms, { fields: [placements.roomId], references: [rooms.id] }),
  catalogItem: one(catalogItems, {
    fields: [placements.catalogItemId],
    references: [catalogItems.id],
  }),
  wall: one(walls, { fields: [placements.wallId], references: [walls.id] }),
}));

// ---------------------------------------------------------------------------
// Abgeleitete Typen
// ---------------------------------------------------------------------------

export type Customer = typeof customers.$inferSelect;
export type NewCustomer = typeof customers.$inferInsert;
export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;
export type Room = typeof rooms.$inferSelect;
export type NewRoom = typeof rooms.$inferInsert;
export type Wall = typeof walls.$inferSelect;
export type NewWall = typeof walls.$inferInsert;
export type Opening = typeof openings.$inferSelect;
export type NewOpening = typeof openings.$inferInsert;
export type CatalogItem = typeof catalogItems.$inferSelect;
export type NewCatalogItem = typeof catalogItems.$inferInsert;
export type Placement = typeof placements.$inferSelect;
export type NewPlacement = typeof placements.$inferInsert;
