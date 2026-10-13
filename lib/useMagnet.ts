"use client";

import { useRef } from "react";
import { useMotionValue, useSpring } from "framer-motion";
import { tune } from "@/lib/tune";

/** Max px the media drifts toward the cursor. */
export const MAGNET_MOVE = tune.magnet.move;
/** Scale while the cursor is over the media. */
export const MAGNET_SCALE = tune.magnet.scale;
/**
 * Two springs, so the zoom and the drift can be tuned independently.
 * Both are damped enough never to overshoot.
 *  - more `mass` / less `stiffness` → slower, thicker honey
 *  - less `damping` → a little wobble on arrival
 */
/** Zoom: the "stuck in honey" feel — heavy and slow to swell in. */
const SCALE_SPRING = tune.magnet.scaleSpring;
/** Drift: lighter, so x/y track the cursor more readily (~3× quicker). */
const MOVE_SPRING = tune.magnet.moveSpring;

/**
 * Cursor-follow ("magnet") behavior shared by the Work tiles (via Media)
 * and the Hero carousel. Spread `handlers` on the element that receives
 * pointer events and `style` on a framer-motion element inside it.
 */
export function useMagnet<T extends HTMLElement>(enabled = true) {
  const ref = useRef<T>(null);
  const x = useSpring(useMotionValue(0), MOVE_SPRING);
  const y = useSpring(useMotionValue(0), MOVE_SPRING);
  const scale = useSpring(useMotionValue(1), SCALE_SPRING);

  function onMouseMove(e: React.MouseEvent) {
    const el = ref.current;
    if (!enabled || !el) return;
    const rect = el.getBoundingClientRect();
    x.set(((e.clientX - rect.left) / rect.width - 0.5) * MAGNET_MOVE);
    y.set(((e.clientY - rect.top) / rect.height - 0.5) * MAGNET_MOVE);
    scale.set(MAGNET_SCALE);
  }

  function onMouseLeave() {
    if (!enabled) return;
    x.set(0);
    y.set(0);
    scale.set(1);
  }

  return { ref, handlers: { onMouseMove, onMouseLeave }, style: { x, y, scale } };
}
