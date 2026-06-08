import { useEffect, useState } from 'react'
import InviteUserPanel from '@/components/InviteUserPanel'
import Button from '@/components/Button'
import { apiRequest } from '@/lib/api'
import { appointments } from '@/data/mockData'

const emptyForm = {
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

function mapShopToForm(shop) {
  return {
    name: shop?.name || '',
    slug: shop?.slug || '',
    logo_url: shop?.logo_url || '',
    cover_image_url: shop?.cover_image_url || '',
    phone: shop?.phone || '',
    whatsapp_phone: shop?.whatsapp_phone || '',
    email: shop?.email || '',
    address: shop?.address || '',
    city: shop?.city || '',
    province: shop?.province || '',
    country: shop?.country || 'Republica Dominicana',
    description: shop?.description || '',
    opening_time: shop?.opening_time || '',
    closing_time: shop?.closing_time || '',
    slot_buffer_minutes: String(shop?.slot_buffer_minutes || 15),
    is_active: shop?.is_active ?? true,
    seo_title: shop?.seo_title || '',
    seo_description: shop?.seo_description || '',
    seo_keywords: shop?.seo_keywords || '',
    google_maps_url: shop?.google_maps_url || '',
    latitude: shop?.latitude ?? '',
    longitude: shop?.longitude ?? '',
    public_page_enabled: shop?.public_page_enabled ?? true,
  }
}

export default function AdminContent({ path, token, barbershopId }) {
  if (path.startsWith('/admin/configuracion')) {
    return <AdminSettings token={token} barbershopId={barbershopId} />
  }

  if (path.startsWith('/admin/citas')) {
    return <AdminAppointments />
  }

  if (path.startsWith('/admin/clientes')) {
    return <AdminClients />
  }

  return <AdminHome token={token} barbershopId={barbershopId} />
}

function AdminHome({ token, barbershopId }) {
  return (
    <>
      <AdminAppointments compact />
      <InviteUserPanel token={token} defaultBarbershopId={barbershopId || ''} />
    </>
  )
}

function AdminAppointments({ compact = false }) {
  return (
    <div className={compact ? 'rounded-lg border border-neutral-200 bg-white' : 'rounded-lg border border-neutral-200 bg-white'}>
      <div className="border-b border-neutral-200 p-5">
        <h2 className="font-semibold">{compact ? 'Agenda del dia' : 'Citas'}</h2>
        {!compact && <p className="mt-1 text-sm text-neutral-600">Reservas de la barberia.</p>}
      </div>
      <div className="divide-y divide-neutral-200">
        {appointments.map((appointment) => (
          <div key={appointment.id} className="grid gap-2 p-5 md:grid-cols-5 md:items-center">
            <p className="font-medium">{appointment.client}</p>
            <p className="text-sm text-neutral-600">{appointment.service}</p>
            <p className="text-sm text-neutral-600">{appointment.barber}</p>
            <p className="text-sm text-neutral-600">{appointment.time}</p>
            <span className="w-fit rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium">{appointment.status}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function AdminClients() {
  const clients = [...new Set(appointments.map((appointment) => appointment.client))]

  return (
    <div className="rounded-lg border border-neutral-200 bg-white">
      <div className="border-b border-neutral-200 p-5">
        <h2 className="font-semibold">Clientes</h2>
        <p className="mt-1 text-sm text-neutral-600">Clientes con historial de citas.</p>
      </div>
      <div className="divide-y divide-neutral-200">
        {clients.map((client) => (
          <div key={client} className="grid gap-2 p-5 md:grid-cols-3 md:items-center">
            <p className="font-medium">{client}</p>
            <p className="text-sm text-neutral-600">Cliente activo</p>
            <span className="w-fit rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium">Activo</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function AdminSettings({ token, barbershopId }) {
  const [form, setForm] = useState(emptyForm)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    let mounted = true

    async function loadShop() {
      if (!token || !barbershopId) {
        setLoading(false)
        return
      }

      setLoading(true)
      setError('')

      try {
        const response = await apiRequest(`/api/admin/barbershops/${barbershopId}`, { token })

        if (mounted) {
          setForm(mapShopToForm(response.barbershop))
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

    loadShop()

    return () => {
      mounted = false
    }
  }, [barbershopId, token])

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSaving(true)
    setStatus('')
    setError('')

    try {
      const response = await apiRequest(`/api/admin/barbershops/${barbershopId}`, {
        method: 'PATCH',
        token,
        body: form,
      })

      setForm(mapShopToForm(response.barbershop))
      setStatus('Barberia actualizada correctamente.')
    } catch (saveError) {
      setError(saveError.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <p className="rounded-lg border border-neutral-200 bg-white p-5 text-sm text-neutral-600">Cargando configuracion...</p>
  }

  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-5">
      <h2 className="font-semibold">Configuracion de barberia</h2>
      <p className="mt-1 text-sm text-neutral-600">Actualiza los datos publicos de esta barberia.</p>
      <form onSubmit={handleSubmit} className="mt-5 grid gap-3">
        <input className="rounded-md border border-neutral-300 px-3 py-2" placeholder="Nombre de la barberia" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required />
        <input className="rounded-md border border-neutral-300 px-3 py-2" placeholder="Slug para URL" value={form.slug} onChange={(event) => setForm({ ...form, slug: event.target.value })} required />
        <input className="rounded-md border border-neutral-300 px-3 py-2" placeholder="Logo URL" value={form.logo_url} onChange={(event) => setForm({ ...form, logo_url: event.target.value })} />
        <input className="rounded-md border border-neutral-300 px-3 py-2" placeholder="Cover image URL" value={form.cover_image_url} onChange={(event) => setForm({ ...form, cover_image_url: event.target.value })} />
        <div className="grid gap-3 sm:grid-cols-3">
          <input className="rounded-md border border-neutral-300 px-3 py-2" placeholder="Telefono" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} />
          <input className="rounded-md border border-neutral-300 px-3 py-2" placeholder="WhatsApp" value={form.whatsapp_phone} onChange={(event) => setForm({ ...form, whatsapp_phone: event.target.value })} />
          <input className="rounded-md border border-neutral-300 px-3 py-2" placeholder="Correo" type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
        </div>
        <input className="rounded-md border border-neutral-300 px-3 py-2" placeholder="Direccion" value={form.address} onChange={(event) => setForm({ ...form, address: event.target.value })} />
        <div className="grid gap-3 sm:grid-cols-3">
          <input className="rounded-md border border-neutral-300 px-3 py-2" placeholder="Ciudad" value={form.city} onChange={(event) => setForm({ ...form, city: event.target.value })} />
          <input className="rounded-md border border-neutral-300 px-3 py-2" placeholder="Provincia" value={form.province} onChange={(event) => setForm({ ...form, province: event.target.value })} />
          <input className="rounded-md border border-neutral-300 px-3 py-2" placeholder="Pais" value={form.country} onChange={(event) => setForm({ ...form, country: event.target.value })} />
        </div>
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
        <div className="flex flex-wrap gap-4">
          <label className="flex items-center gap-2 text-sm text-neutral-700">
            <input type="checkbox" checked={form.public_page_enabled} onChange={(event) => setForm({ ...form, public_page_enabled: event.target.checked })} />
            Pagina publica activa
          </label>
          <label className="flex items-center gap-2 text-sm text-neutral-700">
            <input type="checkbox" checked={form.is_active} onChange={(event) => setForm({ ...form, is_active: event.target.checked })} />
            Barberia activa
          </label>
        </div>
        <Button type="submit" disabled={saving}>{saving ? 'Guardando...' : 'Guardar configuracion'}</Button>
        {status && <p className="rounded-md bg-neutral-100 p-3 text-sm text-neutral-700">{status}</p>}
        {error && <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      </form>
    </div>
  )
}
