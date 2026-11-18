import { describe, expect, it } from "vitest";
import { planLifecycle, type LifecycleAccount } from "../../supabase/functions/_shared/lifecycle";

const NOW = new Date("2026-11-18T09:00:00Z");
const daysAgo = (d: number) => new Date(NOW.getTime() - d * 864e5).toISOString();
const inDays = (d: number) => new Date(NOW.getTime() + d * 864e5).toISOString();
const acc = (o: Partial<LifecycleAccount>): LifecycleAccount => ({
  user_id: "u", email: "u@x.fr", created_at: daysAgo(1), email_confirmed: true, analyses: 0, sent: [], opted_out: false, ...o,
});
const kinds = (a: Partial<LifecycleAccount>) => planLifecycle([acc(a)], NOW).map((m) => m.kind);

describe("suite d'activation", () => {
  it("J+3 puis J+7 sans fichier, jamais en rattrapage", () => {
    expect(kinds({ created_at: daysAgo(1) })).toEqual([]);
    expect(kinds({ created_at: daysAgo(3.2) })).toEqual(["activation_d3"]);
    expect(kinds({ created_at: daysAgo(7.5) })).toEqual(["activation_d7"]);
    expect(kinds({ created_at: daysAgo(90) })).toEqual([]);
  });
  it("jamais deux fois, jamais à un désinscrit ni à un mail non confirmé", () => {
    expect(kinds({ created_at: daysAgo(3.2), sent: ["activation_d3"] })).toEqual([]);
    expect(kinds({ created_at: daysAgo(3.2), opted_out: true })).toEqual([]);
    expect(kinds({ created_at: daysAgo(3.2), email_confirmed: false })).toEqual([]);
  });
  it("après la première analyse, plus de relance « dépose ton fichier »", () => {
    expect(kinds({ created_at: daysAgo(3.2), analyses: 1, first_analysis_at: daysAgo(0.5), first_analysis_id: "a1" })).toEqual(["first_analysis"]);
    expect(kinds({ created_at: daysAgo(7.5), analyses: 2, first_analysis_at: daysAgo(4) })).toEqual([]);
  });
  it("fin de Paddock Pass à J-3, pas pour un abonné payant, une fois par pass", () => {
    expect(kinds({ trial_tier: "racer", trial_until: inDays(2.5) })).toEqual(["pass_ending"]);
    expect(kinds({ trial_tier: "racer", trial_until: inDays(2.5), paid_tier: "racer" })).toEqual([]);
    const until = inDays(2.5);
    expect(kinds({ trial_tier: "racer", trial_until: until, sent: [`pass_ending:${until.slice(0, 10)}`] })).toEqual([]);
  });
  it("un seul mail par jour : le départ d'une structure passe avant le reste", () => {
    const k = kinds({
      created_at: daysAgo(3.2),
      trial_tier: "racer",
      trial_until: inDays(2.5),
      left_structure: { id: "s1", name: "École", left_at: daysAgo(0.2) },
    });
    expect(k).toEqual(["team_farewell"]);
  });
});

import { signUnsubscribe, verifyUnsubscribe } from "../../supabase/functions/_shared/unsubscribe";

describe("lien de désinscription", () => {
  it("signé : vérifiable, infalsifiable pour un autre compte", async () => {
    const id = "6f1c2d3e-4a5b-4c6d-8e9f-0a1b2c3d4e5f";
    const t = await signUnsubscribe(id, "secret-test");
    expect(await verifyUnsubscribe(t, "secret-test")).toBe(id);
    expect(await verifyUnsubscribe(t, "autre-secret")).toBeNull();
    const other = "7f1c2d3e-4a5b-4c6d-8e9f-0a1b2c3d4e5f";
    expect(await verifyUnsubscribe(`${other}.${t.split(".")[1]}`, "secret-test")).toBeNull();
    expect(await verifyUnsubscribe("n'importe quoi", "secret-test")).toBeNull();
  });
});
