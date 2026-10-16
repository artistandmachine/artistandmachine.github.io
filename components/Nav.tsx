"use client";

import { useEffect, useState } from "react";
import { motion, useMotionValue, useScroll, useTransform } from "framer-motion";
import { getLenis } from "./SmoothScroll";
import { hideOffset, useFillerProgress } from "@/lib/useAboutEndProgress";
import ThemeToggle from "./ThemeToggle";
import { tune } from "@/lib/tune";
import { settleEndPx, useSettleProgress } from "@/lib/useSettle";

// Matches the 90px sticky-nav buffer sections use to decide when they've
// "started" (see useActiveSection and the offset on each section's own
// scroll-progress tracker), so a nav-link click lands a section exactly
// where it's considered active instead of tucking it under the nav.
const SECTION_SCROLL_BUFFER = tune.scroll.sectionBuffer;

const NAV_SECTION_IDS = ["#s-work", "#s-about"];

function smoothScrollTo(e: React.MouseEvent<HTMLAnchorElement>, href: string) {
  const target = document.querySelector(href);
  if (!target) return;
  e.preventDefault();
  const lenis = getLenis();
  if (lenis) {
    lenis.scrollTo(target as HTMLElement, { offset: -SECTION_SCROLL_BUFFER });
  } else {
    const top = target.getBoundingClientRect().top + window.scrollY - SECTION_SCROLL_BUFFER;
    window.scrollTo({ top, behavior: "smooth" });
  }
}

function NavLink({
  href,
  active,
  children,
}: {
  href: string;
  active?: boolean;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      onClick={(e) => smoothScrollTo(e, href)}
      className="group relative flex cursor-pointer select-none items-center gap-2.5 py-0.5 pl-1 pr-1.5"
    >
      <p
        className={`text-nav-link whitespace-nowrap transition-opacity duration-200 ease-out group-active:opacity-20 ${active ? "text-accent" : "text-on-surface opacity-100 group-hover:opacity-60"
          }`}
      >
        {children}
      </p>
      {/* nav-dev: white so it inverts with the rest of the blended #nav */}
      <span className="absolute bottom-0 right-0 top-0 w-px bg-white" />
    </a>
  );
}

/** Which nav-linked section (#s-work, #s-about) is currently active, for
 * the "active" nav-link state. A section becomes active once its top has
 * scrolled up past a buffer from the top of the viewport (matching
 * the sticky nav's height), and stays active until the next section
 * crosses that same line. */
function useActiveSection(ids: string[], buffer = SECTION_SCROLL_BUFFER) {
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    const elements = ids
      .map((id) => document.querySelector(id))
      .filter((el): el is HTMLElement => el !== null);

    let ticking = false;

    function update() {
      ticking = false;
      const endMarker = document.querySelector("#end") || document.querySelector("#footer");
      if (endMarker && endMarker.getBoundingClientRect().top <= buffer) {
        setActive(null);
        return;
      }
      let current: string | null = null;
      for (const el of elements) {
        if (el.getBoundingClientRect().top <= buffer) {
          current = `#${el.id}`;
        }
      }
      setActive(current);
    }

    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    }

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [ids, buffer]);

  return active;
}

/** Page scroll progress (0..1) that only starts counting once the nav
 * band has shrunk to its 6px strip, so the lavender fill begins at 0
 * when the bar reaches its normal size and ends at the bottom of the page. */
function useBarProgress() {
  const { scrollY } = useScroll();
  const start = useMotionValue(0);
  const end = useMotionValue(1);

  useEffect(() => {
    const measure = () => {
      start.set(settleEndPx(tune.hero.frameLag));
      end.set(document.documentElement.scrollHeight - window.innerHeight);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(document.body);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [start, end]);

  return useTransform([scrollY, start, end], ([y, s, e]: number[]) =>
    e <= s ? 0 : Math.min(1, Math.max(0, (y - s) / (e - s))),
  );
}

export default function Nav() {
  const barProgress = useBarProgress();
  const activeSection = useActiveSection(NAV_SECTION_IDS);
  const fillerProgress = useFillerProgress();
  const logoHideOffset = hideOffset(fillerProgress);
  // At the top of the page the progress bar is a full band behind the
  // logo + links, so the blended nav always reads against solid colour
  // whatever image/video is underneath; it shrinks back to its 6px strip
  // as the page frame settles (same timing as PageFrame).
  const bandOpen = useTransform(useSettleProgress(tune.hero.frameLag), (v) => 1 - v);
  const bandHeight = useTransform(bandOpen, (v) => `calc(0.375rem + var(--nav-h) * ${v})`);

  // nav-dev: the progress bar is a SIBLING of #nav, not a child — it has
  // to sit outside #nav's stacking context for it to escape the blend
  // entirely (a blend on/inside #nav that still needs to read the page
  // background at rest can't also spare a descendant). So:
  //   #nav-progress — sticky top-0, un-blended, normal bar tokens
  //   #nav          — sticky top-1.5 (right below it), mix-blend-exclusion
  // Stacked flush, same total height as before. White ink under
  // exclusion: over a dark backdrop it reads white, over light, dark.
  // The bar holds 6px in the flow; its visible band grows down behind
  // #nav (z-45: under the nav's z-50, over the hero layer's z-40).
  // --nav-h matches #nav-bar's h-16 / sm:h-19.
  return (
    <>
      <div id="nav-progress" className="sticky top-0 z-[45] h-1.5 w-full [--nav-h:4rem] sm:[--nav-h:4.75rem]">
        <motion.div className="absolute inset-x-0 top-0 bg-bar" style={{ height: bandHeight }}>
          <motion.div
            className="h-full origin-left bg-on-bar"
            style={{ scaleX: barProgress }}
          />
        </motion.div>
      </div>
      <header
        id="nav"
        className="sticky top-1.5 z-50 flex w-full flex-col items-center mix-blend-exclusion text-white [&_*]:text-white"
      >
        <div id="nav-bar" className="relative flex h-16 sm:h-19 w-full items-center justify-between px-4 md:px-10 lg:px-14">
          <div id="nav-logo" className="flex items-center justify-center">
            <a
              href="#main-home"
              onClick={(e) => {
                e.preventDefault();
                const lenis = getLenis();
                if (lenis) {
                  lenis.scrollTo(0);
                } else {
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }
              }}
              // Only set a transform when the logo is actually hiding — a
              // permanent translateY(0) would give this subtree its own
              // isolated compositing group and keep the mark from blending
              // with #nav-bar's exclusion.
              style={
                logoHideOffset
                  ? { transform: `translateY(${logoHideOffset}px)` }
                  : undefined
              }
            >
              <motion.span
                className="inline-block"
                whileHover={{ scale: 1.05, transition: { type: "spring", stiffness: 400, damping: 25 } }}
                whileTap={{ scale: 1, transition: { duration: 0 } }}
              >
                {/* nav-dev: invert the black mark to white so it reads as
                    part of the white-ink bar; exclusion on #nav then flips
                    it against whatever's behind. dark:invert is gone —
                    theme is irrelevant once the bar is blended. */}
                <img
                  src="/brand/logo-mark.svg"
                  alt="Studio A&amp;M"
                  className="h-4 w-20.25 invert"
                />
              </motion.span>
            </a>
          </div>
          <nav id="nav-links" className="flex items-center justify-end gap-3 sm:gap-5">
            <ThemeToggle />
            <NavLink href="#s-work" active={activeSection === "#s-work"}>
              Work
            </NavLink>
            <NavLink href="#s-about" active={activeSection === "#s-about"}>
              About
            </NavLink>
          </nav>
        </div>
      </header>
    </>
  );
}
