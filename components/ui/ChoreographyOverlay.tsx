"use client";

import FadeRange from "./FadeRange";
import { HALL, SLOTS } from "@/lib/hall";

const owned = SLOTS.filter((slot) => slot.status === "owned").length;

/**
 * Die HTML-Ebene über der Fahrt. Alles hängt an p, nichts an eigenen
 * Scroll-Triggern, sonst laufen Bild und Text auseinander.
 */
export default function ChoreographyOverlay() {
  return (
    <div className="pointer-events-none fixed inset-0 z-10">
      {/* Titel */}
      <FadeRange
        range={[-0.05, -0.04, 0.08, 0.15]}
        className="absolute inset-x-0 bottom-0 p-6 md:p-12"
      >
        <p className="tech-label">Nico Klein &amp; Lion Kalaba</p>
        <h1 className="mt-3 font-tech text-5xl leading-[0.9] tracking-tight uppercase md:text-8xl">
          Dream
          <br />
          Garage
        </h1>
        {/* TODO: Einleitungstext von Nico */}
        <p className="mt-4 max-w-sm text-sm text-muted">
          TODO: Einleitungstext von Nico
        </p>
        <p className="tech-label mt-8 flex items-center gap-3">
          <span className="inline-block h-px w-10 bg-accent" />
          Scrollen
        </p>
      </FadeRange>

      {/* Grundriss-Beschriftung, Abschnitt 4 */}
      <FadeRange
        range={[-0.05, -0.04, 0.2, 0.34]}
        className="absolute right-0 bottom-0 p-6 text-right md:p-12"
      >
        <p className="tech-label">Grundriss</p>
        <p className="font-tech mt-2 text-2xl tracking-[0.12em] uppercase">
          {HALL.length.toFixed(2).replace(".", ",")} &times;{" "}
          {HALL.depth.toFixed(2).replace(".", ",")} m
        </p>
        <p className="tech-label mt-4">
          Traufe {HALL.eaves.toFixed(2).replace(".", ",")} m
        </p>
        <p className="tech-label mt-1">
          {SLOTS.length} Stellplätze &middot; {owned} belegt
        </p>
      </FadeRange>

      {/* Zwischenstand halbhoch */}
      <FadeRange
        range={[0.42, 0.5, 0.6, 0.68]}
        className="absolute inset-x-0 bottom-0 p-6 md:p-12"
      >
        <p className="tech-label">Stahlbau &middot; Satteldach</p>
        <p className="font-tech mt-2 max-w-md text-2xl leading-tight uppercase md:text-4xl">
          Sechs Meter bis zur Traufe, acht bis zum First.
        </p>
      </FadeRange>

      {/* Kurz vor der Einfahrt */}
      <FadeRange
        range={[0.74, 0.82, 0.93, 0.99]}
        className="absolute inset-x-0 bottom-0 p-6 md:p-12"
      >
        <p className="tech-label">Einfahrt</p>
        <p className="font-tech mt-2 text-2xl uppercase md:text-4xl">Tor auf.</p>
      </FadeRange>
    </div>
  );
}
