#!/usr/bin/env node
/**
 * import-project-media.mjs
 *
 * Moves Figma-exported project media from a drop folder into the
 * studio-anm site's public/ folders, matching filenames against
 * data/site.json project ids.
 *
 * NAMING CONVENTION (name your Figma exports exactly like this):
 *   {project-id}--cover.jpg      -> public/images/projects/{project-id}.jpg
 *   {project-id}--cover.webp     -> public/images/projects/{project-id}.webp
 *   {project-id}--client-logo.svg  -> public/brand/client-logos/{project-id}-client.svg
 *   {project-id}--partner-logo.svg -> public/brand/brand-logos/{project-id}-partner.svg
 *
 * {project-id} must exactly match an "id" in data/site.json.
 *
 * Usage:
 *   node import-project-media.mjs --from ~/Desktop/figma-export
 *   node import-project-media.mjs --from ~/Desktop/figma-export --dry-run
 *
 * By default this only COPIES files (source stays put). Add --move to
 * move instead of copy.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ---- CONFIG: adjust if your site folder location differs ----
const SITE_ROOT = path.resolve(process.env.STUDIO_ANM_ROOT || "/Users/B/Cortex/dev/studio-anm");
const SITE_JSON = path.join(SITE_ROOT, "data", "site.json");
const DEST_COVER_DIR = path.join(SITE_ROOT, "public", "images", "projects");
const DEST_CLIENT_LOGO_DIR = path.join(SITE_ROOT, "public", "brand", "client-logos");
const DEST_PARTNER_LOGO_DIR = path.join(SITE_ROOT, "public", "brand", "brand-logos");
// ---------------------------------------------------------------

function parseArgs(argv) {
  const args = { from: null, dryRun: false, move: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--from") args.from = argv[++i];
    else if (a === "--dry-run") args.dryRun = true;
    else if (a === "--move") args.move = true;
    else if (a === "--help" || a === "-h") args.help = true;
  }
  return args;
}

function printHelp() {
  console.log(`
Usage: node import-project-media.mjs --from <drop-folder> [--dry-run] [--move]

  --from <folder>   Folder containing Figma-exported files (required)
  --dry-run         Show what would happen without touching any files
  --move            Move files instead of copying them (default: copy)

Naming convention for files in the drop folder:
  {project-id}--cover.jpg
  {project-id}--cover.webp
  {project-id}--client-logo.svg
  {project-id}--partner-logo.svg

project-id must match an "id" field in data/site.json.
`);
}

function loadProjectIds() {
  const raw = fs.readFileSync(SITE_JSON, "utf-8");
  const json = JSON.parse(raw);
  return new Set((json.projects || []).map((p) => p.id));
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.help || !args.from) {
    printHelp();
    process.exit(args.help ? 0 : 1);
  }

  const dropFolder = path.resolve(args.from.replace(/^~/, process.env.HOME || ""));

  if (!fs.existsSync(dropFolder)) {
    console.error(`Drop folder not found: ${dropFolder}`);
    process.exit(1);
  }
  if (!fs.existsSync(SITE_JSON)) {
    console.error(`site.json not found at: ${SITE_JSON}`);
    console.error(`Set STUDIO_ANM_ROOT env var if your site lives elsewhere.`);
    process.exit(1);
  }

  const validIds = loadProjectIds();
  const files = fs.readdirSync(dropFolder).filter((f) => {
    const full = path.join(dropFolder, f);
    return fs.statSync(full).isFile() && !f.startsWith(".");
  });

  if (files.length === 0) {
    console.log(`No files found in ${dropFolder}.`);
    return;
  }

  const pattern = /^(.+?)--(cover|client-logo|partner-logo)\.(jpg|jpeg|png|webp|svg)$/i;

  const matched = [];
  const unmatched = [];
  const unknownId = [];

  for (const file of files) {
    const m = file.match(pattern);
    if (!m) {
      unmatched.push(file);
      continue;
    }
    const [, id, kind, ext] = m;
    if (!validIds.has(id)) {
      unknownId.push({ file, id });
      continue;
    }
    matched.push({ file, id, kind, ext: ext.toLowerCase() });
  }

  console.log(`\nFound ${files.length} file(s) in drop folder.\n`);

  if (unmatched.length) {
    console.log(`Skipped — filename doesn't match the naming convention:`);
    for (const f of unmatched) console.log(`  - ${f}`);
    console.log(
      `  (expected: {project-id}--cover|client-logo|partner-logo.{jpg,png,webp,svg})\n`
    );
  }

  if (unknownId.length) {
    console.log(`Skipped — id not found in site.json:`);
    for (const { file, id } of unknownId) console.log(`  - ${file}  (id: "${id}")`);
    console.log(`  Add this project to site.json first, or check for a typo.\n`);
  }

  if (matched.length === 0) {
    console.log("Nothing to copy.");
    return;
  }

  console.log(`Matched ${matched.length} file(s):\n`);

  for (const { file, id, kind, ext } of matched) {
    let destDir, destName;
    if (kind === "cover") {
      destDir = DEST_COVER_DIR;
      destName = `${id}.${ext}`;
    } else if (kind === "client-logo") {
      destDir = DEST_CLIENT_LOGO_DIR;
      destName = `${id}-client.${ext}`;
    } else {
      destDir = DEST_PARTNER_LOGO_DIR;
      destName = `${id}-partner.${ext}`;
    }

    const src = path.join(dropFolder, file);
    const dest = path.join(destDir, destName);
    const relDest = path.relative(SITE_ROOT, dest);

    const existed = fs.existsSync(dest);
    const verb = args.move ? "move" : "copy";

    if (args.dryRun) {
      console.log(
        `  [dry-run] would ${verb} "${file}" -> ${relDest}${existed ? "  (overwrites existing file)" : ""}`
      );
      continue;
    }

    ensureDir(destDir);
    fs.copyFileSync(src, dest);
    if (args.move) fs.unlinkSync(src);

    console.log(
      `  ${verb === "move" ? "moved" : "copied"}: "${file}" -> ${relDest}${existed ? "  (overwritten)" : ""}`
    );
  }

  console.log(`\nDone.`);
}

main();
