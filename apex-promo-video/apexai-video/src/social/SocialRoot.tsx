import React from "react";
import { CalculateMetadataFunction, Composition, Folder, Still } from "remotion";
import { Carousel } from "./templates/Carousel";
import { carouselSchema, CarouselProps } from "./templates/schema";
import { Declaration, declarationSchema, DeclarationProps, HighlightCover, highlightSchema, ReelCover, reelCoverSchema, ReelCoverProps, Story, storySchema, StoryProps } from "./templates/Singles";
import { conseilSchema, coverSchema, heroSchema, offreSchema, TChiffreHeros, TConseil, TCouverture, TOffre } from "./templates/Wrappers";
import { PanoramaTile } from "./kit/Panorama";
import { ProfileMockup } from "./compositions/ProfileMockup";
import { Charte, CHARTE_PAGES } from "./charte/Charte";
import { G4TourParfait, G4_DURATION, g4Schema } from "./reels/G4TourParfait";
import { G7Delta, G7_DURATION } from "./reels/G7Delta";
import { DataNeMentPas, DNMP_DURATION } from "./reels/DataNeMentPas";
import { LogoSting, PubG1, PUB_DURATION, S1_DURATION, S3_DURATION, StoryS1, StoryS3 } from "./reels/Shorts";
import G2 from "./posts/G2-comment-ca-marche.json";
import G3 from "./posts/G3-offres.json";
import G5 from "./posts/G5-score.json";
import G6 from "./posts/G6-mythe-ou-data.json";
import G8 from "./posts/G8-carnet.json";
import W2A from "./posts/S2-virage-decrypte-1.json";
import W2C from "./posts/S2-dans-l-app-mon-kart.json";
import STORIES from "./posts/stories.json";

const carouselMeta: CalculateMetadataFunction<CarouselProps> = ({ props }) => ({ durationInFrames: Math.max(1, props.slides.length) });

const CAROUSELS: Array<{ id: string; props: CarouselProps }> = [
  { id: "G2-Comment-ca-marche", props: G2 as CarouselProps },
  { id: "G3-Offres", props: G3 as CarouselProps },
  { id: "G5-Score", props: G5 as CarouselProps },
  { id: "G6-Mythe-ou-data", props: G6 as CarouselProps },
  { id: "G8-Carnet", props: G8 as CarouselProps },
];
const WEEK2: Array<{ id: string; props: CarouselProps }> = [
  { id: "S2-Virage-decrypte-1", props: W2A as CarouselProps },
  { id: "S2-Dans-l-app-Mon-Kart", props: W2C as CarouselProps },
];

const G9: DeclarationProps = {
  label: "Pourquoi ApexAI",
  title: "Planning.\nRéglages.\nEntretien.\n*Une seule app.*",
  titleSize: 100,
  lines: ["Tout ce que tu notais sur papier, au même endroit. Et l'analyse de tes sessions en plus."],
  construction: true,
};

const REEL_COVERS: Array<{ id: string; props: ReelCoverProps }> = [
  {
    id: "G4-Couverture",
    props: { label: "Tour Parfait IA", title: "Ton meilleur tour\nn'est pas ton\n*meilleur tour*.", visual: "trace-gold", visualWidth: 760, demo: true },
  },
  {
    id: "G7-Couverture",
    props: { label: "Le delta", number: "+0,51", unit: "s", tone: "loss", title: "Sur un seul tour.", titleSize: 96, visual: "trace-loss", visualWidth: 720, demo: true },
  },
  {
    id: "S2-Data-ne-ment-pas-Couverture",
    props: { label: "La data ne ment pas #1", number: "3,33", unit: "s", tone: "white", title: "entre ton pire\net ton *meilleur tour*.", titleSize: 104, visual: "stats", visualWidth: 820, demo: true },
  },
];

const G1Cover: React.FC = () => <PanoramaTile tile={1} frame="reel" />;

/** Publicité statique 4:5 : les trois portes d'entrée, prix exacts de la page Tarifs. */
const PUB_OFFRES: CarouselProps = {
  label: "Offres",
  rail: false,
  slides: [
    {
      kind: "list",
      title: "Ton karting.\n*Une seule app.*",
      titleSize: 124,
      bullets: ["Mon Kart : l'entretien et l'usure de ton kart", "Tes réglages, circuit par circuit", "Ton calendrier et l'analyse de tes sessions"],
      button: "Créer mon compte",
      sub: "Inscription gratuite · Racer à 9,90\u00a0€/mois",
    },
  ],
};

/** Compositions réseaux sociaux (posts, carrousels, stories, reels, gabarits). Les films ne sont pas touchés. */
export const SocialRoot: React.FC = () => (
  <>
    <Folder name="Lancement">
      <Still id="G1-Couverture" component={G1Cover} width={1080} height={1920} />
      {CAROUSELS.map((c) => (
        <Composition key={c.id} id={c.id} component={Carousel} schema={carouselSchema} defaultProps={c.props} calculateMetadata={carouselMeta} width={1080} height={1350} fps={1} durationInFrames={c.props.slides.length} />
      ))}
      <Still id="G9-Pourquoi" component={Declaration} schema={declarationSchema} defaultProps={G9} width={1080} height={1350} />
      {REEL_COVERS.map((c) => (
        <Still key={c.id} id={c.id} component={ReelCover} schema={reelCoverSchema} defaultProps={c.props} width={1080} height={1920} />
      ))}
    </Folder>
    <Folder name="Videos">
      <Composition id="G4-TourParfait" component={G4TourParfait} schema={g4Schema} defaultProps={{ safe: "reel" as const }} width={1080} height={1920} fps={60} durationInFrames={G4_DURATION * 60} />
      <Composition id="G7-Delta" component={G7Delta} width={1080} height={1920} fps={60} durationInFrames={G7_DURATION * 60} />
      <Composition id="S2-Data-ne-ment-pas" component={DataNeMentPas} width={1080} height={1920} fps={60} durationInFrames={DNMP_DURATION * 60} />
      <Composition id="S1-Story-logo" component={StoryS1} width={1080} height={1920} fps={60} durationInFrames={S1_DURATION * 60} />
      <Composition id="S3-Story-analyse" component={StoryS3} width={1080} height={1920} fps={60} durationInFrames={Math.round(S3_DURATION * 60)} />
      <Composition id="Logo-Sting-9x16" component={() => <LogoSting width={1080} height={1920} />} width={1080} height={1920} fps={60} durationInFrames={150} />
      <Composition id="Logo-Sting-1x1" component={() => <LogoSting width={1080} height={1080} />} width={1080} height={1080} fps={60} durationInFrames={150} />
      <Composition id="Pub-G1-recut" component={PubG1} width={1080} height={1920} fps={60} durationInFrames={Math.round(PUB_DURATION * 60)} />
      {/* Variantes TikTok : seule l'étiquette « Session de démo » remonte au-dessus de la légende TikTok */}
      <Composition id="G7-Delta-TikTok" component={G7Delta} defaultProps={{ badgeY: 1400 }} width={1080} height={1920} fps={60} durationInFrames={G7_DURATION * 60} />
      <Composition id="DNMP-TikTok" component={DataNeMentPas} defaultProps={{ badgeY: 1400 }} width={1080} height={1920} fps={60} durationInFrames={DNMP_DURATION * 60} />
      <Composition id="Pub-G4" component={G4TourParfait} schema={g4Schema} defaultProps={{ safe: "ad" as const }} width={1080} height={1920} fps={60} durationInFrames={G4_DURATION * 60} />
    </Folder>
    <Folder name="Pubs">
      <Still id="Pub-Offres-4x5" component={Carousel} schema={carouselSchema} defaultProps={PUB_OFFRES} width={1080} height={1350} />
    </Folder>
    <Folder name="Stories">
      {Object.entries(STORIES as Record<string, StoryProps>).map(([id, props]) => (
        <Still key={id} id={id} component={Story} schema={storySchema} defaultProps={props} width={1080} height={1920} />
      ))}
    </Folder>
    <Folder name="A-la-une">
      {(["demo", "tuto", "conseils", "offres", "faq", "histoire"] as const).map((icon) => (
        <React.Fragment key={icon}>
          <Still id={`AL-${icon}-story`} component={(p: { icon: typeof icon }) => <HighlightCover icon={p.icon} height={1920} />} schema={highlightSchema} defaultProps={{ icon }} width={1080} height={1920} />
          <Still id={`AL-${icon}-carre`} component={(p: { icon: typeof icon }) => <HighlightCover icon={p.icon} height={1080} />} schema={highlightSchema} defaultProps={{ icon }} width={1080} height={1080} />
        </React.Fragment>
      ))}
    </Folder>
    <Folder name="Semaine-2">
      {WEEK2.map((c) => (
        <Composition key={c.id} id={c.id} component={Carousel} schema={carouselSchema} defaultProps={c.props} calculateMetadata={carouselMeta} width={1080} height={1350} fps={1} durationInFrames={c.props.slides.length} />
      ))}
    </Folder>
    <Folder name="Gabarits">
      <Still
        id="T-Couverture"
        component={TCouverture}
        schema={coverSchema}
        defaultProps={{ label: "Rubrique", title: "Ton titre,\n*mot-clé* en dégradé.", sub: "Sous-titre en une ligne.", visual: "score", demo: true }}
        width={1080}
        height={1350}
      />
      <Composition
        id="T-Carrousel"
        component={Carousel}
        schema={carouselSchema}
        defaultProps={{
          label: "Rubrique",
          rail: true,
          slides: [
            { kind: "cover", title: "Accroche\nen *6 mots* maximum.", visual: "trace" },
            { kind: "statement", title: "Une idée\n*par slide*.", body: "30 mots maximum, 42 caractères par ligne." },
            { kind: "cta", title: "Un seul\n*appel à l'action*.", button: "Créer mon compte", sub: "Inscription gratuite · lien en bio" },
          ],
        }}
        calculateMetadata={carouselMeta}
        width={1080}
        height={1350}
        fps={1}
        durationInFrames={3}
      />
      <Still
        id="T-ChiffreHeros"
        component={TChiffreHeros}
        schema={heroSchema}
        defaultProps={{ label: "La data ne ment pas", number: "−1,23", unit: "s", tone: "gain", title: "à aller chercher.", body: "Ton Tour Parfait IA, mesuré sur tes propres tours.", demo: true }}
        width={1080}
        height={1350}
      />
      <Still id="T-Declaration" component={Declaration} schema={declarationSchema} defaultProps={{ ...G9, lines: ["Ligne secondaire en 48 px minimum."] }} width={1080} height={1350} />
      <Still
        id="T-Conseil"
        component={TConseil}
        schema={conseilSchema}
        defaultProps={{ label: "Virage décrypté", corner: 10, gain: "0,27", title: "par tour, au virage 10.", body: "Relâche les freins plus progressivement à l'inscription.", demo: true }}
        width={1080}
        height={1350}
      />
      <Still
        id="T-Story"
        component={Story}
        schema={storySchema}
        defaultProps={{ label: "Story", title: "Ta question\n*en grand* ?", sticker: "sondage", guide: true }}
        width={1080}
        height={1920}
      />
      <Still
        id="T-CouvertureReel"
        component={ReelCover}
        schema={reelCoverSchema}
        defaultProps={{ label: "Rubrique", title: "Titre du reel\nen *6 mots*.", visual: "trace-gold", visualWidth: 760 }}
        width={1080}
        height={1920}
      />
      <Still
        id="T-Offre"
        component={TOffre}
        schema={offreSchema}
        defaultProps={{
          label: "Offres",
          plan: "*Racer*",
          title: "Pour suivre et gérer ta compétitivité.",
          price: "9,90 €",
          period: "/mois",
          priceNote: "ou 99 €/an (−17 %)",
          bullets: ["Analyses de tours illimitées", "Tous les circuits détectés", "Score de performance par virage"],
        }}
        width={1080}
        height={1350}
      />
    </Folder>
    <Folder name="Charte">
      <Composition id="Charte" component={Charte} width={1920} height={1080} fps={1} durationInFrames={CHARTE_PAGES.length} />
    </Folder>
    <Folder name="QA">
      <Still id="Profil-Mockup" component={ProfileMockup} width={1290} height={3380} />
    </Folder>
  </>
);

