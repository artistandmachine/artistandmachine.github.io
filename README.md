# Studio A&M — React scaffold

A hand-built Next.js + Tailwind + Framer Motion recreation of the Framer prototype, including its three signature scroll effects:

- **Hero** — a pinned frame that crossfades through multiple full-bleed images as you scroll (`components/Hero.tsx`).
- **Work / About** — a sticky left index/tab column with scrolling rows on the right, plus a sticky thumbnail that swaps to match whichever row is in view (`components/WorkGrid.tsx`, `components/About.tsx`).
- **Footer reveal** — the whole page scales down slightly and its bottom corners round off as you hit the end, lifting like a card to reveal a fixed black footer underneath (`components/Reveal.tsx` + `components/Footer.tsx`).

This is a structural + interaction match, not a pixel-perfect clone — spacing, timing, and exact scale/radius values will need a pass against your Figma design once you're ready to refine.

## Run it

```
npm install
npm run dev
```

Then open http://localhost:3000.

## Styling with Tailwind

Every component uses **Tailwind CSS utility classes** for layout, spacing, type, and color. Open any `.tsx` file and you'll see classes like `flex`, `gap-4`, `px-6`, `text-lg`, `md:px-10`, etc.

**Where to change things** (three files, no build step):

| Change | File |
|---|---|
| Words, projects, links, image paths | `data/site.json` |
| Colours (light + dark), font, text styles, image ratios | `app/theme.css` |
| Motion: hero rotation, spatial hover, magnet, footer see-saw, scroll feel | `lib/tune.ts` |

Responsive breakpoints? Use `md:`, `lg:`, etc. prefixes on a component's classes.

**How it works:** Tailwind scans your component files for class names, generates only the CSS you use, and injects it into `globals.css`. No CSS files to maintain — just pick classes and go.

## Media: images & video

All site media lives under `public/`, organized by section so updating the
site is just replacing a file — no code changes needed as long as the
filename stays the same:

```
public/
├── images/
│   ├── hero/       hero-1.png, hero-2.png, hero-3.png
│   ├── about/      bion-headshot.png, capability-<slug>.jpg (one per capability)
│   └── projects/   <project-id>.jpg (one per entry in data/site.json)
├── videos/
│   ├── hero/       optional — same naming idea as images/hero if you add motion to the hero
│   ├── about/       optional — same naming idea as images/about
│   └── projects/   optional — <project-id>.mp4 for a project that should autoplay video instead of a still
└── brand/          logos & social icons — logo-mark.svg, logo-wordmark.svg, ic-instagram.svg, etc.
```

**To update an image or video:** just overwrite the file at its existing
path with the same filename. The dev server hot-reloads; nothing in
`data/site.json` needs to change.

**Placeholders:** every image slot referenced in `data/site.json`
currently has a real file at its path — real photos where Bion supplied
them, and an auto-generated gray "PLACEHOLDER — replace `<filename>` to
update" swatch everywhere real art hasn't landed yet (currently all 9
project thumbnails, plus 2 of the 8 About capability images). Drop a real
photo in with the exact same filename to replace a placeholder.

**Adding a new project:**
1. Open `data/site.json`, add a new object to the `projects` array (copy an existing one as a template).
2. Drop the project image into `public/images/projects/` named to match the `image` field (e.g. `<id>.jpg`). If you don't have the photo yet, leave the field pointing at that filename anyway and drop in any placeholder image — the site will just show it desaturated until you swap it.
3. Optional — video instead of / in addition to a still: add a `"video"` field (e.g. `"/videos/projects/<id>.mp4"`) and drop the matching file into `public/videos/projects/`. The `image` still renders as the poster frame and as the automatic fallback if the video file is missing or fails to load, so always keep the `image` field set even when a video is present.
4. If you don't have final copy yet, write your notes in `rawNotes` and set `needsDescription: true` — the row will show a "pending" placeholder instead of guessing. Hand the notes to Claude to polish per `content/STYLE_GUIDE.md`.
5. Save. The dev server hot-reloads.

**Hero / About images:**
- Hero: drop images into `public/images/hero/` and list their paths in `data/site.json` → `studio.heroImages`. The hero section's height is `images.length * 100vh`, so adding more images makes the pinned scroll sequence longer automatically.
- About: same idea, `public/images/about/` + `studio.capabilityImages`. One image per capability, in the same order as `studio.capabilities` — filenames follow `capability-<slug>.jpg` where `<slug>` is the capability name lowercased/hyphenated (e.g. "Marketing & Growth Support" → `capability-marketing-growth-support.jpg`).
- Either slot also accepts a `video` the same way projects do — swap the string in `heroImages`/`capabilityImages` for an object `{ "image": "...", "video": "..." }` and thread it through `Hero`/`About` the same way `ProjectTile` does (not wired up by default since no hero/about video exists yet — ask Claude to wire it if you add one).

**Image prep:** `next.config.js` sets `images.unoptimized: true` (required for static export), so there's no server-side resizing/compression — pre-size and compress source photos yourself before dropping them in. Roughly 1600px on the long edge, JPEG quality ~80, keeps things fast.

## Iterate in code

Build and refine in the browser: `npm run dev`, change a knob in one of the three files above, see it live. Figma is optional reference, not the source of truth.

## Things to verify once you're running it locally

- **Reveal timing**: `lib/constants.ts` sets `FOOTER_HEIGHT = 440` (px). This must match the footer's actual rendered height, or the scale/reveal animation will feel off. If you change footer content, update this constant to match.
- **Reveal scale/radius amounts**: currently scales to `0.94` and rounds to `32px` — subtle by design, tune in `components/Reveal.tsx` if you want it punchier.
- **Sticky-inside-scaled-wrapper**: `Reveal` applies a Framer Motion `scale` transform, which is why `Nav` is rendered *outside* `Reveal` in `app/page.tsx` — a `transform` on an ancestor breaks `position: fixed` children. Worth double-checking in the browser that this didn't slip back in if you refactor the layout.
- **IntersectionObserver thresholds**: `WorkGrid` and `About` use `rootMargin: "-45% 0px -45% 0px"` to decide which row/capability is "active" (and therefore which sticky image shows). This is a reasonable default but may need adjusting once real content/image aspect ratios are in.
- **Hero image count**: with 3 placeholder hero images the section is 300vh tall. If you end up with only 1-2 real hero images, the scroll distance will feel too long — trim `studio.heroImages` accordingly or add a max height cap.

## Stack

- Next.js (App Router)
- Tailwind CSS (utility-first styling)
- Framer Motion (scroll-linked animations, same library Framer uses under the hood)
