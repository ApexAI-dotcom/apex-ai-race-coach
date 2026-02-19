import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Layout } from "@/components/layout/Layout";
import { PageMeta } from "@/components/seo/PageMeta";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Settings } from "lucide-react";

const STORAGE_KEY = "apexai_settings";

interface ApexSettings {
  nomPilote: string;
  circuitFavori: string;
  unites: "kmh" | "mph";
  theme: "dark" | "light";
  notifications: boolean;
}

const defaultSettings: ApexSettings = {
  nomPilote: "",
  circuitFavori: "Magny-Cours",
  unites: "kmh",
  theme: "dark",
  notifications: true,
};

export default function Parametres() {
  const [settings, setSettings] = useState<ApexSettings>(defaultSettings);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as Partial<ApexSettings>;
        setSettings((prev) => ({ ...prev, ...parsed }));
      }
    } catch {
      // ignore invalid JSON
    }
  }, []);

  const saveSettings = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    toast.success("Paramètres sauvegardés !");
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
          className="max-w-2xl mx-auto"
        >
          <h1 className="font-display text-3xl font-bold text-foreground mb-2 flex items-center gap-2">
            <Settings className="w-8 h-8 text-primary" />
            Paramètres
          </h1>
          <p className="text-muted-foreground mb-8">
            Personnalise ton expérience ApexAI
          </p>

          <div className="space-y-6 glass-card p-6 rounded-xl">
            {/* Nom Pilote */}
            <div className="space-y-2">
              <Label htmlFor="nomPilote">Nom du pilote</Label>
              <Input
                id="nomPilote"
                type="text"
                value={settings.nomPilote}
                onChange={(e) =>
                  setSettings({ ...settings, nomPilote: e.target.value })
                }
                placeholder="Ex: Yann Moreau"
                className="w-full"
              />
            </div>

            {/* Circuit Favori */}
            <div className="space-y-2">
              <Label htmlFor="circuitFavori">Circuit favori</Label>
              <select
                id="circuitFavori"
                value={settings.circuitFavori}
                onChange={(e) =>
                  setSettings({ ...settings, circuitFavori: e.target.value })
                }
                className="w-full h-10 px-3 rounded-md border border-input bg-background text-foreground text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="Magny-Cours">Magny-Cours</option>
                <option value="Monza">Monza</option>
                <option value="Spa-Francorchamps">Spa-Francorchamps</option>
                <option value="Le Mans">Le Mans</option>
                <option value="Paul Ricard">Paul Ricard</option>
              </select>
            </div>

            {/* Unités */}
            <div className="space-y-2">
              <Label>Unités</Label>
              <div className="flex gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="unites"
                    value="kmh"
                    checked={settings.unites === "kmh"}
                    onChange={(e) =>
                      setSettings({ ...settings, unites: e.target.value as "kmh" })
                    }
                    className="h-4 w-4 text-primary border-input"
                  />
                  <span className="text-sm">km/h</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="unites"
                    value="mph"
                    checked={settings.unites === "mph"}
                    onChange={(e) =>
                      setSettings({ ...settings, unites: e.target.value as "mph" })
                    }
                    className="h-4 w-4 text-primary border-input"
                  />
                  <span className="text-sm">mph</span>
                </label>
              </div>
            </div>

            {/* Thème */}
            <div className="space-y-2">
              <Label>Thème</Label>
              <div className="flex gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="theme"
                    value="dark"
                    checked={settings.theme === "dark"}
                    onChange={(e) =>
                      setSettings({ ...settings, theme: e.target.value as "dark" })
                    }
                    className="h-4 w-4 text-primary border-input"
                  />
                  <span className="text-sm">Dark</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="theme"
                    value="light"
                    checked={settings.theme === "light"}
                    onChange={(e) =>
                      setSettings({ ...settings, theme: e.target.value as "light" })
                    }
                    className="h-4 w-4 text-primary border-input"
                  />
                  <span className="text-sm">Light</span>
                </label>
              </div>
            </div>

            {/* Notifications */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="notifications"
                checked={settings.notifications}
                onChange={(e) =>
                  setSettings({ ...settings, notifications: e.target.checked })
                }
                className="h-4 w-4 rounded border-input text-primary"
              />
              <Label htmlFor="notifications" className="cursor-pointer">
                Notifications analyses terminées
              </Label>
            </div>

            <Button
              onClick={saveSettings}
              className="w-full mt-4 gradient-primary text-primary-foreground font-medium"
              size="lg"
            >
              Sauvegarder
            </Button>
          </div>
        </motion.div>
      </div>
    </Layout>
  );
}
