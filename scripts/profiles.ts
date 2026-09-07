/**
 * Zeichnet jedes Auto aus content/cars.json in Seiten- und Draufsicht.
 *
 * Silhouette und Grundriss sind das, woran man ein Auto grob erkennt.
 * Sie hier flach zu prüfen geht schneller als jedes Mal die Szene zu laden.
 *
 *   npm run profiles   ->   public/_profiles.svg
 */
import { writeFileSync } from "node:fs";
import { buildCarProfile } from "../lib/carGeometry.ts";
import type { Car } from "../lib/cars.ts";
import cars from "../content/cars.json" with { type: "json" };

const SCALE = 88;
const COLUMNS = 2;
const CELL_W = 620;
const CELL_H = 350;
const SIDE_Y = 168;
const TOP_Y = 262;
const SAMPLES = 120;

const list = cars as unknown as Car[];

function card(car: Car, index: number) {
  const p = buildCarProfile(car);
  const ox = (index % COLUMNS) * CELL_W;
  const oy = Math.floor(index / COLUMNS) * CELL_H;
  const cx = ox + CELL_W / 2;

  const xs = Array.from(
    { length: SAMPLES },
    (_, i) => -p.length / 2 + (p.length * i) / (SAMPLES - 1),
  );
  const px = (x: number) => (cx + x * SCALE).toFixed(1);
  const side = (y: number) => (oy + SIDE_Y - y * SCALE).toFixed(1);
  const top = (z: number) => (oy + TOP_Y + z * SCALE).toFixed(1);

  // Seitenansicht: oben nach vorn, unten mit den Radläufen zurück.
  const silhouette =
    xs.map((x, i) => `${i ? "L" : "M"}${px(x)},${side(p.topAt(x))}`).join(" ") +
    " " +
    [...xs].reverse().map((x) => `L${px(x)},${side(p.bottomAt(x))}`).join(" ") +
    " Z";

  const glassXs = xs.filter((x) => x >= p.glassSpan[0] && x <= p.glassSpan[1]);
  const house =
    glassXs.map((x, i) => `${i ? "L" : "M"}${px(x)},${side(Math.max(p.belt, p.roofAt(x)))}`).join(" ") +
    ` L${px(glassXs[glassXs.length - 1])},${side(p.belt)}` +
    ` L${px(glassXs[0])},${side(p.belt)} Z`;

  // Draufsicht: halbe Breite nach beiden Seiten gespiegelt.
  const plan =
    xs.map((x, i) => `${i ? "M" : "M"}${px(x)},${top(p.halfWidthAt(x))}`).slice(0, 1).join("") +
    xs.map((x) => `L${px(x)},${top(p.halfWidthAt(x))}`).join(" ") +
    " " +
    [...xs].reverse().map((x) => `L${px(x)},${top(-p.halfWidthAt(x))}`).join(" ") +
    " Z";

  const wheelR = car.dimensions.height * 0.26;
  const axle = car.dimensions.wheelbase / 2;
  const wheels = [-axle, axle]
    .map(
      (x) =>
        `<circle cx="${px(x)}" cy="${side(wheelR)}" r="${(wheelR * SCALE).toFixed(1)}" fill="#0d0d0f" stroke="#3a3a40"/>` +
        `<circle cx="${px(x)}" cy="${side(wheelR)}" r="${(wheelR * 0.6 * SCALE).toFixed(1)}" fill="#6f7076"/>`,
    )
    .join("");

  return `<g>
    <text x="${ox + 26}" y="${oy + 32}" fill="#e8e8e6" font-family="system-ui,sans-serif" font-size="15" font-weight="600">${car.make} ${car.model}</text>
    <text x="${ox + 26}" y="${oy + 51}" fill="#8a8a90" font-family="system-ui,sans-serif" font-size="10.5" letter-spacing="1.2">${car.body.toUpperCase()} · ${car.dimensions.length.toFixed(2)} × ${car.dimensions.width.toFixed(2)} × ${car.dimensions.height.toFixed(2)} M${car.slot ? ` · PLATZ ${String(car.slot).padStart(2, "0")}` : " · WARTELISTE"}</text>
    <line x1="${ox + 26}" y1="${oy + SIDE_Y}" x2="${ox + CELL_W - 26}" y2="${oy + SIDE_Y}" stroke="#2a2a2f"/>
    ${wheels}
    <path d="${silhouette}" fill="${car.accent}" stroke="#00000055"/>
    <path d="${house}" fill="#151a21"/>
    <path d="${plan}" fill="${car.accent}" fill-opacity="0.5" stroke="${car.accent}" stroke-opacity="0.8"/>
    <text x="${ox + CELL_W - 26}" y="${oy + TOP_Y + 4}" text-anchor="end" fill="#5a5a60" font-family="system-ui,sans-serif" font-size="9.5" letter-spacing="1.2">DRAUFSICHT</text>
  </g>`;
}

const rows = Math.ceil(list.length / COLUMNS);
const w = COLUMNS * CELL_W;
const h = rows * CELL_H;
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">
<rect width="${w}" height="${h}" fill="#0a0a0b"/>
${list.map(card).join("\n")}
</svg>`;

writeFileSync("public/_profiles.svg", svg);
console.log(`${list.length} Autos -> public/_profiles.svg`);
