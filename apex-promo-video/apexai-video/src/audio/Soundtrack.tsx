import React from "react";
import { Sequence, interpolate, staticFile, useVideoConfig } from "remotion";
import { Audio } from "@remotion/media";
import { FLAGS, s } from "../config";
import { Cue } from "./cues";

/**
 * Bande son optionnelle (désactivée par défaut, la vidéo est livrée muette).
 * - Musique : public/audio/music.mp3, calée pour que son drop tombe sur `dropAt`.
 * - Effets : public/sfx/<file>.mp3 pour chaque repère, si le fichier est listé dans FLAGS.sfxAvailable.
 */
export const Soundtrack: React.FC<{ cues: Cue[]; dropAt: number; fadeOut: [number, number] }> = ({ cues, dropAt, fadeOut }) => {
  const { fps, durationInFrames } = useVideoConfig();
  if (!FLAGS.withAudio && !FLAGS.withSfx) return null;

  // Instant du drop dans la piste = musicOffsetSec + 10 (convention du prompt, établie sur le 16:9).
  const dropInTrack = FLAGS.musicOffsetSec + 10;
  const shift = dropInTrack - dropAt; // > 0 : on coupe le début de la piste ; < 0 : on retarde son départ.
  const [f0, f1] = fadeOut;

  return (
    <>
      {FLAGS.withAudio ? (
        <Sequence from={shift < 0 ? s(-shift, fps) : 0} name="Musique">
          <Audio
            src={staticFile("audio/music.mp3")}
            trimBefore={shift > 0 ? s(shift, fps) : undefined}
            volume={(f) => {
              const t = f / fps + Math.max(0, -shift);
              return interpolate(t, [f0, f1], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
            }}
          />
        </Sequence>
      ) : null}
      {FLAGS.withSfx
        ? cues
            .filter((c) => c.file && FLAGS.sfxAvailable.includes(c.file) && s(c.t, fps) < durationInFrames)
            .map((c, i) => (
              <Sequence key={`${c.file}-${i}`} from={s(c.t, fps)} name={`SFX ${c.name}`}>
                <Audio src={staticFile(`sfx/${c.file}.mp3`)} volume={0.9} />
              </Sequence>
            ))
        : null}
    </>
  );
};
