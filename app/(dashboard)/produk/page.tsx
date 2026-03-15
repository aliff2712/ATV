import { createClient } from '@/lib/supabase/server'
import Topbar from '@/components/layout/topbar'
import ProdukClient from './produk-client'

export default async function ProdukPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('toko_id')
    .eq('id', user.id)
    .single()

  if (!profile?.toko_id) {
    return (
      <div>
        <Topbar title="Produk" />
        <div className="p-6 text-sm text-muted-foreground">
          Data toko tidak ditemukan.
        </div>
      </div>
    )
  }

  const { data: produkList } = await supabase
    .from('produk')
    .select(`
      id,
      nama,
      harga,
      harga_modal,
      stok,
      stok_minimum,
      satuan,
      kategori_id,
      kategori (
        nama
      )
    `)
    .eq('toko_id', profile.toko_id)
    .eq('aktif', true)
    .order('nama')

  const { data: kategoriList } = await supabase
    .from('kategori')
    .select('id, nama')
    .eq('toko_id', profile.toko_id)
    .order('nama')

  const mapped = (produkList ?? []).map((p) => ({
    id: p.id,
    nama: p.nama,
    harga: p.harga,
    harga_modal: p.harga_modal,
    stok: p.stok,
    stok_minimum: p.stok_minimum,
    satuan: p.satuan,
    kategori_id: p.kategori_id,
    kategori: Array.isArray(p.kategori)
      ? p.kategori[0] ?? null
      : p.kategori ?? null,
  }))

  return (
    <div>
      <Topbar title="Produk" />
      <ProdukClient
        produkList={mapped}
        kategoriList={kategoriList ?? []}
        tokoId={profile.toko_id}
      />
    </div>
  )
}