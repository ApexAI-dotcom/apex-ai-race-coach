// src/constants/kart-presets.ts

export const ENGINE_PRESETS = [
  // ROTAX
  { id: "rotax-micro", name: "Rotax Micro Max", category: "Micro", default_life: 50 },
  { id: "rotax-mini", name: "Rotax Mini Max", category: "Mini", default_life: 50 },
  { id: "rotax-junior", name: "Rotax Junior Max", category: "Junior", default_life: 30 },
  { id: "rotax-max-125", name: "Rotax Max Evo", category: "125SBV", default_life: 15 },
  { id: "rotax-dd2", name: "Rotax Max DD2", category: "125BV", default_life: 15 },
  // IAME
  { id: "iame-water-swift", name: "IAME Water Swift 60cc", category: "Mini", default_life: 20 },
  { id: "iame-ka100", name: "IAME KA100", category: "100SBV", default_life: 20 },
  { id: "iame-x30-junior", name: "IAME X30 Junior", category: "Junior", default_life: 10 },
  { id: "iame-x30", name: "IAME X30 (125cc)", category: "125SBV", default_life: 10 },
  { id: "iame-super-x30", name: "IAME Super X30 (175cc)", category: "175SBV", default_life: 8 },
  // KZ (Boîte de vitesses)
  { id: "tm-r1", name: "TM Racing R1 (KZ)", category: "125BV (KZ)", default_life: 6 },
  { id: "tm-r2", name: "TM Racing R2 (KZ)", category: "125BV (KZ)", default_life: 6 },
  { id: "tm-kz10c", name: "TM Racing KZ10c", category: "125BV (KZ)", default_life: 6 },
  { id: "vortex-rvx", name: "Vortex RVX (KZ)", category: "125BV (KZ)", default_life: 6 },
  { id: "vortex-rok", name: "Vortex ROK GP", category: "125SBV", default_life: 15 },
  // 4 Temps
  { id: "honda-gx160", name: "Honda GX 160", category: "4T", default_life: 100 },
  { id: "honda-gx270", name: "Honda GX 270", category: "4T", default_life: 100 },
  { id: "honda-gx390", name: "Honda GX 390", category: "4T", default_life: 100 },
  { id: "subaru-kx21", name: "Subaru KX21", category: "4T", default_life: 100 },
  { id: "other-engine", name: "Autre moteur...", category: "Custom", default_life: 15 },
];

export const TIRE_PRESETS = [
  // VEGA
  { id: "vega-rouge-sl4", name: "Vega Rouge (SL4)", compound: "Medium", default_life: 60 },
  { id: "vega-blanc-xm3", name: "Vega Blanc (XM3)", compound: "Soft", default_life: 30 },
  { id: "vega-vert-xh3", name: "Vega Vert (XH3)", compound: "Hard", default_life: 90 },
  { id: "vega-bleu-w6", name: "Vega Bleu (W6 Pluie)", compound: "Wet", default_life: 20 },
  // LECONT
  { id: "lecont-jaune-svm", name: "LeCont Jaune (SVM)", compound: "Medium", default_life: 50 },
  { id: "lecont-blanc-svb", name: "LeCont Blanc (SVB)", compound: "Soft", default_life: 30 },
  { id: "lecont-prime-svc", name: "LeCont Prime (SVC)", compound: "Soft", default_life: 30 },
  // MG
  { id: "mg-jaune-sm", name: "MG Jaune (SM)", compound: "Medium", default_life: 60 },
  { id: "mg-rouge-sh", name: "MG Rouge (SH)", compound: "Hard", default_life: 90 },
  { id: "mg-blanc-wt", name: "MG Blanc (WT Pluie)", compound: "Wet", default_life: 20 },
  // MOJO
  { id: "mojo-d2", name: "Mojo D2", compound: "Hard", default_life: 80 },
  { id: "mojo-d5", name: "Mojo D5", compound: "Medium", default_life: 50 },
  { id: "mojo-w5", name: "Mojo W5 (Pluie)", compound: "Wet", default_life: 20 },
  // KOMET
  { id: "komet-k2m", name: "Komet K2M", compound: "Medium", default_life: 60 },
  { id: "komet-k2h", name: "Komet K2H", compound: "Hard", default_life: 90 },
  { id: "komet-k1w", name: "Komet K1W (Pluie)", compound: "Wet", default_life: 20 },
  { id: "other-tires", name: "Autre train...", compound: "Custom", default_life: 50 },
];

export const BRAKE_PRESETS = [
  { id: "otk-bsd", name: "OTK BSD (Tony Kart)", type: "Hydraulic", default_life: 100 },
  { id: "otk-bss", name: "OTK BSS (KZ/Front Brakes)", type: "Hydraulic", default_life: 80 },
  { id: "brembo-ma5", name: "Brembo MA5", type: "Hydraulic", default_life: 120 },
  { id: "parolin-ap", name: "Parolin AP Race", type: "Hydraulic", default_life: 100 },
  { id: "rr-evo", name: "RR Racing Evo", type: "Hydraulic", default_life: 100 },
  { id: "birel-freeline", name: "Birel ART Freeline", type: "Hydraulic", default_life: 100 },
  { id: "crg-ven11", name: "CRG VEN 11", type: "Hydraulic", default_life: 100 },
  { id: "other-brakes", name: "Autre système...", type: "Custom", default_life: 100 },
];
