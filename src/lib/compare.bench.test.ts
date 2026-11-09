/**
 * Comparateur sur de vraies séances (banc d'essai, hors CI).
 *
 * Les séances des pilotes ne sont pas dans le dépôt : le banc du backend les
 * analyse et écrit les résultats en JSON, puis ce test rejoue le comparateur
 * sur chaque paire « même pilote, même jour » :
 *
 *   python scripts/coaching_bench.py <dossiers…> --dump /chemin/bench
 *   APEX_BENCH_DIR=/chemin/bench npx vitest run src/lib/compare.bench.test.ts
 *
 * Sans APEX_BENCH_DIR, le test est ignoré.
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import type { AnalysisResult } from "@/lib/api";
import { bestLap, compareLaps, cornerRefs, lapTrace, summarize } from "./compare";

const DIR = process.env.APEX_BENCH_DIR;
const pairs: [string, string][] = DIR && existsSync(join(DIR, "pairs.json")) ? JSON.parse(readFileSync(join(DIR, "pairs.json"), "utf8")) : [];
const load = (f: string) => JSON.parse(readFileSync(join(DIR!, f), "utf8")) as AnalysisResult;

describe.skipIf(!pairs.length)("comparateur sur les vraies séances", () => {
  it.each(pairs)("%s ↔ %s", (fa, fb) => {
    const ra = load(fa);
    const rb = load(fb);
    const la = bestLap(ra);
    const lb = bestLap(rb);
    expect(la, "meilleur tour A").not.toBeNull();
    expect(lb, "meilleur tour B").not.toBeNull();
    const a = lapTrace(ra, la!)!;
    const b = lapTrace(rb, lb!)!;
    expect(a && b, "traces des deux tours").toBeTruthy();

    const refs = cornerRefs(ra);
    const cmp = compareLaps(a, b, refs);
    // Recalage : on parcourt le tour B jusqu'au bout, sans retour en arrière.
    const back = cmp.pos.filter((p, i) => i > 0 && p < cmp.pos[i - 1] - 2).length;
    expect(back / cmp.pos.length).toBeLessThan(0.02);
    expect(cmp.pos[cmp.pos.length - 1]).toBeGreaterThan(0.95 * (b.d.length - 1));
    // Écart final = écart de chrono ; en cours de tour, il reste plausible.
    expect(cmp.delta[cmp.delta.length - 1]).toBeCloseTo(b.time - a.time, 2);
    expect(Math.max(...cmp.delta.map(Math.abs))).toBeLessThan(Math.abs(b.time - a.time) + 3);
    // Tous les virages du tour A sont comparés, avec des vitesses mini cohérentes.
    expect(cmp.corners.length).toBeGreaterThanOrEqual(Math.floor(0.8 * refs.length));
    for (const c of cmp.corners) expect(Math.abs(c.minSpeed[0] - c.minSpeed[1]), `virage ${c.number}`).toBeLessThan(25);
    expect(summarize(cmp, ["Séance 1", "Séance 2"]).length).toBeGreaterThan(10);

    // Un tour comparé à lui-même : aucun écart.
    const self = compareLaps(a, a, refs);
    expect(Math.max(...self.delta.map(Math.abs))).toBeLessThan(0.01);
  });
});
