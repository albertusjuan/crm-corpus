'use client'

interface MassScanPanelProps {
  progress: { current: number; total: number; district: string; found: number } | null
  onStart: () => void
  onAbort: () => void
}

export default function MassScanPanel({ progress, onStart, onAbort }: MassScanPanelProps) {
  const isRunning = progress !== null
  const percentage = progress ? Math.round((progress.current / progress.total) * 100) : 0

  return (
    <div className="bg-black border border-white/20 p-10 mb-16">
      <div className="flex flex-col gap-1 mb-10">
        <span className="text-[10px] text-zinc-600 font-mono tracking-[0.4em] uppercase">Phase_02</span>
        <h2 className="text-2xl font-black text-white font-mono uppercase tracking-tighter">
          Mass_Scan
        </h2>
        <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest mt-1">
          Sweeps all {' '}
          <span className="text-white">35 Hong Kong districts</span>
          {' '} — surfaces every local business without a website
        </p>
      </div>

      {isRunning ? (
        <div className="space-y-8">
          <div className="grid grid-cols-3 gap-8 border border-white/10 p-6">
            <div className="space-y-1">
              <p className="text-[9px] font-mono text-zinc-600 uppercase tracking-widest">Status</p>
              <p className="text-xs font-mono font-black text-white uppercase tracking-widest">Scanning</p>
            </div>
            <div className="space-y-1">
              <p className="text-[9px] font-mono text-zinc-600 uppercase tracking-widest">Current_District</p>
              <p className="text-xs font-mono font-black text-white uppercase tracking-widest">{progress.district}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[9px] font-mono text-zinc-600 uppercase tracking-widest">No_Website_Found</p>
              <p className="text-xs font-mono font-black text-white uppercase tracking-widest">{progress.found}</p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
              <span>Progress</span>
              <span>{progress.current} / {progress.total} districts</span>
            </div>
            <div className="w-full h-[2px] bg-zinc-900">
              <div
                className="h-[2px] bg-white transition-all duration-500"
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>

          <button
            onClick={onAbort}
            className="h-12 w-full font-mono font-black text-[10px] uppercase tracking-widest border border-red-500/40 text-red-400 hover:bg-red-500/10 hover:border-red-500/80 transition-all"
          >
            ABORT_SCAN
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-3 gap-8 border border-white/10 p-6">
            <div className="space-y-1">
              <p className="text-[9px] font-mono text-zinc-600 uppercase tracking-widest">Coverage</p>
              <p className="text-xs font-mono font-black text-white uppercase tracking-widest">35 Districts</p>
            </div>
            <div className="space-y-1">
              <p className="text-[9px] font-mono text-zinc-600 uppercase tracking-widest">Filter</p>
              <p className="text-xs font-mono font-black text-white uppercase tracking-widest">No Website Only</p>
            </div>
            <div className="space-y-1">
              <p className="text-[9px] font-mono text-zinc-600 uppercase tracking-widest">Mode</p>
              <p className="text-xs font-mono font-black text-white uppercase tracking-widest">Any Business Type</p>
            </div>
          </div>

          <button
            onClick={onStart}
            className="h-12 w-full font-mono font-black text-sm uppercase tracking-widest border border-white bg-white text-black hover:bg-transparent hover:text-white transition-all"
          >
            INITIATE_MASS_SCAN
          </button>
        </div>
      )}
    </div>
  )
}
