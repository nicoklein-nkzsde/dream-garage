"use client";

import { useEffect } from "react";
import { useThree } from "@react-three/fiber";

/**
 * Nur im Dev-Build: macht den Renderer von außen ansteuerbar, damit sich
 * einzelne Punkte der Fahrt gezielt rendern und abspeichern lassen.
 */
export default function DevBridge() {
  const advance = useThree((state) => state.advance);
  const gl = useThree((state) => state.gl);

  useEffect(() => {
    if (process.env.NODE_ENV === "production") return;
    const target = window as unknown as Record<string, unknown>;
    target.__advance = (time: number) => advance(time);
    target.__canvas = gl.domElement;
    return () => {
      delete target.__advance;
      delete target.__canvas;
    };
  }, [advance, gl]);

  return null;
}
