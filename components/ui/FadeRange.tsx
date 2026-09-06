"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { onProgress } from "@/components/scroll/scrollState";
import { smoothstep } from "@/lib/cameraPath";

type Props = {
  /** Ein- und Ausblendbereiche in p. */
  range: [number, number, number, number];
  className?: string;
  children: ReactNode;
};

/**
 * Blendet DOM-Inhalte am selben Fortschrittswert ein und aus wie die Kamera.
 * Schreibt direkt auf das Element, kein React-Render pro Frame.
 */
export default function FadeRange({ range, className, children }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [inFrom, inTo, outFrom, outTo] = range;

  useEffect(() => {
    return onProgress((p) => {
      const element = ref.current;
      if (!element) return;
      const opacity =
        smoothstep(inFrom, inTo, p) * (1 - smoothstep(outFrom, outTo, p));
      element.style.opacity = String(opacity);
      element.style.visibility = opacity < 0.01 ? "hidden" : "visible";
    });
  }, [inFrom, inTo, outFrom, outTo]);

  return (
    <div ref={ref} className={className} style={{ opacity: 0 }}>
      {children}
    </div>
  );
}
