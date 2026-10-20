import { describe, it, expect, vi } from "vitest";

// Le hook importe le stockage (client Supabase) : inutile ici, et il exige des
// variables d'environnement absentes en test.
vi.mock("@/lib/storage", () => ({ getAnalysisById: vi.fn() }));

import { mapApiResultToResponse } from "@/hooks/useAnalysis";
import type { AnalysisResult } from "@/lib/api";

// Régression : rouvrir une analyse depuis le tableau de bord perdait la carte
// des mini-secteurs, car le passage « résultat brut → vue » recopiait une liste
// de champs à la main et oubliait `ideal_lap` et `racing_line`.
const raw = {
  success: true,
  analysis_id: "abc",
  timestamp: "2026-10-21T00:00:00Z",
  corners_detected: 3,
  lap_time: 40.1,
  best_lap_time: 39.9,
  lap_times: [40.1, 39.9],
  performance_score: { overall_score: 70, grade: "B", breakdown: {} },
  corner_analysis: [],
  coaching_advice: [],
  plots: {},
  statistics: {},
  session_conditions: { circuit_name: "Mon circuit", session_name: "Test" },
  plot_data: { apex_margin: { corners: [] }, braking: { capability_g: 1, corners: [] } },
  ideal_lap: { sectors: [{ id: 1 }], per_corner_loss_s: { "1": 0.2 } },
  racing_line: { track_edges: { left: [], right: [] } },
} as unknown as AnalysisResult;

describe("mapApiResultToResponse", () => {
  it("conserve la carte des mini-secteurs et le Tour Parfait IA", () => {
    const out = mapApiResultToResponse(raw);
    expect(out.ideal_lap).toEqual(raw.ideal_lap);
    expect(out.racing_line).toEqual(raw.racing_line);
  });

  it("conserve les freinages et les conditions de session", () => {
    const out = mapApiResultToResponse(raw);
    expect(out.plot_data?.braking).toBeDefined();
    expect(out.session_conditions?.circuit_name).toBe("Mon circuit");
    expect(out.session_conditions?.session_name).toBe("Test");
  });

  it("corrige à l'affichage l'ancien vocabulaire des analyses enregistrées", () => {
    const out = mapApiResultToResponse({
      ...raw,
      coaching_advice: [
        { priority: 1, category: "apex", message: "V3 — Apex décalé de 2m", explanation: "Regarde l'apex.", impact_seconds: 0.1, difficulty: "moyen" },
      ],
    } as unknown as AnalysisResult);
    expect(out.coaching_advice[0].message).toBe("V3 — Point de corde décalé de 2m");
    expect(out.coaching_advice[0].explanation).toBe("Regarde le point de corde.");
  });

  it("comble les trous sans planter", () => {
    const out = mapApiResultToResponse({
      ...raw,
      lap_times: null,
      best_lap_time: null,
      ideal_lap: null,
    } as unknown as AnalysisResult);
    expect(out.lap_times).toEqual([40.1]);
    expect(out.best_lap_time).toBe(40.1);
    expect(out.ideal_lap).toBeUndefined();
  });
});
