"use client";

import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import CameraRig from "./CameraRig";
import Atmosphere from "./Atmosphere";
import PlaceholderHall from "./PlaceholderHall";
import Cars from "./Cars";
import LookControls from "./LookControls";
import DevBridge from "@/components/dev/DevBridge";
import { selection } from "@/lib/selectionStore";
import { detectQuality } from "@/lib/device";

/**
 * Der Canvas liegt fixed hinter der Seite. Die HTML-Sektionen scrollen
 * darüber und steuern über p die Kamera.
 */
export default function GarageScene() {
  const quality = detectQuality();

  return (
    <div className="fixed inset-0 z-0" aria-hidden="true">
      <Canvas
        // Auf schwachen Geräten weniger Pixel und kein Kantenglätten.
        // Das kostet die Halle nichts, sie hat kaum harte Kanten.
        dpr={quality === "high" ? [1, 2] : [1, 1.5]}
        gl={{
          antialias: quality === "high",
          powerPreference: "high-performance",
          // Nur im Dev-Build, damit sich der Canvas auslesen lässt.
          preserveDrawingBuffer: process.env.NODE_ENV !== "production",
        }}
        // Etwas unter 1: die Halle soll dunkel bleiben, nicht ausgewaschen.
        onCreated={({ gl }) => {
          gl.toneMappingExposure = 0.9;
        }}
        camera={{ fov: 35, near: 0.1, far: 400, position: [0, 45, 0.1] }}
        // Klick ins Leere schließt das Panel wieder.
        onPointerMissed={() => selection.set(null)}
      >
        <color attach="background" args={["#0a0a0b"]} />
        <CameraRig />
        <LookControls />
        <Atmosphere />
        <DevBridge />
        <Suspense fallback={null}>
          <PlaceholderHall />
          <Cars />
        </Suspense>
      </Canvas>
    </div>
  );
}
