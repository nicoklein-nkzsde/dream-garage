# Projekt-Briefing: Dream Garage Website

> Dieses Dokument ist die Spezifikation für Claude Code. Es beschreibt das
> Zielbild, den Stack, die Scroll-Choreografie und die Bauphasen.
> Arbeitsanweisung: Phasen der Reihe nach abarbeiten, nach jeder Phase
> lauffähiger Stand mit `npm run dev`. Nicht vorgreifen.

---

## 1. Was gebaut wird

Eine Onepage-Website für zwei Autoenthusiasten (Nico Klein und Lion Kalaba),
die ihre gemeinsame Traum-Garage als begehbaren 3D-Raum zeigt.

Kernidee der Seite: Der Besucher scrollt und die Kamera fährt dabei aus der
Vogelperspektive auf einen Hallengrundriss langsam herunter und nach vorne,
bis er auf Augenhöhe mitten in der Halle steht. Die Autos stehen auf
nummerierten Stellplätzen und lassen sich anklicken.

Kein Shop, kein Login, kein CMS. Statische Seite, Inhalte kommen aus lokalen
JSON-/MDX-Dateien.

**Ton:** ruhig, dunkel, technisch. Kein Hochglanz-Autohaus, kein
Supercar-Instagram. Eher Werkstatt bei Nacht. Wenig Text, viel Raum.

---

## 2. Tech Stack

| Bereich | Wahl |
|---|---|
| Framework | Next.js (App Router), TypeScript |
| 3D | React Three Fiber + @react-three/drei |
| Scroll | GSAP ScrollTrigger + Lenis (Smooth Scroll) |
| Styling | Tailwind CSS |
| Video | `<video>` mit HLS über Mux Player, YouTube als Fallback |
| Deployment | Vercel |

**Bewusst nicht:** kein Spline, kein Framer, kein Headless CMS. Alles im Repo.

---

## 3. Seitenstruktur

Eine einzige Route `/`, in fünf Abschnitte gegliedert. Der 3D-Canvas liegt
`position: fixed` über die ganze Höhe im Hintergrund. Die HTML-Sektionen
scrollen darüber und steuern per ScrollTrigger die Kamera.

```
SECTION 0  Intro / Titel
SECTION 1  Grundriss (Vogelperspektive)
SECTION 2  Kamerafahrt nach unten
SECTION 3  In der Halle (Augenhöhe, Autos anklickbar)
SECTION 4  Die zwei Typen (Bios, Interviews, Videos)
SECTION 5  Footer / Kontakt
```

---

## 4. Die Scroll-Choreografie

Das ist das Herzstück. Ein einziger ScrollTrigger über die gesamte
Seitenhöhe steuert einen Fortschrittswert `p` von 0 bis 1. Daraus wird jede
Kameraposition abgeleitet. Keine einzelnen Trigger pro Sektion, sonst
ruckelt der Übergang.

| p | Kamera Position (x, y, z) | Blickpunkt | Zustand |
|---|---|---|---|
| 0.00 | 0, 45, 0.1 | 0, 0, 0 | Reine Draufsicht, orthografisch anmutend, Halle als Grundriss |
| 0.25 | 0, 38, 8 | 0, 0, 0 | Leichtes Kippen, erste Tiefe entsteht |
| 0.50 | 0, 22, 20 | 0, 2, 0 | Halbhoch, Dachkonstruktion kommt ins Bild |
| 0.75 | 0, 8, 28 | 0, 2, 0 | Fast auf Höhe, Tor im Rücken |
| 1.00 | 0, 1.65, 26 | 0, 1.65, 0 | Augenhöhe, Besucher steht in der Halle |

**Umsetzungsdetails:**

- Kamerapfad als `CatmullRomCurve3` durch diese Punkte legen, `p` mappt auf
  `curve.getPointAt(p)`. Weicher als lineare Interpolation zwischen Keyframes.
- Blickpunkt separat als zweite Kurve interpolieren, nicht hart auf Origin.
- FOV von 35 (Draufsicht, wirkt technisch) auf 55 (Halle, wirkt räumlich)
  über `p` animieren.
- Kein `lerp` gegen Zielwerte im `useFrame`. Der Scrollwert ist die einzige
  Wahrheit, sonst gibt es Nachlaufen beim schnellen Scrollen.
- Lenis für Smooth Scroll, GSAP ScrollTrigger mit `scrub: 1`.
- Beim Erreichen von `p >= 0.95`: Scroll entkoppeln, Sektion 3 wird zur
  normalen Seite mit klickbaren Autos.

**Zusätzliche Effekte über denselben Wert `p`:**

- Grundriss-Beschriftungen (Stellplatznummern, Maßlinien) sind bei `p < 0.3`
  als HTML-Overlay sichtbar und faden dann aus.
- Hallenbeleuchtung fährt von flach und gleichmäßig (Draufsicht, wie ein
  technischer Plan) auf warm und gerichtet (Innenraum) hoch.
- Ab `p > 0.6` blendet leichter Nebel/Fog ein, damit die Halle Tiefe bekommt.

---

## 5. Die 3D-Szene

### Halle

- Grundfläche 40 x 20 m, Deckenhöhe 6 m. Satteldach mit sichtbarer
  Stahlkonstruktion.
- Boden: heller Industrieestrich, leicht spiegelnd
  (`MeshReflectorMaterial` von drei, aber `blur` hoch und `mixStrength`
  niedrig, sonst sieht es nach Showroom aus).
- Eine Längswand mit Sektionaltoren, eine mit Werkbank, Regalen, Hebebühne.
- Hinten abgetrennt eine Lounge-Ecke: Couch, Kühlschrank, Neonschild,
  Teppich. Das ist erklärtes Ziel der beiden, muss sichtbar sein.

### Stellplätze

12 Stellplätze, auf dem Boden mit gelben Linien markiert und nummeriert.
Jeder Platz ist entweder belegt (Automodell) oder leer (Wunschauto, wird
als schwebender Drahtgitter-Umriss dargestellt). Diese Unterscheidung ist
inhaltlich wichtig: die Seite zeigt, was da ist und was kommen soll.

### Beleuchtung

- Ein `Environment` HDRI (Studio, niedrige Intensität) als Basis.
- Deckenstrahler als `RectAreaLight` in Reihe, das erzeugt die typischen
  Reflexionsstreifen auf Autolack.
- Ein warmes Practical-Light in der Lounge-Ecke.
- Kein Realtime-Schatten von allen Lichtern. Ein `ContactShadows` unter
  jedem Auto plus gebackene Shadow-Map reicht und kostet nichts.

---

## 6. Datenmodell

Alle Inhalte in `/content`. Keine Hardcoding von Fahrzeugdaten in
Komponenten.

### `/content/cars.json`

```json
[
  {
    "id": "cayman-981-s",
    "slot": 1,
    "status": "owned",
    "make": "Porsche",
    "model": "Cayman S (981)",
    "year": 2014,
    "owner": "lion",
    "spec": ["Handschalter", "PCCB Keramikbremse", "Vollausstattung"],
    "why": "Kurzer Text: warum genau dieses Auto.",
    "model3d": "/models/cayman-981.glb",
    "splat": "/splats/cayman-981.spz",
    "media": ["/video/cayman-walkaround.mp4"],
    "accent": "#c8102e"
  },
  {
    "id": "e30-m3",
    "slot": 7,
    "status": "wishlist",
    "make": "BMW",
    "model": "M3 (E30)",
    "year": 1990,
    "owner": "both",
    "spec": ["S14", "Handschalter"],
    "why": "…",
    "model3d": null,
    "splat": null,
    "media": [],
    "accent": "#0066b1"
  }
]
```

`status` ist `owned` oder `wishlist`. `owner` ist `nico`, `lion` oder `both`.
`splat` ist optional und hat Vorrang vor `model3d`, wenn vorhanden.

### `/content/people.json`

Zwei Einträge: Nico Klein und Lion Kalaba. Felder: `id`, `name`, `role`,
`portrait`, `bio` (MDX-Pfad), `firstCar`, `dreamCar`, `videos` (Array aus
`{title, url, poster, type}`), `links`.

Die Bios liegen als MDX unter `/content/bios/nico.mdx` und
`/content/bios/lion.mdx`, damit Formatierung und Zitate möglich sind.
Thema der Bios: nicht Lebenslauf, sondern warum Autos. Erstes Auto, erste
Erinnerung, was das Ding auslöst.

---

## 7. Interaktion in der Halle

- Maus über Auto: Umriss leuchtet in `accent`-Farbe, Cursor wird Pointer,
  kleines HTML-Label mit Modellname folgt der Maus.
- Klick auf Auto: Panel fährt von rechts ein (Desktop) bzw. von unten
  (Mobil). Inhalt: Modell, Baujahr, Spec-Liste, `why`-Text, verlinkte Videos.
  Kamera fährt dabei sanft auf das Auto zu, aber nicht drum herum.
- Escape oder Klick außerhalb: Panel schließt, Kamera fährt zurück.
- Leere Stellplätze sind ebenfalls klickbar und zeigen das Wunschauto mit
  Begründung und grober Preisspanne.
- Freies Umsehen mit Maus: leichte Parallaxe der Kamera (max. 2 Grad),
  keine volle OrbitControls. Der Blick soll geführt bleiben.

---

## 8. Mobile-Strategie (wichtig, nicht optional)

Der Großteil des Traffics kommt über Instagram vom Handy. Echtes WebGL mit
zwölf Automodellen läuft dort nicht flüssig.

**Lösung:** Zwei Renderpfade, Entscheidung beim ersten Laden.

1. **Desktop / starkes Gerät:** volle R3F-Szene wie oben.
2. **Mobil / schwaches Gerät:** Die Kamerafahrt aus Abschnitt 4 wird einmal
   in Blender als Bildsequenz gerendert (240 Frames, WebP, je ~40 KB,
   1080 px breit). Beim Scrollen wird durch die Frames gescrubbt, gezeichnet
   auf ein `<canvas>`. Sieht identisch aus, kostet praktisch keine GPU.
   Die Hallenansicht in Sektion 3 wird auf Mobil zu einer klassischen Liste
   der Autos mit Bildern.

Erkennung über `navigator.hardwareConcurrency`, `deviceMemory` und
`matchMedia('(pointer: coarse)')`. Im Zweifel den leichten Pfad wählen.

**Frames vorladen:** die ersten 30 sofort, den Rest progressiv, sonst hakt
der Anfang.

---

## 9. Asset-Pipeline

- Automodelle als GLB, Draco- und Meshopt-komprimiert, Texturen als KTX2.
  Zielgröße pro Auto unter 3 MB.
- Zwei LOD-Stufen pro Auto: nah (Detailansicht) und fern (Draufsicht).
  In der Draufsicht braucht kein Auto Innenraumgeometrie.
- Gaussian Splats: Format `.spz` oder `.ply`, geladen über den nativen
  Three.js-Splat-Loader. Splats nur laden, wenn das Auto angeklickt wird,
  nie beim Seitenstart.
- Alles über `<Suspense>` und `useGLTF.preload()` mit sinnvoller Reihenfolge:
  Halle zuerst, Autos danach, Splats zuletzt.

**Performance-Budget:**

| Metrik | Ziel |
|---|---|
| Initialer JS-Bundle | < 250 KB gzip |
| Assets bis zur ersten Interaktion | < 4 MB |
| FPS Desktop | stabil 60 |
| Largest Contentful Paint | < 2,5 s |

---

## 10. Design-Direction

- Grundton dunkel: Hintergrund `#0a0a0b`, Flächen `#141416`, Text `#e8e8e6`.
- Ein einziger Akzent für UI: gebrochenes Gelb `#e8b53a`, wie
  Stellplatzmarkierungen. Fahrzeugfarben kommen aus den Autos selbst.
- Typografie: eine technische Grotesk für Fließtext, eine schmale
  kondensierte für Zahlen und Beschriftungen. Keine dritte Schrift.
- Zahlen, Maße und Stellplatznummern wie in einer Bauzeichnung setzen:
  klein, versal, mit Sperrung.
- Keine Schatten unter UI-Elementen, keine Rundungen über 4 px, keine
  Farbverläufe außer im Licht der 3D-Szene.

---

## 11. Barrierefreiheit und Robustheit

- `prefers-reduced-motion`: Scroll-Choreografie wird zu harten Schnitten
  zwischen vier Standbildern. Die Seite bleibt vollständig nutzbar.
- Ohne JavaScript: sinnvoller HTML-Fallback mit allen Inhalten als normale
  Seite. Die Autos sind dann eine Liste, die Bios sind Text.
- Alle Inhalte der 3D-Szene existieren zusätzlich als echtes DOM, damit
  Suchmaschinen und Screenreader sie erreichen.
- Tastaturbedienung: Tab springt durch die Stellplätze, Enter öffnet das
  Panel.

---

## 12. Bauphasen

**Phase 1 — Gerüst**
Next.js aufsetzen, Tailwind, Lenis, leerer R3F-Canvas mit Boxen als
Platzhalter für Halle und Autos. Ziel: die Scroll-Choreografie aus
Abschnitt 4 läuft komplett durch, nur mit grauen Kisten. Nichts anderes.
Dieser Schritt entscheidet über das ganze Projekt, hier so lange feilen,
bis sich die Fahrt richtig anfühlt.

**Phase 2 — Halle**
Echte Hallengeometrie, Boden, Dach, Licht, Nebel. Stellplatzmarkierungen
mit Nummern. Immer noch Platzhalter-Autos.

**Phase 3 — Daten und Interaktion**
`cars.json` anbinden, Hover, Klick, Detail-Panel, Kamerafahrt zum Auto,
leere Slots als Drahtgitter.

**Phase 4 — Inhalte**
Sektion 4 mit den Bios, Portraits, Interviews und Videos. Footer.

**Phase 5 — Mobil**
Zweiter Renderpfad mit Bildsequenz, Geräteerkennung, Listenansicht.

**Phase 6 — Assets und Feinschliff**
Echte Automodelle einsetzen, Splat des Cayman einbauen, Komprimierung,
Ladereihenfolge, Performance-Messung gegen das Budget aus Abschnitt 9.

---

## 13. Was Claude Code beachten soll

- Nach jeder Phase committen und kurz zusammenfassen, was läuft und was
  nicht.
- Keine Platzhalter-Texte im Stil von Lorem Ipsum. Wo Text fehlt, deutlich
  `TODO: Text von Nico` schreiben.
- Keine Fahrzeugmodelle aus unklarer Quelle einbinden. Wo ein GLB fehlt,
  eine simple Blockform mit korrekten Abmessungen des echten Autos setzen.
- Kommentare im Code auf Deutsch, Variablennamen auf Englisch.
- Bei jeder Entscheidung, die die Scroll-Performance betrifft, kurz
  nachfragen statt raten.
