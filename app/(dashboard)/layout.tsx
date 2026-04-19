import Sidebar from '@/components/layout/Sidebar'
import StatsBar from '@/components/layout/StatsBar'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-screen bg-background grid-bg overflow-hidden border-white/10">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden border-l border-white/10">
        <StatsBar />
        <main className="flex-1 overflow-y-auto p-10">{children}</main>
      </div>
    </div>
  )
}
