import React, { useState } from 'react';
import { SetupContextCard } from '@/components/setup/SetupContextCard';
import { TireSetupCard } from '@/components/setup/TireSetupCard';
import { ChassisSetupCard } from '@/components/setup/ChassisSetupCard';
import { DrivetrainSetupCard } from '@/components/setup/DrivetrainSetupCard';
import { SessionLinker } from '@/components/setup/SessionLinker';
import { Button } from '@/components/ui/button';
import { Save } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/use-toast';
import { Layout } from '@/components/layout/Layout';
import { PageMeta } from '@/components/seo/PageMeta';

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
    <Layout>
      <PageMeta 
        title="Carnet d'Ingénieur | ApexAI" 
        description="Gérez et optimisez les setups techniques de votre kart." 
      />
      
      <div className="min-h-screen bg-background text-foreground pb-32">
        <div className="container max-w-7xl mx-auto pt-8 px-4 space-y-8">
          
          <header className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">Carnet d'Ingénieur Digital</h1>
            <p className="text-muted-foreground">
              Configuration globale pour la catégorie <span className="font-semibold text-primary">{profile.engine_category}</span>
            </p>
          </header>

          <SessionLinker onSessionSelect={handleContextChange} />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 relative">
            
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

      {/* Floating Action Bar pour la Sauvegarde */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-t border-border shadow-lg p-4 md:p-6 flex justify-center md:justify-end animate-in slide-in-from-bottom-10 duration-500">
        <div className="container max-w-7xl mx-auto flex justify-end px-4">
          <Button 
            size="lg" 
            onClick={handleSave} 
            disabled={isSaving} 
            className="gap-2 shadow-primary/20 shadow-xl w-full md:w-auto h-12 text-base font-medium rounded-full px-8"
          >
            <Save className="w-5 h-5" />
            {isSaving ? "Sauvegarde..." : "Enregistrer le setup"}
          </Button>
        </div>
      </div>
    </Layout>
  );
}
