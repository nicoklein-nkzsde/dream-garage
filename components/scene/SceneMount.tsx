"use client";

import dynamic from "next/dynamic";

/**
 * three.js und drei sind der mit Abstand größte Brocken im Bundle.
 * Sie werden erst nach dem ersten Rendern geladen, damit Titel und
 * Beschriftung sofort stehen. Der Hintergrund ist ohnehin dunkel,
 * der Übergang fällt nicht auf.
 */
const GarageScene = dynamic(() => import("./GarageScene"), { ssr: false });

export default function SceneMount() {
  return <GarageScene />;
}
