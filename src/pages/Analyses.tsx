import { useState, useEffect } from "react";
import { Layout } from "@/components/layout/Layout";
import { PageMeta } from "@/components/seo/PageMeta";
import { useAuth } from "@/hooks/useAuth";
import { getAnalyses, type AnalysisListItem } from "@/lib/api";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Loader2, ChevronLeft, ChevronRight, FileBarChart } from "lucide-react";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const LIMIT = 20;

function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  try {
    return format(new Date(value), "dd MMM yyyy HH:mm", { locale: fr });
  } catch {
    return value;
  }
}

function getBrakingScore(item: AnalysisListItem): string {
  const score = item.ai_insights?.braking_score;
  if (score == null) return "—";
  return String(score);
}

export default function Analyses() {
  const { user, session } = useAuth();
  const [analyses, setAnalyses] = useState<AnalysisListItem[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    if (!session?.access_token) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    getAnalyses(session.access_token, page, LIMIT)
      .then((res) => {
        if (!cancelled) {
          setAnalyses(res.analyses ?? []);
          setTotal(res.total ?? 0);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          const message = err?.message ?? "Erreur lors du chargement des analyses";
          toast.error(message);
          setAnalyses([]);
          setTotal(0);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [session?.access_token, page]);

  const totalPages = Math.max(1, Math.ceil(total / LIMIT));
  const hasPrev = page > 1;
  const hasNext = page < totalPages;

  return (
    <Layout>
      <PageMeta
        title="Analyses | ApexAI"
        description="Historique des analyses de télémétrie."
        path="/analyses"
      />
      <div className="container mx-auto px-4 py-6 md:py-8">
        <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground mb-2">
          Analyses
        </h1>
        <p className="text-muted-foreground mb-6">
          Liste de vos analyses (télémétrie). Utilisez l’upload CSV pour en ajouter.
        </p>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-10 h-10 text-primary animate-spin" />
          </div>
        ) : !user ? (
          <p className="text-muted-foreground py-8">Connectez-vous pour voir vos analyses.</p>
        ) : analyses.length === 0 ? (
          <div className="glass-card rounded-xl p-8 md:p-12 text-center">
            <FileBarChart className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-foreground font-medium">Aucune analyse – Upload CSV pour commencer</p>
          </div>
        ) : (
          <>
            {/* Desktop: table */}
            <div className="hidden md:block overflow-x-auto rounded-lg border border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Circuit</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Tours</TableHead>
                    <TableHead className="text-right">Score freinage</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {analyses.map((item) => (
                    <TableRow key={item.id ?? String(item.created_at ?? Math.random())}>
                      <TableCell className="font-medium">
                        {item.track_name ?? "—"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(item.created_at)}
                      </TableCell>
                      <TableCell className="text-right">
                        {item.lap_count ?? "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        {getBrakingScore(item)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Mobile: cards */}
            <div className="md:hidden space-y-4">
              {analyses.map((item) => (
                <Card key={item.id ?? String(item.created_at ?? Math.random())}>
                  <CardContent className="pt-4">
                    <p className="font-medium text-foreground">
                      {item.track_name ?? "—"}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {formatDate(item.created_at)}
                    </p>
                    <div className="flex justify-between mt-3 text-sm">
                      <span className="text-muted-foreground">Tours</span>
                      <span>{item.lap_count ?? "—"}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Score freinage</span>
                      <span>{getBrakingScore(item)}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between gap-4 mt-6">
                <p className="text-sm text-muted-foreground">
                  Page {page} / {totalPages} ({total} analyse{total !== 1 ? "s" : ""})
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={!hasPrev || loading}
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => p + 1)}
                    disabled={!hasNext || loading}
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
}
