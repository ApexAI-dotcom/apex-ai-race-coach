/**
 * Types pour plot_data (backend) — graphiques Recharts
 */

export interface SpeedTraceLap {
  lap_number: number;
  lap_time: number;
  distance_m: number[];
  speed_kmh: number[];
  is_reference?: boolean;
}

export interface Sector {
  name: string;
  start_m: number;
  end_m: number;
}

export interface SpeedTraceData {
  laps: SpeedTraceLap[];
  sectors: Sector[];
  avg_speed_kmh: number;
}

export interface ThrottleBrakeLap {
  lap_number: number;
  distance_m: number[];
  throttle_pct: number[];
  brake_pct: number[];
}

export interface TimeDeltaData {
  reference_lap: number;
  comparison_lap: number;
  distance_m: number[];
  delta_s: number[];
}

export interface RadarData {
  axes: string[];
  values: number[];
  max_values: number[];
}

export type CornerMarginStatus = "optimal" | "good" | "warning";
export type CornerMarginGrade = "A" | "B" | "C" | "D" | "F";

export interface CornerMargin {
  label: string;
  margin_kmh: number;
  status: CornerMarginStatus;
  corner_type: "right" | "left";
  grade: CornerMarginGrade;
  score: number;
  apex_speed_real: number;
  apex_speed_optimal: number;
  time_lost: number;
  entry_speed: number;
  exit_speed: number;
}

export interface TrajectoryCorner {
  id: number;
  lat: number;
  lon: number;
  label: string;
  grade: string;
  corner_type: string;
  apex_speed: number;
}

/**
 * Zone de freinage d'un virage, sur un tour donné.
 *
 * Le tracé arrive en coordonnées GPS toutes prêtes : la carte le dessine tel
 * quel, sans réappliquer le moindre seuil. `start_lat`/`start_lon` sont, par
 * construction, le PREMIER point de `lat`/`lon` — la pastille ne peut donc
 * jamais se retrouver ailleurs que sur sa bande.
 */
export interface BrakingZone {
  corner_id: number;
  kind: "braking";
  lat: number[];
  lon: number[];
  start_lat: number | null;
  start_lon: number | null;
  /** Décélération de crête (g) : l'intensité réelle de l'appui. */
  peak_g: number;
  length_m: number;
  duration_s: number;
  /** Distance entre le déclenchement et l'apex : le repère à compter en piste. */
  distance_to_apex_m: number;
  entry_speed_kmh: number;
  min_speed_kmh: number;
  /** Temps sans frein ni gaz, entre le relâcher et la remise des gaz. */
  coasting_s: number;
  coasting_lat: number[];
  coasting_lon: number[];
  time_lost_s: number;
  /** Le pilote a repris du frein après avoir relâché : une retouche. */
  double_brake: boolean;
}

export interface TrajectoryLap {
  lap_number?: number;
  is_best?: boolean;
  lat: number[];
  lon: number[];
  speed_kmh?: number[];
  throttle_pct?: number[];
  brake_pct?: number[];
  distance_m?: number[];
  rpm?: number[];
  lateral_g?: number[];
  /** Phase de pilotage par point, calculée côté serveur en unités physiques. */
  phase?: ("braking" | "acceleration" | "coasting")[];
  /** Zones de freinage de CE tour, prêtes à tracer. */
  braking_zones?: BrakingZone[];
  is_synthetic?: boolean;
  reference_type?: "model" | "best_real";
  label?: string;
}

/** Verdict de freinage : le défaut dominant, mesuré. */
export type BrakingVerdict =
  | "soft"
  | "coasting"
  | "brake_later"
  | "brake_earlier"
  | "inconsistent"
  | "optimal";

/** Synthèse de freinage d'un virage, tous tours représentatifs confondus. */
export interface BrakingCorner {
  corner_id: number;
  laps: number;
  reference_lap: number;
  braking_lat: number | null;
  braking_lon: number | null;
  braking_point_distance: number;
  braking_point_optimal: number;
  braking_delta: number;
  braking_verdict: BrakingVerdict;
  braking_length_m: number;
  braking_duration_s: number;
  braking_peak_g: number;
  braking_avg_g: number;
  braking_build_up_m: number;
  braking_entry_speed: number;
  braking_min_speed: number;
  braking_delta_v: number;
  /** Distance minimale autorisée par la physique — une borne, pas une promesse. */
  braking_theoretical_min_m: number;
  trail_braking_ratio: number;
  coasting_s: number;
  coasting_m: number;
  coasting_best_s: number;
  coasting_excess_s: number;
  braking_time_lost: number;
  /** Écart-type du point de freinage : le marqueur de régularité. */
  braking_consistency_m: number;
  braking_best_lap: number;
  braking_best_point_m: number;
  braking_best_min_speed: number;
  braking_best_peak_g: number;
  braking_corner_peak_g: number;
  braking_capability_g: number;
  double_brake_laps: number;
}

/** Analyse de freinage de la session. */
export interface BrakingAnalysis {
  /** Décélération que le pilote a réellement démontrée (g). */
  capability_g: number;
  corners: BrakingCorner[];
}

export type TrackMapProfile = "speed" | "braking" | "sectors" | "compare" | "complete";

/** Bords de piste estimés (largeur réglementaire karting), pour tracer le ruban. */
export interface TrackEdges {
  left: { lat: number[]; lon: number[] };
  right: { lat: number[]; lon: number[] };
}

/** Métadonnées du Tour Parfait IA (ligne de course calculée). */
export interface RacingLineMeta {
  optimal_lap_time_s?: number;
  mu_calibrated?: number;
  track_width_m?: number;
  track_width_source?: string;
  curvature_reduction_pct?: number;
  corners_total?: number;
  corners_preserved?: number;
  reference_lap?: number;
  laps_used?: number[];
}

/** Mini-secteur : temps perdu mesuré sur une portion de piste. */
export interface IdealLapSector {
  index: number;
  start_m: number;
  end_m: number;
  ideal_time_s: number;
  best_lap_time_s: number;
  loss_s: number;
  from_lap: number;
  corner_id?: number | null;
}

/** Tour idéal : meilleurs mini-secteurs recombinés (chronos réels). */
export interface IdealLap {
  available?: boolean;
  laps_used?: number[];
  best_lap_number?: number;
  best_real_lap_time_s?: number;
  ideal_lap_time_s?: number;
  potential_gain_s?: number;
  n_sectors?: number;
  track_length_m?: number;
  per_corner_loss_s?: Record<string, number>;
  sectors?: IdealLapSector[];
}

export interface CornerDetail {
  id: number;
  label: string;
  corner_type: string;
  grade: string;
  score: number;
  apex_speed_real: number;
  apex_speed_optimal: number;
  entry_speed: number;
  exit_speed: number;
  target_entry_speed?: number;
  target_exit_speed?: number;
  lateral_g_max: number;
  time_lost: number;
  apex_lat?: number;
  apex_lon?: number;
  margin_kmh?: number;
  status?: CornerMarginStatus;
}

export interface PlotData {
  speed_trace: SpeedTraceData;
  throttle_brake: { laps: ThrottleBrakeLap[] };
  time_delta: TimeDeltaData;
  performance_radar: RadarData;
  apex_margin: { corners: CornerMargin[] };
  trajectory_2d: { corners: TrajectoryCorner[]; laps?: TrajectoryLap[] };
  track_edges?: TrackEdges;
  racing_line_meta?: RacingLineMeta;
  /** Freinages mesurés — même source que les bandes de la carte. */
  braking?: BrakingAnalysis;
  time_delta_laps?: {
    best_lap_number: number;
    laps: {
      lap_number: number;
      distance_m: number[];
      delta_s: number[];
      is_best: boolean;
    }[];
  };
}

export interface AnalysisPerformanceScore {
  overall_score: number;
  grade: string;
  breakdown: Record<string, number>;
  percentile: number;
}

export interface CoachingAdvice {
  priority: number;
  category: string;
  message: string;
  explanation: string;
  corner?: number;
  impact_seconds: number;
  difficulty: string;
}

export interface AnalysisResponse {
  success: boolean;
  analysis_id: string;
  corners_detected: number;
  lap_time: number;
  best_lap_time: number;
  lap_times: number[];
  performance_score: AnalysisPerformanceScore;
  corner_analysis: unknown[];
  coaching_advice: CoachingAdvice[];
  plots: Record<string, string>;
  plot_data?: PlotData;
  statistics: unknown;
  session_conditions?: {
    track_condition: string;
    track_temperature?: number;
    circuit_name?: string;
  };
  /** Tour idéal (meilleurs mini-secteurs recombinés) — chronos réels mesurés. */
  ideal_lap?: IdealLap;
  /** Tour Parfait IA : ligne de course calculée + bords de piste estimés. */
  racing_line?: RacingLineMeta & { track_edges?: TrackEdges };
}
