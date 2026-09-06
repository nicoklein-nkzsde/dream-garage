import { ExtrudeGeometry, Shape } from "three";
import type { BodyType, Car } from "./cars";

/**
 * Fahrzeugkörper aus echten Maßen statt aus einem heruntergeladenen Modell.
 *
 * Aus Länge, Breite, Höhe und Radstand entsteht eine Seitenansicht, die
 * extrudiert wird: unten die Karosserie mit ausgeschnittenen Radläufen,
 * darüber ein schmaleres Dachhaus. Das ist keine Fotorealistik, aber die
 * Proportionen stimmen, und ein Kombi sieht anders aus als ein Coupé.
 *
 * Sobald ein GLB oder ein Splat vorliegt, ersetzt es diese Geometrie,
 * ohne dass sich sonst etwas ändert.
 */

export type Proportions = {
  /** Höhe der Gürtellinie als Anteil der Fahrzeughöhe. */
  belt: number;
  /** Wölbung des Dachs. 0 = gerade Kante, 1 = stark gewölbt wie ein 911. */
  roofCurve: number;
  /** Höhe der Nase als Anteil der Gürtellinie. Klein = flache Schnauze. */
  nose: number;
  /** Höhe der Heckkante als Anteil der Gürtellinie. */
  tail: number;
  /** Radradius als Anteil der Fahrzeughöhe. */
  wheel: number;
  /** Höhe der Dachkante als Anteil der Fahrzeughöhe. */
  roof: number;
  /**
   * Vier Längsmarken des Dachhauses, gemessen von der Fahrzeugnase
   * als Anteil der Gesamtlänge: Fuß der Frontscheibe, Dachanfang,
   * Dachende, Fuß der Heckscheibe.
   */
  glass: [number, number, number, number];
};

/**
 * Grundwerte je Bauform. Jedes Auto kann sie über `shape` in cars.json
 * einzeln überschreiben — darüber bekommt ein 911 seine durchgehend
 * fallende Dachlinie und ein RX-7 seine flache Nase.
 */
const PROPORTIONS: Record<BodyType, Proportions> = {
  coupe: { belt: 0.66, wheel: 0.26, roof: 1, roofCurve: 0.5, nose: 0.82, tail: 0.92, glass: [0.38, 0.55, 0.71, 0.93] },
  // Roadster: nur Scheibe und Überrollbügel, kein Dach.
  roadster: { belt: 0.70, wheel: 0.27, roof: 0.92, roofCurve: 0.2, nose: 0.8, tail: 0.92, glass: [0.42, 0.56, 0.62, 0.7] },
  hatch: { belt: 0.68, wheel: 0.26, roof: 1, roofCurve: 0.3, nose: 0.86, tail: 0.97, glass: [0.34, 0.5, 0.74, 0.87] },
  sedan: { belt: 0.68, wheel: 0.25, roof: 1, roofCurve: 0.3, nose: 0.85, tail: 0.9, glass: [0.36, 0.52, 0.72, 0.85] },
  wagon: { belt: 0.67, wheel: 0.25, roof: 1, roofCurve: 0.2, nose: 0.85, tail: 0.99, glass: [0.35, 0.51, 0.92, 0.98] },
  suv: { belt: 0.66, wheel: 0.28, roof: 1, roofCurve: 0.22, nose: 0.9, tail: 0.99, glass: [0.34, 0.48, 0.84, 0.95] },
  // Bus: Scheibe weit vorn und steil, Dach fast über die ganze Länge.
  van: { belt: 0.68, wheel: 0.2, roof: 1, roofCurve: 0.12, nose: 0.93, tail: 0.99, glass: [0.2, 0.33, 0.93, 0.99] },
};

const BEVEL = 0.03;

export type CarGeometry = {
  body: ExtrudeGeometry;
  /** Dachhaus in Wagenfarbe. */
  roof: ExtrudeGeometry;
  /** Verglasung, etwas breiter eingesetzt, damit Säulen stehen bleiben. */
  glass: ExtrudeGeometry;
  wheel: { radius: number; width: number; axleX: number; offsetZ: number };
  height: number;
  width: number;
  /** Ankerpunkte für Spiegel, Leuchten und Flügel. */
  anchors: {
    front: number;
    rear: number;
    belt: number;
    cowl: number;
    roofY: number;
  };
  /** Nur für die Profilkontrolle in der Entwicklung. */
  __shapes: { body: Shape; roof: Shape; glass: Shape };
};

export function buildCarGeometry(car: Car): CarGeometry {
  const { length, width, height, wheelbase } = car.dimensions;
  const shape = {
    ...(PROPORTIONS[car.body] ?? PROPORTIONS.coupe),
    ...(car.shape ?? {}),
  };

  const front = length / 2;
  const rear = -length / 2;
  const wheelRadius = height * shape.wheel;
  const clearance = wheelRadius * 0.42;
  const belt = height * shape.belt;

  // Längsmarken von der Nase aus nach hinten.
  const [wsBase, roofFront, roofRear, backBase] = shape.glass.map(
    (fraction) => front - fraction * length,
  );

  const body = new Shape();
  body.moveTo(rear + 0.06, clearance);
  archUp(body, -wheelbase / 2, wheelRadius, clearance);
  archUp(body, wheelbase / 2, wheelRadius, clearance);
  body.lineTo(front - 0.06, clearance);
  // Vordere Stoßstange, Nase, Motorhaube bis zum Windlauf.
  body.quadraticCurveTo(front, clearance, front, clearance + 0.16);
  body.lineTo(front - length * 0.022, belt * shape.nose);
  body.quadraticCurveTo(front - 0.12, belt, front - length * 0.16, belt);
  body.lineTo(wsBase, belt);
  // Gürtellinie nach hinten, dann Heckabschluss.
  body.lineTo(backBase, belt);
  body.lineTo(rear + 0.14, belt * shape.tail);
  body.quadraticCurveTo(rear, belt * shape.tail - 0.02, rear, belt * shape.tail - 0.22);
  body.lineTo(rear, clearance + 0.16);
  body.quadraticCurveTo(rear, clearance, rear + 0.06, clearance);

  const roofY = height * shape.roof;

  // Gewölbte Dachlinie: die Kante fällt zu beiden Enden ab, der Scheitel
  // liegt dazwischen. Bei roofCurve = 0 bleibt es eine gerade Kante.
  const dome = height * 0.05 * shape.roofCurve;
  const roofMid = (roofFront + roofRear) / 2;

  const roof = new Shape();
  roof.moveTo(wsBase, belt - 0.02);
  roof.lineTo(roofFront, roofY - dome);
  roof.quadraticCurveTo(roofMid, roofY + dome, roofRear, roofY - dome);
  roof.lineTo(backBase, belt - 0.02);
  roof.lineTo(wsBase, belt - 0.02);

  // Dieselbe Form nach innen versetzt. Was stehen bleibt, sind A-, B- und
  // C-Säule plus Dachkante — ohne das wirkt ein Auto wie ein Keil.
  const inset = 0.09;
  const glass = new Shape();
  glass.moveTo(wsBase - inset * 1.4, belt + 0.04);
  glass.lineTo(roofFront - inset, roofY - dome - inset * 0.8);
  glass.quadraticCurveTo(
    roofMid,
    roofY + dome - inset * 0.8,
    roofRear + inset,
    roofY - dome - inset * 0.8,
  );
  glass.lineTo(backBase + inset * 1.6, belt + 0.04);
  glass.lineTo(wsBase - inset * 1.4, belt + 0.04);

  return {
    body: extrude(body, width - 2 * BEVEL),
    roof: extrude(roof, width * 0.84 - 2 * BEVEL),
    // Etwas breiter als das Dachhaus, sonst verschwindet die Scheibe darin.
    glass: extrude(glass, width * 0.86),
    __shapes: { body, roof, glass },
    wheel: {
      radius: wheelRadius,
      width: width * 0.13,
      axleX: wheelbase / 2,
      offsetZ: width / 2 - width * 0.13 / 2 - 0.02,
    },
    height,
    width,
    anchors: { front, rear, belt, cowl: wsBase, roofY: roofY + dome },
  };
}

/** Radlauf: an der Schwellerkante hoch, über das Rad, wieder herunter. */
function archUp(
  shape: Shape,
  centerX: number,
  wheelRadius: number,
  clearance: number,
) {
  const centerY = wheelRadius * 0.9;
  const radius = wheelRadius * 1.28;
  // Winkel, unter dem der Bogen die Schwellerlinie schneidet.
  const sin = (clearance - centerY) / radius;
  const angle = Math.asin(sin);

  shape.lineTo(centerX + radius * Math.cos(Math.PI - angle), clearance);
  shape.absarc(centerX, centerY, radius, Math.PI - angle, angle, true);
  shape.lineTo(centerX + radius * Math.cos(angle), clearance);
}

function extrude(shape: Shape, depth: number) {
  const geometry = new ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: true,
    bevelThickness: BEVEL,
    bevelSize: BEVEL,
    bevelSegments: 2,
    curveSegments: 12,
  });
  // Extrusion läuft von z = 0 nach z = depth, wir wollen sie mittig.
  geometry.translate(0, 0, -depth / 2);
  geometry.computeVertexNormals();
  return geometry;
}
