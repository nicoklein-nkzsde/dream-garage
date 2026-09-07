import SceneMount from "@/components/scene/SceneMount";
import SmoothScroll from "@/components/scroll/SmoothScroll";
import { CHOREOGRAPHY_ID } from "@/components/scroll/constants";
import ChoreographyOverlay from "@/components/ui/ChoreographyOverlay";
import CarPanel from "@/components/ui/CarPanel";
import HoverLabel from "@/components/ui/HoverLabel";
import LookHint from "@/components/ui/LookHint";
import { HallSection, PeopleSection, SiteFooter } from "@/components/ui/Sections";

/** Höhe der Kamerafahrt in Viewport-Höhen. Mehr = ruhigere Fahrt. */


export default function Home() {
  return (
    <>
      <SmoothScroll />
      <SceneMount />
      <ChoreographyOverlay />
      <CarPanel />
      <HoverLabel />
      <LookHint />

      <noscript>
        <p className="p-6 text-sm text-muted">
          Ohne JavaScript bleibt die Halle statisch. Alle Inhalte stehen
          unterhalb als normale Seite.
        </p>
      </noscript>

      <main>
        {/* Sektion 0–2: reine Scrollstrecke, die die Kamera treibt. */}
        {/* Auf dem Handy kürzer: dieselbe Fahrt, weniger Wischerei. */}
        <div
          id={CHOREOGRAPHY_ID}
          className="h-[460svh] md:h-[620svh]"
          aria-hidden="true"
        />

        <HallSection />
        <PeopleSection />
        <SiteFooter />
      </main>
    </>
  );
}
