/**
 * Blickrichtung in der Halle. Wer angekommen ist, kann sich mit gedrückter
 * Maustaste umsehen — begrenzt, mit Nachlauf, damit es schwebend wirkt und
 * nicht wie eine zweite Kamerafahrt.
 *
 * Eigener Zustand außerhalb von React, weil die Werte pro Bild gelesen
 * werden. Ein State-Update pro Mausbewegung wäre Unsinn.
 */
export const lookState = {
  /** Anliegende Drehung, folgt dem Ziel gedämpft. */
  yaw: 0,
  pitch: 0,
  /** Ziel, gesetzt vom Ziehen. */
  targetYaw: 0,
  targetPitch: 0,
  /** Zeigerposition -1 bis 1, für die leichte Parallaxe im Ruhezustand. */
  pointerX: 0,
  pointerY: 0,
  /** Läuft gerade eine Ziehbewegung? */
  dragging: false,
  /**
   * Wurde weit genug gezogen, dass es kein Klick mehr war? Verhindert,
   * dass beim Loslassen ungewollt ein Auto ausgewählt wird.
   */
  dragged: false,
  /** Hat der Besucher schon einmal gezogen? Blendet den Hinweis aus. */
  everDragged: false,
};

/** Grenzen des Umsehens. Alle zwölf Autos bleiben erreichbar. */
export const YAW_LIMIT = 1.4; // rund 80 Grad
export const PITCH_UP = 0.26;
export const PITCH_DOWN = -0.2;

export function resetLook() {
  lookState.targetYaw = 0;
  lookState.targetPitch = 0;
}
