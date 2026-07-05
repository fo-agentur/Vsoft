CREATE TYPE "public"."catalog_item_type" AS ENUM('tile', 'sanitary');--> statement-breakpoint
CREATE TYPE "public"."opening_type" AS ENUM('door', 'window', 'niche');--> statement-breakpoint
CREATE TYPE "public"."price_unit" AS ENUM('per_sqm', 'per_piece');--> statement-breakpoint
CREATE TYPE "public"."project_status" AS ENUM('draft', 'active', 'completed', 'archived');--> statement-breakpoint
CREATE TYPE "public"."surface_type" AS ENUM('floor', 'ceiling', 'wall');--> statement-breakpoint
CREATE TYPE "public"."tile_pattern" AS ENUM('grid', 'running_bond', 'herringbone');--> statement-breakpoint
CREATE TABLE "catalog_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" uuid NOT NULL,
	"type" "catalog_item_type" NOT NULL,
	"name" text NOT NULL,
	"manufacturer" text,
	"series" text,
	"sku" text,
	"color_name" text,
	"dimensions" jsonb NOT NULL,
	"texture_url" text,
	"thumbnail_url" text,
	"model_url" text,
	"price_cents" integer,
	"price_unit" "price_unit" NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "catalog_items_price_non_negative" CHECK ("catalog_items"."price_cents" is null or "catalog_items"."price_cents" >= 0)
);
--> statement-breakpoint
ALTER TABLE "catalog_items" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "customers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" uuid NOT NULL,
	"name" text NOT NULL,
	"email" text,
	"phone" text,
	"address" text,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "customers" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "openings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"wall_id" uuid NOT NULL,
	"type" "opening_type" NOT NULL,
	"offset_mm" integer NOT NULL,
	"width_mm" integer NOT NULL,
	"height_mm" integer NOT NULL,
	"bottom_mm" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "openings_offset_non_negative" CHECK ("openings"."offset_mm" >= 0),
	CONSTRAINT "openings_size_positive" CHECK ("openings"."width_mm" > 0 and "openings"."height_mm" > 0),
	CONSTRAINT "openings_bottom_non_negative" CHECK ("openings"."bottom_mm" >= 0)
);
--> statement-breakpoint
ALTER TABLE "openings" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "placements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"room_id" uuid NOT NULL,
	"catalog_item_id" uuid NOT NULL,
	"surface" "surface_type" NOT NULL,
	"wall_id" uuid,
	"pattern" "tile_pattern",
	"pattern_offset_fraction" real,
	"grout_width_mm" real,
	"grout_color" text,
	"position" jsonb,
	"rotation_deg" real DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "placements_wall_surface_requires_wall_id" CHECK (("placements"."surface" <> 'wall' and "placements"."wall_id" is null) or ("placements"."surface" = 'wall' and "placements"."wall_id" is not null)),
	CONSTRAINT "placements_grout_non_negative" CHECK ("placements"."grout_width_mm" is null or "placements"."grout_width_mm" >= 0)
);
--> statement-breakpoint
ALTER TABLE "placements" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "projects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" uuid NOT NULL,
	"customer_id" uuid,
	"name" text NOT NULL,
	"description" text,
	"status" "project_status" DEFAULT 'draft' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "projects" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "rooms" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"name" text NOT NULL,
	"ceiling_height_mm" integer DEFAULT 2500 NOT NULL,
	"floor_material" jsonb,
	"ceiling_material" jsonb,
	"wall_material" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "rooms" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "walls" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"room_id" uuid NOT NULL,
	"order_index" integer DEFAULT 0 NOT NULL,
	"start_x_mm" integer NOT NULL,
	"start_y_mm" integer NOT NULL,
	"end_x_mm" integer NOT NULL,
	"end_y_mm" integer NOT NULL,
	"height_mm" integer,
	"thickness_mm" integer DEFAULT 115 NOT NULL,
	"material" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "walls_thickness_positive" CHECK ("walls"."thickness_mm" > 0),
	CONSTRAINT "walls_height_positive" CHECK ("walls"."height_mm" is null or "walls"."height_mm" > 0)
);
--> statement-breakpoint
ALTER TABLE "walls" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "catalog_items" ADD CONSTRAINT "catalog_items_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customers" ADD CONSTRAINT "customers_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "openings" ADD CONSTRAINT "openings_wall_id_walls_id_fk" FOREIGN KEY ("wall_id") REFERENCES "public"."walls"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "placements" ADD CONSTRAINT "placements_room_id_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."rooms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "placements" ADD CONSTRAINT "placements_catalog_item_id_catalog_items_id_fk" FOREIGN KEY ("catalog_item_id") REFERENCES "public"."catalog_items"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "placements" ADD CONSTRAINT "placements_wall_id_walls_id_fk" FOREIGN KEY ("wall_id") REFERENCES "public"."walls"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rooms" ADD CONSTRAINT "rooms_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "walls" ADD CONSTRAINT "walls_room_id_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."rooms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "catalog_items_owner_id_idx" ON "catalog_items" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "catalog_items_type_idx" ON "catalog_items" USING btree ("type");--> statement-breakpoint
CREATE INDEX "customers_owner_id_idx" ON "customers" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "openings_wall_id_idx" ON "openings" USING btree ("wall_id");--> statement-breakpoint
CREATE INDEX "placements_room_id_idx" ON "placements" USING btree ("room_id");--> statement-breakpoint
CREATE INDEX "placements_catalog_item_id_idx" ON "placements" USING btree ("catalog_item_id");--> statement-breakpoint
CREATE INDEX "placements_wall_id_idx" ON "placements" USING btree ("wall_id");--> statement-breakpoint
CREATE INDEX "projects_owner_id_idx" ON "projects" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "projects_customer_id_idx" ON "projects" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "rooms_project_id_idx" ON "rooms" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "walls_room_id_idx" ON "walls" USING btree ("room_id");--> statement-breakpoint
CREATE POLICY "catalog_items_owner_all" ON "catalog_items" AS PERMISSIVE FOR ALL TO "authenticated" USING ("catalog_items"."owner_id" = (select auth.uid())) WITH CHECK ("catalog_items"."owner_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "customers_owner_all" ON "customers" AS PERMISSIVE FOR ALL TO "authenticated" USING ("customers"."owner_id" = (select auth.uid())) WITH CHECK ("customers"."owner_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "openings_owner_all" ON "openings" AS PERMISSIVE FOR ALL TO "authenticated" USING (exists (select 1 from "walls" join "rooms" on "rooms"."id" = "walls"."room_id" join "projects" on "projects"."id" = "rooms"."project_id" where "walls"."id" = "openings"."wall_id" and "projects"."owner_id" = (select auth.uid()))) WITH CHECK (exists (select 1 from "walls" join "rooms" on "rooms"."id" = "walls"."room_id" join "projects" on "projects"."id" = "rooms"."project_id" where "walls"."id" = "openings"."wall_id" and "projects"."owner_id" = (select auth.uid())));--> statement-breakpoint
CREATE POLICY "placements_owner_all" ON "placements" AS PERMISSIVE FOR ALL TO "authenticated" USING (exists (select 1 from "rooms" join "projects" on "projects"."id" = "rooms"."project_id" where "rooms"."id" = "placements"."room_id" and "projects"."owner_id" = (select auth.uid()))) WITH CHECK (exists (select 1 from "rooms" join "projects" on "projects"."id" = "rooms"."project_id" where "rooms"."id" = "placements"."room_id" and "projects"."owner_id" = (select auth.uid())));--> statement-breakpoint
CREATE POLICY "projects_owner_all" ON "projects" AS PERMISSIVE FOR ALL TO "authenticated" USING ("projects"."owner_id" = (select auth.uid())) WITH CHECK ("projects"."owner_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "rooms_owner_all" ON "rooms" AS PERMISSIVE FOR ALL TO "authenticated" USING (exists (select 1 from "projects" where "projects"."id" = "rooms"."project_id" and "projects"."owner_id" = (select auth.uid()))) WITH CHECK (exists (select 1 from "projects" where "projects"."id" = "rooms"."project_id" and "projects"."owner_id" = (select auth.uid())));--> statement-breakpoint
CREATE POLICY "walls_owner_all" ON "walls" AS PERMISSIVE FOR ALL TO "authenticated" USING (exists (select 1 from "rooms" join "projects" on "projects"."id" = "rooms"."project_id" where "rooms"."id" = "walls"."room_id" and "projects"."owner_id" = (select auth.uid()))) WITH CHECK (exists (select 1 from "rooms" join "projects" on "projects"."id" = "rooms"."project_id" where "rooms"."id" = "walls"."room_id" and "projects"."owner_id" = (select auth.uid())));