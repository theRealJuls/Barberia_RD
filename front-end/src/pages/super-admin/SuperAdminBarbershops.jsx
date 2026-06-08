import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Pencil, Plus, Search } from 'lucide-react'
import { useAuth } from '@/auth/AuthContext'
import Button from '@/components/Button'
import { apiRequest } from '@/lib/api'
import { barbershops } from '@/data/mockData'

const emptyBarbershopForm = {
  name: '',
  slug: '',
  logo_url: '',
  cover_image_url: '',
  phone: '',
  whatsapp_phone: '',
  email: '',
  address: '',
  city: '',
  province: '',
  country: 'Republica Dominicana',
  description: '',
  opening_time: '',
  closing_time: '',
  slot_buffer_minutes: '15',
  is_active: true,
  seo_title: '',
  seo_description: '',
  seo_keywords: '',
  google_maps_url: '',
  latitude: '',
  longitude: '',
  public_page_enabled: true,
}

export default function SuperAdminBarbershops() {
  const { session } = useAuth()
  const [shops, setShops] = useState(barbershops)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(emptyBarbershopForm)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    let mounted = true

    async function loadBarbershops() {
      if (!session?.access_token) {
        setLoading(false)
        return
      }

      setLoading(true)
      setError('')

      try {
        const response = await apiRequest('/api/admin/barbershops', {
          token: session.access_token,
        })

        if (mounted) {
          setShops(response.barbershops || [])
        }
      } catch (loadError) {
        if (mounted) {
          setError(loadError.message)
        }
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    loadBarbershops()

    return () => {
      mounted = false
    }
  }, [session?.access_token])

  const resetForm = () => {
    setEditingId(null)
    setForm(emptyBarbershopForm)
  }

  const handleEdit = (shop) => {
    setEditingId(shop.id)
    setForm({
      name: shop.name || '',
      slug: shop.slug || '',
      logo_url: shop.logo_url || '',
      cover_image_url: shop.cover_image_url || '',
      phone: shop.phone || '',
      whatsapp_phone: shop.whatsapp_phone || '',
      email: shop.email || '',
      address: shop.address || '',
      city: shop.city || '',
      province: shop.province || '',
      country: shop.country || 'Republica Dominicana',
      description: shop.description || '',
      opening_time: shop.opening_time || '',
      closing_time: shop.closing_time || '',
      slot_buffer_minutes: String(shop.slot_buffer_minutes || 15),
      is_active: shop.is_active ?? true,
      seo_title: shop.seo_title || '',
      seo_description: shop.seo_description || '',
      seo_keywords: shop.seo_keywords || '',
      google_maps_url: shop.google_maps_url || '',
      latitude: shop.latitude ?? '',
      longitude: shop.longitude ?? '',
      public_page_enabled: shop.public_page_enabled ?? true,
    })
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSaving(true)
    setStatus('')
    setError('')

    const payload = {
      ...form,
    }

    try {
      const response = await apiRequest(
        editingId ? `/api/admin/barbershops/${editingId}` : '/api/admin/barbershops',
        {
          method: editingId ? 'PATCH' : 'POST',
          token: session?.access_token,
          body: payload,
        }
      )

      const savedShop = response.barbershop

      setShops((current) => {
        if (editingId) {
          return current.map((shop) => (shop.id === editingId ? savedShop : shop))
        }

        return [savedShop, ...current]
      })
      setStatus(editingId ? 'Barberia actualizada correctamente.' : 'Barberia creada correctamente.')
      resetForm()
    } catch (saveError) {
      setError(saveError.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
      <div className="rounded-lg border border-neutral-200 bg-white p-5">
        <div className="flex items-center gap-2">
          <Plus size={18} />
          <h2 className="font-semibold">{editingId ? 'Editar barberia' : 'Crear barberia'}</h2>
        </div>
        <form onSubmit={handleSubmit} className="mt-5 grid gap-3">
          <input className="rounded-md border border-neutral-300 px-3 py-2" placeholder="Nombre de la barberia" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required />
          <input className="rounded-md border border-neutral-300 px-3 py-2" placeholder="Slug para URL, ejemplo: la-fama" value={form.slug} onChange={(event) => setForm({ ...form, slug: event.target.value })} required />
          <input className="rounded-md border border-neutral-300 px-3 py-2" placeholder="Logo URL" value={form.logo_url} onChange={(event) => setForm({ ...form, logo_url: event.target.value })} />
          <input className="rounded-md border border-neutral-300 px-3 py-2" placeholder="Cover image URL" value={form.cover_image_url} onChange={(event) => setForm({ ...form, cover_image_url: event.target.value })} />
          <div className="grid gap-3 sm:grid-cols-2">
            <input className="rounded-md border border-neutral-300 px-3 py-2" placeholder="Telefono" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} />
            <input className="rounded-md border border-neutral-300 px-3 py-2" placeholder="WhatsApp" value={form.whatsapp_phone} onChange={(event) => setForm({ ...form, whatsapp_phone: event.target.value })} />
          </div>
          <input className="rounded-md border border-neutral-300 px-3 py-2" placeholder="Correo de la barberia" type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
          <input className="rounded-md border border-neutral-300 px-3 py-2" placeholder="Direccion" value={form.address} onChange={(event) => setForm({ ...form, address: event.target.value })} />
          <div className="grid gap-3 sm:grid-cols-2">
            <input className="rounded-md border border-neutral-300 px-3 py-2" placeholder="Ciudad" value={form.city} onChange={(event) => setForm({ ...form, city: event.target.value })} />
            <input className="rounded-md border border-neutral-300 px-3 py-2" placeholder="Provincia" value={form.province} onChange={(event) => setForm({ ...form, province: event.target.value })} />
          </div>
          <input className="rounded-md border border-neutral-300 px-3 py-2" placeholder="Pais" value={form.country} onChange={(event) => setForm({ ...form, country: event.target.value })} />
          <textarea className="min-h-24 rounded-md border border-neutral-300 px-3 py-2" placeholder="Descripcion publica" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
          <div className="grid gap-3 sm:grid-cols-3">
            <label className="grid gap-1 text-sm text-neutral-700">
              Hora de apertura
              <input className="rounded-md border border-neutral-300 px-3 py-2" type="time" value={form.opening_time} onChange={(event) => setForm({ ...form, opening_time: event.target.value })} />
            </label>
            <label className="grid gap-1 text-sm text-neutral-700">
              Hora de cierre
              <input className="rounded-md border border-neutral-300 px-3 py-2" type="time" value={form.closing_time} onChange={(event) => setForm({ ...form, closing_time: event.target.value })} />
            </label>
            <label className="grid gap-1 text-sm text-neutral-700">
              Buffer entre citas (min)
              <input className="rounded-md border border-neutral-300 px-3 py-2" type="number" min="0" value={form.slot_buffer_minutes} onChange={(event) => setForm({ ...form, slot_buffer_minutes: event.target.value })} />
            </label>
          </div>
          <input className="rounded-md border border-neutral-300 px-3 py-2" placeholder="SEO title" value={form.seo_title} onChange={(event) => setForm({ ...form, seo_title: event.target.value })} />
          <textarea className="min-h-20 rounded-md border border-neutral-300 px-3 py-2" placeholder="SEO description" value={form.seo_description} onChange={(event) => setForm({ ...form, seo_description: event.target.value })} />
          <input className="rounded-md border border-neutral-300 px-3 py-2" placeholder="SEO keywords" value={form.seo_keywords} onChange={(event) => setForm({ ...form, seo_keywords: event.target.value })} />
          <input className="rounded-md border border-neutral-300 px-3 py-2" placeholder="Google Maps URL" value={form.google_maps_url} onChange={(event) => setForm({ ...form, google_maps_url: event.target.value })} />
          <div className="grid gap-3 sm:grid-cols-2">
            <input className="rounded-md border border-neutral-300 px-3 py-2" placeholder="Latitude" type="number" step="any" value={form.latitude} onChange={(event) => setForm({ ...form, latitude: event.target.value })} />
            <input className="rounded-md border border-neutral-300 px-3 py-2" placeholder="Longitude" type="number" step="any" value={form.longitude} onChange={(event) => setForm({ ...form, longitude: event.target.value })} />
          </div>
          <label className="flex items-center gap-2 text-sm text-neutral-700">
            <input type="checkbox" checked={form.public_page_enabled} onChange={(event) => setForm({ ...form, public_page_enabled: event.target.checked })} />
            Pagina publica activa
          </label>
          <label className="flex items-center gap-2 text-sm text-neutral-700">
            <input type="checkbox" checked={form.is_active} onChange={(event) => setForm({ ...form, is_active: event.target.checked })} />
            Barberia activa
          </label>
          <div className="flex gap-2">
            <Button type="submit" disabled={saving}>{saving ? 'Guardando...' : editingId ? 'Guardar cambios' : 'Crear barberia'}</Button>
            {editingId && <Button type="button" variant="outline" onClick={resetForm}>Cancelar</Button>}
          </div>
          {status && <p className="rounded-md bg-neutral-100 p-3 text-sm text-neutral-700">{status}</p>}
          {error && <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        </form>
      </div>

      <div className="rounded-lg border border-neutral-200 bg-white">
        <div className="flex flex-col gap-3 border-b border-neutral-200 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-semibold">Barberias</h2>
            <p className="mt-1 text-sm text-neutral-600">Listado de barberias creadas en Trimio.</p>
          </div>
          <div className="flex items-center gap-2 rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-500">
            <Search size={16} />
            Buscar
          </div>
        </div>
        <div className="divide-y divide-neutral-200">
          {loading && <p className="p-5 text-sm text-neutral-600">Cargando barberias...</p>}
          {!loading && shops.map((shop) => (
            <div key={shop.id} className="grid gap-3 p-5 lg:grid-cols-[1fr_auto] lg:items-center">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-semibold">{shop.name}</h3>
                  <span className="rounded-full bg-neutral-100 px-2 py-1 text-xs">/{shop.slug}</span>
                </div>
                <p className="mt-1 text-sm text-neutral-600">{shop.address || 'Sin direccion'} {shop.city ? `, ${shop.city}` : ''}</p>
                <p className="mt-1 text-sm text-neutral-500">{shop.phone || 'Sin telefono'}</p>
              </div>
              <div className="flex gap-2">
                <Link to={`/barberia/${shop.slug}`}><Button variant="outline">Ver pagina</Button></Link>
                <Button type="button" variant="outline" onClick={() => handleEdit(shop)}><Pencil size={16} />Editar</Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
