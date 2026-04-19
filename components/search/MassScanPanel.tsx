'use client'

interface MassScanPanelProps {
  progress: { current: number; total: number; district: string; category: string; found: number } | null
  categories: string[]
  onStart: () => void
  onAbort: () => void
}

export default function MassScanPanel({ progress, categories, onStart, onAbort }: MassScanPanelProps) {
  const isRunning = progress !== null
  const percentage = progress ? Math.round((progress.current / progress.total) * 100) : 0
  const districts = 35

  return (
    <div className="bg-black border border-white/20 p-10 mb-16">
      <div className="flex flex-col gap-1 mb-10">
        <span className="text-[10px] text-zinc-600 font-mono tracking-[0.4em] uppercase">Phase_02</span>
        <h2 className="text-2xl font-black text-white font-mono uppercase tracking-tighter">
          Mass_Scan
        </h2>
        <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest mt-1">
          Sweeps all{' '}
          <span className="text-white">{districts} districts</span>
          {' '}across{' '}
          <span className="text-white">{categories.length} categories</span>
          {' '}— surfaces every local business without a website
        </p>
      </div>

      {isRunning ? (
        <div className="space-y-8">
          <div className="grid grid-cols-4 gap-6 border border-white/10 p-6">
            <div className="space-y-1">
              <p className="text-[9px] font-mono text-zinc-600 uppercase tracking-widest">Status</p>
              <p className="text-xs font-mono font-black text-white uppercase tracking-widest">Scanning</p>
            </div>
            <div className="space-y-1">
              <p className="text-[9px] font-mono text-zinc-600 uppercase tracking-widest">District</p>
              <p className="text-xs font-mono font-black text-white uppercase tracking-widest">{progress.district}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[9px] font-mono text-zinc-600 uppercase tracking-widest">Category</p>
              <p className="text-xs font-mono font-black text-white uppercase tracking-widest">{progress.category}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[9px] font-mono text-zinc-600 uppercase tracking-widest">No_Website</p>
              <p className="text-xs font-mono font-black text-white uppercase tracking-widest">{progress.found}</p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
              <span>Progress</span>
              <span>{progress.current} / {progress.total} queries — {percentage}%</span>
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
          <div className="grid grid-cols-4 gap-6 border border-white/10 p-6">
            <div className="space-y-1">
              <p className="text-[9px] font-mono text-zinc-600 uppercase tracking-widest">Districts</p>
              <p className="text-xs font-mono font-black text-white uppercase tracking-widest">{districts}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[9px] font-mono text-zinc-600 uppercase tracking-widest">Categories</p>
              <p className="text-xs font-mono font-black text-white uppercase tracking-widest">{categories.length}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[9px] font-mono text-zinc-600 uppercase tracking-widest">Total_Queries</p>
              <p className="text-xs font-mono font-black text-white uppercase tracking-widest">{districts * categories.length}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[9px] font-mono text-zinc-600 uppercase tracking-widest">Filter</p>
              <p className="text-xs font-mono font-black text-white uppercase tracking-widest">No Website</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {categories.map((c) => (
              <span key={c} className="px-2 py-1 border border-white/10 text-[9px] font-mono text-zinc-500 uppercase tracking-widest">
                {c}
              </span>
            ))}
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
