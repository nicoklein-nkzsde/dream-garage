# Dream Garage

Onepage-Website für die gemeinsame Traum-Garage von Nico Klein und Lion Kalaba.
Spezifikation: [PROJEKT_BRIEFING.md](./PROJEKT_BRIEFING.md).

Privates Projekt, noch ohne eigene Domain. Die Seite ist auf `noindex`
gestellt und `public/robots.txt` sperrt alle Crawler aus.

## Entwickeln

```bash
npm run dev     # http://localhost:3000
npm run build   # Produktionsbuild
npx eslint .    # Lint
npx tsc --noEmit
```

Node wurde über Homebrew installiert (`brew install node`).

## Aufbau

| Pfad | Zweck |
|---|---|
| `lib/cameraPath.ts` | Die Kamerafahrt: zwei Catmull-Rom-Kurven plus FOV-Verlauf |
| `lib/hall.ts` | Maße der Halle und Lage der zwölf Stellplätze |
| `components/scroll/scrollState.ts` | Der Fortschrittswert `p`, bewusst außerhalb von React |
| `components/scroll/SmoothScroll.tsx` | Lenis plus ein einziger ScrollTrigger |
| `components/scene/CameraRig.tsx` | Setzt Kamera und FOV aus `p` |
| `components/scene/Atmosphere.tsx` | Licht- und Nebelverlauf, ebenfalls aus `p` |
| `components/scene/PlaceholderHall.tsx` | Phase 1: Halle und Autos als graue Kisten |
| `components/ui/FadeRange.tsx` | Blendet DOM-Overlays am selben `p` ein und aus |

Der Fortschrittswert `p` (0 bis 1) ist die einzige Quelle für Kamera, Licht,
Nebel und Textblenden. Kein zweiter Trigger, kein `lerp` im Renderloop.

## Stand: Phase 1 abgeschlossen

Läuft:

- Kamerafahrt von der Draufsicht bis auf Augenhöhe in der Halle
- Grundriss mit zwölf nummerierten Stellplätzen, belegt und Wunsch unterschieden
- Licht-, Nebel- und Dachblende am selben Scrollwert
- Textebene über der Fahrt, Sektionen 3 bis 5 als normale Seite darunter
- `prefers-reduced-motion`: vier harte Standbilder statt der Fahrt

Offen, bewusst noch nicht angefasst (Phasen 2 bis 6):

- echte Hallengeometrie, Werkbank, Hebebühne, Lounge-Ecke
- `content/cars.json`, Hover, Klick, Detail-Panel
- Bios, Videos, Footer-Inhalte
- zweiter Renderpfad für Mobil (Bildsequenz)
- Fahrzeugmodelle, Splats, Ladereihenfolge

### Abweichungen vom Briefing

1. **Z-Werte am Ende der Fahrt.** Die Tabelle in Abschnitt 4 endet bei
   `z = 26`. Bei einer 40 × 20 m großen Halle steht die Kamera dort 16 m
   vor dem Tor. Die Fahrt endet deshalb bei `z = 6`, also vier Meter hinter
   der Torwand. Höhen, FOV-Verlauf und Charakter der Fahrt sind unverändert.
   Einstellbar in `lib/cameraPath.ts`.
2. **Länge der Halle liegt auf der X-Achse.** Nur so passt der Grundriss bei
   FOV 35 aus 45 m Höhe vollständig ins Bild. Die Torwand ist damit die
   Längswand, wie im Briefing beschrieben.
3. **Kadrierung der Draufsicht.** Ein Versatz von 1,5 m nach oben plus etwas
   Rand, damit unten links Platz für den Titel bleibt. Konstanten oben in
   `components/scene/CameraRig.tsx`.

### Performance-Budget

| Metrik | Ziel | Stand |
|---|---|---|
| Initiales JS | < 250 KB gzip | 318 KB gzip |
| three.js und drei | — | 180 KB gzip, wird nachgeladen |

three.js hängt bereits am Lazy-Load. Die nächsten Hebel wären GSAP und Lenis
ebenfalls nachzuladen und `Text` aus drei durch etwas Leichteres zu ersetzen.
Beides gehört nach Phase 6, vorher lohnt das Messen nicht.
