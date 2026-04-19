'use client'

import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { BusinessResult } from '@/types'
import SearchForm from '@/components/search/SearchForm'
import SearchResults from '@/components/search/SearchResults'
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
  const [results, setResults] = useState<BusinessResult[]>([])
  const [hasSearched, setHasSearched] = useState(false)

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

      <SearchForm onSearch={handleSearch} loading={isPending} />

      <SearchResults
        results={results}
        existingPlaceIds={existingPlaceIds}
        loading={isPending}
        hasSearched={hasSearched}
      />
    </div>
  )
}
