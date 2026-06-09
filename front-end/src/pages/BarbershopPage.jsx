import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Clock, MapPin, Phone, Scissors, User } from 'lucide-react'
import Button from '@/components/Button'
import { apiRequest } from '@/lib/api'

export default function BarbershopPage() {
  const { slug } = useParams()
  const [shop, setShop] = useState(null)
  const [shopServices, setShopServices] = useState([])
  const [shopBarbers, setShopBarbers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let mounted = true

    async function loadBarbershop() {
      setLoading(true)
      setError('')

      try {
        const response = await apiRequest(`/api/barbershops/${slug}`)

        if (mounted) {
          setShop(response.barbershop)
          setShopServices(response.services || [])
          setShopBarbers(response.barbers || [])
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

    loadBarbershop()

    return () => {
      mounted = false
    }
  }, [slug])

  if (loading) {
    return <div className="grid min-h-screen place-items-center bg-neutral-50 text-sm text-neutral-600">Cargando barberia...</div>
  }

  if (error || !shop) {
    return <div className="grid min-h-screen place-items-center bg-neutral-50 text-sm text-neutral-600">{error || 'Barberia no encontrada.'}</div>
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-md bg-neutral-900 text-white"><Scissors size={18} /></div>
            <div>
              <p className="font-semibold">{shop.name}</p>
              <p className="text-xs text-neutral-500">Reservas gestionadas por Trimio</p>
            </div>
          </div>
          <Link to={`/cliente/reservar/${shop.slug}`}><Button>Reservar cita</Button></Link>
        </div>
      </header>
      <div
        className="h-56 bg-neutral-200 bg-cover bg-center"
        style={shop.cover_image_url ? { backgroundImage: `url(${shop.cover_image_url})` } : undefined}
      />
      <main className="mx-auto -mt-10 max-w-5xl space-y-6 px-4 pb-16">
        <section className="rounded-lg border border-neutral-200 bg-white p-6 shadow-sm">
          <h1 className="text-3xl font-bold">{shop.name}</h1>
          <p className="mt-3 max-w-2xl text-neutral-600">{shop.description}</p>
          <div className="mt-5 flex flex-wrap gap-4 text-sm text-neutral-600">
            <span className="flex items-center gap-2"><MapPin size={16} />{shop.address}, {shop.city}</span>
            <span className="flex items-center gap-2"><Phone size={16} />{shop.phone}</span>
            <span className="flex items-center gap-2"><Clock size={16} />{shop.opening_time || '--:--'} - {shop.closing_time || '--:--'}</span>
          </div>
        </section>
        <section className="grid gap-6 md:grid-cols-2">
          <div className="rounded-lg border border-neutral-200 bg-white p-6">
            <h2 className="text-lg font-semibold">Servicios</h2>
            <div className="mt-4 space-y-3">
              {shopServices.length === 0 && <p className="text-sm text-neutral-600">Todavia no hay servicios publicados.</p>}
              {shopServices.map((service) => (
                <div key={service.id} className="flex items-center justify-between rounded-md bg-neutral-50 p-4">
                  <div>
                    <p className="font-medium">{service.name}</p>
                    <p className="text-sm text-neutral-500">{service.base_duration_minutes || 0} min</p>
                  </div>
                  <p className="font-semibold">RD${service.base_price || 0}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-lg border border-neutral-200 bg-white p-6">
            <h2 className="text-lg font-semibold">Barberos</h2>
            <div className="mt-4 space-y-3">
              {shopBarbers.length === 0 && <p className="text-sm text-neutral-600">Todavia no hay barberos publicados.</p>}
              {shopBarbers.map((barber) => (
                <div key={barber.id} className="flex items-center gap-3 rounded-md bg-neutral-50 p-4">
                  <div className="grid h-11 w-11 place-items-center rounded-full bg-neutral-200"><User size={18} /></div>
                  <div>
                    <p className="font-medium">{barber.profile?.full_name || 'Barbero'}</p>
                    <p className="text-sm text-neutral-500">Barbero</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
