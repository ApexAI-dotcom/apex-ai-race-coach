import type { AnalysisResponse } from "@/types/analysis";
import raw from "./demoAnalysis.json";

/**
 * La session de démo (Karting de Plessé, fichier AiM récent) analysée par le VRAI moteur
 * d'ApexAI, réduite aux champs que l'accueil affiche : carte du circuit (vitesse,
 * freinage, mini-secteurs, comparaison), conseils de coaching, trace de vitesse,
 * radar. Rien n'est écrit à la main.
 *
 * Régénération : `scripts/demo-analysis/build.py` (voir son en-tête). Le nom du
 * pilote présent dans le fichier d'origine n'est jamais exporté.
 */
export const DEMO_ANALYSIS = raw as unknown as AnalysisResponse;

/** Meilleur tour de la session, tel que l'analyse le désigne. */
export const DEMO_BEST_LAP = (raw as { best_lap_number: number }).best_lap_number;
