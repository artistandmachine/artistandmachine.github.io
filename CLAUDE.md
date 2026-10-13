@AGENTS.md

## Where to change what
Bion vibe-codes (no Figma step), so every knob lives in one of three files. Keep it that way: when a value gets tweaked by hand, move it into one of these instead of burying it in a component.

| Change | File |
|---|---|
| Words, projects, links, image paths | `data/site.json` (was `data/projects.json`) |
| Colours (light + dark), font, text styles, image ratios | `app/theme.css` |
| Motion: hero rotation, spatial hover, magnet, footer see-saw, scroll feel | `lib/tune.ts` |

Tailwind v4 is configured in CSS only (`@theme` in theme.css; no tailwind.config.js). The Style Dictionary / tokens JSON pipeline was removed 2026-10-12. `app/globals.css` is plumbing (dark variant, spacers). Satoshi is loaded in `app/layout.tsx` as `--font-satoshi`. Modules like `lib/spatial.ts` and `lib/useMagnet.ts` still export their old constant names, now read from `tune`.
