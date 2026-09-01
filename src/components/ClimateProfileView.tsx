import React, { useState } from 'react';
import { ClimateRegion, ShelterTarget } from '../types';
import { CLIMATE_REGIONS } from '../data/climateData';

interface ClimateProfileViewProps {
  currentRegion: ClimateRegion;
  onSelectRegion: (region: ClimateRegion) => void;
  onProceedToRequirements: () => void;
  currentTarget: ShelterTarget;
  onCustomLocationSearch?: (query: string) => Promise<void>;
  isSearchingCustom?: boolean;
}

export const ClimateProfileView: React.FC<ClimateProfileViewProps> = ({
  currentRegion,
  onSelectRegion,
  onProceedToRequirements,
  currentTarget,
  onCustomLocationSearch,
  isSearchingCustom = false,
}) => {
  const [hoveredHour, setHoveredHour] = useState<{ hour: string; temp: number } | null>(null);
  const [isRegionDropdownOpen, setIsRegionDropdownOpen] = useState(false);
  const [customSearchQuery, setCustomSearchQuery] = useState('');

  const handleCustomSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (customSearchQuery.trim() && onCustomLocationSearch) {
      onCustomLocationSearch(customSearchQuery.trim());
      setIsRegionDropdownOpen(false);
    }
  };

  return (
    <div className="pt-20 pb-20 px-4 md:px-8 max-w-7xl mx-auto w-full relative z-10">
      {/* Header Section */}
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="font-mono-code text-[11px] text-indigo-400 uppercase tracking-widest bg-indigo-500/10 px-2.5 py-0.5 rounded-full border border-indigo-400/30">
              {currentTarget === 'human' ? 'HUMAN HABITATION CLIMATE MESH' : 'LIVESTOCK BIOCLIMATIC ENCLOSURE'}
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-2">
            Climate Profile
          </h1>
          <div className="relative inline-block">
            <button
              onClick={() => setIsRegionDropdownOpen(!isRegionDropdownOpen)}
              className="flex items-center gap-2 font-mono-code text-[13px] text-zinc-300 hover:text-white transition-colors py-1.5 px-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 backdrop-blur-xl shadow-sm cursor-pointer"
              title="Click to switch climate region or enter coordinates"
            >
              <span className="material-symbols-outlined text-cyan-400 text-[18px]">location_on</span>
              <span>{currentRegion.locationLabel}</span>
              <span className="material-symbols-outlined text-[16px] text-zinc-400">expand_more</span>
            </button>

            {/* Region Switcher Popover */}
            {isRegionDropdownOpen && (
              <div className="absolute left-0 mt-2 w-80 sm:w-96 p-4 bg-zinc-950/95 border border-white/15 rounded-2xl shadow-2xl z-30 backdrop-blur-2xl">
                <div className="font-mono-code text-[11px] text-indigo-400 font-bold mb-3 uppercase tracking-wider">
                  Select Regional Microclimate
                </div>
                <div className="space-y-1.5 max-h-56 overflow-y-auto mb-3 pr-1">
                  {CLIMATE_REGIONS.map((r) => (
                    <button
                      key={r.id}
                      onClick={() => {
                        onSelectRegion(r);
                        setIsRegionDropdownOpen(false);
                      }}
                      className={`w-full text-left p-2.5 rounded-xl text-xs font-mono-code flex items-center justify-between transition-colors cursor-pointer ${
                        r.id === currentRegion.id
                          ? 'bg-indigo-600/30 text-white border border-indigo-400/40 shadow-inner'
                          : 'text-zinc-300 hover:bg-white/[0.06] hover:text-white border border-transparent'
                      }`}
                    >
                      <div>
                        <div className="font-bold text-white">{r.name}</div>
                        <div className="text-[10px] text-zinc-400">{r.coordinates}</div>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-300 border border-rose-500/20">
                        {r.stressTag}
                      </span>
                    </button>
                  ))}
                </div>

                {/* Custom Coordinates Search Form */}
                <form onSubmit={handleCustomSearchSubmit} className="pt-3 border-t border-white/10">
                  <div className="font-mono-code text-[10px] text-zinc-400 mb-2">
                    Or evaluate custom coordinates / city:
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="e.g. 24.5854° N, 73.7125° E or Jodhpur"
                      value={customSearchQuery}
                      onChange={(e) => setCustomSearchQuery(e.target.value)}
                      className="flex-1 bg-white/[0.04] border border-white/10 rounded-xl px-3 py-1.5 text-xs font-mono-code text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-400 backdrop-blur-xl"
                    />
                    <button
                      type="submit"
                      disabled={isSearchingCustom}
                      className="px-3.5 py-1.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-mono-code text-xs font-bold rounded-xl hover:from-indigo-400 hover:to-purple-500 disabled:opacity-50 cursor-pointer shadow-md shadow-indigo-500/20"
                    >
                      {isSearchingCustom ? '...' : 'Sync'}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>

        {/* Status Badges */}
        <div className="flex items-center gap-3">
          <span className="px-3.5 py-1.5 border border-rose-500/30 rounded-full font-mono-code text-[12px] text-rose-300 flex items-center gap-1.5 bg-rose-500/10 tracking-wider backdrop-blur-xl">
            <span className="material-symbols-outlined text-[16px] text-rose-400">warning</span>
            {currentRegion.stressTag}
          </span>
          <span className="px-3.5 py-1.5 border border-emerald-500/30 rounded-full font-mono-code text-[12px] text-emerald-300 flex items-center gap-1.5 bg-emerald-500/10 tracking-wider backdrop-blur-xl">
            <span className="material-symbols-outlined text-[16px] text-emerald-400">check_circle</span>
            SYNC ACTIVE
          </span>
        </div>
      </div>

      {/* Dashboard Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 mb-6">
        {/* Primary Indicator: Core Temperature (4 cols) */}
        <div className="glass-panel rounded-2xl p-6 md:col-span-4 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-5 text-rose-400/40 group-hover:text-rose-400/70 transition-colors">
            <span className="material-symbols-outlined text-4xl">thermostat</span>
          </div>
          <h3 className="font-mono-code text-[11px] font-bold text-zinc-400 mb-6 tracking-widest border-b border-white/10 pb-2 uppercase">
            CORE TEMPERATURE
          </h3>
          <div className="flex items-baseline gap-2">
            <span className="text-[58px] sm:text-[64px] font-extrabold leading-none bg-gradient-to-r from-rose-400 to-amber-300 bg-clip-text text-transparent">
              {currentRegion.coreTemp}°
            </span>
            <span className="text-2xl font-medium text-zinc-400">C</span>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-rose-300 font-mono-code text-[12px]">
            <span className="material-symbols-outlined text-[16px]">arrow_upward</span>
            <span>{currentRegion.tempDeltaVsAvg}</span>
          </div>
        </div>

        {/* Secondary Indicators Grid (8 cols) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 md:col-span-8">
          {/* Humidity Card */}
          <div className="glass-panel rounded-2xl p-6 relative">
            <h3 className="font-mono-code text-[11px] font-bold text-zinc-400 mb-3 tracking-widest border-b border-white/10 pb-2 uppercase">
              HUMIDITY
            </h3>
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-3xl font-bold text-cyan-300">{currentRegion.humidity}</span>
              <span className="text-sm font-medium text-zinc-400">%</span>
            </div>
            <div className="w-full h-2 bg-white/[0.08] rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-500 rounded-full"
                style={{ width: `${currentRegion.humidity}%` }}
              ></div>
            </div>
          </div>

          {/* Wind Vector Card */}
          <div className="glass-panel rounded-2xl p-6 relative">
            <h3 className="font-mono-code text-[11px] font-bold text-zinc-400 mb-3 tracking-widest border-b border-white/10 pb-2 uppercase">
              WIND VECTOR
            </h3>
            <div className="flex items-center justify-between">
              <div className="flex items-baseline gap-1.5">
                <span className="text-3xl font-bold text-white">{currentRegion.windSpeed}</span>
                <span className="font-mono-code text-[12px] text-zinc-400">km/h</span>
              </div>
              <div className="flex items-center gap-1.5 font-mono-code text-[12px] text-white bg-white/[0.06] px-3 py-1.5 rounded-xl border border-white/10">
                <span
                  className="material-symbols-outlined text-[16px] text-cyan-400 transition-transform duration-500"
                  style={{ transform: `rotate(${currentRegion.windAngle}deg)` }}
                >
                  navigation
                </span>
                <span>{currentRegion.windDirection}</span>
              </div>
            </div>
          </div>

          {/* Solar Radiation Card (Col span 2) */}
          <div className="glass-panel rounded-2xl p-6 sm:col-span-2 relative">
            <h3 className="font-mono-code text-[11px] font-bold text-zinc-400 mb-3 tracking-widest border-b border-white/10 pb-2 uppercase">
              SOLAR RADIATION
            </h3>
            <div className="flex justify-between items-center mb-2">
              <div className="text-xl font-bold text-amber-300 tracking-wide">
                {currentRegion.solarRadiationLevel}
              </div>
              <div className="font-mono-code text-[13px] text-zinc-300">
                {currentRegion.solarRadiationValue} W/m²
              </div>
            </div>
            <div className="mt-2 h-2.5 rounded-full w-full bg-gradient-to-r from-amber-500 via-rose-500 to-indigo-500 shadow-sm"></div>
          </div>
        </div>
      </div>

      {/* Heat Risk Graph & AI Insights (2 Columns) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* 24H Thermal Cycle Graph (2 cols) */}
        <div className="glass-panel rounded-2xl p-6 lg:col-span-2 relative">
          <div className="flex flex-wrap justify-between items-center mb-4 border-b border-white/10 pb-2 gap-2">
            <h3 className="font-mono-code text-[11px] font-bold text-zinc-400 tracking-widest uppercase">
              24H THERMAL CYCLE
            </h3>
            <span className="font-mono-code text-[11px] text-rose-300 bg-rose-500/10 px-2.5 py-0.5 rounded-full border border-rose-500/25">
              Peak Stress Zone Highlighted ({currentRegion.peakStressZone.start} - {currentRegion.peakStressZone.end})
            </span>
          </div>

          {/* Graph Visualization Container */}
          <div className="h-64 w-full relative flex items-end pt-6 pb-6">
            {/* Y-Axis Labels */}
            <div className="absolute left-0 top-0 bottom-6 flex flex-col justify-between text-[11px] font-mono-code text-zinc-400 pr-2">
              <span>45°</span>
              <span>35°</span>
              <span>25°</span>
              <span>15°</span>
            </div>

            {/* Graph Bars Area */}
            <div className="flex-1 flex items-end justify-between ml-8 relative h-full border-l border-b border-white/10">
              {/* Background Grid Lines */}
              <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                <div className="w-full border-t border-white/[0.05] h-0"></div>
                <div className="w-full border-t border-white/[0.05] h-0"></div>
                <div className="w-full border-t border-white/[0.05] h-0"></div>
              </div>

              {/* Peak Stress Zone Visual Box */}
              <div className="absolute left-[38%] right-[25%] top-0 bottom-0 bg-rose-500/[0.07] border-x border-rose-500/30 z-0 flex flex-col items-center pt-2 pointer-events-none">
                <span className="text-[10px] font-mono-code text-rose-300 bg-zinc-950/80 px-2 py-0.5 rounded-full border border-rose-500/30 backdrop-blur-md">
                  {currentRegion.peakStressZone.start} - {currentRegion.peakStressZone.end}
                </span>
              </div>

              {/* Hourly Data Bars */}
              {currentRegion.hourlyTemps.map((point, index) => {
                const normalizedHeight = Math.min(
                  Math.max(((point.temp - 10) / (48 - 10)) * 100, 12),
                  100
                );
                const isPeak = point.isPeak;

                return (
                  <div
                    key={index}
                    onMouseEnter={() => setHoveredHour(point)}
                    onMouseLeave={() => setHoveredHour(null)}
                    className="flex-1 flex flex-col items-center justify-end h-full group/bar cursor-pointer z-10 px-0.5"
                  >
                    <div
                      className={`w-full max-w-[14px] rounded-t-sm transition-all duration-300 ${
                        isPeak
                          ? 'bg-rose-400/80 border-t-2 border-rose-300 group-hover/bar:bg-rose-400 shadow-md shadow-rose-500/20'
                          : point.temp > 30
                          ? 'bg-amber-400/60 border-t-2 border-amber-300 group-hover/bar:bg-amber-400'
                          : 'bg-cyan-400/50 border-t-2 border-cyan-300 group-hover/bar:bg-cyan-400'
                      }`}
                      style={{ height: `${normalizedHeight}%` }}
                    ></div>
                  </div>
                );
              })}
            </div>

            {/* X-Axis Hour Labels */}
            <div className="absolute bottom-0 left-8 right-0 flex justify-between text-[11px] font-mono-code text-zinc-400">
              <span>00</span>
              <span>06</span>
              <span>12</span>
              <span>18</span>
              <span>24</span>
            </div>
          </div>

          {/* Hover Tooltip Info */}
          <div className="h-6 flex items-center justify-between text-[11px] font-mono-code text-zinc-300 pt-1">
            {hoveredHour ? (
              <span className="text-indigo-300 font-semibold">
                Hour {hoveredHour.hour}:00 &rarr; Ambient Temp:{' '}
                <strong className="text-white">{hoveredHour.temp}°C</strong>
              </span>
            ) : (
              <span className="text-zinc-400">Hover over bars to inspect hourly temperature curve</span>
            )}
            <span className="text-zinc-400">Köppen Climate: {currentRegion.climateType}</span>
          </div>
        </div>

        {/* AI System Insights Card (1 col) */}
        <div className="glass-panel rounded-2xl p-6 border-indigo-400/30 relative flex flex-col justify-between shadow-2xl">
          <div>
            <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-4">
              <h3 className="font-mono-code text-[11px] font-bold text-indigo-300 tracking-widest uppercase flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse"></span>
                SYSTEM INSIGHTS
              </h3>
              <span className="material-symbols-outlined text-indigo-400 text-[18px]">memory</span>
            </div>

            <div className="space-y-3 mb-4">
              <p className="text-sm font-medium text-white leading-relaxed">
                {currentRegion.aiInsights.climateDetection}
              </p>

              <div className="bg-white/[0.04] p-3 border border-white/10 rounded-xl flex justify-between items-center text-xs font-mono-code">
                <span className="text-zinc-300">Nighttime cooling potential:</span>
                <span className="text-cyan-400 font-bold">
                  {currentRegion.aiInsights.nightCoolingPotential}
                </span>
              </div>

              <div className="bg-rose-500/10 p-3 border border-rose-500/25 rounded-xl flex justify-between items-center text-xs font-mono-code">
                <span className="text-zinc-300">Solar heat gain:</span>
                <span className="text-rose-300 font-bold">
                  {currentRegion.aiInsights.solarHeatGain}
                </span>
              </div>

              <div className="bg-white/[0.03] p-3 border border-white/10 rounded-xl text-[11px] text-zinc-300 font-mono-code leading-relaxed">
                <span className="text-indigo-300 font-bold block mb-1">OPTIMAL ORIENTATION:</span>
                {currentRegion.aiInsights.recommendedOrientation}
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-white/10">
            <button
              onClick={onProceedToRequirements}
              className="w-full bg-gradient-to-r from-indigo-500 via-indigo-600 to-purple-600 text-white font-mono-code text-[12px] font-bold py-3 px-4 rounded-xl hover:from-indigo-400 hover:to-purple-500 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-indigo-500/25 active:scale-[0.98]"
            >
              PROCEED: INPUT REQUIREMENTS
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
