import { Link } from 'react-router-dom'
import { Calendar, Scissors, Users } from 'lucide-react'
import StatCard from '@/components/StatCard'
import { barbers, barbershops } from '@/data/mockData'

export default function SuperAdminHome() {
  return (
    <>
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard label="Barberias" value={barbershops.length} icon={Scissors} />
        <StatCard label="Usuarios internos" value={barbers.length + 2} icon={Users} />
        <StatCard label="Clientes activos" value="86" icon={Users} />
        <StatCard label="Citas hoy" value="12" icon={Calendar} />
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <Link to="/super-admin/barberias" className="rounded-lg border border-neutral-200 bg-white p-5 transition hover:border-neutral-400">
          <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-md bg-neutral-100">
            <Scissors size={20} />
          </div>
          <h2 className="font-semibold">Gestionar barberias</h2>
          <p className="mt-2 text-sm text-neutral-600">Crear, editar, activar y revisar las barberias de la plataforma.</p>
        </Link>
        <Link to="/super-admin/usuarios" className="rounded-lg border border-neutral-200 bg-white p-5 transition hover:border-neutral-400">
          <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-md bg-neutral-100">
            <Users size={20} />
          </div>
          <h2 className="font-semibold">Gestionar usuarios</h2>
          <p className="mt-2 text-sm text-neutral-600">Invitar admins, recepcionistas y barberos a una barberia.</p>
        </Link>
      </div>
    </>
  )
}
