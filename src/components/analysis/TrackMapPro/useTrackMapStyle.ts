import { useMemo } from "react";
import type { TrajectoryLap, TrackMapProfile } from "@/types/analysis";
import {
  speedToColor,
  brakingSegmentColor,
  brakingPhase,
  type BrakingPhase,
  APEX_RED,
  TRACK_GREEN,
  TRACK_GRAY,
} from "./trackMapColors";
import type { ProjectedPoint, ColoredSegment } from "./useTrackMapGeometry";

export interface LapProjection {
  lap: TrajectoryLap;
  points: ProjectedPoint[];
  polyline: string;
  segments: ColoredSegment[];
  speedMin: number;
  speedMax: number;
  isSynthetic: boolean;
}

export function buildLapProjection(
  lap: TrajectoryLap,
  project: (lat: number, lon: number) => [number, number],
  profile: TrackMapProfile,
  globalSpeedMin: number,
  globalSpeedMax: number,
  globalSpeedMedian?: number,
  speedQuantiles?: number[]
): LapProjection {
  const pts: ProjectedPoint[] = [];
  const segments: ColoredSegment[] = [];
  const polyParts: string[] = [];

  const n = Math.min(lap.lat?.length ?? 0, lap.lon?.length ?? 0);
  const speeds = lap.speed_kmh ?? [];
  const throttles = lap.throttle_pct ?? [];
  const brakes = lap.brake_pct ?? [];
  // Phases calculées par le serveur à partir de l'accélération longitudinale
  // réelle (en g). On les préfère toujours à une estimation locale : un seuil
  // exprimé en km/h entre deux échantillons dépend de la fréquence de
  // l'appareil et donnait des phases différentes d'un fichier à l'autre.
  const serverPhases = lap.phase;

  let sMin = Infinity,
    sMax = -Infinity;

  for (let i = 0; i < n; i++) {
    const lt = lap.lat[i];
    const ln = lap.lon[i];
    if (!lt || !ln || (Math.abs(lt) < 0.01 && Math.abs(ln) < 0.01)) continue;
    const [x, y] = project(lt, ln);
    pts.push({ x, y, lat: lt, lon: ln });
    polyParts.push(`${x.toFixed(1)},${y.toFixed(1)}`);

    const spd = speeds[i] ?? 0;
    if (spd > 0) {
      sMin = Math.min(sMin, spd);
      sMax = Math.max(sMax, spd);
    }
  }

  // Build colored segments depending on profile
  for (let i = 0; i < pts.length - 1; i++) {
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const avgSpeed = ((speeds[i] ?? 0) + (speeds[i + 1] ?? 0)) / 2;

    let color: string;
    let phase: BrakingPhase | undefined;

    // Calculate speed delta over 2 points for slight smoothing
    const s1 = speeds[i] ?? 0;
    const s2 = speeds[Math.min(i + 2, speeds.length - 1)] ?? s1;
    const dv = s2 - s1;

    const hasPedals = throttles.some((t) => t > 0) || brakes.some((b) => b > 0);

    const measuredPhase = serverPhases?.[i] as BrakingPhase | undefined;

    if (profile === "speed" || profile === "complete") {
      color = speedToColor(avgSpeed, globalSpeedMin, globalSpeedMax, globalSpeedMedian, speedQuantiles);
      phase = measuredPhase ?? (dv < -0.3 ? "braking" : dv > 0.3 ? "acceleration" : "coasting");
    } else if (profile === "braking") {
      if (measuredPhase) {
        phase = measuredPhase;
        color =
          measuredPhase === "braking"
            ? APEX_RED
            : measuredPhase === "acceleration"
              ? TRACK_GREEN
              : TRACK_GRAY;
      } else if (hasPedals) {
        const thr = ((throttles[i] ?? 0) + (throttles[i + 1] ?? 0)) / 2;
        const brk = ((brakes[i] ?? 0) + (brakes[i + 1] ?? 0)) / 2;
        color = brakingSegmentColor(thr, brk);
        phase = brakingPhase(thr, brk);
      } else {
        if (dv < -0.5) {
          phase = "braking";
          color = APEX_RED;
        } else if (dv > 0.5) {
          phase = "acceleration";
          color = TRACK_GREEN;
        } else {
          phase = "coasting";
          color = TRACK_GRAY;
        }
      }
    } else {
      color = "#f97316"; // orange default for reference lines
    }

    segments.push({
      x1: p1.x,
      y1: p1.y,
      x2: p2.x,
      y2: p2.y,
      color,
      speed: avgSpeed,
      phase,
      index: i,
    });
  }

  return {
    lap,
    points: pts,
    polyline: polyParts.join(" "),
    segments,
    speedMin: sMin === Infinity ? 0 : sMin,
    speedMax: sMax === -Infinity ? 100 : sMax,
    isSynthetic: !!lap.is_synthetic,
  };
}

export function computeGlobalSpeedBounds(laps: TrajectoryLap[]) {
  let globalMin = 40,
    globalMax = 100,
    globalMedian = 70;
  const allSpeeds: number[] = [];
  for (const lap of laps) {
    if (!lap.speed_kmh) continue;
    for (const s of lap.speed_kmh) {
      if (s > 10) allSpeeds.push(s);
    }
  }
  // 101 seuils de percentile : ils permettent de colorer selon le RANG d'une
  // vitesse dans la session plutôt que selon sa position entre le minimum et le
  // maximum. Sur un tracé de karting, l'essentiel du tour se joue dans une
  // bande étroite : une échelle linéaire y écrase toutes les nuances (tout
  // paraît orange). Le classement par percentile étale au contraire les
  // couleurs là où les écarts existent vraiment.
  let quantiles: number[] = [];
  if (allSpeeds.length > 0) {
    allSpeeds.sort((a, b) => a - b);
    globalMin = allSpeeds[Math.floor(allSpeeds.length * 0.02)];
    globalMax = allSpeeds[Math.floor(allSpeeds.length * 0.97)];
    globalMedian = allSpeeds[Math.floor(allSpeeds.length * 0.5)];
    quantiles = Array.from({ length: 101 }, (_, i) =>
      allSpeeds[Math.min(allSpeeds.length - 1, Math.floor((i / 100) * allSpeeds.length))]
    );
  }
  return { globalMin, globalMax, globalMedian, quantiles };
}
