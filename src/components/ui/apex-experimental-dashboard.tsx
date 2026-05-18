import React, { useState, useEffect } from "react";
import {
  Search, Moon, Sun, MessageSquare, Bell, LayoutDashboard, 
  Settings, LogOut, ChevronLeft, ChevronRight, Copy, 
  MoreHorizontal, CheckCircle2, Activity, Timer, 
  Car, Wrench, Flag, BarChart3, Trophy, LineChart
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
      <div className="flex w-full bg-gray-50 dark:bg-[#0A0A0A] text-gray-900 dark:text-gray-100 font-sans">
        <Sidebar />
        <MainContent isDark={isDark} setIsDark={setIsDark} />
      </div>
    </div>
  );
};

const Sidebar = () => {
  const [open, setOpen] = useState(true);
  const [selected, setSelected] = useState("Session Overview");

  return (
    <nav className={`sticky top-0 h-screen shrink-0 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-[#0A0A0A] flex flex-col transition-all duration-300 ${open ? 'w-64' : 'w-20'}`}>
      {/* Logo Area */}
      <div className="h-16 flex items-center px-4 border-b border-gray-200 dark:border-gray-800 justify-between">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-8 h-8 rounded bg-primary flex items-center justify-center shrink-0">
            <Flag className="w-5 h-5 text-white" />
          </div>
          {open && (
            <div className="flex flex-col">
              <span className="font-semibold text-sm leading-tight text-foreground">Apex AI</span>
              <span className="text-xs text-muted-foreground">Racing Studio</span>
            </div>
          )}
        </div>
        <button onClick={() => setOpen(!open)} className="text-gray-500 hover:text-gray-900 dark:hover:text-white">
          {open ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
        <div>
          {open && <p className="text-xs font-medium text-gray-500 mb-2 px-2">Main Menu</p>}
          <div className="space-y-1">
            <NavItem Icon={LayoutDashboard} title="Dashboard" open={open} selected={selected} setSelected={setSelected} />
            <NavItem Icon={Car} title="My Garage" open={open} selected={selected} setSelected={setSelected} />
            <NavItem Icon={Wrench} title="Setups & Tunes" open={open} selected={selected} setSelected={setSelected} />
            <NavItem Icon={Trophy} title="Championships" open={open} selected={selected} setSelected={setSelected} />
          </div>
        </div>

        <div>
          {open && <p className="text-xs font-medium text-gray-500 mb-2 px-2">Performance Analytics</p>}
          <div className="space-y-1">
            <NavItem Icon={Activity} title="Session Overview" selected={selected} setSelected={setSelected} open={open} />
            {open && selected === "Session Overview" && (
              <div className="ml-9 space-y-2 mt-2 mb-2 border-l border-gray-200 dark:border-gray-800 pl-4">
                <div className="flex items-center gap-2 text-sm text-primary cursor-pointer"><div className="w-2 h-2 rounded-full bg-primary"></div> GT3 Class</div>
                <div className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 dark:hover:text-white cursor-pointer"><div className="w-2 h-2 rounded-full bg-blue-500"></div> Formula 4</div>
              </div>
            )}
            <NavItem Icon={Timer} title="Lap Times" open={open} selected={selected} setSelected={setSelected} />
            <NavItem Icon={LineChart} title="Telemetry Data" open={open} selected={selected} setSelected={setSelected} />
            <NavItem Icon={BarChart3} title="AI Feedback" open={open} selected={selected} setSelected={setSelected} />
          </div>
        </div>
      </div>

      {/* Bottom Actions */}
      <div className="p-3 border-t border-gray-200 dark:border-gray-800 space-y-1">
        <NavItem Icon={Settings} title="Settings" open={open} selected={selected} setSelected={setSelected} />
        
        {/* Profile */}
        <div className="mt-4 flex items-center justify-between p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-900 cursor-pointer">
          <div className="flex items-center gap-3 overflow-hidden">
            <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces" alt="Driver" className="w-8 h-8 rounded-full shrink-0" />
            {open && (
              <div className="flex flex-col truncate">
                <span className="text-sm font-medium">Driver Name</span>
                <span className="text-xs text-gray-500 truncate">Pro License</span>
              </div>
            )}
          </div>
          {open && <LogOut className="w-4 h-4 text-gray-500" />}
        </div>
      </div>
    </nav>
  );
};

const NavItem = ({ Icon, title, selected, setSelected, open }: { Icon: any, title: string, selected?: string, setSelected: (v: string) => void, open: boolean }) => {
  const isSelected = selected === title;
  return (
    <button onClick={() => setSelected(title)} className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${isSelected ? 'bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-900/50'}`}>
      <Icon className="w-5 h-5 shrink-0" />
      {open && <span className="text-sm font-medium whitespace-nowrap">{title}</span>}
    </button>
  );
};

const MainContent = ({ isDark, setIsDark }: { isDark: boolean, setIsDark: (v: boolean) => void }) => {
  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden">
      {/* Top Header */}
      <header className="h-16 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-6 shrink-0">
        <div className="relative w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search telemetry, tracks or setups..." 
            className="w-full bg-gray-100 dark:bg-[#141414] border-none rounded-full pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary text-gray-900 dark:text-white"
          />
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center bg-gray-100 dark:bg-[#141414] rounded-full p-1">
            <button onClick={() => setIsDark(false)} className={`p-1.5 rounded-full ${!isDark ? 'bg-white shadow text-gray-900' : 'text-gray-500'}`}><Sun className="w-4 h-4" /></button>
            <button onClick={() => setIsDark(true)} className={`p-1.5 rounded-full ${isDark ? 'bg-gray-800 shadow text-white' : 'text-gray-500'}`}><Moon className="w-4 h-4" /></button>
          </div>
          <button className="w-9 h-9 flex items-center justify-center rounded-full border border-gray-200 dark:border-gray-800 text-gray-500 hover:text-gray-900 dark:hover:text-white"><Bell className="w-4 h-4" /></button>
        </div>
      </header>

      {/* Main Scrollable Area */}
      <main className="flex-1 overflow-y-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
              <Car className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-xl font-bold">Ferrari 296 GT3 <span className="text-gray-500 font-normal text-base">(iRacing)</span></h1>
            <Copy className="w-4 h-4 text-gray-400 cursor-pointer" />
          </div>
          <select className="bg-gray-100 dark:bg-[#141414] border border-gray-200 dark:border-gray-800 rounded-lg px-4 py-2 text-sm focus:outline-none">
            <option>Spa-Francorchamps</option>
            <option>Monza</option>
            <option>Nürburgring</option>
          </select>
        </div>

        {/* Tags */}
        <div className="flex gap-2 mb-8">
          {["Dry Track", "Track Temp: 32°C", "Sprint Setup", "# Personal Best"].map(tag => (
            <span key={tag} className="px-3 py-1.5 rounded-md border border-gray-200 dark:border-gray-800 text-xs text-gray-600 dark:text-gray-400 bg-white dark:bg-[#141414] hover:bg-gray-50 dark:hover:bg-gray-900 cursor-pointer flex items-center gap-1">
               {tag === "Dry Track" && <CheckCircle2 className="w-3 h-3 text-green-500" />} {tag}
            </span>
          ))}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {/* Pace Card */}
          <div className="p-5 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#141414]">
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-semibold text-lg">Pace Overview</h2>
              <button className="text-xs text-gray-500 hover:text-gray-900 dark:hover:text-white flex items-center gap-1">Details <ChevronRight className="w-3 h-3" /></button>
            </div>
            <div className="space-y-5">
              <div>
                <p className="text-xs text-gray-500 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-gray-400"></span> Best Lap</p>
                <div className="flex justify-between items-end mt-1">
                  <div>
                    <p className="text-2xl font-bold">2:15.876 <span className="text-sm font-normal text-gray-500">s</span></p>
                    <p className="text-xs text-green-500">-0.243s from optimal</p>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                   <p className="text-xs text-gray-500 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-gray-400"></span> Consistency</p>
                   <p className="text-xl font-bold mt-1">94.2%</p>
                </div>
                <div>
                   <div className="h-10 w-full bg-gradient-to-t from-green-500/10 to-transparent flex items-end">
                      <svg className="w-full h-6" viewBox="0 0 100 20" preserveAspectRatio="none"><path d="M0,20 L10,15 L20,18 L30,5 L40,10 L50,2 L60,8 L70,1 L80,12 L90,4 L100,0" fill="none" stroke="#22c55e" strokeWidth="2"/></svg>
                   </div>
                </div>
              </div>
            </div>
          </div>

          {/* Setup Card */}
          <div className="p-5 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#141414]">
             <div className="flex justify-between items-center mb-6">
              <h2 className="font-semibold text-lg">Current Setup</h2>
              <button className="text-xs text-gray-500 hover:text-gray-900 dark:hover:text-white flex items-center gap-1">Edit Setup <ChevronRight className="w-3 h-3" /></button>
            </div>
            <div className="space-y-5">
              <div>
                <p className="text-xs text-gray-500 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-gray-400"></span> Aero Balance</p>
                <div className="flex justify-between items-end mt-1">
                  <div>
                    <p className="text-xl font-bold">48.5% <span className="text-sm font-normal text-gray-500">Front</span></p>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                   <p className="text-xs text-gray-500 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-gray-400"></span> Tire Pressures</p>
                   <p className="text-sm font-bold mt-1">26.5 psi (Avg)</p>
                   <p className="text-xs text-green-500">Optimal</p>
                </div>
              </div>
            </div>
          </div>

          {/* AI Info Card */}
          <div className="flex flex-col gap-4">
             <div className="flex-1 p-5 rounded-xl border border-gray-200 dark:border-gray-800 bg-gradient-to-br from-primary/20 to-orange-900/20 relative overflow-hidden flex flex-col justify-between">
                <div className="absolute right-0 top-0 w-32 h-32 bg-primary/10 blur-3xl rounded-full"></div>
                <div className="flex justify-between items-start">
                   <Activity className="w-6 h-6 text-primary" />
                   <button className="bg-white text-gray-900 text-xs font-semibold px-3 py-1.5 rounded-full shadow-lg">View AI Insights</button>
                </div>
                <div className="mt-6">
                  <h3 className="font-semibold text-sm">Apex AI Coaching</h3>
                  <p className="text-xs text-gray-500 mt-1 leading-relaxed">Braking point at Turn 1 is 15m too early. You can carry 5km/h more minimum speed through Pouhon.</p>
                </div>
             </div>
          </div>
        </div>

        {/* Data Tabs section */}
        <div className="border-b border-gray-200 dark:border-gray-800 mb-6 flex gap-6 overflow-x-auto hide-scrollbar">
          {["Sectors", "Telemetry", "Setup Notes", "Tire Degradation", "Fuel Calculator"].map(tab => (
            <button 
              key={tab} 
              className={`pb-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${tab === "Telemetry" ? "border-primary text-gray-900 dark:text-white" : "border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"}`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Telemetry Placeholder Content */}
        <div className="p-6 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#141414] flex items-center justify-center min-h-[300px]">
           <p className="text-gray-500">Telemetry charts integration goes here (Throttle, Brake, Steering, Speed traces).</p>
        </div>
      </main>
    </div>
  );
};

export default ApexDashboard;
