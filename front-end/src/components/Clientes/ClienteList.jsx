import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { clientes as clientesMock, clienteHistorial } from '@/data/mockData'
import ClienteHistorial from './ClienteHistorial'

export default function ClienteList() {
  const [clientes, setClientes] = useState([])
  const [selectedClienteId, setSelectedClienteId] = useState('')
  const [usingMockData, setUsingMockData] = useState(false)
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
      setClientes(clientesMock)
      setSelectedClienteId(clientesMock[0]?.id || '')
      setUsingMockData(true)
    } else {
      const clientesData = data?.length ? data : clientesMock
      setClientes(clientesData)
      setSelectedClienteId(clientesData[0]?.id || '')
      setUsingMockData(!data?.length)
    }
    setLoading(false)
  }

  if (loading) return <p className="text-neutral-500">Cargando clientes...</p>

  const selectedCliente = clientes.find((cliente) => cliente.id === selectedClienteId)

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
      <div className="rounded-lg border border-neutral-200 bg-white">
        <div className="border-b border-neutral-200 p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="font-semibold">Clientes registrados</h2>
              <p className="mt-1 text-sm text-neutral-600">
                Lista de clientes y acceso rapido a su historial.
              </p>
            </div>
            {usingMockData && (
              <span className="w-fit rounded-full bg-yellow-50 px-3 py-1 text-xs font-medium text-yellow-800">
                Datos de demo
              </span>
            )}
          </div>
        </div>
        <div className="divide-y divide-neutral-200">
          {clientes.length === 0 ? (
            <p className="p-5 text-sm text-neutral-500">No hay clientes registrados.</p>
          ) : (
            clientes.map((cliente) => (
              <button
                key={cliente.id}
                type="button"
                className={`grid w-full gap-2 p-5 text-left transition md:grid-cols-[1fr_1fr_160px] md:items-center ${
                  selectedClienteId === cliente.id ? 'bg-neutral-50' : 'hover:bg-neutral-50'
                }`}
                onClick={() => setSelectedClienteId(cliente.id)}
              >
                <div>
                  <p className="font-medium">{cliente.full_name || 'Cliente sin nombre'}</p>
                  <p className="text-sm text-neutral-500">
                    Desde {cliente.created_at ? new Date(cliente.created_at).toLocaleDateString('es-DO') : 'sin fecha'}
                  </p>
                </div>
                <p className="text-sm text-neutral-600">{cliente.email || 'Sin correo'}</p>
                <p className="text-sm text-neutral-600">{cliente.phone || 'Sin telefono'}</p>
              </button>
            ))
          )}
        </div>
      </div>

      <div>
        {selectedCliente ? (
          <>
            <div className="mb-4 rounded-lg border border-neutral-200 bg-white p-5">
              <p className="text-sm text-neutral-500">Cliente seleccionado</p>
              <h2 className="mt-1 font-semibold">{selectedCliente.full_name || 'Cliente'}</h2>
              <p className="mt-1 text-sm text-neutral-600">{selectedCliente.email || 'Sin correo'}</p>
              <p className="mt-1 text-sm text-neutral-600">{selectedCliente.phone || 'Sin telefono'}</p>
            </div>
            <ClienteHistorial
              clienteId={selectedCliente.id}
              citasMock={usingMockData ? clienteHistorial[selectedCliente.id] || [] : []}
            />
          </>
        ) : (
          <div className="rounded-lg border border-dashed border-neutral-300 bg-white p-5">
            <h2 className="font-semibold">Historial de citas</h2>
            <p className="mt-1 text-sm text-neutral-600">Selecciona un cliente para ver sus citas.</p>
          </div>
        )}
      </div>
    </div>
  )
}
