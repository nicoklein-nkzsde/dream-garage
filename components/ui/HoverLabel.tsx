"use client";

import { useEffect, useRef } from "react";
import { carById } from "@/lib/cars";
import { useHoveredCarId } from "@/lib/selectionStore";

/** Kleines Label, das der Maus folgt. Position wird direkt geschrieben. */
export default function HoverLabel() {
  const ref = useRef<HTMLDivElement>(null);
  const hoveredId = useHoveredCarId();
  const car = hoveredId ? carById(hoveredId) : undefined;

  useEffect(() => {
    const onMove = (event: PointerEvent) => {
      const element = ref.current;
      if (!element) return;
      element.style.transform = `translate3d(${event.clientX + 16}px, ${
        event.clientY + 16
      }px, 0)`;
    };
    window.addEventListener("pointermove", onMove);
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className="pointer-events-none fixed top-0 left-0 z-40"
      style={{ opacity: car ? 1 : 0 }}
    >
      {car && (
        <span
          className="tech-label border bg-ink px-3 py-2 text-paper"
          style={{ borderColor: car.accent }}
        >
          {car.make} {car.model}
        </span>
      )}
    </div>
  );
}
