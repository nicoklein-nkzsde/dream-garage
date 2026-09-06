/**
 * Der Scrollfortschritt p lebt bewusst ausserhalb von React.
 *
 * Ein State-Update pro Frame würde den kompletten Baum neu rendern und die
 * Fahrt ruckeln lassen. Stattdessen: ein mutierbares Objekt, das der
 * ScrollTrigger schreibt, useFrame liest und DOM-Overlays über
 * onProgress imperativ abgreifen.
 */

export const scrollState = { p: 0 };

type Listener = (p: number) => void;
const listeners = new Set<Listener>();

export function setProgress(p: number) {
  scrollState.p = p;
  for (const listener of listeners) listener(p);
}

export function onProgress(listener: Listener) {
  listeners.add(listener);
  listener(scrollState.p);
  return () => {
    listeners.delete(listener);
  };
}
