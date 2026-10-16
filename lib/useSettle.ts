"use client";

import { useEffect } from "react";
import { useMotionValue, useScroll, useTransform } from "framer-motion";
import { tune } from "@/lib/tune";

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));
export const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Scroll position (px) where a settle with this `lag` finishes. */
export function settleEndPx(lag = 0) {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  return reduced ? 0 : (1 + lag) * tune.hero.settle * window.innerHeight;
}

/**
 * Progress (0..1) of the opening "settle" as the page scrolls: 0 at the top
 * (everything full-window), 1 once settled into the framed layout. `lag`
 * delays the start by that fraction of the settle distance, so the frame
 * can trail the hero. Reduced motion or tune.hero.settle = 0 → always 1.
 */
export function useSettleProgress(lag = 0) {
  const { scrollY } = useScroll();
  // -1 = not measured yet (server render / first paint): treat as the top
  // of the page, which is where a fresh load starts, so nothing flashes
  // settled and then jumps open. 0 = no settle (reduced motion / off).
  const distance = useMotionValue(-1);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const measure = () => distance.set(reduced ? 0 : tune.hero.settle * window.innerHeight);
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [distance]);

  return useTransform([scrollY, distance], ([y, d]: number[]) =>
    d < 0 ? 0 : d === 0 ? 1 : easeInOut(clamp01((y - lag * d) / d)),
  );
}
