import React, { useState, useEffect } from 'react';
import { ClimateRegion, RecommendationOption, ShelterTarget, SimulationResult } from '../types';

interface IntelligenceCoreViewProps {
  currentTarget: ShelterTarget;
  currentRegion: ClimateRegion;
  recommendations: RecommendationOption[];
  onToggleRecommendation: (id: string) => void;
  simulationResult: SimulationResult;
  onRunSimulation: () => void;
  isSimulating: boolean;
  wallThickness: number;
  setWallThickness: (val: number) => void;
  eaveOverhang: number;
  setEaveOverhang: (val: number) => void;
  ventilationRatio: number;
  setVentilationRatio: (val: number) => void;
  roofPitchAngle: number;
  setRoofPitchAngle: (val: number) => void;
}

export const IntelligenceCoreView: React.FC<IntelligenceCoreViewProps> = ({
  currentTarget,
  currentRegion,
  recommendations,
  onToggleRecommendation,
  simulationResult,
  onRunSimulation,
  isSimulating,
  wallThickness,
  setWallThickness,
  eaveOverhang,
  setEaveOverhang,
  ventilationRatio,
  setVentilationRatio,
  roofPitchAngle,
  setRoofPitchAngle,
}) => {
  const [rotationAngle, setRotationAngle] = useState(0);
  const [isAutoSpinning, setIsAutoSpinning] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [activeLayer, setActiveLayer] = useState<'thermal' | 'wireframe' | 'airflow'>('thermal');
  const [selectedProbe, setSelectedProbe] = useState<'roof' | 'living' | 'eaves' | null>('roof');

  // Auto-spin animation effect
  useEffect(() => {
    let interval: any;
    if (isAutoSpinning) {
      interval = setInterval(() => {
        setRotationAngle((prev) => (prev + 1) % 360);
      }, 40);
    }
    return () => clearInterval(interval);
  }, [isAutoSpinning]);

  const handleRotateStep = () => {
    setRotationAngle((prev) => (prev + 45) % 360);
  };

  const handleZoomToggle = () => {
    setZoomLevel((prev) => (prev === 1 ? 1.25 : prev === 1.25 ? 1.5 : 1));
  };

  // Calculate live probe values based on insulation and parameters
  const baseRoofTemp = Math.round(currentRegion.coreTemp + 12 - (simulationResult.tempReduction * 0.8));
  const livingZoneTemp = simulationResult.internalPeakTemp;
  const eaveIntakeTemp = Math.round(currentRegion.coreTemp - 2.5);

  return (
    <div className="pt-20 pb-20 px-3 sm:px-6 max-w-[1600px] mx-auto w-full min-h-[calc(100vh-6rem)] flex flex-col relative z-10">
      {/* Top Context Subhead */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="font-mono-code text-[12px] text-indigo-400 font-bold bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-400/30">
            INTELLIGENCE CORE &bull; {currentTarget.toUpperCase()} ENCLOSURE
          </span>
          <span className="text-zinc-500 font-mono-code text-[12px]">|</span>
          <span className="text-zinc-300 font-mono-code text-[12px]">
            {currentRegion.name} ({currentRegion.coordinates})
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-mono-code text-[11px] text-cyan-300 bg-cyan-500/10 px-3 py-1 rounded-full border border-cyan-500/30 backdrop-blur-xl">
            DIURNAL DAMPING: {simulationResult.thermalDamping}%
          </span>
          <span className="font-mono-code text-[11px] text-emerald-300 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/30 backdrop-blur-xl">
            COMFORT: {simulationResult.comfortHoursPerDay} HRS/DAY
          </span>
        </div>
      </div>

      {/* Main 3-Column Studio Layout */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Column: AI Recommendations (3 cols) */}
        <div className="lg:col-span-3 flex flex-col gap-3 max-h-[calc(100vh-12rem)] overflow-y-auto pr-1">
          <div className="glass-panel p-5 rounded-2xl flex flex-col gap-3 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
              <span className="font-mono-code text-[11px] font-bold text-indigo-300 tracking-widest uppercase flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse"></span>
                AI RECOMMENDATIONS
              </span>
              <span className="material-symbols-outlined text-indigo-400 text-[18px]">psychology</span>
            </div>

            <div className="text-[11px] text-zinc-300 font-mono-code">
              Toggle passive architectural interventions to calculate thermodynamic impact:
            </div>

            {/* Recommendation Cards List */}
            <div className="space-y-2.5">
              {recommendations.map((rec) => (
                <div
                  key={rec.id}
                  onClick={() => onToggleRecommendation(rec.id)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer select-none ${
                    rec.isActive
                      ? 'border-indigo-400/50 bg-indigo-600/15 shadow-lg shadow-indigo-500/10'
                      : 'border-white/10 bg-white/[0.03] hover:bg-white/[0.06] hover:border-white/20 opacity-80'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <div className="font-mono-code text-[12px] font-semibold text-white leading-tight">
                      {rec.title}
                    </div>
                    <div
                      className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold border transition-colors ${
                        rec.isActive
                          ? 'bg-indigo-500 text-white border-indigo-400 shadow-sm'
                          : 'border-zinc-600 text-transparent'
                      }`}
                    >
                      ✓
                    </div>
                  </div>

                  <p className="text-[11px] text-zinc-300 mb-2.5 leading-relaxed font-sans">
                    {rec.description}
                  </p>

                  <div className="flex justify-between items-center text-[11px] font-mono-code pt-2 border-t border-white/10">
                    <div className="flex items-center gap-1">
                      <span className="text-zinc-400">Cost:</span>
                      <span className={rec.costImpact >= 0 ? 'text-rose-300' : 'text-emerald-300'}>
                        {rec.costImpactFormatted}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-zinc-400">Benefit:</span>
                      <span className="text-cyan-300 font-bold">{rec.benefit}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Preset Action */}
            <button
              onClick={onRunSimulation}
              disabled={isSimulating}
              className="w-full mt-2 py-2.5 px-3 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 text-indigo-300 font-mono-code text-[11px] font-bold rounded-xl border border-indigo-400/40 hover:bg-indigo-500/30 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-indigo-500/10"
            >
              <span className={`material-symbols-outlined text-[16px] ${isSimulating ? 'animate-spin text-indigo-400' : ''}`}>
                sync
              </span>
              RE-SOLVE THERMAL FLUX
            </button>
          </div>
        </div>

        {/* Center Column: 3D Model Canvas & Visualizer (6 cols) */}
        <div className="lg:col-span-6 flex flex-col gap-3">
          <div className="glass-panel rounded-2xl relative h-[480px] sm:h-[560px] flex items-center justify-center overflow-hidden border border-white/15 shadow-2xl">
            {/* Top Canvas Badges */}
            <div className="absolute top-4 left-4 z-20 flex flex-wrap gap-2">
              <span className="bg-zinc-950/70 backdrop-blur-xl px-3 py-1 rounded-full font-mono-code text-[11px] text-zinc-300 border border-white/15 shadow-lg tracking-wider">
                THERMAL MAP
              </span>
              <span className="bg-zinc-950/70 backdrop-blur-xl px-3 py-1 rounded-full font-mono-code text-[11px] text-rose-300 border border-rose-500/30 flex items-center gap-1.5 shadow-lg tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse"></span>
                HEAT STRESS ZONE DETECTED
              </span>
            </div>

            {/* Top Right Active Layer Switcher */}
            <div className="absolute top-4 right-4 z-20 flex gap-1 bg-zinc-950/80 p-1.5 rounded-full border border-white/15 backdrop-blur-2xl shadow-lg">
              <button
                onClick={() => setActiveLayer('thermal')}
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono-code transition-colors cursor-pointer ${
                  activeLayer === 'thermal' ? 'bg-indigo-600 text-white font-bold shadow-sm' : 'text-zinc-400 hover:text-white'
                }`}
              >
                Thermal
              </button>
              <button
                onClick={() => setActiveLayer('wireframe')}
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono-code transition-colors cursor-pointer ${
                  activeLayer === 'wireframe' ? 'bg-cyan-600 text-white font-bold shadow-sm' : 'text-zinc-400 hover:text-white'
                }`}
              >
                Mesh
              </button>
              <button
                onClick={() => setActiveLayer('airflow')}
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono-code transition-colors cursor-pointer ${
                  activeLayer === 'airflow' ? 'bg-amber-600 text-white font-bold shadow-sm' : 'text-zinc-400 hover:text-white'
                }`}
              >
                Airflow
              </button>
            </div>

            {/* 3D Conceptual Model Graphic */}
            <div
              className="w-full h-full relative transition-all duration-300 flex items-center justify-center"
              style={{
                transform: `rotateY(${rotationAngle}deg) scale(${zoomLevel})`,
                transition: isAutoSpinning ? 'none' : 'transform 0.4s ease-out',
              }}
            >
              <img
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuC2M28KiWt0-UL1_kBcM43PRGgVJYoUle9eTwmu9-4qsNVRHhwm3hKequBFaos6Nu3I9FfGkB9wt_6WnlwrmYHG0yM9ybHvaQNhn3u5e1XomimljOcB5PMNImGOf0BOhNkBiJspJ1JoTuPgJIFVJRy1WKtIrys4mU9EYEPQXe17rcZvlwc8HV_P0xKRB-dUQ-l3--G0SsSYw3vjvwI91puG2QIznH2rAlvOT_dtG-V-HhUyVjyvssRC"
                alt="Shelter Thermal Wireframe"
                className="w-full h-full object-cover select-none pointer-events-none opacity-85 mix-blend-screen"
                referrerPolicy="no-referrer"
              />

              {/* Wireframe overlay particles / grid lines */}
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-zinc-950/40 pointer-events-none"></div>

              {/* Interactive Thermal Probes overlaid on 3D Model */}
              {activeLayer === 'thermal' && (
                <>
                  {/* Roof Ridge Probe */}
                  <div
                    onClick={() => setSelectedProbe('roof')}
                    className="absolute top-[22%] left-[48%] -translate-x-1/2 -translate-y-1/2 group cursor-pointer z-10"
                  >
                    <div className="w-6 h-6 rounded-full bg-rose-500/30 border-2 border-rose-500 flex items-center justify-center animate-ping absolute"></div>
                    <div className="w-5 h-5 rounded-full bg-rose-500 border-2 border-white flex items-center justify-center relative shadow-lg">
                      <span className="text-[9px] font-bold text-white">R</span>
                    </div>
                    <div className="absolute left-7 -top-2 bg-zinc-950/95 border border-rose-500/40 rounded-xl px-2.5 py-1 text-[10px] font-mono-code text-rose-300 whitespace-nowrap shadow-2xl backdrop-blur-xl">
                      Roof Peak: <strong className="text-white">{baseRoofTemp}°C</strong>
                    </div>
                  </div>

                  {/* Living Core Probe */}
                  <div
                    onClick={() => setSelectedProbe('living')}
                    className="absolute top-[58%] left-[50%] -translate-x-1/2 -translate-y-1/2 group cursor-pointer z-10"
                  >
                    <div className="w-5 h-5 rounded-full bg-cyan-500 border-2 border-white flex items-center justify-center relative shadow-lg">
                      <span className="text-[9px] font-bold text-zinc-950">L</span>
                    </div>
                    <div className="absolute left-7 -top-2 bg-zinc-950/95 border border-cyan-500/40 rounded-xl px-2.5 py-1 text-[10px] font-mono-code text-cyan-300 whitespace-nowrap shadow-2xl backdrop-blur-xl">
                      Habitation Core: <strong className="text-white">{livingZoneTemp}°C</strong>
                    </div>
                  </div>

                  {/* Eave Perimeter Intake */}
                  <div
                    onClick={() => setSelectedProbe('eaves')}
                    className="absolute top-[75%] left-[32%] -translate-x-1/2 -translate-y-1/2 group cursor-pointer z-10"
                  >
                    <div className="w-4 h-4 rounded-full bg-emerald-400 border border-white flex items-center justify-center relative shadow-lg"></div>
                    <div className="absolute -left-28 top-3 bg-zinc-950/95 border border-emerald-400/40 rounded-xl px-2.5 py-1 text-[10px] font-mono-code text-emerald-300 whitespace-nowrap shadow-2xl backdrop-blur-xl">
                      Intake: <strong className="text-white">{eaveIntakeTemp}°C</strong>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* View Controls Floating Bar */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center gap-2.5 glass-panel px-3.5 py-1.5 rounded-full z-20 border border-white/15 shadow-2xl backdrop-blur-2xl">
              <button
                onClick={handleRotateStep}
                className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center hover:bg-white/[0.08] hover:text-white text-zinc-300 transition-colors cursor-pointer"
                title="Rotate 45°"
              >
                <span className="material-symbols-outlined text-[18px]">rotate_left</span>
              </button>

              <button
                onClick={() => setIsAutoSpinning(!isAutoSpinning)}
                className={`w-8 h-8 rounded-full border flex items-center justify-center transition-colors cursor-pointer ${
                  isAutoSpinning
                    ? 'border-indigo-400 bg-indigo-500/20 text-indigo-300'
                    : 'border-white/10 hover:bg-white/[0.08] hover:text-white text-zinc-300'
                }`}
                title={isAutoSpinning ? 'Pause Auto-Spin' : 'Continuous 360 Spin'}
              >
                <span className={`material-symbols-outlined text-[18px] ${isAutoSpinning ? 'animate-spin' : ''}`}>
                  360
                </span>
              </button>

              <button
                onClick={handleZoomToggle}
                className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center hover:bg-white/[0.08] hover:text-white text-zinc-300 transition-colors cursor-pointer"
                title={`Zoom Level: ${zoomLevel}x`}
              >
                <span className="material-symbols-outlined text-[18px]">zoom_in</span>
              </button>
            </div>
          </div>

          {/* AI Technical Reasoning Readout */}
          <div className="glass-panel p-5 rounded-2xl text-xs font-mono-code text-zinc-300 leading-relaxed border-t-2 border-indigo-400 shadow-2xl">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-indigo-300 font-bold flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px] text-indigo-400">neurology</span>
                AI THERMAL SYNTHESIS
              </span>
              <span className="text-zinc-400 text-[10px] bg-white/[0.04] px-2 py-0.5 rounded border border-white/10">GEMINI 3.7 FLASH</span>
            </div>
            <div className="whitespace-pre-line text-white space-y-1">
              {simulationResult.aiExplanation}
            </div>
          </div>
        </div>

        {/* Right Column: Suitability Score & Parameter Controls (3 cols) */}
        <div className="lg:col-span-3 flex flex-col gap-3 max-h-[calc(100vh-12rem)] overflow-y-auto pr-1">
          {/* Suitability Score Card */}
          <div className="glass-panel p-5 rounded-2xl flex flex-col gap-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
              <span className="font-mono-code text-[11px] font-bold text-white tracking-widest uppercase flex items-center gap-1.5">
                SUITABILITY SCORE
              </span>
              <span className="material-symbols-outlined text-cyan-400 text-[18px]">analytics</span>
            </div>

            {/* Main Score Circular Radial Meter */}
            <div className="flex flex-col items-center py-2">
              <div className="relative w-32 h-32 flex items-center justify-center rounded-full border-4 border-white/10">
                {/* SVG Progress Circle */}
                <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="42"
                    fill="transparent"
                    stroke="rgba(255,255,255,0.08)"
                    strokeWidth="6"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="42"
                    fill="transparent"
                    stroke="#6366f1"
                    strokeWidth="6"
                    strokeDasharray={264}
                    strokeDashoffset={264 - (264 * simulationResult.overallScore) / 100}
                    strokeLinecap="round"
                    className="transition-all duration-700 ease-out"
                  />
                </svg>

                <div className="text-center z-10">
                  <div className="text-4xl font-extrabold text-white tracking-tight">
                    {simulationResult.overallScore}
                  </div>
                  <div className="font-mono-code text-[10px] text-zinc-400">/ 100</div>
                </div>
              </div>
            </div>

            {/* Score Breakdown */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between p-2.5 rounded-xl border border-white/10 bg-white/[0.02]">
                <span className="font-mono-code text-[12px] text-zinc-300">Heat Protection</span>
                <span className="font-mono-code text-[11px] font-bold text-indigo-300 bg-indigo-500/15 px-2.5 py-0.5 rounded-full border border-indigo-400/30">
                  {simulationResult.heatProtectionGrade}
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl border border-white/10 bg-white/[0.02]">
                <span className="font-mono-code text-[12px] text-zinc-300">Ventilation</span>
                <span className="font-mono-code text-[11px] font-bold text-cyan-300 bg-cyan-500/15 px-2.5 py-0.5 rounded-full border border-cyan-400/30">
                  {simulationResult.ventilationGrade}
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl border border-white/10 bg-white/[0.02]">
                <span className="font-mono-code text-[12px] text-zinc-300">Insulation</span>
                <span className="font-mono-code text-[11px] font-bold text-emerald-300 bg-emerald-500/15 px-2.5 py-0.5 rounded-full border border-emerald-400/30">
                  {simulationResult.insulationGrade}
                </span>
              </div>
            </div>
          </div>

          {/* Interactive Geometric Parameter Sliders */}
          <div className="glass-panel p-5 rounded-2xl flex flex-col gap-3 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
              <span className="font-mono-code text-[11px] font-bold text-cyan-300 tracking-widest uppercase">
                GEOMETRIC PARAMETERS
              </span>
              <span className="material-symbols-outlined text-cyan-400 text-[16px]">tune</span>
            </div>

            {/* Wall Thickness Slider */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-mono-code">
                <span className="text-zinc-300">Wall Thickness:</span>
                <span className="text-white font-bold">{wallThickness} cm</span>
              </div>
              <input
                type="range"
                min="15"
                max="45"
                step="5"
                value={wallThickness}
                onChange={(e) => setWallThickness(Number(e.target.value))}
                className="w-full accent-indigo-500 bg-white/[0.08] h-1.5 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            {/* Eave Overhang Slider */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-mono-code">
                <span className="text-zinc-300">Eave Overhang:</span>
                <span className="text-white font-bold">{eaveOverhang} m</span>
              </div>
              <input
                type="range"
                min="0.4"
                max="2.0"
                step="0.2"
                value={eaveOverhang}
                onChange={(e) => setEaveOverhang(Number(e.target.value))}
                className="w-full accent-cyan-500 bg-white/[0.08] h-1.5 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            {/* Ventilation Ratio Slider */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-mono-code">
                <span className="text-zinc-300">Ventilation Ratio:</span>
                <span className="text-white font-bold">{ventilationRatio}%</span>
              </div>
              <input
                type="range"
                min="10"
                max="50"
                step="5"
                value={ventilationRatio}
                onChange={(e) => setVentilationRatio(Number(e.target.value))}
                className="w-full accent-amber-500 bg-white/[0.08] h-1.5 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            {/* Roof Pitch Angle */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-mono-code">
                <span className="text-zinc-300">Roof Pitch:</span>
                <span className="text-white font-bold">{roofPitchAngle}°</span>
              </div>
              <input
                type="range"
                min="10"
                max="45"
                step="5"
                value={roofPitchAngle}
                onChange={(e) => setRoofPitchAngle(Number(e.target.value))}
                className="w-full accent-purple-500 bg-white/[0.08] h-1.5 rounded-lg appearance-none cursor-pointer"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
