"use client";

import { useActionState } from "react";
import { projektAnlegen, type ProjektFormState } from "../actions";

const leer: ProjektFormState = {};

export function NeuesProjektForm() {
  const [state, action, laeuft] = useActionState(projektAnlegen, leer);

  return (
    <form
      action={action}
      className="flex flex-wrap items-end gap-2 rounded-lg border border-foreground/10 bg-foreground/[0.02] p-3"
    >
      <label className="flex min-w-40 flex-1 flex-col gap-1 text-sm">
        <span className="text-xs font-medium opacity-70">Projektname</span>
        <input
          name="name"
          required
          placeholder="z. B. Bad Familie Huber"
          className="rounded-md border border-foreground/15 bg-background px-3 py-2 outline-none focus:border-foreground/40"
        />
      </label>
      <label className="flex min-w-40 flex-1 flex-col gap-1 text-sm">
        <span className="text-xs font-medium opacity-70">
          Kunde (optional)
        </span>
        <input
          name="kunde"
          placeholder="z. B. Familie Huber"
          className="rounded-md border border-foreground/15 bg-background px-3 py-2 outline-none focus:border-foreground/40"
        />
      </label>
      <button
        type="submit"
        disabled={laeuft}
        className="rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background hover:opacity-85 disabled:opacity-50"
      >
        {laeuft ? "Legt an …" : "Projekt anlegen"}
      </button>
      {state.fehler && (
        <p className="w-full text-sm text-red-700 dark:text-red-400">
          {state.fehler}
        </p>
      )}
    </form>
  );
}
