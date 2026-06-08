import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function ClienteList() {
  const [clientes, setClientes] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchClientes()
  }, [])

  const fetchClientes = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, phone, email, created_at')
      .eq('role', 'client')

    if (error) {
      console.error('Error:', error.message)
    } else {
      setClientes(data)
    }
    setLoading(false)
  }

  if (loading) return <p className="text-neutral-500">Cargando clientes...</p>

  return (
    <div className="rounded-lg border border-neutral-200 bg-white">
      <div className="border-b border-neutral-200 p-5">
        <h2 className="font-semibold">Clientes registrados</h2>
        <p className="mt-1 text-sm text-neutral-600">
          Lista de todos los clientes en el sistema.
        </p>
      </div>
      <div className="divide-y divide-neutral-200">
        {clientes.length === 0 ? (
          <p className="p-5 text-sm text-neutral-500">No hay clientes registrados.</p>
        ) : (
          clientes.map((cliente) => (
            <div key={cliente.id} className="grid gap-2 p-5 md:grid-cols-3 md:items-center">
              <p className="font-medium">{cliente.full_name}</p>
              <p className="text-sm text-neutral-600">{cliente.email}</p>
              <p className="text-sm text-neutral-600">{cliente.phone}</p>
            </div>
          ))
        )}
      </div>
    </div>
  )
}