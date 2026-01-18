import { motion } from "framer-motion";
import { Layout } from "@/components/layout/Layout";
import { ScoreCard } from "@/components/stats/ScoreCard";
import { StatCard } from "@/components/stats/StatCard";
import { ApexGraph } from "@/components/racing/ApexGraph";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import {
  Timer,
  Target,
  Gauge,
  TrendingUp,
  Upload,
  ChevronRight,
} from "lucide-react";

const performanceMetrics = [
  { label: "Freinage", score: 92, color: "success" },
  { label: "Accélération", score: 76, color: "warning" },
  { label: "Ligne", score: 88, color: "primary" },
  { label: "Régularité", score: 84, color: "primary" },
];

export default function Dashboard() {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8"
        >
          <div>
            <h1 className="font-display text-3xl font-bold text-foreground mb-2">
              Dashboard
            </h1>
            <p className="text-muted-foreground">
              Dernière session : Karting de Genève · 12 Jan 2024
            </p>
          </div>
          <Link to="/upload">
            <Button variant="hero">
              <Upload className="w-4 h-4" />
              Nouvelle analyse
            </Button>
          </Link>
        </motion.div>

        {/* Main Grid */}
        <div className="grid grid-cols-12 gap-6">
          {/* Apex Graph - Main */}
          <div className="col-span-12 lg:col-span-8">
            <ApexGraph />
          </div>

          {/* Score Cards - Sidebar */}
          <div className="col-span-12 lg:col-span-4 space-y-6">
            <ScoreCard score={78} label="Score Global" size="lg" />

            <div className="grid grid-cols-2 gap-4">
              <StatCard
                icon={Timer}
                value="7.2s"
                label="Temps gagné"
                variant="success"
              />
              <StatCard
                icon={Target}
                value="12"
                label="Virages"
                variant="default"
              />
            </div>

            <StatCard
              icon={Gauge}
              value="89%"
              label="Efficacité globale"
              trend="+5%"
              variant="primary"
            />
          </div>
        </div>

        {/* Performance Metrics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-8 glass-card p-6"
        >
          <h3 className="font-display font-semibold text-lg text-foreground mb-6">
            Métriques détaillées
          </h3>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {performanceMetrics.map((metric) => (
              <div key={metric.label} className="text-center">
                <div className="relative w-20 h-20 mx-auto mb-3">
                  <svg className="w-full h-full -rotate-90">
                    <circle
                      cx="40"
                      cy="40"
                      r="35"
                      fill="none"
                      stroke="hsl(var(--muted))"
                      strokeWidth="6"
                    />
                    <motion.circle
                      cx="40"
                      cy="40"
                      r="35"
                      fill="none"
                      stroke={
                        metric.color === "success"
                          ? "hsl(var(--success))"
                          : metric.color === "warning"
                          ? "hsl(var(--warning))"
                          : "hsl(var(--primary))"
                      }
                      strokeWidth="6"
                      strokeLinecap="round"
                      strokeDasharray={`${metric.score * 2.2} 220`}
                      initial={{ strokeDasharray: "0 220" }}
                      animate={{ strokeDasharray: `${metric.score * 2.2} 220` }}
                      transition={{ duration: 1.5, ease: "easeOut" }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="font-display font-bold text-lg text-foreground">
                      {metric.score}
                    </span>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">{metric.label}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Recent Sessions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-8 glass-card p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-display font-semibold text-lg text-foreground">
              Sessions récentes
            </h3>
            <Link to="/profile">
              <Button variant="ghost" size="sm">
                Voir tout
                <ChevronRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>

          <div className="space-y-4">
            {[
              {
                date: "12 Jan",
                circuit: "Karting de Genève",
                score: 78,
                gain: "+7.2s",
              },
              {
                date: "8 Jan",
                circuit: "Circuit de Bresse",
                score: 72,
                gain: "+5.8s",
              },
              {
                date: "3 Jan",
                circuit: "Karting Indoor Lyon",
                score: 81,
                gain: "+8.1s",
              },
            ].map((session, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + index * 0.1 }}
                className="flex items-center justify-between p-4 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-4">
                  <div className="text-sm text-muted-foreground w-16">
                    {session.date}
                  </div>
                  <div className="font-medium text-foreground">
                    {session.circuit}
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-sm">
                    <span className="text-muted-foreground">Score: </span>
                    <span className="font-semibold text-foreground">
                      {session.score}/100
                    </span>
                  </div>
                  <div className="text-sm font-semibold text-success">
                    {session.gain}
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </Layout>
  );
}
