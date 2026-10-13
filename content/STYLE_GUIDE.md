# Studio A&M — Project Description Voice Guide

Reference pattern, pulled from the existing site copy:

> "Environmental and digital assets for Future Fabrics Exposition June 2026, designed to help visitors navigate the show and understand the momentum behind next-generation material solutions."

> "A trade show system for Performance Days March 2026, bringing together brand cues, event messaging, and practical display moments for a clear and memorable booth experience."

> "Visual merchandising for Bureo's North America showroom, translating ocean-positive material stories into a spatial experience for partners, visitors, and internal teams."

## The formula

One sentence, two clauses, no fluff:

1. **[Discipline/deliverable] for [Client / Project name]** — states what was made and for whom.
2. **, [gerund phrase] that/to [outcome]** — states why it matters or what it does for the client/visitor.

Roughly: `[What we built] for [Client], [verb-ing] [the specific problem it solves].`

## Rules of thumb

- One sentence. If it needs a second, trim instead.
- Lead with the deliverable type (packaging, brand guidelines, trade show system, ID tag, visual merchandising), not with "we."
- Name the real client/product, including trademark symbols (®) where the client uses them.
- End on outcome or feeling, not process — what a visitor/partner/customer experiences, not how many rounds of revisions happened.
- No adjectives that don't earn their place ("amazing," "beautiful," "innovative" — cut unless it's load-bearing).
- Plain, confident, slightly technical register — "concise, apparel-ready detail" over "we loved making this."

## Workflow

1. Add a new entry to `data/site.json` with title, year, category, location, client link, and image.
2. Write whatever you'd actually say about the project in `rawNotes` — bullet points, half-sentences, whatever.
3. Set `needsDescription: true`.
4. Hand it to Claude: "polish the description for [project id]." Claude rewrites `rawNotes` into `description` using this guide, flips `needsDescription` to `false`.
5. Site pulls `description` directly — no other steps.
