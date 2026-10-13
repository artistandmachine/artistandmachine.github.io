"use client";

import { useEffect, useRef } from "react";
import {
  animate,
  motion,
  useInView,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "framer-motion";
import { InstagramIcon, LinkedInIcon, Mark, Wordmark } from "./Logos";
import { tune } from "@/lib/tune";

/**
 * When the middle block scrolls into view, the wordmark slides in along
 * the divider, and the divider — plus the email beneath it — behaves
 * like a teeter-totter, tilting under the wordmark's "weight" and
 * rocking back to level.
 *
 * How the motion is wired: one driver value `drive` (-1..1) is animated
 * once on first view. Everything else reads off it:
 *   - wordmark x: mapped straight from `drive` (the mass being moved)
 *   - beam angle: `drive` -> degrees through an under-damped spring, so
 *     it overshoots and settles instead of snapping — the "rebalance"
 *   - email x: opposite sign, softer spring — the counterweight
 *
 * Swapping the scroll trigger for a cursor one later is just a matter
 * of feeding pointer X into `drive` instead of the one-shot animate().
 */
export default function Footer({
  studioName,
  email,
  instagram,
  linkedin,
}: {
  studioName: string;
  email: string;
  instagram: string;
  linkedin: string;
}) {
  const mainRef = useRef<HTMLDivElement>(null);
  // Not `once` — leaving view re-arms it, re-entering replays the rock.
  const inView = useInView(mainRef, { margin: "0px 0px -80px 0px" });
  const reduceMotion = useReducedMotion();

  // -1 = wordmark hard left / beam tipped down-left, 0 = level & centered.
  const drive = useMotionValue(reduceMotion ? 0 : -1);

  // Distances, tilt and springs are set in lib/tune.ts (tune.footer).
  const { wordSlide: WORD_SLIDE, emailSlide: EMAIL_SLIDE, maxTilt: MAX_TILT } = tune.footer;

  const wordX = useTransform(drive, [-1, 1], [-WORD_SLIDE, WORD_SLIDE]);
  const tilt = useSpring(useTransform(drive, [-1, 1], [-MAX_TILT, MAX_TILT]), tune.footer.tiltSpring);
  const emailX = useSpring(useTransform(drive, [-1, 1], [EMAIL_SLIDE, -EMAIL_SLIDE]), tune.footer.emailSpring);

  useEffect(() => {
    if (reduceMotion) return;
    if (!inView) {
      // Out of view: snap back to the pre-roll pose so the next entry
      // replays from the same starting point.
      drive.set(-1);
      return;
    }
    // Enter from the left, coast a little past center, drift back to 0.
    // The under-damped tilt spring turns that little overshoot into a
    // couple of see-saw rocks before it levels off.
    const controls = animate(drive, [-1, 0.32, 0], {
      duration: tune.footer.rockDuration,
      times: [0, 0.58, 1],
      ease: ["easeOut", "easeInOut"],
    });
    return () => controls.stop();
  }, [inView, reduceMotion, drive]);

  return (
    <footer
      id="footer"
      className="relative flex min-h-90 w-full flex-col items-center justify-between bg-primary-container px-6 md:px-14 text-on-primary-container py-6 md:py-0"
    >
      <div className="hidden md:flex h-20 w-full items-start justify-end py-6" />

      <div
        id="footer-main"
        ref={mainRef}
        className="flex w-full flex-col sm:flex-row items-center justify-between gap-8 md:gap-12 my-auto"
      >
        <div id="footer-logo" className="flex w-[30%] shrink-0 flex-col items-start overflow-clip max-w-full">
          <Mark className="w-full h-auto max-w-full" />
        </div>
        <div id="footer-info" className="flex w-full min-w-0 md:flex-1 flex-row items-center self-stretch">
          {/* The beam: wordmark + divider + email tip together around
              their shared centre (≈ the divider line). */}
          <motion.div
            className="flex h-full w-full min-w-0 flex-1 flex-col items-start pb-3.5 origin-center"
            style={{ rotate: reduceMotion ? 0 : tilt }}
          >
            {/* Wordmark row */}
            <div className="flex h-8 w-full items-center justify-start md:justify-center overflow-visible pl-3 md:pl-0 pr-0 lg:pr-52.5">
              <motion.span
                className="w-fit will-change-transform"
                style={{ x: reduceMotion ? 0 : wordX }}
              >
                <Wordmark className="h-3 w-fit" />
              </motion.span>
            </div>
            {/* Divider between wordmark and email */}
            <div className="h-px w-full bg-on-surface-variant" />
            {/* Email row, right-aligned under the divider */}
            <div className="flex h-8 w-full items-start justify-end overflow-visible pr-2 pt-2">
              <motion.a
                href={`mailto:${email}`}
                aria-label={`Email ${studioName}`}
                className="text-footer-link whitespace-nowrap text-accent transition-opacity duration-200 ease-out hover:opacity-60 will-change-transform"
                style={{ x: reduceMotion ? 0 : emailX }}
              >
                {email}
              </motion.a>
            </div>
          </motion.div>
        </div>
      </div>

      <div id="footer-social" className="flex h-14 md:h-20 w-full items-end justify-end gap-6 overflow-clip py-2 md:py-6">
        <a
          href={instagram}
          target="_blank"
          rel="noreferrer"
          aria-label="Instagram"
          className="transition-opacity duration-100 ease-out hover:text-accent"
        >
          <InstagramIcon className="h-6 w-6" />
        </a>
        <a
          href={linkedin}
          target="_blank"
          rel="noreferrer"
          aria-label="LinkedIn"
          className="transition-opacity duration-100 ease-out hover:text-accent"
        >
          <LinkedInIcon className="h-6 w-6" />
        </a>
      </div>
    </footer>
  );
}
