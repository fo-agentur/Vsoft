"use client";

import { useActionState, useState } from "react";
import { anmelden, registrieren, type AuthFormState } from "./actions";

const leer: AuthFormState = {};

export function LoginForm({ weiter }: { weiter?: string }) {
  const [modus, setModus] = useState<"anmelden" | "registrieren">("anmelden");
  const [loginState, loginAction, loginLaeuft] = useActionState(
    anmelden,
    leer,
  );
  const [regState, regAction, regLaeuft] = useActionState(registrieren, leer);

  const state = modus === "anmelden" ? loginState : regState;
  const laeuft = loginLaeuft || regLaeuft;

  return (
    <div className="w-full max-w-sm rounded-xl border border-foreground/10 bg-background p-6 shadow-sm">
      <div className="mb-5 grid grid-cols-2 rounded-lg bg-foreground/5 p-1 text-sm font-medium">
        {(
          [
            ["anmelden", "Anmelden"],
            ["registrieren", "Registrieren"],
          ] as const
        ).map(([wert, label]) => (
          <button
            key={wert}
            type="button"
            onClick={() => setModus(wert)}
            className={`rounded-md px-3 py-1.5 transition-colors ${
              modus === wert
                ? "bg-background shadow-sm"
                : "opacity-60 hover:opacity-100"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <form
        action={modus === "anmelden" ? loginAction : regAction}
        className="flex flex-col gap-3"
      >
        <input type="hidden" name="weiter" value={weiter ?? ""} />
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">E-Mail</span>
          <input
            type="email"
            name="email"
            required
            autoComplete="email"
            className="rounded-md border border-foreground/15 bg-background px-3 py-2 outline-none focus:border-foreground/40"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Passwort</span>
          <input
            type="password"
            name="passwort"
            required
            minLength={6}
            autoComplete={
              modus === "anmelden" ? "current-password" : "new-password"
            }
            className="rounded-md border border-foreground/15 bg-background px-3 py-2 outline-none focus:border-foreground/40"
          />
        </label>

        {state.fehler && (
          <p className="rounded-md bg-red-500/10 px-3 py-2 text-sm text-red-700 dark:text-red-400">
            {state.fehler}
          </p>
        )}
        {state.hinweis && (
          <p className="rounded-md bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-400">
            {state.hinweis}
          </p>
        )}

        <button
          type="submit"
          disabled={laeuft}
          className="mt-1 rounded-md bg-foreground px-3 py-2 text-sm font-medium text-background transition-opacity hover:opacity-85 disabled:opacity-50"
        >
          {laeuft
            ? "Einen Moment …"
            : modus === "anmelden"
              ? "Anmelden"
              : "Konto erstellen"}
        </button>
      </form>

      {modus === "registrieren" && (
        <p className="mt-4 text-xs leading-relaxed opacity-60">
          Nach der Registrierung schickt dir Supabase einen Bestätigungs-Link
          per E-Mail. Erst danach ist die Anmeldung möglich.
        </p>
      )}
    </div>
  );
}
