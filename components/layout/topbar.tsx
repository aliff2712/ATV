'use client'

import { LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface TopbarProps {
  title: string
}

export default function Topbar({ title }: TopbarProps) {
  const router = useRouter()

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <header className="h-14 border-b bg-white flex items-center justify-between px-4 md:px-6 shrink-0">
      <h1 className="font-semibold text-slate-800">{title}</h1>

      {/* Logout hanya muncul di mobile (sidebar sudah handle di desktop) */}
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden text-slate-500 hover:text-red-500"
        onClick={handleLogout}
        title="Keluar"
      >
        <LogOut className="h-4 w-4" />
      </Button>
    </header>
  )
}