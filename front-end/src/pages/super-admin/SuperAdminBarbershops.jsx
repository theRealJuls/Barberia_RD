import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Pencil, Plus, Search } from 'lucide-react'
import Button from '@/components/Button'
import { barbershops } from '@/data/mockData'

export default function SuperAdminBarbershops() {
  const [shops, setShops] = useState(barbershops)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState({
    name: '',
    slug: '',
    phone: '',
    address: '',
    city: '',
    province: '',
    description: '',
  })

  const resetForm = () => {
    setEditingId(null)
    setForm({ name: '', slug: '', phone: '', address: '', city: '', province: '', description: '' })
  }

  const handleEdit = (shop) => {
    setEditingId(shop.id)
    setForm({
      name: shop.name || '',
      slug: shop.slug || '',
      phone: shop.phone || '',
      address: shop.address || '',
      city: shop.city || '',
      province: shop.province || '',
      description: shop.description || '',
    })
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    const payload = {
      ...form,
      id: editingId || crypto.randomUUID(),
      whatsapp: form.phone.replace(/\D/g, ''),
      openingHours: 'Lunes a sabado, 9:00 AM - 7:00 PM',
    }

    setShops((current) => {
      if (editingId) {
        return current.map((shop) => (shop.id === editingId ? payload : shop))
      }

      return [payload, ...current]
    })
    resetForm()
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
          <input className="rounded-md border border-neutral-300 px-3 py-2" placeholder="Telefono" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} />
          <input className="rounded-md border border-neutral-300 px-3 py-2" placeholder="Direccion" value={form.address} onChange={(event) => setForm({ ...form, address: event.target.value })} />
          <div className="grid gap-3 sm:grid-cols-2">
            <input className="rounded-md border border-neutral-300 px-3 py-2" placeholder="Ciudad" value={form.city} onChange={(event) => setForm({ ...form, city: event.target.value })} />
            <input className="rounded-md border border-neutral-300 px-3 py-2" placeholder="Provincia" value={form.province} onChange={(event) => setForm({ ...form, province: event.target.value })} />
          </div>
          <textarea className="min-h-24 rounded-md border border-neutral-300 px-3 py-2" placeholder="Descripcion publica" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
          <div className="flex gap-2">
            <Button type="submit">{editingId ? 'Guardar cambios' : 'Crear barberia'}</Button>
            {editingId && <Button type="button" variant="outline" onClick={resetForm}>Cancelar</Button>}
          </div>
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
          {shops.map((shop) => (
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
