import React from 'react';

interface FooterBarProps {
  onOpenLogs: () => void;
  latencyMs?: number;
  syncState?: 'OPTIMAL' | 'COMPUTING' | 'SYNCED';
  thermalState?: 'STEADY' | 'DISSIPATING' | 'CRITICAL';
}

export const FooterBar: React.FC<FooterBarProps> = ({
  onOpenLogs,
  latencyMs = 4,
  syncState = 'OPTIMAL',
  thermalState = 'STEADY',
}) => {
  return (
    <footer className="footerBar fixed bottom-0 w-full z-40 flex flex-wrap justify-between items-center px-4 md:px-8 py-2 min-h-[34px]">
      <div className="flex items-center gap-2.5">
        <span className="footerDot inline-block w-2 h-2 rounded-full"></span>
        <span>BLUE STARS</span>
      </div>

      <div className="flex items-center gap-4">
        <button
          onClick={onOpenLogs}
          className="flex items-center gap-1 cursor-pointer"
        >
          <span className="material-symbols-outlined text-[14px]">terminal</span>
          System logs
        </button>
        <span className="cursor-default">
          LATENCY_{latencyMs}MS
        </span>
        <span className="flex items-center gap-1.5 cursor-default">
          <span className="footerDot w-1.5 h-1.5 rounded-full"></span>
          THERMAL_{thermalState}
        </span>
      </div>
    </footer>
  );
};
