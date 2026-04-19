'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { BUSINESS_TYPES, HK_DISTRICTS } from '@/types'
import { Search } from 'lucide-react'

interface SearchFormProps {
  onSearch: (businessType: string, district: string) => void
  loading: boolean
}

export default function SearchForm({ onSearch, loading }: SearchFormProps) {
  const [businessType, setBusinessType] = useState('')
  const [district, setDistrict] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (businessType && district) {
      onSearch(businessType, district)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-black border border-white/20 p-10 mb-16"
    >
      <div className="flex flex-col gap-1 mb-10">
        <span className="text-[10px] text-zinc-600 font-mono tracking-[0.4em] uppercase">Phase_01</span>
        <h2 className="text-2xl font-black text-white font-mono uppercase tracking-tighter">
          Target_Acquisition
        </h2>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-12 items-end">
        <div className="space-y-3">
          <Label className="font-mono text-[9px] uppercase font-bold text-zinc-500 tracking-widest">
            01.ENTITY_TYPE
          </Label>
          <Select value={businessType} onValueChange={setBusinessType}>
            <SelectTrigger className="border-white/20 bg-transparent rounded-none h-12 font-mono text-xs uppercase tracking-widest focus:ring-0 focus:border-white">
              <SelectValue placeholder="Select target..." />
            </SelectTrigger>
            <SelectContent className="rounded-none border-white/20 bg-black font-mono">
              {BUSINESS_TYPES.map((type) => (
                <SelectItem key={type} value={type} className="rounded-none hover:bg-white hover:text-black focus:bg-white focus:text-black text-xs uppercase">
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-3">
          <Label className="font-mono text-[9px] uppercase font-bold text-zinc-500 tracking-widest">
            02.HK_DISTRICT
          </Label>
          <Select value={district} onValueChange={setDistrict}>
            <SelectTrigger className="border-white/20 bg-transparent rounded-none h-12 font-mono text-xs uppercase tracking-widest focus:ring-0 focus:border-white">
              <SelectValue placeholder="Select location..." />
            </SelectTrigger>
            <SelectContent className="rounded-none border-white/20 bg-black font-mono">
              {HK_DISTRICTS.map((d) => (
                <SelectItem key={d} value={d} className="rounded-none hover:bg-white hover:text-black focus:bg-white focus:text-black text-xs uppercase">
                  {d}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button
          type="submit"
          disabled={!businessType || !district || loading}
          className="h-12 font-mono font-black uppercase tracking-widest border border-white bg-white text-black hover:bg-transparent hover:text-white transition-all rounded-none"
        >
          {loading ? 'SCANNING...' : 'EXECUTE_SCAN'}
        </Button>
      </div>
    </form>
  )
}
