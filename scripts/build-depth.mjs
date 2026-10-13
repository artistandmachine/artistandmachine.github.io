/**
 * Generates depth maps for the Work tiles' "spatial scene" hover
 * (components/Media.tsx + lib/spatial.ts).
 *
 * For every project cover image and hero image in data/site.json
 * (studio.heroImages) it writes a
 * grayscale `<name>-depth.webp` next to the image (brighter = nearer),
 * using Depth Anything V2 (small) through transformers.js. A map is
 * (re)built when it's missing or older than its image, so re-run it
 * whenever a project is added or a photo replaced:
 *
 *   npm run depth            # only missing maps
 *   npm run depth -- --force # regenerate all
 *
 * Projects with a `video` are skipped (their tiles play video, not the
 * still). The first run downloads the model (~100 MB) into the
 * transformers.js cache; later runs are offline.
 */
import { existsSync, readFileSync, statSync } from "node:fs";
import { basename, join } from "node:path";
import sharp from "sharp";
import { pipeline, RawImage } from "@huggingface/transformers";

const ROOT = process.cwd();
const force = process.argv.includes("--force");
const data = JSON.parse(readFileSync(join(ROOT, "data/site.json"), "utf8"));
const list = Array.isArray(data) ? data : data.projects;
const hero = data.studio?.heroImages ?? [];
/** Maps don't need the photo's full size (the hero sources are 3840px). */
const MAX_WIDTH = 1600;
/**
 * Images whose large dark areas are empty graphic space, not scenery. The
 * model can read a black field as "near" (hero-1's left half), which would
 * swing the wordmark and badge sitting in it. For these, dark regions are
 * flattened to the depth that stays still for that slot, so they don't
 * move and only the lit subject does. The value is the slot's focus
 * (lib/spatial.ts) on a 0-255 scale: SPATIAL_HERO focus 1.0 = 255,
 * SPATIAL_TILE focus 0.5 = 128.
 */
const FLATTEN_DARK = new Map([["hero-1.webp", 255]]);

const depthPath = (src) => src.replace(/\.[a-z0-9]+$/i, "-depth.webp");

const todo = [
  ...list.filter((p) => p.image && !p.video).map((p) => ({ id: p.id, image: p.image })),
  ...hero.map((image, i) => ({ id: `hero-${i + 1}`, image })),
]
  .map((t) => ({ id: t.id, src: join(ROOT, "public", t.image), out: join(ROOT, "public", depthPath(t.image)) }))
  // Missing, or older than its image (a placeholder swapped for the real photo).
  .filter((t) => existsSync(t.src) && (force || !existsSync(t.out) || statSync(t.out).mtimeMs < statSync(t.src).mtimeMs));

if (!todo.length) {
  console.log("✓ depth maps up to date");
  process.exit(0);
}

const estimate = await pipeline("depth-estimation", "onnx-community/depth-anything-v2-small", { dtype: "fp32" });

for (const t of todo) {
  const t0 = Date.now();
  const img = await RawImage.read(t.src);
  const { depth } = await estimate(img);
  // Same aspect as the photo (the shader samples both with one UV), capped.
  const w = Math.min(img.width, MAX_WIDTH);
  const h = Math.round((img.height * w) / img.width);
  const map = await depth.resize(w, h);
  const still = FLATTEN_DARK.get(basename(t.src));
  if (still !== undefined) await flattenDark(map, t.src, w, h, still);
  await map.toSharp().webp({ quality: 85 }).toFile(t.out);
  console.log(`✓ ${t.id}  ${((Date.now() - t0) / 1000).toFixed(1)}s`);
}

/** Blend dark areas of the photo (heavily blurred luminance, so thin type
 * counts as dark too) toward the `still` depth, in place. */
async function flattenDark(map, src, w, h, still) {
  const lum = await sharp(src).resize(w, h).greyscale().blur(Math.max(8, w / 60)).raw().toBuffer();
  const LO = 40;
  const HI = 90;
  for (let i = 0; i < map.data.length; i++) {
    const m = Math.min(1, Math.max(0, (lum[i] - LO) / (HI - LO)));
    const k = m * m * (3 - 2 * m); // smoothstep
    map.data[i] = Math.round(map.data[i] * k + still * (1 - k));
  }
}
