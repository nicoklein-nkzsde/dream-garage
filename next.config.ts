import type { NextConfig } from "next";

/**
 * Die Seite läuft als statischer Export auf GitHub Pages.
 * Weil sie unter /dream-garage liegt und nicht auf einer eigenen Domain,
 * braucht sie einen Basispfad. Den setzt nur der Workflow, damit
 * `npm run dev` weiterhin einfach auf localhost:3000 erreichbar bleibt.
 */
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const nextConfig: NextConfig = {
  output: "export",
  basePath,
  assetPrefix: basePath || undefined,
  trailingSlash: true,
  images: { unoptimized: true },
};

export default nextConfig;
