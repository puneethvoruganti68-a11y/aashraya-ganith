import React from 'react';

interface ModalsProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GridConfigModal: React.FC<ModalsProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xl">
      <div className="glass-panel w-full max-w-lg rounded-3xl p-6 border border-white/15 shadow-2xl relative bg-zinc-950/85 backdrop-blur-2xl">
        <div className="flex items-center justify-between border-b border-white/10 pb-3.5 mb-4">
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-cyan-400">grid_view</span>
            <h3 className="font-mono-code text-sm font-bold text-white tracking-wider">
              FINITE ELEMENT MESH & GRID CONFIG
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/[0.08] transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4 font-mono-code text-xs text-zinc-300">
          <div>
            <label className="block mb-1.5 text-white font-medium">Mesh Resolution</label>
            <select className="w-full bg-white/[0.04] border border-white/10 rounded-xl p-2.5 text-white focus:outline-none focus:border-indigo-400 backdrop-blur-xl">
              <option className="bg-zinc-900 text-white">Ultra-Fine (0.05m voxel grid / CFD accurate)</option>
              <option className="bg-zinc-900 text-white">Standard (0.2m voxel grid / Real-time)</option>
              <option className="bg-zinc-900 text-white">Fast Coarse (0.5m thermal zone lumped parameter)</option>
            </select>
          </div>

          <div>
            <label className="block mb-1.5 text-white font-medium">Boundary Solar Radiation Solver</label>
            <select className="w-full bg-white/[0.04] border border-white/10 rounded-xl p-2.5 text-white focus:outline-none focus:border-indigo-400 backdrop-blur-xl">
              <option className="bg-zinc-900 text-white">Direct + Diffuse Anisotropic (Perez Sky Model)</option>
              <option className="bg-zinc-900 text-white">Isotropic Sky Approximation</option>
            </select>
          </div>

          <div className="p-3.5 bg-white/[0.03] rounded-2xl border border-white/10 space-y-2 text-[11px]">
            <div className="flex justify-between items-center">
              <span className="text-zinc-400">ACTIVE VERTICES:</span>
              <span className="text-indigo-300 font-bold">14,820 Nodes</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-zinc-400">SOLVER TIMESTEP:</span>
              <span className="text-cyan-300 font-bold">0.1s (Crank-Nicolson)</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-zinc-400">CONVERGENCE TOLERANCE:</span>
              <span className="text-amber-300 font-bold">1e-5 W/K</span>
            </div>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-white/10 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-mono-code text-xs font-bold rounded-xl hover:from-indigo-400 hover:to-purple-500 transition-all cursor-pointer shadow-lg shadow-indigo-500/25"
          >
            APPLY CONFIGURATION
          </button>
        </div>
      </div>
    </div>
  );
};

export const DataStreamsModal: React.FC<ModalsProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xl">
      <div className="glass-panel w-full max-w-xl rounded-3xl p-6 border border-white/15 shadow-2xl relative bg-zinc-950/85 backdrop-blur-2xl">
        <div className="flex items-center justify-between border-b border-white/10 pb-3.5 mb-4">
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-cyan-400">lan</span>
            <h3 className="font-mono-code text-sm font-bold text-white tracking-wider">
              TELEMETRY & REAL-TIME DATA STREAMS
            </h3>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/[0.08] transition-colors cursor-pointer">
            ✕
          </button>
        </div>

        <div className="space-y-3 font-mono-code text-xs">
          <div className="p-3.5 bg-white/[0.03] rounded-2xl border border-cyan-500/30 flex items-center justify-between">
            <div>
              <div className="text-white font-bold flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
                ERA5 Reanalysis Stream
              </div>
              <div className="text-zinc-400 text-[10px]">ECMWF Global Climate Diagnostic Feed</div>
            </div>
            <span className="text-cyan-300 text-[11px] bg-cyan-500/10 px-2.5 py-0.5 rounded-full border border-cyan-500/30">CONNECTED</span>
          </div>

          <div className="p-3.5 bg-white/[0.03] rounded-2xl border border-emerald-500/30 flex items-center justify-between">
            <div>
              <div className="text-white font-bold flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                Solar Irradiance Pyranometer Network
              </div>
              <div className="text-zinc-400 text-[10px]">Spectral Flux Density (DNI / DHI)</div>
            </div>
            <span className="text-emerald-300 text-[11px] bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/30">STREAMING</span>
          </div>

          <div className="p-3.5 bg-white/[0.03] rounded-2xl border border-white/10 flex items-center justify-between">
            <div>
              <div className="text-white font-bold flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                In-situ Vernacular Test Station
              </div>
              <div className="text-zinc-400 text-[10px]">Thermocouple & Soil Moisture Array</div>
            </div>
            <span className="text-amber-300 text-[11px] bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/30">LATENCY 8MS</span>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-white/10 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white/[0.06] text-white border border-white/15 font-mono-code text-xs font-bold rounded-xl hover:bg-white/[0.12] transition-colors cursor-pointer"
          >
            CLOSE
          </button>
        </div>
      </div>
    </div>
  );
};

export const HistoryModal: React.FC<ModalsProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xl">
      <div className="glass-panel w-full max-w-2xl rounded-3xl p-6 border border-white/15 shadow-2xl relative bg-zinc-950/85 backdrop-blur-2xl">
        <div className="flex items-center justify-between border-b border-white/10 pb-3.5 mb-4">
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-cyan-400">history</span>
            <h3 className="font-mono-code text-sm font-bold text-white tracking-wider">
              SIMULATION EXPERIMENT LOGS & HISTORY
            </h3>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/[0.08] transition-colors cursor-pointer">
            ✕
          </button>
        </div>

        <div className="space-y-2.5 font-mono-code text-xs max-h-72 overflow-y-auto pr-1">
          <div className="p-3.5 bg-white/[0.03] rounded-2xl border border-indigo-400/40 flex items-center justify-between">
            <div>
              <div className="text-white font-bold">Thar Desert &bull; Human Habitation (Run #402)</div>
              <div className="text-zinc-400 text-[11px]">Interventions: EPS Roof + Albedo Lime + Ridge Cap</div>
            </div>
            <div className="text-right">
              <div className="text-indigo-300 font-bold text-sm">88 / 100</div>
              <div className="text-zinc-400 text-[10px]">Delta -7.2°C</div>
            </div>
          </div>

          <div className="p-3.5 bg-white/[0.03] rounded-2xl border border-white/10 flex items-center justify-between">
            <div>
              <div className="text-white font-bold">Thar Desert &bull; Cattle Enclosure (Run #401)</div>
              <div className="text-zinc-400 text-[11px]">Interventions: High-Clearance Ridge + Thatch Sub-roof</div>
            </div>
            <div className="text-right">
              <div className="text-cyan-300 font-bold text-sm">84 / 100</div>
              <div className="text-zinc-400 text-[10px]">Delta -5.8°C</div>
            </div>
          </div>

          <div className="p-3.5 bg-white/[0.03] rounded-2xl border border-white/10 flex items-center justify-between">
            <div>
              <div className="text-white font-bold">Ladakh Alpine &bull; Trombe Wall Test (Run #398)</div>
              <div className="text-zinc-400 text-[11px]">Interventions: Earth Berming + Triple Polycarbonate</div>
            </div>
            <div className="text-right">
              <div className="text-amber-300 font-bold text-sm">91 / 100</div>
              <div className="text-zinc-400 text-[10px]">Night Buffer +14°C</div>
            </div>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-white/10 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-mono-code text-xs font-bold rounded-xl hover:from-indigo-400 hover:to-purple-500 transition-all cursor-pointer shadow-lg shadow-indigo-500/25"
          >
            CLOSE
          </button>
        </div>
      </div>
    </div>
  );
};

export const LogsModal: React.FC<ModalsProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xl">
      <div className="glass-panel w-full max-w-2xl rounded-3xl p-6 border border-white/15 shadow-2xl relative bg-zinc-950/85 backdrop-blur-2xl">
        <div className="flex items-center justify-between border-b border-white/10 pb-3.5 mb-4">
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-indigo-400">terminal</span>
            <h3 className="font-mono-code text-sm font-bold text-white tracking-wider">
              REAL-TIME SYSTEM DIAGNOSTIC LOGS
            </h3>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/[0.08] transition-colors cursor-pointer">
            ✕
          </button>
        </div>

        <div className="p-4 bg-zinc-950/90 rounded-2xl border border-white/10 font-mono-code text-[11px] text-zinc-300 space-y-1.5 max-h-80 overflow-y-auto backdrop-blur-xl">
          <div className="text-zinc-500">[09:58:12] INITIALIZING AASHRAYA GANITH KERNEL V2.4...</div>
          <div className="text-cyan-400">[09:58:13] CONNECTED TO CLOUD RUN BACKEND TELEMETRY.</div>
          <div className="text-indigo-400">[09:58:14] GEMINI 3.7 FLASH INFERENCE MODEL READY.</div>
          <div className="text-zinc-200">[09:58:15] CLIMATE SYNC: THAR DESERT MESH (26.9124° N, 70.9042° E) LOADED.</div>
          <div className="text-amber-400">[09:58:16] SOLAR FLUX CALCULATOR: DIRECT BEAM 950 W/m² DETECTED AT 12:00.</div>
          <div className="text-indigo-400">[09:58:17] THERMAL BALANCE EQUATION CONVERGED IN 4.2ms.</div>
          <div className="text-cyan-400">[09:58:18] STACK VENTILATION VELOCITY: 1.8 m/s THROUGH APEX RIDGE.</div>
          <div className="text-emerald-400">[09:58:19] STEADY STATE REACHED: INTERNAL OPERATIVE TEMP 30.8°C.</div>
        </div>

        <div className="mt-4 pt-4 border-t border-white/10 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white/[0.06] text-white border border-white/15 font-mono-code text-xs rounded-xl hover:bg-white/[0.12] transition-colors cursor-pointer"
          >
            DISMISS
          </button>
        </div>
      </div>
    </div>
  );
};

export const SettingsModal: React.FC<ModalsProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xl">
      <div className="glass-panel w-full max-w-md rounded-3xl p-6 border border-white/15 shadow-2xl relative bg-zinc-950/85 backdrop-blur-2xl">
        <div className="flex items-center justify-between border-b border-white/10 pb-3.5 mb-4">
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-indigo-400">settings</span>
            <h3 className="font-mono-code text-sm font-bold text-white tracking-wider">
              SYSTEM PREFERENCES
            </h3>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/[0.08] transition-colors cursor-pointer">
            ✕
          </button>
        </div>

        <div className="space-y-4 font-mono-code text-xs text-zinc-300">
          <div>
            <label className="block mb-1.5 text-white font-medium">Temperature Unit</label>
            <select className="w-full bg-white/[0.04] border border-white/10 rounded-xl p-2.5 text-white focus:outline-none focus:border-indigo-400 backdrop-blur-xl">
              <option className="bg-zinc-900 text-white">Celsius (°C)</option>
              <option className="bg-zinc-900 text-white">Fahrenheit (°F)</option>
              <option className="bg-zinc-900 text-white">Kelvin (K)</option>
            </select>
          </div>

          <div>
            <label className="block mb-1.5 text-white font-medium">Currency Estimator</label>
            <select className="w-full bg-white/[0.04] border border-white/10 rounded-xl p-2.5 text-white focus:outline-none focus:border-indigo-400 backdrop-blur-xl">
              <option className="bg-zinc-900 text-white">Indian Rupee (₹ INR)</option>
              <option className="bg-zinc-900 text-white">US Dollar ($ USD)</option>
              <option className="bg-zinc-900 text-white">Euro (€ EUR)</option>
            </select>
          </div>

          <div>
            <label className="block mb-1.5 text-white font-medium">AI Diagnostic Depth</label>
            <select className="w-full bg-white/[0.04] border border-white/10 rounded-xl p-2.5 text-white focus:outline-none focus:border-indigo-400 backdrop-blur-xl">
              <option className="bg-zinc-900 text-white">High Rigor (Thermodynamic Proofs & Vernacular Materials)</option>
              <option className="bg-zinc-900 text-white">Standard (Quick Recommendations)</option>
            </select>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-white/10 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-mono-code text-xs font-bold rounded-xl hover:from-indigo-400 hover:to-purple-500 transition-all cursor-pointer shadow-lg shadow-indigo-500/25"
          >
            SAVE PREFERENCES
          </button>
        </div>
      </div>
    </div>
  );
};
