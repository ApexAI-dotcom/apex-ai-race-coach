import React, { useState } from 'react';
import { SetupContextCard } from '../components/setup/SetupContextCard';

export interface SetupState {
  weather: 'sec' | 'humide' | 'pluie';
  airTemp: number | '';
  trackTemp: number | '';
  mode: 'course' | 'qualif' | 'warmup';
  circuit: any | null;
}

export default function SetupPage() {
  // Profil utilisateur mocké comme demandé
  const profile = { engine_category: "X30 Senior" };

  // État global du setup (Single Source of Truth)
  const [setupState, setSetupState] = useState<SetupState>({
    weather: 'sec',
    airTemp: '',
    trackTemp: '',
    mode: 'course',
    circuit: null,
  });

  const handleContextChange = (updates: Partial<SetupState>) => {
    setSetupState((prev) => ({ ...prev, ...updates }));
  };

  return (
    <div className="min-h-screen bg-background text-foreground pb-20">
      <div className="container max-w-3xl mx-auto pt-8 px-4 space-y-8">
        <header className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Carnet d'Ingénieur Digital</h1>
          <p className="text-muted-foreground">
            Configuration globale pour la catégorie <span className="font-semibold text-primary">{profile.engine_category}</span>
          </p>
        </header>

        {/* Phase 1 : Contexte et Piste */}
        <section>
          <SetupContextCard 
            state={setupState}
            onChange={handleContextChange}
          />
        </section>

        {/* Prochaines Phases (Pneus, Châssis, Moteur) viendront ici */}
      </div>
    </div>
  );
}
