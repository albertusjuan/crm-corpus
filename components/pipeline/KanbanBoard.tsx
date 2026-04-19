'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'
import { createClient } from '@/lib/supabase/client'
import { Lead, LeadStatus, STATUS_LABELS, STATUS_EMOJI } from '@/types'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'
import { Instagram, GripVertical } from 'lucide-react'

const COLUMNS: { status: LeadStatus }[] = [
  { status: 'new' },
  { status: 'contacted' },
  { status: 'responded' },
  { status: 'meeting' },
  { status: 'won' },
  { status: 'lost' },
]

async function fetchLeads(): Promise<Lead[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('leads')
    .select('*')
    .not('status', 'eq', 'not_interested')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

export default function KanbanBoard() {
  const queryClient = useQueryClient()
  const { data: leads = [], isLoading } = useQuery({
    queryKey: ['leads-kanban'],
    queryFn: fetchLeads,
  })

  async function handleDragEnd(result: DropResult) {
    if (!result.destination) return
    const newStatus = result.destination.droppableId as LeadStatus
    const leadId = result.draggableId

    const lead = leads.find((l) => l.id === leadId)
    if (!lead || lead.status === newStatus) return

    // Optimistic update
    queryClient.setQueryData<Lead[]>(['leads-kanban'], (old) =>
      (old ?? []).map((l) =>
        l.id === leadId ? { ...l, status: newStatus } : l
      )
    )

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

    const { error } = await supabase.from('leads').update(updates).eq('id', leadId)

    if (error) {
      toast.error('Failed to update status')
      queryClient.invalidateQueries({ queryKey: ['leads-kanban'] })
    } else {
      toast.success(`Moved to ${STATUS_LABELS[newStatus]}`)
      queryClient.invalidateQueries({ queryKey: ['leads'] })
      queryClient.invalidateQueries({ queryKey: ['leads-stats'] })
    }
  }

  const grouped = COLUMNS.reduce<Record<LeadStatus, Lead[]>>(
    (acc, { status }) => {
      acc[status] = leads.filter((l) => l.status === status)
      return acc
    },
    {} as Record<LeadStatus, Lead[]>
  )

  if (isLoading) {
    return (
      <div className="flex gap-6 overflow-x-auto pb-4">
        {COLUMNS.map(({ status }) => (
          <div
            key={status}
            className="flex-shrink-0 w-72 bg-zinc-50 border-2 border-black h-96 animate-pulse"
          />
        ))}
      </div>
    )
  }

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="flex gap-8 overflow-x-auto pb-12 no-scrollbar">
        {COLUMNS.map(({ status }) => {
          const columnLeads = grouped[status] ?? []
          return (
            <div key={status} className="flex-shrink-0 w-80 h-full min-h-[600px] flex flex-col">
              <div className="bg-zinc-900 text-white p-4 border-x border-t border-white/10 flex items-center justify-between">
                <h3 className="font-mono font-black text-[9px] uppercase tracking-[0.3em]">
                  {STATUS_LABELS[status]}
                </h3>
                <span className="font-mono text-[9px] text-zinc-500 font-bold">
                  [{columnLeads.length}]
                </span>
              </div>

              <Droppable droppableId={status}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`flex-1 p-4 border border-white/10 bg-black transition-colors space-y-4 ${
                      snapshot.isDraggingOver ? 'bg-zinc-950' : ''
                    }`}
                  >
                    {columnLeads.map((lead, index) => (
                      <Draggable
                        key={lead.id}
                        draggableId={lead.id}
                        index={index}
                      >
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className={`bg-zinc-950 p-6 border border-white/10 transition-all ${
                              snapshot.isDragging ? 'border-white z-50 bg-black' : 'hover:border-white/40'
                            }`}
                          >
                            <div className="flex flex-col gap-4">
                              <div className="flex items-start justify-between gap-3">
                                <p className="font-mono font-black text-[11px] text-white uppercase tracking-widest leading-tight flex-1">
                                  {lead.business_name}
                                </p>
                                <div
                                  {...provided.dragHandleProps}
                                  className="text-zinc-700 hover:text-white transition-colors"
                                >
                                  <GripVertical className="h-4 w-4" />
                                </div>
                              </div>

                              <div className="space-y-1.5">
                                <div className="flex items-center justify-between">
                                  <span className="text-[8px] font-mono text-zinc-600 uppercase tracking-widest">Loc</span>
                                  <span className="text-[9px] font-mono text-white font-bold uppercase">{lead.district}</span>
                                </div>
                                {lead.business_type && (
                                  <div className="flex items-center justify-between">
                                    <span className="text-[8px] font-mono text-zinc-600 uppercase tracking-widest">Type</span>
                                    <span className="text-[9px] font-mono text-zinc-400 font-bold uppercase">{lead.business_type}</span>
                                  </div>
                                )}
                              </div>

                              <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                                <p className="text-[8px] font-mono text-zinc-600 uppercase tracking-widest">
                                  {formatDistanceToNow(new Date(lead.created_at), {
                                    addSuffix: true,
                                  })}
                                </p>
                                <div className="w-1 h-1 bg-white/20" />
                              </div>
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          )
        })}
      </div>
    </DragDropContext>
  )
}
