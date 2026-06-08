import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useAuth } from '@/auth/AuthContext'
import Button from '@/components/Button'
import { barbershops, services } from '@/data/mockData'

export default function BookingPage() {
  const { barbershopSlug } = useParams()
  const { ensureClientForBarbershop } = useAuth()
  const [bookingMessage, setBookingMessage] = useState('')
  const [bookingError, setBookingError] = useState('')
  const [saving, setSaving] = useState(false)
  const shop = barbershops.find((barbershop) => barbershop.slug === barbershopSlug) || barbershops[0]
  const shopServices = services.filter((service) => service.barbershopId === shop.id)

  const handlePrepareBooking = async () => {
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
        <p className="mt-2 text-neutral-600">Selecciona servicios, barbero, fecha y hora para {shop.name}.</p>
        <div className="mt-6 grid gap-3">
          {shopServices.map((service) => (
            <div key={service.id} className="flex justify-between rounded-md border border-neutral-200 p-4">
              <span>{service.name}</span>
              <span>RD${service.price}</span>
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
