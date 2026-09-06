"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { FogExp2 } from "three";
import type { AmbientLight, DirectionalLight, Group } from "three";
import { smoothstep } from "@/lib/cameraPath";
import { scrollState } from "@/components/scroll/scrollState";
import { HALL } from "@/lib/hall";

const INK = "#0a0a0b";

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
    if (ambient.current) ambient.current.intensity = 2.2 - 1.7 * interior;
    if (plan.current) plan.current.intensity = 1.6 - 1.35 * interior;
    if (practicals.current) {
      const on = smoothstep(0.45, 0.95, p);
      practicals.current.visible = on > 0.01;
      for (const light of practicals.current.children) {
        // @ts-expect-error: alle Kinder sind PointLights
        light.intensity = 160 * on;
      }
    }

    fog.density = 0.022 * smoothstep(0.6, 1, p);
  });

  // Deckenstrahler in zwei Reihen, Vorstufe der RectAreaLights aus Phase 2.
  const lamps = useMemo(() => {
    const rows = [-6, 6];
    const columns = [-15, -7.5, 0, 7.5, 15];
    return rows.flatMap((z) => columns.map((x) => [x, HALL.eaves - 0.6, z]));
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
          <pointLight
            key={index}
            position={position as [number, number, number]}
            intensity={0}
            distance={26}
            decay={2}
            color="#ffd8a8"
          />
        ))}
      </group>
    </>
  );
}
