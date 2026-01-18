import { motion } from "framer-motion";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import {
  User,
  Mail,
  Calendar,
  Trophy,
  TrendingUp,
  Download,
  Settings,
  ChevronRight,
} from "lucide-react";

const sessions = [
  {
    id: 1,
    date: "12 Jan 2024",
    circuit: "Karting de Genève",
    score: 78,
    gain: "+7.2s",
    laps: 24,
  },
  {
    id: 2,
    date: "8 Jan 2024",
    circuit: "Circuit de Bresse",
    score: 72,
    gain: "+5.8s",
    laps: 18,
  },
  {
    id: 3,
    date: "3 Jan 2024",
    circuit: "Karting Indoor Lyon",
    score: 81,
    gain: "+8.1s",
    laps: 32,
  },
  {
    id: 4,
    date: "28 Dec 2023",
    circuit: "Circuit Paul Ricard Mini",
    score: 69,
    gain: "+4.5s",
    laps: 15,
  },
  {
    id: 5,
    date: "22 Dec 2023",
    circuit: "Karting de Genève",
    score: 75,
    gain: "+6.2s",
    laps: 28,
  },
];

const achievements = [
  { icon: "🏆", title: "Pro Apex", description: "10 analyses complétées" },
  { icon: "⚡", title: "Speed Demon", description: "Score > 80 atteint" },
  { icon: "🎯", title: "Précision", description: "5 apex parfaits consécutifs" },
];

export default function Profile() {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-8 mb-8"
        >
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            {/* Avatar */}
            <div className="w-20 h-20 rounded-2xl gradient-primary flex items-center justify-center text-3xl font-bold text-primary-foreground">
              PM
            </div>

            {/* Info */}
            <div className="flex-1">
              <h1 className="font-display text-2xl font-bold text-foreground mb-2">
                Pierre Martin
              </h1>
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Mail className="w-4 h-4" />
                  pierre@example.com
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  Membre depuis Jan 2024
                </span>
                <span className="apex-badge-pro">PRO</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <Button variant="outline" size="sm">
                <Settings className="w-4 h-4" />
                Paramètres
              </Button>
              <Button variant="hero" size="sm">
                <Download className="w-4 h-4" />
                Exporter tout
              </Button>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-12 gap-8">
          {/* Stats Sidebar */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="col-span-12 lg:col-span-4 space-y-6"
          >
            {/* Stats Overview */}
            <div className="glass-card p-6">
              <h3 className="font-display font-semibold text-lg text-foreground mb-4">
                Statistiques
              </h3>
              <div className="space-y-4">
                {[
                  { label: "Sessions analysées", value: "47", icon: Trophy },
                  { label: "Score moyen", value: "76/100", icon: TrendingUp },
                  { label: "Temps total gagné", value: "+4min 23s", icon: TrendingUp },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="flex items-center justify-between p-3 rounded-xl bg-secondary/30"
                  >
                    <div className="flex items-center gap-3">
                      <stat.icon className="w-5 h-5 text-primary" />
                      <span className="text-sm text-muted-foreground">
                        {stat.label}
                      </span>
                    </div>
                    <span className="font-semibold text-foreground">
                      {stat.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Achievements */}
            <div className="glass-card p-6">
              <h3 className="font-display font-semibold text-lg text-foreground mb-4">
                Badges obtenus
              </h3>
              <div className="space-y-3">
                {achievements.map((achievement, index) => (
                  <motion.div
                    key={achievement.title}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 + index * 0.1 }}
                    className="flex items-center gap-3 p-3 rounded-xl bg-secondary/30"
                  >
                    <span className="text-2xl">{achievement.icon}</span>
                    <div>
                      <div className="font-medium text-foreground text-sm">
                        {achievement.title}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {achievement.description}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Evolution Chart Placeholder */}
            <div className="glass-card p-6">
              <h3 className="font-display font-semibold text-lg text-foreground mb-4">
                Évolution du score
              </h3>
              <div className="h-40 flex items-end justify-between gap-2">
                {[65, 72, 68, 75, 78, 72, 81, 78].map((score, index) => (
                  <motion.div
                    key={index}
                    initial={{ height: 0 }}
                    animate={{ height: `${score}%` }}
                    transition={{ delay: 0.3 + index * 0.1, duration: 0.5 }}
                    className="flex-1 rounded-t-sm bg-gradient-to-t from-primary/50 to-primary"
                  />
                ))}
              </div>
              <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                <span>Dec</span>
                <span>Jan</span>
              </div>
            </div>
          </motion.div>

          {/* Sessions History */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="col-span-12 lg:col-span-8"
          >
            <div className="glass-card p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-display font-semibold text-lg text-foreground">
                  Historique des sessions
                </h3>
                <Button variant="outline" size="sm">
                  <Download className="w-4 h-4" />
                  Export PDF
                </Button>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/5">
                      <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                        Date
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                        Circuit
                      </th>
                      <th className="px-4 py-3 text-center text-sm font-medium text-muted-foreground">
                        Tours
                      </th>
                      <th className="px-4 py-3 text-center text-sm font-medium text-muted-foreground">
                        Score
                      </th>
                      <th className="px-4 py-3 text-center text-sm font-medium text-muted-foreground">
                        Gain
                      </th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {sessions.map((session, index) => (
                      <motion.tr
                        key={session.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 + index * 0.05 }}
                        className="border-b border-white/5 last:border-0 hover:bg-white/2 transition-colors"
                      >
                        <td className="px-4 py-4 text-sm text-muted-foreground">
                          {session.date}
                        </td>
                        <td className="px-4 py-4 text-sm font-medium text-foreground">
                          {session.circuit}
                        </td>
                        <td className="px-4 py-4 text-sm text-center text-muted-foreground">
                          {session.laps}
                        </td>
                        <td className="px-4 py-4 text-center">
                          <span
                            className={`inline-flex items-center justify-center w-12 h-6 rounded-full text-xs font-bold ${
                              session.score >= 80
                                ? "bg-success/20 text-success"
                                : session.score >= 70
                                ? "bg-primary/20 text-primary"
                                : "bg-warning/20 text-warning"
                            }`}
                          >
                            {session.score}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-sm text-center font-medium text-success">
                          {session.gain}
                        </td>
                        <td className="px-4 py-4 text-right">
                          <Button variant="ghost" size="sm">
                            Voir
                            <ChevronRight className="w-4 h-4" />
                          </Button>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </Layout>
  );
}
