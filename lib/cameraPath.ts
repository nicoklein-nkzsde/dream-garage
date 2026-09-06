import { CatmullRomCurve3, Vector3 } from "three";

/**
 * Die Kamerafahrt aus Abschnitt 4 des Briefings.
 *
 * Ein einziger Fortschrittswert p (0…1) erzeugt Position, Blickpunkt und FOV.
 * Position und Blickpunkt liegen auf zwei getrennten Catmull-Rom-Kurven,
 * damit der Blick nicht hart am Ursprung klebt.
 *
 * Abweichung vom Briefing, bewusst und an einer Stelle einstellbar:
 * die Z-Werte der Tabelle (0.75 → 28, 1.00 → 26) liegen bei einer 40 × 20 m
 * großen Halle 16 m ausserhalb des Tors. Damit der Besucher am Ende wirklich
 * in der Halle steht, endet die Fahrt bei Z = 6, also 4 m hinter der Torwand.
 * Y-Werte, FOV-Verlauf und Charakter der Fahrt bleiben unverändert.
 */

/** Arc-Length-Parametrisierung (Briefing) = gleichmäßige Geschwindigkeit.
 *  false = p trifft die Keyframes der Tabelle exakt, dafür ungleiche Tempi. */
const USE_ARC_LENGTH = true;

const POSITIONS: [number, number, number][] = [
  [0, 45, 0.1], // p 0.00  reine Draufsicht, Grundriss
  [0, 38, 12], // p 0.25  leichtes Kippen, erste Tiefe
  [0, 24, 22], // p 0.50  halbhoch, Dachkonstruktion kommt ins Bild
  [0, 10, 22], // p 0.75  fast auf Höhe, vor dem Tor
  [0, 1.65, 6], // p 1.00  Augenhöhe, Tor im Rücken
];

const TARGETS: [number, number, number][] = [
  [0, 0, 0],
  [0, 0, 1],
  [0, 2, 2],
  [0, 2, -2],
  [0, 1.65, -10],
];

const FOV_START = 35; // Draufsicht, wirkt technisch
const FOV_END = 55; // Halle, wirkt räumlich

// "centripetal" verhindert Ausreißer und Schlaufen an den Knickpunkten.
export const positionCurve = new CatmullRomCurve3(
  POSITIONS.map((p) => new Vector3(...p)),
  false,
  "centripetal",
);

export const targetCurve = new CatmullRomCurve3(
  TARGETS.map((p) => new Vector3(...p)),
  false,
  "centripetal",
);

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

function sample(curve: CatmullRomCurve3, p: number, out: Vector3) {
  const t = clamp01(p);
  return USE_ARC_LENGTH ? curve.getPointAt(t, out) : curve.getPoint(t, out);
}

export function cameraPositionAt(p: number, out: Vector3) {
  return sample(positionCurve, p, out);
}

export function cameraTargetAt(p: number, out: Vector3) {
  return sample(targetCurve, p, out);
}

/** Weiche Ein-/Ausblendung statt linearem Anstieg. */
export function smoothstep(edge0: number, edge1: number, x: number) {
  const t = clamp01((x - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
}

export function fovAt(p: number) {
  return FOV_START + (FOV_END - FOV_START) * smoothstep(0, 1, clamp01(p));
}

/** Vier Standbilder für prefers-reduced-motion (Abschnitt 11). */
export const REDUCED_MOTION_STOPS = [0, 0.34, 0.68, 1];
