import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useAuth } from '@/auth/AuthContext'
import Button from '@/components/Button'
import { apiRequest } from '@/lib/api'

export default function BookingPage() {
  const { barbershopSlug } = useParams()
  const { ensureClientForBarbershop } = useAuth()
  const [shop, setShop] = useState(null)
  const [shopServices, setShopServices] = useState([])
  const [loading, setLoading] = useState(true)
  const [bookingMessage, setBookingMessage] = useState('')
  const [bookingError, setBookingError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let mounted = true

    async function loadBarbershop() {
      setLoading(true)
      setBookingError('')

      try {
        const response = await apiRequest(`/api/barbershops/${barbershopSlug}`)

        if (mounted) {
          setShop(response.barbershop)
          setShopServices(response.services || [])
        }
      } catch (error) {
        if (mounted) {
          setBookingError(error.message)
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
  }, [barbershopSlug])

  const handlePrepareBooking = async () => {
    if (!shop?.id) {
      setBookingError('No se pudo identificar la barberia.')
      return
    }

    setSaving(true)
    setBookingError('')
    setBookingMessage('')

    try {
      await ensureClientForBarbershop(shop.id)
      setBookingMessage('Cliente registrado en esta barberia. Aqui continuaria la seleccion de fecha y hora.')
    } catch (error) {
      setBookingError(error.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-neutral-50 p-4">
      <div className="mx-auto max-w-2xl rounded-lg border border-neutral-200 bg-white p-6">
        <h1 className="text-2xl font-semibold">Reservar cita</h1>
        <p className="mt-2 text-neutral-600">
          {loading ? 'Cargando barberia...' : `Selecciona servicios, barbero, fecha y hora para ${shop?.name || 'esta barberia'}.`}
        </p>
        <div className="mt-6 grid gap-3">
          {!loading && shopServices.length === 0 && <p className="text-sm text-neutral-600">Todavia no hay servicios publicados.</p>}
          {shopServices.map((service) => (
            <div key={service.id} className="flex justify-between rounded-md border border-neutral-200 p-4">
              <span>{service.name}</span>
              <span>RD${service.base_price || 0}</span>
            </div>
          ))}
        </div>
        {bookingError && <p className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-700">{bookingError}</p>}
        {bookingMessage && <p className="mt-4 rounded-md bg-neutral-100 p-3 text-sm text-neutral-700">{bookingMessage}</p>}
        <Button className="mt-5 w-full" onClick={handlePrepareBooking} disabled={saving}>
          {saving ? 'Preparando...' : 'Continuar reserva'}
        </Button>
      </div>
    </div>
  )
}
