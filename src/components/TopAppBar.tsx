import React from 'react';
import { ShelterTarget } from '../types';

interface TopAppBarProps {
  currentTarget: ShelterTarget;
  onSelectTarget: (target: ShelterTarget) => void;
  onOpenSettings: () => void;
  onSync: () => void;
  isSyncing: boolean;
  estimatedCost: number;
  showCostBadge?: boolean;
  onNavigateHome: () => void;
}

export const TopAppBar: React.FC<TopAppBarProps> = ({
  currentTarget,
  onSelectTarget,
  onOpenSettings,
  onSync,
  isSyncing,
  estimatedCost,
  showCostBadge = true,
  onNavigateHome,
}) => {
  const formattedCost = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(estimatedCost);

  return (
    <header className="fixed top-0 w-full z-50 flex justify-between items-center px-4 md:px-8 h-16 bg-zinc-950/60 backdrop-blur-2xl border-b border-white/10 shadow-lg shadow-black/20">
      {/* Left: Brand + Nav */}
      <div className="flex items-center gap-6">
        <button
          onClick={onNavigateHome}
          className="text-left group flex flex-col focus:outline-none cursor-pointer"
          title="Return to Hub"
        >
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse"></div>
            <span className="font-mono-code text-[13px] font-bold text-white tracking-[0.2em] group-hover:text-indigo-300 transition-colors">
              AASHRAYA GANITH
            </span>
          </div>
          <span className="text-[10px] text-zinc-400 font-mono-code hidden sm:inline pl-4">
            THERMAL SHELTER INTELLIGENCE
          </span>
        </button>

        {/* Target Switcher */}
        <nav className="flex items-center gap-1.5 ml-2 p-1 bg-white/[0.04] backdrop-blur-xl border border-white/10 rounded-full">
          <button
            onClick={() => onSelectTarget('human')}
            className={`font-semibold text-xs md:text-sm px-3.5 py-1 rounded-full transition-all duration-200 cursor-pointer ${
              currentTarget === 'human'
                ? 'bg-gradient-to-r from-indigo-500 to-indigo-600 text-white shadow-md shadow-indigo-500/25 border border-indigo-400/30'
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
          >
            Human
          </button>
          <button
            onClick={() => onSelectTarget('livestock')}
            className={`font-semibold text-xs md:text-sm px-3.5 py-1 rounded-full transition-all duration-200 cursor-pointer ${
              currentTarget === 'livestock'
                ? 'bg-gradient-to-r from-cyan-500 to-cyan-600 text-white shadow-md shadow-cyan-500/25 border border-cyan-400/30'
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
          >
            Livestock
          </button>
        </nav>
      </div>

      {/* Center: Live Cost Estimator in Header */}
      {showCostBadge && (
        <div className="hidden md:flex items-center gap-2.5 bg-white/[0.04] backdrop-blur-xl px-4 py-1.5 rounded-full border border-white/10 shadow-inner">
          <span className="font-mono-code text-[11px] text-zinc-400 font-medium tracking-wide">
            EST. COST:
          </span>
          <span className="font-mono-code text-[13px] font-bold text-emerald-400">
            {formattedCost}
          </span>
        </div>
      )}

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        {/* Sync Trigger */}
        <button
          onClick={onSync}
          disabled={isSyncing}
          className="p-2 text-zinc-400 hover:text-white transition-colors rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 active:scale-95 cursor-pointer backdrop-blur-lg"
          title="Synchronize Climate & Thermal Solver"
        >
          <span className={`material-symbols-outlined text-[18px] ${isSyncing ? 'animate-spin text-indigo-400' : ''}`}>
            sync
          </span>
        </button>

        {/* Settings Trigger */}
        <button
          onClick={onOpenSettings}
          className="p-2 text-zinc-400 hover:text-white transition-colors rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 active:scale-95 cursor-pointer backdrop-blur-lg"
          title="System Settings"
        >
          <span className="material-symbols-outlined text-[18px]">
            settings
          </span>
        </button>

        {/* AI Operator Avatar */}
        <div className="w-8 h-8 rounded-full bg-white/[0.08] border border-indigo-400/50 shadow-md shadow-indigo-500/20 overflow-hidden flex items-center justify-center relative group cursor-pointer">
          <img
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuDOX35edScX7_zVZRE2NWoukPGE7CEgE4RKEjti_BGL0CcX4tcAWA11rbCF6YfLVA4I3KVGfrVM0n_AePBvNVglUuwiFTXbxcrS0U3HjSUpEzLW0Gtby_OZ9hpTWg37zJq9A4MhbMBhVEskGan0in7p-l1y4-DScbjpR5aQsdWa8ZQjIv2nEiMHi69UNg_BdUftlUNVsF0JCBEqAxpE4vvebc6dvKPM9ziDM9KTO9V-AVb_33fhchU0"
            alt="AI Operator Avatar"
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
          <span className="material-symbols-outlined text-sm text-indigo-400 absolute">person</span>
          <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-400 ring-1 ring-zinc-950"></span>
        </div>
      </div>
    </header>
  );
};
