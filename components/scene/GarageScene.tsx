"use client";

import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import CameraRig from "./CameraRig";
import Atmosphere from "./Atmosphere";
import PlaceholderHall from "./PlaceholderHall";
import Cars from "./Cars";
import DevBridge from "@/components/dev/DevBridge";
import { selection } from "@/lib/selectionStore";

/**
 * Der Canvas liegt fixed hinter der Seite. Die HTML-Sektionen scrollen
 * darüber und steuern über p die Kamera.
 */
export default function GarageScene() {
  return (
    <div className="fixed inset-0 z-0" aria-hidden="true">
      <Canvas
        dpr={[1, 2]}
        gl={{
          antialias: true,
          powerPreference: "high-performance",
          // Nur im Dev-Build, damit sich der Canvas auslesen lässt.
          preserveDrawingBuffer: process.env.NODE_ENV !== "production",
        }}
        camera={{ fov: 35, near: 0.1, far: 400, position: [0, 45, 0.1] }}
        // Klick ins Leere schließt das Panel wieder.
        onPointerMissed={() => selection.set(null)}
      >
        <color attach="background" args={["#0a0a0b"]} />
        <CameraRig />
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
