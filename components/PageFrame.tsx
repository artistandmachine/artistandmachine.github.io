"use client";

import { motion, useTransform } from "framer-motion";
import { useSettleProgress } from "@/lib/useSettle";
import { tune } from "@/lib/tune";

// The frame's resting shape: a 2vw letterbox gutter, capped at 1800px.
const GUTTER_VW = 2;
const MAX_W = 1800;

/**
 * The outer letterbox (gutter) and the page frame inside it. At the top of
 * the page the frame is full-bleed; it narrows to its set width as the
 * page scrolls, trailing the hero's settle by tune.hero.frameLag. The nav
 * progress bar lives in the frame, so it narrows with it.
 */
export default function PageFrame({ children }: { children: React.ReactNode }) {
  const q = useSettleProgress(tune.hero.frameLag);
  const paddingInline = useTransform(q, (v) => `${v * GUTTER_VW}vw`);
  const maxWidth = useTransform(q, (v) => `calc(${MAX_W}px + (100vw - ${MAX_W}px) * ${1 - v})`);

  return (
    <motion.div id="page-gutter" className="flex w-full flex-col items-center" style={{ paddingInline }}>
      <motion.div id="page-frame" className="flex w-full flex-col items-center bg-surface" style={{ maxWidth }}>
        {children}
      </motion.div>
    </motion.div>
  );
}
