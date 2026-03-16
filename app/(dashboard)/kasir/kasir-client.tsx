'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Search, Plus, Minus, Trash2, ShoppingCart, CheckCircle, X, ChevronUp } from 'lucide-react'
import { formatRupiah } from '@/lib/utils'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'

interface Produk {
  id: string
  nama: string
  harga: number
  stok: number
  satuan: string
  kategori: { nama: string } | null
}

interface ItemKeranjang {
  produk: Produk
  jumlah: number
}

interface Props {
  produkList: Produk[]
  tokoId: string
  kasirId: string
}

export default function KasirClient({ produkList, tokoId, kasirId }: Props) {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [keranjang, setKeranjang] = useState<ItemKeranjang[]>([])
  const [bayar, setBayar] = useState('')
  const [loading, setLoading] = useState(false)
  const [sukses, setSukses] = useState(false)
  const [nomorTransaksi, setNomorTransaksi] = useState('')
  // State untuk bottom sheet keranjang di mobile
  const [showKeranjangMobile, setShowKeranjangMobile] = useState(false)

  const filtered = produkList.filter(p =>
    p.nama.toLowerCase().includes(search.toLowerCase())
  )

  const total = keranjang.reduce((sum, item) => sum + item.produk.harga * item.jumlah, 0)
  const kembalian = parseInt(bayar || '0') - total
  const totalItems = keranjang.reduce((sum, item) => sum + item.jumlah, 0)

  const tambahKeKeranjang = (produk: Produk) => {
    setKeranjang(prev => {
      const existing = prev.find(i => i.produk.id === produk.id)
      if (existing) {
        if (existing.jumlah >= produk.stok) return prev
        return prev.map(i => i.produk.id === produk.id
          ? { ...i, jumlah: i.jumlah + 1 } : i)
      }
      return [...prev, { produk, jumlah: 1 }]
    })
  }

  const ubahJumlah = (id: string, delta: number) => {
    setKeranjang(prev => prev
      .map(i => i.produk.id === id ? { ...i, jumlah: i.jumlah + delta } : i)
      .filter(i => i.jumlah > 0)
    )
  }

  const hapusDariKeranjang = (id: string) => {
    setKeranjang(prev => prev.filter(i => i.produk.id !== id))
  }

  const handleBayar = async () => {
    if (keranjang.length === 0 || parseInt(bayar || '0') < total) return
    setLoading(true)

    const supabase = createClient()
    const nomor = `TRX-${Date.now()}`

    const { data: transaksi, error } = await supabase
      .from('transaksi')
      .insert({
        toko_id: tokoId,
        kasir_id: kasirId,
        nomor_transaksi: nomor,
        total,
        bayar: parseInt(bayar),
        kembalian,
        metode_bayar: 'tunai',
      })
      .select()
      .single()

    if (error || !transaksi) {
      setLoading(false)
      return
    }

    await supabase.from('transaksi_item').insert(
      keranjang.map(item => ({
        transaksi_id: transaksi.id,
        produk_id: item.produk.id,
        nama_produk: item.produk.nama,
        harga: item.produk.harga,
        jumlah: item.jumlah,
        subtotal: item.produk.harga * item.jumlah,
      }))
    )

    for (const item of keranjang) {
      await supabase.rpc('kurangi_stok', {
        p_produk_id: item.produk.id,
        p_jumlah: item.jumlah
      })
    }

    setNomorTransaksi(nomor)
    setSukses(true)
    setShowKeranjangMobile(false)
    setLoading(false)
  }

  const handleTransaksiBaru = () => {
    setKeranjang([])
    setBayar('')
    setSukses(false)
    setNomorTransaksi('')
    router.refresh()
  }

  // ─── Reusable: konten keranjang (dipakai di desktop panel & mobile sheet) ───
  const KeranjangContent = () => (
    <>
      {/* Item keranjang */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {keranjang.length === 0 ? (
          <p className="text-center text-muted-foreground text-sm py-8">
            Tap produk untuk menambahkan
          </p>
        ) : (
          keranjang.map((item) => (
            <div key={item.produk.id} className="flex items-center gap-2 py-1.5 border-b">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">{item.produk.nama}</p>
                <p className="text-xs text-primary">{formatRupiah(item.produk.harga * item.jumlah)}</p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Button variant="outline" size="icon" className="h-7 w-7"
                  onClick={() => ubahJumlah(item.produk.id, -1)}>
                  <Minus className="h-3 w-3" />
                </Button>
                <span className="text-xs w-5 text-center font-medium">{item.jumlah}</span>
                <Button variant="outline" size="icon" className="h-7 w-7"
                  onClick={() => ubahJumlah(item.produk.id, 1)}>
                  <Plus className="h-3 w-3" />
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive"
                  onClick={() => hapusDariKeranjang(item.produk.id)}>
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Total & bayar */}
      <div className="p-4 border-t space-y-3 bg-slate-50">
        <div className="flex justify-between font-bold">
          <span>Total</span>
          <span className="text-primary">{formatRupiah(total)}</span>
        </div>
        <div>
          <Input
            type="number"
            placeholder="Nominal bayar (Rp)"
            value={bayar}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setBayar(e.target.value)}
            className="bg-white"
          />
          {parseInt(bayar || '0') >= total && total > 0 && (
            <p className="text-xs text-green-600 font-medium mt-1 pl-1">
              Kembalian: {formatRupiah(kembalian)}
            </p>
          )}
        </div>
        <Button
          className="w-full"
          size="lg"
          disabled={keranjang.length === 0 || parseInt(bayar || '0') < total || loading}
          onClick={handleBayar}
        >
          {loading ? 'Memproses...' : 'Proses Pembayaran'}
        </Button>
      </div>
    </>
  )

  return (
    <>
      {/* ─── LAYOUT UTAMA ─── */}
      <div className="flex flex-1 overflow-hidden">

        {/* Panel produk — full-width di mobile, flex-1 di desktop */}
        <div className="flex-1 flex flex-col overflow-hidden md:border-r">
          <div className="p-3 border-b">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari produk..."
                className="pl-9"
                value={search}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
              />
            </div>
          </div>
          {/* Grid produk — pb-28 di mobile agar tidak tertutup FAB + bottom nav */}
          <div className="flex-1 overflow-y-auto p-3 pb-28 md:pb-3">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {filtered.map((produk) => (
                <Card
                  key={produk.id}
                  className="cursor-pointer hover:border-primary transition-colors active:scale-95"
                  onClick={() => tambahKeKeranjang(produk)}
                >
                  <CardContent className="p-3">
                    <p className="font-medium text-xs leading-tight mb-1 line-clamp-2">{produk.nama}</p>
                    {produk.kategori && (
                      <Badge variant="secondary" className="text-xs mb-2 px-1.5 py-0">
                        {produk.kategori.nama}
                      </Badge>
                    )}
                    <p className="font-bold text-primary text-sm">{formatRupiah(produk.harga)}</p>
                    <p className="text-xs text-muted-foreground">Stok: {produk.stok}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>

        {/* Panel keranjang DESKTOP (w-80, hidden di mobile) */}
        <div className="hidden md:flex w-80 flex-col bg-white">
          <div className="p-4 border-b flex items-center gap-2">
            <ShoppingCart className="h-4 w-4" />
            <span className="font-semibold text-sm">Keranjang</span>
            {keranjang.length > 0 && (
              <Badge className="ml-auto">{keranjang.length}</Badge>
            )}
          </div>
          <KeranjangContent />
        </div>
      </div>

      {/* ─── FAB KERANJANG (mobile only) ─── */}
      {/* Posisi di atas bottom nav (bottom-16) */}
      <button
        onClick={() => setShowKeranjangMobile(true)}
        className={cn(
          'md:hidden fixed bottom-16 right-4 z-40',
          'bg-primary text-white rounded-full shadow-lg',
          'flex items-center gap-2 px-4 py-3',
          'transition-transform active:scale-95',
          keranjang.length === 0 && 'opacity-80'
        )}
      >
        <ShoppingCart className="h-5 w-5" />
        <span className="text-sm font-semibold">Keranjang</span>
        {totalItems > 0 && (
          <span className="bg-white text-primary text-xs font-bold rounded-full min-w-5 h-5 flex items-center justify-center px-1">
            {totalItems}
          </span>
        )}
      </button>

      {/* ─── BOTTOM SHEET KERANJANG (mobile only) ─── */}
      {showKeranjangMobile && (
        <div className="md:hidden fixed inset-0 z-50 flex flex-col justify-end">
          {/* Overlay */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowKeranjangMobile(false)}
          />

          {/* Sheet */}
          <div className="relative bg-white rounded-t-2xl flex flex-col max-h-[88vh] shadow-xl">
            {/* Handle & header */}
            <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b">
              <div className="flex items-center gap-2">
                <ShoppingCart className="h-4 w-4" />
                <span className="font-semibold text-sm">Keranjang</span>
                {keranjang.length > 0 && (
                  <Badge>{keranjang.length} item</Badge>
                )}
              </div>
              <button
                onClick={() => setShowKeranjangMobile(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Konten keranjang */}
            <KeranjangContent />
          </div>
        </div>
      )}

      {/* ─── Dialog sukses ─── */}
      <Dialog open={sukses} onOpenChange={() => {}}>
        <DialogContent className="max-w-sm text-center">
          <DialogHeader>
            <DialogTitle className="flex flex-col items-center gap-3">
              <CheckCircle className="h-12 w-12 text-green-500" />
              Transaksi Berhasil!
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <p className="text-sm text-muted-foreground">{nomorTransaksi}</p>
            <div className="bg-slate-50 rounded-lg p-4 space-y-1">
              <div className="flex justify-between text-sm">
                <span>Total</span>
                <span className="font-bold">{formatRupiah(total)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Bayar</span>
                <span>{formatRupiah(parseInt(bayar || '0'))}</span>
              </div>
              <div className="flex justify-between text-sm text-green-600 font-bold">
                <span>Kembalian</span>
                <span>{formatRupiah(kembalian)}</span>
              </div>
            </div>
          </div>
          <Button className="w-full" onClick={handleTransaksiBaru}>
            Transaksi Baru
          </Button>
        </DialogContent>
      </Dialog>
    </>
  )
}