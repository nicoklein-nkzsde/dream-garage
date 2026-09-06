"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import { MeshStandardMaterial, type Group, type MeshBasicMaterial } from "three";
import { smoothstep } from "@/lib/cameraPath";
import { scrollState } from "@/components/scroll/scrollState";
import { CAR_BOX, HALL, HALL_BOUNDS, SLOTS, SLOT_SIZE } from "@/lib/hall";

const FLOOR = "#232328";
const CONCRETE = "#2a2a2f";
const STEEL = "#3a3a41";
const ACCENT = "#e8b53a";

/**
 * Phase 1: die komplette Halle als graue Kisten in korrekten Maßen.
 * Es geht hier nur darum, dass die Fahrt sich richtig anfühlt.
 * Echte Geometrie folgt in Phase 2, echte Fahrzeuge in Phase 6.
 */
export default function PlaceholderHall() {
  const roof = useRef<Group>(null);
  const labels = useRef<Group>(null);

  // Ein gemeinsames Material für das Dach, damit ein Wert die Blende steuert.
  const roofMaterial = useMemo(
    () =>
      new MeshStandardMaterial({
        color: STEEL,
        roughness: 0.65,
        metalness: 0.3,
        transparent: true,
        opacity: 0,
      }),
    [],
  );

  useFrame(() => {
    const p = scrollState.p;

    // Das Dach darf den Grundriss nicht verdecken und blendet erst ein,
    // wenn die Kamera unter die Traufe kommt.
    const roofIn = smoothstep(0.3, 0.62, p);
    roofMaterial.opacity = roofIn;
    if (roof.current) roof.current.visible = roofIn > 0.01;

    // Stellplatznummern gehören zur Draufsicht und faden mit ihr weg.
    const labelOut = 1 - smoothstep(0.22, 0.42, p);
    if (labels.current) {
      labels.current.visible = labelOut > 0.01;
      for (const label of labels.current.children) {
        const mesh = label as unknown as { material?: MeshBasicMaterial };
        if (mesh.material) mesh.material.opacity = labelOut;
      }
    }
  });

  const halfEntrance = HALL.entrance / 2;
  const sideWallLength = (HALL.length - HALL.entrance) / 2;
  const sideWallOffset = halfEntrance + sideWallLength / 2;

  return (
    <group>
      {/* Boden */}
      <mesh rotation-x={-Math.PI / 2} receiveShadow>
        <planeGeometry args={[HALL.length, HALL.depth]} />
        <meshStandardMaterial color={FLOOR} roughness={0.82} metalness={0.05} />
      </mesh>

      {/* Vorplatz, damit die Halle in der Draufsicht nicht im Nichts steht */}
      <mesh rotation-x={-Math.PI / 2} position={[0, -0.02, HALL.depth / 2 + 9]}>
        <planeGeometry args={[HALL.length, 18]} />
        <meshStandardMaterial color="#111114" roughness={1} />
      </mesh>

      {/* Rückwand mit Werkbank-Seite */}
      <Wall
        position={[0, HALL.eaves / 2, HALL_BOUNDS.minZ]}
        size={[HALL.length, HALL.eaves, HALL.wall]}
      />
      {/* Stirnwände */}
      <Wall
        position={[HALL_BOUNDS.minX, HALL.eaves / 2, 0]}
        size={[HALL.wall, HALL.eaves, HALL.depth]}
      />
      <Wall
        position={[HALL_BOUNDS.maxX, HALL.eaves / 2, 0]}
        size={[HALL.wall, HALL.eaves, HALL.depth]}
      />
      {/* Torwand: zwei Segmente, dazwischen die freie Einfahrt */}
      <Wall
        position={[-sideWallOffset, HALL.eaves / 2, HALL_BOUNDS.maxZ]}
        size={[sideWallLength, HALL.eaves, HALL.wall]}
      />
      <Wall
        position={[sideWallOffset, HALL.eaves / 2, HALL_BOUNDS.maxZ]}
        size={[sideWallLength, HALL.eaves, HALL.wall]}
      />
      {/* Sturz über der Einfahrt */}
      <Wall
        position={[0, HALL.eaves - 0.5, HALL_BOUNDS.maxZ]}
        size={[HALL.entrance, 1, HALL.wall]}
      />

      {/* Satteldach mit sichtbarer Stahlkonstruktion */}
      <group ref={roof} visible={false}>
        <RoofSlope material={roofMaterial} side={-1} />
        <RoofSlope material={roofMaterial} side={1} />
        {Array.from({ length: 9 }, (_, i) => -16 + i * 4).map((x) => (
          <Truss key={x} x={x} material={roofMaterial} />
        ))}
      </group>

      {/* Stellplätze */}
      {SLOTS.map((slot) => (
        <group key={slot.number} position={[slot.x, 0, slot.z]}>
          <SlotMarking />

          {/* Platzhalter-Fahrzeug in echten Abmessungen */}
          <mesh
            position={[0, CAR_BOX.height / 2 + 0.05, 0]}
            rotation-y={slot.rotation}
          >
            <boxGeometry
              args={[CAR_BOX.width, CAR_BOX.height, CAR_BOX.length]}
            />
            <meshStandardMaterial
              color={slot.status === "owned" ? CONCRETE : ACCENT}
              roughness={0.55}
              metalness={0.15}
              wireframe={slot.status === "wishlist"}
            />
          </mesh>
        </group>
      ))}

      {/* Nummern liegen flach auf dem Boden wie in einer Bauzeichnung */}
      <group ref={labels}>
        {SLOTS.map((slot) => (
          <Text
            key={slot.number}
            position={[
              slot.x,
              0.02,
              // Nummer zeigt zur Mittelgasse, nicht zur Wand.
              slot.z +
                (slot.z > 0
                  ? -SLOT_SIZE.depth / 2 - 0.9
                  : SLOT_SIZE.depth / 2 + 0.9),
            ]}
            rotation={[-Math.PI / 2, 0, 0]}
            fontSize={1.1}
            anchorX="center"
            anchorY="middle"
            letterSpacing={0.12}
          >
            {String(slot.number).padStart(2, "0")}
            <meshBasicMaterial color={ACCENT} transparent toneMapped={false} />
          </Text>
        ))}
      </group>
    </group>
  );
}

/**
 * Bodenmarkierung als vier einzelne Striche.
 * Zwei übereinanderliegende Flächen würden bei flachem Blickwinkel
 * z-fighting erzeugen, das sieht man in der Draufsicht sofort.
 */
const MARK = 0.1;

function SlotMarking() {
  const { width, depth } = SLOT_SIZE;
  return (
    <group position={[0, 0.012, 0]} rotation-x={-Math.PI / 2}>
      {[-1, 1].map((side) => (
        <mesh key={`h${side}`} position={[0, (side * (depth - MARK)) / 2, 0]}>
          <planeGeometry args={[width, MARK]} />
          <meshBasicMaterial color={ACCENT} toneMapped={false} />
        </mesh>
      ))}
      {[-1, 1].map((side) => (
        <mesh key={`v${side}`} position={[(side * (width - MARK)) / 2, 0, 0]}>
          <planeGeometry args={[MARK, depth - 2 * MARK]} />
          <meshBasicMaterial color={ACCENT} toneMapped={false} />
        </mesh>
      ))}
    </group>
  );
}

function Wall({
  position,
  size,
}: {
  position: [number, number, number];
  size: [number, number, number];
}) {
  return (
    <mesh position={position}>
      <boxGeometry args={size} />
      <meshStandardMaterial color={CONCRETE} roughness={0.9} metalness={0.02} />
    </mesh>
  );
}

function RoofSlope({
  material,
  side,
}: {
  material: MeshStandardMaterial;
  side: -1 | 1;
}) {
  const halfDepth = HALL.depth / 2;
  const rise = HALL.ridge - HALL.eaves;
  const slope = Math.hypot(halfDepth, rise);
  const angle = Math.atan2(rise, halfDepth);

  return (
    <mesh
      material={material}
      position={[0, HALL.eaves + rise / 2, (side * halfDepth) / 2]}
      rotation-x={side * angle}
    >
      <boxGeometry args={[HALL.length, 0.12, slope]} />
    </mesh>
  );
}

function Truss({ x, material }: { x: number; material: MeshStandardMaterial }) {
  const halfDepth = HALL.depth / 2;
  const rise = HALL.ridge - HALL.eaves;
  const slope = Math.hypot(halfDepth, rise);
  const angle = Math.atan2(rise, halfDepth);

  return (
    <group position={[x, 0, 0]}>
      <mesh material={material} position={[0, HALL.eaves, 0]}>
        <boxGeometry args={[0.22, 0.22, HALL.depth]} />
      </mesh>
      {[-1, 1].map((side) => (
        <mesh
          key={side}
          material={material}
          position={[0, HALL.eaves + rise / 2, (side * halfDepth) / 2]}
          rotation-x={side * angle}
        >
          <boxGeometry args={[0.18, 0.18, slope]} />
        </mesh>
      ))}
    </group>
  );
}
