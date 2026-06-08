import Shell from '@/components/Shell'
import ClienteList from '@/components/Clientes/ClienteList'

export default function ClientesPage({ nav, title }) {
  return (
    <Shell title={title} nav={nav}>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Gestión de Clientes</h1>
        <p className="mt-1 text-neutral-600">
          Administra los clientes registrados en el sistema.
        </p>
      </div>
      <ClienteList />
    </Shell>
  )
}