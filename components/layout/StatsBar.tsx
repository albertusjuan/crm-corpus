'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { Lead } from '@/types'
import { Users, Send, Trophy, TrendingUp, DollarSign } from 'lucide-react'

async function fetchLeads(): Promise<Pick<Lead, 'status' | 'deal_value_hkd'>[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('leads')
    .select('status, deal_value_hkd')
  if (error) throw error
  return data ?? []
}

export default function StatsBar() {
  const { data: leads = [] } = useQuery<Pick<Lead, 'status' | 'deal_value_hkd'>[]>({
    queryKey: ['leads-stats'],
    queryFn: fetchLeads,
  })

  const total = leads.length
  const contacted = leads.filter((l) => l.status !== 'new').length
  const won = leads.filter((l) => l.status === 'won').length
  const active = leads.filter(
    (l) => l.status !== 'won' && l.status !== 'lost' && l.status !== 'not_interested'
  ).length
  const pipelineValue = active * 2000
  const revenue = leads
    .filter((l) => l.status === 'won')
    .reduce((sum, l) => sum + (l.deal_value_hkd ?? 2000), 0)

  const stats = [
    { label: 'Network.Capacity', value: total },
    { label: 'Engagement', value: contacted },
    { label: 'Conversion', value: won },
    {
      label: 'Pipeline.Val',
      value: `HK$${pipelineValue.toLocaleString()}`,
    },
    {
      label: 'Yield',
      value: `HK$${revenue.toLocaleString()}`,
    },
  ]

  return (
    <div className="bg-background border-b border-white/20 px-10 py-5">
      <div className="flex items-center gap-16 overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-3 border-r border-white/10 pr-10">
          <div className="w-1.5 h-1.5 bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
          <span className="text-[9px] font-mono font-bold uppercase tracking-[0.2em] text-zinc-500">Node_Active</span>
        </div>
        {stats.map(({ label, value }) => (
          <div key={label} className="flex flex-col gap-1.5 border-r border-white/10 pr-16 last:border-0">
            <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest">
              {label}
            </span>
            <span className="text-[13px] font-mono font-black text-white">{value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
