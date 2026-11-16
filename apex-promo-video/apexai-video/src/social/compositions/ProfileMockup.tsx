import React from "react";
import { AbsoluteFill, Img, staticFile } from "remotion";
import { ChevronDown, Clapperboard, Copy, Grid3x3, Link2, Menu, Pin, PlusSquare, SquareUser } from "lucide-react";
import { C, FONT, INK, alpha } from "../kit/tokens";
import { fr } from "../kit/text";
import { HighlightCover } from "../templates/Singles";

/**
 * Maquette du profil (téléphone générique, interface neutre, sans logo de réseau social).
 * Échelle réelle d'un écran de 430 × 932 pt rendu à ×3 (1290 × 2796 px).
 */
const S = 3; // pt → px

type Tile = { src: string; kind: "post" | "reel" | "carousel"; pinned?: boolean };

const TILES: Tile[] = [
  { src: "social/renders/G1-couverture.png", kind: "reel", pinned: true },
  { src: "social/renders/G2-01.png", kind: "carousel", pinned: true },
  { src: "social/renders/G3-01.png", kind: "carousel", pinned: true },
  { src: "social/renders/G4-couverture.png", kind: "reel" },
  { src: "social/renders/G5-01.png", kind: "carousel" },
  { src: "social/renders/G6-01.png", kind: "carousel" },
  { src: "social/renders/G7-couverture.png", kind: "reel" },
  { src: "social/renders/G8-01.png", kind: "carousel" },
  { src: "social/renders/G9.png", kind: "post" },
];

const HIGHLIGHTS: Array<{ icon: "demo" | "tuto" | "conseils" | "offres" | "faq" | "histoire"; label: string }> = [
  { icon: "demo", label: "Démo" },
  { icon: "tuto", label: "Tuto" },
  { icon: "conseils", label: "Conseils" },
  { icon: "offres", label: "Offres" },
  { icon: "faq", label: "FAQ" },
  { icon: "histoire", label: "Histoire" },
];

const BIO = ["L'app tout-en-un du pilote de karting.", "Entretien, réglages, calendrier, analyse de sessions.", "Inscris-toi et essaie, c'est gratuit ↓"];

const t = (size: number, weight = 400, color: string = C.text): React.CSSProperties => ({
  fontFamily: FONT.body,
  fontSize: size * S,
  fontWeight: weight,
  color,
  lineHeight: 1.3,
});

export const ProfileMockup: React.FC = () => {
  const W = 430 * S;
  const pad = 16 * S;
  const tileW = (W - 2 * S) / 3;
  const tileH = tileW * (4 / 3);
  return (
    <AbsoluteFill style={{ backgroundColor: C.bgDeep, fontFamily: FONT.body, display: "block" }}>
      {/* Barre d'état */}
      <div style={{ height: 54 * S, display: "flex", alignItems: "center", justifyContent: "space-between", padding: `0 ${30 * S}px` }}>
        <span style={t(17, 600)}>9:41</span>
        <span style={{ width: 27 * S, height: 13 * S, borderRadius: 4 * S, border: `${1.5 * S}px solid ${alpha(C.text, 0.5)}`, padding: S }}>
          <span style={{ display: "block", width: "80%", height: "100%", borderRadius: 2 * S, background: C.text }} />
        </span>
      </div>
      {/* En-tête */}
      <div style={{ height: 44 * S, display: "flex", alignItems: "center", justifyContent: "space-between", padding: `0 ${pad}px` }}>
        <span style={{ display: "flex", alignItems: "center", gap: 4 * S, ...t(22, 700) }}>
          apexai.racing <ChevronDown size={18 * S} color={C.text} strokeWidth={2.4} />
        </span>
        <span style={{ display: "flex", gap: 22 * S }}>
          <PlusSquare size={26 * S} color={C.text} strokeWidth={1.8} />
          <Menu size={26 * S} color={C.text} strokeWidth={1.8} />
        </span>
      </div>
      {/* Avatar + compteurs */}
      <div style={{ display: "flex", alignItems: "center", padding: `${10 * S}px ${pad}px 0`, gap: 26 * S }}>
        <div style={{ width: 86 * S, height: 86 * S, borderRadius: "50%", overflow: "hidden", flex: "none" }}>
          <Img src={staticFile("social/renders/avatar-rouge-1080.png")} style={{ width: "100%", height: "100%" }} />
        </div>
        <div style={{ flex: 1, display: "flex", justifyContent: "space-around" }}>
          {[
            ["9", "publications"],
            ["—", "abonnés"],
            ["—", "suivi(e)s"],
          ].map(([n, l]) => (
            <div key={l} style={{ textAlign: "center" }}>
              <div style={t(17, 700)}>{n}</div>
              <div style={t(14, 400)}>{l}</div>
            </div>
          ))}
        </div>
      </div>
      {/* Nom, catégorie, bio, lien */}
      <div style={{ padding: `${12 * S}px ${pad}px 0` }}>
        <div style={t(14.5, 700)}>ApexAI | App pilote de karting</div>
        <div style={t(14, 400, INK.muted)}>Logiciel</div>
        {BIO.map((l) => (
          <div key={l} style={t(14.5, 400)}>
            {fr(l)}
          </div>
        ))}
        <div style={{ display: "flex", alignItems: "center", gap: 5 * S, marginTop: 2 * S, ...t(14.5, 600, C.blueLight) }}>
          <Link2 size={15 * S} color={C.blueLight} strokeWidth={2.2} /> apexai.racing/login et 2 autres
        </div>
      </div>
      {/* Boutons */}
      <div style={{ display: "flex", gap: 6 * S, padding: `${14 * S}px ${pad}px 0` }}>
        {["Suivre", "Message"].map((b, i) => (
          <div key={b} style={{ flex: 1, height: 34 * S, borderRadius: 9 * S, background: i === 0 ? C.blue : alpha(C.text, 0.12), display: "flex", alignItems: "center", justifyContent: "center", ...t(14.5, 600) }}>
            {b}
          </div>
        ))}
      </div>
      {/* À la une */}
      <div style={{ display: "flex", gap: 14 * S, padding: `${16 * S}px ${pad}px 0`, overflow: "hidden", flexShrink: 0 }}>
        {HIGHLIGHTS.map((h) => (
          <div key={h.label} style={{ flex: "none", width: 72 * S, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 * S }}>
            <div style={{ width: 66 * S, height: 66 * S, borderRadius: "50%", border: `${1.5 * S}px solid ${alpha(C.text, 0.25)}`, padding: 3 * S, boxSizing: "border-box" }}>
              <div style={{ width: "100%", height: "100%", borderRadius: "50%", overflow: "hidden", position: "relative" }}>
                <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 1080, transform: `scale(${(60 * S) / 1080})`, transformOrigin: "0 0" }}>
                  <HighlightCover icon={h.icon} height={1080} />
                </div>
              </div>
            </div>
            <div style={t(12.5, 400)}>{h.label}</div>
          </div>
        ))}
      </div>
      {/* Onglets */}
      <div style={{ display: "flex", marginTop: 14 * S, borderBottom: `${0.5 * S}px solid ${alpha(C.text, 0.15)}` }}>
        {[Grid3x3, Clapperboard, SquareUser].map((I, i) => (
          <div key={i} style={{ flex: 1, height: 44 * S, display: "flex", alignItems: "center", justifyContent: "center", borderBottom: i === 0 ? `${1.5 * S}px solid ${C.text}` : undefined }}>
            <I size={24 * S} color={i === 0 ? C.text : INK.muted} strokeWidth={1.8} />
          </div>
        ))}
      </div>
      {/* Grille 3 × 3 en 3:4 */}
      <div style={{ display: "grid", gridTemplateColumns: `repeat(3, ${tileW}px)`, gap: S, marginTop: S }}>
        {TILES.map((tile, i) => (
          <div key={i} style={{ position: "relative", width: tileW, height: tileH, overflow: "hidden", background: C.card }}>
            <Img src={staticFile(tile.src)} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center" }} />
            <div style={{ position: "absolute", top: 8 * S, right: 8 * S, display: "flex", gap: 6 * S, filter: `drop-shadow(0 0 ${2 * S}px ${alpha(C.bgDeep, 0.8)})` }}>
              {tile.pinned ? <Pin size={17 * S} color={C.text} fill={C.text} strokeWidth={1.6} /> : null}
              {tile.kind === "reel" ? <Clapperboard size={17 * S} color={C.text} strokeWidth={2} /> : null}
              {tile.kind === "carousel" ? <Copy size={17 * S} color={C.text} strokeWidth={2} /> : null}
            </div>
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
};
