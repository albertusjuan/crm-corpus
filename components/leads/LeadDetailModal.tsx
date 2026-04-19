'use client'

import { useState } from 'react'
import { Lead, LeadStatus, STATUS_LABELS } from '@/types'
import { createClient } from '@/lib/supabase/client'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { format } from 'date-fns'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

const STATUSES: LeadStatus[] = [
  'new', 'contacted', 'responded', 'meeting', 'won', 'lost', 'not_interested',
]

interface LeadDetailModalProps {
  lead: Lead | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function LeadDetailModal({
  lead,
  open,
  onOpenChange,
}: LeadDetailModalProps) {
  const queryClient = useQueryClient()
  const [notes, setNotes] = useState(lead?.notes ?? '')
  const [dealValue, setDealValue] = useState(String(lead?.deal_value_hkd ?? 2000))

  if (lead && notes !== (lead.notes ?? '') && !open) {
    setNotes(lead.notes ?? '')
    setDealValue(String(lead.deal_value_hkd ?? 2000))
  }

  async function saveNotes() {
    if (!lead) return
    const supabase = createClient()
    const { error } = await supabase
      .from('leads')
      .update({ notes, updated_at: new Date().toISOString() })
      .eq('id', lead.id)
    if (error) toast.error('Failed to save notes')
    else {
      toast.success('Notes saved')
      queryClient.invalidateQueries({ queryKey: ['leads'] })
    }
  }

  async function saveDealValue() {
    if (!lead) return
    const value = parseInt(dealValue) || 2000
    const supabase = createClient()
    const { error } = await supabase
      .from('leads')
      .update({ deal_value_hkd: value, updated_at: new Date().toISOString() })
      .eq('id', lead.id)
    if (!error) queryClient.invalidateQueries({ queryKey: ['leads'] })
  }

  async function updateStatus(newStatus: LeadStatus) {
    if (!lead) return
    const supabase = createClient()
    const updates: Partial<Lead> = {
      status: newStatus,
      updated_at: new Date().toISOString(),
    }
    if (newStatus === 'contacted' && !lead.contacted_at) {
      updates.contacted_at = new Date().toISOString()
    }
    if (newStatus === 'won' || newStatus === 'lost') {
      updates.closed_at = new Date().toISOString()
    }

    const { error } = await supabase
      .from('leads')
      .update(updates)
      .eq('id', lead.id)

    if (error) toast.error('Failed to update status')
    else {
      toast.success(`Status → ${STATUS_LABELS[newStatus]}`)
      queryClient.invalidateQueries({ queryKey: ['leads'] })
      queryClient.invalidateQueries({ queryKey: ['leads-stats'] })
    }
  }

  async function deleteLead() {
    if (!lead) return
    if (!confirm(`Delete "${lead.business_name}"? This cannot be undone.`)) return
    const supabase = createClient()
    const { error } = await supabase.from('leads').delete().eq('id', lead.id)
    if (error) {
      toast.error('Failed to delete lead')
    } else {
      toast.success('Lead deleted')
      onOpenChange(false)
      queryClient.invalidateQueries({ queryKey: ['leads'] })
      queryClient.invalidateQueries({ queryKey: ['leads-stats'] })
    }
  }

  if (!lead) return null

  const timeline = [
    { label: 'RECORD_INITIALIZED', date: lead.created_at },
    lead.contacted_at ? { label: 'ENGAGEMENT_STARTED', date: lead.contacted_at } : null,
    lead.closed_at ? { label: 'TRANSACTION_FINALIZED', date: lead.closed_at } : null,
  ].filter(Boolean) as { label: string; date: string }[]

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto flex flex-col gap-10 pb-12">
        <SheetHeader>
          <div className="flex flex-col gap-1 mb-2">
            <span className="text-[10px] text-zinc-600 font-mono tracking-[0.4em] uppercase">Entity_Detail</span>
            <SheetTitle>{lead.business_name}</SheetTitle>
          </div>
          <div className="flex flex-wrap gap-3">
            {lead.business_type && (
              <span className="px-3 py-1 border border-white/20 text-white text-[9px] font-mono font-bold uppercase tracking-widest">
                {lead.business_type}
              </span>
            )}
            {lead.district && (
              <span className="px-3 py-1 bg-white text-black text-[9px] font-mono font-bold uppercase tracking-widest">
                {lead.district}
              </span>
            )}
          </div>
        </SheetHeader>

        <div className="grid grid-cols-1 gap-8">
          <div className="space-y-4 py-6 border-y border-white/10">
            {lead.full_address && (
              <div className="flex flex-col gap-1">
                <span className="text-[8px] font-mono text-zinc-600 uppercase tracking-widest">Address_String</span>
                <span className="text-[10px] font-mono text-white uppercase tracking-tighter leading-relaxed">{lead.full_address}</span>
              </div>
            )}
            <div className="grid grid-cols-2 gap-6">
              {lead.phone && (
                <div className="flex flex-col gap-1">
                  <span className="text-[8px] font-mono text-zinc-600 uppercase tracking-widest">Comm_Link</span>
                  <span className="text-[10px] font-mono font-bold text-white tracking-widest">{lead.phone}</span>
                </div>
              )}
              {lead.google_rating && (
                <div className="flex flex-col gap-1">
                  <span className="text-[8px] font-mono text-zinc-600 uppercase tracking-widest">Trust_Index</span>
                  <span className="text-[10px] font-mono font-black text-white">{lead.google_rating} <span className="text-zinc-500 font-normal">[{lead.google_review_count}]</span></span>
                </div>
              )}
            </div>
          </div>

          <div>
            <Label className="mb-4 block">Status_Control</Label>
            <div className="flex flex-wrap gap-2">
              {STATUSES.map((s) => (
                <button
                  key={s}
                  onClick={() => updateStatus(s)}
                  className={cn(
                    'px-3 py-2 border font-mono text-[9px] font-bold uppercase tracking-widest transition-all',
                    lead.status === s
                      ? 'bg-white text-black border-white'
                      : 'bg-transparent text-zinc-500 border-white/10 hover:border-white/40 hover:text-white'
                  )}
                >
                  {STATUS_LABELS[s]}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <Label>Projected_Yield</Label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[10px] font-mono text-zinc-500">HK$</span>
                <Input
                  type="number"
                  value={dealValue}
                  onChange={(e) => setDealValue(e.target.value)}
                  onBlur={saveDealValue}
                  className="pl-12 w-full"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <Label>Internal_Logs</Label>
            <Textarea
              placeholder="ENTER_DATA..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              onBlur={saveNotes}
            />
            <p className="text-[8px] font-mono text-zinc-700 uppercase tracking-widest">Auto_Sync_Enabled // Blur_Trigger</p>
          </div>

          <div className="space-y-4">
            <Label>Audit_Timeline</Label>
            <div className="space-y-3">
              {timeline.map(({ label, date }) => (
                <div key={label} className="flex items-center gap-4 text-[10px] font-mono">
                  <div className="w-1.5 h-1.5 bg-zinc-800" />
                  <span className="text-zinc-500 tracking-widest uppercase">{label}</span>
                  <span className="text-white font-bold ml-auto uppercase">
                    {format(new Date(date), 'yyyy.MM.dd // HH:mm')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-white/10 mt-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={deleteLead}
            className="w-full border-red-900/50 text-red-900 hover:bg-red-900 hover:text-white transition-all"
          >
            TERMINATE_RECORD
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
