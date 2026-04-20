'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Search, List, Kanban, Globe, LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { useEffect, useState } from 'react'

const navItems = [
  { href: '/search', label: 'Find Leads', id: '01' },
  { href: '/leads', label: 'All Leads', id: '02' },
  { href: '/pipeline', label: 'Pipeline', id: '03' },
  { href: '/analytics', label: 'Analytics', id: '04' },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [email, setEmail] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      setEmail(data.user?.email ?? null)
    })
  }, [])

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <aside className="w-64 bg-background flex flex-col border-r border-white/20">
      <div className="px-10 h-[72px] flex items-center border-b border-white/20">
        <div className="flex flex-col gap-1">
          <span className="text-white font-black text-2xl tracking-tighter uppercase font-mono">WebLeads</span>
          <span className="text-[10px] text-zinc-500 font-mono tracking-[0.3em] uppercase">Hong Kong Unit</span>
        </div>
      </div>

      <nav className="flex-1 p-6 space-y-2">
        {navItems.map(({ href, label, id }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              'group flex items-center justify-between px-4 py-4 border border-transparent transition-all font-mono text-xs uppercase tracking-widest',
              pathname === href
                ? 'bg-white text-black border-white'
                : 'text-zinc-400 hover:text-white hover:border-white/40'
            )}
          >
            <span>{label}</span>
            <span className="text-[9px] opacity-40 font-mono">{id}</span>
          </Link>
        ))}
      </nav>

      <div className="p-8 border-t border-white/20 bg-zinc-950/50">
        <div className="mb-6">
          <p className="text-[9px] text-zinc-600 uppercase font-mono tracking-widest mb-2">Auth.Context</p>
          <p className="text-[10px] text-white font-mono truncate font-bold">{email}</p>
        </div>
        <button
          onClick={handleLogout}
          className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 hover:text-white transition-colors flex items-center gap-2 group"
        >
          <span className="w-1.5 h-1.5 bg-zinc-800 group-hover:bg-white transition-colors" />
          <span>Disconnect</span>
        </button>
      </div>
    </aside>
  )
}
