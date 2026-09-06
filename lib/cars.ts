import carsData from "@/content/cars.json";
import { SLOTS, type Slot } from "./hall";

export type BodyType =
  | "coupe"
  | "roadster"
  | "hatch"
  | "sedan"
  | "wagon"
  | "suv"
  | "van";

export type Car = {
  id: string;
  /** Stellplatz 1–12, oder null für die Warteliste. */
  slot: number | null;
  status: "owned" | "wishlist";
  make: string;
  model: string;
  year: number;
  owner: "nico" | "lion" | "both";
  body: BodyType;
  /** Echte Außenmaße in Metern. Sie bestimmen die Geometrie im Raum. */
  dimensions: {
    length: number;
    width: number;
    height: number;
    wheelbase: number;
  };
  /** Freie Datenzeilen für das Panel, Reihenfolge wie eingetragen. */
  data: Record<string, string>;
  spec: string[];
  why: string;
  model3d: string | null;
  splat: string | null;
  media: string[];
  accent: string;
  /** Offene Frage zu diesem Eintrag, erscheint im Panel. */
  note?: string;
};

export const CARS = carsData as unknown as Car[];

export function carBySlot(slot: number) {
  return CARS.find((car) => car.slot === slot);
}

/** Autos aus der Liste, die noch keinen Platz in der Halle haben. */
export const WAITLIST = CARS.filter((car) => car.slot === null);

/** Autos, die tatsächlich in der Halle stehen. */
export const PLACED = CARS.filter((car) => car.slot !== null);

export function carById(id: string) {
  return CARS.find((car) => car.id === id);
}

export type SlotWithCar = Slot & { car?: Car };

/** Stellplätze mit dem, was darauf steht. Leere Plätze bleiben leer. */
export const SLOTS_WITH_CARS: SlotWithCar[] = SLOTS.map((slot) => ({
  ...slot,
  car: carBySlot(slot.number),
}));
