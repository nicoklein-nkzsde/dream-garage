"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { setProgress } from "./scrollState";
import { CHOREOGRAPHY_ID } from "./constants";
import { selection } from "@/lib/selectionStore";
import { REDUCED_MOTION_STOPS } from "@/lib/cameraPath";

/** Nachlauf des Scrubs in Sekunden. Briefing Abschnitt 4. */
const SCRUB = 1;

export default function SmoothScroll() {
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const trigger = document.getElementById(CHOREOGRAPHY_ID);
    if (!trigger) return;

    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    let lenis: Lenis | null = null;
    let raf: ((time: number) => void) | null = null;

    if (!reduced) {
      lenis = new Lenis({ lerp: 0.1, wheelMultiplier: 1 });
      lenis.on("scroll", ScrollTrigger.update);
      raf = (time: number) => lenis?.raf(time * 1000);
      gsap.ticker.add(raf);
      // Ohne lagSmoothing springt die Fahrt nach einem Tab-Wechsel.
      gsap.ticker.lagSmoothing(0);

      // Nur im Dev-Build: erlaubt es, Positionen der Fahrt gezielt anzuspringen.
      if (process.env.NODE_ENV !== "production") {
        const target = window as unknown as Record<string, unknown>;
        target.__lenis = lenis;
        target.__setProgress = setProgress;
        target.__select = (id: string | null) => selection.set(id);
      }
    }

    // Proxy-Objekt statt State: der Tween schreibt p, wir geben ihn weiter.
    const proxy = { p: 0 };

    const tween = gsap.to(proxy, {
      p: 1,
      ease: "none",
      onUpdate: () => {
        if (reduced) {
          // Harte Schnitte zwischen vier Standbildern.
          const stop = REDUCED_MOTION_STOPS.reduce((best, candidate) =>
            Math.abs(candidate - proxy.p) < Math.abs(best - proxy.p)
              ? candidate
              : best,
          );
          setProgress(stop);
        } else {
          setProgress(proxy.p);
        }
      },
      scrollTrigger: {
        trigger,
        start: "top top",
        end: "bottom bottom",
        scrub: reduced ? false : SCRUB,
      },
    });

    return () => {
      tween.scrollTrigger?.kill();
      tween.kill();
      if (raf) gsap.ticker.remove(raf);
      lenis?.destroy();
    };
  }, []);

  return null;
}
