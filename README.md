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
| `components/scene/PlaceholderHall.tsx` | Phase 1: Halle als graue Kisten |
| `lib/carGeometry.ts` | Fahrzeugkörper aus echten Maßen, ohne fremdes 3D-Modell |
| `lib/cars.ts` + `content/cars.json` | Fahrzeugdaten, einzige Quelle für Szene und Panel |
| `lib/selectionStore.ts` | Auswahl und Hover, gelesen von Canvas und DOM |
| `components/ui/FadeRange.tsx` | Blendet DOM-Overlays am selben `p` ein und aus |

Der Fortschrittswert `p` (0 bis 1) ist die einzige Quelle für Kamera, Licht,
Nebel und Textblenden. Kein zweiter Trigger, kein `lerp` im Renderloop.

## Stand: Phase 1 und 3 abgeschlossen, Phase 2 offen

Läuft:

- Kamerafahrt von der Draufsicht bis auf Augenhöhe in der Halle
- Grundriss mit zwölf nummerierten Stellplätzen, belegt und Wunsch unterschieden
- Licht-, Nebel- und Dachblende am selben Scrollwert
- Textebene über der Fahrt, Sektionen 3 bis 5 als normale Seite darunter
- `prefers-reduced-motion`: vier harte Standbilder statt der Fahrt
- Fahrzeugkörper aus Länge, Breite, Höhe, Radstand und Bauform gerechnet:
  Radläufe, Dachhaus, Räder, Lack mit Klarlack. Rund 1300 Dreiecke pro Auto.
- Hover mit Umriss in Fahrzeugfarbe und Label an der Maus, Klick öffnet das
  Panel und die Kamera fährt in Dreiviertelansicht heran, Escape schließt
- Wunschautos als schwebendes Drahtgitter, freie Plätze bleiben leer
- Tastatur: Tab durch die Stellplatzliste, Enter öffnet das Panel

Offen, bewusst noch nicht angefasst (Phasen 2 bis 6):

- echte Hallengeometrie, Werkbank, Hebebühne, Lounge-Ecke
- Bios, Videos, Footer-Inhalte
- zweiter Renderpfad für Mobil (Bildsequenz)
- Fahrzeugmodelle, Splats, Ladereihenfolge

### Fahrzeugdaten

`content/cars.json` enthält bisher nur die zwei Autos, die als Beispiel im
Briefing stehen: Cayman S (981) auf Platz 1 und E30 M3 auf Platz 7. Die
technischen Werte dort stammen nicht von Nico oder Lion und müssen
gegengelesen werden. Zehn Plätze sind noch leer.

Bauformen für `body`: `coupe`, `roadster`, `hatch`, `sedan`, `wagon`, `suv`.
Sobald ein `model3d` oder `splat` hinterlegt ist, ersetzt es die gerechnete
Geometrie, ohne dass sich sonst etwas ändert.

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
