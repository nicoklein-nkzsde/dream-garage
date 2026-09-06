/**
 * Zeichnet die Seitenansicht jedes Autos aus content/cars.json als SVG.
 *
 * Die Silhouette ist das, woran man ein Auto grob erkennt. Sie hier flach
 * zu prüfen geht schneller als jedes Mal die 3D-Szene zu laden.
 *
 *   npm run profiles   ->   public/_profiles.svg und public/_profiles.html
 */
import { writeFileSync } from "node:fs";
import { buildCarGeometry } from "../lib/carGeometry.ts";
import type { Car } from "../lib/cars.ts";
import cars from "../content/cars.json" with { type: "json" };

const SCALE = 96; // Pixel pro Meter
const COLUMNS = 3;
const CELL_W = 560;
const CELL_H = 230;
const BASE_Y = 176; // Fahrbahn innerhalb der Zelle

const list = cars as unknown as Car[];

function card(car: Car, index: number) {
  const g = buildCarGeometry(car);
  const { length, width, height } = car.dimensions;
  const ox = (index % COLUMNS) * CELL_W;
  const oy = Math.floor(index / COLUMNS) * CELL_H;
  const cx = ox + CELL_W / 2;

  // Fahrzeugmitte auf Zellenmitte, Boden auf BASE_Y.
  const px = (x: number) => cx + x * SCALE;
  const py = (y: number) => oy + BASE_Y - y * SCALE;
  const path = (points: { x: number; y: number }[]) =>
    points.map((p, i) => `${i ? "L" : "M"}${px(p.x).toFixed(1)},${py(p.y).toFixed(1)}`).join(" ") + " Z";

  const { radius, axleX } = g.wheel;
  const wheels = [-axleX, axleX]
    .map((x) => `<circle cx="${px(x).toFixed(1)}" cy="${py(radius).toFixed(1)}" r="${(radius * SCALE).toFixed(1)}" fill="#121214" stroke="#3a3a40" stroke-width="1"/>
      <circle cx="${px(x).toFixed(1)}" cy="${py(radius).toFixed(1)}" r="${(radius * 0.62 * SCALE).toFixed(1)}" fill="#6f7076"/>`)
    .join("");

  const wing = car.wing
    ? `<rect x="${px(g.anchors.rear + 0.35).toFixed(1)}" y="${py(g.anchors.belt + 0.28).toFixed(1)}" width="${(0.3 * SCALE).toFixed(1)}" height="${(0.04 * SCALE).toFixed(1)}" fill="#1b1b1f"/>
       <rect x="${px(g.anchors.rear + 0.48).toFixed(1)}" y="${py(g.anchors.belt + 0.26).toFixed(1)}" width="4" height="${(0.24 * SCALE).toFixed(1)}" fill="#1b1b1f"/>`
    : "";

  return `<g>
    <line x1="${ox + 24}" y1="${oy + BASE_Y}" x2="${ox + CELL_W - 24}" y2="${oy + BASE_Y}" stroke="#2a2a2f" stroke-width="1"/>
    ${wheels}
    <path d="${path(g.__shapes.body.getPoints(64))}" fill="${car.accent}" stroke="#00000055" stroke-width="1"/>
    <path d="${path(g.__shapes.roof.getPoints(64))}" fill="${car.accent}" stroke="#00000055" stroke-width="1"/>
    <path d="${path(g.__shapes.glass.getPoints(64))}" fill="#151a21"/>
    ${wing}
    <text x="${ox + 24}" y="${oy + 30}" fill="#e8e8e6" font-family="system-ui, sans-serif" font-size="15" font-weight="600">${car.make} ${car.model}</text>
    <text x="${ox + 24}" y="${oy + 50}" fill="#8a8a90" font-family="system-ui, sans-serif" font-size="11" letter-spacing="1.2">${car.body.toUpperCase()} · ${length.toFixed(2)} × ${width.toFixed(2)} × ${height.toFixed(2)} M${car.slot ? ` · PLATZ ${String(car.slot).padStart(2, "0")}` : " · WARTELISTE"}</text>
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
writeFileSync(
  "public/_profiles.html",
  `<!doctype html><meta charset="utf-8"><title>Silhouetten</title><body style="margin:0;background:#0a0a0b">${svg}</body>`,
);
console.log(`${list.length} Silhouetten -> public/_profiles.svg`);
