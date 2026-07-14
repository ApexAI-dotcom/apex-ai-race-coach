import { useState, useEffect } from "react";
import {
  Wrench,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Loader2,
  ChevronsUpDown,
  Check,
} from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import api, { KartProfile } from "@/lib/api";
import { ENGINE_PRESETS, TIRE_PRESETS, BRAKE_PRESETS } from "@/constants/kart-presets";
import { useNavigate } from "react-router-dom";

interface KartSetupWizardProps {
  token: string;
  onComplete: () => void;
  initialProfile?: KartProfile;
}

export const KartSetupWizard = ({ token, onComplete, initialProfile }: KartSetupWizardProps) => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [openEngine, setOpenEngine] = useState(false);
  const [openTires, setOpenTires] = useState(false);
  const [openBrakes, setOpenBrakes] = useState(false);
  const [data, setData] = useState<Partial<KartProfile>>({
    chassis_brand: "",
    chassis_model: "",
    chassis_year: new Date().getFullYear(),
    acquisition_device: "",
    engine_model: "",
    engine_hours_current: 0,
    engine_hours_life: 15,
    tires_model: "",
    tires_sessions_current: 0,
    tires_sessions_life: 50,
    brakes_model: "",
    brakes_sessions_current: 0,
    brakes_sessions_life: 100,
  });

  useEffect(() => {
    if (initialProfile) {
      setData((prev) => ({
        ...prev,
        chassis_brand: initialProfile.chassis_brand || "",
        chassis_model: initialProfile.chassis_model || "",
        chassis_year: initialProfile.chassis_year || new Date().getFullYear(),
        acquisition_device: initialProfile.acquisition_device || "",
        engine_model: initialProfile.engine_model || "",
        engine_hours_current: initialProfile.engine_hours_current || 0,
        engine_hours_life: initialProfile.engine_hours_life || 15,
        tires_model: initialProfile.tires_model || "",
        tires_sessions_current: initialProfile.tires_sessions_current || 0,
        tires_sessions_life: initialProfile.tires_sessions_life || 50,
        brakes_model: initialProfile.brakes_model || "",
        brakes_sessions_current: initialProfile.brakes_sessions_current || 0,
        brakes_sessions_life: initialProfile.brakes_sessions_life || 100,
      }));
    }
  }, [initialProfile]);

  const handleNext = () => setStep((s) => Math.min(s + 1, 4));
  const handleBack = () => {
    if (step === 1) {
      navigate("/dashboard");
    } else {
      setStep((s) => Math.max(s - 1, 1));
    }
  };

  const updateData = (updates: Partial<KartProfile>) => {
    setData((prev) => ({ ...prev, ...updates }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.updateKartProfile(token, {
        chassis_brand: data.chassis_brand,
        chassis_model: data.chassis_model,
        chassis_year: Number(data.chassis_year) || null,
        acquisition_device: data.acquisition_device,
        engine_model: data.engine_model || "Standard",
        engine_hours_current: Number(data.engine_hours_current) || 0,
        engine_hours_life: Number(data.engine_hours_life) || 15,
        tires_model: data.tires_model || "Standard",
        tires_sessions_current: Number(data.tires_sessions_current) || 0,
        tires_sessions_life: Number(data.tires_sessions_life) || 50,
        brakes_model: data.brakes_model || "Standard",
        brakes_sessions_current: Number(data.brakes_sessions_current) || 0,
        brakes_sessions_life: Number(data.brakes_sessions_life) || 100,
      });
      toast.success("Profil Mon Kart configuré avec succès !");
      onComplete();
    } catch (e: any) {
      toast.error("Erreur d'enregistrement : " + e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="py-12 px-4 container max-w-2xl mx-auto">
      <Card className="glass-card w-full relative overflow-hidden shadow-2xl shadow-primary/10">
        <div className="absolute top-0 left-0 right-0 h-1 bg-white/5">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${(step / 4) * 100}%` }}
          />
        </div>

        <CardHeader className="text-center pt-8">
          <Wrench className="w-12 h-12 text-primary mx-auto mb-4" />
          <CardTitle className="text-2xl font-display">
            {step === 1 && "Configuration Châssis & Acquisition"}
            {step === 2 && "Configuration Moteur"}
            {step === 3 && "Configuration Pneus"}
            {step === 4 && "Configuration Freins"}
          </CardTitle>
          <CardDescription>
            {step === 1 && "Renseigne les informations de base de ton matériel."}
            {step === 2 && "Définis les caractéristiques de ton moteur pour mieux le suivre."}
            {step === 3 && "Quels pneus utilises-tu actuellement ?"}
            {step === 4 && "Vérifions le système de freinage."}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6 px-8">
          {step === 1 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="space-y-2">
                <Label>Marque du Châssis</Label>
                <Input
                  className="bg-black/20"
                  placeholder="Ex: Tony Kart, Sodi, Birel ART"
                  value={data.chassis_brand || ""}
                  onChange={(e) => updateData({ chassis_brand: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Modèle du Châssis</Label>
                <Input
                  className="bg-black/20"
                  placeholder="Ex: Racer 401R, Sigma RS3"
                  value={data.chassis_model || ""}
                  onChange={(e) => updateData({ chassis_model: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Année</Label>
                <Input
                  type="number"
                  className="bg-black/20"
                  placeholder="Ex: 2024"
                  value={data.chassis_year || ""}
                  onChange={(e) => updateData({ chassis_year: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label>Boîtier d'Acquisition</Label>
                <Select
                  value={data.acquisition_device || ""}
                  onValueChange={(val) => updateData({ acquisition_device: val })}
                >
                  <SelectTrigger className="bg-black/20 border-white/10">
                    <SelectValue placeholder="Choisir un système..." />
                  </SelectTrigger>
                  <SelectContent className="bg-black/90 border-white/10 text-white">
                    <SelectItem value="Mychron 5">Mychron 5</SelectItem>
                    <SelectItem value="Mychron 5S">Mychron 5S</SelectItem>
                    <SelectItem value="Alfano 6">Alfano 6</SelectItem>
                    <SelectItem value="Unipro">Unipro</SelectItem>
                    <SelectItem value="Autre">Autre</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="space-y-2">
                <Label>Modèle du Moteur</Label>
                <Popover open={openEngine} onOpenChange={setOpenEngine}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={openEngine}
                      className="w-full justify-between bg-black/20 text-left font-normal border-white/10 hover:bg-black/40 hover:text-white"
                    >
                      {data.engine_model ? data.engine_model : "Rechercher un modèle..."}
                      <ChevronsUpDown className="w-4 h-4 ml-2 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[--radix-popover-trigger-width] p-0 bg-black/90 border-white/10 text-white">
                    <Command>
                      <CommandInput placeholder="Filtrer modèles..." />
                      <CommandList>
                        <CommandEmpty>Aucun modèle trouvé.</CommandEmpty>
                        <CommandGroup>
                          {ENGINE_PRESETS.map((p) => (
                            <CommandItem
                              key={p.id}
                              value={p.name}
                              onSelect={() => {
                                updateData({
                                  engine_model: p.name,
                                  engine_hours_life: p.default_life,
                                });
                                setOpenEngine(false);
                              }}
                              className="text-white data-[selected=true]:bg-white/10 cursor-pointer"
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  data.engine_model === p.name ? "opacity-100" : "opacity-0"
                                )}
                              />
                              {p.name}{" "}
                              <span className="ml-2 text-xs text-muted-foreground">
                                ({p.category})
                              </span>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label>Seuil de révision (heures)</Label>
                <Input
                  type="number"
                  className="bg-black/20"
                  value={data.engine_hours_life}
                  onChange={(e) => updateData({ engine_hours_life: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label>Heures actuelles cumulées</Label>
                <Input
                  type="number"
                  step="0.1"
                  className="bg-black/20"
                  value={data.engine_hours_current}
                  onChange={(e) => updateData({ engine_hours_current: Number(e.target.value) })}
                />
                <p className="text-xs text-muted-foreground">
                  Si tu as déjà roulé avec ce piston, indique ses heures.
                </p>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="space-y-2">
                <Label>Modèle / Type de Pneus</Label>
                <Popover open={openTires} onOpenChange={setOpenTires}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={openTires}
                      className="w-full justify-between bg-black/20 text-left font-normal border-white/10 hover:bg-black/40 hover:text-white"
                    >
                      {data.tires_model ? data.tires_model : "Rechercher un train de pneus..."}
                      <ChevronsUpDown className="w-4 h-4 ml-2 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[--radix-popover-trigger-width] p-0 bg-black/90 border-white/10 text-white">
                    <Command>
                      <CommandInput placeholder="Filtrer pneus..." />
                      <CommandList>
                        <CommandEmpty>Aucun pneu trouvé.</CommandEmpty>
                        <CommandGroup>
                          {TIRE_PRESETS.map((p) => (
                            <CommandItem
                              key={p.id}
                              value={p.name}
                              onSelect={() => {
                                updateData({
                                  tires_model: p.name,
                                  tires_sessions_life: p.default_life,
                                });
                                setOpenTires(false);
                              }}
                              className="text-white data-[selected=true]:bg-white/10 cursor-pointer"
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  data.tires_model === p.name ? "opacity-100" : "opacity-0"
                                )}
                              />
                              {p.name}{" "}
                              <span className="ml-2 text-xs text-muted-foreground">
                                ({p.compound})
                              </span>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label>Durée de vie (Sessions)</Label>
                <Input
                  type="number"
                  className="bg-black/20"
                  value={data.tires_sessions_life}
                  onChange={(e) => updateData({ tires_sessions_life: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label>Sessions déjà roulées (Actuel)</Label>
                <Input
                  type="number"
                  className="bg-black/20"
                  value={data.tires_sessions_current}
                  onChange={(e) => updateData({ tires_sessions_current: Number(e.target.value) })}
                />
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="space-y-2">
                <Label>Système de Freinage</Label>
                <Popover open={openBrakes} onOpenChange={setOpenBrakes}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={openBrakes}
                      className="w-full justify-between bg-black/20 text-left font-normal border-white/10 hover:bg-black/40 hover:text-white"
                    >
                      {data.brakes_model ? data.brakes_model : "Rechercher un système..."}
                      <ChevronsUpDown className="w-4 h-4 ml-2 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[--radix-popover-trigger-width] p-0 bg-black/90 border-white/10 text-white">
                    <Command>
                      <CommandInput placeholder="Filtrer freins..." />
                      <CommandList>
                        <CommandEmpty>Aucun système trouvé.</CommandEmpty>
                        <CommandGroup>
                          {BRAKE_PRESETS.map((p) => (
                            <CommandItem
                              key={p.id}
                              value={p.name}
                              onSelect={() => {
                                updateData({
                                  brakes_model: p.name,
                                  brakes_sessions_life: p.default_life,
                                });
                                setOpenBrakes(false);
                              }}
                              className="text-white data-[selected=true]:bg-white/10 cursor-pointer"
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  data.brakes_model === p.name ? "opacity-100" : "opacity-0"
                                )}
                              />
                              {p.name}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label>Seuil d'alerte plaquettes (Sessions)</Label>
                <Input
                  type="number"
                  className="bg-black/20"
                  value={data.brakes_sessions_life}
                  onChange={(e) => updateData({ brakes_sessions_life: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label>Sessions depuis dernier changement</Label>
                <Input
                  type="number"
                  className="bg-black/20"
                  value={data.brakes_sessions_current}
                  onChange={(e) => updateData({ brakes_sessions_current: Number(e.target.value) })}
                />
              </div>
            </div>
          )}
        </CardContent>

        <CardFooter className="flex justify-between px-8 pb-8 pt-4">
          <Button variant="ghost" onClick={handleBack}>
            <ChevronLeft className="w-4 h-4 mr-2" />
            Retour
          </Button>

          {step < 4 ? (
            <Button onClick={handleNext}>
              Suivant
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handleSave}
              disabled={saving}
              className="gradient-primary text-primary-foreground"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4 mr-2" />
              )}
              Terminer
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
};
