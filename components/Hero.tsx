"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import Media from "./Media";
import { useMagnet } from "@/lib/useMagnet";
import { getSpatial, SPATIAL_HERO, SPATIAL_HERO_SLIDES, spatialSupported } from "@/lib/spatial";
import { tune } from "@/lib/tune";

const AUTO_ROTATE_INTERVAL = tune.hero.rotateMs;
const RESUME_DELAY_AFTER_CLICK = tune.hero.resumeAfterClickMs;

export default function Hero({ images }: { images: string[] }) {
  const [active, setActive] = useState(0);
  const [autoRotate, setAutoRotate] = useState(true);
  const resumeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const touchStartXRef = useRef<number | null>(null);

  // Subtle translate/scale toward the cursor, mirroring the Work tiles.
  // Handled here rather than via Media's `cursorFollow` because the
  // carousel's click-zone buttons sit above the slides and would
  // swallow the pointer events Media needs.
  const magnet = useMagnet<HTMLDivElement>();

  // Spatial-scene hover (lib/spatial.ts), driven from here for the same
  // reason as the magnet. The canvas lives in the active slide; when the
  // carousel rotates under the cursor it hops to the new slide mid-spring.
  const slideRefs = useRef<(HTMLDivElement | null)[]>([]);
  const hovering = useRef(false);
  function spatialEnter(index: number) {
    const el = slideRefs.current[index];
    if (!el || !spatialSupported()) return;
    getSpatial()?.enter(el, images[index], SPATIAL_HERO_SLIDES[index] ?? SPATIAL_HERO);
  }
  useEffect(() => {
    if (hovering.current) spatialEnter(active);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);
  const handlers = {
    onMouseEnter() {
      hovering.current = true;
      spatialEnter(active);
    },
    onMouseMove(e: React.MouseEvent) {
      magnet.handlers.onMouseMove(e);
      const r = e.currentTarget.getBoundingClientRect();
      getSpatial()?.move(((e.clientX - r.left) / r.width - 0.5) * 2, ((e.clientY - r.top) / r.height - 0.5) * 2);
    },
    onMouseLeave() {
      hovering.current = false;
      magnet.handlers.onMouseLeave();
      getSpatial()?.leave();
    },
  };

  useEffect(() => {
    if (images.length <= 1 || !autoRotate) return;
    const id = setInterval(() => {
      setActive((i) => (i + 1) % images.length);
    }, AUTO_ROTATE_INTERVAL);
    return () => clearInterval(id);
  }, [images.length, autoRotate]);

  // Any manual navigation pauses auto-rotate, then resumes it after a
  // short delay instead of immediately fighting the user's click.
  useEffect(() => {
    return () => {
      if (resumeTimeoutRef.current) clearTimeout(resumeTimeoutRef.current);
    };
  }, []);

  function goToSlide(next: number | ((i: number) => number)) {
    setActive(next);
    setAutoRotate(false);
    if (resumeTimeoutRef.current) clearTimeout(resumeTimeoutRef.current);
    resumeTimeoutRef.current = setTimeout(() => setAutoRotate(true), RESUME_DELAY_AFTER_CLICK);
  }

  function handleTouchStart(e: React.TouchEvent) {
    touchStartXRef.current = e.touches[0].clientX;
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (touchStartXRef.current === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const deltaX = touchEndX - touchStartXRef.current;
    if (Math.abs(deltaX) > 50) {
      if (deltaX < 0) {
        // Swiped left -> next
        goToSlide((i) => (i + 1) % images.length);
      } else {
        // Swiped right -> prev
        goToSlide((i) => (i - 1 + images.length) % images.length);
      }
    }
    touchStartXRef.current = null;
  }

  return (
    <section id="s-hero" className="flex w-full flex-col items-center overflow-clip px-3 md:px-8 lg:px-12">
      <div
        id="hero-carousel"
        ref={magnet.ref}
        className="relative aspect-1104/621 w-full"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        {...handlers}
      >
        {images.map((src, i) => (
          <div
            key={src}
            className={`absolute inset-0 overflow-hidden transition-opacity duration-700 ease-out ${
              i === active ? "" : "pointer-events-none"
            }`}
            style={{ opacity: i === active ? 1 : 0 }}
          >
            {/* All slides share one spring, so the incoming slide
                crossfades in already where the outgoing one sat. */}
            <motion.div
              ref={(el) => {
                slideRefs.current[i] = el;
              }}
              className="relative h-full w-full will-change-transform"
              style={magnet.style}
            >
              <Media
                src={src}
                sizes="(min-width: 1200px) 1104px, 100vw"
                priority={i === 0}
                loading={i === 0 ? undefined : "eager"}
                className="h-full w-full"
              />
            </motion.div>
          </div>
        ))}

        {images.length > 1 && (
          <>
            {/* Click zones: right half advances, left half goes back.
                Sit above the slides but below the pagination row below. */}
            <button
              type="button"
              aria-label="Previous slide"
              onClick={() => goToSlide((i) => (i - 1 + images.length) % images.length)}
              style={{ cursor: "url(/icons/cursor-prev.svg) 16 16, pointer" }}
              className="absolute inset-y-0 left-0 w-1/2 focus-visible:outline-2 focus-visible:outline-accent"
            />
            <button
              type="button"
              aria-label="Next slide"
              onClick={() => goToSlide((i) => (i + 1) % images.length)}
              style={{ cursor: "url(/icons/cursor-next.svg) 16 16, pointer" }}
              className="absolute inset-y-0 right-0 w-1/2 focus-visible:outline-2 focus-visible:outline-accent"
            />
          </>
        )}

        {images.length > 1 && (
          <div id="hero-pagination" className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-4 sm:gap-12 md:gap-30">
            {images.map((src, i) => (
              <button
                key={src}
                type="button"
                aria-label={`Go to slide ${i + 1}`}
                aria-current={i === active ? "true" : undefined}
                onClick={() => goToSlide(i)}
                className="group flex shrink-0 cursor-pointer items-center justify-center p-4 sm:p-6 focus-visible:outline-2 focus-visible:outline-accent">
                <span
                  aria-hidden="true"
                  className={`h-1.5 w-1.5 shrink-0 bg-on-primary-container transition-transform duration-200 ease-out ${
                    i === active ? "" : "opacity-50 group-hover:scale-120 group-hover:opacity-100"
                  }`}
                />
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="spacer-1" />
    </section>
  );
}
