"use client";

import { useEffect, useMemo } from "react";
import { useGLTF } from "@react-three/drei";
import { Box3, Vector3, type Group, type Mesh } from "three";
import type { Car } from "@/lib/cars";
import { assetUrl } from "@/lib/assets";

/**
 * Fertiges Fahrzeugmodell aus einer GLB-Datei.
 *
 * Das Modell wird auf die in cars.json hinterlegte Länge skaliert, auf
 * dem Stellplatz zentriert und auf den Boden gesetzt. Damit passt jedes
 * Modell ohne Nacharbeit in die Halle, egal in welchen Einheiten und um
 * welchen Ursprung es exportiert wurde.
 */
export default function CarModel({ car }: { car: Car & { model3d: string } }) {
  const { scene } = useGLTF(assetUrl(car.model3d));

  const model = useMemo(() => {
    const clone = scene.clone(true) as Group;

    // Erst messen, dann auf die echte Länge bringen.
    const box = new Box3().setFromObject(clone);
    const size = box.getSize(new Vector3());
    const longest = Math.max(size.x, size.z);
    if (longest > 0) {
      const scale = car.dimensions.length / longest;
      clone.scale.setScalar(scale);
    }

    // Wenn das Modell quer liegt, in die Fahrtrichtung drehen.
    if (size.x > size.z) clone.rotation.y = Math.PI / 2;

    // Neu messen und auf dem Boden mittig absetzen.
    const placed = new Box3().setFromObject(clone);
    const center = placed.getCenter(new Vector3());
    clone.position.x -= center.x;
    clone.position.z -= center.z;
    clone.position.y -= placed.min.y;

    clone.traverse((child) => {
      const mesh = child as Mesh;
      if (mesh.isMesh) mesh.castShadow = true;
    });
    return clone;
  }, [scene, car.dimensions.length]);

  useEffect(() => {
    return () => {
      model.clear();
    };
  }, [model]);

  return <primitive object={model} />;
}
