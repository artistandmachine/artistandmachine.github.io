/**
 * TUNE: the motion numbers, in one place. Save and the page hot-reloads.
 *
 * Springs: more `mass` / less `stiffness` = slower, heavier; less
 * `damping` = a little wobble on arrival.
 *
 * Look lives in app/theme.css, copy in data/site.json.
 */

type Spring = { stiffness: number; damping: number; mass?: number };
type Spatial = { strength: number; focus: number };

export const tune = {
  hero: {
    /** ms each slide holds before the carousel advances. */
    rotateMs: 4000,
    /** ms after a click before auto-rotate resumes. */
    resumeAfterClickMs: 3000,
  },

  /** "Spatial scene" depth hover (lib/spatial.ts). strength = how far the
   * scene shifts at the edge (fraction of the image); focus = the depth
   * that stays still (0 farthest, 1 nearest). */
  spatial: {
    tile: { strength: 0.03, focus: 0.5 } as Spatial,
    /** Hero default, for slides with no entry below. */
    hero: { strength: 0.005, focus: 1 } as Spatial,
    /** Per hero slide, in studio.heroImages order. If you change slide 1's
     * focus, also change FLATTEN_DARK in scripts/build-depth.mjs (focus x
     * 255) and run `npm run depth -- --force`. */
    heroSlides: [
      { strength: 0.002, focus: 1 }, // 1: Helium Loop jacket on black
      { strength: 0.01, focus: 1 }, // 2: NetPlus billboard, person walking
      { strength: 0.005, focus: 1 }, // 3: Bureo booth
    ] as Spatial[],
    spring: { stiffness: 120, damping: 25 } as Spring,
  },

  /** Cursor-follow on tiles and hero (lib/useMagnet.ts). */
  magnet: {
    /** Max px the media drifts toward the cursor. */
    move: 3,
    /** Scale while the cursor is over the media. */
    scale: 1.01,
    /** Zoom: heavy and slow to swell in ("stuck in honey"). */
    scaleSpring: { mass: 3, stiffness: 40, damping: 30 } as Spring,
    /** Drift: lighter, tracks the cursor ~3x quicker. */
    moveSpring: { mass: 1, stiffness: 120, damping: 25 } as Spring,
  },

  /** Footer see-saw: wordmark slides in, beam rocks, email counter-slides. */
  footer: {
    wordSlide: 64, // px
    emailSlide: 30, // px
    maxTilt: 4.5, // deg
    tiltSpring: { stiffness: 90, damping: 7, mass: 1 } as Spring,
    emailSpring: { stiffness: 140, damping: 16 } as Spring,
    /** Seconds for the enter-overshoot-settle move. */
    rockDuration: 1.15,
  },

  scroll: {
    /** Lenis smoothing, seconds (its default 1.2 feels sluggish). */
    smoothing: 0.3,
    /** px of room left above a section when nav links jump to it. */
    sectionBuffer: 80,
  },

  /** Fade-up for the intro copy. */
  reveal: {
    duration: 0.6,
    ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
  },
};
