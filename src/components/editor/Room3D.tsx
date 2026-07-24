"use client";

import { useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import type { EditorOpening, EditorWall, RoomGeometry } from "@/lib/editor/types";
import { boundingBox, wallDir, wallLength } from "@/lib/editor/geometry";

/**
 * 3D-Ansicht des Raums (Roadmap Schritt 4).
 * Baut aus dem 2D-Wandzug eine Three.js-Szene: Boden als Polygon, Wände als
 * extrudierte Flächen mit echten Öffnungs-Ausschnitten (Tür/Fenster/Nische),
 * Orbit-Kamera. Editor-Koordinaten sind mm, y nach unten → 3D: Meter, y-up,
 * Editor-y wird zur Welt-z.
 */

const M = (mm: number) => mm / 1000;

const FARBE_WAND = "#e7e3da";
const FARBE_BODEN = "#cdd2d8";

function WandMesh({
  wall,
  openings,
  ceilingHeightMm,
}: {
  wall: EditorWall;
  openings: EditorOpening[];
  ceilingHeightMm: number;
}) {
  const { geometry, position, quaternion } = useMemo(() => {
    const len = wallLength(wall);
    const h = wall.heightMm ?? ceilingHeightMm;
    const th = wall.thicknessMm;
    const unten = -50; // Wand 50 mm unter den Boden ziehen → Tür-Ausschnitte berühren keine Kante

    const shape = new THREE.Shape();
    shape.moveTo(0, unten);
    shape.lineTo(len, unten);
    shape.lineTo(len, h);
    shape.lineTo(0, h);
    shape.closePath();

    for (const o of openings) {
      const x0 = Math.max(1, o.offsetMm);
      const x1 = Math.min(len - 1, o.offsetMm + o.widthMm);
      const y0 = Math.max(unten + 1, o.bottomMm);
      const y1 = Math.min(h - 1, o.bottomMm + o.heightMm);
      if (x1 - x0 < 2 || y1 - y0 < 2) continue;
      const loch = new THREE.Path();
      loch.moveTo(x0, y0);
      loch.lineTo(x1, y0);
      loch.lineTo(x1, y1);
      loch.lineTo(x0, y1);
      loch.closePath();
      shape.holes.push(loch);
    }

    const geom = new THREE.ExtrudeGeometry(shape, { depth: th, bevelEnabled: false });
    geom.scale(1 / 1000, 1 / 1000, 1 / 1000);

    const dir = wallDir(wall);
    const xAxis = new THREE.Vector3(dir.x, 0, dir.y);
    const yAxis = new THREE.Vector3(0, 1, 0);
    const zAxis = new THREE.Vector3(dir.y, 0, -dir.x);
    const mat = new THREE.Matrix4().makeBasis(xAxis, yAxis, zAxis);
    const q = new THREE.Quaternion().setFromRotationMatrix(mat);
    const pos = new THREE.Vector3(
      M(wall.sx) - zAxis.x * M(th) / 2,
      0,
      M(wall.sy) - zAxis.z * M(th) / 2,
    );
    return { geometry: geom, position: pos, quaternion: q };
  }, [wall, openings, ceilingHeightMm]);

  return (
    <mesh geometry={geometry} position={position} quaternion={quaternion} castShadow receiveShadow>
      <meshStandardMaterial color={FARBE_WAND} roughness={0.9} side={THREE.DoubleSide} />
    </mesh>
  );
}

function Boden({ walls }: { walls: EditorWall[] }) {
  const geometry = useMemo(() => {
    const shape = new THREE.Shape();
    walls.forEach((w, i) => {
      if (i === 0) shape.moveTo(M(w.sx), M(w.sy));
      else shape.lineTo(M(w.sx), M(w.sy));
    });
    shape.closePath();
    return new THREE.ShapeGeometry(shape);
  }, [walls]);

  return (
    <mesh geometry={geometry} rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
      <meshStandardMaterial color={FARBE_BODEN} roughness={0.95} side={THREE.DoubleSide} />
    </mesh>
  );
}

function Szene({ geometry, ceilingHeightMm }: { geometry: RoomGeometry; ceilingHeightMm: number }) {
  const openingsByWall = useMemo(() => {
    const map = new Map<string, EditorOpening[]>();
    for (const o of geometry.openings) {
      const list = map.get(o.wallId) ?? [];
      list.push(o);
      map.set(o.wallId, list);
    }
    return map;
  }, [geometry.openings]);

  return (
    <>
      <Boden walls={geometry.walls} />
      {geometry.walls.map((w) => (
        <WandMesh key={w.id} wall={w} openings={openingsByWall.get(w.id) ?? []} ceilingHeightMm={ceilingHeightMm} />
      ))}
    </>
  );
}

export default function Room3D({
  geometry,
  ceilingHeightMm,
}: {
  geometry: RoomGeometry;
  ceilingHeightMm: number;
}) {
  const { camPos, target } = useMemo(() => {
    const bb = boundingBox(geometry.walls);
    if (!bb) {
      return { camPos: [5, 4, 5] as [number, number, number], target: [0, 1, 0] as [number, number, number] };
    }
    const cx = M((bb.minX + bb.maxX) / 2);
    const cz = M((bb.minY + bb.maxY) / 2);
    const w = M(bb.maxX - bb.minX);
    const d = M(bb.maxY - bb.minY);
    const dim = Math.max(w, d, 2);
    const y = M(ceilingHeightMm) * 1.1 + dim * 0.7;
    return {
      camPos: [cx + dim * 0.95, y, cz + dim * 0.95] as [number, number, number],
      target: [cx, M(ceilingHeightMm) * 0.35, cz] as [number, number, number],
    };
  }, [geometry.walls, ceilingHeightMm]);

  return (
    <Canvas
      shadows
      camera={{ position: camPos, fov: 50, near: 0.05, far: 200 }}
      style={{ width: "100%", height: "100%", background: "#f4f5f7" }}
    >
      <ambientLight intensity={0.75} />
      <hemisphereLight args={["#ffffff", "#b9bfc7", 0.5]} />
      <directionalLight
        position={[target[0] + 6, 12, target[2] + 4]}
        intensity={1.1}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      <Szene geometry={geometry} ceilingHeightMm={ceilingHeightMm} />
      <OrbitControls makeDefault target={target} enableDamping />
    </Canvas>
  );
}
