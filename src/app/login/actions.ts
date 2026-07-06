"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type AuthFormState = {
  fehler?: string;
  hinweis?: string;
};

function deutscheAuthFehlermeldung(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("invalid login credentials")) {
    return "E-Mail oder Passwort ist falsch.";
  }
  if (m.includes("email not confirmed")) {
    return "E-Mail-Adresse ist noch nicht bestätigt – bitte den Link in der Bestätigungs-Mail öffnen.";
  }
  if (m.includes("user already registered")) {
    return "Für diese E-Mail-Adresse existiert bereits ein Konto.";
  }
  if (m.includes("password should be at least")) {
    return "Das Passwort muss mindestens 6 Zeichen lang sein.";
  }
  if (m.includes("rate limit") || m.includes("too many")) {
    return "Zu viele Versuche – bitte kurz warten und erneut probieren.";
  }
  return `Anmeldung fehlgeschlagen: ${message}`;
}

export async function anmelden(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const email = String(formData.get("email") ?? "").trim();
  const passwort = String(formData.get("passwort") ?? "");
  const weiter = String(formData.get("weiter") ?? "") || "/projekte";

  if (!email || !passwort) {
    return { fehler: "Bitte E-Mail und Passwort eingeben." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password: passwort,
  });

  if (error) {
    return { fehler: deutscheAuthFehlermeldung(error.message) };
  }

  revalidatePath("/", "layout");
  redirect(weiter.startsWith("/") ? weiter : "/projekte");
}

export async function registrieren(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const email = String(formData.get("email") ?? "").trim();
  const passwort = String(formData.get("passwort") ?? "");

  if (!email || !passwort) {
    return { fehler: "Bitte E-Mail und Passwort eingeben." };
  }
  if (passwort.length < 6) {
    return { fehler: "Das Passwort muss mindestens 6 Zeichen lang sein." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password: passwort,
  });

  if (error) {
    return { fehler: deutscheAuthFehlermeldung(error.message) };
  }

  // Session vorhanden → E-Mail-Bestätigung ist deaktiviert, direkt rein.
  if (data.session) {
    revalidatePath("/", "layout");
    redirect("/projekte");
  }

  return {
    hinweis:
      "Konto angelegt. Bitte den Bestätigungs-Link in der E-Mail öffnen und danach anmelden.",
  };
}

export async function abmelden() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}
