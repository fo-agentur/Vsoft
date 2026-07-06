"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { vorlageWalls, type RaumVorlage } from "@/lib/editor/templates";

export type ProjektFormState = { fehler?: string };

export async function projektAnlegen(
  _prev: ProjektFormState,
  formData: FormData,
): Promise<ProjektFormState> {
  const name = String(formData.get("name") ?? "").trim();
  const kundeName = String(formData.get("kunde") ?? "").trim();
  if (!name) return { fehler: "Bitte einen Projektnamen eingeben." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  let customerId: string | null = null;
  if (kundeName) {
    const { data, error } = await supabase
      .from("customers")
      .insert({ owner_id: user.id, name: kundeName })
      .select("id")
      .single();
    if (error) return { fehler: `Kunde anlegen: ${error.message}` };
    customerId = data.id;
  }

  const { data: projekt, error } = await supabase
    .from("projects")
    .insert({ owner_id: user.id, name, customer_id: customerId })
    .select("id")
    .single();
  if (error) return { fehler: `Projekt anlegen: ${error.message}` };

  revalidatePath("/projekte");
  redirect(`/projekte/${projekt.id}`);
}

export async function projektLoeschen(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const supabase = await createClient();
  await supabase.from("projects").delete().eq("id", id);
  revalidatePath("/projekte");
}

export type RaumFormState = { fehler?: string };

export async function raumAnlegen(
  _prev: RaumFormState,
  formData: FormData,
): Promise<RaumFormState> {
  const projektId = String(formData.get("projektId") ?? "");
  const name = String(formData.get("name") ?? "").trim() || "Neuer Raum";
  const vorlage = String(formData.get("vorlage") ?? "rechteck") as RaumVorlage;
  const hoeheCm = Number.parseFloat(
    String(formData.get("hoehe") ?? "250").replace(",", "."),
  );
  const breiteCm = Number.parseFloat(
    String(formData.get("breite") ?? "300").replace(",", "."),
  );
  const tiefeCm = Number.parseFloat(
    String(formData.get("tiefe") ?? "250").replace(",", "."),
  );
  const ausBreiteCm = Number.parseFloat(
    String(formData.get("ausschnittBreite") ?? "").replace(",", "."),
  );
  const ausTiefeCm = Number.parseFloat(
    String(formData.get("ausschnittTiefe") ?? "").replace(",", "."),
  );

  if (!projektId) return { fehler: "Projekt fehlt." };
  if (
    vorlage !== "frei" &&
    (!Number.isFinite(breiteCm) ||
      !Number.isFinite(tiefeCm) ||
      breiteCm < 50 ||
      tiefeCm < 50)
  ) {
    return { fehler: "Bitte sinnvolle Raummaße angeben (mind. 50 cm)." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: raum, error } = await supabase
    .from("rooms")
    .insert({
      project_id: projektId,
      name,
      ceiling_height_mm: Number.isFinite(hoeheCm)
        ? Math.round(hoeheCm * 10)
        : 2500,
    })
    .select("id")
    .single();
  if (error) return { fehler: `Raum anlegen: ${error.message}` };

  const walls = vorlageWalls(
    vorlage,
    Math.round(breiteCm * 10),
    Math.round(tiefeCm * 10),
    Number.isFinite(ausBreiteCm) ? Math.round(ausBreiteCm * 10) : undefined,
    Number.isFinite(ausTiefeCm) ? Math.round(ausTiefeCm * 10) : undefined,
  );

  if (walls.length > 0) {
    const { error: wandError } = await supabase.from("walls").insert(
      walls.map((w, i) => ({
        id: w.id,
        room_id: raum.id,
        order_index: i,
        start_x_mm: w.sx,
        start_y_mm: w.sy,
        end_x_mm: w.ex,
        end_y_mm: w.ey,
        thickness_mm: w.thicknessMm,
        height_mm: w.heightMm,
      })),
    );
    if (wandError) return { fehler: `Wände anlegen: ${wandError.message}` };
  }

  revalidatePath(`/projekte/${projektId}`);
  redirect(`/projekte/${projektId}/raum/${raum.id}`);
}

export async function raumLoeschen(formData: FormData) {
  const raumId = String(formData.get("raumId") ?? "");
  const projektId = String(formData.get("projektId") ?? "");
  if (!raumId) return;
  const supabase = await createClient();
  await supabase.from("rooms").delete().eq("id", raumId);
  if (projektId) revalidatePath(`/projekte/${projektId}`);
}
