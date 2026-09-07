/**
 * Die Seite liegt auf GitHub Pages unter /dream-garage, nicht auf einer
 * eigenen Domain. Dateien aus public/ brauchen deshalb den Basispfad —
 * sonst greift der Loader auf der veröffentlichten Seite ins Leere,
 * während lokal alles funktioniert.
 */
const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export function assetUrl(path: string) {
  return `${BASE}${path}`;
}
