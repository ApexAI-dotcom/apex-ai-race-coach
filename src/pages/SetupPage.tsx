import React, { useState, useEffect } from 'react';
import { SetupContextCard } from '@/components/setup/SetupContextCard';
import { TireSetupCard } from '@/components/setup/TireSetupCard';
import { ChassisSetupCard } from '@/components/setup/ChassisSetupCard';
import { DrivetrainSetupCard } from '@/components/setup/DrivetrainSetupCard';
import { SavedSetupsCard } from '@/components/setup/SavedSetupsCard';
import { Button } from '@/components/ui/button';
import { Save } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/use-toast';
import { Layout } from '@/components/layout/Layout';
import { PageMeta } from '@/components/seo/PageMeta';

export interface SetupState {
  weather: 'sec' | 'humide' | 'pluie';
  airTemp: number | '';
  trackTemp: number | '';
  mode: 'course' | 'qualif' | 'warmup';
  circuit: any | null;
  tireModel: string;
  coldPressureFront: number | '';
  coldPressureRear: number | '';
  hotPressureFront: number | '';
  hotPressureRear: number | '';
  trackWidthFront: number | '';
  trackWidthRear: number | '';
  rideHeightFront: string;
  rideHeightRear: string;
  camber: string;
  caster: string;
  rearAxle: string;
  sprocketFront: number | '';
  sprocketRear: number | '';
  carbConfig: any;
}

const defaultSetupState: SetupState = {
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
};

export default function SetupPage() {
  const { session } = useAuth();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [profile, setProfile] = useState<any>({ engine_category: "X30 Senior" });
  const [setupState, setSetupState] = useState<SetupState>(defaultSetupState);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!session?.access_token) return;
      try {
        const res = await api.getKartProfile(session.access_token);
        if (res && res.profile) {
          setProfile(res.profile);
          // Pré-remplir les pneus si le champ est vide et que le profil en a
          setSetupState(prev => {
            if (!prev.tireModel && res.profile.tires_model) {
              return { ...prev, tireModel: res.profile.tires_model };
            }
            return prev;
          });
        }
      } catch (err) {
        console.error("Erreur de récupération profil:", err);
      }
    };
    fetchProfile();
  }, [session]);

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

  const handleNewSetup = () => {
    setSetupState({
      ...defaultSetupState,
      tireModel: profile?.tires_model || ''
    });
  };

  return (
    <Layout>
      <PageMeta 
        title="Carnet d'Ingénieur | ApexAI" 
        description="Gérez et optimisez les setups techniques de votre kart." 
      />
      
      <div className="min-h-screen bg-background text-foreground pb-20">
        <div className="container max-w-7xl mx-auto pt-8 px-4 space-y-8">
          
          <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tight">Carnet d'Ingénieur Digital</h1>
              <p className="text-muted-foreground">
                Configuration pour la catégorie <span className="font-semibold text-primary">{profile?.engine_category || 'Non définie'}</span>
              </p>
            </div>
            <Button 
              size="lg" 
              onClick={handleSave} 
              disabled={isSaving} 
              className="gap-2 shadow-primary/20 shadow-xl w-full md:w-auto h-12 text-base font-medium rounded-full px-8"
            >
              <Save className="w-5 h-5" />
              {isSaving ? "Sauvegarde..." : "Enregistrer le setup"}
            </Button>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Colonne 1 : Historique (4 colonnes) */}
            <div className="lg:col-span-4 h-full min-h-[600px]">
              <SavedSetupsCard 
                onSelectSetup={(setup) => setSetupState(setup)} 
                onNewSetup={handleNewSetup} 
              />
            </div>

            {/* Colonnes 2 & 3 : Formulaire (8 colonnes) */}
            <div className="lg:col-span-8 space-y-8">
              <SetupContextCard 
                state={setupState}
                onChange={handleContextChange}
              />
              
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                <TireSetupCard 
                  state={setupState}
                  onChange={handleContextChange}
                />
                <ChassisSetupCard 
                  state={setupState}
                  onChange={handleContextChange}
                />
                <div className="xl:col-span-2">
                  <DrivetrainSetupCard 
                    state={setupState}
                    onChange={handleContextChange}
                    engineCategory={profile?.engine_category || ''}
                  />
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </Layout>
  );
}
