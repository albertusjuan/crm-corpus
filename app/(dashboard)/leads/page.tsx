'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { Lead } from '@/types'
import LeadFilters, { Filters } from '@/components/leads/LeadFilters'
import LeadsTable from '@/components/leads/LeadsTable'
import LeadDetailModal from '@/components/leads/LeadDetailModal'
import { Skeleton } from '@/components/ui/skeleton'

async function fetchLeads(): Promise<Lead[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('leads')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

export default function LeadsPage() {
  const [filters, setFilters] = useState<Filters>({
    search: '',
    status: 'all',
    district: 'all',
    businessType: 'all',
    sortBy: 'created_at',
  })
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)

  const { data: leads = [], isLoading } = useQuery({
    queryKey: ['leads'],
    queryFn: fetchLeads,
  })

  const filtered = leads
    .filter((l) => {
      if (filters.search && !l.business_name.toLowerCase().includes(filters.search.toLowerCase()))
        return false
      if (filters.status !== 'all' && l.status !== filters.status) return false
      if (filters.district !== 'all' && l.district !== filters.district) return false
      if (filters.businessType !== 'all' && l.business_type !== filters.businessType)
        return false
      return true
    })
    .sort((a, b) => {
      if (filters.sortBy === 'business_name') {
        return a.business_name.localeCompare(b.business_name)
      }
      if (filters.sortBy === 'status') {
        return a.status.localeCompare(b.status)
      }
      if (filters.sortBy === 'district') {
        return (a.district ?? '').localeCompare(b.district ?? '')
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })

  function handleOpenDetail(lead: Lead) {
    setSelectedLead(lead)
    setDetailOpen(true)
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <div className="w-4 h-4 bg-black" />
          <h1 className="text-3xl font-black text-black font-mono uppercase tracking-tighter">
            Database.Explorer
          </h1>
        </div>
        <p className="text-xs font-mono text-zinc-500 uppercase tracking-widest pl-7">
          ✦ TOTAL_RECORDS_INDEXED::{leads.length} ✦
        </p>
      </div>

      <LeadFilters filters={filters} onChange={setFilters} />

      {isLoading ? (
        <div className="bg-white border-2 border-black p-8 space-y-4 brutalist-shadow">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full rounded-none bg-zinc-100" />
          ))}
        </div>
      ) : (
        <LeadsTable leads={filtered} onOpenDetail={handleOpenDetail} />
      )}

      <LeadDetailModal
        lead={selectedLead}
        open={detailOpen}
        onOpenChange={setDetailOpen}
      />
    </div>
  )
}
