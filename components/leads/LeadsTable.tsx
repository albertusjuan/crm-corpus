'use client'

import { Lead } from '@/types'
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import LeadRow from './LeadRow'

interface LeadsTableProps {
  leads: Lead[]
  onOpenDetail: (lead: Lead) => void
}

export default function LeadsTable({ leads, onOpenDetail }: LeadsTableProps) {
  if (leads.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-16 text-center">
        <div className="text-4xl mb-3">📋</div>
        <h3 className="text-lg font-medium text-gray-700 mb-1">No leads found</h3>
        <p className="text-sm text-gray-400">
          Search for businesses and add them to your leads list
        </p>
      </div>
    )
  }

  return (
    <div className="bg-black border border-white/10 overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent border-b border-white/20">
            <TableHead>IDENTIFIER</TableHead>
            <TableHead>SECTOR</TableHead>
            <TableHead>REGION</TableHead>
            <TableHead>COMM_CHANNEL</TableHead>
            <TableHead>TRUST_INDEX</TableHead>
            <TableHead>SCORE</TableHead>
            <TableHead>PLATFORM</TableHead>
            <TableHead>STATUS</TableHead>
            <TableHead>TIMESTAMP</TableHead>
            <TableHead className="w-10"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {leads.map((lead) => (
            <LeadRow key={lead.id} lead={lead} onOpenDetail={onOpenDetail} />
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
