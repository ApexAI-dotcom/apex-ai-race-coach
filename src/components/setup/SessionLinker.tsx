import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Link as LinkIcon, Sparkles } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';

interface SessionLinkerProps {
  onSessionSelect: (data: any) => void;
}

export function SessionLinker({ onSessionSelect }: SessionLinkerProps) {
  const { session } = useAuth();
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSessionId, setSelectedSessionId] = useState<string>('');

  useEffect(() => {
    const fetchSessions = async () => {
      if (!session?.access_token) return;
      try {
        const res = await api.getKartProfile(session.access_token);
        if (res && res.recent_sessions) {
          setSessions(res.recent_sessions);
        }
      } catch (err) {
        console.error("Erreur lors du chargement des sessions:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchSessions();
  }, [session]);

  const handleSelect = (sessionId: string) => {
    setSelectedSessionId(sessionId);
    const selectedSession = sessions.find((s) => s.id === sessionId);
    if (selectedSession) {
      // Extraction magique des données
      const trackTemp = selectedSession.track_temperature || '';
      const airTemp = selectedSession.air_temp || ''; // Ajuster selon le backend
      const weather = selectedSession.weather || 'sec'; // Ajuster
      const circuit = selectedSession.circuit_id ? { id: selectedSession.circuit_id, name: selectedSession.track_name || 'Circuit Inconnu' } : null;

      onSessionSelect({
        trackTemp,
        airTemp,
        weather,
        circuit,
        mode: selectedSession.session_type || 'course'
      });
    }
  };

  if (loading) {
    return (
      <Card className="bg-primary/5 border-primary/20 rounded-2xl mb-6">
        <CardContent className="p-4 flex items-center gap-3 text-muted-foreground text-sm">
          <Loader2 className="w-4 h-4 animate-spin" /> Chargement des sessions récentes...
        </CardContent>
      </Card>
    );
  }

  if (sessions.length === 0) {
    return null; // On ne montre rien si aucune session
  }

  return (
    <Card className="bg-primary/5 border-primary/20 rounded-2xl mb-8 shadow-sm">
      <CardContent className="p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h3 className="font-semibold text-primary flex items-center gap-2">
            <Sparkles className="w-4 h-4" /> Magie ApexAI
          </h3>
          <p className="text-sm text-muted-foreground">
            Liez ce setup à une session récente pour pré-remplir automatiquement la piste et la météo.
          </p>
        </div>
        
        <div className="w-full md:w-72">
          <Select value={selectedSessionId} onValueChange={handleSelect}>
            <SelectTrigger className="bg-background border-primary/30 focus:ring-primary h-11">
              <div className="flex items-center gap-2">
                <LinkIcon className="w-4 h-4 text-muted-foreground" />
                <SelectValue placeholder="Choisir une session..." />
              </div>
            </SelectTrigger>
            <SelectContent>
              {sessions.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.session_date ? new Date(s.session_date).toLocaleDateString() : 'Date inconnue'} - {s.track_name || 'Circuit Inconnu'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}
