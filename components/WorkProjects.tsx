"use client";

import { useRef, useState } from "react";
import { motion, useScroll } from "framer-motion";
import ProjectTile, { Project, ProjectTileVariant } from "./ProjectTile";
import ProjectSlideshow from "./ProjectSlideshow";
import ViewToggle from "./ViewToggle";
import { getLenis } from "./SmoothScroll";
import { useMinWidth } from "@/lib/useMinWidth";
import { tune } from "@/lib/tune";

// Buffer matching the sticky nav, so a view switch lands #s-work exactly
// where the section is considered "started" (mirrors the offsets on the
// section's own scroll-progress tracker and Nav's jump-links).
const WORK_SCROLL_BUFFER = tune.scroll.sectionBuffer;

export default function WorkProjects({ projects }: { projects: Project[] }) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start 80px", "end 90px"],
  });

  /* One view choice for the whole Work section. The list variant only
     exists at xl+ (1280px); below that every year is forced to grid and
     the toggle is hidden. */
  const canToggle = useMinWidth(1280);
  const [listWanted, setListWanted] = useState(true);
  const view: ProjectTileVariant = canToggle && listWanted ? "list" : "grid";

  // The project whose slideshow overlay is open, if any.
  const [openProject, setOpenProject] = useState<Project | null>(null);

  /* Switching view can shift a lot of layout above the fold, so jump the
     reader back to the top of Work rather than leaving them mid-section
     over content that just moved. */
  function changeView(next: ProjectTileVariant) {
    setListWanted(next === "list");
    const target = sectionRef.current;
    if (!target) return;
    const lenis = getLenis();
    if (lenis) {
      lenis.scrollTo(target, { offset: -WORK_SCROLL_BUFFER });
    } else {
      const top =
        target.getBoundingClientRect().top + window.scrollY - WORK_SCROLL_BUFFER;
      window.scrollTo({ top, behavior: "smooth" });
    }
  }

  const years = Array.from(new Set(projects.map((p) => p.year))).sort(
    (a, b) => b - a
  );

  return (
    <section id="s-work" ref={sectionRef} className="relative flex w-full flex-col items-start overflow-clip">
      {/* This section's own progress bar, pinned under the nav */}
      <div id="work-progress" className="sticky top-20.5 z-10 w-full bg-surface px-3 md:px-8 lg:px-12">
        <div className="h-px w-full bg-border">
          <motion.div className="h-full origin-left bg-on-border" style={{ scaleX: scrollYProgress }} />
        </div>
      </div>
{/* Column 1 */}
      <div id="work-row" className="flex w-full items-start px-4 md:px-10 lg:px-14">
        {/* Left rail: sticky "Work" label + the section-wide view toggle,
            pinned for the section's whole scroll range */}
        <div id="work-rail" className="hidden sm:flex w-12 md:w-19.25 shrink-0 flex-col items-center self-stretch py-12 md:py-22.5">
          <div className="spacer-1 w-full shrink-0" />
          <div className="sticky top-22.5 flex flex-col items-center gap-2.5">
            <h2 className="text-label whitespace-nowrap text-on-surface">Work</h2>
            {canToggle && (
              <ViewToggle view={view} onChange={changeView} />
            )}
          </div>
        </div>

        {/* One block per year: a sticky year label on the left, project
            tiles on the right */}
        <div id="work-years" className="flex min-w-0 flex-1 flex-col items-center w-full">
          {years.map((year, i) => (
            <YearBlock
              key={year}
              year={year}
              projects={projects.filter((p) => p.year === year)}
              view={view}
              isFirstYear={i === 0}
              onOpen={setOpenProject}
            />
          ))}
        </div>
      </div>
      <div className="spacer-2" />
      {openProject && (
        <ProjectSlideshow project={openProject} onClose={() => setOpenProject(null)} />
      )}
    </section>
  );
}

function YearBlock({
  year,
  projects,
  view,
  isFirstYear = false,
  onOpen,
}: {
  year: number;
  projects: Project[];
  view: ProjectTileVariant;
  /** True for the first year block rendered — its first tile is the
   * page's LCP candidate and gets priority loading. */
  isFirstYear?: boolean;
  onOpen: (project: Project) => void;
}) {
  return (
    <div id={`work-${year}`} className="flex w-full flex-col sm:flex-row items-start">
      <div className="flex w-full pr-3 sm:w-auto sm:flex-1 flex-col items-start sm:items-center self-stretch">
        <div className="hidden sm:block spacer-2 w-full shrink-0" />
        {/* Mobile: inline year heading */}
        <div className="flex w-full items-center pt-8 pb-4 sm:hidden">
          <span className="text-label text-on-surface">Work — {year}</span>
        </div>
        {/* Desktop: sticky year heading */}
        <div className="sticky top-22.5 hidden w-full min-w-24 flex-col items-center gap-2.5 sm:flex">
          <h3 className="text-label whitespace-nowrap text-on-surface">{year}</h3>
        </div>
      </div>
      <div className="flex w-full min-w-0 lg:max-w-300 flex-col items-stretch">
        <div className="spacer-3 sm:spacer-4 w-full shrink-0" />
        <div
          id={`work-${year}-items`}
          className={
            view === "list"
              ? "flex flex-col items-stretch lg:items-end gap-10 lg:gap-12.5"
              : // Grid fills the column edge to edge; tiles are w-full so
                // they stretch to the track. Tune the column count per
                // breakpoint here.
                "grid w-full grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 xl:grid-cols-3"
          }
        >
          {projects.map((project, i) => (
            <ProjectTile
              key={project.id}
              project={project}
              variant={view}
              priority={isFirstYear && i === 0}
              onOpen={() => onOpen(project)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
