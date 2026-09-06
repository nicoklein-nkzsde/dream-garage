"use client";

import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import CameraRig from "./CameraRig";
import Atmosphere from "./Atmosphere";
import PlaceholderHall from "./PlaceholderHall";
import DevBridge from "@/components/dev/DevBridge";

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
      >
        <color attach="background" args={["#0a0a0b"]} />
        <CameraRig />
        <Atmosphere />
        <DevBridge />
        <Suspense fallback={null}>
          <PlaceholderHall />
        </Suspense>
      </Canvas>
    </div>
  );
}
