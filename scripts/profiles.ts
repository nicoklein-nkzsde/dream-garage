/**
 * Zeichnet die Seitenprofile aller Bauformen als SVG nach
 * public/_profiles.html. Zum Nachjustieren der Proportionen in
 * lib/carGeometry.ts, wenn eine Bauform nicht sitzt.
 *
 *   npm run profiles   ->   http://localhost:3000/_profiles.html
 */
import { writeFileSync } from "node:fs";
import { buildCarGeometry } from "../lib/carGeometry.ts";
import type { Car } from "../lib/cars.ts";

const base = {
  id: "x", slot: 1, status: "owned", make: "", model: "", year: 2020,
  owner: "both", data: {}, spec: [], why: "", model3d: null, splat: null,
  media: [], accent: "#c8102e",
} as unknown as Car;

const probes: { body: Car["body"]; dim: Car["dimensions"] }[] = [
  { body: "coupe", dim: { length: 4.38, width: 1.8, height: 1.29, wheelbase: 2.48 } },
  { body: "roadster", dim: { length: 4.1, width: 1.75, height: 1.25, wheelbase: 2.4 } },
  { body: "hatch", dim: { length: 4.0, width: 1.75, height: 1.42, wheelbase: 2.5 } },
  { body: "sedan", dim: { length: 4.36, width: 1.68, height: 1.37, wheelbase: 2.56 } },
  { body: "wagon", dim: { length: 4.75, width: 1.82, height: 1.47, wheelbase: 2.75 } },
  { body: "suv", dim: { length: 4.6, width: 1.9, height: 1.68, wheelbase: 2.7 } },
];

const SCALE = 150;
const cards = probes.map(({ body, dim }) => {
  const car = { ...base, body, dimensions: dim };
  const g = buildCarGeometry(car);
  // Profile über die Extrusionsparameter zurückholen: wir bauen sie erneut.
  const w = dim.length * SCALE + 60;
  const h = dim.height * SCALE + 90;

  const path = (pts: { x: number; y: number }[]) =>
    pts.map((p, i) => `${i ? "L" : "M"}${(p.x + dim.length / 2) * SCALE + 30},${h - 40 - p.y * SCALE}`).join(" ") + " Z";

  const shapes = {
    body: g.__shapes.body.getPoints(40),
    roof: g.__shapes.roof.getPoints(40),
    glass: g.__shapes.glass.getPoints(40),
  };
  const wheelY = h - 40 - g.wheel.radius * SCALE;
  const wheels = [-1, 1].map((s) =>
    `<circle cx="${(s * g.wheel.axleX + dim.length / 2) * SCALE + 30}" cy="${wheelY}" r="${g.wheel.radius * SCALE}" fill="#151517" stroke="#4a4a52"/>` +
    `<circle cx="${(s * g.wheel.axleX + dim.length / 2) * SCALE + 30}" cy="${wheelY}" r="${g.wheel.radius * 0.62 * SCALE}" fill="#8b8b92"/>`,
  ).join("");

  return `<figure><figcaption>${body} · ${dim.length} × ${dim.height} m · Radstand ${dim.wheelbase}</figcaption>
  <svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
    <line x1="0" y1="${h - 40}" x2="${w}" y2="${h - 40}" stroke="#333"/>
    <path d="${path(shapes.body)}" fill="#c8102e"/>
    <path d="${path(shapes.roof)}" fill="#e03a54"/>
    <path d="${path(shapes.glass)}" fill="#151a21"/>
    ${wheels}
  </svg></figure>`;
}).join("\n");

writeFileSync("./public/_profiles.html", `<!doctype html><meta charset="utf-8">
<style>body{background:#0a0a0b;color:#e8e8e6;font:13px system-ui;margin:0;padding:20px}
figure{margin:0 0 24px}figcaption{text-transform:uppercase;letter-spacing:.12em;font-size:11px;color:#7d7d82;margin-bottom:6px}</style>
${cards}`);
console.log("geschrieben: public/_profiles.html");
