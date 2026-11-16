import React from "react";
import { AbsoluteFill, Freeze, Img, staticFile, useCurrentFrame } from "remotion";
import { Check, X } from "lucide-react";
import { C, FONT, GRAD, INK, alpha } from "../kit/tokens";
import { Body, Label, Rich, Title, fr } from "../kit/text";
import { CtaButton, DemoTag, HeroNumber, Lockup, SectorBar } from "../kit/elements";
import { SocialBackground } from "../kit/Background";
import { SpeedTrace } from "../kit/SpeedTrace";
import { Visual } from "../visuals";
import { LogoIcon } from "../../components/Logo";
import { TChiffreHeros, TConseil, TCouverture, TOffre } from "../templates/Wrappers";
import { Declaration, ReelCover, Story } from "../templates/Singles";
import { Carousel } from "../templates/Carousel";

/**
 * Charte réseaux sociaux ApexAI : 10 pages en 1920 × 1080 (une page par image).
 * Les pages servent aussi de planches (brand/boards/*.png).
 */
const PW = 1920;
const PH = 1080;

export const CHARTE_PAGES = ["couverture", "concept", "logo", "couleurs", "typographie", "signatures", "formats", "gabarits", "motion-son", "ton-verite"] as const;

const Frame: React.FC<{ n: number; title: string; desc: string; children: React.ReactNode; light?: boolean }> = ({ n, title, desc, children }) => (
  <AbsoluteFill>
    <SocialBackground width={PW} height={PH} preset="calm" intensity={0.7} vignette={0.4} />
    <div style={{ position: "absolute", left: 96, top: 96, width: 470 }}>
      <div style={{ fontFamily: FONT.display, fontWeight: 700, fontSize: 30, color: C.primary, letterSpacing: "0.04em" }}>{String(n).padStart(2, "0")}</div>
      <Title text={title} size={66} style={{ marginTop: 18 }} lineHeight={1.02} />
      <Body text={desc} size={25} style={{ marginTop: 26 }} />
    </div>
    <div style={{ position: "absolute", left: 640, top: 96, width: 1184, height: 860 }}>{children}</div>
    <div style={{ position: "absolute", left: 96, right: 96, bottom: 48, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <Lockup height={30} />
      <span style={{ fontFamily: FONT.body, fontWeight: 500, fontSize: 18, color: INK.muted }}>{fr("Charte réseaux sociaux · v1 · octobre 2026")}</span>
    </div>
  </AbsoluteFill>
);

const Panel: React.FC<{ children: React.ReactNode; style?: React.CSSProperties; light?: boolean }> = ({ children, style, light }) => (
  <div
    style={{
      borderRadius: 24,
      background: light ? C.text : alpha(C.card, 0.9),
      border: `2px solid ${light ? alpha(C.bg, 0.08) : C.border}`,
      overflow: "hidden",
      position: "relative",
      ...style,
    }}
  >
    {children}
  </div>
);

const Cap: React.FC<{ text: string; light?: boolean; style?: React.CSSProperties }> = ({ text, light, style }) => (
  <div style={{ fontFamily: FONT.body, fontWeight: 600, fontSize: 17, letterSpacing: "0.14em", textTransform: "uppercase", color: light ? alpha(C.bg, 0.55) : INK.muted, ...style }}>{fr(text)}</div>
);

/* ── pages ── */

const PCover: React.FC = () => (
  <AbsoluteFill>
    <SocialBackground width={PW} height={PH} preset="default" intensity={0.9} />
    <SpeedTrace id="charte-cover" canvasWidth={PW} canvasHeight={PH} x0={-30} width={PW + 60} yTop={735} height={200} stroke={6} markerSize={34} />
    <div style={{ position: "absolute", left: 120, top: 110 }}>
      <Lockup height={110} />
      <Title text={"Charte\n*réseaux sociaux*"} size={120} style={{ marginTop: 56 }} lineHeight={0.98} />
      <Body text="Le stand d'ingénieur, en poche." size={38} style={{ marginTop: 30 }} />
    </div>
    <div style={{ position: "absolute", left: 120, bottom: 64, fontFamily: FONT.body, fontWeight: 500, fontSize: 20, color: INK.muted }}>{fr("v1 · octobre 2026 · Instagram d'abord, puis TikTok, YouTube Shorts et LinkedIn")}</div>
  </AbsoluteFill>
);

const PConcept: React.FC = () => (
  <Frame n={2} title={"Concept et\n*positionnement*"} desc="Le profil ressemble à l'écran d'un ingénieur de course : nuit noire, data lumineuse, une seule couleur d'énergie.">
    <Panel style={{ padding: 44 }}>
      <Cap text="Positionnement" />
      <div style={{ fontFamily: FONT.display, fontWeight: 600, fontSize: 38, lineHeight: 1.25, color: C.text, marginTop: 16 }}>
        <Rich text="Pour les pilotes qui roulent avec un MyChron, ApexAI est *l'ingénieur de course IA* qui lit ta télémétrie à ta place et te dit, virage par virage, où tu perds du temps et quoi changer." />
      </div>
    </Panel>
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 22, marginTop: 22 }}>
      {[
        ["Cible cœur", "Pilotes amateurs licenciés, propre kart et MyChron, quelques courses par saison."],
        ["Relais", "Parents de jeunes pilotes, coachs, préparateurs, clubs et circuits."],
        ["Exclue", "Karting de location et de loisir : pas d'indoor, pas de « sortie entre potes »."],
      ].map(([h, t]) => (
        <Panel key={h} style={{ padding: 30, height: 230 }}>
          <Cap text={h} />
          <Body text={t} size={25} style={{ marginTop: 14 }} />
        </Panel>
      ))}
    </div>
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 22, marginTop: 22 }}>
      <Panel style={{ padding: 30, height: 250 }}>
        <Cap text="La promesse" />
        <Title text={"Tout ton karting.\n*Une seule app.*"} size={40} style={{ marginTop: 16 }} />
      </Panel>
      <Panel style={{ padding: 30, height: 250 }}>
        <Cap text="Objectifs, dans l'ordre" />
        <Body text={"1. Crédibilité pour les premières ventes\n2. Inscriptions gratuites depuis Instagram\n3. Passages à Racer : l'app complète"} size={25} style={{ marginTop: 14 }} />
      </Panel>
    </div>
  </Frame>
);

const Dont: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <Panel style={{ padding: 18, height: 196, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
    <div style={{ height: 120, display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
      {children}
      <div style={{ position: "absolute", right: 0, top: 0, width: 36, height: 36, borderRadius: 18, background: alpha(C.primary, 0.15), display: "flex", alignItems: "center", justifyContent: "center" }}>
        <X size={22} color={C.primary} strokeWidth={3} />
      </div>
    </div>
    <div style={{ fontFamily: FONT.body, fontWeight: 600, fontSize: 18, color: INK.soft }}>{fr(label)}</div>
  </Panel>
);

const PLogo: React.FC = () => (
  <Frame n={3} title={"Logo\n*conservé*"} desc="Le symbole (éclair plein dans un carré arrondi) et le logotype APEXAI ne se redessinent pas : on les décline.">
    <div style={{ display: "grid", gridTemplateColumns: "1.35fr 1fr", gap: 22 }}>
      <Panel style={{ height: 300, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Lockup height={112} />
        <Cap text="Horizontal · fond sombre" style={{ position: "absolute", left: 24, top: 20 }} />
      </Panel>
      <Panel light style={{ height: 300, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Lockup height={80} variant="h-light" />
        <Cap text="Horizontal · fond clair" light style={{ position: "absolute", left: 24, top: 20 }} />
      </Panel>
    </div>
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 22, marginTop: 22 }}>
      <Panel style={{ height: 250, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Img src={staticFile("social/logo/apexai-lockup-v-dark.svg")} style={{ height: 150 }} />
        <Cap text="Vertical" style={{ position: "absolute", left: 20, top: 16 }} />
      </Panel>
      <Panel style={{ height: 250, display: "flex", alignItems: "center", justifyContent: "center" }}>
        {/* zone de protection : 0,25 × le côté de l'icône */}
        <div style={{ position: "relative", width: 100, height: 100 }}>
          <div style={{ position: "absolute", inset: -25, border: `2px dashed ${alpha(C.text, 0.45)}` }} />
          <LogoIcon size={100} glow={0} />
        </div>
        <Cap text="Protection : ¼ du côté" style={{ position: "absolute", left: 20, top: 16, fontSize: 15 }} />
      </Panel>
      <Panel style={{ height: 250, display: "flex", alignItems: "center", justifyContent: "center", gap: 26 }}>
        <LogoIcon size={24} glow={0} />
        <Lockup height={22} />
        <Cap text="Minimum : 24 · 120 px" style={{ position: "absolute", left: 20, top: 16, fontSize: 15 }} />
      </Panel>
      <Panel style={{ height: 250, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Img src={staticFile("social/logo/apexai-mono-white.svg")} style={{ height: 52 }} />
        <Cap text="Une couleur" style={{ position: "absolute", left: 20, top: 16 }} />
      </Panel>
    </div>
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 22, marginTop: 22 }}>
      <Dont label="Étiré ou déformé">
        <div style={{ transform: "scaleX(1.4) scaleY(0.8)" }}>
          <Lockup height={32} />
        </div>
      </Dont>
      <Dont label="Recoloré">
        <div style={{ filter: "hue-rotate(160deg)" }}>
          <Lockup height={46} />
        </div>
      </Dont>
      <Dont label="« APEX AI » avec une espace">
        <span style={{ fontFamily: FONT.display, fontWeight: 700, fontSize: 52, color: C.text }}>
          APEX <span style={{ color: C.primary }}>AI</span>
        </span>
      </Dont>
      <Dont label="Éclair d'interface à la place du symbole">
        <div style={{ width: 70, height: 70, borderRadius: 14, background: GRAD.primary, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width={36} height={36} viewBox="0 0 24 24" fill="none" stroke={C.text} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z" />
          </svg>
        </div>
      </Dont>
    </div>
  </Frame>
);

const Swatch: React.FC<{ bg: string; name: string; hex: string; light?: boolean; w?: number }> = ({ bg, name, hex, light, w }) => (
  <div style={{ width: w, borderRadius: 18, overflow: "hidden", border: `2px solid ${C.border}` }}>
    <div style={{ height: 130, background: bg }} />
    <div style={{ padding: "12px 16px", background: alpha(C.card, 0.95) }}>
      <div style={{ fontFamily: FONT.body, fontWeight: 600, fontSize: 19, color: C.text }}>{fr(name)}</div>
      <div style={{ fontFamily: FONT.body, fontWeight: 500, fontSize: 16, color: light ? INK.soft : INK.muted }}>{hex}</div>
    </div>
  </div>
);

const PCouleurs: React.FC = () => (
  <Frame n={4} title={"Couleurs"} desc="Uniquement les valeurs du site (tokens.json). Le rouge est la seule couleur d'énergie ; les couleurs de data ont un sens.">
    <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 18 }}>
      <Swatch bg={C.bg} name="Fond" hex="#0A0A0A" />
      <Swatch bg={C.card} name="Carte" hex="#121212" />
      <Swatch bg={C.cardInner} name="Carte intérieure" hex="#181818" />
      <Swatch bg={C.border} name="Bordure" hex="#262626" />
      <Swatch bg={C.text} name="Texte" hex="#FAFAFA" />
    </div>
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, marginTop: 18 }}>
      <Swatch bg={GRAD.primary} name="Dégradé principal (boutons, symbole, aplat)" hex="#FF4242 → #E60000 · 135°" />
      <Swatch bg={GRAD.keyword} name="Dégradé des mots-clés" hex="#FF4242 → #FF9933 · 135°" />
    </div>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 18, marginTop: 18 }}>
      <Swatch bg={C.success} name="Gain" hex="#22C55E" />
      <Swatch bg={C.primary} name="Perte" hex="#FF4242" />
      <Swatch bg={C.gold} name="Tour IA" hex="#FACC15" />
      <Swatch bg={C.blue} name="Comparaison" hex="#3B82F6" />
    </div>
    <Panel style={{ padding: 24, marginTop: 18 }}>
      <Cap text="Répartition à l'échelle du profil" />
      <div style={{ display: "flex", height: 34, borderRadius: 10, overflow: "hidden", marginTop: 14 }}>
        <div style={{ flex: 60, background: C.bgDeep, border: `2px solid ${C.border}` }} />
        <div style={{ flex: 25, background: C.cardInner }} />
        <div style={{ flex: 10, background: GRAD.keyword }} />
        <div style={{ flex: 5, background: `linear-gradient(90deg, ${C.success}, ${C.gold}, ${C.blue})` }} />
      </div>
      <Body text="60 % noir · 25 % surfaces · 10 % rouge et orange · 5 % data. L'aplat rouge est réservé aux posts « déclaration » : deux tuiles rouges ne se touchent jamais par un côté." size={21} style={{ marginTop: 12 }} />
    </Panel>
  </Frame>
);

const PTypo: React.FC = () => (
  <Frame n={5} title={"Typographie"} desc="Space Grotesk pour les titres, les chiffres et le logo. Inter pour le texte et les labels. Chiffres animés en tabular-nums.">
    <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 22 }}>
      <Panel style={{ padding: 34, height: 420 }}>
        <Cap text="Space Grotesk 700 · titres et chiffres" />
        <div style={{ fontFamily: FONT.display, fontWeight: 700, fontSize: 84, lineHeight: 1, letterSpacing: "-0.035em", color: C.text, marginTop: 20 }}>
          <Rich text={"Où perds-tu\ntes *dixièmes* ?"} />
        </div>
        <HeroNumber value="−1,23" unit="s" size={96} tone="gain" style={{ marginTop: 24 }} />
      </Panel>
      <Panel style={{ padding: 34, height: 420 }}>
        <Cap text="Inter 500 / 600 · texte et labels" />
        <div style={{ fontFamily: FONT.body, fontWeight: 500, fontSize: 34, lineHeight: 1.32, color: INK.body, marginTop: 20 }}>{fr("Chaque conseil dit où, combien et quoi changer, virage par virage.")}</div>
        <Label text="Mythe ou data ?" size={22} style={{ marginTop: 30 }} />
        <DemoTag size={15} style={{ marginTop: 18 }} />
      </Panel>
    </div>
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 22, marginTop: 22 }}>
      <Panel style={{ padding: 28 }}>
        <Cap text="Échelle (visuel de 1080 px)" />
        {[
          ["Chiffre héros", "220–360 px · −0,045 em"],
          ["Titre de couverture", "104–140 px · −0,035 em"],
          ["Titre de slide", "64–96 px · −0,025 em"],
          ["Texte", "32–44 px · interligne 1,3"],
          ["Label", "22–26 px · capitales · +0,2 em"],
        ].map(([a, b]) => (
          <div key={a} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: `1px solid ${C.border}`, fontFamily: FONT.body, fontSize: 21 }}>
            <span style={{ color: C.text, fontWeight: 600 }}>{fr(a)}</span>
            <span style={{ color: INK.soft }}>{fr(b)}</span>
          </div>
        ))}
      </Panel>
      <Panel style={{ padding: 28 }}>
        <Cap text="Typographie française" />
        <Body
          text={"• Espace fine insécable avant ? ! : ;\n• Virgule décimale dans les titres (−1,23 s), format de l'app dans l'interface (−1.23s)\n• « 1re », jamais « 1ère »\n• Tutoiement partout, sauf textes d'interface recréés\n• Mot-clé en dégradé, 6 mots max en couverture"}
          size={21}
          style={{ marginTop: 14 }}
        />
      </Panel>
    </div>
  </Frame>
);

const PSignatures: React.FC = () => {
  const tiles: Array<[string, React.ReactNode]> = [
    ["La trace", <div key="t" style={{ position: "relative", width: 360, height: 170 }}><SpeedTrace id="sig-t" canvasWidth={360} canvasHeight={170} x0={0} width={360} yTop={30} height={110} stroke={3} markerSize={18} /></div>],
    ["Le chiffre héros", <HeroNumber key="h" value="+0,51" unit="s" size={110} tone="loss" />],
    ["La carte flottante", <div key="c" style={{ transform: "scale(0.62)" }}><Visual id="score" width={520} /></div>],
    ["L'atmosphère", <div key="a" style={{ width: 360, height: 170, borderRadius: 14, overflow: "hidden", position: "relative" }}><SocialBackground width={360} height={170} preset="default" scale={0.4} /></div>],
    [
      "Les repères de construction",
      <div key="r" style={{ position: "relative", padding: 18, border: `2px dashed ${alpha(C.text, 0.4)}` }}>
        {[[-7, -7], [-7, null], [null, -7], [null, null]].map((p, i) => (
          <span key={i} style={{ position: "absolute", width: 12, height: 12, background: alpha(C.text, 0.7), left: p[0] ?? undefined, top: p[1] ?? undefined, right: p[0] === null ? -7 : undefined, bottom: p[1] === null ? -7 : undefined }} />
        ))}
        <span style={{ fontFamily: FONT.display, fontWeight: 700, fontSize: 42, color: C.text }}>Jamais pourquoi.</span>
      </div>,
    ],
    ["La barre de secteurs", <SectorBar key="s" statuses={["best", "ok", "best", "slow", "ok", "best", "gold", "slow"]} width={340} height={26} labels />],
  ];
  return (
    <Frame n={6} title={"Signatures\n*graphiques*"} desc="Ce qui rend un post ApexAI reconnaissable, même sans le logo. Un seul héros par visuel.">
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 22 }}>
        {tiles.map(([name, node]) => (
          <Panel key={name} style={{ height: 410, display: "flex", flexDirection: "column" }}>
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>{node}</div>
            <div style={{ padding: "16px 22px", borderTop: `1px solid ${C.border}`, fontFamily: FONT.display, fontWeight: 700, fontSize: 24, color: C.text }}>{fr(name)}</div>
          </Panel>
        ))}
      </div>
    </Frame>
  );
};

const Zone: React.FC<{ w: number; h: number; label: string; sub: string; safe: { x0: number; y0: number; x1: number; y1: number }; full: { w: number; h: number }; crop?: { x0: number; y0: number; x1: number; y1: number }; round?: boolean }> = ({
  w,
  h,
  label,
  sub,
  safe,
  full,
  crop,
  round,
}) => {
  const k = w / full.w;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
      <div style={{ position: "relative", width: w, height: h, borderRadius: round ? "50%" : 10, background: C.cardInner, border: `2px solid ${C.borderStrong}`, overflow: "hidden" }}>
        {crop ? <div style={{ position: "absolute", left: crop.x0 * k, top: crop.y0 * k, width: (crop.x1 - crop.x0) * k, height: (crop.y1 - crop.y0) * k, border: `2px dashed ${C.gold}` }} /> : null}
        <div style={{ position: "absolute", left: safe.x0 * k, top: safe.y0 * k, width: (safe.x1 - safe.x0) * k, height: (safe.y1 - safe.y0) * k, background: alpha(C.success, 0.14), border: `2px solid ${alpha(C.success, 0.6)}` }} />
      </div>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontFamily: FONT.display, fontWeight: 700, fontSize: 22, color: C.text }}>{fr(label)}</div>
        <div style={{ fontFamily: FONT.body, fontWeight: 500, fontSize: 16, color: INK.muted, marginTop: 4, whiteSpace: "pre-line" }}>{fr(sub)}</div>
      </div>
    </div>
  );
};

const PFormats: React.FC = () => (
  <Frame n={7} title={"Formats et\n*zones sûres*"} desc="Vert : zone sûre (texte et éléments clés). Pointillés or : ce que montre la grille du profil (3:4).">
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", height: 560 }}>
      <Zone w={240} h={300} full={{ w: 1080, h: 1350 }} label="Post 4:5" sub={"1080 × 1350\nmarges 72 px"} safe={{ x0: 72, y0: 72, x1: 1008, y1: 1290 }} crop={{ x0: 34, y0: 0, x1: 1046, y1: 1350 }} />
      <Zone w={230} h={409} full={{ w: 1080, h: 1920 }} label="Reel" sub={"1080 × 1920\ny 260 → 1480"} safe={{ x0: 80, y0: 260, x1: 940, y1: 1480 }} crop={{ x0: 0, y0: 240, x1: 1080, y1: 1680 }} />
      <Zone w={230} h={409} full={{ w: 1080, h: 1920 }} label="Story" sub={"1080 × 1920\ny 250 → 1670"} safe={{ x0: 64, y0: 250, x1: 1016, y1: 1670 }} />
      <Zone w={230} h={409} full={{ w: 1080, h: 1920 }} label="Reel publicitaire" sub={"14 % haut · 35 % bas\n6 % côtés libres"} safe={{ x0: 65, y0: 270, x1: 1015, y1: 1248 }} />
      <Zone w={200} h={200} full={{ w: 1080, h: 1080 }} label="Photo de profil" sub={"1080 × 1080\nlisible à 40 px"} safe={{ x0: 160, y0: 160, x1: 920, y1: 920 }} round />
    </div>
    <Panel style={{ padding: 26, marginTop: 40 }}>
      <Body
        text={"Posts en 4:5 (éligibles à la pub) · Couverture de reel : titre dans x 80 → 1000, y 300 → 1600 · Stories : zones de stickers réservées (sondage, questions, lien) · Pas de trait isolé de 1 px, grain de 3 à 4 % contre les bandes dans les dégradés."}
        size={21}
      />
    </Panel>
  </Frame>
);

const Mini: React.FC<{ w: number; h: number; scale: number; name: string; children: React.ReactNode }> = ({ w, h, scale, name, children }) => (
  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
    <div style={{ width: w * scale, height: h * scale, borderRadius: 10, overflow: "hidden", border: `2px solid ${C.border}`, position: "relative" }}>
      <div style={{ width: w, height: h, transform: `scale(${scale})`, transformOrigin: "0 0", position: "absolute", left: 0, top: 0 }}>
        <Freeze frame={0}>{children}</Freeze>
      </div>
    </div>
    <div style={{ fontFamily: FONT.display, fontWeight: 700, fontSize: 19, color: C.text }}>{name}</div>
  </div>
);

const PGabarits: React.FC = () => {
  const s = 0.205;
  return (
    <Frame n={8} title={"Gabarits"} desc="Huit gabarits éditables dans Remotion Studio : textes et chiffres dans le panneau de droite, puis « Render ». Pas besoin de Canva.">
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", rowGap: 28, columnGap: 10, justifyItems: "center" }}>
        <Mini w={1080} h={1350} scale={s} name="T-Couverture">
          <TCouverture label="Rubrique" title={"Ton titre,\n*mot-clé*."} sub="Sous-titre." visual="score" />
        </Mini>
        <Mini w={1080} h={1350} scale={s} name="T-Carrousel">
          <Carousel label="Rubrique" rail slides={[{ kind: "step", number: "01", title: "Une idée *par slide*.", body: "30 mots maximum.", visual: "file", visualWidth: 520 }]} />
        </Mini>
        <Mini w={1080} h={1350} scale={s} name="T-ChiffreHeros">
          <TChiffreHeros label="La data ne ment pas" number="−1,23" unit="s" tone="gain" title="à aller chercher." />
        </Mini>
        <Mini w={1080} h={1350} scale={s} name="T-Declaration">
          <Declaration label="Pourquoi ApexAI" title={"Planning.\nRéglages.\nEntretien.\n*Une seule app.*"} titleSize={100} lines={["Ligne en 48 px minimum."]} construction />
        </Mini>
        <Mini w={1080} h={1350} scale={s} name="T-Conseil">
          <TConseil label="Virage décrypté" corner={10} gain="0,27" title="par tour, au virage 10." body="Relâche les freins plus progressivement." demo />
        </Mini>
        <Mini w={1080} h={1350} scale={s} name="T-Offre">
          <TOffre label="Offres" plan="*Racer*" title="Pour gérer ta compétitivité." price="9,90 €" period="/mois" bullets={["Analyses illimitées", "Score par virage"]} />
        </Mini>
        <Mini w={1080} h={1920} scale={s * 0.7} name="T-Story">
          <Story label="Story" title={"Ta question\n*en grand* ?"} sticker="sondage" guide />
        </Mini>
        <Mini w={1080} h={1920} scale={s * 0.7} name="T-CouvertureReel">
          <ReelCover label="Rubrique" title={"Titre du reel\nen *6 mots*."} visual="trace-gold" visualWidth={760} />
        </Mini>
      </div>
    </Frame>
  );
};

const PMotion: React.FC = () => (
  <Frame n={9} title={"Motion\n*et son*"} desc="Le vocabulaire du film, appliqué aux reels et aux stories. Fluide, aérien, précis, premium.">
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 22 }}>
      <Panel style={{ padding: 30, height: 430 }}>
        <Cap text="Mouvement" />
        <Body
          text={"• L'image 0 montre déjà l'accroche, lisible\n• Une idée toutes les 0,8 à 1,5 s\n• Fin qui se raccorde au début (boucle)\n• Caméra jamais figée, transitions qui se chevauchent\n• BlurIn, DecodeText, GradientSweep, Dive, Whip, LightSweep, ScanLine\n• Courbe par défaut : outExpo (0.16, 1, 0.3, 1)"}
          size={23}
          style={{ marginTop: 14 }}
        />
      </Panel>
      <Panel style={{ padding: 30, height: 430 }}>
        <Cap text="Son" />
        <Body
          text={"• Peu de sons, espacés d'au moins 0,9 s : souffles sur les transitions, impacts feutrés sur les chiffres clés\n• Nappe douce en accord, sans pulsation\n• Signature sonore sur chaque apparition du logo\n• 38 effets synthétisés, 100 % libres de droits\n• −16 LUFS intégrés, crête ≤ −1 dBTP\n• Jamais de « ding » criard ni de son de jeu vidéo"}
          size={23}
          style={{ marginTop: 14 }}
        />
      </Panel>
    </div>
    <Panel style={{ padding: 26, marginTop: 22, height: 330, display: "flex", alignItems: "center", gap: 40 }}>
      <div style={{ position: "relative", width: 700, height: 240 }}>
        <SpeedTrace id="sig-m" canvasWidth={700} canvasHeight={240} x0={0} width={700} yTop={40} height={160} stroke={4} markers={false} />
      </div>
      <div>
        <Cap text="Signature sonore" />
        <Body text={"Impact grave, scintillement en quinte, crépitement de l'éclair. 1,6 s."} size={23} style={{ marginTop: 12, maxWidth: 360 }} />
      </div>
    </Panel>
  </Frame>
);

const PTon: React.FC = () => (
  <Frame n={10} title={"Ton et\n*véracité*"} desc="Un ingénieur de course qui parle comme au paddock. Chaque chiffre publié est vrai, sourcé et étiqueté.">
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 22 }}>
      <Panel style={{ padding: 28, height: 400 }}>
        <Cap text="À faire" />
        {[
          "« Virage 10 : 2,9 km/h à reprendre à l'apex. »",
          "Tutoiement, phrases courtes, verbes d'action",
          "Jargon expliqué en 4 mots (« freinage dégressif »)",
          "« Session de démo · Adria Karting Raceway » sur chaque chiffre",
          "Un seul appel à l'action par post",
        ].map((t) => (
          <div key={t} style={{ display: "flex", gap: 14, marginTop: 16, alignItems: "flex-start" }}>
            <Check size={26} color={C.success} strokeWidth={3} style={{ flex: "none", marginTop: 2 }} />
            <span style={{ fontFamily: FONT.body, fontWeight: 500, fontSize: 22, color: INK.body, lineHeight: 1.3 }}>{fr(t)}</span>
          </div>
        ))}
      </Panel>
      <Panel style={{ padding: 28, height: 400 }}>
        <Cap text="À ne jamais faire" />
        {[
          "Inventer un chiffre, un témoignage, un nombre d'utilisateurs",
          "Promettre un gain (« gagne 1 s »), « le meilleur », « la première »",
          "Logos tiers, marques F1 et FIA, noms de pilotes ou d'écuries",
          "Annoncer AiM au sens large ou RaceBox sans validation",
          "Drapeau à damier, flammes, fumée, italique « racing »",
        ].map((t) => (
          <div key={t} style={{ display: "flex", gap: 14, marginTop: 16, alignItems: "flex-start" }}>
            <X size={26} color={C.primary} strokeWidth={3} style={{ flex: "none", marginTop: 2 }} />
            <span style={{ fontFamily: FONT.body, fontWeight: 500, fontSize: 22, color: INK.body, lineHeight: 1.3 }}>{fr(t)}</span>
          </div>
        ))}
      </Panel>
    </div>
    <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: 22, marginTop: 22 }}>
      <Panel style={{ padding: 28, height: 300 }}>
        <Cap text="Hashtags (5 au maximum, 3 à 5 en rotation)" />
        <Body text="#karting #kartingfrance #kartinglife #kartracing #mychron #telemetrie #motorsport #racingdata + #apexairacing. Jamais #reels, #explore ni #fyp." size={22} style={{ marginTop: 14 }} />
      </Panel>
      <Panel style={{ padding: 28, height: 300, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
        <Cap text="Appel à l'action type" />
        <CtaButton text="Créer mon compte" height={84} fontSize={30} />
        <Body text="Inscription gratuite · lien en bio" size={20} tone="muted" />
      </Panel>
    </div>
  </Frame>
);

const PAGES: Record<(typeof CHARTE_PAGES)[number], React.FC> = {
  couverture: PCover,
  concept: PConcept,
  logo: PLogo,
  couleurs: PCouleurs,
  typographie: PTypo,
  signatures: PSignatures,
  formats: PFormats,
  gabarits: PGabarits,
  "motion-son": PMotion,
  "ton-verite": PTon,
};

export const Charte: React.FC = () => {
  const frame = useCurrentFrame();
  const Page = PAGES[CHARTE_PAGES[Math.min(CHARTE_PAGES.length - 1, frame)]];
  return (
    <AbsoluteFill style={{ backgroundColor: C.bg }}>
      <Page />
    </AbsoluteFill>
  );
};

