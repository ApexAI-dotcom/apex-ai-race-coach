import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Disc3, Plus, Pencil, Trash2, CloudRain, Loader2, CircleCheck, CircleDot } from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "sonner";

interface TireStockCardProps {
  token: string;
  tireSets: any[];
  onRefresh: () => void;
}

const STATE_LABELS: Record<string, string> = { neuf: "Neuf", rode: "Rodé", use: "Usé" };
const STATE_STYLES: Record<string, string> = {
  neuf: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  rode: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  use: "bg-red-500/10 text-red-500 border-red-500/20",
};

const emptyForm = {
  label: "",
  componentId: "",
  customModel: "",
  state: "neuf",
  isRain: false,
  lapsCurrent: 0,
  lapsLife: 250,
};

export function TireStockCard({ token, tireSets, onRefresh }: TireStockCardProps) {
  const [catalogTires, setCatalogTires] = useState<any[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<any>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [mountingId, setMountingId] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    api.getCatalogComponents(token, "tire")
      .then((res) => setCatalogTires(res.components || []))
      .catch(() => setCatalogTires([]));
  }, [token]);

  const openCreate = () => {
    setEditingId(null);
    setForm({ ...emptyForm, label: `Train ${tireSets.length + 1}` });
    setDialogOpen(true);
  };

  const openEdit = (s: any) => {
    setEditingId(s.id);
    setForm({
      label: s.label || "",
      componentId: s.component_id || "",
      customModel: s.custom_model || "",
      state: s.state || "neuf",
      isRain: !!s.is_rain,
      lapsCurrent: s.laps_current ?? 0,
      lapsLife: s.laps_life ?? 250,
    });
    setDialogOpen(true);
  };

  const handleModelSelect = (value: string) => {
    if (value === "custom") {
      setForm((f: any) => ({ ...f, componentId: "" }));
      return;
    }
    const comp = catalogTires.find((c) => c.id === value);
    setForm((f: any) => ({
      ...f,
      componentId: value,
      customModel: "",
      isRain: comp?.subcategory === "Wet" || comp?.specs?.use === "rain" ? true : f.isRain,
      lapsLife: comp?.default_life ? Number(comp.default_life) : f.lapsLife,
    }));
  };

  const handleSave = async () => {
    if (!form.componentId && !form.customModel) {
      toast.error("Choisissez un modèle de pneu (catalogue ou saisie libre).");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        label: form.label || undefined,
        componentId: form.componentId || undefined,
        customModel: form.customModel || undefined,
        state: form.state,
        isRain: form.isRain,
        lapsCurrent: Number(form.lapsCurrent) || 0,
        lapsLife: Number(form.lapsLife) || 250,
      };
      if (editingId) {
        await api.updateTireSet(token, editingId, payload);
        toast.success("Train mis à jour.");
      } else {
        await api.createTireSet(token, payload);
        toast.success("Train ajouté au stock.");
      }
      setDialogOpen(false);
      onRefresh();
    } catch (err: any) {
      toast.error(err.message || "Impossible d'enregistrer le train.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (s: any) => {
    if (!confirm(`Supprimer "${s.label}" du stock ?`)) return;
    try {
      await api.deleteTireSet(token, s.id);
      onRefresh();
      toast.success("Train supprimé.");
    } catch (err: any) {
      toast.error(err.message || "Suppression impossible.");
    }
  };

  const handleMount = async (s: any) => {
    setMountingId(s.id);
    try {
      await api.mountTireSet(token, s.id);
      onRefresh();
      toast.success(`${s.label} monté sur le kart.`);
    } catch (err: any) {
      toast.error(err.message || "Impossible de monter ce train.");
    } finally {
      setMountingId(null);
    }
  };

  const modelLabel = (s: any) => s.custom_model || s.component_label || "Modèle inconnu";
  const lifeLeft = (s: any) => Math.max(0, (s.laps_life ?? 250) - (s.laps_current ?? 0));

  return (
    <Card className="bg-card border border-border shadow-sm rounded-2xl">
      <CardHeader className="pb-4 flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Disc3 className="w-5 h-5 text-primary" />
          Stock de Pneus
        </CardTitle>
        <Button size="sm" variant="outline" className="gap-2 rounded-full border-primary/20 text-primary hover:bg-primary/10" onClick={openCreate}>
          <Plus className="w-4 h-4" /> Déclarer un train
        </Button>
      </CardHeader>

      <CardContent className="space-y-3">
        {tireSets.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Aucun train déclaré. Déclarez vos trains (neuf, rodé, pluie…) pour
            qu'ApexAI recommande le bon pneu à chaque session.
          </p>
        ) : (
          tireSets.map((s) => {
            const mounted = !!s.is_mounted;
            return (
              <div
                key={s.id}
                className={`flex items-center justify-between gap-3 p-3 rounded-xl border transition-colors ${
                  mounted
                    ? "border-primary/50 bg-primary/5 ring-1 ring-primary/30"
                    : "border-border bg-background/40"
                }`}
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    {mounted && (
                      <Badge className="bg-primary text-primary-foreground border-0 rounded-full text-xs gap-1">
                        <CircleCheck className="w-3 h-3" /> Monté
                      </Badge>
                    )}
                    <span className="font-semibold text-sm">{s.label}</span>
                    <Badge className={`border rounded-full text-xs ${STATE_STYLES[s.state] || ""}`}>
                      {STATE_LABELS[s.state] || s.state}
                    </Badge>
                    {s.is_rain && (
                      <Badge className="bg-sky-500/10 text-sky-400 border border-sky-500/20 rounded-full text-xs gap-1">
                        <CloudRain className="w-3 h-3" /> Pluie
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate mt-1">
                    {modelLabel(s)} · {s.laps_current ?? 0}/{s.laps_life ?? 250} tours ({lifeLeft(s)} restants)
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {!mounted && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 gap-1.5 text-xs text-primary hover:bg-primary/10"
                      onClick={() => handleMount(s)}
                      disabled={mountingId === s.id}
                    >
                      {mountingId === s.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CircleDot className="w-3.5 h-3.5" />}
                      Monter
                    </Button>
                  )}
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => openEdit(s)}>
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => handleDelete(s)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            );
          })
        )}
      </CardContent>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingId ? "Modifier le train" : "Déclarer un train"}</DialogTitle>
            <DialogDescription>
              Un train = un jeu complet de 4 pneus suivi individuellement.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nom du train</Label>
              <Input value={form.label} onChange={(e) => setForm((f: any) => ({ ...f, label: e.target.value }))} placeholder="Train 1" />
            </div>

            <div className="space-y-2">
              <Label>Modèle (catalogue)</Label>
              <Select value={form.componentId || "custom"} onValueChange={handleModelSelect}>
                <SelectTrigger><SelectValue placeholder="Choisir un pneu..." /></SelectTrigger>
                <SelectContent>
                  {catalogTires.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.brand} {c.name} ({c.subcategory})
                    </SelectItem>
                  ))}
                  <SelectItem value="custom">Autre (saisie libre)…</SelectItem>
                </SelectContent>
              </Select>
              {!form.componentId && (
                <Input
                  value={form.customModel}
                  onChange={(e) => setForm((f: any) => ({ ...f, customModel: e.target.value }))}
                  placeholder="Ex: Vega Vert (XH3)"
                />
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>État</Label>
                <Select value={form.state} onValueChange={(v) => setForm((f: any) => ({ ...f, state: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="neuf">Neuf</SelectItem>
                    <SelectItem value="rode">Rodé</SelectItem>
                    <SelectItem value="use">Usé</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={form.isRain ? "rain" : "slick"} onValueChange={(v) => setForm((f: any) => ({ ...f, isRain: v === "rain" }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="slick">Slick (sec)</SelectItem>
                    <SelectItem value="rain">Pluie</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tours effectués</Label>
                <Input type="number" min={0} value={form.lapsCurrent} onChange={(e) => setForm((f: any) => ({ ...f, lapsCurrent: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Durée de vie (tours)</Label>
                <Input type="number" min={1} value={form.lapsLife} onChange={(e) => setForm((f: any) => ({ ...f, lapsLife: e.target.value }))} />
              </div>
            </div>

            <Button className="w-full" onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              {editingId ? "Mettre à jour" : "Ajouter au stock"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
