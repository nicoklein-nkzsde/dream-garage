"use client";

import { useEffect, useRef } from "react";
import { onProgress } from "@/components/scroll/scrollState";
import { lookState } from "@/lib/lookState";
import { isTouch } from "@/lib/device";
import { INTERACTIVE_FROM } from "@/components/scene/CameraRig";

/**
 * Sagt einmal, dass man sich umsehen kann, und verschwindet, sobald der
 * Besucher es getan hat. Kein React-State: der Hinweis hängt am selben
 * Fortschrittswert wie alles andere und wird imperativ geschaltet.
 */
export default function LookHint() {
  const ref = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (element && isTouch()) {
      element.textContent = "Wischen zum Umsehen · Tippen öffnet ein Auto";
    }

    let visible = false;
    const set = (next: boolean) => {
      if (next === visible) return;
      visible = next;
      const node = ref.current;
      if (node) node.style.opacity = next ? "1" : "0";
    };

    const unsubscribe = onProgress((p) => {
      set(p >= INTERACTIVE_FROM && !lookState.everDragged);
    });

    // Nach dem ersten Ziehen ist der Hinweis erledigt.
    const onMove = () => {
      if (lookState.everDragged) set(false);
    };
    window.addEventListener("pointermove", onMove);

    return () => {
      unsubscribe();
      window.removeEventListener("pointermove", onMove);
    };
  }, []);

  return (
    <p
      ref={ref}
      aria-hidden="true"
      style={{ opacity: 0 }}
      className="tech-label pointer-events-none fixed bottom-6 left-1/2 z-20 -translate-x-1/2 border border-line bg-ink/80 px-4 py-2.5 transition-opacity duration-700 md:bottom-10"
    >
      Ziehen zum Umsehen &middot; Klick öffnet ein Auto
    </p>
  );
}
