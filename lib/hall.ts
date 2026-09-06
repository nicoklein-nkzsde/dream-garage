/**
 * Maße der Halle und Lage der Stellplätze.
 * Eine einzige Quelle, damit Geometrie, Grundriss-Beschriftung und später
 * cars.json auf dieselben Zahlen zeigen.
 *
 * Achsen: X = Länge der Halle (40 m), Z = Tiefe (20 m), Y = Höhe.
 * Die Torwand liegt bei +Z, die Kamera fährt von +Z herein.
 */

export const HALL = {
  length: 40, // X
  depth: 20, // Z
  eaves: 6, // Traufhöhe, Briefing Abschnitt 5
  ridge: 8, // Firsthöhe des Satteldachs
  wall: 0.3,
  /** Breite der freien Einfahrt in der Torwand, mittig bei X = 0. */
  entrance: 10.8,
} as const;

export const HALL_BOUNDS = {
  minX: -HALL.length / 2,
  maxX: HALL.length / 2,
  minZ: -HALL.depth / 2,
  maxZ: HALL.depth / 2,
} as const;

export type Slot = {
  /** Stellplatznummer, 1–12, wie auf dem Boden. */
  number: number;
  /** Mittelpunkt der Bodenmarkierung. */
  x: number;
  z: number;
  /** Blickrichtung des Fahrzeugs, Rotation um Y. */
  rotation: number;
  /** Seite der Mittelgasse: 1 = Torwand, -1 = Werkbankwand. */
  side: 1 | -1;
};

export const SLOT_SIZE = { width: 3.2, depth: 5.6 } as const;

/** Vehicle-Platzhalter in echten Maßen eines Mittelklasse-Sportwagens. */
export const CAR_BOX = { width: 1.85, height: 1.28, length: 4.4 } as const;

// Drei Plätze links, drei rechts der Einfahrt, in zwei Reihen.
const COLUMNS = [-16.2, -10.8, -5.4, 5.4, 10.8, 16.2];
const ROW_GATE = 6.9; // Reihe an der Torwand
const ROW_BACK = -6.9; // Reihe an der Werkbankwand

export const SLOTS: Slot[] = [
  // Reihe an der Torwand, Nummern 1–6. Nase zur Mittelgasse.
  ...COLUMNS.map((x, i) => ({
    number: i + 1,
    x,
    z: ROW_GATE,
    rotation: 0,
    side: 1 as const,
  })),
  // Reihe an der Werkbankwand, Nummern 7–12.
  ...COLUMNS.map((x, i) => ({
    number: i + 7,
    x,
    z: ROW_BACK,
    rotation: Math.PI,
    side: -1 as const,
  })),
];
