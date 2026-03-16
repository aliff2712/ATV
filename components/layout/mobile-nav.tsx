'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { LayoutDashboard, ShoppingCart, Package, BarChart3, Boxes, LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const menus = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Kasir',     href: '/kasir',     icon: ShoppingCart },
  { label: 'Produk',    href: '/produk',    icon: Package },
  { label: 'Stok',      href: '/stok',      icon: Boxes },
  { label: 'Laporan',   href: '/laporan',   icon: BarChart3 },
]

export default function MobileNav() {
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t z-50 safe-area-pb">
      <div className="flex items-stretch">
        {menus.map((menu) => {
          const Icon = menu.icon
          const active = pathname === menu.href || pathname.startsWith(menu.href + '/')
          return (
            <Link
              key={menu.href}
              href={menu.href}
              className={cn(
                'flex-1 flex flex-col items-center py-2 gap-0.5 text-[10px] font-medium transition-colors',
                active ? 'text-primary' : 'text-slate-400'
              )}
            >
              <Icon className="h-5 w-5" />
              {menu.label}
            </Link>
          )
        })}

        {/* Divider */}
        <div className="w-px bg-slate-100 my-2" />

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="flex-1 flex flex-col items-center py-2 gap-0.5 text-[10px] font-medium text-red-400 transition-colors active:text-red-600"
        >
          <LogOut className="h-5 w-5" />
          Keluar
        </button>
      </div>
    </nav>
  )
}