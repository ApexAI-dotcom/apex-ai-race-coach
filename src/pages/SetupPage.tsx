import React, { useState } from 'react';
import { SetupContextCard } from '@/components/setup/SetupContextCard';
import { TireSetupCard } from '@/components/setup/TireSetupCard';
import { ChassisSetupCard } from '@/components/setup/ChassisSetupCard';
import { DrivetrainSetupCard } from '@/components/setup/DrivetrainSetupCard';
import { Button } from '@/components/ui/button';
import { Save } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/use-toast';

export interface SetupState {
  // Phase 1
  weather: 'sec' | 'humide' | 'pluie';
  airTemp: number | '';
  trackTemp: number | '';
  mode: 'course' | 'qualif' | 'warmup';
  circuit: any | null;
  // Phase 2 - Pneus
  tireModel: string;
  coldPressureFront: number | '';
  coldPressureRear: number | '';
  hotPressureFront: number | '';
  hotPressureRear: number | '';
  // Phase 2 - Châssis
  trackWidthFront: number | '';
  trackWidthRear: number | '';
  rideHeightFront: string;
  rideHeightRear: string;
  camber: string;
  caster: string;
  rearAxle: string;
  // Phase 2 - Moteur
  sprocketFront: number | '';
  sprocketRear: number | '';
  carbConfig: any;
}

export default function SetupPage() {
  const { session } = useAuth();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);

  // Profil utilisateur mocké comme demandé
  const profile = { engine_category: "X30 Senior" };

  // État global du setup (Single Source of Truth)
  const [setupState, setSetupState] = useState<SetupState>({
    weather: 'sec',
    airTemp: '',
    trackTemp: '',
    mode: 'course',
    circuit: null,
    tireModel: '',
    coldPressureFront: '',
    coldPressureRear: '',
    hotPressureFront: '',
    hotPressureRear: '',
    trackWidthFront: '',
    trackWidthRear: '',
    rideHeightFront: '',
    rideHeightRear: '',
    camber: '',
    caster: '',
    rearAxle: '',
    sprocketFront: '',
    sprocketRear: '',
    carbConfig: {},
  });

  const handleContextChange = (updates: Partial<SetupState>) => {
    setSetupState((prev) => ({ ...prev, ...updates }));
  };

  const handleSave = async () => {
    if (!session?.access_token) {
      toast({
        title: "Erreur d'authentification",
        description: "Vous devez être connecté pour sauvegarder un setup.",
        variant: "destructive"
      });
      return;
    }

    setIsSaving(true);
    try {
      await api.saveKartSetup(session.access_token, setupState);
      toast({
        title: "Setup sauvegardé !",
        description: "Vos réglages ont été enregistrés avec succès."
      });
    } catch (err: any) {
      console.error(err);
      toast({
        title: "Erreur de sauvegarde",
        description: err.message || "Impossible de sauvegarder le setup.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground pb-20">
      <div className="container max-w-7xl mx-auto pt-8 px-4 space-y-8">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">Carnet d'Ingénieur Digital</h1>
            <p className="text-muted-foreground">
              Configuration globale pour la catégorie <span className="font-semibold text-primary">{profile.engine_category}</span>
            </p>
          </div>
          <Button onClick={handleSave} disabled={isSaving} className="gap-2">
            <Save className="w-4 h-4" />
            {isSaving ? "Sauvegarde..." : "Enregistrer le setup"}
          </Button>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Colonne Gauche : Contexte (prend 4 colonnes sur 12) */}
          <div className="lg:col-span-4 space-y-8">
            <SetupContextCard 
              state={setupState}
              onChange={handleContextChange}
            />
          </div>

          {/* Colonne Droite : Cartes Techniques (prend 8 colonnes sur 12) */}
          <div className="lg:col-span-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-8">
                <TireSetupCard 
                  state={setupState}
                  onChange={handleContextChange}
                />
              </div>
              <div className="space-y-8">
                <ChassisSetupCard 
                  state={setupState}
                  onChange={handleContextChange}
                />
              </div>
              <div className="md:col-span-2">
                <DrivetrainSetupCard 
                  state={setupState}
                  onChange={handleContextChange}
                  engineCategory={profile.engine_category}
                />
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
