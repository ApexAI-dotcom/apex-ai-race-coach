import React, { useState } from 'react';
import { Recommendation } from '@/utils/advisorEngine';
import { Brain, AlertCircle, Wrench, ShieldAlert, Cpu } from 'lucide-react';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

function getMechanicalImpact(field: string): string {
  switch (field) {
    case 'coldPressureFront':
    case 'coldPressureRear':
      return "Détermine la surface de contact du pneu au sol, la vitesse de montée en température de la gomme et la stabilité générale lors des phases de glisse.";
    case 'hotPressureFront':
    case 'hotPressureRear':
      return "Pression finale ciblée lors du pic d'adhérence en piste. Indispensable pour maintenir un équilibre dynamique constant tout au long des tours de course.";
    case 'trackWidthRear':
      return "Régule le transfert de charge transversal à l'arrière. Plus elle est large, plus le train arrière glisse latéralement pour libérer le moteur dans les virages.";
    case 'trackWidthFront':
      return "Ajuste l'agressivité et le mordant lors de la phase d'inscription en virage. Plus elle est large, plus le train avant est incisif à l'entrée.";
    case 'rearAxle':
      return "Modifie la rigidité transversale du train arrière. Un arbre souple fléchit sous la contrainte pour chercher du grip mécanique. Un arbre dur augmente le glissement pour éviter de saturer.";
    case 'caster':
      return "Modifie la chasse géométrique. Une chasse positive augmente la levée de la roue arrière intérieure (effet différentiel mécanique), facilitant le pivotement dans le serré.";
    case 'camber':
      return "Ajuste le carrossage du train avant. Permet d'optimiser la perpendicularité du pneu par rapport au sol lors des appuis en courbe pour maximiser l'adhérence latérale.";
    case 'rideHeightFront':
    case 'rideHeightRear':
      return "Règle la hauteur du centre de gravité. Rehausser le châssis amplifie le transfert de charge dynamique, idéal pour planter les gommes sous la pluie ou amortir sur piste bosselée.";
    case 'sprocketRear':
    case 'sprocketFront':
      return "Régit le rapport de transmission final. Un rapport court favorise l'accélération et le couple à bas régime, tandis qu'un rapport long maximise la vitesse de pointe.";
    case 'carbConfig':
      return "Ajuste le ratio air/carburant. Une carburation adaptée évite le serrage moteur par temps froid et évite l'engorgement à chaud pour garder un régime optimal.";
    default:
      return "Ajustement technique calculé par l'IA pour optimiser le comportement dynamique globale du châssis en fonction des conditions.";
  }
}

function getFieldName(field: string): string {
  switch (field) {
    case 'coldPressureFront': return "Pression à Froid Avant";
    case 'coldPressureRear': return "Pression à Froid Arrière";
    case 'hotPressureFront': return "Pression à Chaud Avant";
    case 'hotPressureRear': return "Pression à Chaud Arrière";
    case 'trackWidthRear': return "Voie Arrière";
    case 'trackWidthFront': return "Voie Avant";
    case 'rearAxle': return "Dureté de l'Arbre Arrière";
    case 'caster': return "Chasse (Caster)";
    case 'camber': return "Carrossage (Camber)";
    case 'rideHeightFront': return "Hauteur de Caisse Avant";
    case 'rideHeightRear': return "Hauteur de Caisse Arrière";
    case 'sprocketRear': return "Couronne (Transmission)";
    case 'sprocketFront': return "Pignon (Transmission)";
    case 'carbConfig': return "Carburation (Moteur)";
    default: return "Ajustement Setup";
  }
}

export function FieldRecommendation({ recommendation }: { recommendation?: Recommendation }) {
  if (!recommendation) return null;

  const [isOpen, setIsOpen] = useState(false);
  const isHigh = recommendation.priority === 'high';
  const fieldName = getFieldName(recommendation.field);
  const impact = getMechanicalImpact(recommendation.field);

  return (
    <>
      <div className="flex items-center mt-1 select-none">
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={() => setIsOpen(true)}
              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border cursor-pointer transition-all duration-300 ${
                isHigh 
                  ? 'bg-orange-500/10 text-orange-400 border-orange-500/20 hover:bg-orange-500/20' 
                  : 'bg-primary/10 text-primary border-primary/20 hover:bg-primary/20'
              }`}
            >
              {isHigh ? <AlertCircle className="w-3 h-3 text-orange-400" /> : <Brain className="w-3 h-3 text-primary animate-pulse" />}
              <span>Recommandation : {recommendation.value}</span>
            </button>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs p-3 space-y-1 bg-card/95 border border-border backdrop-blur-md shadow-lg rounded-xl z-[9999]">
            <p className="font-semibold text-xs text-primary flex items-center gap-1.5">
              <Brain className="w-3.5 h-3.5" /> Conseil ApexAI (Clic pour détails)
            </p>
            <p className="text-[11px] leading-relaxed text-muted-foreground whitespace-pre-line">{recommendation.message}</p>
          </TooltipContent>
        </Tooltip>
      </div>

      {/* Fiche d'Analyse Ingénieur Détaillée */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-md bg-card border border-border rounded-2xl shadow-xl p-6 backdrop-blur-xl">
          <DialogHeader className="border-b border-border/80 pb-4">
            <DialogTitle className="flex items-center gap-2 text-lg">
              <Wrench className="w-5 h-5 text-primary" />
              <span>Analyse d'Ingénierie ApexAI</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Explication physique approfondie du comportement du châssis.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 pt-2">
            {/* Nom du champ & Valeur recommandée */}
            <div className="flex items-center justify-between bg-background/50 rounded-xl p-4 border border-border shadow-inner">
              <div>
                <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground leading-none">Ajustement ciblé</p>
                <p className="font-bold text-sm text-foreground mt-1">{fieldName}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] uppercase font-bold tracking-wider text-primary leading-none">Valeur pré-remplie</p>
                <p className="font-display font-extrabold text-lg text-primary mt-1">{recommendation.suggestedValue ?? recommendation.value}</p>
              </div>
            </div>

            {/* Explication mécanique détaillée */}
            <div className="space-y-1.5">
              <h5 className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1">
                <Brain className="w-3.5 h-3.5" /> Explication de l'Ingénieur
              </h5>
              <p className="text-xs text-foreground leading-relaxed bg-muted/20 border border-border/40 rounded-xl p-3.5 whitespace-pre-line">
                {recommendation.message}
              </p>
            </div>

            {/* Impact physique */}
            <div className="space-y-1.5">
              <h5 className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1">
                <Cpu className="w-3.5 h-3.5 text-muted-foreground" /> Impact Physique & Dynamique
              </h5>
              <p className="text-[11px] text-muted-foreground leading-relaxed bg-muted/10 border border-border/30 rounded-xl p-3.5">
                {impact}
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
