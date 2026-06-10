import { useEffect, useState } from 'react'
import InviteUserPanel from '@/components/InviteUserPanel'
import ClienteList from '@/components/Clientes/ClienteList'
import Button from '@/components/Button'
import { apiRequest } from '@/lib/api'

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

  if (path.startsWith('/admin/barberos')) {
    return <AdminBarbers token={token} barbershopId={barbershopId} />
  }

  if (path.startsWith('/admin/servicios')) {
    return <AdminServices token={token} barbershopId={barbershopId} />
  }

  return <AdminHome token={token} barbershopId={barbershopId} />
}

function AdminHome({ token, barbershopId }) {
  return (
    <>
      <AdminShopSummary token={token} barbershopId={barbershopId} />
      <InviteUserPanel token={token} defaultBarbershopId={barbershopId || ''} />
    </>
  )
}

function AdminShopSummary({ token, barbershopId }) {
  const [shop, setShop] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let mounted = true

    async function loadShop() {
      if (!token || !barbershopId) {
        return
      }

      try {
        const response = await apiRequest(`/api/admin/barbershops/${barbershopId}`, { token })

        if (mounted) {
          setShop(response.barbershop)
        }
      } catch (loadError) {
        if (mounted) {
          setError(loadError.message)
        }
      }
    }

    loadShop()

    return () => {
      mounted = false
    }
  }, [barbershopId, token])

  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-5">
      <p className="text-sm text-neutral-500">Barberia asignada</p>
      <h2 className="mt-1 text-2xl font-semibold">{shop?.name || 'Cargando barberia...'}</h2>
      <p className="mt-2 text-neutral-600">
        {shop ? `${shop.address || 'Sin direccion'}${shop.city ? `, ${shop.city}` : ''}` : 'Los datos de esta barberia apareceran aqui.'}
      </p>
      {shop?.phone && <p className="mt-1 text-sm text-neutral-500">{shop.phone}</p>}
      {error && <p className="mt-3 rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>}
    </div>
  )
}

function AdminAppointments() {
  return (
    <div className="rounded-lg border border-neutral-200 bg-white">
      <div className="border-b border-neutral-200 p-5">
        <h2 className="font-semibold">Citas</h2>
        <p className="mt-1 text-sm text-neutral-600">Reservas de la barberia.</p>
      </div>
      <p className="p-5 text-sm text-neutral-600">Todavia no hay citas reales conectadas para esta barberia.</p>
    </div>
  )
}

function AdminClients() {
  return <ClienteList />
}

function AdminBarbers({ token, barbershopId }) {
  const [staff, setStaff] = useState([])
  const [selectedBarberId, setSelectedBarberId] = useState('')
  const [serviceAssignments, setServiceAssignments] = useState([])
  const [loading, setLoading] = useState(true)
  const [assignmentsLoading, setAssignmentsLoading] = useState(false)
  const [assignmentsSaving, setAssignmentsSaving] = useState(false)
  const [assignmentStatus, setAssignmentStatus] = useState('')
  const [error, setError] = useState('')
  const [assignmentError, setAssignmentError] = useState('')

  const loadBarbers = async () => {
    if (!token || !barbershopId) {
      setLoading(false)
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await apiRequest(`/api/admin/barbershops/${barbershopId}/staff`, { token })
      const barbers = (response.staff || []).filter((member) => member.role === 'barber')
      setStaff(barbers)
    } catch (loadError) {
      setError(loadError.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadBarbers()
  }, [barbershopId, token])

  useEffect(() => {
    let mounted = true

    async function loadAssignments() {
      if (!token || !barbershopId || !selectedBarberId) {
        setServiceAssignments([])
        return
      }

      setAssignmentsLoading(true)
      setAssignmentError('')
      setAssignmentStatus('')

      try {
        const response = await apiRequest(
          `/api/admin/barbershops/${barbershopId}/barbers/${selectedBarberId}/services`,
          { token }
        )

        if (mounted) {
          setServiceAssignments(
            (response.serviceAssignments || []).map((item) => ({
              service: item.service,
              is_active: item.assignment?.is_active || false,
              custom_price: item.assignment?.custom_price ?? '',
              custom_duration_minutes: item.assignment?.custom_duration_minutes ?? '',
            }))
          )
        }
      } catch (loadError) {
        if (mounted) {
          setAssignmentError(loadError.message)
        }
      } finally {
        if (mounted) {
          setAssignmentsLoading(false)
        }
      }
    }

    loadAssignments()

    return () => {
      mounted = false
    }
  }, [barbershopId, selectedBarberId, token])

  const updateAssignment = (serviceId, changes) => {
    setServiceAssignments((current) =>
      current.map((item) => (item.service.id === serviceId ? { ...item, ...changes } : item))
    )
  }

  const selectedBarber = staff.find((member) => member.profile_id === selectedBarberId)

  const saveAssignments = async () => {
    setAssignmentsSaving(true)
    setAssignmentStatus('')
    setAssignmentError('')

    try {
      await apiRequest(`/api/admin/barbershops/${barbershopId}/barbers/${selectedBarberId}/services`, {
        method: 'PUT',
        token,
        body: {
          assignments: serviceAssignments.map((item) => ({
            service_id: item.service.id,
            is_active: item.is_active,
            custom_price: item.custom_price,
            custom_duration_minutes: item.custom_duration_minutes,
          })),
        },
      })

      setAssignmentStatus('Servicios del barbero actualizados correctamente.')
    } catch (saveError) {
      setAssignmentError(saveError.message)
    } finally {
      setAssignmentsSaving(false)
    }
  }

  return (
    <>
      <div className="rounded-lg border border-neutral-200 bg-white">
        <div className="border-b border-neutral-200 p-5">
          <h2 className="font-semibold">Barberos</h2>
          <p className="mt-1 text-sm text-neutral-600">Usuarios con rol de barbero en esta barberia.</p>
        </div>
        {loading && <p className="p-5 text-sm text-neutral-600">Cargando barberos...</p>}
        {error && <p className="m-5 rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        {!loading && !error && staff.length === 0 && <p className="p-5 text-sm text-neutral-600">Todavia no hay barberos creados.</p>}
        {!loading && !error && staff.length > 0 && (
          <div className="divide-y divide-neutral-200">
            {staff.map((member) => (
              <button
                key={member.id}
                type="button"
                className={`grid w-full gap-2 p-5 text-left transition md:grid-cols-3 md:items-center ${
                  selectedBarberId === member.profile_id ? 'bg-neutral-50' : 'hover:bg-neutral-50'
                }`}
                onClick={() => setSelectedBarberId(member.profile_id)}
              >
                <p className="font-medium">{member.profile?.full_name || 'Barbero sin nombre'}</p>
                <p className="text-sm text-neutral-600">{member.profile?.email || 'Sin correo'}</p>
                <span className="w-fit rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium">
                  {selectedBarberId === member.profile_id ? 'Seleccionado' : 'Activo'}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {selectedBarberId ? (
        <div className="mt-6 rounded-lg border border-neutral-200 bg-white">
          <div className="border-b border-neutral-200 p-5">
            <p className="text-sm text-neutral-500">Barbero seleccionado</p>
            <h2 className="mt-1 font-semibold">{selectedBarber?.profile?.full_name || 'Barbero'}</h2>
            <p className="mt-1 text-sm text-neutral-600">Marca los servicios que puede realizar.</p>
            <p className="mt-3 rounded-md bg-neutral-50 p-3 text-sm text-neutral-700">
              Los precios y duraciones personalizados de esta seccion solo cambian para este barbero. El precio base del servicio no se modifica.
            </p>
          </div>
          {selectedBarberId && assignmentsLoading && <p className="p-5 text-sm text-neutral-600">Cargando servicios...</p>}
          {selectedBarberId && !assignmentsLoading && serviceAssignments.length === 0 && (
            <p className="p-5 text-sm text-neutral-600">Primero crea servicios en la seccion Servicios.</p>
          )}
          {selectedBarberId && !assignmentsLoading && serviceAssignments.length > 0 && (
            <div className="divide-y divide-neutral-200">
              {serviceAssignments.map((item) => (
                <div key={item.service.id} className="grid gap-3 p-5 lg:grid-cols-[1fr_180px_200px] lg:items-center">
                  <label className="flex items-start gap-3">
                    <input
                      className="mt-1"
                      type="checkbox"
                      checked={item.is_active}
                      onChange={(event) => updateAssignment(item.service.id, { is_active: event.target.checked })}
                    />
                    <span>
                      <span className="block font-medium">{item.service.name}</span>
                      <span className="text-sm text-neutral-600">
                        Base: RD${item.service.base_price || 0} · {item.service.base_duration_minutes || 0} min
                      </span>
                    </span>
                  </label>
                  <label className="grid gap-1 text-xs font-medium text-neutral-600">
                    Precio solo para este barbero
                    <input
                      className="rounded-md border border-neutral-300 px-3 py-2 text-sm font-normal text-neutral-950"
                      placeholder={`Base RD$${item.service.base_price || 0}`}
                      inputMode="decimal"
                      value={item.custom_price}
                      onChange={(event) => updateAssignment(item.service.id, { custom_price: event.target.value })}
                    />
                  </label>
                  <label className="grid gap-1 text-xs font-medium text-neutral-600">
                    Duracion solo para este barbero
                    <input
                      className="rounded-md border border-neutral-300 px-3 py-2 text-sm font-normal text-neutral-950"
                      placeholder={`Base ${item.service.base_duration_minutes || 0} min`}
                      inputMode="numeric"
                      value={item.custom_duration_minutes}
                      onChange={(event) => updateAssignment(item.service.id, { custom_duration_minutes: event.target.value })}
                    />
                  </label>
                </div>
              ))}
              <div className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  {assignmentStatus && <p className="rounded-md bg-neutral-100 p-3 text-sm text-neutral-700">{assignmentStatus}</p>}
                  {assignmentError && <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">{assignmentError}</p>}
                </div>
                <Button type="button" className="w-full sm:w-auto" onClick={saveAssignments} disabled={assignmentsSaving}>
                  {assignmentsSaving ? 'Guardando...' : 'Guardar servicios'}
                </Button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="mt-6 rounded-lg border border-dashed border-neutral-300 bg-white p-5">
          <h2 className="font-semibold">Servicios del barbero</h2>
          <p className="mt-1 text-sm text-neutral-600">
            Haz clic en un barbero de la lista para asignarle servicios, precio personalizado o duracion personalizada.
          </p>
        </div>
      )}
      <InviteUserPanel
        token={token}
        defaultBarbershopId={barbershopId || ''}
        defaultRole="barber"
        lockedRole
        title="Crear barbero"
        description="Invita o asigna un usuario existente como barbero de esta barberia."
        onSuccess={loadBarbers}
      />
    </>
  )
}

function AdminServices({ token, barbershopId }) {
  const [services, setServices] = useState([])
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState({
    name: '',
    description: '',
    base_price: '',
    base_duration_minutes: '',
    is_active: true,
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    let mounted = true

    async function loadServices() {
      if (!token || !barbershopId) {
        setLoading(false)
        return
      }

      setLoading(true)
      setError('')

      try {
        const response = await apiRequest(`/api/admin/barbershops/${barbershopId}/services`, { token })

        if (mounted) {
          setServices(response.services || [])
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

    loadServices()

    return () => {
      mounted = false
    }
  }, [barbershopId, token])

  const resetForm = () => {
    setEditingId(null)
    setForm({ name: '', description: '', base_price: '', base_duration_minutes: '', is_active: true })
  }

  const handleEdit = (service) => {
    setEditingId(service.id)
    setForm({
      name: service.name || '',
      description: service.description || '',
      base_price: String(service.base_price ?? ''),
      base_duration_minutes: String(service.base_duration_minutes ?? ''),
      is_active: service.is_active ?? true,
    })
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSaving(true)
    setStatus('')
    setError('')

    try {
      const response = await apiRequest(
        editingId
          ? `/api/admin/barbershops/${barbershopId}/services/${editingId}`
          : `/api/admin/barbershops/${barbershopId}/services`,
        {
          method: editingId ? 'PATCH' : 'POST',
          token,
          body: form,
        }
      )

      const savedService = response.service

      setServices((current) => {
        if (editingId) {
          return current.map((service) => (service.id === editingId ? savedService : service))
        }

        return [savedService, ...current]
      })
      setStatus(editingId ? 'Servicio actualizado correctamente.' : 'Servicio creado correctamente.')
      resetForm()
    } catch (saveError) {
      setError(saveError.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[380px_1fr]">
      <div className="rounded-lg border border-neutral-200 bg-white p-5">
        <h2 className="font-semibold">{editingId ? 'Editar servicio' : 'Crear servicio'}</h2>
        <form onSubmit={handleSubmit} className="mt-5 grid gap-3">
          <input className="rounded-md border border-neutral-300 px-3 py-2" placeholder="Nombre del servicio" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required />
          <textarea className="min-h-24 rounded-md border border-neutral-300 px-3 py-2" placeholder="Descripcion" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
          <div className="grid gap-3 sm:grid-cols-2">
            <input className="rounded-md border border-neutral-300 px-3 py-2" placeholder="Precio base" type="number" min="0" step="0.01" value={form.base_price} onChange={(event) => setForm({ ...form, base_price: event.target.value })} />
            <input className="rounded-md border border-neutral-300 px-3 py-2" placeholder="Duracion min" type="number" min="0" value={form.base_duration_minutes} onChange={(event) => setForm({ ...form, base_duration_minutes: event.target.value })} />
          </div>
          <label className="flex items-center gap-2 text-sm text-neutral-700">
            <input type="checkbox" checked={form.is_active} onChange={(event) => setForm({ ...form, is_active: event.target.checked })} />
            Servicio activo
          </label>
          <div className="flex gap-2">
            <Button type="submit" disabled={saving}>{saving ? 'Guardando...' : editingId ? 'Guardar cambios' : 'Crear servicio'}</Button>
            {editingId && <Button type="button" variant="outline" onClick={resetForm}>Cancelar</Button>}
          </div>
          {status && <p className="rounded-md bg-neutral-100 p-3 text-sm text-neutral-700">{status}</p>}
          {error && <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        </form>
      </div>

      <div className="rounded-lg border border-neutral-200 bg-white">
        <div className="border-b border-neutral-200 p-5">
          <h2 className="font-semibold">Servicios</h2>
          <p className="mt-1 text-sm text-neutral-600">Servicios disponibles para reservas.</p>
        </div>
        {loading && <p className="p-5 text-sm text-neutral-600">Cargando servicios...</p>}
        {!loading && services.length === 0 && <p className="p-5 text-sm text-neutral-600">Todavia no hay servicios creados.</p>}
        {!loading && services.length > 0 && (
          <div className="divide-y divide-neutral-200">
            {services.map((service) => (
              <div key={service.id} className="grid gap-2 p-5 md:grid-cols-[1fr_auto] md:items-center">
                <div>
                  <p className="font-medium">{service.name}</p>
                  <p className="text-sm text-neutral-600">RD${service.base_price || 0} · {service.base_duration_minutes || 0} min</p>
                </div>
                <Button type="button" variant="outline" onClick={() => handleEdit(service)}>Editar</Button>
              </div>
            ))}
          </div>
        )}
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
