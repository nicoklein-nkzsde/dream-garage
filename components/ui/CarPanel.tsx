"use client";

import { useEffect } from "react";
import { carById } from "@/lib/cars";
import { selection, useSelectedCarId } from "@/lib/selectionStore";

const OWNER_LABEL: Record<string, string> = {
  nico: "Nico",
  lion: "Lion",
  both: "Nico & Lion",
};

/**
 * Fährt auf dem Desktop von rechts ein, auf dem Handy von unten.
 * Schließt über Escape oder den Klick daneben.
 */
export default function CarPanel() {
  const selectedId = useSelectedCarId();
  const car = selectedId ? carById(selectedId) : undefined;

  useEffect(() => {
    if (!car) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") selection.set(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [car]);

  const open = Boolean(car);

  return (
    <aside
      aria-hidden={!open}
      aria-label={car ? `${car.make} ${car.model}` : undefined}
      className={`fixed z-30 flex flex-col border-line bg-surface transition-transform duration-500 ease-out
        inset-x-0 bottom-0 max-h-[76svh] border-t
        md:inset-y-0 md:right-0 md:left-auto md:max-h-none md:w-[400px] md:border-t-0 md:border-l
        ${
          open
            ? "translate-y-0 md:translate-x-0"
            : "translate-y-full md:translate-y-0 md:translate-x-full"
        }`}
    >
      {car && (
        <div className="flex h-full flex-col overflow-y-auto p-6 md:p-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="tech-label">
                {car.slot
                  ? `Stellplatz ${String(car.slot).padStart(2, "0")}`
                  : "Warteliste"}{" "}
                &middot; {car.status === "owned" ? "Belegt" : "Wunsch"}
              </p>
              <h2 className="font-tech mt-2 text-3xl leading-none uppercase">
                {car.make}
              </h2>
              <p className="font-tech text-xl text-muted uppercase">
                {car.model}
              </p>
            </div>
            <button
              type="button"
              onClick={() => selection.set(null)}
              className="tech-label cursor-pointer border border-line px-3 py-2 hover:border-accent hover:text-accent"
            >
              Schließen
            </button>
          </div>

          <span
            className="mt-6 block h-1 w-16"
            style={{ backgroundColor: car.accent }}
            aria-hidden="true"
          />

          <dl className="mt-6 border-t border-line">
            <Row label="Baujahr" value={String(car.year)} />
            <Row label="Fahrer" value={OWNER_LABEL[car.owner] ?? car.owner} />
            {Object.entries(car.data).map(([label, value]) => (
              <Row key={label} label={label} value={value} />
            ))}
            <Row
              label="Maße"
              value={`${fmt(car.dimensions.length)} × ${fmt(
                car.dimensions.width,
              )} × ${fmt(car.dimensions.height)} m`}
            />
            <Row label="Radstand" value={`${fmt(car.dimensions.wheelbase)} m`} />
          </dl>

          {car.spec.length > 0 && (
            <ul className="mt-6 flex flex-wrap gap-2">
              {car.spec.map((entry) => (
                <li
                  key={entry}
                  className="tech-label border border-line px-3 py-1.5 text-paper"
                >
                  {entry}
                </li>
              ))}
            </ul>
          )}

          <p className="mt-6 text-sm leading-relaxed text-muted">{car.why}</p>

          {car.note && (
            <p className="mt-6 border-l-2 border-accent pl-3 text-sm text-muted">
              {car.note}
            </p>
          )}

          {!car.model3d && !car.splat && (
            <p className="tech-label mt-8 border-t border-line pt-4">
              Darstellung aus Maßen gerechnet &middot; kein 3D-Modell hinterlegt
            </p>
          )}
        </div>
      )}
    </aside>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-6 border-b border-line py-2.5">
      <dt className="tech-label pt-0.5">{label}</dt>
      <dd className="text-right text-sm tabular-nums">{value}</dd>
    </div>
  );
}

const fmt = (value: number) => value.toFixed(2).replace(".", ",");
