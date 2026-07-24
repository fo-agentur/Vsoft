"use client";

import Link from "next/link";
import { useCallback, useMemo, useRef, useState } from "react";
import { formatM2 } from "@/lib/editor/geometry";
import { polygonAreaM2 } from "@/lib/editor/geometry";
import type { RoomGeometry } from "@/lib/editor/types";
import { saveRoomGeometry } from "@/lib/data/rooms";
import { createClient } from "@/lib/supabase/client";
import { RoomEditor } from "./RoomEditor";
import dynamic from "next/dynamic";

const Room3D = dynamic(() => import("./Room3D"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center text-sm opacity-50">3D-Ansicht wird geladen …</div>
  ),
});

type Modus =
  | { art: "db"; roomId: string; zurueckHref: string }
  | { art: "demo" };

export interface RoomEditorScreenProps {
  modus: Modus;
  initialName: string;
  initialCeilingHeightMm: number;
  initialGeometry: RoomGeometry;
  untertitel?: string;
}

type SaveStatus =
  | { s: "idle" }
  | { s: "saving" }
  | { s: "saved" }
  | { s: "error"; message: string };

export function RoomEditorScreen({
  modus,
  initialName,
  initialCeilingHeightMm,
  initialGeometry,
  untertitel,
}: RoomEditorScreenProps) {
  const [name, setName] = useState(initialName);
  const [heightMm, setHeightMm] = useState(initialCeilingHeightMm);
  const [geometry, setGeometry] = useState<RoomGeometry>(initialGeometry);
  const [dirty, setDirty] = useState(false);
  const [status, setStatus] = useState<SaveStatus>({ s: "idle" });
  const [ansicht, setAnsicht] = useState<"2d" | "3d">("2d");

  // Zuletzt gespeicherte IDs → Diff-Basis fürs nächste Speichern.
  const bekannteIds = useRef({
    walls: initialGeometry.walls.map((w) => w.id),
    openings: initialGeometry.openings.map((o) => o.id),
  });

  const areaM2 = useMemo(
    () => polygonAreaM2(geometry.walls),
    [geometry.walls],
  );

  const onGeometryChange = useCallback((g: RoomGeometry) => {
    setGeometry(g);
    setDirty(true);
    setStatus({ s: "idle" });
  }, []);

  const speichern = useCallback(async () => {
    if (modus.art === "demo") {
      setStatus({ s: "saving" });
      await new Promise((r) => setTimeout(r, 400));
      setDirty(false);
      setStatus({ s: "saved" });
      return;
    }
    setStatus({ s: "saving" });
    try {
      const supabase = createClient();
      await saveRoomGeometry(
        supabase,
        modus.roomId,
        geometry,
        { name, ceilingHeightMm: heightMm },
        bekannteIds.current.walls,
        bekannteIds.current.openings,
      );
      bekannteIds.current = {
        walls: geometry.walls.map((w) => w.id),
        openings: geometry.openings.map((o) => o.id),
      };
      setDirty(false);
      setStatus({ s: "saved" });
    } catch (e) {
      setStatus({
        s: "error",
        message: e instanceof Error ? e.message : "Unbekannter Fehler",
      });
    }
  }, [modus, geometry, name, heightMm]);

  return (
    <div className="flex h-dvh flex-col">
      <header className="flex items-center gap-3 border-b border-foreground/10 bg-background px-4 py-2.5">
        <Link
          href={modus.art === "db" ? modus.zurueckHref : "/"}
          className="rounded-md border border-foreground/15 px-2.5 py-1.5 text-xs font-medium hover:bg-foreground/5"
        >
          ← Zurück
        </Link>
        <div className="flex min-w-0 flex-col">
          <input
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setDirty(true);
            }}
            aria-label="Raumname"
            className="-mx-1 truncate rounded px-1 text-sm font-semibold outline-none hover:bg-foreground/5 focus:bg-foreground/5"
          />
          {untertitel && (
            <span className="truncate text-xs opacity-50">{untertitel}</span>
          )}
        </div>

        <div className="ml-auto inline-flex overflow-hidden rounded-md border border-foreground/15 text-xs font-medium">
          <button
            type="button"
            onClick={() => setAnsicht("2d")}
            className={
              ansicht === "2d"
                ? "bg-foreground px-3 py-1.5 text-background"
                : "px-3 py-1.5 hover:bg-foreground/5"
            }
          >
            2D
          </button>
          <button
            type="button"
            onClick={() => setAnsicht("3d")}
            className={
              ansicht === "3d"
                ? "bg-foreground px-3 py-1.5 text-background"
                : "px-3 py-1.5 hover:bg-foreground/5"
            }
          >
            3D
          </button>
        </div>

        <span className="rounded-full bg-foreground/5 px-2.5 py-1 text-xs font-medium tabular-nums">
          {formatM2(areaM2)}
        </span>

        {modus.art === "demo" ? (
          <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-800 dark:bg-amber-950 dark:text-amber-300">
            Demo – wird nicht gespeichert
          </span>
        ) : (
          <>
            {status.s === "error" && (
              <span
                className="max-w-56 truncate text-xs text-red-600 dark:text-red-400"
                title={status.message}
              >
                {status.message}
              </span>
            )}
            {status.s === "saved" && !dirty && (
              <span className="text-xs text-emerald-700 dark:text-emerald-400">
                Gespeichert
              </span>
            )}
          </>
        )}

        <button
          type="button"
          onClick={speichern}
          disabled={status.s === "saving" || (!dirty && status.s !== "error")}
          className="rounded-md bg-foreground px-3 py-1.5 text-xs font-medium text-background transition-opacity hover:opacity-85 disabled:opacity-40"
        >
          {status.s === "saving"
            ? "Speichert …"
            : dirty
              ? "Speichern •"
              : "Speichern"}
        </button>
      </header>

      <div className="min-h-0 flex-1">
        {ansicht === "2d" ? (
          <RoomEditor
            geometry={geometry}
            onGeometryChange={onGeometryChange}
            ceilingHeightMm={heightMm}
            onCeilingHeightChange={(mm) => {
              setHeightMm(mm);
              setDirty(true);
            }}
          />
        ) : (
          <Room3D geometry={geometry} ceilingHeightMm={heightMm} />
        )}
      </div>
    </div>
  );
}
