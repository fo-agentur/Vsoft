import {
  DEFAULT_WALL_THICKNESS_MM,
  GRID_MM,
  type EditorOpening,
  type EditorWall,
  type Pt,
  type RoomGeometry,
} from "./types";

/**
 * Reine Geometrie-Operationen auf dem Wandzug.
 * Invariante: walls bildet einen geschlossenen Polygonzug,
 * walls[i].end === walls[(i+1) % n].start. Alle Operationen erhalten sie.
 */

export function neueId(): string {
  return crypto.randomUUID();
}

export function wallLength(w: EditorWall): number {
  return Math.hypot(w.ex - w.sx, w.ey - w.sy);
}

export function wallDir(w: EditorWall): Pt {
  const len = wallLength(w);
  if (len < 1e-9) return { x: 1, y: 0 };
  return { x: (w.ex - w.sx) / len, y: (w.ey - w.sy) / len };
}

export function wallMidpoint(w: EditorWall): Pt {
  return { x: (w.sx + w.ex) / 2, y: (w.sy + w.ey) / 2 };
}

export function vertices(walls: EditorWall[]): Pt[] {
  return walls.map((w) => ({ x: w.sx, y: w.sy }));
}

/** Doppelte vorzeichenbehaftete Fläche (Shoelace, y-down-Koordinaten). */
function signedArea2(walls: EditorWall[]): number {
  let a = 0;
  for (const w of walls) a += w.sx * w.ey - w.ex * w.sy;
  return a;
}

export function polygonAreaM2(walls: EditorWall[]): number {
  return Math.abs(signedArea2(walls)) / 2 / 1_000_000;
}

export function perimeterM(walls: EditorWall[]): number {
  return walls.reduce((s, w) => s + wallLength(w), 0) / 1000;
}

/** Nach außen zeigende Einheitsnormale der Wand i. */
export function outwardNormal(walls: EditorWall[], i: number): Pt {
  const d = wallDir(walls[i]);
  // signedArea2 > 0 → Innenfläche liegt links der Laufrichtung (im
  // y-down-System entspricht das (-dy, dx)); außen ist die Gegenseite.
  return signedArea2(walls) > 0
    ? { x: d.y, y: -d.x }
    : { x: -d.y, y: d.x };
}

export function snapMm(v: number, grid: number = GRID_MM): number {
  return Math.round(v / grid) * grid;
}

export function snapPt(p: Pt, grid: number = GRID_MM): Pt {
  return { x: snapMm(p.x, grid), y: snapMm(p.y, grid) };
}

function clonWalls(walls: EditorWall[]): EditorWall[] {
  return walls.map((w) => ({ ...w }));
}

/** Verschiebt Eckpunkt vi (Start von Wand vi, Ende von Wand vi-1). */
export function moveVertex(
  walls: EditorWall[],
  vi: number,
  x: number,
  y: number,
): EditorWall[] {
  const n = walls.length;
  const next = clonWalls(walls);
  next[vi].sx = x;
  next[vi].sy = y;
  next[(vi - 1 + n) % n].ex = x;
  next[(vi - 1 + n) % n].ey = y;
  return next;
}

/** Verschiebt Wand i senkrecht zu sich selbst ("Wand schieben"). */
export function moveWallPerp(
  walls: EditorWall[],
  i: number,
  deltaMm: number,
): EditorWall[] {
  const n = outwardNormal(walls, i);
  const dx = n.x * deltaMm;
  const dy = n.y * deltaMm;
  const w = walls[i];
  let next = moveVertex(walls, i, w.sx + dx, w.sy + dy);
  next = moveVertex(next, (i + 1) % next.length, w.ex + dx, w.ey + dy);
  return next;
}

/**
 * Setzt die Länge von Wand i. Der Endpunkt wandert entlang der
 * Wandrichtung; nachfolgende Ecken werden mitverschoben, bis eine
 * (anti)parallele Wand die Längenänderung aufnehmen kann – bei
 * rechtwinkligen Räumen bleibt der Grundriss dadurch rechtwinklig.
 * Gibt es keine solche Wand, klappt nur die Folgewand mit (Scharnier).
 */
export function setWallLength(
  walls: EditorWall[],
  i: number,
  newLenMm: number,
): EditorWall[] {
  const n = walls.length;
  const len = wallLength(walls[i]);
  if (len < 1 || newLenMm < GRID_MM) return walls;
  const dir = wallDir(walls[i]);
  const delta = newLenMm - len;
  if (Math.abs(delta) < 1e-6) return walls;

  // Absorber suchen: erste Wand nach i mit entgegengesetzter Richtung.
  let absorber = -1;
  for (let k = 1; k < n; k++) {
    const j = (i + k) % n;
    const dj = wallDir(walls[j]);
    if (dj.x * dir.x + dj.y * dir.y < -0.999) {
      absorber = j;
      break;
    }
  }

  let next = clonWalls(walls);
  if (absorber === -1) {
    // Scharnier-Fallback: nur den gemeinsamen Eckpunkt verschieben.
    const vi = (i + 1) % n;
    return moveVertex(
      next,
      vi,
      walls[i].sx + dir.x * newLenMm,
      walls[i].sy + dir.y * newLenMm,
    );
  }

  // Ecken (Start von Wand i+1 … absorber) um delta entlang dir verschieben.
  let k = (i + 1) % n;
  for (;;) {
    next = moveVertex(
      next,
      k,
      next[k].sx + dir.x * delta,
      next[k].sy + dir.y * delta,
    );
    if (k === absorber) break;
    k = (k + 1) % n;
  }
  return next;
}

/** Teilt Wand wallIdx am Parameter t (0..1) und fügt eine Ecke ein. */
export function insertVertex(
  geom: RoomGeometry,
  wallIdx: number,
  t: number,
): RoomGeometry {
  const walls = clonWalls(geom.walls);
  const w = walls[wallIdx];
  const tt = Math.min(Math.max(t, 0.05), 0.95);
  const px = snapMm(w.sx + (w.ex - w.sx) * tt);
  const py = snapMm(w.sy + (w.ey - w.sy) * tt);
  const splitLen = Math.hypot(px - w.sx, py - w.sy);

  const zweite: EditorWall = {
    id: neueId(),
    sx: px,
    sy: py,
    ex: w.ex,
    ey: w.ey,
    thicknessMm: w.thicknessMm,
    heightMm: w.heightMm,
  };
  w.ex = px;
  w.ey = py;
  walls.splice(wallIdx + 1, 0, zweite);

  // Öffnungen auf die beiden Teilstücke verteilen.
  const openings = geom.openings.map((o) => {
    if (o.wallId !== w.id) return o;
    if (o.offsetMm + o.widthMm <= splitLen + 1) return o;
    if (o.offsetMm >= splitLen - 1) {
      return { ...o, wallId: zweite.id, offsetMm: o.offsetMm - splitLen };
    }
    // Öffnung läge über der neuen Ecke → auf erstes Teilstück klemmen.
    return {
      ...o,
      offsetMm: Math.max(0, Math.min(o.offsetMm, splitLen - o.widthMm)),
    };
  });

  return { walls, openings: clampOpenings({ walls, openings }) };
}

/** Entfernt Eckpunkt vi (verschmilzt Wand vi-1 mit Wand vi). */
export function removeVertex(geom: RoomGeometry, vi: number): RoomGeometry {
  const n = geom.walls.length;
  if (n <= 3) return geom;
  const walls = clonWalls(geom.walls);
  const prevIdx = (vi - 1 + n) % n;
  const prev = walls[prevIdx];
  const entfernte = walls[vi];
  const prevLen = wallLength(prev);
  prev.ex = entfernte.ex;
  prev.ey = entfernte.ey;
  walls.splice(vi, 1);

  const openings = geom.openings.map((o) =>
    o.wallId === entfernte.id
      ? { ...o, wallId: prev.id, offsetMm: o.offsetMm + prevLen }
      : o,
  );

  return { walls, openings: clampOpenings({ walls, openings }) };
}

/** Klemmt alle Öffnungen in die Grenzen ihrer Wand (nach Geometrieänderungen). */
export function clampOpenings(geom: RoomGeometry): EditorOpening[] {
  return geom.openings.map((o) => {
    const wall = geom.walls.find((w) => w.id === o.wallId);
    if (!wall) return o;
    const len = wallLength(wall);
    const width = Math.min(o.widthMm, Math.max(len, GRID_MM));
    const offset = Math.max(0, Math.min(o.offsetMm, len - width));
    if (width === o.widthMm && offset === o.offsetMm) return o;
    return { ...o, widthMm: width, offsetMm: offset };
  });
}

/** Position eines Punkts entlang einer Wand als Distanz vom Wandanfang. */
export function alongWallMm(w: EditorWall, p: Pt): number {
  const d = wallDir(w);
  return (p.x - w.sx) * d.x + (p.y - w.sy) * d.y;
}

export function distToSegment(p: Pt, a: Pt, b: Pt): number {
  const abx = b.x - a.x;
  const aby = b.y - a.y;
  const l2 = abx * abx + aby * aby;
  if (l2 < 1e-9) return Math.hypot(p.x - a.x, p.y - a.y);
  let t = ((p.x - a.x) * abx + (p.y - a.y) * aby) / l2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(p.x - (a.x + t * abx), p.y - (a.y + t * aby));
}

export function boundingBox(
  walls: EditorWall[],
): { minX: number; minY: number; maxX: number; maxY: number } | null {
  if (walls.length === 0) return null;
  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;
  for (const w of walls) {
    minX = Math.min(minX, w.sx, w.ex);
    minY = Math.min(minY, w.sy, w.ey);
    maxX = Math.max(maxX, w.sx, w.ex);
    maxY = Math.max(maxY, w.sy, w.ey);
  }
  return { minX, minY, maxX, maxY };
}

/** Baut aus einem geschlossenen Punktzug einen Wandzug. */
export function wallsFromPolygon(
  points: Pt[],
  thicknessMm: number = DEFAULT_WALL_THICKNESS_MM,
): EditorWall[] {
  return points.map((p, i) => {
    const q = points[(i + 1) % points.length];
    return {
      id: neueId(),
      sx: p.x,
      sy: p.y,
      ex: q.x,
      ey: q.y,
      thicknessMm,
      heightMm: null,
    };
  });
}

// ---------------------------------------------------------------------------
// Formatierung (Anzeige in cm, deutsch)
// ---------------------------------------------------------------------------

export function formatCm(mm: number): string {
  const cm = mm / 10;
  return `${cm.toLocaleString("de-AT", { maximumFractionDigits: 1 })} cm`;
}

export function formatM2(m2: number): string {
  return `${m2.toLocaleString("de-AT", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 2,
  })} m²`;
}

/** "245", "245,5" oder "245.5" (cm) → mm; null bei Unfug. */
export function parseCmToMm(input: string): number | null {
  const v = Number.parseFloat(input.trim().replace(",", "."));
  if (!Number.isFinite(v)) return null;
  return Math.round(v * 10);
}
