"use client";

import Car from "./Car";
import { SLOTS_WITH_CARS } from "@/lib/cars";

/** Alles, was auf den Stellplätzen steht. Leere Plätze bleiben leer. */
export default function Cars() {
  return (
    <>
      {SLOTS_WITH_CARS.map((slot) =>
        slot.car ? (
          <group key={slot.number} position={[slot.x, 0, slot.z]}>
            <Car car={slot.car} rotation={slot.rotation} />
          </group>
        ) : null,
      )}
    </>
  );
}
