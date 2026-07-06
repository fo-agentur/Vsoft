"use client";

import { useActionState, useState } from "react";
import { raumAnlegen, type RaumFormState } from "../../actions";
import type { RaumVorlage } from "@/lib/editor/templates";

const leer: RaumFormState = {};

const feldKlasse =
  "rounded-md border border-foreground/15 bg-background px-3 py-2 outline-none focus:border-foreground/40";

export function NeuerRaumForm({ projektId }: { projektId: string }) {
  const [state, action, laeuft] = useActionState(raumAnlegen, leer);
  const [vorlage, setVorlage] = useState<RaumVorlage>("rechteck");

  return (
    <form
      action={action}
      className="flex flex-col gap-3 rounded-lg border border-foreground/10 bg-foreground/[0.02] p-3 text-sm"
    >
      <input type="hidden" name="projektId" value={projektId} />
      <div className="flex flex-wrap items-end gap-2">
        <label className="flex min-w-36 flex-1 flex-col gap-1">
          <span className="text-xs font-medium opacity-70">Raumname</span>
          <input
            name="name"
            placeholder="z. B. Bad OG"
            className={feldKlasse}
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium opacity-70">Raumform</span>
          <select
            name="vorlage"
            value={vorlage}
            onChange={(e) => setVorlage(e.target.value as RaumVorlage)}
            className={feldKlasse}
          >
            <option value="rechteck">Rechteck</option>
            <option value="l-form">L-Form</option>
            <option value="frei">Frei zeichnen</option>
          </select>
        </label>
        <label className="flex w-28 flex-col gap-1">
          <span className="text-xs font-medium opacity-70">Raumhöhe (cm)</span>
          <input
            name="hoehe"
            inputMode="decimal"
            defaultValue="250"
            className={feldKlasse}
          />
        </label>
      </div>

      {vorlage !== "frei" && (
        <div className="flex flex-wrap items-end gap-2">
          <label className="flex w-28 flex-col gap-1">
            <span className="text-xs font-medium opacity-70">Breite (cm)</span>
            <input
              name="breite"
              inputMode="decimal"
              defaultValue="300"
              className={feldKlasse}
            />
          </label>
          <label className="flex w-28 flex-col gap-1">
            <span className="text-xs font-medium opacity-70">Tiefe (cm)</span>
            <input
              name="tiefe"
              inputMode="decimal"
              defaultValue="250"
              className={feldKlasse}
            />
          </label>
          {vorlage === "l-form" && (
            <>
              <label className="flex w-32 flex-col gap-1">
                <span className="text-xs font-medium opacity-70">
                  Ausschnitt B (cm)
                </span>
                <input
                  name="ausschnittBreite"
                  inputMode="decimal"
                  defaultValue="120"
                  className={feldKlasse}
                />
              </label>
              <label className="flex w-32 flex-col gap-1">
                <span className="text-xs font-medium opacity-70">
                  Ausschnitt T (cm)
                </span>
                <input
                  name="ausschnittTiefe"
                  inputMode="decimal"
                  defaultValue="100"
                  className={feldKlasse}
                />
              </label>
            </>
          )}
        </div>
      )}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={laeuft}
          className="rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background hover:opacity-85 disabled:opacity-50"
        >
          {laeuft ? "Legt an …" : "Raum anlegen & Aufmaß starten"}
        </button>
        {vorlage === "frei" && (
          <span className="text-xs opacity-60">
            Der Grundriss wird anschließend im Editor gezeichnet.
          </span>
        )}
        {state.fehler && (
          <span className="text-sm text-red-700 dark:text-red-400">
            {state.fehler}
          </span>
        )}
      </div>
    </form>
  );
}
