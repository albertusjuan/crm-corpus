'use client'

import { Lead, LeadStatus, STATUS_LABELS, STATUS_COLORS, STATUS_EMOJI } from '@/types'
import { createClient } from '@/lib/supabase/client'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'
import { TableCell, TableRow } from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import {
  Star,
  MapPin,
  Instagram,
  MoreHorizontal,
  Pencil,
  ExternalLink,
  Trash2,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const STATUSES: LeadStatus[] = [
  'new', 'contacted', 'responded', 'meeting', 'won', 'lost', 'not_interested',
]

interface LeadRowProps {
  lead: Lead
  onOpenDetail: (lead: Lead) => void
}

export default function LeadRow({ lead, onOpenDetail }: LeadRowProps) {
  const queryClient = useQueryClient()

  async function updateStatus(newStatus: LeadStatus) {
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

    if (error) {
      toast.error('Failed to update status')
    } else {
      toast.success(`Status updated to ${STATUS_LABELS[newStatus]}`)
      queryClient.invalidateQueries({ queryKey: ['leads'] })
      queryClient.invalidateQueries({ queryKey: ['leads-stats'] })
    }
  }

  async function deleteLead() {
    if (!confirm(`Delete "${lead.business_name}"? This cannot be undone.`)) return
    const supabase = createClient()
    const { error } = await supabase.from('leads').delete().eq('id', lead.id)
    if (error) {
      toast.error('Failed to delete lead')
    } else {
      toast.success('Lead deleted')
      queryClient.invalidateQueries({ queryKey: ['leads'] })
      queryClient.invalidateQueries({ queryKey: ['leads-stats'] })
    }
  }

  return (
    <TableRow>
      <TableCell>
        <button
          onClick={() => onOpenDetail(lead)}
          className="font-mono font-black text-white hover:underline text-left uppercase tracking-tighter"
        >
          {lead.business_name}
        </button>
      </TableCell>

      <TableCell>
        {lead.business_type && (
          <span className="text-zinc-400 font-mono text-[10px] uppercase font-bold tracking-widest">
            {lead.business_type}
          </span>
        )}
      </TableCell>

      <TableCell className="font-mono text-[10px] text-zinc-500 uppercase tracking-widest">{lead.district ?? '—'}</TableCell>

      <TableCell>
        <div className="space-y-1 font-mono">
          {lead.phone && <div className="text-[10px] text-white font-bold tracking-widest">{lead.phone}</div>}
          {lead.instagram_handle && (
            <div className="text-[9px] text-zinc-400 font-bold uppercase tracking-widest">
              @{lead.instagram_handle}
            </div>
          )}
        </div>
      </TableCell>

      <TableCell>
        {lead.google_rating ? (
          <div className="flex items-center gap-1 font-mono">
            <span className="text-[11px] font-black text-white">{lead.google_rating}</span>
            <span className="text-[9px] text-zinc-600">[{lead.google_review_count}]</span>
          </div>
        ) : (
          <span className="text-xs text-zinc-800 font-mono">—</span>
        )}
      </TableCell>

      <TableCell>
        {lead.has_website ? (
          <span className="text-zinc-600 text-[9px] font-mono font-bold uppercase tracking-[0.2em]">
            Legacy
          </span>
        ) : (
          <span className="px-2 py-0.5 border border-white text-white text-[9px] font-mono font-bold uppercase tracking-[0.2em]">
            Required
          </span>
        )}
      </TableCell>

      <TableCell>
        <Select value={lead.status} onValueChange={(v) => updateStatus(v as LeadStatus)}>
          <SelectTrigger className="h-8 text-[9px] w-32 border border-white/20 bg-transparent rounded-none font-mono font-black uppercase tracking-widest focus:ring-0">
            <SelectValue>
              {STATUS_LABELS[lead.status]}
            </SelectValue>
          </SelectTrigger>
          <SelectContent className="rounded-none border-white/20 bg-black text-white font-mono">
            {STATUSES.map((s) => (
              <SelectItem key={s} value={s} className="text-[9px] uppercase font-bold rounded-none hover:bg-white hover:text-black focus:bg-white focus:text-black">
                {STATUS_LABELS[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </TableCell>

      <TableCell className="text-[9px] text-zinc-600 font-mono uppercase tracking-widest">
        {formatDistanceToNow(new Date(lead.created_at), { addSuffix: true })}
      </TableCell>

      <TableCell>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onOpenDetail(lead)}>
              <Pencil className="h-3.5 w-3.5 mr-2" />
              Edit Notes
            </DropdownMenuItem>
            {lead.google_maps_url && (
              <DropdownMenuItem asChild>
                <a href={lead.google_maps_url} target="_blank" rel="noopener noreferrer">
                  <MapPin className="h-3.5 w-3.5 mr-2" />
                  Open Google Maps
                </a>
              </DropdownMenuItem>
            )}
            {lead.instagram_handle && (
              <DropdownMenuItem asChild>
                <a
                  href={`https://instagram.com/${lead.instagram_handle}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Instagram className="h-3.5 w-3.5 mr-2" />
                  Open Instagram
                </a>
              </DropdownMenuItem>
            )}
            <DropdownMenuItem
              className="text-red-600 focus:text-red-600"
              onClick={deleteLead}
            >
              <Trash2 className="h-3.5 w-3.5 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  )
}
