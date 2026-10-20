import { describe, it, expect } from "vitest";
import { toDriverVocabulary as v } from "@/lib/vocabulary";

describe("toDriverVocabulary", () => {
  it("remplace apex par point de corde", () => {
    expect(v("V3 — Apex décalé de 2.1m vers l'intérieur")).toBe("V3 — Point de corde décalé de 2.1m vers l'intérieur");
    expect(v("Précision Apex")).toBe("Précision point de corde");
    expect(v("12.0 km/h à l'apex vs 14 km/h optimal")).toBe("12.0 km/h au point de corde vs 14 km/h optimal");
    expect(v("Tu déclenches à 80 m de l'apex")).toBe("Tu déclenches à 80 m du point de corde");
    expect(v("Position d'apex non optimale")).toBe("Position du point de corde non optimale");
    expect(v("Fixe l'apex du regard")).toBe("Fixe le point de corde du regard");
    expect(v("Trajectoire en double apex")).toBe("Trajectoire en deux points de corde");
  });

  it("ne touche jamais la marque", () => {
    expect(v("ApexAI")).toBe("ApexAI");
    expect(v("Apex AI")).toBe("Apex AI");
    expect(v("APEX")).toBe("APEX");
    expect(v("Bienvenue sur ApexAI, le coach")).toBe("Bienvenue sur ApexAI, le coach");
  });

  it("est idempotent", () => {
    const once = v("V3 — Apex décalé de 2m, 90 m de l'apex");
    expect(v(once)).toBe(once);
  });
});
