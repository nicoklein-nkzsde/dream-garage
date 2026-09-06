"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { FogExp2, Object3D } from "three";
import type { AmbientLight, DirectionalLight, Group, SpotLight } from "three";
import { smoothstep } from "@/lib/cameraPath";
import { scrollState } from "@/components/scroll/scrollState";
import { HALL } from "@/lib/hall";

const INK = "#0a0a0b";

// Lichtreihen liegen über den Fahrzeugreihen.
const ROW_LIGHT_FRONT = 2.5;
const ROW_LIGHT_BACK = -7.4;

/**
 * Licht und Nebel hängen am selben p wie die Kamera.
 * Draufsicht: flach und gleichmäßig wie ein technischer Plan.
 * Innenraum: warm, gerichtet, mit Nebel für Tiefe ab p > 0.6.
 */
export default function Atmosphere() {
  const scene = useThree((state) => state.scene);
  const ambient = useRef<AmbientLight>(null);
  const plan = useRef<DirectionalLight>(null);
  const practicals = useRef<Group>(null);

  const fog = useMemo(() => new FogExp2(INK, 0), []);

  useEffect(() => {
    scene.fog = fog;
    return () => {
      scene.fog = null;
    };
  }, [scene, fog]);

  useFrame(() => {
    const p = scrollState.p;

    // Planlicht runter, Hallenlicht hoch.
    const interior = smoothstep(0.4, 1, p);
    if (ambient.current) ambient.current.intensity = 2.2 - 2.02 * interior;
    if (plan.current) plan.current.intensity = 1.6 - 1.52 * interior;
    if (practicals.current) {
      const on = smoothstep(0.45, 0.95, p);
      practicals.current.visible = on > 0.01;
      for (const child of practicals.current.children) {
        const light = child as SpotLight;
        if (light.isSpotLight) light.intensity = 150 * on;
      }
    }

    fog.density = 0.022 * smoothstep(0.6, 1, p);
  });

  // Deckenstrahler über den Reihen, Vorstufe der RectAreaLights aus Phase 2.
  const lamps = useMemo(() => {
    const rows = [ROW_LIGHT_FRONT, ROW_LIGHT_BACK];
    const columns = [-15, -7.5, 0, 7.5, 15];
    return rows.flatMap((z) => columns.map((x) => [x, HALL.eaves - 0.5, z]));
  }, []);

  return (
    <>
      <ambientLight ref={ambient} intensity={2.2} />
      <directionalLight
        ref={plan}
        position={[0, 60, 8]}
        intensity={1.6}
        color="#cfd6e0"
      />
      <group ref={practicals} visible={false}>
        {lamps.map((position, index) => (
          <SpotDown key={index} position={position as [number, number, number]} />
        ))}
      </group>
    </>
  );
}

/**
 * Strahler, der nach unten leuchtet. Ein Punktlicht direkt unter dem Dach
 * würde vor allem die Dachschräge anstrahlen, nicht den Boden.
 */
function SpotDown({ position }: { position: [number, number, number] }) {
  // Das Ziel muss im Szenengraph hängen, sonst rechnet three die Richtung
  // gegen den Ursprung und alle Strahler zeigen zur Hallenmitte.
  const target = useMemo(() => new Object3D(), []);

  return (
    <>
      <primitive object={target} position={[position[0], 0, position[2]]} />
      <spotLight
        position={position}
        target={target}
        intensity={0}
        distance={22}
        decay={2}
        angle={1.02}
        penumbra={0.75}
        color="#ffe0bb"
      />
      {/* Sichtbares Gehäuse, sonst schwebt das Licht im Nichts. */}
      <mesh position={[position[0], position[1] + 0.12, position[2]]}>
        <boxGeometry args={[1.6, 0.1, 0.28]} />
        <meshStandardMaterial
          color="#ffe6c8"
          emissive="#ffe0bb"
          emissiveIntensity={1.4}
          toneMapped={false}
        />
      </mesh>
    </>
  );
}
