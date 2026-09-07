import { BufferAttribute, BufferGeometry } from "three";
import type { BodyType, Car } from "./cars";
import type { Quality } from "./device";

/**
 * Fahrzeugkörper aus echten Maßen statt aus einem heruntergeladenen Modell.
 *
 * Aus Länge, Breite, Höhe, Radstand und einer Handvoll Formzahlen entstehen
 * drei Kurven über die Längsachse: Unterkante, Oberkante und halbe Breite.
 * Daraus näht `carMesh` einen Körper. Das ist keine Fotorealistik, aber die
 * Proportionen stimmen und ein 911 sieht anders aus als ein Bus.
 *
 * Sobald ein GLB oder ein Splat vorliegt, ersetzt es diese Geometrie,
 * ohne dass sich sonst etwas ändert.
 */

export type Proportions = {
  /** Höhe der Gürtellinie als Anteil der Fahrzeughöhe. */
  belt: number;
  /** Radradius als Anteil der Fahrzeughöhe. */
  wheel: number;
  /** Höhe der Dachkante als Anteil der Fahrzeughöhe. */
  roof: number;
  /** Wölbung des Dachs. 0 = gerade Kante, 1 = stark gewölbt wie ein 911. */
  roofCurve: number;
  /** Höhe der Nase als Anteil der Gürtellinie. Klein = flache Schnauze. */
  nose: number;
  /** Höhe der Heckkante als Anteil der Gürtellinie. */
  tail: number;
  /**
   * Vier Längsmarken des Dachhauses, gemessen von der Fahrzeugnase
   * als Anteil der Gesamtlänge: Fuß der Frontscheibe, Dachanfang,
   * Dachende, Fuß der Heckscheibe.
   */
  glass: [number, number, number, number];
  /**
   * Draufsicht: halbe Breite an fünf Stellen von der Nase zum Heck,
   * als Anteil der vollen Breite. Ohne das wäre jedes Auto ein Brett.
   */
  plan: [number, number, number, number, number];
};

const PROPORTIONS: Record<BodyType, Proportions> = {
  coupe:    { belt: 0.66, wheel: 0.26, roof: 1,    roofCurve: 0.5,  nose: 0.82, tail: 0.92, glass: [0.38, 0.55, 0.71, 0.93], plan: [0.44, 0.93, 1, 0.97, 0.62] },
  roadster: { belt: 0.70, wheel: 0.27, roof: 0.92, roofCurve: 0.2,  nose: 0.8,  tail: 0.92, glass: [0.42, 0.56, 0.62, 0.7],  plan: [0.46, 0.93, 1, 0.96, 0.6] },
  hatch:    { belt: 0.68, wheel: 0.26, roof: 1,    roofCurve: 0.3,  nose: 0.86, tail: 0.97, glass: [0.34, 0.5,  0.74, 0.87], plan: [0.5,  0.9,  1, 0.95, 0.76] },
  sedan:    { belt: 0.68, wheel: 0.25, roof: 1,    roofCurve: 0.3,  nose: 0.85, tail: 0.9,  glass: [0.36, 0.52, 0.72, 0.85], plan: [0.5,  0.9,  1, 0.94, 0.68] },
  wagon:    { belt: 0.67, wheel: 0.25, roof: 1,    roofCurve: 0.2,  nose: 0.85, tail: 0.99, glass: [0.35, 0.51, 0.92, 0.98], plan: [0.5,  0.9,  1, 0.97, 0.86] },
  suv:      { belt: 0.66, wheel: 0.28, roof: 1,    roofCurve: 0.22, nose: 0.9,  tail: 0.99, glass: [0.34, 0.48, 0.84, 0.95], plan: [0.55, 0.92, 1, 0.98, 0.84] },
  van:      { belt: 0.68, wheel: 0.2,  roof: 1,    roofCurve: 0.12, nose: 0.93, tail: 0.99, glass: [0.2,  0.33, 0.93, 0.99], plan: [0.58, 0.94, 1, 1,    0.9] },
};

/** Wie viele Querschnitte über die Länge. Mehr heißt sauberere Radläufe. */
const STATIONS = { high: 88, low: 56 } as const;
const RING_BODY = { high: 16, low: 12 } as const;
const RING_GLASS = { high: 14, low: 10 } as const;
/** 2 wäre ein Oval, 4 ein Rechteck mit runden Ecken. */
const SHARPNESS_BODY = 3.3;
const SHARPNESS_GLASS = 4.2;

export type CarProfile = {
  length: number;
  width: number;
  height: number;
  /** Unterkante der Karosserie, steigt über den Rädern zum Radlauf an. */
  bottomAt: (x: number) => number;
  /** Oberkante: Nase, Motorhaube, Gürtellinie, Heck. */
  topAt: (x: number) => number;
  /** Halbe Breite in der Draufsicht. */
  halfWidthAt: (x: number) => number;
  /** Oberkante des Dachs zwischen den Scheibenfüßen. */
  roofAt: (x: number) => number;
  glassSpan: [number, number];
  roofSpan: [number, number];
  belt: number;
};

export type CarGeometry = {
  body: BufferGeometry;
  /** Dachschale in Wagenfarbe. */
  roof: BufferGeometry;
  /** Dachhaus als dunkle Verglasung. */
  glass: BufferGeometry;
  wheel: { radius: number; width: number; axleX: number; offsetZ: number };
  height: number;
  width: number;
  /** Ankerpunkte für Spiegel, Leuchten und Flügel. */
  anchors: { front: number; rear: number; belt: number; cowl: number; roofY: number };
  profile: CarProfile;
};

export function buildCarProfile(car: Car): CarProfile {
  const { length, width, height, wheelbase } = car.dimensions;
  const shape = {
    ...(PROPORTIONS[car.body] ?? PROPORTIONS.coupe),
    ...(car.shape ?? {}),
  };

  const front = length / 2;
  const wheelRadius = height * shape.wheel;
  const clearance = wheelRadius * 0.42;
  const belt = height * shape.belt;
  const roofY = height * shape.roof;
  const halfWidth = width / 2;

  const archRadius = wheelRadius * 1.35;
  const archHeight = wheelRadius * 2.18 - clearance;
  const axles = [-wheelbase / 2, wheelbase / 2];

  const [uCowl, uRoofFront, uRoofRear, uBack] = shape.glass;
  /** Längsposition als Anteil der Länge, von der Nase aus gemessen. */
  const at = (u: number) => front - u * length;
  const toU = (x: number) => (front - x) / length;

  const bottomAt = (x: number) => {
    let y = clearance;
    for (const axle of axles) {
      const dx = (x - axle) / archRadius;
      if (Math.abs(dx) < 1) {
        // Elliptischer Radlauf, der an den Enden sauber auf den
        // Schweller trifft — sonst gäbe es dort eine Stufe.
        y = Math.max(y, clearance + archHeight * Math.sqrt(1 - dx * dx));
      }
    }
    return y;
  };

  const topAt = (x: number) => {
    const u = toU(x);
    if (u <= uCowl) {
      // Nase und Motorhaube, leicht ansteigend zum Windlauf.
      return lerp(belt * shape.nose, belt, ease(u / uCowl));
    }
    if (u >= uBack) {
      return lerp(belt, belt * shape.tail, ease((u - uBack) / (1 - uBack)));
    }
    return belt;
  };

  const halfWidthAt = (x: number) => {
    const u = clamp01(toU(x));
    return halfWidth * spline(shape.plan, [0, 0.15, 0.4, 0.7, 1], u);
  };

  const dome = height * 0.05 * shape.roofCurve;
  /** Höhe der Dachkante an ihren beiden Enden, der Scheitel liegt höher. */
  const eaveY = roofY - 2 * dome;

  const roofAt = (x: number) => {
    const u = toU(x);
    // Außerhalb des Dachhauses liegt die Oberkante auf der Gürtellinie.
    if (u <= uCowl || u >= uBack) return belt;
    if (u < uRoofFront) {
      // Frontscheibe.
      return lerp(belt, eaveY, ease((u - uCowl) / (uRoofFront - uCowl)));
    }
    if (u > uRoofRear) {
      // Heckscheibe.
      return lerp(eaveY, belt, ease((u - uRoofRear) / (uBack - uRoofRear)));
    }
    // Dach, Scheitel in der Mitte auf Fahrzeughöhe.
    const t = (u - uRoofFront) / (uRoofRear - uRoofFront);
    return eaveY + 2 * dome * Math.sin(Math.PI * t);
  };

  return {
    length,
    width,
    height,
    bottomAt,
    topAt,
    halfWidthAt,
    roofAt,
    glassSpan: [at(uBack), at(uCowl)],
    roofSpan: [at(uRoofRear), at(uRoofFront)],
    belt,
  };
}

export function buildCarGeometry(car: Car, quality: Quality = "high"): CarGeometry {
  const profile = buildCarProfile(car);
  const { length, width, height } = profile;
  const { wheelbase } = car.dimensions;
  const shape = {
    ...(PROPORTIONS[car.body] ?? PROPORTIONS.coupe),
    ...(car.shape ?? {}),
  };
  const front = length / 2;
  const rear = -length / 2;
  const wheelRadius = height * shape.wheel;

  const body = sample(STATIONS[quality], rear, front, (x) => ({
    x,
    bottom: profile.bottomAt(x),
    top: profile.topAt(x),
    halfWidth: profile.halfWidthAt(x),
  }));

  // Dachhaus als dunkles Volumen. Die Säulen einzeln zu stellen lohnt
  // bei dieser Auflösung nicht — von außen liest sich das ohnehin als
  // umlaufendes Glas mit lackiertem Dach darüber.
  const [glassRear, glassFront] = profile.glassSpan;
  const glass = sample(quality === "high" ? 56 : 36, glassRear, glassFront, (x) => ({
    x,
    // Tief genug in die Karosserie hinein, sonst sitzt das Dachhaus
    // als eigener Kasten obenauf statt in der Schulter zu verschwinden.
    bottom: profile.belt - 0.16,
    top: Math.max(profile.belt + 0.02, profile.roofAt(x)),
    halfWidth: profile.halfWidthAt(x) * 0.9,
  }));

  // Dachschale in Wagenfarbe, dünn über die Verglasung gelegt.
  const [roofRear, roofFront] = profile.roofSpan;
  const roof = sample(quality === "high" ? 28 : 18, roofRear - 0.04, roofFront + 0.04, (x) => {
    const top = profile.roofAt(x);
    return {
      x,
      bottom: top - 0.07,
      top,
      halfWidth: profile.halfWidthAt(x) * 0.885,
    };
  });

  const tyreWidth = width * 0.13;

  return {
    body: loft(body, RING_BODY[quality], SHARPNESS_BODY),
    glass: loft(glass, RING_GLASS[quality], SHARPNESS_GLASS),
    roof: loft(roof, RING_GLASS[quality], SHARPNESS_GLASS),
    wheel: {
      radius: wheelRadius,
      width: tyreWidth,
      axleX: wheelbase / 2,
      offsetZ: width / 2 - tyreWidth / 2 - 0.02,
    },
    height,
    width,
    anchors: {
      front,
      rear,
      belt: profile.belt,
      cowl: profile.glassSpan[1],
      roofY: height * shape.roof,
    },
    profile,
  };
}

function sample(
  count: number,
  from: number,
  to: number,
  make: (x: number) => Station,
): Station[] {
  return Array.from({ length: count }, (_, i) =>
    make(from + ((to - from) * i) / (count - 1)),
  );
}

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const ease = (t: number) => {
  const c = clamp01(t);
  return c * c * (3 - 2 * c);
};

/** Weiche Interpolation durch die Stützstellen der Draufsicht. */
function spline(values: number[], stops: number[], u: number) {
  for (let i = 0; i < stops.length - 1; i++) {
    if (u <= stops[i + 1]) {
      const t = (u - stops[i]) / (stops[i + 1] - stops[i]);
      return lerp(values[i], values[i + 1], ease(t));
    }
  }
  return values[values.length - 1];
}


/**
 * Karosserie als gelofteter Körper.
 *
 * Vorher war jedes Auto eine extrudierte Seitenansicht — über die ganze
 * Länge gleich breit, wie mit dem Plätzchenausstecher. Jetzt bekommt jede
 * Station entlang der Längsachse ihre eigene Breite und Höhe, und daraus
 * wird ein geschlossener Körper genäht. Damit verjüngt sich die Nase,
 * das Heck zieht ein und über den Rädern bleibt ein echter Radlauf offen.
 */

export type Station = {
  /** Position auf der Längsachse. */
  x: number;
  /** Unterkante an dieser Stelle. Steigt über den Rädern an. */
  bottom: number;
  /** Oberkante an dieser Stelle. */
  top: number;
  /** Halbe Breite an dieser Stelle. */
  halfWidth: number;
};

/**
 * Näht die Querschnitte zu einem Körper zusammen.
 *
 * Jeder Querschnitt ist eine Superellipse: bei `exponent` 2 ein Oval, bei
 * 4 nahezu ein Rechteck mit runden Ecken. Karosserien liegen dazwischen.
 */
export function loft(
  stations: Station[],
  ringPoints: number,
  exponent: number,
): BufferGeometry {
  const count = stations.length;
  const positions = new Float32Array(count * ringPoints * 3);

  for (let s = 0; s < count; s++) {
    const { x, bottom, top, halfWidth } = stations[s];
    const centerY = (top + bottom) / 2;
    const halfHeight = Math.max(0.004, (top - bottom) / 2);
    const width = Math.max(0.004, halfWidth);

    for (let r = 0; r < ringPoints; r++) {
      const angle = (r / ringPoints) * Math.PI * 2;
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      const power = 2 / exponent;
      const offset = (s * ringPoints + r) * 3;
      positions[offset] = x;
      positions[offset + 1] =
        centerY + halfHeight * Math.sign(sin) * Math.abs(sin) ** power;
      positions[offset + 2] =
        width * Math.sign(cos) * Math.abs(cos) ** power;
    }
  }

  const indices: number[] = [];
  for (let s = 0; s < count - 1; s++) {
    for (let r = 0; r < ringPoints; r++) {
      const next = (r + 1) % ringPoints;
      const a = s * ringPoints + r;
      const b = s * ringPoints + next;
      const c = (s + 1) * ringPoints + r;
      const d = (s + 1) * ringPoints + next;
      indices.push(a, c, b, b, c, d);
    }
  }

  // Deckel vorn und hinten, sonst schaut man in den hohlen Körper.
  const vertices = Array.from({ length: count * ringPoints * 3 }, (_, i) =>
    positions[i],
  );
  const capStart = addCap(vertices, positions, 0, ringPoints, indices, true);
  addCap(vertices, positions, count - 1, ringPoints, indices, false);
  void capStart;

  const geometry = new BufferGeometry();
  geometry.setAttribute(
    "position",
    new BufferAttribute(new Float32Array(vertices), 3),
  );
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

/** Dreiecksfächer vom Mittelpunkt des Querschnitts an den Rand. */
function addCap(
  vertices: number[],
  positions: Float32Array,
  station: number,
  ringPoints: number,
  indices: number[],
  front: boolean,
) {
  let x = 0;
  let y = 0;
  let z = 0;
  for (let r = 0; r < ringPoints; r++) {
    const offset = (station * ringPoints + r) * 3;
    x += positions[offset];
    y += positions[offset + 1];
    z += positions[offset + 2];
  }
  const center = vertices.length / 3;
  vertices.push(x / ringPoints, y / ringPoints, z / ringPoints);

  for (let r = 0; r < ringPoints; r++) {
    const next = (r + 1) % ringPoints;
    const a = station * ringPoints + r;
    const b = station * ringPoints + next;
    if (front) indices.push(center, b, a);
    else indices.push(center, a, b);
  }
  return center;
}
