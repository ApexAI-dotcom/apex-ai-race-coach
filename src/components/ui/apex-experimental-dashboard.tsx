"use client"
import React, { useState, useEffect } from "react";
import {
  Home,
  Monitor,
  BarChart3,
  ChevronDown,
  ChevronsRight,
  Moon,
  Sun,
  TrendingUp,
  Activity,
  Bell,
  Settings,
  HelpCircle,
  User,
  Car,
  LineChart,
  Target,
  Trophy,
  Wrench,
  Timer,
  Zap,
  Gauge
} from "lucide-react";

export const ApexDashboard = () => {
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  return (
    <div className={`flex min-h-screen w-full ${isDark ? 'dark' : ''}`}>
      <div className="flex w-full bg-background text-foreground font-sans selection:bg-primary/30">
        <Sidebar />
        <MainContent isDark={isDark} setIsDark={setIsDark} />
      </div>
    </div>
  );
};

const Sidebar = () => {
  const [open, setOpen] = useState(true);
  const [selected, setSelected] = useState("Telemetry");

  return (
    <nav
      className={`sticky top-0 h-screen shrink-0 border-r transition-all duration-300 ease-in-out ${
        open ? 'w-64' : 'w-16'
      } border-white/10 bg-secondary/30 backdrop-blur-md p-2 shadow-xl z-20 flex flex-col`}
    >
      <TitleSection open={open} />

      <div className="space-y-1 mb-8 flex-1 overflow-y-auto hide-scrollbar">
        <Option Icon={Home} title="Overview" selected={selected} setSelected={setSelected} open={open} />
        <Option Icon={LineChart} title="Telemetry" selected={selected} setSelected={setSelected} open={open} notifs={2} />
        <Option Icon={Target} title="AI Coach" selected={selected} setSelected={setSelected} open={open} notifs={1} />
        <Option Icon={Car} title="Garage" selected={selected} setSelected={setSelected} open={open} />
        <Option Icon={Wrench} title="Setups" selected={selected} setSelected={setSelected} open={open} />
        <Option Icon={Trophy} title="Leaderboard" selected={selected} setSelected={setSelected} open={open} />
      </div>

      {open && (
        <div className="border-t border-white/10 pt-4 space-y-1">
          <div className="px-3 py-2 text-xs font-bold text-muted-foreground uppercase tracking-wider">
            Système
          </div>
          <Option Icon={Settings} title="Paramètres" selected={selected} setSelected={setSelected} open={open} />
          <Option Icon={HelpCircle} title="Support" selected={selected} setSelected={setSelected} open={open} />
        </div>
      )}

      <ToggleClose open={open} setOpen={setOpen} />
    </nav>
  );
};

const Option = ({ Icon, title, selected, setSelected, open, notifs }: any) => {
  const isSelected = selected === title;
  
  return (
    <button
      onClick={() => setSelected(title)}
      className={`relative flex h-11 w-full items-center rounded-lg transition-all duration-300 group ${
        isSelected 
          ? "bg-primary/10 text-primary shadow-sm border-l-2 border-primary" 
          : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
      }`}
    >
      <div className="grid h-full w-12 place-content-center transition-transform duration-300 group-hover:scale-110">
        <Icon className={`h-5 w-5 ${isSelected ? "text-primary" : ""}`} />
      </div>
      
      {open && (
        <span
          className={`text-sm font-medium transition-opacity duration-300 ${
            open ? 'opacity-100' : 'opacity-0'
          }`}
        >
          {title}
        </span>
      )}

      {notifs && open && (
        <span className="absolute right-3 flex h-5 w-5 items-center justify-center rounded-full bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.5)] text-[10px] text-white font-bold">
          {notifs}
        </span>
      )}
    </button>
  );
};

const TitleSection = ({ open }: { open: boolean }) => {
  return (
    <div className="mb-6 border-b border-white/10 pb-4">
      <div className="flex cursor-pointer items-center justify-between rounded-lg p-2 transition-colors hover:bg-white/5">
        <div className="flex items-center gap-3">
          <Logo />
          {open && (
            <div className={`transition-opacity duration-300 ${open ? 'opacity-100' : 'opacity-0'}`}>
              <div className="flex items-center gap-2">
                <div>
                  <span className="block text-sm font-display font-bold text-foreground">
                    APEX<span className="text-primary">AI</span>
                  </span>
                  <span className="block text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                    Pro License
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
        {open && (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        )}
      </div>
    </div>
  );
};

const Logo = () => {
  return (
    <div className="grid size-10 shrink-0 place-content-center rounded-xl bg-gradient-to-br from-orange-500 to-red-600 shadow-[0_0_15px_rgba(249,115,22,0.3)] relative overflow-hidden">
      <div className="absolute inset-0 bg-white/20 blur-xl rounded-full translate-x-1/2 -translate-y-1/2"></div>
      <Zap className="h-5 w-5 text-white relative z-10" />
    </div>
  );
};

const ToggleClose = ({ open, setOpen }: any) => {
  return (
    <button
      onClick={() => setOpen(!open)}
      className="mt-4 border-t border-white/10 transition-colors hover:bg-white/5"
    >
      <div className="flex items-center p-3">
        <div className="grid size-10 place-content-center">
          <ChevronsRight
            className={`h-5 w-5 transition-transform duration-500 text-muted-foreground ${
              open ? "rotate-180" : ""
            }`}
          />
        </div>
        {open && (
          <span
            className={`text-sm font-medium text-muted-foreground transition-opacity duration-300 ${
              open ? 'opacity-100' : 'opacity-0'
            }`}
          >
            Réduire
          </span>
        )}
      </div>
    </button>
  );
};

const MainContent = ({ isDark, setIsDark }: any) => {
  return (
    <div className="flex-1 bg-background p-4 md:p-8 overflow-auto relative">
      {/* Background Glow */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500/5 rounded-full blur-[120px] pointer-events-none"></div>

      {/* Header */}
      <div className="flex items-center justify-between mb-8 relative z-10">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Analyse Télémétrie</h1>
          <p className="text-muted-foreground mt-1 text-sm">Session: Le Mans Karting Int. - Rotax DD2</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="relative p-2.5 rounded-xl bg-secondary/50 border border-white/10 text-muted-foreground hover:text-foreground transition-all hover:bg-secondary">
            <Bell className="h-5 w-5" />
            <span className="absolute top-2 right-2 h-2.5 w-2.5 bg-primary rounded-full shadow-[0_0_8px_rgba(249,115,22,1)] animate-pulse"></span>
          </button>
          <button
            onClick={() => setIsDark(!isDark)}
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground transition-all"
          >
            {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>
          <button className="h-11 w-11 rounded-xl overflow-hidden border-2 border-white/10 hover:border-primary/50 transition-colors">
            <img src="https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=100&h=100&fit=crop" alt="Driver" className="w-full h-full object-cover" />
          </button>
        </div>
      </div>
      
      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8 relative z-10">
        <StatCard 
          icon={Timer} 
          title="Best Lap" 
          value="54.238s" 
          trend="-0.15s" 
          trendColor="text-green-500" 
          bgColor="bg-primary/10" 
          iconColor="text-primary" 
        />
        <StatCard 
          icon={Activity} 
          title="Consistency" 
          value="96.4%" 
          trend="+1.2%" 
          trendColor="text-green-500" 
          bgColor="bg-blue-500/10" 
          iconColor="text-blue-500" 
        />
        <StatCard 
          icon={Gauge} 
          title="Top Speed" 
          value="142 km/h" 
          trend="Sector 2" 
          trendColor="text-muted-foreground" 
          bgColor="bg-purple-500/10" 
          iconColor="text-purple-500" 
        />
        <StatCard 
          icon={Target} 
          title="Apex Score" 
          value="92/100" 
          trend="Pro Level" 
          trendColor="text-orange-500" 
          bgColor="bg-orange-500/10" 
          iconColor="text-orange-500" 
        />
      </div>
      
      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 relative z-10">
        {/* Main Chart Area */}
        <div className="lg:col-span-2">
          <div className="rounded-2xl border border-white/10 bg-secondary/30 backdrop-blur-md p-6 shadow-xl h-[450px] flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                <LineChart className="w-5 h-5 text-primary" /> Trace de Vitesse
              </h3>
              <div className="flex gap-2">
                <span className="px-3 py-1 text-xs rounded-full bg-primary/20 text-primary border border-primary/20">Lap 12 (Best)</span>
                <span className="px-3 py-1 text-xs rounded-full bg-white/5 text-muted-foreground border border-white/10">Lap 11</span>
              </div>
            </div>
            
            {/* Placeholder for actual chart */}
            <div className="flex-1 rounded-xl bg-black/20 border border-white/5 flex items-center justify-center relative overflow-hidden">
               <div className="absolute inset-0 opacity-20" style={{
                 backgroundImage: "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
                 backgroundSize: "20px 20px"
               }}></div>
               
               {/* Decorative simulated chart line */}
               <svg className="absolute w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 100">
                 <path d="M0,80 Q10,80 20,40 T40,20 T60,60 T80,10 T100,50" fill="none" stroke="currentColor" className="text-primary opacity-80" strokeWidth="2" vectorEffect="non-scaling-stroke" />
                 <path d="M0,85 Q10,85 20,45 T40,25 T60,65 T80,15 T100,55" fill="none" stroke="currentColor" className="text-blue-500 opacity-50" strokeWidth="2" strokeDasharray="4 4" vectorEffect="non-scaling-stroke" />
               </svg>

               <span className="text-muted-foreground font-medium z-10 bg-background/80 px-4 py-2 rounded-lg backdrop-blur-sm border border-white/5">Zone Interactive du Graphique</span>
            </div>
          </div>
        </div>

        {/* AI Coaching Sidebar */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-primary/20 bg-gradient-to-b from-primary/10 to-transparent p-6 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Target className="w-24 h-24 text-primary" />
            </div>
            <h3 className="text-lg font-bold text-foreground mb-4 relative z-10 flex items-center gap-2">
              <Zap className="w-5 h-5 text-primary" /> IA Coach
            </h3>
            <div className="space-y-4 relative z-10">
              <div className="p-3 bg-black/40 rounded-xl border border-white/5 border-l-2 border-l-red-500">
                <p className="text-sm font-semibold text-foreground">Virage 4 (Épingle)</p>
                <p className="text-xs text-muted-foreground mt-1">Freinage 5m trop tardif. Perte estimée : <span className="text-red-400 font-bold">0.12s</span></p>
              </div>
              <div className="p-3 bg-black/40 rounded-xl border border-white/5 border-l-2 border-l-green-500">
                <p className="text-sm font-semibold text-foreground">Chicane Rapide</p>
                <p className="text-xs text-muted-foreground mt-1">Excellente trajectoire ! Réaccélération anticipée validée.</p>
              </div>
              <button className="w-full py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-bold rounded-xl transition-colors shadow-[0_0_15px_rgba(249,115,22,0.4)]">
                Voir l'analyse détaillée
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-secondary/30 backdrop-blur-md p-6 shadow-xl">
            <h3 className="text-lg font-bold text-foreground mb-4">Secteurs</h3>
            <div className="space-y-3">
              {[
                { name: 'Secteur 1', time: '18.421', delta: '-0.05', color: 'text-green-500' },
                { name: 'Secteur 2', time: '21.105', delta: '+0.12', color: 'text-red-500' },
                { name: 'Secteur 3', time: '14.712', delta: '-0.22', color: 'text-purple-500' }
              ].map((sector, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-black/20 rounded-xl border border-white/5">
                  <span className="text-sm font-medium text-muted-foreground">{sector.name}</span>
                  <div className="text-right">
                    <span className="text-sm font-bold text-foreground block">{sector.time}</span>
                    <span className={`text-xs font-bold ${sector.color}`}>{sector.delta}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ icon: Icon, title, value, trend, trendColor, bgColor, iconColor }: any) => (
  <div className="p-5 rounded-2xl border border-white/10 bg-secondary/30 backdrop-blur-md shadow-xl hover:bg-white/5 transition-colors group">
    <div className="flex items-center justify-between mb-4">
      <div className={`p-3 ${bgColor} rounded-xl group-hover:scale-110 transition-transform`}>
        <Icon className={`h-5 w-5 ${iconColor}`} />
      </div>
      <TrendingUp className={`h-4 w-4 ${trendColor}`} />
    </div>
    <h3 className="font-medium text-muted-foreground text-sm mb-1">{title}</h3>
    <p className="text-2xl font-display font-bold text-foreground">{value}</p>
    <p className={`text-xs font-semibold mt-1 ${trendColor}`}>{trend}</p>
  </div>
);
