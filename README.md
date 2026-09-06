# Dream Garage

Onepage-Website für die gemeinsame Traum-Garage von Nico Klein und Lion Kalaba.
Spezifikation: [PROJEKT_BRIEFING.md](./PROJEKT_BRIEFING.md).

Läuft als statischer Export auf GitHub Pages:
<https://nicoklein-nkzsde.github.io/dream-garage/>

Kein Shop, kein Login, kein CMS. Die Seite steht auf `noindex`, taucht also
nicht in Suchergebnissen auf, ist über den Link aber öffentlich erreichbar.
`public/robots.txt` greift bei einem Projekt-Pages-Pfad nicht, weil Crawler
robots.txt nur im Wurzelverzeichnis der Domain lesen — der gehört zu einem
anderen Repo. Der `noindex`-Header aus `app/layout.tsx` gilt trotzdem.

## Deployment

Jeder Push auf `main` baut und veröffentlicht über
`.github/workflows/deploy.yml`. Der Workflow prüft vorher Typen und Lint.
Der Basispfad `/dream-garage` wird nur dort gesetzt, lokal läuft die Seite
weiter auf `http://localhost:3000`.

## Entwickeln

```bash
npm run dev     # http://localhost:3000
npm run build   # Produktionsbuild
npx eslint .    # Lint
npx tsc --noEmit  # erst nach einem Build, Next erzeugt die Routentypen
npm run profiles  # zeichnet alle Bauformen als Seitenprofil
```

`npm run profiles` schreibt `public/_profiles.html`. Die Seite zeigt jede
Bauform in Originalproportionen als SVG — der schnellste Weg, die Werte in
`lib/carGeometry.ts` nachzujustieren. Die Datei ist nicht eingecheckt.

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
- Umsehen in der Halle: Ziehen mit der Maus dreht den Blick, begrenzt auf
  rund 80 Grad zur Seite. Gedämpft, damit es schwebt statt zu schwenken.
  Im Ruhezustand eine leichte Parallaxe über die Zeigerposition. Nur auf
  feinen Zeigegeräten — auf Touch würde das mit dem Scrollen kollidieren.
  Wer zieht, wählt kein Auto aus; erst ein Klick ohne Bewegung öffnet das
  Panel. Die Ziehrichtung folgt der Greif-Konvention: nach rechts ziehen
  dreht den Blick nach links (`LookControls.tsx`, Vorzeichen in einer Zeile)

Offen, bewusst noch nicht angefasst (Phasen 2 bis 6):

- echte Hallengeometrie, Werkbank, Hebebühne, Lounge-Ecke
- Bios, Videos, Footer-Inhalte
- zweiter Renderpfad für Mobil (Bildsequenz)
- Fahrzeugmodelle, Splats, Ladereihenfolge

### Fahrzeugdaten

`content/cars.json` ist die einzige Quelle. Ein Eintrag mit `slot` steht in
der Halle, ein Eintrag mit `"slot": null` landet auf der Warteliste unter
Sektion 3. Umsortieren heißt: eine Zahl ändern.

Stand: 24 Einträge, 12 auf Stellplätzen, 12 auf der Warteliste. Die Auswahl,
welche zwölf in der Halle stehen, ist meine und nicht abgestimmt.

Keines der Autos ist vorhanden, alle stehen auf `wishlist`. Deshalb werden
sie lackiert dargestellt und nicht als Drahtgitter — zwölf Gitterkörper
wären eine Geisterhalle. Die Unterscheidung „belegt gegen Wunsch" wird erst
wieder sichtbar, wenn tatsächlich ein Auto in der Garage steht.

Ziel der 3D-Darstellung ist, dass man jedes Auto **grob** an seiner
Silhouette erkennt, nicht mehr. Die vollständigen Daten stehen im Panel und
müssen in der Szene nicht ablesbar sein.

`npm run profiles` zeichnet alle Seitenansichten als SVG nach
`public/_profiles.svg`. Das ist der schnellste Weg, eine Silhouette
nachzujustieren — flach prüfen statt jedes Mal die 3D-Szene laden.

Technische Werte stammen nicht von Nico oder Lion. Wo etwas unklar war,
steht ein `note`-Feld im Eintrag; das erscheint auch im Panel.

Jedes Auto kann die Werte seiner Bauform über `shape` überschreiben:
`belt` (Höhe der Gürtellinie), `roofCurve` (Wölbung der Dachlinie, hoch
beim 911, fast null beim E30), `nose`, `tail` und die vier Längsmarken des
Dachhauses. `wing: true` setzt einen festen Heckflügel.

Bauformen für `body`: `coupe`, `roadster`, `hatch`, `sedan`, `wagon`, `suv`,
`van`. Sobald ein `model3d` oder `splat` hinterlegt ist, ersetzt es die
gerechnete Geometrie, ohne dass sich sonst etwas ändert.

### Abweichungen vom Briefing

1. **Z-Werte am Ende der Fahrt.** Die Tabelle in Abschnitt 4 endet bei
   `z = 26`. Bei einer 40 × 20 m großen Halle steht die Kamera dort 16 m
   vor dem Tor. Die Fahrt endet deshalb bei `z = 6`, also vier Meter hinter
   der Torwand. Höhen, FOV-Verlauf und Charakter der Fahrt sind unverändert.
   Einstellbar in `lib/cameraPath.ts`.
2. **Länge der Halle liegt auf der X-Achse.** Nur so passt der Grundriss bei
   FOV 35 aus 45 m Höhe vollständig ins Bild. Die Torwand ist damit die
   Längswand, wie im Briefing beschrieben.
3. **Lage der Stellplätze.** Beide Reihen liegen in der hinteren
   Hallenhälfte, davor bleibt die Einfahrtsfläche frei. Standen sie
   symmetrisch um die Hallenmitte, war beim Ankommen die halbe Sammlung
   hinter dem Besucher. Werte oben in `lib/hall.ts`.
4. **Kadrierung der Draufsicht.** Ein Versatz von 1,5 m nach oben plus etwas
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
