import Media from "./Media";
import { Logo } from "./Logos";

export type Project = {
  id: string;
  title: string;
  year: number;
  location?: string;
  capability?: string;
  linkLabel?: string;
  linkUrl?: string;
  image: string;
  video?: string;
  /** Extra slides shown after the cover in the project slideshow. */
  images?: string[];
  description: string;
  needsDescription?: boolean;
  clientLogo?: string;
  partnerLogo?: string;
};

/**
 * The two ways a project can render inside WorkProjects. Mirrors Framer's
 * component-variant model: one named prop picks a whole layout, and each
 * variant is its own self-contained sub-component below rather than a
 * pile of conditional classes on a shared tree. WorkProjects owns the
 * choice (and the wrapping container) and threads it down as `variant`.
 *
 *  - "grid": small media card, sized by a wrapping CSS grid
 *  - "list": full-width detail row — title, description, meta, logos, media
 */
export type ProjectTileVariant = "grid" | "list";

export default function ProjectTile({
  project,
  variant = "grid",
  priority = false,
  onOpen,
}: {
  project: Project;
  variant?: ProjectTileVariant;
  /** Opens this project's slideshow overlay (owned by WorkProjects). */
  onOpen?: () => void;
  /** Marks this tile's media as the page's LCP candidate — skips lazy
   * loading so it's requested immediately. Only ever true for the very
   * first tile rendered (see WorkProjects). */
  priority?: boolean;
}) {
  return variant === "list" ? (
    <ProjectTileList project={project} priority={priority} onOpen={onOpen} />
  ) : (
    <ProjectTileGridCard project={project} priority={priority} onOpen={onOpen} />
  );
}

/** Makes a tile's media the keyboard/click target for opening the
 * slideshow. A div with button semantics rather than a <button>, since
 * Media renders block content. */
function OpenTrigger({
  title,
  onOpen,
  className = "",
  children,
}: {
  title: string;
  onOpen?: () => void;
  className?: string;
  children: React.ReactNode;
}) {
  if (!onOpen) return <>{children}</>;
  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`Open ${title} slideshow`}
      onClick={(e) => {
        // Grid cards also open from the article itself; don't fire twice.
        e.stopPropagation();
        onOpen();
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen();
        }
      }}
      className={`cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${className}`}
    >
      {children}
    </div>
  );
}

/* ── Grid: small media card, sized by the parent grid, wraps into rows ── */

function ProjectTileGridCard({ project, priority, onOpen }: { project: Project; priority: boolean; onOpen?: () => void }) {
  return (
    <article
      id={`tile-${project.id}`}
      onClick={onOpen}
      className={`flex w-full flex-col items-start gap-2 overflow-clip ${onOpen ? "cursor-pointer" : ""}`}
    >
      {/* The whole card opens on click (via the article); the media
          wrapper carries the focusable/keyboard entry point. */}
      <OpenTrigger title={project.title} onOpen={onOpen} className="w-full">
      <Media
        src={project.image}
        video={project.video}
        alt={project.title}
        sizes="(min-width: 1024px) 400px, (min-width: 640px) 45vw, 100vw"
        className="img-tile"
        cursorFollow
        spatial
        loading={priority ? "eager" : undefined}
      />
      </OpenTrigger>
      <div className="flex w-full items-start justify-between gap-6">
        <div className="flex min-w-0 max-w-[80%] flex-1 flex-col gap-1">
          <h3 className="text-project-title text-on-surface">{project.title}</h3>
          {project.capability && (
            <p className="text-project-meta text-on-surface/60">{project.capability}</p>
          )}
        </div>
        {(project.clientLogo || project.partnerLogo) && (
          <div className="flex w-1/5 shrink-0 flex-row items-center gap-0">
            {project.partnerLogo && (
              <div className="min-w-0 flex-1">
                <Logo src={project.partnerLogo} className="h-8 w-full object-right" />
              </div>
            )}
            {project.clientLogo && (
              <div className="min-w-0 flex-1">
                <Logo src={project.clientLogo} className="h-8 w-full object-right" />
              </div>
            )}
          </div>
        )}
      </div>
    </article>
  );
}

/* ── List: full-width detail row ─────────────────────────────────── */

function ProjectTileList({ project, priority, onOpen }: { project: Project; priority: boolean; onOpen?: () => void }) {
  return (
    <article id={`tile-${project.id}`} className="flex w-full flex-col  lg:flex-row items-start justify-end gap-6 lg:gap-14 overflow-clip pl-1">
      <div className="order-2 lg:order-1 flex w-full lg:min-w-75 lg:max-w-120 flex-1 flex-col items-start gap-2 overflow-clip">
        <div className="flex w-full items-end pr-0 lg:pr-6">
          <h3 className="text-project-title min-w-0 flex-1 text-on-surface">
            {project.title}
          </h3>
        </div>
        <div className="h-px w-full bg-on-surface" />
        <div className="flex w-full pr-6 items-start ">
          <p className="text-project-description min-w-0 flex-1 text-on-surface">
            {project.needsDescription ? (
              <span className="italic text-on-surface/60">
                Description pending...Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Velit laoreet id donec ultrices tincidunt arcu.
              </span>
            ) : (
              project.description
            )}
          </p>
        </div>
        <div className="flex gap-0.5 flex-col items-start">
          {project.capability && (
            <p className="flex items-center gap-2 text-project-meta text-on-surface">
              {/* 6x6px placeholder for a future icon */}
              <span className="h-1.5 w-1.5 shrink-0 bg-on-surface" aria-hidden="true" />
              {project.capability}
            </p>
          )}
          {project.location && (
            <p className="flex items-center gap-2 text-project-meta text-on-surface">
              {/* 6x6px placeholder for a future icon */}
              <span className="h-1.5 w-1.5 shrink-0 bg-on-surface" aria-hidden="true" />
              {project.location}
            </p>
          )}
          {project.linkLabel && project.linkUrl && (
            <div className="flex items-center gap-2">
              {/* 6x6px placeholder for a future icon */}
              <span className="h-1.5 w-1.5 shrink-0 bg-on-surface" aria-hidden="true" />
              <a
                href={project.linkUrl}
                target="_blank"
                rel="noreferrer"
                className="text-project-meta text-accent transition-opacity duration-200 ease-out hover:opacity-60"
              >
                {project.linkLabel}
              </a>
            </div>
          )}
        </div>
      </div>

      {(project.clientLogo || project.partnerLogo) && (
        <div className="order-last lg:order-2 flex w-auto lg:w-25 shrink-0 flex-row lg:flex-col items-center justify-start lg:justify-center gap-4 lg:gap-5 overflow-visible">
          {project.partnerLogo && <Logo src={project.partnerLogo} className="h-8 w-28 object-left lg:h-10 lg:w-full" />}
          {project.clientLogo && <Logo src={project.clientLogo} className="h-8 w-28 object-left lg:h-10 lg:w-full" />}
        </div>
      )}

      <OpenTrigger
        title={project.title}
        onOpen={onOpen}
        className="order-1 lg:order-3 w-full lg:max-w-150 shrink-0 lg:shrink"
      >
        <Media
          src={project.image}
          video={project.video}
          alt={project.title}
          sizes="(min-width: 1024px) 500px, 100vw"
          className="img-tile"
          cursorFollow
          spatial
          loading={priority ? "eager" : undefined}
        />
      </OpenTrigger>
    </article>
  );
}
