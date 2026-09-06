import SceneMount from "@/components/scene/SceneMount";
import SmoothScroll from "@/components/scroll/SmoothScroll";
import { CHOREOGRAPHY_ID } from "@/components/scroll/constants";
import ChoreographyOverlay from "@/components/ui/ChoreographyOverlay";
import { HallSection, PeopleSection, SiteFooter } from "@/components/ui/Sections";

/** Höhe der Kamerafahrt in Viewport-Höhen. Mehr = ruhigere Fahrt. */
const CHOREOGRAPHY_HEIGHT = "620svh";

export default function Home() {
  return (
    <>
      <SmoothScroll />
      <SceneMount />
      <ChoreographyOverlay />

      <noscript>
        <p className="p-6 text-sm text-muted">
          Ohne JavaScript bleibt die Halle statisch. Alle Inhalte stehen
          unterhalb als normale Seite.
        </p>
      </noscript>

      <main>
        {/* Sektion 0–2: reine Scrollstrecke, die die Kamera treibt. */}
        <div
          id={CHOREOGRAPHY_ID}
          style={{ height: CHOREOGRAPHY_HEIGHT }}
          aria-hidden="true"
        />

        <HallSection />
        <PeopleSection />
        <SiteFooter />
      </main>
    </>
  );
}
