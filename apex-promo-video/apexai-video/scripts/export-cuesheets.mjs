// Exporte les cue sheets son en CSV (séparateur « ; », décimales FR, UTF-8 avec BOM pour Excel).
// Usage : node scripts/export-cuesheets.mjs   →   out/cue-sheet-16x9.csv, out/cue-sheet-9x16.csv
// Les ticks de virage du duel reprennent exactement le calcul de src/audio/cues.ts (courbe 0.3, 0, 0.7, 1).
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const cues = JSON.parse(readFileSync(join(root, "src/audio/cues.json"), "utf8"));
const lap = JSON.parse(readFileSync(join(root, "src/data/adria-lap.json"), "utf8"));
const FPS = 60;

const at = (a1, a2, t) => 3 * a1 * t * (1 - t) ** 2 + 3 * a2 * t * t * (1 - t) + t ** 3;
const ease = (x) => {
  let lo = 0, hi = 1;
  for (let k = 0; k < 40; k++) { const m = (lo + hi) / 2; if (at(0.3, 0.7, m) < x) lo = m; else hi = m; }
  return at(0, 1, (lo + hi) / 2);
};
const inv = (y) => {
  let lo = 0, hi = 1;
  for (let k = 0; k < 40; k++) { const m = (lo + hi) / 2; if (ease(m) < y) lo = m; else hi = m; }
  return (lo + hi) / 2;
};
const ticks = (start, end, scene) =>
  lap.corners.map((c) => ({
    t: Math.round((start + (end - start) * inv(lap.points[c.i][3] / lap.lapTimesS.T9)) * 1000) / 1000,
    scene,
    kind: "sfx",
    name: `Tick virage ${c.n}`,
    file: "tick-corner",
    desc: `Le Tour 4 passe le virage ${c.n} ; tonalité qui monte avec l'écart`,
  }));

const fr = (n, d = 2) => n.toFixed(d).replace(".", ",");
const tc = (t) => {
  const f = Math.round(t * FPS);
  const mm = Math.floor(f / (FPS * 60));
  const ss = Math.floor(f / FPS) % 60;
  const ii = f % FPS;
  return `${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")}:${String(ii).padStart(2, "0")}`;
};
const esc = (v) => (/[";\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
const KIND = { music: "Musique", sfx: "Effet", silence: "Silence" };

const sheets = [
  { key: "16x9", out: "out/cue-sheet-16x9.csv", extra: ticks(4.1, 6.1, "S02") },
  { key: "9x16", out: "out/cue-sheet-9x16.csv", extra: ticks(3.0, 4.6, "V02") },
];
mkdirSync(join(root, "out"), { recursive: true });
for (const s of sheets) {
  const rows = [...cues[s.key], ...s.extra].sort((a, b) => a.t - b.t);
  const lines = [["Scène", "Début (s)", "Image (60 i/s)", "Timecode mm:ss:ii", "Type", "Repère", "Description", "Fichier SFX attendu"].join(";")];
  for (const r of rows) {
    lines.push(
      [r.scene, fr(r.t, 3), String(Math.round(r.t * FPS)), tc(r.t), KIND[r.kind] ?? r.kind, r.name, r.desc, r.file ? `public/sfx/${r.file}.mp3` : ""]
        .map((v) => esc(String(v)))
        .join(";"),
    );
  }
  writeFileSync(join(root, s.out), "﻿" + lines.join("\r\n") + "\r\n", "utf8");
  console.log(`${s.out} : ${rows.length} repères`);
}
