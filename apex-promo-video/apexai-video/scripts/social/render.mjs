#!/usr/bin/env node
/**
 * Rendu par lots (posts, carrousels, stories, reels) avec un seul bundle et un seul navigateur.
 *
 *   node scripts/social/render.mjs jobs.json
 *
 * jobs.json = tableau de tâches :
 *   { "type": "still", "id": "G9-Pourquoi", "out": "out/x.png", "frame": 0, "props": {…} }
 *   { "type": "frames", "id": "G2-Carrousel", "outDir": "out/G2", "prefix": "G2-slide-", "props": {…} }   ← 1 image par frame
 *   { "type": "video", "id": "G4-TourParfait", "out": "out/g4.mp4", "crf": 16, "props": {…} }
 *
 * Variables d'environnement :
 *   REMOTION_BROWSER  chemin d'un Chrome/Chromium déjà installé (sinon Remotion télécharge le sien)
 *   CONCURRENCY       nombre de rendus parallèles pour les vidéos (défaut : nombre de cœurs)
 *   ONLY              filtre (sous-chaîne) sur les identifiants des tâches
 */
import { bundle } from "@remotion/bundler";
import { openBrowser, renderMedia, renderStill, selectComposition } from "@remotion/renderer";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..", "..");

const jobsFile = process.argv[2];
if (!jobsFile) {
  console.error("Usage : node scripts/social/render.mjs <jobs.json>");
  process.exit(1);
}
let jobs = JSON.parse(fs.readFileSync(jobsFile, "utf8"));
const only = process.env.ONLY;
if (only) jobs = jobs.filter((j) => only.split(",").some((o) => (j.id + " " + (j.out ?? j.outDir ?? "")).includes(o)));

const browserExecutable = process.env.REMOTION_BROWSER || null;
const concurrency = Number(process.env.CONCURRENCY || os.cpus().length);

const t0 = Date.now();
console.log(`Bundle…`);
const serveUrl = await bundle({
  entryPoint: path.join(root, "src", "index.ts"),
  publicDir: path.join(root, "public"),
  rspack: true,
  enableCaching: true,
});
console.log(`Bundle prêt (${((Date.now() - t0) / 1000).toFixed(1)} s)`);

const browser = await openBrowser("chrome", { browserExecutable });

const ensureDir = (p) => fs.mkdirSync(path.dirname(p), { recursive: true });
const resolveOut = (p) => (path.isAbsolute(p) ? p : path.join(root, p));

for (const job of jobs) {
  const t = Date.now();
  const inputProps = job.props ?? {};
  const composition = await selectComposition({
    serveUrl,
    id: job.id,
    inputProps,
    puppeteerInstance: browser,
    browserExecutable,
  });
  if (job.type === "still") {
    const out = resolveOut(job.out);
    ensureDir(out);
    await renderStill({
      composition,
      serveUrl,
      output: out,
      frame: job.frame ?? 0,
      inputProps,
      imageFormat: "png",
      scale: job.scale ?? 1,
      puppeteerInstance: browser,
      browserExecutable,
      overwrite: true,
    });
    console.log(`✓ ${job.id} → ${path.relative(root, out)} (${((Date.now() - t) / 1000).toFixed(1)} s)`);
  } else if (job.type === "frames") {
    const outDir = resolveOut(job.outDir);
    fs.mkdirSync(outDir, { recursive: true });
    const n = composition.durationInFrames;
    for (let f = 0; f < n; f++) {
      const name = `${job.prefix ?? job.id + "-"}${String(f + 1).padStart(2, "0")}.png`;
      await renderStill({
        composition,
        serveUrl,
        output: path.join(outDir, name),
        frame: f,
        inputProps,
        imageFormat: "png",
        scale: job.scale ?? 1,
        puppeteerInstance: browser,
        browserExecutable,
        overwrite: true,
      });
    }
    console.log(`✓ ${job.id} → ${path.relative(root, outDir)} (${n} images, ${((Date.now() - t) / 1000).toFixed(1)} s)`);
  } else if (job.type === "video") {
    const out = resolveOut(job.out);
    ensureDir(out);
    let last = -1;
    await renderMedia({
      composition,
      serveUrl,
      codec: "h264",
      crf: job.crf ?? 16,
      imageFormat: "png",
      pixelFormat: "yuv420p",
      colorSpace: "bt709",
      outputLocation: out,
      inputProps,
      muted: true,
      concurrency,
      puppeteerInstance: browser,
      browserExecutable,
      overwrite: true,
      frameRange: job.frameRange ?? null,
      onProgress: ({ progress }) => {
        const p = Math.floor(progress * 10);
        if (p !== last) {
          last = p;
          process.stdout.write(`  ${job.id} ${p * 10}%\n`);
        }
      },
    });
    console.log(`✓ ${job.id} → ${path.relative(root, out)} (${((Date.now() - t) / 1000).toFixed(1)} s)`);
  } else {
    console.warn(`? type inconnu : ${job.type}`);
  }
}

await browser.close({ silent: true });
console.log(`Terminé en ${((Date.now() - t0) / 1000).toFixed(1)} s`);
