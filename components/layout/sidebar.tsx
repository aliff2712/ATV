'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard, ShoppingCart, Package,
  BarChart3, Settings, LogOut, Boxes, ShoppingBag
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const menus = [
  { label: 'Dashboard',  href: '/dashboard',    icon: LayoutDashboard },
  { label: 'Kasir',      href: '/kasir',         icon: ShoppingCart },
  { label: 'Produk',     href: '/produk',        icon: Package },
  { label: 'Stok',       href: '/stok',          icon: Boxes },
  { label: 'Laporan',    href: '/laporan',       icon: BarChart3 },
  { label: 'Pengaturan', href: '/pengaturan',    icon: Settings },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <aside className="hidden md:flex flex-col w-64 min-h-screen bg-slate-900 text-white">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-700">
        <div className="bg-primary rounded-xl p-2">
          <ShoppingBag className="h-5 w-5 text-white" />
        </div>
        <span className="font-bold text-lg">ARTHAVA</span>
      </div>

      {/* Menu */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {menus.map((menu) => {
          const Icon = menu.icon
          const active = pathname === menu.href || pathname.startsWith(menu.href + '/')
          return (
            <Link
              key={menu.href}
              href={menu.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                active
                  ? 'bg-primary text-white'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {menu.label}
            </Link>
          )
        })}
      </nav>

      {/* Logout */}
      <div className="px-3 py-4 border-t border-slate-700">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-white transition-colors w-full"
        >
          <LogOut className="h-4 w-4" />
          Keluar
        </button>
      </div>
    </aside>
  )
}