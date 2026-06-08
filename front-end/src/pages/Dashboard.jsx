import { useLocation } from 'react-router-dom'
import {
  Calendar,
  Clock,
  CreditCard,
  LayoutDashboard,
  Scissors,
  Settings,
  Users,
} from 'lucide-react'
import { useAuth } from '@/auth/AuthContext'
import InviteUserPanel from '@/components/InviteUserPanel'
import Shell from '@/components/Shell'
import StatCard from '@/components/StatCard'
import { appointments } from '@/data/mockData'
import AdminContent from '@/pages/admin/AdminContent'
import ClientPanel from '@/pages/client/ClientPanel'
import SuperAdminContent from '@/pages/super-admin/SuperAdminContent'

export default function Dashboard({ role }) {
  const { session, access } = useAuth()
  const location = useLocation()
  const navByRole = {
    cliente: [
      { href: '/cliente', label: 'Inicio', icon: LayoutDashboard },
      { href: '/cliente/citas', label: 'Mis citas', icon: Calendar },
      { href: '/barberia/la-fama', label: 'Reservar', icon: Scissors },
    ],
    barbero: [
      { href: '/barbero', label: 'Inicio', icon: LayoutDashboard },
      { href: '/barbero/agenda', label: 'Agenda', icon: Calendar },
      { href: '/barbero/disponibilidad', label: 'Disponibilidad', icon: Clock },
    ],
    recepcion: [
      { href: '/recepcion', label: 'Inicio', icon: LayoutDashboard },
      { href: '/recepcion/citas', label: 'Citas', icon: Calendar },
      { href: '/recepcion/clientes', label: 'Clientes', icon: Users },
    ],
    admin: [
      { href: '/admin', label: 'Inicio', icon: LayoutDashboard },
      { href: '/admin/citas', label: 'Citas', icon: Calendar },
      { href: '/admin/clientes', label: 'Clientes', icon: Users },
      { href: '/admin/configuracion', label: 'Configuracion', icon: Settings },
    ],
    'super-admin': [
      { href: '/super-admin', label: 'Inicio', icon: LayoutDashboard },
      { href: '/super-admin/barberias', label: 'Barberias', icon: Scissors },
      { href: '/super-admin/usuarios', label: 'Usuarios', icon: Users },
    ],
  }
  const titles = {
    admin: 'Administracion',
    recepcion: 'Recepcion',
    barbero: 'Barbero',
    cliente: 'Cliente',
    'super-admin': 'Super Admin',
  }

  if (role === 'cliente') {
    return <ClientPanel nav={navByRole.cliente} title={titles.cliente} />
  }

  if (role === 'super-admin') {
    return (
      <Shell title={titles['super-admin']} nav={navByRole['super-admin']}>
        <SuperAdminContent path={location.pathname} token={session?.access_token} />
      </Shell>
    )
  }

  if (role === 'admin') {
    return (
      <Shell title={titles.admin} nav={navByRole.admin}>
        <AdminContent path={location.pathname} token={session?.access_token} barbershopId={access?.barbershopId} />
      </Shell>
    )
  }

  return (
    <Shell title={titles[role] || 'Panel'} nav={navByRole[role] || navByRole.cliente}>
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard label="Citas hoy" value="12" icon={Calendar} />
        <StatCard label="Clientes activos" value="86" icon={Users} />
        <StatCard label="Ingresos" value="RD$8,400" icon={CreditCard} />
        <StatCard label="Barberos" value="3" icon={Scissors} />
      </div>
      <div className="mt-6 rounded-lg border border-neutral-200 bg-white">
        <div className="border-b border-neutral-200 p-5">
          <h2 className="font-semibold">Agenda del dia</h2>
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
      {(role === 'admin' || role === 'super-admin') && (
        <InviteUserPanel token={session?.access_token} defaultBarbershopId={access?.barbershopId || ''} />
      )}
    </Shell>
  )
}
