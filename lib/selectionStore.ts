"use client";

import { useSyncExternalStore } from "react";

/**
 * Auswahl und Hover leben außerhalb von React-Context, weil der Canvas von
 * React Three Fiber eine eigene Renderwurzel ist und Context nicht hinein
 * durchreicht. Ein winziger Store, den beide Seiten lesen.
 */
function createStore<T>(initial: T) {
  let value = initial;
  const listeners = new Set<() => void>();

  return {
    get: () => value,
    set(next: T) {
      if (Object.is(value, next)) return;
      value = next;
      for (const listener of listeners) listener();
    },
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}

export const selection = createStore<string | null>(null);
export const hovered = createStore<string | null>(null);

export function useSelectedCarId() {
  return useSyncExternalStore(
    selection.subscribe,
    selection.get,
    () => null as string | null,
  );
}

export function useHoveredCarId() {
  return useSyncExternalStore(
    hovered.subscribe,
    hovered.get,
    () => null as string | null,
  );
}
