import React from "react";
import { Zap, Lock, MapPin, ListChecks } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import type { CoachingAdvice as CoachingAdviceType, CoachingMeta } from "@/types/analysis";

interface CoachingAdviceProps {
  advice: CoachingAdviceType[];
  fastestLapNumber?: number;
  isLocked?: boolean;
  hideCta?: boolean;
  /** Niveau d'analyse et données utilisées (renvoyé par l'analyse). */
  meta?: CoachingMeta | null;
  /** Ouvre le virage concerné sur la carte du circuit. */
  onFocusCorner?: (cornerId: number) => void;
}

// Libellés affichés pour les catégories renvoyées par le moteur.
const CATEGORY_LABEL: Record<string, string> = {
  apex: "Point de corde",
  speed: "Vitesse",
  braking: "Freinage",
  exit: "Sortie et relance",
  line: "Trajectoire",
  consistency: "Régularité",
  engine: "Moteur",
  tire: "Pneus",
  setup: "Réglage",
  style: "Style de pilotage",
  plan: "Prochaine séance",
  info: "Contexte",
};

const TIER_LINE: Record<string, string> = {
  visitor: "Analyse de base, tirée de ta séance.",
  rookie: "Analyse reliée au circuit, au moteur et aux pneus.",
  racer: "Analyse Racer : reliée à ton kart, à ton réglage et au circuit.",
};

function LockedCard({ item, onCta }: { item: CoachingAdviceType; onCta: (tier: string) => void }) {
  const tier = item.tier_required === "rookie" ? "rookie" : "racer";
  const headline = item.message.includes(" — ") ? item.message.split(" — ").slice(1).join(" — ") : item.message;
  return (
    <div className="relative min-h-[168px] overflow-hidden rounded-xl border border-primary/25 bg-secondary/30 p-3.5 sm:p-4">
      <div aria-hidden="true" className="select-none blur-[5px] opacity-60">
        <div className="flex items-center gap-2">
          {item.corner ? <span className="text-sm font-semibold">Virage {item.corner}</span> : null}
          <span className="text-xs text-muted-foreground">{CATEGORY_LABEL[item.category] ?? item.category}</span>
        </div>
        <p className="mt-2 font-semibold leading-snug">{headline}</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Le détail chiffré et la consigne pour ta prochaine séance.
        </p>
      </div>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-background/40 px-4 text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/40 bg-background/80 px-2.5 py-1 text-xs font-semibold text-primary">
          <Lock className="h-3.5 w-3.5" />
          {tier === "rookie" ? "Compte gratuit" : "Racer"}
        </span>
        <p className="text-sm font-medium text-foreground">{item.teaser}</p>
        <Button size="sm" className="rounded-full bg-signature text-white" onClick={() => onCta(tier)}>
          {tier === "rookie" ? "Créer un compte gratuit" : "Débloquer avec Racer"}
        </Button>
      </div>
    </div>
  );
}

function PlanCard({ item }: { item: CoachingAdviceType }) {
  const steps = item.steps?.length ? item.steps : item.explanation.split(/(?<=\.)\s+(?=[A-ZÀ-Ý])/);
  return (
    <div className="rounded-xl border border-primary/30 bg-gradient-to-br from-primary/10 to-transparent p-3.5 sm:p-4">
      <div className="flex items-center gap-2">
        <ListChecks className="h-4 w-4 text-primary" />
        <span className="font-display font-semibold text-foreground">{item.message}</span>
      </div>
      <ul className="mt-2 space-y-1">
        {steps.map((s, i) => {
          // « Objectif : … » en avant, le reste en retrait.
          const [label, ...rest] = s.split(" : ");
          return (
            <li key={i} className="text-sm leading-relaxed text-muted-foreground">
              {rest.length ? (
                <>
                  <span className={label === "Objectif" ? "font-semibold text-foreground" : "text-foreground/80"}>
                    {label} :
                  </span>{" "}
                  {rest.join(" : ")}
                </>
              ) : (
                s
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function CoachingAdvice({
  advice,
  fastestLapNumber,
  isLocked,
  hideCta = false,
  meta,
  onFocusCorner,
}: CoachingAdviceProps) {
  const navigate = useNavigate();
  if (!advice || advice.length === 0) return null;

  // Le contexte de session (tours retenus, conditions) n'est pas un conseil :
  // il décrit sur quoi les conseils s'appuient. Il a donc sa place en
  // sous-titre, pas dans une carte numérotée « Priorité 0 ».
  const sessionInfo = advice.filter((a) => a.category === "info" && !a.corner);
  const lockedItems = advice.filter((a) => a.locked);
  const plan = advice.find((a) => a.category === "plan" && !a.locked);
  const actionable = advice.filter(
    (a) => !(a.category === "info" && !a.corner) && !a.locked && a.category !== "plan",
  );
  if (actionable.length === 0 && lockedItems.length === 0) return null;

  // Nouveau moteur : le niveau est appliqué par l'analyse (quota + aperçu
  // verrouillé). Les anciennes analyses gardent l'ancien floutage.
  const tiered = advice.some((a) => a.tier_required !== undefined) || !!meta;
  const legacyLocked = !tiered && isLocked;

  const goCta = (tier: string) => navigate(tier === "rookie" ? "/login?mode=register" : "/pricing");

  return (
    <Card className="glass-card border-primary/20 mb-8 relative overflow-hidden">
      <CardHeader className="px-4 pb-3 sm:px-6">
        <CardTitle className="flex items-center gap-2 font-display text-xl sm:text-2xl">
          <Zap className="w-5 h-5 text-primary" />
          Conseils de coaching
        </CardTitle>
        <CardDescription className="space-y-1">
          <span className="block">
            Classés par temps perdu, mesuré sur tes tours
            {fastestLapNumber ? ` (référence : tour ${fastestLapNumber})` : ""}.
          </span>
          {meta?.tier && <span className="block text-[11px] text-primary/90">{TIER_LINE[meta.tier]}</span>}
          {sessionInfo.map((info, i) => (
            <span key={`info-${i}`} className="block text-[11px] opacity-80">
              {info.message}
            </span>
          ))}
        </CardDescription>
      </CardHeader>
      <CardContent className="px-3 sm:px-6">
        <div className="space-y-3">
          {actionable.map((item, index) => {
            const isItemLocked = legacyLocked && index >= 2;
            const canFocus = !!onFocusCorner && !!item.corner && !isItemLocked;
            return (
              <div
                key={index}
                role={canFocus ? "button" : undefined}
                tabIndex={canFocus ? 0 : undefined}
                aria-label={
                  canFocus ? `Voir le virage ${item.corner} sur la carte du circuit` : undefined
                }
                title={canFocus ? "Voir ce virage sur la carte du circuit" : undefined}
                onClick={canFocus ? () => onFocusCorner!(item.corner as number) : undefined}
                onKeyDown={
                  canFocus
                    ? (e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          onFocusCorner!(item.corner as number);
                        }
                      }
                    : undefined
                }
                className={`p-3.5 sm:p-4 rounded-xl bg-secondary/40 border relative transition-colors duration-200 ${
                  isItemLocked ? "blur-[6px] select-none pointer-events-none opacity-50" : ""
                } ${
                  canFocus
                    ? "cursor-pointer border-white/5 hover:border-primary/40 hover:bg-secondary/70 hover:shadow-[0_0_18px_-4px_hsl(var(--primary)/0.45)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
                    : "border-white/5"
                }`}
              >
                {/* En-tête court : rang, virage, temps à gagner — l'essentiel d'un coup d'œil. */}
                <div className="flex items-center gap-2">
                  <span className="relative inline-flex h-7 min-w-7 items-center justify-center px-1.5 font-display text-sm font-bold text-white">
                    <span aria-hidden="true" className="absolute inset-0 -skew-x-[14deg] rounded-[4px] bg-signature" />
                    <span className="relative">{item.priority || index + 1}</span>
                  </span>
                  {item.corner ? (
                    <span className="inline-flex items-center gap-1 text-sm font-semibold text-foreground">
                      Virage {item.corner}
                      {canFocus && <MapPin className="h-3.5 w-3.5 text-primary" />}
                    </span>
                  ) : null}
                  <span className="text-xs text-muted-foreground">{CATEGORY_LABEL[item.category] ?? item.category}</span>
                  {item.tier_required === "racer" && (
                    <span className="rounded-full border border-primary/40 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
                      Racer
                    </span>
                  )}
                  {item.impact_seconds > 0 && (
                    <span
                      className="ml-auto shrink-0 rounded-full bg-[hsl(var(--amber)/0.12)] px-2 py-0.5 text-xs font-semibold tabular-nums text-[hsl(var(--amber))]"
                      title="Temps à gagner, mesuré sur tes tours"
                    >
                      {item.impact_seconds.toFixed(2).replace(".", ",")} s/tour
                    </span>
                  )}
                </div>
                {/* La consigne en titre ; l'explication, longue, se déplie au besoin. */}
                <p className="mt-2 font-semibold leading-snug text-foreground">
                  {item.message.includes(" — ") ? item.message.split(" — ").slice(1).join(" — ") : item.message}
                </p>
                {item.fact && item.action ? (
                  (() => {
                    // Une seule phrase visible : le constat. Le détail chiffré,
                    // la consigne et le repère se déplient au besoin.
                    const fact = item.fact.trim();
                    const first = fact.match(/^.*?[.!?](\s|$)/)?.[0]?.trim() ?? fact;
                    const more = fact.slice(first.length).trim();
                    return (
                  <>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{first}</p>
                    <details className="group mt-1" onClick={(e) => e.stopPropagation()}>
                      <summary className="cursor-pointer list-none text-sm font-medium text-primary [&::-webkit-details-marker]:hidden">
                        <span className="group-open:hidden">Comment faire</span>
                        <span className="hidden group-open:inline">Masquer</span>
                      </summary>
                      {more && <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{more}</p>}
                      <p className="mt-1.5 text-sm leading-relaxed text-foreground/90">{item.action}</p>
                      {item.check && (
                        <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{item.check}</p>
                      )}
                    </details>
                  </>
                    );
                  })()
                ) : (
                  (() => {
                    const text = (item.explanation || "").trim();
                    const first = text.match(/^.*?[.!?](\s|$)/)?.[0]?.trim() ?? text;
                    const rest = text.slice(first.length).trim();
                    return (
                      <>
                        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{first}</p>
                        {rest && (
                          <details className="group mt-1" onClick={(e) => e.stopPropagation()}>
                            <summary className="cursor-pointer list-none text-sm font-medium text-primary [&::-webkit-details-marker]:hidden">
                              <span className="group-open:hidden">Comment faire</span>
                              <span className="hidden group-open:inline">Masquer</span>
                            </summary>
                            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{rest}</p>
                          </details>
                        )}
                      </>
                    );
                  })()
                )}
              </div>
            );
          })}
          {plan && <PlanCard item={plan} />}
          {lockedItems.map((item, i) => <LockedCard key={`locked-${i}`} item={item} onCta={goCta} />)}
        </div>

        {legacyLocked && actionable.length > 2 && (
          <div className="absolute inset-0 flex flex-col items-center justify-end pb-8 z-10 bg-gradient-to-t from-background/90 via-background/50 to-transparent">
            {!hideCta && (
              <div className="flex flex-col items-center max-w-sm text-center">
                <div className="bg-red-600/20 p-2 rounded-full mb-3 border border-red-500/50 backdrop-blur-sm">
                  <Lock className="w-5 h-5 text-red-500" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Débloque tous les conseils</h3>
                <p className="text-gray-300 text-sm mb-4">
                  Crée un compte gratuitement pour révéler tous les conseils de coaching
                  personnalisés.
                </p>
                <Button
                  onClick={() => navigate("/login?mode=register")}
                  className="bg-red-600 hover:bg-red-700 text-white font-bold rounded-full w-full"
                >
                  Créer un compte
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
