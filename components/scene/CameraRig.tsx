"use client";

import { useRef } from "react";
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
import { SLOTS_WITH_CARS } from "@/lib/cars";
import { selection } from "@/lib/selectionStore";
import { lookState, resetLook } from "@/lib/lookState";

/** Verschiebung der Draufsicht nach oben, in Metern. */
const PLAN_FRAMING_SHIFT = 1.5;
/** Luft um den Grundriss herum, damit er nicht am Bildrand klebt. */
const PLAN_MARGIN = 1.25;

/** Ab hier sind die Autos anklickbar, vorher stört das nur. */
export const INTERACTIVE_FROM = 0.9;

// Ausserhalb der Komponente, damit pro Frame nichts alloziert wird.
const position = new Vector3();
const target = new Vector3();
const focusPosition = new Vector3();
const focusTarget = new Vector3();
const forward = new Vector3();
const right = new Vector3();
const UP = new Vector3(0, 1, 0);

/** Leichte Parallaxe im Ruhezustand, damit der Blick nicht tot steht. */
const PARALLAX_YAW = 0.045;
const PARALLAX_PITCH = 0.022;

/** Stellplatz zu jedem Auto, für die Anfahrt beim Klick. */
const SLOT_BY_CAR = new Map(
  SLOTS_WITH_CARS.filter((slot) => slot.car).map((slot) => [
    slot.car!.id,
    slot,
  ]),
);

/**
 * Setzt die Kamera hart auf den Wert, der zu p gehört.
 * Kein lerp gegen Zielwerte: der Scrollwert ist die einzige Wahrheit,
 * sonst läuft die Kamera beim schnellen Scrollen nach.
 */
export default function CameraRig() {
  const camera = useThree((state) => state.camera) as PerspectiveCamera;
  const size = useThree((state) => state.size);
  /** Überblendung zwischen Fahrt und Nahansicht, 0 bis 1. */
  const focus = useRef(0);
  const lastFocused = useRef<(typeof SLOTS_WITH_CARS)[number] | null>(null);

  useFrame((_, delta) => {
    const p = scrollState.p;

    // Wer zurückscrollt, verlässt die Halle. Dann auch die Auswahl lösen.
    if (p < INTERACTIVE_FROM - 0.02 && selection.get()) selection.set(null);

    const selectedId = selection.get();
    const slot = selectedId ? SLOT_BY_CAR.get(selectedId) : undefined;
    if (slot) lastFocused.current = slot;

    // Zeitbasierte Überblendung. Die Anfahrt hängt bewusst nicht am Scroll,
    // sie ist eine Reaktion auf den Klick.
    const goal = slot ? 1 : 0;
    focus.current += (goal - focus.current) * Math.min(1, delta * 3.2);

    cameraPositionAt(p, position);
    cameraTargetAt(p, target);

    // Bildaufteilung der Draufsicht: die Halle rutscht ein Stück nach oben,
    // damit unten links Platz für Titel und Beschriftung bleibt.
    // Reine Kadrierung, kein Eingriff in den Verlauf der Fahrt.
    const framing = PLAN_FRAMING_SHIFT * (1 - smoothstep(0.12, 0.4, p));
    position.z += framing;
    target.z += framing;

    // Hochkant ist das waagerechte Sichtfeld winzig: bei 375 zu 812 bleiben
    // von 55 Grad senkrecht nur rund 27 Grad waagerecht übrig, man steht in
    // der Halle und sieht nichts. Zwei Gegenmittel, beide nur im Hochformat:
    // mehr Sichtfeld und ein Schritt zurück.
    const aspect = size.width / Math.max(1, size.height);
    const portrait = 1 - smoothstep(0.55, 1.1, aspect);

    const blend = smoothstep(0, 1, focus.current);
    const focused = lastFocused.current;
    if (blend > 0.001 && focused) {
      // Dreiviertelansicht aus der Mittelgasse, nicht ums Auto herum.
      focusPosition.set(
        focused.x + 2.3,
        1.55,
        focused.z - focused.side * 5.2,
      );
      focusTarget.set(focused.x, 0.8, focused.z);
      position.lerp(focusPosition, blend);
      target.lerp(focusTarget, blend);
    }

    if (portrait > 0.001) {
      const arriving = smoothstep(0.45, 0.95, p);
      // Rückwärts entlang der Blickachse, gewichtet nach Fortschritt:
      // die Draufsicht regelt sich schon über das Sichtfeld.
      forward.subVectors(position, target).normalize();
      position.addScaledVector(forward, 5.5 * portrait * arriving);
      // Etwas höher zielen. Sonst füllt der leere Boden davor das halbe
      // Hochformat, während oben die Lampenreihen aus dem Bild laufen.
      target.y += 0.55 * portrait * arriving;
    }

    // Umsehen in der Halle. Das Ziel folgt gedämpft, das ergibt den
    // schwebenden Nachlauf; die Kameraposition selbst bleibt, wo der
    // Scrollwert sie hinstellt.
    // Beim Anfahren eines Autos wird das Umsehen nur ausgeblendet, nicht
    // zurückgesetzt: nach dem Schließen steht der Blick wieder da, wo der
    // Besucher ihn gelassen hat. Zurückgesetzt wird erst beim Verlassen.
    const hallPhase = smoothstep(INTERACTIVE_FROM, 0.98, p);
    if (hallPhase < 0.001) resetLook();
    const inHall = hallPhase * (1 - blend);

    const damping = Math.min(1, delta * 3.5);
    lookState.yaw += (lookState.targetYaw - lookState.yaw) * damping;
    lookState.pitch += (lookState.targetPitch - lookState.pitch) * damping;

    const yaw =
      (lookState.yaw +
        (lookState.dragging ? 0 : lookState.pointerX * PARALLAX_YAW)) *
      inHall;
    const pitch =
      (lookState.pitch +
        (lookState.dragging ? 0 : -lookState.pointerY * PARALLAX_PITCH)) *
      inHall;

    if (Math.abs(yaw) > 1e-4 || Math.abs(pitch) > 1e-4) {
      forward.subVectors(target, position);
      const distance = forward.length();
      forward.applyAxisAngle(UP, yaw);
      right.crossVectors(forward, UP).normalize();
      forward.applyAxisAngle(right, pitch);
      target.copy(position).addScaledVector(forward.normalize(), distance);
    }

    camera.position.copy(position);
    camera.lookAt(target);

    // Auf schmalen Viewports passt die 40 m lange Halle in der Draufsicht
    // sonst nicht ins Bild. Nur dort wird das Sichtfeld aufgezogen, auf
    // Desktop-Seitenverhältnissen bleibt der Verlauf 35 -> 55 unangetastet.
    const needed = MathUtils.radToDeg(
      2 * Math.atan(HALL.length / 2 / Math.max(1, camera.position.y * aspect)),
    );
    const planPhase = 1 - smoothstep(0.3, 0.6, p);
    const pathFov = Math.min(
      75,
      Math.max(fovAt(p), needed * PLAN_MARGIN * planPhase),
    );
    // In der Nahansicht etwas enger, das nimmt die Verzerrung heraus.
    const focusFov = pathFov + (42 - pathFov) * blend;
    const fov = Math.min(82, focusFov * (1 + 0.3 * portrait));
    if (Math.abs(camera.fov - fov) > 0.01) {
      camera.fov = fov;
      camera.updateProjectionMatrix();
    }
  });

  return null;
}
