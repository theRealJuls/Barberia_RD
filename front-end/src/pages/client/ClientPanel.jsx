import { Link } from 'react-router-dom'
import { Calendar } from 'lucide-react'
import { useAuth } from '@/auth/AuthContext'
import Button from '@/components/Button'
import Shell from '@/components/Shell'

export default function ClientPanel({ nav, title, path }) {
  const { profile } = useAuth()

  if (path.startsWith('/cliente/citas')) {
    return (
      <Shell title={title} nav={nav}>
        <ClientAppointments />
      </Shell>
    )
  }

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
          <p className="mt-2 font-semibold">Sin citas pendientes</p>
          <p className="mt-1 text-sm text-neutral-600">Cuando reserves, tu proxima cita aparecera aqui.</p>
        </div>
      </div>

      <ClientAppointments className="mt-6" />
    </Shell>
  )
}

function ClientAppointments({ className = '' }) {
  return (
    <div className={`${className} rounded-lg border border-neutral-200 bg-white`}>
      <div className="border-b border-neutral-200 p-5">
        <h2 className="font-semibold">Mis citas</h2>
        <p className="mt-1 text-sm text-neutral-600">Historial y proximas reservas de tu cuenta.</p>
      </div>
      <p className="p-5 text-sm text-neutral-600">Todavia no tienes citas registradas.</p>
    </div>
  )
}
