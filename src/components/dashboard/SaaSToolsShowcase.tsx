import React from "react";
import { motion } from "framer-motion";
import { Gauge, Map, AlertTriangle, Zap, MessageSquareCode, Award } from "lucide-react";

interface ToolItem {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<any>;
  color: string;
  accent: string;
  badge: string;
  stat: string;
  interactiveElement: React.ReactNode;
}

const SaaS_TOOLS: ToolItem[] = [
  {
    id: "telemetry",
    name: "Télémétrie Pro",
    description: "Analyse synchronisée de la vitesse et de l'usage des pédales.",
    icon: Gauge,
    color: "from-orange-500 to-red-500",
    accent: "text-orange-400",
    badge: "TEMPS RÉEL",
    stat: "60 FPS Trace",
    interactiveElement: (
      <div className="relative w-full h-12 bg-black/40 rounded border border-white/5 overflow-hidden flex items-center justify-center">
        {/* Animated Speed Trace Wave */}
        <svg className="w-full h-full" viewBox="0 0 100 40" preserveAspectRatio="none">
          <defs>
            <linearGradient id="wave-grad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="rgba(249,115,22,0.1)" />
              <stop offset="50%" stopColor="rgba(239,68,68,0.5)" />
              <stop offset="100%" stopColor="rgba(249,115,22,0.1)" />
            </linearGradient>
          </defs>
          <path
            d="M 0 35 Q 20 10 40 25 T 80 5 T 100 20 L 100 40 L 0 40 Z"
            fill="url(#wave-grad)"
          />
          <motion.path
            d="M 0 35 Q 20 10 40 25 T 80 5 T 100 20"
            fill="none"
            stroke="rgb(249,115,22)"
            strokeWidth="1.5"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{
              duration: 3,
              ease: "easeInOut",
              repeat: Infinity,
              repeatType: "reverse",
            }}
          />
          {/* Animated dot indicator */}
          <motion.circle
            r="2"
            fill="#ffffff"
            stroke="rgb(249,115,22)"
            strokeWidth="1"
            animate={{
              x: [0, 100],
              y: [35, 10, 25, 5, 20],
            }}
            transition={{
              duration: 4,
              ease: "linear",
              repeat: Infinity,
            }}
          />
        </svg>
      </div>
    ),
  },
  {
    id: "trackmap",
    name: "Trajectoire IA",
    description: "Modélisation 2D haute définition de votre ligne idéale.",
    icon: Map,
    color: "from-blue-500 to-indigo-500",
    accent: "text-blue-400",
    badge: "MODÈLE IA",
    stat: "Ligne Apex",
    interactiveElement: (
      <div className="relative w-full h-12 bg-black/40 rounded border border-white/5 overflow-hidden flex items-center justify-center">
        {/* Animated track circuit path */}
        <svg className="w-full h-full p-2" viewBox="0 0 100 40">
          <path
            d="M 10 20 C 10 5, 45 5, 50 20 C 55 35, 90 35, 90 20 C 90 5, 55 5, 50 20 C 45 35, 10 35, 10 20 Z"
            fill="none"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth="3"
            strokeLinecap="round"
          />
          {/* Racing Line */}
          <motion.path
            id="track-path"
            d="M 10 20 C 10 5, 45 5, 50 20 C 55 35, 90 35, 90 20 C 90 5, 55 5, 50 20 C 45 35, 10 35, 10 20 Z"
            fill="none"
            stroke="rgb(59, 130, 246)"
            strokeWidth="1.5"
            strokeDasharray="4 2"
            strokeLinecap="round"
          />
          {/* Racing dot */}
          <circle r="2.5" fill="#ffffff" className="glow-primary">
            <animateMotion dur="6s" repeatCount="indefinite" path="M 10 20 C 10 5, 45 5, 50 20 C 55 35, 90 35, 90 20 C 90 5, 55 5, 50 20 C 45 35, 10 35, 10 20 Z" />
          </circle>
        </svg>
      </div>
    ),
  },
  {
    id: "delta",
    name: "Temps Delta",
    description: "Écart de temps cumulé en temps réel face au meilleur tour.",
    icon: AlertTriangle,
    color: "from-red-500 to-rose-600",
    accent: "text-red-400",
    badge: "CHRONO",
    stat: "-1.24s Delta",
    interactiveElement: (
      <div className="relative w-full h-12 bg-black/40 rounded border border-white/5 overflow-hidden flex items-center justify-between px-3">
        <span className="text-[10px] text-muted-foreground font-mono">T1 VS MEILLEUR</span>
        <div className="flex items-center gap-1.5 font-mono">
          <motion.span
            className="text-red-500 font-bold text-xs"
            animate={{ opacity: [1, 0.4, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            ▲
          </motion.span>
          <span className="text-white font-bold text-xs font-mono tracking-tighter">
            +0.41s
          </span>
        </div>
      </div>
    ),
  },
  {
    id: "coaching",
    name: "Coaching IA",
    description: "Recommandations générées par IA pour optimiser votre pilotage.",
    icon: MessageSquareCode,
    color: "from-green-500 to-emerald-600",
    accent: "text-green-400",
    badge: "CONSEILS",
    stat: "Ingénieur IA",
    interactiveElement: (
      <div className="relative w-full h-12 bg-black/40 rounded border border-white/5 overflow-hidden flex flex-col justify-center px-3 gap-0.5">
        <span className="text-[8px] text-green-400 font-mono tracking-widest font-bold uppercase">
          ApexAI Assistant
        </span>
        <span className="text-[10px] text-white font-medium truncate">
          \"Freine 5m plus tard au Virage 4\"
        </span>
      </div>
    ),
  },
  {
    id: "score",
    name: "Score Apex",
    description: "Indicateur synthétique évaluant votre précision globale.",
    icon: Award,
    color: "from-yellow-500 to-amber-600",
    accent: "text-amber-400",
    badge: "SYNTHÈSE",
    stat: "Score /100",
    interactiveElement: (
      <div className="relative w-full h-12 bg-black/40 rounded border border-white/5 overflow-hidden flex items-center justify-between px-3">
        <span className="text-[10px] text-muted-foreground font-mono">PERFORMANCE</span>
        <div className="flex items-center gap-1">
          <span className="text-white font-display font-black text-sm">92</span>
          <span className="text-[9px] text-muted-foreground">/100</span>
        </div>
      </div>
    ),
  },
];

export function SaaSToolsShowcase() {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
          Pilote Control Deck — Tes Outils PRO
        </h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Survole les différents outils pour prévisualiser les analyses temps réel.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3.5">
        {SaaS_TOOLS.map((tool) => {
          const Icon = tool.icon;
          return (
            <motion.div
              key={tool.id}
              className="group relative rounded-xl border border-white/5 bg-card/40 backdrop-blur-xl p-3.5 flex flex-col justify-between h-[180px] overflow-hidden transition-all duration-300 hover:border-white/10 hover:bg-card/60 transform-gpu translate-z-0"
              whileHover={{ y: -3 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              {/* Vibrant neon corner glow */}
              <div
                className={`absolute -top-12 -right-12 w-24 h-24 bg-gradient-to-br ${tool.color} rounded-full blur-2xl opacity-10 group-hover:opacity-25 transition-opacity duration-300 pointer-events-none`}
              />

              {/* Title & icon header */}
              <div className="space-y-2 relative z-10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-white/5 text-foreground group-hover:scale-110 transition-transform duration-300">
                      <Icon className={`w-4 h-4 ${tool.accent}`} />
                    </div>
                    <span className="font-display font-bold text-sm tracking-tight group-hover:text-primary transition-colors">
                      {tool.name}
                    </span>
                  </div>
                </div>

                <p className="text-[11px] text-muted-foreground leading-normal line-clamp-2">
                  {tool.description}
                </p>
              </div>

              {/* Interactive Micro-Visual */}
              <div className="relative z-10 my-2">
                {tool.interactiveElement}
              </div>

              {/* Bottom statistics/badge */}
              <div className="flex justify-between items-center relative z-10 mt-1">
                <span className="text-[8px] font-bold tracking-wider text-muted-foreground/60 uppercase">
                  {tool.badge}
                </span>
                <span className={`text-[10px] font-bold font-mono ${tool.accent}`}>
                  {tool.stat}
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
