import { Link } from 'react-router-dom'
import { Calendar, CreditCard, Scissors, Users } from 'lucide-react'
import Button from '@/components/Button'
import StatCard from '@/components/StatCard'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white text-neutral-950">
      <header className="border-b border-neutral-200">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2 font-semibold">
            <span className="grid h-9 w-9 place-items-center rounded-md bg-neutral-900 text-white"><Scissors size={18} /></span>
            Trimio
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/login" className="text-sm">Iniciar sesion</Link>
            <Link to="/barberia/la-fama"><Button variant="outline">Ver demo</Button></Link>
          </div>
        </div>
      </header>
      <section className="mx-auto max-w-5xl px-4 py-20 text-center">
        <h1 className="mx-auto max-w-3xl text-4xl font-bold tracking-tight md:text-5xl">
          Gestiona tu barberia con reservas, clientes y pagos en un solo lugar
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-lg text-neutral-600">
          Trimio ayuda a barberias dominicanas a organizar citas, barberos, servicios y clientes desde una plataforma simple y moderna.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link to="/login"><Button>Iniciar sesion</Button></Link>
          <Link to="/barberia/la-fama"><Button variant="outline">Ver demo de barberia</Button></Link>
        </div>
      </section>
      <section className="border-y border-neutral-200 bg-neutral-50 py-14">
        <div className="mx-auto grid max-w-6xl gap-4 px-4 md:grid-cols-3">
          <StatCard label="Agenda organizada" value="Sin choques" icon={Calendar} />
          <StatCard label="Clientes" value="Historial claro" icon={Users} />
          <StatCard label="Pagos" value="Cash al cierre" icon={CreditCard} />
        </div>
      </section>
      <section className="mx-auto max-w-3xl px-4 py-16 text-center">
        <h2 className="text-2xl font-semibold">Cada barberia tiene su enlace publico</h2>
        <p className="mt-3 text-neutral-600">Tus clientes reservan desde una pagina unica con tu logo, nombre, direccion, servicios y barberos.</p>
        <div className="mt-5 rounded-md border border-neutral-200 bg-neutral-50 p-4 font-mono text-sm">trimio.app/barberia/la-fama</div>
      </section>
    </div>
  )
}
