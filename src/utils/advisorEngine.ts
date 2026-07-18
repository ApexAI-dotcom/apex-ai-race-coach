export interface AdvisorInput {
  weather: 'sec' | 'humide' | 'pluie';
  trackTemp: number | '';
  grip: 'faible' | 'normal' | 'gommée';
  circuit: any | null;
  totalWeight: number; // Pilote + Kart + Lest
  profile?: any; // Profil Mon Kart (pneus, moteur, châssis)
  setupState?: any; // Pour récupérer les valeurs actuelles (ex: sprocketRear)
}

export interface Recommendation {
  field: string;
  value: string | number;
  message: string;
  priority: 'high' | 'medium' | 'low';
  suggestedValue?: any;
}

export function generateRecommendations(input: AdvisorInput): Record<string, Recommendation> {
  const recs: Record<string, Recommendation> = {};
  
  // ---------------------------------------------------------
  // 1. EXTRACTION DES VARIABLES DU CONTEXTE
  // ---------------------------------------------------------
  const isRain = input.weather === 'pluie';
  const trackTemp = typeof input.trackTemp === 'number' ? input.trackTemp : 20; // default 20
  const isHot = trackTemp > 35;
  const isCold = trackTemp < 15;
  const grip = input.grip || 'normal';
  
  const circuit = input.circuit || {};
  const speedRatio = circuit.speedRatio || circuit.speed_ratio || 'mixte';
  const isSinueux = speedRatio === 'sinueux';
  const isRapide = speedRatio === 'rapide';
  
  const hairpins = circuit.hairpinsCount ?? circuit.hairpins_count ?? 0;
  const fastCorners = circuit.fastCornersCount ?? circuit.fast_corners_count ?? 0;
  const elevation = circuit.elevation || 'plat';
  const bumpiness = circuit.bumpiness || 'lisse';
  
  const isHeavy = input.totalWeight > 165;
  
  const profile = input.profile || {};
  const tireModel = (profile.tires_model || "").toLowerCase();
  const chassisBrand = (profile.chassis_brand || "").toLowerCase();
  const engineModel = (profile.engine_model || "").toLowerCase();
  const engineCategory = profile.engine_model ? (profile.engine_model.toLowerCase().includes('kz') ? 'KZ' : 'SBV') : 'SBV';
  
  // ---------------------------------------------------------
  // 2. CALCUL DES PRESSIONS (Base + Modificateurs)
  // ---------------------------------------------------------
  let basePressure = 0.60; // Par défaut
  let tireType = "Standard";
  let isTendre = false;
  
  if (tireModel.includes('vega') || tireModel.includes('lecont') || tireModel.includes('blanc') || tireModel.includes('prime')) {
    basePressure = 0.55;
    tireType = "Gomme Tendre";
    isTendre = true;
  } else if (tireModel.includes('mojo') || tireModel.includes('komet') || tireModel.includes('vert') || tireModel.includes('rouge')) {
    basePressure = 0.70;
    tireType = "Gomme Dure";
  }

  let finalPressureFront = basePressure;
  let finalPressureRear = basePressure;
  let pressureMessage = `Recommandation constructeur (${profile.tires_model || 'Gomme standard'}) : Base de ${basePressure} bar à froid.`;

  if (isRain) {
    // Écrase les bases
    finalPressureFront = 1.15;
    finalPressureRear = 1.15;
    pressureMessage = "PLUIE : Hausse drastique des pressions (1.15 bar) pour faire chauffer la gomme et évacuer l'eau.";
    if (grip === 'faible') {
        finalPressureFront = 1.25;
        finalPressureRear = 1.25;
        pressureMessage += " Grip faible détecté : on sur-gonfle encore un peu (1.25 bar).";
    }
  } else {
    // Modificateurs thermiques
    if (isHot) {
      finalPressureFront -= 0.05;
      finalPressureRear -= 0.05;
      pressureMessage += " Piste très chaude (>35°C) : on baisse de 0.05 bar pour anticiper la sur-dilatation.";
    } else if (isCold) {
      finalPressureFront += 0.05;
      finalPressureRear += 0.05;
      pressureMessage += " Piste froide (<15°C) : on ajoute 0.05 bar pour atteindre la fenêtre thermique plus vite.";
    }
    
    // Modificateurs piste
    if (bumpiness === 'bossele') {
        finalPressureFront -= 0.02;
        finalPressureRear -= 0.02;
        pressureMessage += " Piste bosselée : on enlève 0.02 bar pour donner de la souplesse à la carcasse.";
    }
  }

  // On arrondit pour que ça soit propre
  finalPressureFront = Math.round(finalPressureFront * 100) / 100;
  finalPressureRear = Math.round(finalPressureRear * 100) / 100;

  // Calcul des pressions à chaud estimées
  let deltaHot = isRain ? 0.08 : (isTendre ? 0.15 : 0.20);
  let suggestedHotFront = Math.round((finalPressureFront + deltaHot) * 100) / 100;
  let suggestedHotRear = Math.round((finalPressureRear + deltaHot) * 100) / 100;

  recs['coldPressureFront'] = {
    field: 'coldPressureFront',
    value: finalPressureFront,
    message: pressureMessage,
    priority: isRain || isHot || isCold ? 'high' : 'medium',
    suggestedValue: finalPressureFront
  };
  
  recs['coldPressureRear'] = {
    field: 'coldPressureRear',
    value: finalPressureRear,
    message: pressureMessage,
    priority: isRain || isHot || isCold ? 'high' : 'medium',
    suggestedValue: finalPressureRear
  };

  recs['hotPressureFront'] = {
    field: 'hotPressureFront',
    value: suggestedHotFront,
    message: `Estimation cible à chaud : environ +${deltaHot} bar par rapport à froid.`,
    priority: 'low',
    suggestedValue: suggestedHotFront
  };

  recs['hotPressureRear'] = {
    field: 'hotPressureRear',
    value: suggestedHotRear,
    message: `Estimation cible à chaud : environ +${deltaHot} bar par rapport à froid.`,
    priority: 'low',
    suggestedValue: suggestedHotRear
  };

  // ---------------------------------------------------------
  // 3. LARGEUR DE VOIE & GÉOMÉTRIE (Châssis)
  // ---------------------------------------------------------
  let baseRearWidth = 1400; // mm
  if (chassisBrand.includes('tony') || chassisBrand.includes('kosmic') || chassisBrand.includes('exprit') || chassisBrand.includes('otk') || chassisBrand.includes('ln') || chassisBrand.includes('eos') || chassisBrand.includes('redspeed')) {
    baseRearWidth = 1395;
  }

  let finalRearWidth = baseRearWidth;
  let rearWidthMsg = `Recommandation constructeur ${profile.chassis_brand || 'standard'} : Base de ${baseRearWidth} mm.`;
  let frontWidthVal = 120; // cm (Ex: 120)
  let frontWidthMsg = "Voie avant standard (120 cm).";

  if (isRain) {
    finalRearWidth = 1360; // mm (Minimum)
    rearWidthMsg = `PLUIE : Rentrer le train arrière au minimum (~${finalRearWidth}mm) pour forcer le châssis à planter la roue extérieure.`;
    frontWidthVal = 125; // cm (Maximum)
    frontWidthMsg = "PLUIE : Élargir le train avant au maximum pour avoir un avant ultra incisif et mordre la piste humide.";
  } else {
    // Ajustements fins
    if (grip === 'gommée') {
        finalRearWidth = Math.min(1400, baseRearWidth + 5);
        rearWidthMsg += " Piste très gommée : on élargit un peu (ex: 1400mm) pour faire glisser et 'libérer' l'arrière.";
    } else if (grip === 'faible') {
        finalRearWidth = Math.max(1385, baseRearWidth - 5);
        rearWidthMsg += " Faible grip : on rétrécit un peu (ex: 1390mm) pour générer du grip mécanique.";
    }

    if (isSinueux || hairpins >= 4) {
        frontWidthVal = 122; // Élargie
        frontWidthMsg = `Circuit très sinueux (${hairpins} épingles) : Élargir l'avant d'une bague (~122cm) pour engager le kart dans les virages serrés.`;
    } else if (fastCorners >= 4) {
        frontWidthVal = 118; // Étroite
        frontWidthMsg = `Courbes rapides (${fastCorners}) : Rentrer légèrement l'avant (~118cm) pour limiter l'agressivité et stabiliser le kart à haute vitesse.`;
    }
  }

  recs['trackWidthRear'] = {
    field: 'trackWidthRear',
    value: finalRearWidth,
    message: rearWidthMsg,
    priority: isRain || grip === 'gommée' ? 'high' : 'low',
    suggestedValue: finalRearWidth
  };

  recs['trackWidthFront'] = {
    field: 'trackWidthFront',
    value: frontWidthVal,
    message: frontWidthMsg,
    priority: 'medium',
    suggestedValue: frontWidthVal
  };

  // ---------------------------------------------------------
  // 4. RIGIDITÉ (Arbre & Barres de torsion)
  // ---------------------------------------------------------
  let axleVal = "M"; // Medium
  let axleMsg = `Recommandation constructeur ${profile.chassis_brand || 'standard'} : Arbre standard (Médium) recommandé pour des conditions normales.`;

  if (isRain || grip === 'faible') {
      axleVal = "S";
      axleMsg = `${isRain ? 'PLUIE' : 'GRIP FAIBLE'} : Passer sur un arbre Souple (S) pour faire travailler le châssis et chercher du grip mécanique.`;
  } else if (grip === 'gommée' && isHot) {
      axleVal = "H";
      axleMsg = "PISTE GOMMÉE & CHAUDE : L'adhérence est trop forte, le châssis va saturer. Monter un arbre Dur (H) pour le rigidifier et le forcer à glisser légèrement.";
  }

  recs['rearAxle'] = {
      field: 'rearAxle',
      value: axleVal,
      message: axleMsg,
      priority: axleVal !== 'M' ? 'high' : 'low',
      suggestedValue: axleVal
  };

  if (isRain) {
      recs['trackWidthFront'].message += " ASTUCE : Desserrer ou enlever toutes les barres de torsion pour libérer le châssis au maximum.";
  } else if (fastCorners >= 4) {
      recs['trackWidthFront'].message += " ASTUCE : Insérer la barre de torsion avant pour stabiliser les appuis à haute vitesse.";
  } else if (isSinueux || hairpins >= 4) {
      recs['trackWidthFront'].message += " ASTUCE : Retirer la barre de torsion avant pour aider le châssis à pivoter.";
  }

  // ---------------------------------------------------------
  // 5. GÉOMÉTRIE (Chasse / Caster & Carrossage / Camber)
  // ---------------------------------------------------------
  let casterVal = "Neutre";
  let casterMsg = "Chasse standard d'usine (Neutre).";
  let camberVal = "Neutre";
  let camberMsg = "Carrossage standard (Neutre ou légèrement négatif -1mm).";

  if (isRain) {
      casterVal = "Max Positif";
      casterMsg = "PLUIE : Chasse maximale pour donner du poids sur le train avant et planter les pneus dans l'eau.";
      camberVal = "Neutre à Positif";
      camberMsg = "PLUIE : Éviter le carrossage négatif pour utiliser toute la bande de roulement.";
  } else if (hairpins >= 4 && grip !== 'gommée') {
      casterVal = "Positif";
      casterMsg = "Beaucoup d'épingles : Augmenter la chasse pour aider le châssis à soulever la roue arrière intérieure et pivoter.";
  } else if (grip === 'gommée') {
      casterVal = "Négatif";
      casterMsg = "Piste gommée : Diminuer la chasse (négatif) pour éviter de trop lever l'arrière, ce qui ferait étouffer le moteur en sortie de courbe.";
  }

  recs['caster'] = {
      field: 'caster',
      value: casterVal,
      message: casterMsg,
      priority: 'medium',
      suggestedValue: casterVal
  };

  recs['camber'] = {
      field: 'camber',
      value: camberVal,
      message: camberMsg,
      priority: 'low',
      suggestedValue: camberVal
  };

  // ---------------------------------------------------------
  // 6. HAUTEUR DE CAISSE
  // ---------------------------------------------------------
  let rideHeight = "standard";
  let rideMsg = "Hauteur de caisse standard recommandée.";

  if (isRain) {
      rideHeight = "haute";
      rideMsg = "PLUIE : Relever le châssis (haute) pour amplifier le transfert de charge dynamique sur la roue extérieure.";
  } else if (bumpiness === 'bossele') {
      rideHeight = "haute";
      rideMsg = "PISTE BOSSÉLÉE : Relever le châssis pour éviter qu'il ne talonne sur les vibreurs.";
  }

  recs['rideHeightFront'] = { field: 'rideHeightFront', value: rideHeight, message: rideMsg, priority: rideHeight !== "standard" ? 'medium' : 'low', suggestedValue: rideHeight };
  recs['rideHeightRear'] = { field: 'rideHeightRear', value: rideHeight, message: rideMsg, priority: rideHeight !== "standard" ? 'medium' : 'low', suggestedValue: rideHeight };

  // ---------------------------------------------------------
  // 7. TRANSMISSION (Couronne / Rapport)
  // ---------------------------------------------------------
  // Déterminer la base standard
  let standardFront = 12;
  let standardRear = 80;
  
  if (engineCategory === 'KZ' || engineModel.includes('kz') || engineModel.includes('tm')) {
      standardFront = 17;
      standardRear = 26;
  } else if (engineModel.includes('micro') || engineModel.includes('mini')) {
      standardFront = 11;
      standardRear = 74;
  }

  // Si l'utilisateur a déjà renseigné une couronne, on l'utilise comme base, sinon base par défaut
  let currentRear = input.setupState?.sprocketRear ? Number(input.setupState.sprocketRear) : standardRear;
  let currentFront = input.setupState?.sprocketFront ? Number(input.setupState.sprocketFront) : standardFront;

  let gearDelta = 0;
  let gearReasons: string[] = [];

  if (isRapide) {
      gearDelta -= 1.5;
      gearReasons.push("Circuit Rapide");
  } else if (isSinueux) {
      gearDelta += 1.5;
      gearReasons.push("Circuit Sinueux");
  }

  if (elevation === 'vallonne') {
      gearDelta += 1;
      gearReasons.push("Relief Vallonné");
  }

  if (isHeavy) {
      gearDelta += 1;
      gearReasons.push("Pilote Lourd");
  } else if (input.totalWeight > 0 && input.totalWeight < 145) {
      gearDelta -= 0.5;
      gearReasons.push("Pilote Léger");
  }

  let finalRear = currentRear;
  let gearRounded = Math.round(gearDelta);

  if (gearRounded !== 0) {
      finalRear = currentRear + gearRounded;
      let sign = gearRounded > 0 ? '+' : '';
      let gearMsg = `Suggestion : Passer à ${finalRear} dents (anciennement ${currentRear}).\nModifications combinées: ${sign}${gearRounded} dent(s) (${gearReasons.join(', ')}).`;
      
      recs['sprocketRear'] = {
          field: 'sprocketRear',
          value: finalRear,
          message: gearMsg,
          priority: 'high',
          suggestedValue: finalRear
      };
  } else {
      recs['sprocketRear'] = {
          field: 'sprocketRear',
          value: currentRear,
          message: `Rapport standard conseillé de ${currentRear} dents.`,
          priority: 'low',
          suggestedValue: currentRear
      };
  }

  recs['sprocketFront'] = {
      field: 'sprocketFront',
      value: currentFront,
      message: `Pignon standard conseillé de ${currentFront} dents.`,
      priority: 'low',
      suggestedValue: currentFront
  };

  // ---------------------------------------------------------
  // 8. CARBURATION (Auto-remplissage)
  // ---------------------------------------------------------
  let carbMsg = "";
  let suggestedCarb: any = {};
  
  const isX30OrMini = engineModel.includes('x30') || engineModel.includes('swift') || engineModel.includes('60');
  const isRotaxOrKZ = engineModel.includes('rotax') || engineModel.includes('tm') || engineModel.includes('vortex') || engineModel.includes('junior') || engineModel.includes('evo');

  if (isX30OrMini) {
      // Tillotson carb
      let highSpeed = "1T 05m";
      let lowSpeed = "1T 15m";
      if (trackTemp > 28 || input.weather === 'sec') {
          // Un peu plus pauvre s'il fait chaud
          highSpeed = "1T 00m";
          carbMsg = "Carburateur Tillotson (X30) : Piste chaude/sèche, resserrer légèrement la vis H à 1 tour.";
      } else if (trackTemp < 15) {
          // Plus riche s'il fait froid
          highSpeed = "1T 10m";
          carbMsg = "Carburateur Tillotson (X30) : Températures froides, enrichir la vis H à 1 tour 10min pour éviter le serrage.";
      } else {
          carbMsg = "Carburateur Tillotson (X30) : Réglage d'usine standard (H = 1T 5m, L = 1T 15m).";
      }
      suggestedCarb = {
          highSpeedScrew: highSpeed,
          lowSpeedScrew: lowSpeed
      };
      
      recs['carbConfig'] = {
          field: 'carbConfig',
          value: `H: ${highSpeed} / L: ${lowSpeed}`,
          message: carbMsg,
          priority: 'medium',
          suggestedValue: suggestedCarb
      };
  } else if (isRotaxOrKZ) {
      // Dell'Orto carb
      let mainJet = 125;
      let pilotJet = 60;
      if (trackTemp > 28) {
          mainJet = 122; // plus pauvre s'il fait chaud
          carbMsg = "Carburateur Dell'Orto (Rotax/KZ) : Forte température, baisser le gicleur principal à 122 pour ne pas engorger.";
      } else if (trackTemp < 15) {
          mainJet = 130; // plus riche s'il fait froid
          carbMsg = "Carburateur Dell'Orto (Rotax/KZ) : Température froide, monter le gicleur principal à 130 pour éviter d'être trop pauvre.";
      } else {
          carbMsg = "Carburateur Dell'Orto (Rotax/KZ) : Gicleur principal standard de 125, gicleur de ralenti de 60.";
      }
      suggestedCarb = {
          mainJet: mainJet,
          pilotJet: pilotJet
      };

      recs['carbConfig'] = {
          field: 'carbConfig',
          value: `Gicleur principal: ${mainJet}`,
          message: carbMsg,
          priority: 'medium',
          suggestedValue: suggestedCarb
      };
  }

  return recs;
}
