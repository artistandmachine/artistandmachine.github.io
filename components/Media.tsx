"use client";

import { useRef, useState } from "react";
import { motion } from "framer-motion";
import Photo from "./Photo";
import { useMagnet } from "@/lib/useMagnet";
import { getSpatial, spatialSupported } from "@/lib/spatial";

/**
 * Shared treatment for every media slot in the design: desaturated by
 * default (matching the Figma source's Overlay technique), snapping to
 * full color instantly on hover-in and easing back to desaturated over
 * 700ms on hover-out. Sits on a `mist` placeholder fill, so
 * a slot with no real file yet (Photo quietly renders nothing on a
 * 404) still reads as an intentional empty swatch — and starts using
 * the hover treatment automatically the moment a real photo lands at
 * that path, no code change needed.
 *
 * Pass `video` to play a looping muted clip instead of a static photo
 * (source lives under `public/videos/...`, mirroring the `images/`
 * layout). `src` still doubles as the video's poster frame and as the
 * fallback if the video file 404s, so every video slot degrades to a
 * real image instead of a broken player.
 */
export default function Media({
  src,
  video,
  alt = "",
  sizes,
  priority,
  loading,
  className = "",
  cursorFollow = false,
  spatial = false,
}: {
  src: string;
  video?: string;
  alt?: string;
  sizes: string;
  priority?: boolean;
  /** Override the default lazy load — e.g. "eager" for off-screen hero
   * slides that must be ready before the carousel rotates to them.
   * Ignored when `priority` is set (that already forces eager). */
  loading?: "eager" | "lazy";
  className?: string;
  /** Opt in to the drift/scale-toward-cursor hover treatment (see
   * lib/useMagnet). Off by default so most media slots stay static. */
  cursorFollow?: boolean;
  /** Opt in to the depth "spatial scene" hover (lib/spatial.ts). Needs a
   * `<name>-depth.webp` beside the image (npm run depth); without one, or on
   * touch / reduced motion / video, the slot just behaves as before. */
  spatial?: boolean;
}) {
  const [videoFailed, setVideoFailed] = useState(false);
  const magnet = useMagnet<HTMLDivElement>(cursorFollow);
  const stage = useRef<HTMLDivElement>(null);
  const spatialOn = spatial && !(video && !videoFailed);

  const handlers = {
    onMouseEnter() {
      if (!spatialOn || !stage.current || !spatialSupported()) return;
      getSpatial()?.enter(stage.current, src);
    },
    onMouseMove(e: React.MouseEvent) {
      magnet.handlers.onMouseMove(e);
      if (!spatialOn) return;
      const r = e.currentTarget.getBoundingClientRect();
      getSpatial()?.move(((e.clientX - r.left) / r.width - 0.5) * 2, ((e.clientY - r.top) / r.height - 0.5) * 2);
    },
    onMouseLeave() {
      magnet.handlers.onMouseLeave();
      if (spatialOn) getSpatial()?.leave();
    },
  };
  /*
  Disable the hover-color effect entirely (always desaturated, or always full color) — delete group-hover:opacity-0 (stays desaturated) or delete opacity-100/set it to opacity-0 (stays full color).
Change the speed — duration-700 (hover-out) / duration-0 (hover-in) control the ease timing.
Scope it to specific sections only — since every section shares this one Media component, an on/off toggle would need a new prop (e.g. desaturate?: boolean) rather than editing this file directly, if you want it to vary by section.
*/

  return (
    <div
      ref={magnet.ref}
      {...handlers}
      className={`group relative overflow-hidden bg-skeleton-fill ${className}`}
    >
      {/* The spatial canvas is mounted in here (over the photo) while
          hovered, so it rides the magnet transform with it. */}
      <motion.div
        ref={stage}
        className={cursorFollow ? "absolute inset-0 will-change-transform" : "absolute inset-0"}
        style={cursorFollow ? magnet.style : undefined}
      >
        {video && !videoFailed ? (
          <video
            src={video}
            poster={src}
            autoPlay
            muted
            loop
            playsInline
            onError={() => setVideoFailed(true)}
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <Photo src={src} alt={alt} fill sizes={sizes} priority={priority} loading={loading} className="object-cover" />
        )}
      </motion.div>
      <div className="pointer-events-none absolute inset-0 bg-black mix-blend-saturation opacity-0 transition-opacity duration-700 ease-out group-hover:opacity-0 group-hover:duration-0" />
    </div>
  );
}
