import React from "react";
import { AbsoluteFill, Audio, OffthreadVideo, Img, Sequence, staticFile, useVideoConfig, CalculateMetadataFunction } from "remotion";
import { z } from "zod";
import { C, FONT, alpha } from "../kit/tokens";
import { fr } from "../kit/text";
import { SocialBackground } from "../kit/Background";
import { Footer } from "../kit/elements";
import { Visual, VISUAL_IDS } from "../visuals";
import { DecodeNumber, EndCard, KLine, useTime, ZONE } from "./common";
import { E, prog, reveal } from "../../lib/anim";
import { CornerSplit } from "./CornerSplit";

/**
 * T-Reel — gabarit de reel piloté par les données (production quotidienne).
 * Une suite de « temps » (beats) : accroche, texte, chiffre héros, visuel de l'app,
 * extrait vidéo (rush), carte de fin. Voix off, musique et sous-titres optionnels.
 * Mots-clés en dégradé avec *astérisques*. Zone sûre reel (compatible TikTok).
 */
const beat = z.object({
  dur: z.number().min(0.6).max(12),
  kind: z.enum(["hook", "text", "hero", "visual", "clip", "image", "cta", "split"]),
  title: z.string().optional(),
  sub: z.string().optional(),
  number: z.string().optional(),
  unit: z.string().optional(),
  tone: z.enum(["red", "green", "gold", "white"]).optional(),
  visual: z.enum(VISUAL_IDS).optional(),
  src: z.string().optional(), // chemin dans public/ (rush, capture) ou URL
  label: z.string().optional(),
  sfx: z.string().optional(), // nom d'un son de public/sfx (sans .mp3)
  corner: z.number().optional(), // virage pour visual "trace-zoom"
  range: z.tuple([z.number(), z.number()]).optional(), // split : indices de points
  splitAt: z.number().optional(),
  cues: z.array(z.number()).optional(), // split : apparition des zones (s depuis le début du temps)
  labels: z.tuple([z.string(), z.string(), z.string(), z.string()]).optional(),
});

export const tReelSchema = z.object({
  beats: z.array(beat).min(2),
  voice: z.string().optional(), // chemin public/ ou URL du mp3 de voix off
  voiceVolume: z.number().optional(),
  music: z.string().optional(),
  musicVolume: z.number().optional(),
  captions: z.array(z.object({ t0: z.number(), t1: z.number(), text: z.string() })).optional(),
  label: z.string().optional(),
  safe: z.enum(["reel", "ad"]).optional(),
});
export type TReelProps = z.infer<typeof tReelSchema>;

export const tReelMeta: CalculateMetadataFunction<TReelProps> = ({ props }) => ({
  durationInFrames: Math.max(30, Math.round(props.beats.reduce((a, b) => a + b.dur, 0) * 30)),
});

const TONE: Record<string, string> = { red: C.primary, green: C.success, gold: C.gold, white: C.text };
const src = (p?: string) => (!p ? "" : /^https?:/.test(p) ? p : staticFile(p));

const Beat: React.FC<{ b: z.infer<typeof beat>; t0: number; t1: number; T: number; label?: string; safe: "reel" | "ad" }> = ({ b, t0, t1, T, label, safe }) => {
  const zone = ZONE[safe];
  const out = t1 - 0.25;
  const W = zone.x1 - zone.x0;
  const head = label || b.label;
  const titleSize = b.kind === "hook" ? 112 : 84;
  const Title = b.title ? (
    <KLine T={T} text={b.title} start={t0 + 0.05} size={titleSize} align="left" out={b.kind === "cta" ? undefined : out} sweep={b.kind === "hook"} noIn={b.kind === "hook" && t0 === 0} />
  ) : null;
  const Sub = b.sub ? (
    <div style={{ marginTop: 28, fontFamily: FONT.body, fontWeight: 500, fontSize: 44, lineHeight: 1.25, color: alpha(C.text, 0.82), ...reveal(T, t0 + 0.35, { dur: 0.5, blur: 10, y: 12 }, out) }}>{fr(b.sub)}</div>
  ) : null;
  const Head = head ? (
    <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 36, fontFamily: FONT.body, fontWeight: 600, fontSize: 26, letterSpacing: "0.2em", textTransform: "uppercase", color: "#999", ...reveal(T, t0, { dur: 0.4 }, out) }}>
      <span style={{ width: 6, height: 26, borderRadius: 3, background: C.primary }} />
      {fr(head)}
    </div>
  ) : null;

  if (b.kind === "cta") {
    return <EndCard T={T} start={t0} headline={b.title ?? "Va chercher *tes dixièmes.*"} zone={zone} sub={b.sub ?? "Inscription gratuite"} button="Créer mon compte" />;
  }
  if (b.kind === "clip" || b.kind === "image") {
    const k = prog(T, t0, t1, E.ios);
    const media =
      b.kind === "clip" ? (
        <OffthreadVideo src={src(b.src)} muted style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      ) : (
        <Img src={src(b.src)} style={{ width: "100%", height: "100%", objectFit: "cover", transform: `scale(${1.04 + 0.06 * k})` }} />
      );
    return (
      <AbsoluteFill>
        <AbsoluteFill style={{ opacity: prog(T, t0, t0 + 0.25) * (1 - prog(T, t1 - 0.2, t1)) }}>{media}</AbsoluteFill>
        <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(10,10,10,0.55) 0%, rgba(10,10,10,0) 35%, rgba(10,10,10,0) 55%, rgba(10,10,10,0.85) 100%)" }} />
        <div style={{ position: "absolute", left: zone.x0, width: W, top: zone.y0 + 40 }}>
          {Head}
          {Title}
          {Sub}
        </div>
      </AbsoluteFill>
    );
  }
  if (b.kind === "split" && b.range && b.splitAt !== undefined) {
    return (
      <div style={{ position: "absolute", left: zone.x0, width: W, top: zone.y0 + 40 }}>
        {Head}
        {Title}
        <div style={{ marginTop: 40, ...reveal(T, t0, { dur: 0.35, blur: 10 }, out) }}>
          <CornerSplit T={T} t0={t0 + 0.15} width={W} range={b.range} splitAt={b.splitAt} cues={b.cues ?? [1.5, 4]} labels={b.labels ?? ["Freinage", "", "Sortie", ""]} />
        </div>
      </div>
    );
  }
  if (b.kind === "hook" && b.visual) {
    // accroche avec mouvement dès l'image 0 : visuel déjà là, léger zoom continu
    const z = 1 + 0.08 * prog(T, t0, t1, E.inOut);
    const inV = t0 === 0 ? { opacity: 1 - prog(T, out, t1) } : reveal(T, t0, { dur: 0.3, blur: 10 }, out);
    return (
      <div style={{ position: "absolute", left: zone.x0, width: W, top: zone.y0 + 20 }}>
        {Title}
        {Sub}
        <div style={{ marginTop: 40, display: "flex", justifyContent: "center", transform: `scale(${z})`, ...inV }}>
          <Visual id={b.visual} width={W} corner={b.corner} />
        </div>
      </div>
    );
  }
  return (
    <div style={{ position: "absolute", left: zone.x0, width: W, top: b.kind === "visual" ? zone.y0 + 60 : zone.y0 + 360 }}>
      {Head}
      {b.kind === "hero" && b.number ? (
        <div style={{ marginBottom: 24 }}>
          <DecodeNumber T={T} text={b.number} start={t0 + 0.1} size={300} color={TONE[b.tone ?? "green"]} seed={`n${t0}`} unit={b.unit} />
        </div>
      ) : null}
      {Title}
      {Sub}
      {b.kind === "visual" && b.visual ? (
        <div style={{ marginTop: 56, display: "flex", justifyContent: "center", ...reveal(T, t0 + 0.25, { dur: 0.7, blur: 18, y: 40 }, out) }}>
          <Visual id={b.visual} width={W} corner={b.corner} />
        </div>
      ) : null}
    </div>
  );
};

export const TReel: React.FC<TReelProps> = ({ beats, voice, voiceVolume = 1, music, musicVolume = 0.18, captions, label, safe = "reel" }) => {
  const T = useTime();
  const { fps } = useVideoConfig();
  let acc = 0;
  const spans = beats.map((b) => {
    const s = { b, t0: acc, t1: acc + b.dur };
    acc += b.dur;
    return s;
  });
  const cur = spans.find((s) => T >= s.t0 - 0.02 && T < s.t1 + 0.02);
  const cap = captions?.find((c) => T >= c.t0 && T < c.t1);
  return (
    <AbsoluteFill style={{ backgroundColor: C.bg }}>
      <SocialBackground width={1080} height={1920} preset="top" />
      {cur ? <Beat key={cur.t0} b={cur.b} t0={cur.t0} t1={cur.t1} T={T} label={cur === spans[0] ? undefined : label} safe={safe} /> : null}
      {spans.map((s) =>
        s.b.sfx ? (
          <AudioAt key={`sfx${s.t0}`} from={Math.round(s.t0 * fps)} srcPath={`sfx/${s.b.sfx}.mp3`} volume={0.35} />
        ) : null,
      )}
      {voice ? <Audio src={src(voice)} volume={voiceVolume} /> : null}
      {music ? <Audio src={src(music)} volume={musicVolume} /> : null}
      {cap ? (
        <div style={{ position: "absolute", left: 80, right: 140, top: 1560, display: "flex", justifyContent: "center" }}>
          <span style={{ background: alpha("#0A0A0A", 0.72), borderRadius: 14, padding: "12px 22px", fontFamily: FONT.display, fontWeight: 700, fontSize: 46, lineHeight: 1.15, color: C.text, textAlign: "center" }}>{fr(cap.text)}</span>
        </div>
      ) : null}
      <Footer y={1800} />
    </AbsoluteFill>
  );
};

const AudioAt: React.FC<{ from: number; srcPath: string; volume: number }> = ({ from, srcPath, volume }) => (
  <Sequence from={from} layout="none">
    <Audio src={staticFile(srcPath)} volume={volume} />
  </Sequence>
);
