'use client'

import dynamic from 'next/dynamic'

const KanbanBoard = dynamic(() => import('@/components/pipeline/KanbanBoard'), {
  ssr: false,
  loading: () => (
    <div className="flex gap-6 overflow-x-auto pb-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="flex-shrink-0 w-72 bg-zinc-50 border-2 border-black h-96 animate-pulse"
        />
      ))}
    </div>
  ),
})

export default function PipelinePage() {
  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <div className="w-4 h-4 bg-black" />
          <h1 className="text-3xl font-black text-black font-mono uppercase tracking-tighter">
            Pipeline.Control
          </h1>
        </div>
        <p className="text-xs font-mono text-zinc-500 uppercase tracking-widest pl-7">
          ✦ SYSTEM_ACTIVE // DRAG_AND_DROP_ENABLED ✦
        </p>
      </div>
      <KanbanBoard />
    </div>
  )
}
