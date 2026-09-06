"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { MeshPhysicalMaterial } from "three";
import { buildCarGeometry } from "@/lib/carGeometry";
import type { Car as CarData } from "@/lib/cars";
import { hovered, selection } from "@/lib/selectionStore";
import { scrollState } from "@/components/scroll/scrollState";
import { lookState } from "@/lib/lookState";

const TYRE = "#111113";
const RIM = "#8b8b92";
const GLASS = "#151a21";
const LAMP = "#c9ccd2";

type Props = {
  car: CarData;
  /** Drehung des Stellplatzes: 0 = Nase nach -Z, PI = Nase nach +Z. */
  rotation: number;
};

/**
 * Es steht noch keines der Autos in der Garage, also sind alle Wunsch.
 * Deshalb werden sie lackiert dargestellt und nicht als Drahtgitter —
 * zwölf Gitterkörper wären eine Geisterhalle. Ziel ist, dass man jedes
 * Auto an seiner Silhouette grob erkennt, nicht mehr.
 */
export default function Car({ car, rotation }: Props) {
  const paint = useRef<MeshPhysicalMaterial>(null);
  const geometry = useMemo(() => buildCarGeometry(car), [car]);

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
    material.emissiveIntensity += (active * 0.4 - material.emissiveIntensity) * step;
  });

  const { wheel, anchors, width } = geometry;
  const paintProps = {
    color: car.accent,
    metalness: 0.55,
    roughness: 0.32,
    clearcoat: 1,
    clearcoatRoughness: 0.06,
  };

  return (
    <group
      rotation-y={rotation}
      onPointerOver={(event) => {
        if (scrollState.p < 0.9 || lookState.dragging) return;
        event.stopPropagation();
        hovered.set(car.id);
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={() => {
        if (hovered.get() === car.id) hovered.set(null);
        document.body.style.cursor = "";
      }}
      onClick={(event) => {
        // Wer gezogen hat, wollte sich umsehen und kein Auto öffnen.
        if (scrollState.p < 0.9 || lookState.dragged) return;
        event.stopPropagation();
        selection.set(car.id);
      }}
    >
      {/* Karosserie: die Seitenansicht liegt in X/Y, extrudiert in Z. */}
      <group rotation-y={Math.PI / 2}>
        <mesh geometry={geometry.body} castShadow>
          <meshPhysicalMaterial
            ref={paint}
            {...paintProps}
            emissive={car.accent}
            emissiveIntensity={0}
          />
        </mesh>

        {/* Dachhaus in Wagenfarbe … */}
        <mesh geometry={geometry.roof}>
          <meshPhysicalMaterial {...paintProps} />
        </mesh>

        {/* … und die eingesetzte Verglasung. */}
        <mesh geometry={geometry.glass}>
          <meshPhysicalMaterial
            color={GLASS}
            metalness={0.85}
            roughness={0.06}
            clearcoat={1}
          />
        </mesh>

        {[-1, 1].map((front) =>
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

        {/* Außenspiegel. Kostet fast nichts und macht die Silhouette lesbar. */}
        {[-1, 1].map((side) => (
          <mesh
            key={`mirror${side}`}
            position={[
              anchors.cowl - 0.06,
              anchors.belt + 0.03,
              side * (width / 2 + 0.06),
            ]}
          >
            <boxGeometry args={[0.15, 0.07, 0.1]} />
            <meshStandardMaterial color="#26262a" roughness={0.5} metalness={0.4} />
          </mesh>
        ))}

        {/* Scheinwerfer und Rückleuchten. */}
        {[-1, 1].map((side) => (
          <mesh
            key={`head${side}`}
            position={[
              anchors.front - 0.05,
              anchors.belt * 0.74,
              side * width * 0.3,
            ]}
          >
            <boxGeometry args={[0.1, 0.11, 0.3]} />
            <meshStandardMaterial
              color={LAMP}
              emissive={LAMP}
              emissiveIntensity={0.25}
              metalness={0.6}
              roughness={0.15}
            />
          </mesh>
        ))}
        {[-1, 1].map((side) => (
          <mesh
            key={`tail${side}`}
            position={[
              anchors.rear + 0.04,
              anchors.belt * 0.78,
              side * width * 0.29,
            ]}
          >
            <boxGeometry args={[0.08, 0.1, 0.32]} />
            <meshStandardMaterial
              color="#8c1418"
              emissive="#c4161c"
              emissiveIntensity={0.7}
              toneMapped={false}
            />
          </mesh>
        ))}

        {car.wing && (
          <group position={[anchors.rear + 0.5, anchors.belt + 0.26, 0]}>
            <mesh>
              <boxGeometry args={[0.3, 0.04, width * 0.84]} />
              <meshStandardMaterial color="#1b1b1f" roughness={0.5} />
            </mesh>
            {[-1, 1].map((side) => (
              <mesh
                key={side}
                position={[0.03, -0.14, side * width * 0.3]}
              >
                <boxGeometry args={[0.1, 0.24, 0.04]} />
                <meshStandardMaterial color="#1b1b1f" roughness={0.5} />
              </mesh>
            ))}
          </group>
        )}
      </group>
    </group>
  );
}
