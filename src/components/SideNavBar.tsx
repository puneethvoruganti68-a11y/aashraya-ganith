import React from 'react';
import { AppView } from '../types';

interface SideNavBarProps {
  currentView: AppView;
  onNavigate: (view: AppView) => void;
  onRunSimulation: () => void;
  isSimulating: boolean;
  onOpenHelp: () => void;
  onOpenLogs: () => void;
}

export const SideNavBar: React.FC<SideNavBarProps> = ({
  currentView,
  onNavigate,
  onRunSimulation,
  isSimulating,
  onOpenHelp,
  onOpenLogs,
}) => {
  return (
    <aside className="fixed left-0 top-16 bottom-8 flex flex-col z-30 w-64 bg-zinc-950/50 backdrop-blur-2xl border-r border-white/10 hidden md:flex shadow-2xl shadow-black/40">
      {/* Header section */}
      <div className="p-4 border-b border-white/10">
        <div className="font-mono-code text-[11px] font-bold text-indigo-400 tracking-widest uppercase mb-1 flex items-center justify-between">
          <span>WHAT-IF ENGINE</span>
          <span className="text-[9px] bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded border border-indigo-400/30 font-semibold">AI CORE</span>
        </div>
        <div className="font-mono-code text-zinc-400 text-[11px] flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>V2.4 Active · Solver Online</span>
        </div>
      </div>

      {/* Nav Menu */}
      <nav className="flex-1 p-3 flex flex-col gap-1.5 overflow-y-auto">
        <button
          onClick={() => onNavigate('simulator')}
          className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-mono-code text-[13px] text-left transition-all duration-200 cursor-pointer ${
            currentView === 'simulator'
              ? 'text-white bg-gradient-to-r from-indigo-600/80 to-purple-600/80 border border-indigo-400/30 shadow-lg shadow-indigo-500/20 font-semibold'
              : 'text-zinc-400 hover:text-white hover:bg-white/[0.05] border border-transparent'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">model_training</span>
          <span>Simulator</span>
        </button>

        <button
          onClick={() => onNavigate('climate')}
          className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-mono-code text-[13px] text-left transition-all duration-200 cursor-pointer ${
            currentView === 'climate'
              ? 'text-white bg-gradient-to-r from-indigo-600/80 to-purple-600/80 border border-indigo-400/30 shadow-lg shadow-indigo-500/20 font-semibold'
              : 'text-zinc-400 hover:text-white hover:bg-white/[0.05] border border-transparent'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">thermostat</span>
          <span>Thermal Map</span>
        </button>

        <button
          onClick={() => onNavigate('grid')}
          className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-mono-code text-[13px] text-left transition-all duration-200 cursor-pointer ${
            currentView === 'grid'
              ? 'text-white bg-gradient-to-r from-indigo-600/80 to-purple-600/80 border border-indigo-400/30 shadow-lg shadow-indigo-500/20 font-semibold'
              : 'text-zinc-400 hover:text-white hover:bg-white/[0.05] border border-transparent'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">grid_view</span>
          <span>Grid Config</span>
        </button>

        <button
          onClick={() => onNavigate('streams')}
          className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-mono-code text-[13px] text-left transition-all duration-200 cursor-pointer ${
            currentView === 'streams'
              ? 'text-white bg-gradient-to-r from-indigo-600/80 to-purple-600/80 border border-indigo-400/30 shadow-lg shadow-indigo-500/20 font-semibold'
              : 'text-zinc-400 hover:text-white hover:bg-white/[0.05] border border-transparent'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">lan</span>
          <span>Data Streams</span>
        </button>

        <button
          onClick={() => onNavigate('history')}
          className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-mono-code text-[13px] text-left transition-all duration-200 cursor-pointer ${
            currentView === 'history'
              ? 'text-white bg-gradient-to-r from-indigo-600/80 to-purple-600/80 border border-indigo-400/30 shadow-lg shadow-indigo-500/20 font-semibold'
              : 'text-zinc-400 hover:text-white hover:bg-white/[0.05] border border-transparent'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">history</span>
          <span>History</span>
        </button>
      </nav>

      {/* Bottom Actions */}
      <div className="p-4 border-t border-white/10 flex flex-col gap-3 bg-white/[0.02] backdrop-blur-lg">
        <button
          onClick={onRunSimulation}
          disabled={isSimulating}
          className="w-full py-2.5 px-3 bg-gradient-to-r from-indigo-500 via-indigo-600 to-purple-600 text-white font-mono-code text-[12px] font-bold tracking-wider rounded-xl border border-indigo-400/40 hover:from-indigo-400 hover:to-purple-500 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-indigo-500/25 disabled:opacity-50"
        >
          <span className={`material-symbols-outlined text-[16px] ${isSimulating ? 'animate-spin' : ''}`}>
            {isSimulating ? 'refresh' : 'play_arrow'}
          </span>
          {isSimulating ? 'COMPUTING...' : 'Run Simulation'}
        </button>

        <div className="flex justify-between items-center px-1">
          <button
            onClick={onOpenHelp}
            className="text-zinc-400 hover:text-indigo-300 flex items-center gap-1 font-mono-code text-[11px] transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[14px]">help</span> Help
          </button>
          <button
            onClick={onOpenLogs}
            className="text-zinc-400 hover:text-indigo-300 flex items-center gap-1 font-mono-code text-[11px] transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[14px]">terminal</span> Logs
          </button>
        </div>
      </div>
    </aside>
  );
};
