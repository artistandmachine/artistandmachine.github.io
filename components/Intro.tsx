"use client";

import { useRef } from "react";
import { motion, useScroll } from "framer-motion";
import StickyLabel from "./StickyLabel";
import { tune } from "@/lib/tune";

export default function Intro({
  tagline,
  intro,
  subIntro,
  signoff,
  signoffName,
}: {
  tagline: string;
  intro: string;
  subIntro: string;
  signoff: string;
  /** Name under the sign-off — set in data/site.json (studio.signoffName). */
  signoffName: string;
}) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start 80px", "end 85px"],
  });

  return (
    <section id="s-headline" ref={sectionRef} className="relative flex w-full flex-col items-center overflow-clip">
      <div id="headline-progress" className="sticky top-20.5 z-10 w-full bg-surface px-3 md:px-8 lg:px-12">
        <div className="h-px w-full bg-border">
          <motion.div className="h-full origin-left bg-on-border" style={{ scaleX: scrollYProgress }} />
        </div>
      </div>
      <div id="headline-row" className="flex w-full items-start px-4 md:px-10 lg:px-14">
        <div id="headline-rail" className="hidden sm:flex w-12 md:w-19.25 shrink-0 flex-col items-start self-stretch">
          <div className="spacer-1" />
          <StickyLabel as="h2">Studio A&amp;M</StickyLabel>
        </div>
        <div id="headline-body" className="flex flex-1 flex-col items-center justify-center">
          <div className="spacer-2 sm:spacer-3 w-full shrink-0" />
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-10%" }}
            transition={{ duration: tune.reveal.duration, ease: tune.reveal.ease }}
            id="headline-copy"
            className="flex w-full max-w-150 flex-col items-start gap-2 text-body text-on-surface">
            <h1 className="text-body font-normal text-on-surface">{tagline}</h1>
            <p>{intro}</p>
            <p className="max-w-108">{subIntro}</p>
            <p>{signoff}</p>
            <p>– {signoffName}</p>
          </motion.div>
          <div className="spacer-2 sm:spacer-3 w-full shrink-0" />
        </div>
      </div>
    </section>
  );
}
