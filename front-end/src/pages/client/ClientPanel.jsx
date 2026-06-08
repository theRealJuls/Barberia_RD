import { Link } from 'react-router-dom'
import { Calendar } from 'lucide-react'
import { useAuth } from '@/auth/AuthContext'
import Button from '@/components/Button'
import Shell from '@/components/Shell'
import { appointments } from '@/data/mockData'

export default function ClientPanel({ nav, title }) {
  const { profile } = useAuth()
  const clientAppointments = appointments.filter((appointment) => appointment.client === 'Juan Perez')
  const nextAppointment = clientAppointments[0]

  return (
    <Shell title={title} nav={nav}>
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-neutral-200 bg-white p-5 md:col-span-2">
          <p className="text-sm text-neutral-500">Bienvenido</p>
          <h2 className="mt-1 text-2xl font-semibold">{profile?.full_name || 'Cliente'}</h2>
          <p className="mt-2 text-neutral-600">
            Desde aqui puedes revisar tus proximas citas y reservar en las barberias disponibles.
          </p>
          <Link to="/barberia/la-fama" className="mt-5 inline-block">
            <Button>Reservar nueva cita</Button>
          </Link>
        </div>
        <div className="rounded-lg border border-neutral-200 bg-white p-5">
          <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-md bg-neutral-100">
            <Calendar size={20} />
          </div>
          <p className="text-sm text-neutral-500">Proxima cita</p>
          <p className="mt-2 font-semibold">{nextAppointment?.service || 'Sin citas pendientes'}</p>
          {nextAppointment && (
            <p className="mt-1 text-sm text-neutral-600">
              {nextAppointment.time} con {nextAppointment.barber}
            </p>
          )}
        </div>
      </div>

      <div className="mt-6 rounded-lg border border-neutral-200 bg-white">
        <div className="border-b border-neutral-200 p-5">
          <h2 className="font-semibold">Mis citas</h2>
          <p className="mt-1 text-sm text-neutral-600">Historial y proximas reservas de tu cuenta.</p>
        </div>
        <div className="divide-y divide-neutral-200">
          {clientAppointments.map((appointment) => (
            <div key={appointment.id} className="grid gap-2 p-5 md:grid-cols-4 md:items-center">
              <p className="font-medium">{appointment.service}</p>
              <p className="text-sm text-neutral-600">{appointment.barber}</p>
              <p className="text-sm text-neutral-600">{appointment.time}</p>
              <span className="w-fit rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium">{appointment.status}</span>
            </div>
          ))}
        </div>
      </div>
    </Shell>
  )
}
