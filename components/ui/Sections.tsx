import { SLOTS } from "@/lib/hall";

/**
 * Sektion 3–5 als normale Seite. Alle Inhalte der 3D-Szene existieren hier
 * zusätzlich als echtes DOM, damit Suchmaschinen und Screenreader sie
 * erreichen (Abschnitt 11).
 */

export function HallSection() {
  return (
    <section
      id="halle"
      aria-label="In der Halle"
      className="relative z-10 min-h-svh px-6 py-24 md:px-12"
    >
      <p className="tech-label">Sektion 03</p>
      <h2 className="font-tech mt-2 text-3xl uppercase md:text-5xl">
        In der Halle
      </h2>
      <p className="mt-4 max-w-md text-sm text-muted">
        {/* Phase 3 macht aus dieser Liste anklickbare Stellplätze. */}
        TODO: Text von Nico — was der Besucher hier sehen soll.
      </p>

      <ul className="mt-16 grid max-w-3xl grid-cols-2 gap-px border border-line bg-line md:grid-cols-4">
        {SLOTS.map((slot) => (
          <li key={slot.number} className="bg-ink p-4">
            <p className="font-tech text-2xl text-accent tabular-nums">
              {String(slot.number).padStart(2, "0")}
            </p>
            <p className="tech-label mt-2">
              {slot.status === "owned" ? "Belegt" : "Wunsch"}
            </p>
            <p className="mt-1 text-xs text-muted">TODO: Fahrzeug (Phase 3)</p>
          </li>
        ))}
      </ul>
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
