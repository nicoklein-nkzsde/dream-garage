"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { MathUtils, Vector3, type PerspectiveCamera } from "three";
import {
  cameraPositionAt,
  cameraTargetAt,
  fovAt,
  smoothstep,
} from "@/lib/cameraPath";
import { scrollState } from "@/components/scroll/scrollState";
import { HALL } from "@/lib/hall";

/** Verschiebung der Draufsicht nach oben, in Metern. */
const PLAN_FRAMING_SHIFT = 1.5;
/** Luft um den Grundriss herum, damit er nicht am Bildrand klebt. */
const PLAN_MARGIN = 1.25;

// Ausserhalb der Komponente, damit pro Frame nichts alloziert wird.
const position = new Vector3();
const target = new Vector3();

/**
 * Setzt die Kamera hart auf den Wert, der zu p gehört.
 * Kein lerp gegen Zielwerte: der Scrollwert ist die einzige Wahrheit,
 * sonst läuft die Kamera beim schnellen Scrollen nach.
 */
export default function CameraRig() {
  const camera = useThree((state) => state.camera) as PerspectiveCamera;
  const size = useThree((state) => state.size);

  useFrame(() => {
    const p = scrollState.p;

    cameraPositionAt(p, position);
    cameraTargetAt(p, target);

    // Bildaufteilung der Draufsicht: die Halle rutscht ein Stück nach oben,
    // damit unten links Platz für Titel und Beschriftung bleibt.
    // Reine Kadrierung, kein Eingriff in den Verlauf der Fahrt.
    const framing = PLAN_FRAMING_SHIFT * (1 - smoothstep(0.12, 0.4, p));
    position.z += framing;
    target.z += framing;

    camera.position.copy(position);
    camera.lookAt(target);

    // Auf schmalen Viewports passt die 40 m lange Halle in der Draufsicht
    // sonst nicht ins Bild. Nur dort wird das Sichtfeld aufgezogen, auf
    // Desktop-Seitenverhältnissen bleibt der Verlauf 35 -> 55 unangetastet.
    const aspect = size.width / Math.max(1, size.height);
    const needed = MathUtils.radToDeg(
      2 * Math.atan(HALL.length / 2 / Math.max(1, camera.position.y * aspect)),
    );
    const planPhase = 1 - smoothstep(0.3, 0.6, p);
    const fov = Math.min(
      75,
      Math.max(fovAt(p), needed * PLAN_MARGIN * planPhase),
    );
    if (Math.abs(camera.fov - fov) > 0.01) {
      camera.fov = fov;
      camera.updateProjectionMatrix();
    }
  });

  return null;
}
