'use client'

import { useState } from 'react'
import { BusinessResult } from '@/types'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import BusinessCard from './BusinessCard'
import { Skeleton } from '@/components/ui/skeleton'

interface SearchResultsProps {
  results: BusinessResult[]
  existingPlaceIds: Set<string>
  loading: boolean
  hasSearched: boolean
}

export default function SearchResults({
  results,
  existingPlaceIds,
  loading,
  hasSearched,
}: SearchResultsProps) {
  const [showWithWebsites, setShowWithWebsites] = useState(false)
  const [addedIds, setAddedIds] = useState<string[]>([])
  const [capturingAll, setCapturingAll] = useState(false)

  const filtered = showWithWebsites
    ? results
    : results.filter((r) => !r.has_website)

  const uncaptured = filtered.filter(
    (r) => !existingPlaceIds.has(r.google_place_id) && !addedIds.includes(r.google_place_id)
  )

  function handleAdded(placeId: string) {
    setAddedIds((prev) => [...prev, placeId])
  }

  async function handleCaptureAll() {
    if (uncaptured.length === 0) return
    setCapturingAll(true)
    try {
      const supabase = createClient()
      const rows = uncaptured.map((b) => ({
        google_place_id: b.google_place_id,
        business_name: b.business_name,
        business_type: b.business_type,
        district: b.district,
        full_address: b.full_address,
        phone: b.phone,
        google_maps_url: b.google_maps_url,
        google_rating: b.google_rating,
        google_review_count: b.google_review_count,
        instagram_handle: b.instagram_handle,
        facebook_url: b.facebook_url,
        has_website: b.has_website,
        website_url: b.website_url,
        raw_data: b.raw_data,
        status: 'new',
        source: 'google_maps',
        deal_value_hkd: 2000,
      }))

      const { error } = await supabase
        .from('leads')
        .upsert(rows, { onConflict: 'google_place_id' })

      if (error) throw error

      setAddedIds((prev) => [...prev, ...uncaptured.map((b) => b.google_place_id)])
      toast.success(`${uncaptured.length} leads captured`)
    } catch {
      toast.error('Bulk capture failed')
    } finally {
      setCapturingAll(false)
    }
  }

  if (loading) {
    return (
      <div>
        <div className="flex items-center justify-between mb-8">
          <Skeleton className="h-4 w-32 rounded-none bg-zinc-900" />
          <Skeleton className="h-4 w-40 rounded-none bg-zinc-900" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-80 rounded-none bg-zinc-900" />
          ))}
        </div>
      </div>
    )
  }

  if (!hasSearched) {
    return (
      <div className="flex flex-col items-center justify-center py-32 border border-white/5 bg-zinc-950/20">
        <div className="w-12 h-[1px] bg-white/20 mb-8" />
        <h3 className="text-xl font-mono font-black text-white uppercase tracking-tighter mb-2">
          Awaiting_Input
        </h3>
        <p className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest">
          Select parameters above to initialize entity scan
        </p>
      </div>
    )
  }

  if (filtered.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-32 border border-white/5 bg-zinc-950/20">
        <div className="w-12 h-[1px] bg-white/20 mb-8" />
        <h3 className="text-xl font-mono font-black text-white uppercase tracking-tighter mb-2">
          Zero_Results_Found
        </h3>
        <p className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest mb-6">
          Modify scan parameters and retry
        </p>
        {!showWithWebsites && results.length > 0 && (
          <button
            onClick={() => setShowWithWebsites(true)}
            className="text-[10px] font-mono font-bold text-white uppercase tracking-widest hover:underline"
          >
            ✦ Include entities with existing digital presence [{results.length}]
          </button>
        )}
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8 border-b border-white/5 pb-6">
        <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
          Entities_Found: <span className="text-white font-black">{filtered.length}</span>
          {!showWithWebsites && (
            <span className="ml-2 text-zinc-700">[Legacy_Entities_Only]</span>
          )}
        </p>
        <div className="flex items-center gap-6">
          {uncaptured.length > 0 && (
            <button
              onClick={handleCaptureAll}
              disabled={capturingAll}
              className="text-[10px] font-mono font-black text-white uppercase tracking-widest border border-white px-4 py-2 hover:bg-white hover:text-black transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {capturingAll ? 'CAPTURING...' : `CAPTURE_ALL [${uncaptured.length}]`}
            </button>
          )}
          <label className="flex items-center gap-3 text-[10px] font-mono text-zinc-500 uppercase tracking-widest cursor-pointer select-none group">
            <input
              type="checkbox"
              checked={showWithWebsites}
              onChange={(e) => setShowWithWebsites(e.target.checked)}
              className="w-3 h-3 border border-white/20 bg-transparent rounded-none checked:bg-white appearance-none transition-colors cursor-pointer"
            />
            <span className="group-hover:text-white transition-colors">Show_All_Entities</span>
          </label>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filtered.map((business) => (
          <BusinessCard
            key={business.google_place_id}
            business={business}
            isAdded={
              existingPlaceIds.has(business.google_place_id) ||
              addedIds.includes(business.google_place_id)
            }
            onAdded={handleAdded}
          />
        ))}
      </div>
    </div>
  )
}
