"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Photo from "./Photo";
import { releaseSpatial } from "@/lib/spatial";
import { getLenis } from "./SmoothScroll";
import type { Project } from "./ProjectTile";

/** Every slide a project has: the cover first (playing its video if it
 * has one), then any extra `images`, in order. */
export function projectSlides(project: Project) {
  return [
    { src: project.image, video: project.video },
    ...(project.images ?? []).map((src) => ({ src, video: undefined })),
  ];
}

/**
 * Full-screen overlay slideshow for a single project, opened from a Work
 * tile. Mirrors the Hero carousel's interaction model — crossfading
 * slides, left/right click halves with the prev/next cursors, square
 * pagination dots, and swipe on touch — minus auto-rotate, since here
 * the reader is deliberately looking. Media is letterboxed
 * (object-contain) rather than cropped so the whole piece shows.
 *
 * Closes on the × button, Escape, or a click on the backdrop outside
 * the media; arrow keys page. Page scroll (Lenis) is paused while open.
 */
export default function ProjectSlideshow({
  project,
  onClose,
}: {
  project: Project;
  onClose: () => void;
}) {
  const slides = projectSlides(project);
  const [active, setActive] = useState(0);
  const touchStartXRef = useRef<number | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const many = slides.length > 1;

  const go = (delta: number) =>
    setActive((i) => (i + delta + slides.length) % slides.length);

  // Pause page scroll, focus the close button, and restore focus to
  // whatever opened the overlay when it closes. Also settle the opening
  // tile's spatial hover: no depth effect runs under or in the slideshow.
  useEffect(() => {
    releaseSpatial();
    const opener = document.activeElement as HTMLElement | null;
    const lenis = getLenis();
    lenis?.stop();
    const prevOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    closeRef.current?.focus();
    return () => {
      lenis?.start();
      document.documentElement.style.overflow = prevOverflow;
      opener?.focus?.();
    };
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      else if (many && e.key === "ArrowRight") go(1);
      else if (many && e.key === "ArrowLeft") go(-1);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onClose, many, slides.length]);

  function handleTouchEnd(e: React.TouchEvent) {
    if (touchStartXRef.current === null) return;
    const deltaX = e.changedTouches[0].clientX - touchStartXRef.current;
    if (many && Math.abs(deltaX) > 50) go(deltaX < 0 ? 1 : -1);
    touchStartXRef.current = null;
  }

  return createPortal(
    <div
      id="project-slideshow"
      role="dialog"
      aria-modal="true"
      aria-label={project.title}
      className="fixed inset-0 z-[60] flex flex-col bg-black/90 text-white"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Header: title + counter on the left, close on the right */}
      <div className="flex w-full items-center justify-between gap-6 px-4 py-3 md:px-10 lg:px-14">
        <div className="flex min-w-0 items-baseline gap-4">
          <h2 className="text-project-title truncate">{project.title}</h2>
          {many && (
            <span className="text-project-meta shrink-0 text-white/60">
              {active + 1} / {slides.length}
            </span>
          )}
        </div>
        <button
          ref={closeRef}
          type="button"
          aria-label="Close"
          onClick={onClose}
          className="-mr-2 flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center transition-opacity duration-200 ease-out hover:opacity-60 focus-visible:outline-2 focus-visible:outline-accent"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
            <path d="M3 3l14 14M17 3L3 17" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        </button>
      </div>

      {/* Stage */}
      <div
        className="relative mx-4 mb-4 min-h-0 flex-1 md:mx-10 md:mb-10 lg:mx-14"
        onTouchStart={(e) => (touchStartXRef.current = e.touches[0].clientX)}
        onTouchEnd={handleTouchEnd}
      >
        {slides.map((slide, i) => (
          <div
            key={slide.src + i}
            className={`absolute inset-0 transition-opacity duration-700 ease-out ${
              i === active ? "" : "pointer-events-none"
            }`}
            style={{ opacity: i === active ? 1 : 0 }}
            aria-hidden={i !== active}
          >
            {slide.video ? (
              <video
                src={slide.video}
                poster={slide.src}
                autoPlay
                muted
                loop
                playsInline
                className="absolute inset-0 h-full w-full object-contain"
              />
            ) : (
              <Photo
                src={slide.src}
                alt={`${project.title} — image ${i + 1}`}
                fill
                sizes="100vw"
                loading="eager"
                className="object-contain"
              />
            )}
          </div>
        ))}

        {many && (
          <>
            <button
              type="button"
              aria-label="Previous image"
              onClick={() => go(-1)}
              style={{ cursor: "url(/icons/cursor-prev.svg) 16 16, pointer" }}
              className="absolute inset-y-0 left-0 w-1/2 focus-visible:outline-2 focus-visible:outline-accent"
            />
            <button
              type="button"
              aria-label="Next image"
              onClick={() => go(1)}
              style={{ cursor: "url(/icons/cursor-next.svg) 16 16, pointer" }}
              className="absolute inset-y-0 right-0 w-1/2 focus-visible:outline-2 focus-visible:outline-accent"
            />
            <div className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-4 sm:gap-12">
              {slides.map((slide, i) => (
                <button
                  key={slide.src + i}
                  type="button"
                  aria-label={`Go to image ${i + 1}`}
                  aria-current={i === active ? "true" : undefined}
                  onClick={() => setActive(i)}
                  className="group flex shrink-0 cursor-pointer items-center justify-center p-4 sm:p-6 focus-visible:outline-2 focus-visible:outline-accent"
                >
                  <span
                    aria-hidden="true"
                    className={`h-1.5 w-1.5 shrink-0 bg-white transition-transform duration-200 ease-out ${
                      i === active ? "" : "opacity-50 group-hover:scale-120 group-hover:opacity-100"
                    }`}
                  />
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>,
    document.body
  );
}
