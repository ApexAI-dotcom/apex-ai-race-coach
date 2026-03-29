// src/constants/kart-presets.ts

export const ENGINE_PRESETS = [
  { id: "rotax-max-125", name: "Rotax Max Evo (125cc)", category: "125SBV", default_life: 15 },
  { id: "rotax-dd2", name: "Rotax Max DD2", category: "125BV", default_life: 15 },
  { id: "iame-x30", name: "IAME X30 (125cc)", category: "125SBV", default_life: 10 },
  { id: "iame-ka100", name: "IAME KA100", category: "100SBV", default_life: 20 },
  { id: "kz-tm", name: "KZ (TM Racing)", category: "125BV (KZ)", default_life: 6 },
  { id: "kz-vortex", name: "KZ (Vortex)", category: "125BV (KZ)", default_life: 6 },
  { id: "honda-gx", name: "Honda GX 270/390 (4T)", category: "4T", default_life: 50 },
  { id: "other", name: "Autre moteur...", category: "Custom", default_life: 15 },
];

export const TIRE_PRESETS = [
  { id: "vega-rouge", name: "Vega Rouge (SL4)", compound: "Medium", default_life: 60 },
  { id: "vega-blanc", name: "Vega Blanc (XM)", compound: "Soft", default_life: 30 },
  { id: "vega-vert", name: "Vega Vert (XH3)", compound: "Hard", default_life: 90 },
  { id: "lecont-jaune", name: "LeCont Jaune (SVM)", compound: "Medium", default_life: 50 },
  { id: "lecont-blanc", name: "LeCont Blanc (SVB)", compound: "Soft", default_life: 30 },
  { id: "mg-jaune", name: "MG Jaune (SM)", compound: "Medium", default_life: 60 },
  { id: "mg-rouge", name: "MG Rouge (SH)", compound: "Hard", default_life: 90 },
  { id: "mojo-d5", name: "Mojo D5", compound: "Medium", default_life: 50 },
  { id: "mojo-d2", name: "Mojo D2", compound: "Hard", default_life: 80 },
  { id: "mojo-w5", name: "Mojo W5 (Pluie)", compound: "Wet", default_life: 20 },
  { id: "other-tires", name: "Autre train...", compound: "Custom", default_life: 50 },
];

export const BRAKE_PRESETS = [
  { id: "otk", name: "OTK (Tony Kart/Kosmic)", type: "Hydraulic", default_life: 100 },
  { id: "brembo", name: "Brembo", type: "Hydraulic", default_life: 120 },
  { id: "parolin", name: "Parolin OEM", type: "Hydraulic", default_life: 100 },
  { id: "rr", name: "RR Racing", type: "Hydraulic", default_life: 100 },
  { id: "other-brakes", name: "Autre système...", type: "Custom", default_life: 100 },
];
