"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { Group, MeshPhysicalMaterial } from "three";
import { buildCarGeometry } from "@/lib/carGeometry";
import type { Car as CarData } from "@/lib/cars";
import { hovered, selection } from "@/lib/selectionStore";
import { scrollState } from "@/components/scroll/scrollState";

const TYRE = "#111113";
const RIM = "#8b8b92";
const GLASS = "#151a21";

/** Wunschautos schweben als Drahtgitter über dem leeren Platz. */
const WISH_LIFT = 0.28;

type Props = {
  car: CarData;
  /** Drehung des Stellplatzes: 0 = Nase nach -Z, PI = Nase nach +Z. */
  rotation: number;
};

export default function Car({ car, rotation }: Props) {
  const group = useRef<Group>(null);
  const paint = useRef<MeshPhysicalMaterial>(null);
  const geometry = useMemo(() => buildCarGeometry(car), [car]);
  const isWish = car.status === "wishlist";

  useEffect(() => {
    return () => {
      geometry.body.dispose();
      geometry.roof.dispose();
      geometry.glass.dispose();
    };
  }, [geometry]);

  useFrame((_, delta) => {
    const material = paint.current;
    if (!material) return;
    const active =
      hovered.get() === car.id || selection.get() === car.id ? 1 : 0;
    // Zeitbasiert, nicht scrollbasiert: der Hover hängt nicht an der Fahrt.
    const step = Math.min(1, delta * 8);
    const goal = active * (isWish ? 1.1 : 0.4);
    material.emissiveIntensity += (goal - material.emissiveIntensity) * step;

    if (isWish && group.current) {
      // Leichtes Schweben, damit ein Wunschauto nicht wie geparkt wirkt.
      group.current.position.y =
        WISH_LIFT + Math.sin(scrollState.p * 4 + (car.slot ?? 0)) * 0.02;
    }
  });

  const { wheel } = geometry;

  return (
    <group
      ref={group}
      rotation-y={rotation}
      position-y={isWish ? WISH_LIFT : 0}
      onPointerOver={(event) => {
        if (scrollState.p < 0.9) return;
        event.stopPropagation();
        hovered.set(car.id);
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={() => {
        if (hovered.get() === car.id) hovered.set(null);
        document.body.style.cursor = "";
      }}
      onClick={(event) => {
        if (scrollState.p < 0.9) return;
        event.stopPropagation();
        selection.set(car.id);
      }}
    >
      {/* Karosserie: die Seitenansicht liegt in X/Y, extrudiert in Z. */}
      <group rotation-y={Math.PI / 2}>
        <mesh geometry={geometry.body} castShadow>
          <meshPhysicalMaterial
            ref={paint}
            color={car.accent}
            emissive={car.accent}
            emissiveIntensity={0}
            metalness={isWish ? 0 : 0.55}
            roughness={isWish ? 1 : 0.32}
            clearcoat={isWish ? 0 : 1}
            clearcoatRoughness={0.06}
            wireframe={isWish}
            transparent={isWish}
            opacity={isWish ? 0.55 : 1}
          />
        </mesh>

        {/* Dachhaus in Wagenfarbe … */}
        <mesh geometry={geometry.roof}>
          <meshPhysicalMaterial
            color={car.accent}
            metalness={isWish ? 0 : 0.55}
            roughness={isWish ? 1 : 0.32}
            clearcoat={isWish ? 0 : 1}
            clearcoatRoughness={0.06}
            wireframe={isWish}
            transparent={isWish}
            opacity={isWish ? 0.5 : 1}
          />
        </mesh>

        {/* … und die eingesetzte Verglasung. */}
        {!isWish && (
          <mesh geometry={geometry.glass}>
            <meshPhysicalMaterial
              color={GLASS}
              metalness={0.85}
              roughness={0.06}
              clearcoat={1}
            />
          </mesh>
        )}

        {!isWish &&
          [-1, 1].map((front) =>
            [-1, 1].map((side) => (
              <group
                key={`${front}${side}`}
                position={[front * wheel.axleX, wheel.radius, side * wheel.offsetZ]}
                rotation-x={Math.PI / 2}
              >
                <mesh>
                  <cylinderGeometry
                    args={[wheel.radius, wheel.radius, wheel.width, 22]}
                  />
                  <meshStandardMaterial color={TYRE} roughness={0.92} />
                </mesh>
                <mesh position-y={side * 0.012}>
                  <cylinderGeometry
                    args={[
                      wheel.radius * 0.62,
                      wheel.radius * 0.62,
                      wheel.width * 1.02,
                      20,
                    ]}
                  />
                  <meshStandardMaterial
                    color={RIM}
                    metalness={0.9}
                    roughness={0.28}
                  />
                </mesh>
              </group>
            )),
          )}
      </group>
    </group>
  );
}
