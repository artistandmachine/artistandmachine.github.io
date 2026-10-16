"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useMotionValue, useTransform } from "framer-motion";
import Media from "./Media";
import { useMagnet } from "@/lib/useMagnet";
import { getSpatial, SPATIAL_HERO, SPATIAL_HERO_SLIDES, spatialSupported } from "@/lib/spatial";
import { tune } from "@/lib/tune";
import { lerp, useSettleProgress } from "@/lib/useSettle";

const AUTO_ROTATE_INTERVAL = tune.hero.rotateMs;
const RESUME_DELAY_AFTER_CLICK = tune.hero.resumeAfterClickMs;

/**
 * The opening "settle": the slideshow layer starts covering the whole
 * window and scales down into its slot in the page frame over the first
 * tune.hero.settle viewport heights of scroll. Nothing pins: the slot
 * scrolls with the page as normal and the layer rides on top of it
 * (under the nav), landing as it goes. The slot is re-measured as the
 * page frame narrows behind it (components/PageFrame). Until the first
 * measure the layer is simply fixed to the window, which is where it starts.
 */
function useSettle(slot: React.RefObject<HTMLDivElement | null>) {
  const slotLeft = useMotionValue(0);
  const slotTop = useMotionValue(0); // document coords
  const slotW = useMotionValue(0);
  const slotH = useMotionValue(0);
  const vw = useMotionValue(0);
  const vh = useMotionValue(0);
  // Bottom edge of the nav band at the top of the page (the progress bar
  // opened up behind #nav, see Nav.tsx). The layer starts below it so the
  // band never covers the image, and rides up as the band shrinks.
  const band = useMotionValue(0);
  const [measured, setMeasured] = useState(false);
  const settled = useSettleProgress();
  const bandSettled = useSettleProgress(tune.hero.frameLag); // same timing as the band

  useEffect(() => {
    const el = slot.current;
    if (!el) return;
    const measure = () => {
      const r = el.getBoundingClientRect();
      slotLeft.set(r.left);
      slotTop.set(r.top + window.scrollY);
      slotW.set(r.width);
      slotH.set(r.height);
      vw.set(document.documentElement.clientWidth);
      vh.set(window.innerHeight);
      // #nav is sticky, so its bottom is the band's full height at any scroll.
      band.set(document.getElementById("nav")?.getBoundingClientRect().bottom ?? 0);
      setMeasured(true);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [slot, slotLeft, slotTop, slotW, slotH, vw, vh, band]);

  const left = useTransform([settled, slotLeft], ([p, l]: number[]) => lerp(-l, 0, p));
  const top = useTransform([settled, slotTop, bandSettled, band], ([p, t, q, b]: number[]) =>
    lerp(-t, 0, p) + b * (1 - q),
  );
  const width = useTransform([settled, slotW, vw], ([p, w, v]: number[]) => lerp(v, w, p));
  const height = useTransform([settled, slotH, vh, band], ([p, h, v, b]: number[]) => lerp(v - b, h, p));

  return { style: { left, top, width, height }, settled, measured };
}

/** Site copy where *asterisks* mark italic runs. The last two words are
 * joined with a no-break space so the last line is never a lone word. */
function Emphasis({ text }: { text: string }) {
  const i = text.lastIndexOf(" ");
  const glued = i > 0 ? text.slice(0, i) + "\u00A0" + text.slice(i + 1) : text;
  return (
    <>
      {glued.split(/(\*[^*]+\*)/g).map((part, i) =>
        part.startsWith("*") && part.endsWith("*") ? <em key={i}>{part.slice(1, -1)}</em> : part,
      )}
    </>
  );
}

export default function Hero({ images, captions = [] }: { images: string[]; captions?: string[] }) {
  const [active, setActive] = useState(0);
  const [autoRotate, setAutoRotate] = useState(true);
  const resumeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const touchStartXRef = useRef<number | null>(null);
  const slotRef = useRef<HTMLDivElement>(null);
  const settle = useSettle(slotRef);

  // Subtle translate/scale toward the cursor, mirroring the Work tiles.
  // Handled here rather than via Media's `cursorFollow` because the
  // carousel's click-zone buttons sit above the slides and would
  // swallow the pointer events Media needs.
  const magnet = useMagnet<HTMLDivElement>();
  // Captions counter-drift: the image leans toward the cursor by up to
  // magnet.move / 2 px, the caption leans away by up to captionShift px.
  const counter = -tune.hero.captionShift / (tune.magnet.move / 2);
  const captionX = useTransform(magnet.style.x, (v) => v * counter);
  const captionY = useTransform(magnet.style.y, (v) => v * counter);

  // Spatial-scene hover (lib/spatial.ts), driven from here for the same
  // reason as the magnet. The canvas lives in the active slide; when the
  // carousel rotates under the cursor it hops to the new slide mid-spring.
  const slideRefs = useRef<(HTMLDivElement | null)[]>([]);
  const hovering = useRef(false);
  function spatialEnter(index: number) {
    // Only once the layer has landed: the depth canvas is sized on enter.
    if (settle.settled.get() < 1) return;
    const el = slideRefs.current[index];
    if (!el || !spatialSupported()) return;
    getSpatial()?.enter(el, images[index], SPATIAL_HERO_SLIDES[index] ?? SPATIAL_HERO);
  }
  useEffect(() => {
    if (hovering.current) spatialEnter(active);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);
  useEffect(
    () =>
      settle.settled.on("change", (p) => {
        if (!hovering.current) return;
        if (p < 1) getSpatial()?.leave();
        else spatialEnter(active);
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [settle.settled, active],
  );
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
    <section id="s-hero" className="flex w-full flex-col items-center px-3 md:px-8 lg:px-12">
      {/* The slot holds the hero's resting place in the frame; the carousel
          layer inside starts full-window and settles into it (useSettle).
          The negative top margin pulls it up under the sticky progress bar
          + nav (h-1.5 + h-16 / sm:h-19 in Nav.tsx) so it sits flush with the
          top of the page: only the sides scale in, never a top gap. */}
      <div id="hero-slot" ref={slotRef} className="relative -mt-[70px] aspect-1104/621 w-full sm:-mt-[82px]">
        <motion.div
          id="hero-carousel"
          ref={magnet.ref}
          className={`${settle.measured ? "absolute" : "fixed inset-x-0 bottom-0 top-[70px] sm:top-[82px]"} z-40`}
          style={settle.measured ? settle.style : undefined}
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
              {/* Caption: left, vertically centred, fades with its slide.
                  Outside the magnet layer so it holds still. The left wash
                  keeps white type readable on light photos. */}
              {captions[i] && (
                <div className="pointer-events-none absolute inset-0 flex items-center bg-linear-to-r from-black/55 via-black/25 via-45% to-transparent to-75% px-6 md:px-10 lg:px-14">
                  <motion.p
                    className="text-hero-caption max-w-[13em] text-balance lg:max-w-[50vw] text-white will-change-transform"
                    style={{ x: captionX, y: captionY }}
                  >
                    <Emphasis text={captions[i]} />
                  </motion.p>
                </div>
              )}
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
        </motion.div>
      </div>
      <div className="spacer-1" />
    </section>
  );
}
