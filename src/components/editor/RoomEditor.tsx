"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  alongWallMm,
  boundingBox,
  clampOpenings,
  formatCm,
  formatM2,
  insertVertex,
  moveVertex,
  moveWallPerp,
  neueId,
  outwardNormal,
  parseCmToMm,
  perimeterM,
  polygonAreaM2,
  removeVertex,
  setWallLength,
  snapMm,
  snapPt,
  wallDir,
  wallLength,
  wallMidpoint,
  wallsFromPolygon,
} from "@/lib/editor/geometry";
import { lFormWalls, rechteckWalls } from "@/lib/editor/templates";
import {
  GRID_MM,
  OPENING_DEFAULTS,
  type EditorOpening,
  type EditorWall,
  type OpeningType,
  type Pt,
  type RoomGeometry,
  type Selection,
} from "@/lib/editor/types";

interface View {
  ox: number;
  oy: number;
  k: number; // px pro mm
}

type DragState =
  | { kind: "pan"; startScreen: Pt; startView: View; moved: boolean }
  | { kind: "bg"; moved: boolean }
  | {
      kind: "wall";
      index: number;
      startWorld: Pt;
      orig: RoomGeometry;
      moved: boolean;
    }
  | {
      kind: "vertex";
      index: number;
      startWorld: Pt;
      origPt: Pt;
      orig: RoomGeometry;
      moved: boolean;
    }
  | {
      kind: "opening";
      id: string;
      startWorld: Pt;
      origOffset: number;
      moved: boolean;
    };

export interface RoomEditorProps {
  geometry: RoomGeometry;
  onGeometryChange: (g: RoomGeometry) => void;
  ceilingHeightMm: number;
  onCeilingHeightChange: (mm: number) => void;
}

export function RoomEditor({
  geometry,
  onGeometryChange,
  ceilingHeightMm,
  onCeilingHeightChange,
}: RoomEditorProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const dragRef = useRef<DragState | null>(null);
  const [size, setSize] = useState({ w: 800, h: 600 });
  const [view, setView] = useState<View>({ ox: 100, oy: 100, k: 0.12 });
  const [selection, setSelection] = useState<Selection>(null);
  const [drawMode, setDrawMode] = useState(false);
  const [draft, setDraft] = useState<Pt[]>([]);
  const [cursorWorld, setCursorWorld] = useState<Pt | null>(null);
  const [labelEdit, setLabelEdit] = useState<{ wallId: string } | null>(null);
  const fitDone = useRef(false);

  const { walls, openings } = geometry;

  // --- Größe beobachten & initial einpassen -------------------------------

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      setSize({ w: el.clientWidth, h: el.clientHeight });
    });
    ro.observe(el);
    setSize({ w: el.clientWidth, h: el.clientHeight });
    return () => ro.disconnect();
  }, []);

  const fitView = useCallback(
    (w: number, h: number) => {
      const bb = boundingBox(walls) ?? {
        minX: 0,
        minY: 0,
        maxX: 4000,
        maxY: 3000,
      };
      const bw = Math.max(bb.maxX - bb.minX, 500);
      const bh = Math.max(bb.maxY - bb.minY, 500);
      const k = Math.min((w * 0.7) / bw, (h * 0.7) / bh);
      setView({
        k,
        ox: (w - bw * k) / 2 - bb.minX * k,
        oy: (h - bh * k) / 2 - bb.minY * k,
      });
    },
    [walls],
  );

  useEffect(() => {
    if (fitDone.current || size.w < 50) return;
    fitDone.current = true;
    fitView(size.w, size.h);
  }, [size, fitView]);

  // --- Koordinaten ---------------------------------------------------------

  const toScreen = useCallback(
    (p: Pt): Pt => ({ x: p.x * view.k + view.ox, y: p.y * view.k + view.oy }),
    [view],
  );
  const toWorld = useCallback(
    (p: Pt): Pt => ({
      x: (p.x - view.ox) / view.k,
      y: (p.y - view.oy) / view.k,
    }),
    [view],
  );
  const screenPtOf = useCallback((e: { clientX: number; clientY: number }) => {
    const r = svgRef.current!.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }, []);

  // --- Zoom (nicht-passiver Wheel-Listener) --------------------------------

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const r = svg.getBoundingClientRect();
      const px = e.clientX - r.left;
      const py = e.clientY - r.top;
      setView((v) => {
        const k = Math.min(2, Math.max(0.015, v.k * Math.exp(-e.deltaY * 0.0012)));
        const wx = (px - v.ox) / v.k;
        const wy = (py - v.oy) / v.k;
        return { k, ox: px - wx * k, oy: py - wy * k };
      });
    };
    svg.addEventListener("wheel", onWheel, { passive: false });
    return () => svg.removeEventListener("wheel", onWheel);
  }, []);

  // --- Geometrie-Updates ----------------------------------------------------

  const updateWalls = useCallback(
    (nextWalls: EditorWall[], base?: RoomGeometry) => {
      const src = base ?? geometry;
      onGeometryChange({
        walls: nextWalls,
        openings: clampOpenings({ walls: nextWalls, openings: src.openings }),
      });
    },
    [geometry, onGeometryChange],
  );

  const updateOpening = useCallback(
    (id: string, patch: Partial<EditorOpening>) => {
      const next = {
        walls,
        openings: openings.map((o) => (o.id === id ? { ...o, ...patch } : o)),
      };
      onGeometryChange({
        walls: next.walls,
        openings: clampOpenings(next),
      });
    },
    [walls, openings, onGeometryChange],
  );

  // --- Zeichnen-Modus -------------------------------------------------------

  const startDrawing = useCallback(() => {
    setSelection(null);
    setLabelEdit(null);
    setDraft([]);
    setDrawMode(true);
  }, []);

  const cancelDrawing = useCallback(() => {
    setDrawMode(false);
    setDraft([]);
  }, []);

  const orthoAssist = (prev: Pt | undefined, p: Pt): Pt => {
    if (!prev) return p;
    const dx = p.x - prev.x;
    const dy = p.y - prev.y;
    if (Math.abs(dy) < Math.abs(dx) * 0.2) return { x: p.x, y: prev.y };
    if (Math.abs(dx) < Math.abs(dy) * 0.2) return { x: prev.x, y: p.y };
    return p;
  };

  const drawClick = (world: Pt) => {
    let p = snapPt(orthoAssist(draft[draft.length - 1], world));
    // Achs-Fang am ersten Punkt, damit die Schlusskante orthogonal wird.
    const first = draft[0];
    if (first) {
      if (Math.abs(p.x - first.x) < 30) p = { ...p, x: first.x };
      if (Math.abs(p.y - first.y) < 30) p = { ...p, y: first.y };
    }
    if (draft.length >= 3) {
      const first = toScreen(draft[0]);
      const here = toScreen(p);
      if (Math.hypot(first.x - here.x, first.y - here.y) < 14) {
        // Polygon schließen
        onGeometryChange({ walls: wallsFromPolygon(draft), openings: [] });
        setDrawMode(false);
        setDraft([]);
        return;
      }
    }
    setDraft((d) => [...d, p]);
  };

  // --- Pointer-Handling -----------------------------------------------------

  const beginDrag = (e: React.PointerEvent, state: DragState) => {
    e.stopPropagation();
    e.preventDefault();
    // Capture auf das angeklickte Element (nicht das SVG-Root), sonst werden
    // auch click/dblclick dorthin umgeleitet und onDoubleClick der Wand
    // feuert nie. Die Pointer-Events erreichen das SVG per Bubbling weiter.
    (e.currentTarget as Element).setPointerCapture(e.pointerId);
    dragRef.current = state;
  };

  const onSvgPointerDown = (e: React.PointerEvent) => {
    const sp = screenPtOf(e);
    const world = toWorld(sp);
    if (drawMode) {
      drawClick(world);
      return;
    }
    svgRef.current?.setPointerCapture(e.pointerId);
    dragRef.current = {
      kind: "pan",
      startScreen: sp,
      startView: view,
      moved: false,
    };
  };

  const onSvgPointerMove = (e: React.PointerEvent) => {
    const sp = screenPtOf(e);
    const world = toWorld(sp);
    if (drawMode) setCursorWorld(world);
    const d = dragRef.current;
    if (!d) return;

    if (d.kind === "pan") {
      const dx = sp.x - d.startScreen.x;
      const dy = sp.y - d.startScreen.y;
      if (Math.abs(dx) + Math.abs(dy) > 3) d.moved = true;
      if (d.moved) {
        setView({
          k: d.startView.k,
          ox: d.startView.ox + dx,
          oy: d.startView.oy + dy,
        });
      }
      return;
    }

    if (d.kind === "wall") {
      const dx = world.x - d.startWorld.x;
      const dy = world.y - d.startWorld.y;
      const n = outwardNormal(d.orig.walls, d.index);
      const dist = snapMm(dx * n.x + dy * n.y);
      if (Math.abs(dist) > 0) d.moved = true;
      updateWalls(moveWallPerp(d.orig.walls, d.index, dist), d.orig);
      return;
    }

    if (d.kind === "vertex") {
      const n = d.orig.walls.length;
      const raw = {
        x: d.origPt.x + (world.x - d.startWorld.x),
        y: d.origPt.y + (world.y - d.startWorld.y),
      };
      let p = snapPt(raw);
      // Achs-Fang an Nachbarecken
      const prev = d.orig.walls[(d.index - 1 + n) % n];
      const nxt = d.orig.walls[(d.index + 1) % n];
      for (const q of [
        { x: prev.sx, y: prev.sy },
        { x: nxt.sx, y: nxt.sy },
      ]) {
        if (Math.abs(p.x - q.x) < 30) p = { ...p, x: q.x };
        if (Math.abs(p.y - q.y) < 30) p = { ...p, y: q.y };
      }
      if (p.x !== d.origPt.x || p.y !== d.origPt.y) d.moved = true;
      updateWalls(moveVertex(d.orig.walls, d.index, p.x, p.y), d.orig);
      return;
    }

    if (d.kind === "opening") {
      const o = openings.find((x) => x.id === d.id);
      const wall = o && walls.find((w) => w.id === o.wallId);
      if (!o || !wall) return;
      const len = wallLength(wall);
      const along = alongWallMm(wall, world) - o.widthMm / 2;
      const offset = Math.max(
        0,
        Math.min(snapMm(along), len - o.widthMm),
      );
      if (offset !== d.origOffset) d.moved = true;
      updateOpening(o.id, { offsetMm: offset });
    }
  };

  const onSvgPointerUp = () => {
    const d = dragRef.current;
    dragRef.current = null;
    if (d && d.kind === "pan" && !d.moved && !drawMode) {
      setSelection(null);
      setLabelEdit(null);
    }
  };

  // --- Tastatur -------------------------------------------------------------

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (e.key === "Escape") {
        if (drawMode) cancelDrawing();
        else {
          setSelection(null);
          setLabelEdit(null);
        }
      }
      if ((e.key === "Delete" || e.key === "Backspace") && selection) {
        if (selection.kind === "opening") {
          onGeometryChange({
            walls,
            openings: openings.filter((o) => o.id !== selection.id),
          });
          setSelection(null);
        } else if (selection.kind === "vertex" && walls.length > 3) {
          onGeometryChange(removeVertex(geometry, selection.index));
          setSelection(null);
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [
    drawMode,
    cancelDrawing,
    selection,
    walls,
    openings,
    geometry,
    onGeometryChange,
  ]);

  // --- Abgeleitete Werte ----------------------------------------------------

  const areaM2 = useMemo(() => polygonAreaM2(walls), [walls]);
  const umfangM = useMemo(() => perimeterM(walls), [walls]);

  const selectedWallIndex =
    selection?.kind === "wall"
      ? walls.findIndex((w) => w.id === selection.id)
      : -1;
  const selectedWall = selectedWallIndex >= 0 ? walls[selectedWallIndex] : null;
  const selectedOpening =
    selection?.kind === "opening"
      ? (openings.find((o) => o.id === selection.id) ?? null)
      : null;

  const addOpening = (type: OpeningType) => {
    if (!selectedWall) return;
    const def = OPENING_DEFAULTS[type];
    const len = wallLength(selectedWall);
    const width = Math.min(def.widthMm, Math.max(len - 2 * GRID_MM, GRID_MM));
    const opening: EditorOpening = {
      id: neueId(),
      wallId: selectedWall.id,
      type,
      offsetMm: snapMm(Math.max(0, (len - width) / 2)),
      widthMm: width,
      heightMm: def.heightMm,
      bottomMm: def.bottomMm,
    };
    onGeometryChange({ walls, openings: [...openings, opening] });
    setSelection({ kind: "opening", id: opening.id });
  };

  const applyTemplate = (art: "rechteck" | "l-form") => {
    if (
      walls.length > 0 &&
      !window.confirm("Aktuellen Grundriss durch die Vorlage ersetzen?")
    ) {
      return;
    }
    const neu =
      art === "rechteck"
        ? rechteckWalls(3000, 2500)
        : lFormWalls(4000, 3000, 1600, 1200);
    onGeometryChange({ walls: neu, openings: [] });
    setSelection(null);
    fitDone.current = false;
  };

  const commitWallLength = (wallId: string, input: string) => {
    const mm = parseCmToMm(input);
    const idx = walls.findIndex((w) => w.id === wallId);
    setLabelEdit(null);
    if (mm === null || mm < GRID_MM || idx < 0) return;
    if (Math.abs(mm - wallLength(walls[idx])) < 0.5) return;
    updateWalls(setWallLength(walls, idx, mm));
  };

  // --- Rendering ------------------------------------------------------------

  return (
    <div className="flex h-full min-h-0 w-full">
      {/* Canvas */}
      <div
        ref={wrapRef}
        className="relative min-w-0 flex-1 overflow-hidden bg-[#f3f1ec] dark:bg-[#1a1815]"
      >
        <svg
          ref={svgRef}
          width={size.w}
          height={size.h}
          className={`block touch-none select-none ${
            drawMode ? "cursor-crosshair" : "cursor-default"
          }`}
          onPointerDown={onSvgPointerDown}
          onPointerMove={onSvgPointerMove}
          onPointerUp={onSvgPointerUp}
        >
          <GridDots size={size} view={view} />

          {/* Bodenfläche */}
          {walls.length > 0 && (
            <path
              d={
                walls
                  .map(
                    (w, i) =>
                      `${i === 0 ? "M" : "L"}${toScreen({ x: w.sx, y: w.sy }).x},${
                        toScreen({ x: w.sx, y: w.sy }).y
                      }`,
                  )
                  .join(" ") + " Z"
              }
              className="fill-amber-900/5 dark:fill-amber-100/5"
            />
          )}

          {/* Wände */}
          {walls.map((w, i) => {
            const n = outwardNormal(walls, i);
            const t = w.thicknessMm;
            const a = toScreen({ x: w.sx, y: w.sy });
            const b = toScreen({ x: w.ex, y: w.ey });
            const a2 = toScreen({ x: w.sx + n.x * t, y: w.sy + n.y * t });
            const b2 = toScreen({ x: w.ex + n.x * t, y: w.ey + n.y * t });
            const sel = selection?.kind === "wall" && selection.id === w.id;
            return (
              <g key={w.id}>
                <path
                  d={`M${a.x},${a.y} L${b.x},${b.y} L${b2.x},${b2.y} L${a2.x},${a2.y} Z`}
                  className={
                    sel
                      ? "fill-sky-600 stroke-sky-700"
                      : "fill-zinc-500/80 stroke-zinc-600 hover:fill-zinc-400 dark:fill-zinc-400/80 dark:hover:fill-zinc-300"
                  }
                  strokeWidth={1}
                  style={{ cursor: drawMode ? undefined : "move" }}
                  onPointerDown={(e) => {
                    if (drawMode) return;
                    setSelection({ kind: "wall", id: w.id });
                    setLabelEdit(null);
                    beginDrag(e, {
                      kind: "wall",
                      index: i,
                      startWorld: toWorld(screenPtOf(e)),
                      orig: geometry,
                      moved: false,
                    });
                  }}
                  onDoubleClick={(e) => {
                    if (drawMode) return;
                    e.stopPropagation();
                    const world = toWorld(screenPtOf(e));
                    const len = wallLength(w);
                    const tPos = Math.max(
                      0,
                      Math.min(1, alongWallMm(w, world) / Math.max(len, 1)),
                    );
                    onGeometryChange(insertVertex(geometry, i, tPos));
                  }}
                />
              </g>
            );
          })}

          {/* Öffnungen */}
          {openings.map((o) => {
            const wi = walls.findIndex((w) => w.id === o.wallId);
            if (wi < 0) return null;
            const w = walls[wi];
            const d = wallDir(w);
            const n = outwardNormal(walls, wi);
            const t = w.thicknessMm;
            const ax = w.sx + d.x * o.offsetMm;
            const ay = w.sy + d.y * o.offsetMm;
            const bx = ax + d.x * o.widthMm;
            const by = ay + d.y * o.widthMm;
            const A = toScreen({ x: ax, y: ay });
            const B = toScreen({ x: bx, y: by });
            const A2 = toScreen({ x: ax + n.x * t, y: ay + n.y * t });
            const B2 = toScreen({ x: bx + n.x * t, y: by + n.y * t });
            const sel =
              selection?.kind === "opening" && selection.id === o.id;
            const cls = sel
              ? "stroke-sky-600"
              : "stroke-zinc-600 dark:stroke-zinc-300";

            let glyph: ReactNode = null;
            if (o.type === "door") {
              // Türblatt + Aufschlag-Bogen nach innen
              const leaf = toScreen({
                x: ax - n.x * o.widthMm,
                y: ay - n.y * o.widthMm,
              });
              const cross = d.x * -n.y - d.y * -n.x;
              const sweep = cross > 0 ? 0 : 1;
              const r = o.widthMm * view.k;
              glyph = (
                <>
                  <line
                    x1={A.x}
                    y1={A.y}
                    x2={leaf.x}
                    y2={leaf.y}
                    className={cls}
                    strokeWidth={1.5}
                  />
                  <path
                    d={`M${B.x},${B.y} A${r},${r} 0 0 ${sweep} ${leaf.x},${leaf.y}`}
                    fill="none"
                    className={cls}
                    strokeWidth={1}
                    strokeDasharray="4 3"
                  />
                </>
              );
            } else if (o.type === "window") {
              const m1 = { x: (A.x + A2.x) / 2, y: (A.y + A2.y) / 2 };
              const m2 = { x: (B.x + B2.x) / 2, y: (B.y + B2.y) / 2 };
              glyph = (
                <line
                  x1={m1.x}
                  y1={m1.y}
                  x2={m2.x}
                  y2={m2.y}
                  className={cls}
                  strokeWidth={1.5}
                />
              );
            }

            return (
              <g
                key={o.id}
                style={{ cursor: "ew-resize" }}
                onPointerDown={(e) => {
                  if (drawMode) return;
                  setSelection({ kind: "opening", id: o.id });
                  setLabelEdit(null);
                  beginDrag(e, {
                    kind: "opening",
                    id: o.id,
                    startWorld: toWorld(screenPtOf(e)),
                    origOffset: o.offsetMm,
                    moved: false,
                  });
                }}
              >
                {/* Wandband unterbrechen */}
                <path
                  d={`M${A.x},${A.y} L${B.x},${B.y} L${B2.x},${B2.y} L${A2.x},${A2.y} Z`}
                  className="fill-[#f3f1ec] dark:fill-[#1a1815]"
                  stroke="none"
                />
                <path
                  d={`M${A.x},${A.y} L${B.x},${B.y} L${B2.x},${B2.y} L${A2.x},${A2.y} Z`}
                  fill="transparent"
                  className={cls}
                  strokeWidth={sel ? 2 : 1}
                  strokeDasharray={o.type === "niche" ? "5 3" : undefined}
                />
                {glyph}
              </g>
            );
          })}

          {/* Bemaßung */}
          {!drawMode &&
            walls.map((w, i) => {
              const len = wallLength(w);
              if (len < 50) return null;
              const n = outwardNormal(walls, i);
              const mid = wallMidpoint(w);
              const p = toScreen({
                x: mid.x + n.x * w.thicknessMm,
                y: mid.y + n.y * w.thicknessMm,
              });
              const lx = p.x + n.x * 16;
              const ly = p.y + n.y * 16;
              return (
                <text
                  key={`dim-${w.id}`}
                  x={lx}
                  y={ly}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  paintOrder="stroke"
                  className="cursor-pointer fill-zinc-700 stroke-[#f3f1ec] text-[11px] font-medium hover:fill-sky-700 dark:fill-zinc-200 dark:stroke-[#1a1815]"
                  strokeWidth={4}
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={(e) => {
                    // Erst im click-Event öffnen: beim pointerdown würde die
                    // anschließende Default-Action (Fokus auf body) dem
                    // autofokussierten Eingabefeld den Fokus wieder nehmen.
                    e.stopPropagation();
                    setSelection({ kind: "wall", id: w.id });
                    setLabelEdit({ wallId: w.id });
                  }}
                >
                  {formatCm(len)}
                </text>
              );
            })}

          {/* Eckpunkte */}
          {!drawMode &&
            walls.map((w, i) => {
              const p = toScreen({ x: w.sx, y: w.sy });
              const sel =
                selection?.kind === "vertex" && selection.index === i;
              return (
                <circle
                  key={`v-${w.id}`}
                  cx={p.x}
                  cy={p.y}
                  r={sel ? 7 : 5}
                  className={
                    sel
                      ? "fill-sky-600 stroke-white"
                      : "fill-white stroke-zinc-500 hover:fill-sky-100 dark:fill-zinc-800 dark:stroke-zinc-300"
                  }
                  strokeWidth={1.5}
                  style={{ cursor: "grab" }}
                  onPointerDown={(e) => {
                    if (drawMode) return;
                    setSelection({ kind: "vertex", index: i });
                    setLabelEdit(null);
                    beginDrag(e, {
                      kind: "vertex",
                      index: i,
                      startWorld: toWorld(screenPtOf(e)),
                      origPt: { x: w.sx, y: w.sy },
                      orig: geometry,
                      moved: false,
                    });
                  }}
                />
              );
            })}

          {/* Zeichnen-Vorschau */}
          {drawMode && (
            <DrawPreview
              draft={draft}
              cursorWorld={cursorWorld}
              toScreen={toScreen}
              orthoAssist={orthoAssist}
            />
          )}
        </svg>

        {/* Inline-Längeneingabe */}
        {labelEdit &&
          (() => {
            const idx = walls.findIndex((w) => w.id === labelEdit.wallId);
            if (idx < 0) return null;
            const w = walls[idx];
            const n = outwardNormal(walls, idx);
            const mid = wallMidpoint(w);
            const p = toScreen({
              x: mid.x + n.x * w.thicknessMm,
              y: mid.y + n.y * w.thicknessMm,
            });
            return (
              <input
                key={labelEdit.wallId}
                autoFocus
                defaultValue={(wallLength(w) / 10).toFixed(0)}
                onFocus={(e) => e.currentTarget.select()}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    commitWallLength(labelEdit.wallId, e.currentTarget.value);
                  }
                  if (e.key === "Escape") setLabelEdit(null);
                }}
                onBlur={(e) =>
                  commitWallLength(labelEdit.wallId, e.currentTarget.value)
                }
                className="absolute w-20 -translate-x-1/2 -translate-y-1/2 rounded-md border border-sky-500 bg-background px-2 py-1 text-center text-xs shadow-md outline-none"
                style={{ left: p.x + n.x * 16, top: p.y + n.y * 16 }}
              />
            );
          })()}

        {/* Leerer Zustand */}
        {walls.length === 0 && !drawMode && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
            <p className="text-sm opacity-60">
              Noch kein Grundriss – mit einer Vorlage starten oder frei
              zeichnen.
            </p>
            <div className="flex gap-2">
              <PanelButton onClick={() => applyTemplate("rechteck")}>
                Rechteck einfügen
              </PanelButton>
              <PanelButton onClick={() => applyTemplate("l-form")}>
                L-Form einfügen
              </PanelButton>
              <PanelButton onClick={startDrawing}>Frei zeichnen</PanelButton>
            </div>
          </div>
        )}

        {/* Hinweise */}
        <div className="pointer-events-none absolute bottom-3 left-3 rounded-md bg-background/80 px-3 py-1.5 text-xs opacity-70 backdrop-blur">
          {drawMode
            ? "Klicken setzt Ecken · Klick auf die erste Ecke schließt den Raum · Esc bricht ab"
            : "Scrollen: Zoom · Fläche ziehen: Ansicht verschieben · Doppelklick auf Wand: Ecke einfügen · Maßzahl anklicken: Länge ändern"}
        </div>
        {drawMode && (
          <div className="absolute right-3 top-3">
            <PanelButton onClick={cancelDrawing}>Abbrechen (Esc)</PanelButton>
          </div>
        )}
      </div>

      {/* Seitenpanel */}
      <aside className="flex w-72 shrink-0 flex-col gap-5 overflow-y-auto border-l border-foreground/10 bg-background p-4 text-sm">
        <section>
          <PanelHeading>Raum</PanelHeading>
          <div className="flex flex-col gap-2">
            <NumberField
              label="Raumhöhe"
              mmValue={ceilingHeightMm}
              onCommitMm={(mm) => onCeilingHeightChange(mm)}
            />
            <InfoRow label="Bodenfläche" value={formatM2(areaM2)} />
            <InfoRow
              label="Umfang"
              value={`${umfangM.toLocaleString("de-AT", {
                maximumFractionDigits: 2,
              })} m`}
            />
            <InfoRow label="Wände" value={String(walls.length)} />
          </div>
        </section>

        <section>
          <PanelHeading>Grundriss</PanelHeading>
          <div className="flex flex-wrap gap-2">
            <PanelButton onClick={() => applyTemplate("rechteck")}>
              Rechteck
            </PanelButton>
            <PanelButton onClick={() => applyTemplate("l-form")}>
              L-Form
            </PanelButton>
            <PanelButton
              onClick={() => {
                if (
                  walls.length === 0 ||
                  window.confirm(
                    "Aktuellen Grundriss verwerfen und neu zeichnen?",
                  )
                ) {
                  startDrawing();
                }
              }}
            >
              Neu zeichnen
            </PanelButton>
          </div>
        </section>

        {selectedWall && selection?.kind === "wall" && (
          <section>
            <PanelHeading>Wand</PanelHeading>
            <div className="flex flex-col gap-2">
              <NumberField
                key={`len-${selectedWall.id}-${Math.round(wallLength(selectedWall))}`}
                label="Länge"
                mmValue={wallLength(selectedWall)}
                onCommitMm={(mm) =>
                  updateWalls(setWallLength(walls, selectedWallIndex, mm))
                }
              />
              <NumberField
                key={`th-${selectedWall.id}`}
                label="Wandstärke"
                mmValue={selectedWall.thicknessMm}
                onCommitMm={(mm) =>
                  updateWalls(
                    walls.map((w) =>
                      w.id === selectedWall.id
                        ? { ...w, thicknessMm: Math.max(10, mm) }
                        : w,
                    ),
                  )
                }
              />
              <NumberField
                key={`h-${selectedWall.id}`}
                label="Höhe (leer = Raumhöhe)"
                mmValue={selectedWall.heightMm}
                optional
                onCommitMm={(mm) =>
                  updateWalls(
                    walls.map((w) =>
                      w.id === selectedWall.id ? { ...w, heightMm: mm } : w,
                    ),
                  )
                }
              />
              <div className="mt-1 flex flex-wrap gap-2">
                <PanelButton onClick={() => addOpening("door")}>
                  + Tür
                </PanelButton>
                <PanelButton onClick={() => addOpening("window")}>
                  + Fenster
                </PanelButton>
                <PanelButton onClick={() => addOpening("niche")}>
                  + Nische
                </PanelButton>
              </div>
              <PanelButton
                onClick={() =>
                  onGeometryChange(insertVertex(geometry, selectedWallIndex, 0.5))
                }
              >
                Ecke in der Mitte einfügen
              </PanelButton>
            </div>
          </section>
        )}

        {selection?.kind === "vertex" && (
          <section>
            <PanelHeading>Ecke</PanelHeading>
            <PanelButton
              disabled={walls.length <= 3}
              onClick={() => {
                onGeometryChange(removeVertex(geometry, selection.index));
                setSelection(null);
              }}
            >
              Ecke entfernen
            </PanelButton>
            {walls.length <= 3 && (
              <p className="mt-1 text-xs opacity-50">
                Ein Raum braucht mindestens 3 Ecken.
              </p>
            )}
          </section>
        )}

        {selectedOpening && (
          <section>
            <PanelHeading>
              {OPENING_DEFAULTS[selectedOpening.type].label}
            </PanelHeading>
            <div className="flex flex-col gap-2">
              <label className="flex items-center justify-between gap-2">
                <span className="opacity-70">Typ</span>
                <select
                  value={selectedOpening.type}
                  onChange={(e) =>
                    updateOpening(selectedOpening.id, {
                      type: e.target.value as OpeningType,
                    })
                  }
                  className="rounded-md border border-foreground/15 bg-background px-2 py-1"
                >
                  <option value="door">Tür</option>
                  <option value="window">Fenster</option>
                  <option value="niche">Nische</option>
                </select>
              </label>
              <NumberField
                key={`ow-${selectedOpening.id}`}
                label="Breite"
                mmValue={selectedOpening.widthMm}
                onCommitMm={(mm) =>
                  updateOpening(selectedOpening.id, { widthMm: mm })
                }
              />
              <NumberField
                key={`oh-${selectedOpening.id}`}
                label="Höhe"
                mmValue={selectedOpening.heightMm}
                onCommitMm={(mm) =>
                  updateOpening(selectedOpening.id, { heightMm: mm })
                }
              />
              <NumberField
                key={`ob-${selectedOpening.id}`}
                label="Unterkante (Brüstung)"
                mmValue={selectedOpening.bottomMm}
                onCommitMm={(mm) =>
                  updateOpening(selectedOpening.id, {
                    bottomMm: Math.max(0, mm),
                  })
                }
              />
              <NumberField
                key={`oo-${selectedOpening.id}-${selectedOpening.offsetMm}`}
                label="Abstand v. Wandanfang"
                mmValue={selectedOpening.offsetMm}
                onCommitMm={(mm) =>
                  updateOpening(selectedOpening.id, {
                    offsetMm: Math.max(0, mm),
                  })
                }
              />
              <PanelButton
                variant="danger"
                onClick={() => {
                  onGeometryChange({
                    walls,
                    openings: openings.filter(
                      (o) => o.id !== selectedOpening.id,
                    ),
                  });
                  setSelection(null);
                }}
              >
                Löschen
              </PanelButton>
            </div>
          </section>
        )}

        {!selection && walls.length > 0 && (
          <p className="text-xs leading-relaxed opacity-50">
            Wand, Ecke oder Öffnung anklicken, um Eigenschaften zu bearbeiten.
            Öffnungen lassen sich entlang der Wand ziehen, Wände senkrecht
            verschieben.
          </p>
        )}
      </aside>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Hilfskomponenten
// ---------------------------------------------------------------------------

function GridDots({ size, view }: { size: { w: number; h: number }; view: View }) {
  // Punktraster alle 50 cm (Welt), nur wenn nicht zu dicht
  const stepPx = 500 * view.k;
  if (stepPx < 18) return null;
  const x0 = ((view.ox % stepPx) + stepPx) % stepPx;
  const y0 = ((view.oy % stepPx) + stepPx) % stepPx;
  const cols = Math.ceil(size.w / stepPx) + 1;
  const rows = Math.ceil(size.h / stepPx) + 1;
  const dots = [];
  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      dots.push(
        <circle
          key={`${i}-${j}`}
          cx={x0 + i * stepPx}
          cy={y0 + j * stepPx}
          r={1}
          className="fill-foreground/15"
        />,
      );
    }
  }
  return <g>{dots}</g>;
}

function DrawPreview({
  draft,
  cursorWorld,
  toScreen,
  orthoAssist,
}: {
  draft: Pt[];
  cursorWorld: Pt | null;
  toScreen: (p: Pt) => Pt;
  orthoAssist: (prev: Pt | undefined, p: Pt) => Pt;
}) {
  const pts = draft.map(toScreen);
  const last = draft[draft.length - 1];
  const preview =
    cursorWorld && last
      ? toScreen(snapPt(orthoAssist(last, cursorWorld)))
      : null;
  return (
    <g>
      {pts.length > 0 && (
        <polyline
          points={pts.map((p) => `${p.x},${p.y}`).join(" ")}
          fill="none"
          className="stroke-sky-600"
          strokeWidth={2}
        />
      )}
      {preview && pts.length > 0 && (
        <>
          <line
            x1={pts[pts.length - 1].x}
            y1={pts[pts.length - 1].y}
            x2={preview.x}
            y2={preview.y}
            className="stroke-sky-400"
            strokeWidth={1.5}
            strokeDasharray="5 4"
          />
          {last && cursorWorld && (
            <text
              x={(pts[pts.length - 1].x + preview.x) / 2}
              y={(pts[pts.length - 1].y + preview.y) / 2 - 8}
              textAnchor="middle"
              className="fill-sky-700 text-[11px] font-medium dark:fill-sky-300"
            >
              {formatCm(
                Math.hypot(
                  snapPt(orthoAssist(last, cursorWorld)).x - last.x,
                  snapPt(orthoAssist(last, cursorWorld)).y - last.y,
                ),
              )}
            </text>
          )}
        </>
      )}
      {pts.map((p, i) => (
        <circle
          key={i}
          cx={p.x}
          cy={p.y}
          r={i === 0 ? 7 : 4}
          className={
            i === 0
              ? "fill-white stroke-sky-600 dark:fill-zinc-900"
              : "fill-sky-600"
          }
          strokeWidth={2}
        />
      ))}
    </g>
  );
}

function PanelHeading({ children }: { children: ReactNode }) {
  return (
    <h3 className="mb-2 text-xs font-medium uppercase tracking-wider opacity-50">
      {children}
    </h3>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="opacity-70">{label}</span>
      <span className="font-medium tabular-nums">{value}</span>
    </div>
  );
}

function PanelButton({
  children,
  onClick,
  disabled,
  variant,
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: "danger";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors disabled:opacity-40 ${
        variant === "danger"
          ? "border-red-600/30 text-red-700 hover:bg-red-600/10 dark:text-red-400"
          : "border-foreground/15 hover:bg-foreground/5"
      }`}
    >
      {children}
    </button>
  );
}

type NumberFieldProps = { label: string } & (
  | {
      optional: true;
      mmValue: number | null;
      onCommitMm: (mm: number | null) => void;
    }
  | { optional?: false; mmValue: number; onCommitMm: (mm: number) => void }
);

function NumberField(props: NumberFieldProps) {
  const { label, mmValue } = props;
  const commit = (raw: string) => {
    const trimmed = raw.trim();
    if (props.optional && trimmed === "") {
      if (props.mmValue !== null) props.onCommitMm(null);
      return;
    }
    const mm = parseCmToMm(trimmed);
    if (mm === null || mm < 0) return;
    // Unveränderte Werte nicht committen (würde nur "ungespeichert" auslösen).
    if (props.mmValue !== null && Math.abs(mm - props.mmValue) < 0.5) return;
    props.onCommitMm(mm);
  };
  return (
    <label className="flex items-center justify-between gap-2">
      <span className="opacity-70">{label}</span>
      <span className="flex items-center gap-1">
        <input
          type="text"
          inputMode="decimal"
          defaultValue={
            mmValue === null ? "" : (mmValue / 10).toFixed(1).replace(/\.0$/, "")
          }
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              commit(e.currentTarget.value);
              e.currentTarget.blur();
            }
          }}
          onBlur={(e) => commit(e.currentTarget.value)}
          className="w-20 rounded-md border border-foreground/15 bg-background px-2 py-1 text-right tabular-nums outline-none focus:border-foreground/40"
        />
        <span className="w-6 text-xs opacity-50">cm</span>
      </span>
    </label>
  );
}
