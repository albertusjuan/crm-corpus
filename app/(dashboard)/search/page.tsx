'use client'

import { useState, useRef } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { BusinessResult, HK_DISTRICTS } from '@/types'
import SearchForm from '@/components/search/SearchForm'
import SearchResults from '@/components/search/SearchResults'
import MassScanPanel from '@/components/search/MassScanPanel'
import { toast } from 'sonner'

async function fetchExistingPlaceIds(): Promise<Set<string>> {
  const supabase = createClient()
  const { data } = await supabase.from('leads').select('google_place_id')
  return new Set((data ?? []).map((r) => r.google_place_id))
}

async function scrape(businessType: string, district: string): Promise<BusinessResult[]> {
  const res = await fetch('/api/scrape', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ businessType, district }),
  })
  if (!res.ok) throw new Error('Search failed')
  const json = await res.json()
  return json.results
}

export default function SearchPage() {
  const [mode, setMode] = useState<'precision' | 'mass'>('precision')
  const [results, setResults] = useState<BusinessResult[]>([])
  const [hasSearched, setHasSearched] = useState(false)
  const [massProgress, setMassProgress] = useState<{
    current: number
    total: number
    district: string
    found: number
  } | null>(null)
  const abortRef = useRef(false)

  const { data: existingPlaceIds = new Set<string>() } = useQuery({
    queryKey: ['existing-place-ids'],
    queryFn: fetchExistingPlaceIds,
  })

  const { mutate, isPending } = useMutation({
    mutationFn: ({ businessType, district }: { businessType: string; district: string }) =>
      scrape(businessType, district),
    onSuccess: (data) => {
      setResults(data)
      setHasSearched(true)
      const noWebsite = data.filter((r) => !r.has_website).length
      toast.success(`Found ${data.length} businesses — ${noWebsite} without websites`)
    },
    onError: () => {
      toast.error('Search failed. Check your API key and try again.')
    },
  })

  function handleSearch(businessType: string, district: string) {
    mutate({ businessType, district })
  }

  async function handleMassScan() {
    abortRef.current = false
    setResults([])
    setHasSearched(false)

    const accumulated = new Map<string, BusinessResult>()
    const districts = [...HK_DISTRICTS]

    for (let i = 0; i < districts.length; i++) {
      if (abortRef.current) break

      const noWebsiteCount = Array.from(accumulated.values()).filter((r) => !r.has_website).length
      setMassProgress({ current: i + 1, total: districts.length, district: districts[i], found: noWebsiteCount })

      try {
        const res = await fetch('/api/scrape', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ businessType: 'shop', district: districts[i] }),
        })
        if (res.ok) {
          const json = await res.json()
          for (const biz of json.results as BusinessResult[]) {
            accumulated.set(biz.google_place_id, biz)
          }
          setResults(Array.from(accumulated.values()))
          setHasSearched(true)
        }
      } catch {
        // skip failed district, continue
      }
    }

    const finalNoWebsite = Array.from(accumulated.values()).filter((r) => !r.has_website).length
    setMassProgress(null)

    if (!abortRef.current) {
      toast.success(`Mass scan complete — ${accumulated.size} businesses found, ${finalNoWebsite} without websites`)
    } else {
      toast(`Scan aborted — ${accumulated.size} businesses found so far`)
    }
  }

  function handleAbort() {
    abortRef.current = true
  }

  function handleModeSwitch(newMode: 'precision' | 'mass') {
    setMode(newMode)
    setResults([])
    setHasSearched(false)
  }

  const isLoading = isPending || massProgress !== null

  return (
    <div className="space-y-12">
      <div className="flex flex-col gap-1">
        <span className="text-[10px] text-zinc-600 font-mono tracking-[0.4em] uppercase">Module_01</span>
        <h1 className="text-4xl font-black text-white font-mono uppercase tracking-tighter">
          Target_Acquisition
        </h1>
        <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest mt-2">
          Mapping legacy business entities across the Hong Kong digital ecosystem
        </p>
      </div>

      <div className="flex border border-white/20">
        <button
          onClick={() => handleModeSwitch('precision')}
          disabled={massProgress !== null}
          className={`flex-1 h-10 font-mono font-black text-[10px] uppercase tracking-widest transition-all ${
            mode === 'precision'
              ? 'bg-white text-black'
              : 'bg-transparent text-zinc-500 hover:text-white disabled:cursor-not-allowed'
          }`}
        >
          PRECISION_SCAN
        </button>
        <button
          onClick={() => handleModeSwitch('mass')}
          disabled={massProgress !== null}
          className={`flex-1 h-10 font-mono font-black text-[10px] uppercase tracking-widest transition-all border-l border-white/20 ${
            mode === 'mass'
              ? 'bg-white text-black'
              : 'bg-transparent text-zinc-500 hover:text-white disabled:cursor-not-allowed'
          }`}
        >
          MASS_SCAN
        </button>
      </div>

      {mode === 'precision' ? (
        <SearchForm onSearch={handleSearch} loading={isPending} />
      ) : (
        <MassScanPanel
          progress={massProgress}
          onStart={handleMassScan}
          onAbort={handleAbort}
        />
      )}

      <SearchResults
        results={results}
        existingPlaceIds={existingPlaceIds}
        loading={mode === 'precision' ? isPending : false}
        hasSearched={hasSearched}
      />
    </div>
  )
}
