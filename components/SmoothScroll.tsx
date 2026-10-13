"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import { tune } from "@/lib/tune";

let lenisInstance: Lenis | null = null;

/** Lets other components (e.g. Nav's jump-links) drive the same scroll
 * animation Lenis is running, instead of fighting it with a native
 * scrollIntoView/scrollTo call. Null before mount or if Lenis fails. */
export function getLenis() {
  return lenisInstance;
}

/**
 * A light touch of scroll easing — deliberately a much shorter duration
 * than Lenis's default (1.2s), which reads as sluggish. This should
 * smooth out the edges of a scroll gesture without introducing the lag
 * native `scroll-behavior: smooth` caused on every wheel tick.
 */
export default function SmoothScroll() {
  useEffect(() => {
    const lenis = new Lenis({
      duration: tune.scroll.smoothing,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    });
    lenisInstance = lenis;

    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    return () => {
      lenis.destroy();
      lenisInstance = null;
    };
  }, []);

  return null;
}
