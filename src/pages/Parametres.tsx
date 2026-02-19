import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Settings, Save, Sun, Moon } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { PageMeta } from "@/components/seo/PageMeta";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const STORAGE_KEY = "apexai_settings";

interface ApexSettings {
  nomPilote: string;
  unites: "kmh" | "mph";
  theme: "dark" | "light";
  notifications: boolean;
}

const defaultSettings: ApexSettings = {
  nomPilote: "",
  unites: "kmh",
  theme: "dark",
  notifications: true,
};

function applyTheme(theme: "dark" | "light") {
  const html = document.documentElement;
  if (theme === "light") {
    html.classList.add("light");
  } else {
    html.classList.remove("light");
  }
}

export default function Parametres() {
  const [settings, setSettings] = useState<ApexSettings>(defaultSettings);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as Partial<ApexSettings & { circuitFavori?: string }>;
        const { circuitFavori: _removed, ...rest } = parsed;
        const next = { ...defaultSettings, ...rest };
        setSettings(next);
        applyTheme(next.theme);
      } else {
        applyTheme("dark");
      }
    } catch {
      applyTheme("dark");
    }
  }, []);

  const saveSettings = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    applyTheme(settings.theme);
    (window as unknown as { apexaiUnits?: string }).apexaiUnits = settings.unites;
    toast.success("Paramètres appliqués !");
  };

  return (
    <Layout>
      <PageMeta
        title="Paramètres | ApexAI"
        description="Personnalise ton expérience ApexAI"
        path="/parametres"
      />
      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-2xl mx-auto space-y-8"
        >
          <div className="flex items-center gap-4">
            <Settings className="w-8 h-8 text-primary" />
            <h1 className="font-display text-3xl font-bold text-foreground">
              Paramètres
            </h1>
          </div>

          {/* Nom Pilote */}
          <div className="glass-card p-6 rounded-xl">
            <Label className="text-lg font-semibold mb-4 block">
              Nom du pilote
            </Label>
            <Input
              type="text"
              value={settings.nomPilote}
              onChange={(e) =>
                setSettings({ ...settings, nomPilote: e.target.value })
              }
              placeholder="Yann Moreau"
              className="w-full p-4 border-2 rounded-xl focus-visible:ring-4 focus-visible:ring-primary/20"
            />
          </div>

          {/* Unités + Thème */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Unités */}
            <div className="glass-card p-6 rounded-xl">
              <Label className="text-lg font-semibold mb-6 block">
                Unités vitesse
              </Label>
              <div className="space-y-3">
                <label className="flex items-center p-3 rounded-lg hover:bg-secondary/50 cursor-pointer">
                  <input
                    type="radio"
                    name="unites"
                    value="kmh"
                    checked={settings.unites === "kmh"}
                    onChange={(e) =>
                      setSettings({ ...settings, unites: e.target.value as "kmh" })
                    }
                    className="mr-3 w-5 h-5 text-primary"
                  />
                  <span className="text-sm">km/h</span>
                </label>
                <label className="flex items-center p-3 rounded-lg hover:bg-secondary/50 cursor-pointer">
                  <input
                    type="radio"
                    name="unites"
                    value="mph"
                    checked={settings.unites === "mph"}
                    onChange={(e) =>
                      setSettings({ ...settings, unites: e.target.value as "mph" })
                    }
                    className="mr-3 w-5 h-5 text-primary"
                  />
                  <span className="text-sm">mph</span>
                </label>
              </div>
            </div>

            {/* Thème - Fonctionnel */}
            <div className="glass-card p-6 rounded-xl">
              <Label className="text-lg font-semibold mb-6 block">Thème</Label>
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => setSettings({ ...settings, theme: "light" })}
                  className={`flex items-center p-3 w-full rounded-lg hover:bg-secondary/50 transition-all border-2 ${
                    settings.theme === "light"
                      ? "border-primary ring-2 ring-primary/20 bg-primary/5"
                      : "border-transparent"
                  }`}
                >
                  <Sun className="w-5 h-5 mr-3 text-yellow-500" />
                  <span className="text-sm font-medium">Clair</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSettings({ ...settings, theme: "dark" })}
                  className={`flex items-center p-3 w-full rounded-lg hover:bg-secondary/50 transition-all border-2 ${
                    settings.theme === "dark"
                      ? "border-primary ring-2 ring-primary/20 bg-primary/5"
                      : "border-transparent"
                  }`}
                >
                  <Moon className="w-5 h-5 mr-3 text-muted-foreground" />
                  <span className="text-sm font-medium">Sombre</span>
                </button>
              </div>
            </div>
          </div>

          {/* Notifications */}
          <div className="glass-card p-6 rounded-xl">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.notifications}
                onChange={(e) =>
                  setSettings({ ...settings, notifications: e.target.checked })
                }
                className="h-4 w-4 rounded border-input text-primary"
              />
              <span className="text-sm font-medium">
                Notifications analyses terminées
              </span>
            </label>
          </div>

          <Button
            onClick={saveSettings}
            className="w-full gradient-primary text-primary-foreground py-6 text-lg font-bold shadow-xl hover:shadow-2xl hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-center gap-3"
          >
            <Save className="w-5 h-5" />
            Sauvegarder & Appliquer
          </Button>
        </motion.div>
      </div>
    </Layout>
  );
}
