/**
 * Von Supabase generierte Datenbank-Typen (mcp: generate_typescript_types).
 * Nach Schema-Änderungen neu generieren.
 */
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      catalog_items: {
        Row: {
          color_name: string | null;
          created_at: string;
          dimensions: Json;
          id: string;
          is_active: boolean;
          manufacturer: string | null;
          model_url: string | null;
          name: string;
          owner_id: string;
          price_cents: number | null;
          price_unit: Database["public"]["Enums"]["price_unit"];
          series: string | null;
          sku: string | null;
          texture_url: string | null;
          thumbnail_url: string | null;
          type: Database["public"]["Enums"]["catalog_item_type"];
          updated_at: string;
        };
        Insert: {
          color_name?: string | null;
          created_at?: string;
          dimensions: Json;
          id?: string;
          is_active?: boolean;
          manufacturer?: string | null;
          model_url?: string | null;
          name: string;
          owner_id: string;
          price_cents?: number | null;
          price_unit: Database["public"]["Enums"]["price_unit"];
          series?: string | null;
          sku?: string | null;
          texture_url?: string | null;
          thumbnail_url?: string | null;
          type: Database["public"]["Enums"]["catalog_item_type"];
          updated_at?: string;
        };
        Update: {
          color_name?: string | null;
          created_at?: string;
          dimensions?: Json;
          id?: string;
          is_active?: boolean;
          manufacturer?: string | null;
          model_url?: string | null;
          name?: string;
          owner_id?: string;
          price_cents?: number | null;
          price_unit?: Database["public"]["Enums"]["price_unit"];
          series?: string | null;
          sku?: string | null;
          texture_url?: string | null;
          thumbnail_url?: string | null;
          type?: Database["public"]["Enums"]["catalog_item_type"];
          updated_at?: string;
        };
        Relationships: [];
      };
      customers: {
        Row: {
          address: string | null;
          created_at: string;
          email: string | null;
          id: string;
          name: string;
          notes: string | null;
          owner_id: string;
          phone: string | null;
          updated_at: string;
        };
        Insert: {
          address?: string | null;
          created_at?: string;
          email?: string | null;
          id?: string;
          name: string;
          notes?: string | null;
          owner_id: string;
          phone?: string | null;
          updated_at?: string;
        };
        Update: {
          address?: string | null;
          created_at?: string;
          email?: string | null;
          id?: string;
          name?: string;
          notes?: string | null;
          owner_id?: string;
          phone?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      openings: {
        Row: {
          bottom_mm: number;
          created_at: string;
          height_mm: number;
          id: string;
          offset_mm: number;
          type: Database["public"]["Enums"]["opening_type"];
          updated_at: string;
          wall_id: string;
          width_mm: number;
        };
        Insert: {
          bottom_mm?: number;
          created_at?: string;
          height_mm: number;
          id?: string;
          offset_mm: number;
          type: Database["public"]["Enums"]["opening_type"];
          updated_at?: string;
          wall_id: string;
          width_mm: number;
        };
        Update: {
          bottom_mm?: number;
          created_at?: string;
          height_mm?: number;
          id?: string;
          offset_mm?: number;
          type?: Database["public"]["Enums"]["opening_type"];
          updated_at?: string;
          wall_id?: string;
          width_mm?: number;
        };
        Relationships: [
          {
            foreignKeyName: "openings_wall_id_walls_id_fk";
            columns: ["wall_id"];
            isOneToOne: false;
            referencedRelation: "walls";
            referencedColumns: ["id"];
          },
        ];
      };
      placements: {
        Row: {
          catalog_item_id: string;
          created_at: string;
          grout_color: string | null;
          grout_width_mm: number | null;
          id: string;
          pattern: Database["public"]["Enums"]["tile_pattern"] | null;
          pattern_offset_fraction: number | null;
          position: Json | null;
          room_id: string;
          rotation_deg: number;
          surface: Database["public"]["Enums"]["surface_type"];
          updated_at: string;
          wall_id: string | null;
        };
        Insert: {
          catalog_item_id: string;
          created_at?: string;
          grout_color?: string | null;
          grout_width_mm?: number | null;
          id?: string;
          pattern?: Database["public"]["Enums"]["tile_pattern"] | null;
          pattern_offset_fraction?: number | null;
          position?: Json | null;
          room_id: string;
          rotation_deg?: number;
          surface: Database["public"]["Enums"]["surface_type"];
          updated_at?: string;
          wall_id?: string | null;
        };
        Update: {
          catalog_item_id?: string;
          created_at?: string;
          grout_color?: string | null;
          grout_width_mm?: number | null;
          id?: string;
          pattern?: Database["public"]["Enums"]["tile_pattern"] | null;
          pattern_offset_fraction?: number | null;
          position?: Json | null;
          room_id?: string;
          rotation_deg?: number;
          surface?: Database["public"]["Enums"]["surface_type"];
          updated_at?: string;
          wall_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "placements_catalog_item_id_catalog_items_id_fk";
            columns: ["catalog_item_id"];
            isOneToOne: false;
            referencedRelation: "catalog_items";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "placements_room_id_rooms_id_fk";
            columns: ["room_id"];
            isOneToOne: false;
            referencedRelation: "rooms";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "placements_wall_id_walls_id_fk";
            columns: ["wall_id"];
            isOneToOne: false;
            referencedRelation: "walls";
            referencedColumns: ["id"];
          },
        ];
      };
      projects: {
        Row: {
          created_at: string;
          customer_id: string | null;
          description: string | null;
          id: string;
          name: string;
          owner_id: string;
          status: Database["public"]["Enums"]["project_status"];
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          customer_id?: string | null;
          description?: string | null;
          id?: string;
          name: string;
          owner_id: string;
          status?: Database["public"]["Enums"]["project_status"];
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          customer_id?: string | null;
          description?: string | null;
          id?: string;
          name?: string;
          owner_id?: string;
          status?: Database["public"]["Enums"]["project_status"];
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "projects_customer_id_customers_id_fk";
            columns: ["customer_id"];
            isOneToOne: false;
            referencedRelation: "customers";
            referencedColumns: ["id"];
          },
        ];
      };
      rooms: {
        Row: {
          ceiling_height_mm: number;
          ceiling_material: Json | null;
          created_at: string;
          floor_material: Json | null;
          id: string;
          name: string;
          project_id: string;
          updated_at: string;
          wall_material: Json | null;
        };
        Insert: {
          ceiling_height_mm?: number;
          ceiling_material?: Json | null;
          created_at?: string;
          floor_material?: Json | null;
          id?: string;
          name: string;
          project_id: string;
          updated_at?: string;
          wall_material?: Json | null;
        };
        Update: {
          ceiling_height_mm?: number;
          ceiling_material?: Json | null;
          created_at?: string;
          floor_material?: Json | null;
          id?: string;
          name?: string;
          project_id?: string;
          updated_at?: string;
          wall_material?: Json | null;
        };
        Relationships: [
          {
            foreignKeyName: "rooms_project_id_projects_id_fk";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
        ];
      };
      walls: {
        Row: {
          created_at: string;
          end_x_mm: number;
          end_y_mm: number;
          height_mm: number | null;
          id: string;
          material: Json | null;
          order_index: number;
          room_id: string;
          start_x_mm: number;
          start_y_mm: number;
          thickness_mm: number;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          end_x_mm: number;
          end_y_mm: number;
          height_mm?: number | null;
          id?: string;
          material?: Json | null;
          order_index?: number;
          room_id: string;
          start_x_mm: number;
          start_y_mm: number;
          thickness_mm?: number;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          end_x_mm?: number;
          end_y_mm?: number;
          height_mm?: number | null;
          id?: string;
          material?: Json | null;
          order_index?: number;
          room_id?: string;
          start_x_mm?: number;
          start_y_mm?: number;
          thickness_mm?: number;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "walls_room_id_rooms_id_fk";
            columns: ["room_id"];
            isOneToOne: false;
            referencedRelation: "rooms";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      catalog_item_type: "tile" | "sanitary";
      opening_type: "door" | "window" | "niche";
      price_unit: "per_sqm" | "per_piece";
      project_status: "draft" | "active" | "completed" | "archived";
      surface_type: "floor" | "ceiling" | "wall";
      tile_pattern: "grid" | "running_bond" | "herringbone";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];
export type TablesInsert<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];
export type TablesUpdate<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];
export type Enums<T extends keyof Database["public"]["Enums"]> =
  Database["public"]["Enums"][T];
