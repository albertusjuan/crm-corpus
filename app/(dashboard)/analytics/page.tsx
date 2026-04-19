'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { Lead, LeadStatus, STATUS_LABELS } from '@/types'
import { calcScore, scoreTier, TIER_STYLES, ScoreTier } from '@/lib/scoring'
import { Skeleton } from '@/components/ui/skeleton'

async function fetchLeads(): Promise<Lead[]> {
  const supabase = createClient()
  const { data, error } = await supabase.from('leads').select('*')
  if (error) throw error
  return data ?? []
}

const FUNNEL_STATUSES: LeadStatus[] = ['new', 'contacted', 'responded', 'meeting', 'won']

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="border border-white/20 p-6 flex flex-col gap-2">
      <span className="text-[9px] font-mono text-zinc-600 uppercase tracking-widest">{label}</span>
      <span className="text-3xl font-mono font-black text-white">{value}</span>
      {sub && <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">{sub}</span>}
    </div>
  )
}

function Bar({ pct, color = 'bg-white' }: { pct: number; color?: string }) {
  return (
    <div className="w-full h-[2px] bg-zinc-900 mt-2">
      <div className={`h-[2px] ${color} transition-all duration-700`} style={{ width: `${Math.max(pct, 1)}%` }} />
    </div>
  )
}

export default function AnalyticsPage() {
  const { data: leads = [], isLoading } = useQuery({
    queryKey: ['leads-analytics'],
    queryFn: fetchLeads,
  })

  if (isLoading) {
    return (
      <div className="space-y-12">
        <Skeleton className="h-10 w-64 rounded-none bg-zinc-900" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-none bg-zinc-900" />
          ))}
        </div>
        <Skeleton className="h-64 rounded-none bg-zinc-900" />
      </div>
    )
  }

  const total = leads.length
  const noWebsite = leads.filter((l) => !l.has_website).length
  const won = leads.filter((l) => l.status === 'won').length
  const active = leads.filter((l) => !['won', 'lost', 'not_interested'].includes(l.status)).length
  const revenue = leads.filter((l) => l.status === 'won').reduce((s, l) => s + (l.deal_value_hkd ?? 2000), 0)
  const conversionRate = total > 0 ? Math.round((won / total) * 100) : 0

  // Pipeline funnel
  const funnelData = FUNNEL_STATUSES.map((s) => ({
    status: s,
    count: leads.filter((l) => l.status === s).length,
  }))
  const funnelMax = Math.max(...funnelData.map((d) => d.count), 1)

  // Top districts
  const districtMap = new Map<string, number>()
  for (const l of leads) {
    if (l.district) districtMap.set(l.district, (districtMap.get(l.district) ?? 0) + 1)
  }
  const topDistricts = Array.from(districtMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
  const districtMax = topDistricts[0]?.[1] ?? 1

  // Business types
  const typeMap = new Map<string, number>()
  for (const l of leads) {
    if (l.business_type) typeMap.set(l.business_type, (typeMap.get(l.business_type) ?? 0) + 1)
  }
  const topTypes = Array.from(typeMap.entries()).sort((a, b) => b[1] - a[1])
  const typeMax = topTypes[0]?.[1] ?? 1

  // Score distribution
  const tierCounts: Record<ScoreTier, number> = { HOT: 0, WARM: 0, MID: 0, COLD: 0 }
  for (const l of leads) tierCounts[scoreTier(calcScore(l))]++
  const tierMax = Math.max(...Object.values(tierCounts), 1)

  return (
    <div className="space-y-12">
      <div className="flex flex-col gap-1">
        <span className="text-[10px] text-zinc-600 font-mono tracking-[0.4em] uppercase">Module_04</span>
        <h1 className="text-4xl font-black text-white font-mono uppercase tracking-tighter">
          Intel.Dashboard
        </h1>
        <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest mt-2">
          Real-time intelligence across all lead data
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatCard label="Total_Leads" value={total} />
        <StatCard label="No_Website" value={noWebsite} sub={total > 0 ? `${Math.round((noWebsite / total) * 100)}% of total` : '—'} />
        <StatCard label="Active_Pipeline" value={active} />
        <StatCard label="Conversion_Rate" value={`${conversionRate}%`} sub={`${won} won`} />
        <StatCard label="Revenue_Won" value={`HK$${revenue.toLocaleString()}`} />
      </div>

      {/* Pipeline Funnel */}
      <div className="border border-white/20 p-8">
        <div className="flex flex-col gap-1 mb-8">
          <span className="text-[9px] font-mono text-zinc-600 uppercase tracking-widest">Section_01</span>
          <h2 className="text-lg font-mono font-black text-white uppercase tracking-tighter">Pipeline_Funnel</h2>
        </div>
        <div className="space-y-5">
          {funnelData.map(({ status, count }) => (
            <div key={status}>
              <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-widest">
                <span className="text-zinc-400 font-bold">{STATUS_LABELS[status]}</span>
                <span className="text-white font-black">{count}</span>
              </div>
              <Bar pct={(count / funnelMax) * 100} />
            </div>
          ))}
          <div className="pt-4 border-t border-white/10">
            <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-widest">
              <span className="text-zinc-600 font-bold">Lost / Not Interested</span>
              <span className="text-zinc-600 font-black">
                {leads.filter((l) => l.status === 'lost' || l.status === 'not_interested').length}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Top Districts */}
        <div className="border border-white/20 p-8 md:col-span-1">
          <div className="flex flex-col gap-1 mb-8">
            <span className="text-[9px] font-mono text-zinc-600 uppercase tracking-widest">Section_02</span>
            <h2 className="text-lg font-mono font-black text-white uppercase tracking-tighter">Top_Districts</h2>
          </div>
          {topDistricts.length === 0 ? (
            <p className="text-[10px] font-mono text-zinc-700 uppercase tracking-widest">No data yet</p>
          ) : (
            <div className="space-y-4">
              {topDistricts.map(([district, count]) => (
                <div key={district}>
                  <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-widest">
                    <span className="text-zinc-400 font-bold">{district}</span>
                    <span className="text-white font-black">{count}</span>
                  </div>
                  <Bar pct={(count / districtMax) * 100} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Business Types */}
        <div className="border border-white/20 p-8 md:col-span-1">
          <div className="flex flex-col gap-1 mb-8">
            <span className="text-[9px] font-mono text-zinc-600 uppercase tracking-widest">Section_03</span>
            <h2 className="text-lg font-mono font-black text-white uppercase tracking-tighter">Business_Types</h2>
          </div>
          {topTypes.length === 0 ? (
            <p className="text-[10px] font-mono text-zinc-700 uppercase tracking-widest">No data yet</p>
          ) : (
            <div className="space-y-4">
              {topTypes.map(([type, count]) => (
                <div key={type}>
                  <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-widest">
                    <span className="text-zinc-400 font-bold">{type}</span>
                    <span className="text-white font-black">{count}</span>
                  </div>
                  <Bar pct={(count / typeMax) * 100} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Score Distribution */}
        <div className="border border-white/20 p-8 md:col-span-1">
          <div className="flex flex-col gap-1 mb-8">
            <span className="text-[9px] font-mono text-zinc-600 uppercase tracking-widest">Section_04</span>
            <h2 className="text-lg font-mono font-black text-white uppercase tracking-tighter">Lead_Quality</h2>
          </div>
          <div className="space-y-4">
            {(['HOT', 'WARM', 'MID', 'COLD'] as ScoreTier[]).map((tier) => (
              <div key={tier}>
                <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-widest">
                  <span className={`font-black ${TIER_STYLES[tier].split(' ')[0]}`}>{tier}</span>
                  <span className="text-white font-black">{tierCounts[tier]}</span>
                </div>
                <Bar
                  pct={(tierCounts[tier] / tierMax) * 100}
                  color={
                    tier === 'HOT' ? 'bg-red-400' :
                    tier === 'WARM' ? 'bg-amber-400' :
                    tier === 'MID' ? 'bg-yellow-600' : 'bg-zinc-700'
                  }
                />
              </div>
            ))}
          </div>
          <div className="mt-8 pt-6 border-t border-white/10 space-y-2">
            <p className="text-[9px] font-mono text-zinc-600 uppercase tracking-widest">Score Breakdown</p>
            <p className="text-[9px] font-mono text-zinc-700 leading-relaxed">
              HOT ≥80 · WARM ≥60 · MID ≥40 · COLD &lt;40
              <br />
              No website +40 · Reviews +25 max · Rating +15 max · Phone +15 · Address +5
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
