/**
 * Réglages globaux de la vidéo ApexAI.
 * Toutes les durées du projet sont écrites en secondes et converties avec s().
 * Passer FPS à 30 suffit pour accélérer un rendu.
 */
export const FPS = 60;
export const BPM = 120;

export const FLAGS = {
  /** Photo aérienne du circuit en ouverture de S02 — désactivée pour ce premier film (choix de Yanis). */
  useCircuitPhoto: false,
  /** Affiche timecode, scène, grille de temps et zones sûres. */
  debugGrid: false,
  /** Monte public/audio/music.mp3 (à déposer d'abord dans public/audio/). */
  withAudio: false,
  /** Instant du drop dans la piste musicale − 10,0 s (le drop du 16:9 tombe à 10,00 s, celui du 9:16 à 6,00 s). */
  musicOffsetSec: 0,
  /** Joue les effets de src/audio/cues.json dont le fichier public/sfx/<file>.mp3 a été déposé. */
  withSfx: false,
  /** Liste des effets réellement déposés dans public/sfx/ (sans extension). Vide = aucun. */
  sfxAvailable: [] as string[],
};

export const s = (sec: number, fps: number = FPS) => Math.round(sec * fps);
export const beat = (n: number, fps: number = FPS) => s((n * 60) / BPM, fps);
