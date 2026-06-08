import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function ClienteHistorial({ clienteId }) {
  const [citas, setCitas] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (clienteId) fetchHistorial()
  }, [clienteId])

  const fetchHistorial = async () => {
    const { data, error } = await supabase
      .from('appointments')
      .select(`
        id,
        starts_at,
        ends_at,
        status,
        total_price,
        notes,
        barber:barber_profile_id (full_name)
      `)
      .eq('client_profile_id', clienteId)
      .order('starts_at', { ascending: false })

    if (error) {
      console.error('Error:', error.message)
    } else {
      setCitas(data)
    }
    setLoading(false)
  }

  if (loading) return <p className="p-5 text-sm text-neutral-500">Cargando historial...</p>

  return (
    <div className="rounded-lg border border-neutral-200 bg-white">
      <div className="border-b border-neutral-200 p-5">
        <h2 className="font-semibold">Historial de citas</h2>
        <p className="mt-1 text-sm text-neutral-600">Todas las citas del cliente.</p>
      </div>
      <div className="divide-y divide-neutral-200">
        {citas.length === 0 ? (
          <p className="p-5 text-sm text-neutral-500">No hay citas registradas.</p>
        ) : (
          citas.map((cita) => (
            <div key={cita.id} className="grid gap-2 p-5 md:grid-cols-4 md:items-center">
              <p className="font-medium">{cita.barber?.full_name || 'Sin barbero'}</p>
              <p className="text-sm text-neutral-600">
                {new Date(cita.starts_at).toLocaleDateString('es-DO')}
              </p>
              <p className="text-sm text-neutral-600">
                RD${cita.total_price}
              </p>
              <span className="w-fit rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium">
                {cita.status}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  )
}