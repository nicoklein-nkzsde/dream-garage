"use client";

import { SLOTS_WITH_CARS, WAITLIST } from "@/lib/cars";
import { selection, useSelectedCarId } from "@/lib/selectionStore";

/**
 * Sektion 3–5 als normale Seite. Alle Inhalte der 3D-Szene existieren hier
 * zusätzlich als echtes DOM, damit Suchmaschinen und Screenreader sie
 * erreichen (Abschnitt 11). Die Liste ist zugleich die Tastaturbedienung:
 * Tab springt durch die Stellplätze, Enter öffnet das Panel.
 */

export function HallSection() {
  const selectedId = useSelectedCarId();

  return (
    <section
      id="halle"
      aria-label="In der Halle"
      // Durchlässig, damit die Autos im Canvas darunter anklickbar bleiben.
      className="pointer-events-none relative z-10 min-h-svh px-6 py-24 md:px-12"
    >
      <p className="tech-label">Sektion 03</p>
      <h2 className="font-tech mt-2 text-3xl uppercase md:text-5xl">
        In der Halle
      </h2>
      <p className="mt-4 max-w-md text-sm text-muted">
        TODO: Text von Nico — was der Besucher hier sehen soll.
      </p>

      <ul className="pointer-events-auto mt-16 grid max-w-3xl grid-cols-2 gap-px border border-line bg-line md:grid-cols-4">
        {SLOTS_WITH_CARS.map((slot) => {
          const car = slot.car;
          const active = car && car.id === selectedId;
          return (
            <li key={slot.number} className="bg-ink">
              <button
                type="button"
                disabled={!car}
                onClick={() => car && selection.set(car.id)}
                className={`flex w-full flex-col items-start p-4 text-left transition-colors ${
                  car
                    ? "cursor-pointer hover:bg-surface"
                    : "cursor-default opacity-45"
                } ${active ? "bg-surface" : ""}`}
              >
                <span
                  className="font-tech text-2xl tabular-nums"
                  style={{ color: car ? car.accent : "var(--color-accent)" }}
                >
                  {String(slot.number).padStart(2, "0")}
                </span>
                <span className="tech-label mt-2">
                  {car
                    ? car.status === "owned"
                      ? "Belegt"
                      : "Wunsch"
                    : "Frei"}
                </span>
                <span className="mt-1 text-xs text-muted">
                  {car ? `${car.make} ${car.model}` : "TODO: Auto von Nico"}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      {WAITLIST.length > 0 && (
        <div className="pointer-events-auto mt-16 max-w-3xl">
          <p className="tech-label">
            Warteliste &middot; {WAITLIST.length} ohne Stellplatz
          </p>
          <ul className="mt-4 flex flex-wrap gap-2">
            {WAITLIST.map((car) => (
              <li key={car.id}>
                <button
                  type="button"
                  onClick={() => selection.set(car.id)}
                  className={`tech-label flex min-h-11 cursor-pointer items-center border px-3 py-2 text-paper hover:border-accent hover:text-accent ${
                    car.id === selectedId ? "border-accent" : "border-line"
                  }`}
                >
                  {car.make} {car.model}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

const PEOPLE = [
  { id: "nico", name: "Nico Klein" },
  { id: "lion", name: "Lion Kalaba" },
];

export function PeopleSection() {
  return (
    <section
      id="typen"
      aria-label="Die zwei Typen"
      className="relative z-10 bg-ink px-6 py-24 md:px-12"
    >
      <p className="tech-label">Sektion 04</p>
      <h2 className="font-tech mt-2 text-3xl uppercase md:text-5xl">
        Die zwei Typen
      </h2>

      <div className="mt-12 grid gap-px border border-line bg-line md:grid-cols-2">
        {PEOPLE.map((person) => (
          <article key={person.id} className="bg-ink p-6 md:p-10">
            <h3 className="font-tech text-2xl uppercase">{person.name}</h3>
            <p className="tech-label mt-2">Erstes Auto &middot; Traumauto</p>
            <p className="mt-6 text-sm text-muted">
              TODO: Bio von {person.name} — nicht Lebenslauf, sondern warum
              Autos. Kommt in Phase 4 als MDX unter /content/bios.
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}

export function SiteFooter() {
  return (
    <footer className="relative z-10 bg-ink px-6 py-16 md:px-12">
      <div className="flex flex-col gap-6 border-t border-line pt-8 md:flex-row md:items-end md:justify-between">
        <p className="font-tech text-xl uppercase">Dream Garage</p>
        <p className="tech-label">
          Privates Projekt &middot; Nico Klein &amp; Lion Kalaba
        </p>
      </div>
    </footer>
  );
}
