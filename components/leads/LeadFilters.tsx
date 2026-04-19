'use client'

import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { LeadStatus, HK_DISTRICTS, BUSINESS_TYPES, STATUS_LABELS } from '@/types'

const STATUSES: LeadStatus[] = [
  'new', 'contacted', 'responded', 'meeting', 'won', 'lost', 'not_interested',
]

const SORT_OPTIONS = [
  { value: 'created_at', label: 'DATE_ADDED' },
  { value: 'business_name', label: 'BUSINESS_NAME' },
  { value: 'status', label: 'STATUS_LEVEL' },
  { value: 'district', label: 'REGION' },
]

export interface Filters {
  search: string
  status: string
  district: string
  businessType: string
  sortBy: string
}

interface LeadFiltersProps {
  filters: Filters
  onChange: (filters: Filters) => void
}

export default function LeadFilters({ filters, onChange }: LeadFiltersProps) {
  function update(partial: Partial<Filters>) {
    onChange({ ...filters, ...partial })
  }

  return (
    <div className="bg-black border border-white/10 p-6 mb-8">
      <div className="flex flex-wrap gap-6 items-center">
        <div className="flex-1 min-w-[240px]">
          <Input
            placeholder="FILTER_BY_NAME..."
            className="bg-transparent border-white/20 rounded-none h-11 font-mono text-[10px] uppercase tracking-widest focus-visible:ring-0 focus-visible:border-white transition-colors"
            value={filters.search}
            onChange={(e) => update({ search: e.target.value })}
          />
        </div>

        <div className="flex flex-wrap gap-4">
          <Select value={filters.status} onValueChange={(v) => update({ status: v })}>
            <SelectTrigger className="w-40 border-white/20 bg-transparent rounded-none h-11 font-mono text-[9px] uppercase tracking-widest focus:ring-0">
              <SelectValue placeholder="STATUS_LEVEL" />
            </SelectTrigger>
            <SelectContent className="rounded-none border-white/20 bg-black font-mono">
              <SelectItem value="all" className="text-[9px] uppercase tracking-widest">ALL_STATUS</SelectItem>
              {STATUSES.map((s) => (
                <SelectItem key={s} value={s} className="text-[9px] uppercase tracking-widest">
                  {STATUS_LABELS[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filters.district} onValueChange={(v) => update({ district: v })}>
            <SelectTrigger className="w-40 border-white/20 bg-transparent rounded-none h-11 font-mono text-[9px] uppercase tracking-widest focus:ring-0">
              <SelectValue placeholder="REGION" />
            </SelectTrigger>
            <SelectContent className="rounded-none border-white/20 bg-black font-mono">
              <SelectItem value="all" className="text-[9px] uppercase tracking-widest">ALL_REGIONS</SelectItem>
              {HK_DISTRICTS.map((d) => (
                <SelectItem key={d} value={d} className="text-[9px] uppercase tracking-widest">
                  {d}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filters.businessType} onValueChange={(v) => update({ businessType: v })}>
            <SelectTrigger className="w-40 border-white/20 bg-transparent rounded-none h-11 font-mono text-[9px] uppercase tracking-widest focus:ring-0">
              <SelectValue placeholder="SECTOR" />
            </SelectTrigger>
            <SelectContent className="rounded-none border-white/20 bg-black font-mono">
              <SelectItem value="all" className="text-[9px] uppercase tracking-widest">ALL_SECTORS</SelectItem>
              {BUSINESS_TYPES.map((t) => (
                <SelectItem key={t} value={t} className="text-[9px] uppercase tracking-widest">
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="w-[1px] h-6 bg-white/10 mx-2" />

          <Select value={filters.sortBy} onValueChange={(v) => update({ sortBy: v })}>
            <SelectTrigger className="w-44 border-white/20 bg-transparent rounded-none h-11 font-mono text-[9px] uppercase tracking-widest focus:ring-0">
              <SelectValue placeholder="SORT_ORDER" />
            </SelectTrigger>
            <SelectContent className="rounded-none border-white/20 bg-black font-mono">
              {SORT_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value} className="text-[9px] uppercase tracking-widest">
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  )
}
