import Nav from "@/components/Nav";
import PageFrame from "@/components/PageFrame";
import BackToTop from "@/components/BackToTop";
import Hero from "@/components/Hero";
import Intro from "@/components/Intro";
import WorkProjects from "@/components/WorkProjects";
import About from "@/components/About";
import Footer from "@/components/Footer";
import ProgressMask from "@/components/ProgressMask";
import data from "@/data/site.json";

export default function Home() {
  const { studio, projects } = data;
  const visibleProjects = projects.filter((p) => !("hidden" in p && p.hidden));

  return (
    <main id="main-home" className="relative flex w-full flex-col items-center bg-surface-variant">
      <PageFrame>
        <Nav />
        <Hero images={studio.heroImages} captions={studio.heroCaptions} />
        <div id="page-content" className="relative flex w-full flex-col items-center">
          <ProgressMask />
          <Intro
            tagline={studio.tagline}
            intro={studio.intro}
            subIntro={studio.subIntro}
            signoff={studio.signoff}
            signoffName={studio.signoffName}
          />
          <WorkProjects projects={visibleProjects} />
          <About
            capabilities={studio.capabilities}
            images={studio.capabilityImages}
            designer={studio.designer}
          />
        </div>
        {/* 80px of breathing room before the footer band, and the home
            for the back-to-top button (bottom-right, 12px above the
            footer). Its height doesn't feed any animation —
            useFillerProgress measures from max scroll all the way to
            #footer's bottom (see lib/useAboutEndProgress.ts), so the
            About bar, its "About" label, the mask, and the nav logo
            finish sliding off-screen exactly as the footer's bottom
            edge comes into view, not abruptly as this gap begins. */}
        <div
          id="s-footer-filler"
          className="flex h-20 w-full items-end justify-end px-6 md:px-14 pb-3"
        >
          <BackToTop />
        </div>
        <Footer
          studioName={studio.name}
          email={studio.designer.email}
          instagram={studio.designer.instagram}
          linkedin={studio.designer.linkedin}
        />
      </PageFrame>
    </main>
  );
}
