import React, { useState } from 'react';
import { ShelterTarget } from '../types';

interface LandingHeroViewProps {
  onSelectTarget: (target: ShelterTarget) => void;
  onProceedToClimate: () => void;
}

export const LandingHeroView: React.FC<LandingHeroViewProps> = ({
  onSelectTarget,
  onProceedToClimate,
}) => {
  const [activeHotspot, setActiveHotspot] = useState<string | null>(null);

  const handleSelect = (target: ShelterTarget) => {
    onSelectTarget(target);
    onProceedToClimate();
  };

  return (
    <div className="flex flex-col items-center justify-center pt-24 pb-20 px-4 md:px-8 max-w-6xl mx-auto w-full relative z-10">
      {/* Hero Header */}
      <div className="text-center max-w-4xl mx-auto mb-10 relative z-10">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-indigo-400/30 bg-indigo-500/10 text-indigo-300 font-mono-code text-[12px] font-medium mb-5 backdrop-blur-xl shadow-lg shadow-indigo-500/10">
          <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse"></span>
          <span>AI-Powered Thermal Architecture</span>
        </div>

        <h1 className="text-4xl sm:text-6xl md:text-[56px] font-extrabold text-white tracking-tight leading-[1.1] mb-5">
          Design for the Climate,<br />
          <span className="bg-gradient-to-r from-indigo-300 via-purple-300 to-pink-300 bg-clip-text text-transparent">
            Not Against It.
          </span>
        </h1>

        <p className="text-base sm:text-lg text-zinc-300 max-w-2xl mx-auto font-normal leading-relaxed">
          Autonomous vernacular intelligence and thermodynamic simulation for extreme climate human and livestock habitats.
        </p>
      </div>

      {/* Visual Hero Element (Frosted Glass Diagnostic Showcase) */}
      <div className="w-full max-w-5xl h-[340px] sm:h-[420px] mb-12 relative group">
        <div className="absolute inset-0 rounded-2xl overflow-hidden glass-panel flex items-center justify-center border border-white/15 shadow-2xl shadow-black/50">
          {/* Main Hotlinked Graphic */}
          <div
            className="bg-cover bg-center w-full h-full opacity-60 mix-blend-screen transition-transform duration-700 group-hover:scale-[1.02]"
            style={{
              backgroundImage: `url('https://lh3.googleusercontent.com/aida-public/AB6AXuCLfSU7JTuIfIOKsWOq3-bUpAIwLFznEakvb7IYcbi42GRP_MYfV8yu8P2OH1hCDQkGdDAXTMWTZAGaq6WnOZm_uOCB7VVu90W4bRe696Wqcr-xPgmdDJvFfN8W-dTa2lfyZiVC4IPGxDfQHYHS3Mw-ijSYJIAxfYkdr2srTnbrPWl4KWDg1PG4ylnNyMoBicsk6SfeP3lE771vPQv5mIP5fWEFLXOnO7pIFFpSQ5zDYhH71r8tJBkI')`,
            }}
          />

          {/* Technical Accents & Overlays */}
          <div className="absolute inset-0 border border-white/10 rounded-2xl pointer-events-none"></div>

          {/* Top Left Diagnostic Badge */}
          <div className="absolute top-4 left-4 font-mono-code text-[12px] text-cyan-300 flex items-center gap-2 bg-zinc-950/70 px-3 py-1.5 rounded-full border border-cyan-500/30 backdrop-blur-xl shadow-lg">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping"></span>
            THERMAL_DIAGNOSTIC_V2
          </div>

          {/* Bottom Right Solar Irradiance Badge */}
          <div className="absolute bottom-4 right-4 font-mono-code text-[12px] text-amber-300 flex items-center gap-2 bg-zinc-950/70 px-3 py-1.5 rounded-full border border-amber-500/30 backdrop-blur-xl shadow-lg">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
            SOLAR_IRRADIANCE_MAPPED
          </div>

          {/* Interactive Inspection Nodes */}
          <div className="absolute top-1/3 left-1/4">
            <button
              onClick={() => setActiveHotspot(activeHotspot === 'airflow' ? null : 'airflow')}
              className="relative p-1.5 rounded-full bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/40 border border-cyan-400/60 transition-all cursor-pointer backdrop-blur-md shadow-lg shadow-cyan-500/20"
              title="Inspect Laminar Airflow Vector"
            >
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 block animate-pulse"></span>
            </button>
            {activeHotspot === 'airflow' && (
              <div className="absolute left-7 top-0 w-52 p-3 bg-zinc-950/90 border border-cyan-400/40 rounded-xl text-[11px] font-mono-code text-cyan-300 backdrop-blur-2xl z-20 shadow-2xl">
                <div className="font-bold text-white mb-1 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
                  LAMINAR AIRFLOW
                </div>
                <div className="text-zinc-300 leading-relaxed">Velocity: 1.8 m/s at eaves. Aerodynamic lift pressure: -14 Pa.</div>
              </div>
            )}
          </div>

          <div className="absolute top-1/4 right-1/3">
            <button
              onClick={() => setActiveHotspot(activeHotspot === 'solar' ? null : 'solar')}
              className="relative p-1.5 rounded-full bg-amber-500/20 text-amber-400 hover:bg-amber-500/40 border border-amber-400/60 transition-all cursor-pointer backdrop-blur-md shadow-lg shadow-amber-500/20"
              title="Inspect Direct Solar Flux"
            >
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 block animate-pulse"></span>
            </button>
            {activeHotspot === 'solar' && (
              <div className="absolute right-7 top-0 w-52 p-3 bg-zinc-950/90 border border-amber-400/40 rounded-xl text-[11px] font-mono-code text-amber-300 backdrop-blur-2xl z-20 shadow-2xl">
                <div className="font-bold text-white mb-1 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                  DIRECT SOLAR GAIN
                </div>
                <div className="text-zinc-300 leading-relaxed">Peak Incident: 950 W/m². Roof temperature gradient: +14.2°C uninsulated.</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl relative z-10">
        {/* Human Shelter Card */}
        <button
          onClick={() => handleSelect('human')}
          className="group glass-panel rounded-2xl p-7 text-left transition-all duration-300 hover:border-indigo-400/50 hover:bg-white/[0.08] relative overflow-hidden cursor-pointer shadow-2xl hover:shadow-indigo-500/20"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="flex justify-between items-start mb-6">
            <div className="p-3 rounded-xl bg-white/[0.06] border border-white/10 text-indigo-400 group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-3xl">
                home
              </span>
            </div>
            <span className="material-symbols-outlined text-zinc-400 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0 text-indigo-400">
              arrow_forward
            </span>
          </div>
          <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-indigo-300 transition-colors">
            Human Thermal Shelter
          </h3>
          <p className="text-sm text-zinc-300 leading-relaxed mb-4">
            Optimize habitation structures for extreme climate resilience, vernacular passive cooling, and thermal efficiency.
          </p>
          <div className="pt-3 border-t border-white/10 flex items-center justify-between font-mono-code text-[11px] text-zinc-400 group-hover:text-zinc-300">
            <span>PHYSIOLOGICAL COMFORT</span>
            <span className="text-indigo-400 font-semibold group-hover:translate-x-1 transition-transform">OPEN SOLVER &rarr;</span>
          </div>
        </button>

        {/* Livestock Shelter Card */}
        <button
          onClick={() => handleSelect('livestock')}
          className="group glass-panel rounded-2xl p-7 text-left transition-all duration-300 hover:border-cyan-400/50 hover:bg-white/[0.08] relative overflow-hidden cursor-pointer shadow-2xl hover:shadow-cyan-500/20"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="flex justify-between items-start mb-6">
            <div className="p-3 rounded-xl bg-white/[0.06] border border-white/10 text-cyan-400 group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-3xl">
                agriculture
              </span>
            </div>
            <span className="material-symbols-outlined text-zinc-400 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0 text-cyan-400">
              arrow_forward
            </span>
          </div>
          <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-cyan-300 transition-colors">
            Livestock Shelter
          </h3>
          <p className="text-sm text-zinc-300 leading-relaxed mb-4">
            Configure agricultural enclosures for optimal herd microclimates, cross-ventilation, and heat stress mitigation.
          </p>
          <div className="pt-3 border-t border-white/10 flex items-center justify-between font-mono-code text-[11px] text-zinc-400 group-hover:text-zinc-300">
            <span>HERD THI MICROCLIMATE</span>
            <span className="text-cyan-400 font-semibold group-hover:translate-x-1 transition-transform">OPEN SOLVER &rarr;</span>
          </div>
        </button>
      </div>
    </div>
  );
};
