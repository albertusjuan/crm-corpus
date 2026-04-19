'use client'

import { useState } from 'react'
import { BusinessResult } from '@/types'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Star, Phone, Instagram, Globe, MapPin, Plus, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { calcScore, scoreTier, TIER_STYLES } from '@/lib/scoring'

interface BusinessCardProps {
  business: BusinessResult
  isAdded: boolean
  onAdded: (placeId: string) => void
}

export default function BusinessCard({
  business,
  isAdded,
  onAdded,
}: BusinessCardProps) {
  const [adding, setAdding] = useState(false)

  const score = calcScore(business)
  const tier = scoreTier(score)

  async function handleAdd() {
    setAdding(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.from('leads').upsert(
        {
          google_place_id: business.google_place_id,
          business_name: business.business_name,
          business_type: business.business_type,
          district: business.district,
          full_address: business.full_address,
          phone: business.phone,
          google_maps_url: business.google_maps_url,
          google_rating: business.google_rating,
          google_review_count: business.google_review_count,
          instagram_handle: business.instagram_handle,
          facebook_url: business.facebook_url,
          has_website: business.has_website,
          website_url: business.website_url,
          raw_data: business.raw_data,
          status: 'new',
          source: 'google_maps',
          deal_value_hkd: 2000,
        },
        { onConflict: 'google_place_id' }
      )

      if (error) throw error

      toast.success(`${business.business_name} added to leads`)
      onAdded(business.google_place_id)
    } catch {
      toast.error('Failed to add lead')
    } finally {
      setAdding(false)
    }
  }

  return (
    <div className="bg-black border border-white/20 p-8 flex flex-col gap-6 transition-all hover:border-white group">
      <div className="flex flex-col gap-1">
        <div className="flex items-start justify-between gap-4">
          <h3 className="font-mono font-black text-white text-lg leading-tight uppercase tracking-tighter group-hover:underline decoration-2 underline-offset-4">
            {business.business_name}
          </h3>
          <div className="flex flex-col items-end gap-1 shrink-0">
            <span className="text-[9px] font-mono font-bold text-zinc-600 tracking-widest">REG::{business.google_place_id.slice(-8).toUpperCase()}</span>
            <span className={cn('text-[9px] font-mono font-black border px-1.5 py-0.5 tracking-widest', TIER_STYLES[tier])}>
              {tier} [{score}]
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 mt-1">
          {business.has_website ? (
            <div className="text-[9px] font-mono font-bold text-zinc-500 uppercase tracking-widest">
              Digital_Exists
            </div>
          ) : (
            <div className="px-2 py-0.5 border border-white text-white text-[9px] font-mono font-bold uppercase tracking-widest">
              Legacy_Entity
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-4">
        {business.business_type && (
          <div className="flex flex-col gap-1">
            <span className="text-[8px] font-mono text-zinc-600 uppercase tracking-widest">Type</span>
            <span className="text-[10px] font-mono font-bold text-white uppercase">{business.business_type}</span>
          </div>
        )}
        <div className="flex flex-col gap-1">
          <span className="text-[8px] font-mono text-zinc-600 uppercase tracking-widest">Location</span>
          <span className="text-[10px] font-mono font-bold text-white uppercase">{business.district}</span>
        </div>
      </div>

      <div className="space-y-4 py-6 border-y border-white/10">
        {business.full_address && (
          <div className="flex flex-col gap-1">
            <span className="text-[8px] font-mono text-zinc-600 uppercase tracking-widest">Address_String</span>
            <span className="text-[10px] font-mono text-white leading-relaxed uppercase tracking-tighter">{business.full_address}</span>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          {business.google_rating && (
            <div className="flex flex-col gap-1">
              <span className="text-[8px] font-mono text-zinc-600 uppercase tracking-widest">Trust_Index</span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-[11px] font-mono font-black text-white">{business.google_rating}</span>
                <span className="text-[9px] font-mono text-zinc-500">/{business.google_review_count}</span>
              </div>
            </div>
          )}

          {business.phone && (
            <div className="flex flex-col gap-1">
              <span className="text-[8px] font-mono text-zinc-600 uppercase tracking-widest">Comm_Link</span>
              <span className="text-[10px] font-mono font-bold text-white">{business.phone}</span>
            </div>
          )}
        </div>
      </div>

      <Button
        size="sm"
        disabled={isAdded || adding}
        onClick={handleAdd}
        className={cn(
          "w-full h-12 font-mono font-black uppercase tracking-widest transition-all rounded-none",
          isAdded
            ? "bg-transparent border border-white/20 text-zinc-500 cursor-not-allowed"
            : "bg-white text-black border border-white hover:bg-transparent hover:text-white"
        )}
      >
        {isAdded ? 'ENTITY_STORED' : (adding ? 'PROCESSING...' : 'CAPTURE_LEAD')}
      </Button>
    </div>
  )
}
