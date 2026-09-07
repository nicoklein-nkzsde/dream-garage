/**
 * Zwei Qualitätsstufen statt zweier Renderpfade.
 *
 * Das Briefing sah für Handy eine in Blender gerenderte Bildsequenz vor.
 * Die Szene ist mit rund 15.000 Dreiecken aber leicht genug, um echt zu
 * laufen — teuer sind allein die Deckenstrahler und das Kantenglätten.
 * Deshalb dieselbe Szene, nur sparsamer eingestellt.
 *
 * Erkennung wie im Briefing beschrieben: Zeigegerät, Kerne, Speicher.
 * Im Zweifel die sparsame Stufe.
 */
export type Quality = "high" | "low";

let cached: Quality | null = null;

export function detectQuality(): Quality {
  if (cached) return cached;
  if (typeof window === "undefined") return "low";

  const coarse = window.matchMedia("(pointer: coarse)").matches;
  const cores = navigator.hardwareConcurrency ?? 4;
  const memory =
    (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 4;
  const narrow = window.innerWidth < 900;

  cached = coarse || narrow || cores <= 4 || memory <= 4 ? "low" : "high";
  return cached;
}

/** Grobes Zeigegerät: Finger statt Maus. */
export function isTouch() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(pointer: coarse)").matches;
}
