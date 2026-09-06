"use client";

import { useEffect } from "react";
import { useThree } from "@react-three/fiber";
import { scrollState } from "@/components/scroll/scrollState";
import {
  PITCH_DOWN,
  PITCH_UP,
  YAW_LIMIT,
  lookState,
  resetLook,
} from "@/lib/lookState";
import { INTERACTIVE_FROM } from "./CameraRig";

/** Ab wie vielen Pixeln eine Bewegung als Ziehen und nicht als Klick gilt. */
const DRAG_THRESHOLD = 5;
const YAW_PER_PIXEL = 0.0022;
const PITCH_PER_PIXEL = 0.0018;

/**
 * Umsehen per Maus. Nur auf Zeigegeräten mit feiner Auflösung — auf
 * Touchgeräten würde das Ziehen mit dem Scrollen kollidieren, dafür kommt
 * in Phase 5 der eigene Renderpfad.
 */
export default function LookControls() {
  const canvas = useThree((state) => state.gl.domElement);

  useEffect(() => {
    if (!window.matchMedia("(pointer: fine)").matches) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let startX = 0;
    let startY = 0;
    let originYaw = 0;
    let originPitch = 0;

    const inHall = () => scrollState.p >= INTERACTIVE_FROM;

    const onPointerDown = (event: PointerEvent) => {
      if (event.button !== 0 || !inHall()) return;
      lookState.dragging = true;
      lookState.dragged = false;
      startX = event.clientX;
      startY = event.clientY;
      originYaw = lookState.targetYaw;
      originPitch = lookState.targetPitch;
      canvas.setPointerCapture(event.pointerId);
      canvas.style.cursor = "grabbing";
    };

    const onPointerMove = (event: PointerEvent) => {
      // Parallaxe im Ruhezustand: der Blick lebt ein wenig mit.
      const rect = canvas.getBoundingClientRect();
      lookState.pointerX = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      lookState.pointerY = ((event.clientY - rect.top) / rect.height) * 2 - 1;

      if (!lookState.dragging) {
        canvas.style.cursor = inHall() ? "grab" : "";
        return;
      }

      const dx = event.clientX - startX;
      const dy = event.clientY - startY;
      if (Math.hypot(dx, dy) > DRAG_THRESHOLD) {
        lookState.dragged = true;
        lookState.everDragged = true;
      }

      // Greif-Konvention wie in Karten und Modellbetrachtern: der Raum
      // folgt der Hand. Nach rechts ziehen dreht den Blick nach links.
      lookState.targetYaw = clamp(
        originYaw + dx * YAW_PER_PIXEL,
        -YAW_LIMIT,
        YAW_LIMIT,
      );
      lookState.targetPitch = clamp(
        originPitch + dy * PITCH_PER_PIXEL,
        PITCH_DOWN,
        PITCH_UP,
      );

      if (reduced) {
        // Ohne Bewegungswunsch kein Nachlauf, der Blick sitzt sofort.
        lookState.yaw = lookState.targetYaw;
        lookState.pitch = lookState.targetPitch;
      }
    };

    const onPointerUp = (event: PointerEvent) => {
      if (!lookState.dragging) return;
      lookState.dragging = false;
      canvas.style.cursor = inHall() ? "grab" : "";
      if (canvas.hasPointerCapture(event.pointerId)) {
        canvas.releasePointerCapture(event.pointerId);
      }
    };

    const onLeave = () => {
      lookState.pointerX = 0;
      lookState.pointerY = 0;
    };

    canvas.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    canvas.addEventListener("pointerleave", onLeave);
    return () => {
      canvas.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      canvas.removeEventListener("pointerleave", onLeave);
      canvas.style.cursor = "";
      resetLook();
    };
  }, [canvas]);

  return null;
}

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));
