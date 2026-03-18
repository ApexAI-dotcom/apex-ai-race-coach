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

/** Points GPS d'un tour pour tracer le circuit (trajectory_2d.laps) */
export interface TrajectoryLap {
  lat: number[];
  lon: number[];
  speed_kmh?: number[];
}

export interface PlotData {
  speed_trace: SpeedTraceData;
  throttle_brake: { laps: ThrottleBrakeLap[] };
  time_delta: TimeDeltaData;
  performance_radar: RadarData;
  apex_margin: { corners: CornerMargin[] };
  trajectory_2d: { corners: TrajectoryCorner[]; laps?: TrajectoryLap[] };
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

export interface AnalysisResponse {
  success: boolean;
  analysis_id: string;
  corners_detected: number;
  lap_time: number;
  best_lap_time: number;
  lap_times: number[];
  performance_score: AnalysisPerformanceScore;
  corner_analysis: unknown[];
  coaching_advice: unknown[];
  plots: Record<string, string>;
  plot_data?: PlotData;
  statistics: unknown;
  session_conditions?: { 
    track_condition: string; 
    track_temperature?: number;
    circuit_name?: string;
  };
}
