import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Reines Entwicklungswerkzeug, läuft über Nodes Type-Stripping.
    "scripts/**",
  ]),
  {
    // React Three Fiber schreibt in useFrame absichtlich direkt auf Objekte
    // der Szene. Das ist hier der ganze Punkt: ein State-Update pro Frame
    // würde die Fahrt ruckeln lassen. Die Immutability-Regel des React
    // Compilers passt deshalb nicht auf die Szene.
    files: ["components/scene/**/*.tsx"],
    rules: { "react-hooks/immutability": "off" },
  },
]);

export default eslintConfig;
