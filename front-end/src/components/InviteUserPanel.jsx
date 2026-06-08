import { useState } from 'react'
import { apiRequest } from '@/lib/api'
import Button from '@/components/Button'

export default function InviteUserPanel({ token, defaultBarbershopId }) {
  const [email, setEmail] = useState('')
  const [fullName, setFullName] = useState('')
  const [role, setRole] = useState('barber')
  const [barbershopId, setBarbershopId] = useState(defaultBarbershopId)
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleInvite = async (event) => {
    event.preventDefault()
    setSubmitting(true)
    setStatus('')
    setError('')

    try {
      await apiRequest('/api/admin/invite-user', {
        method: 'POST',
        token,
        body: {
          email,
          fullName,
          role,
          barbershopId,
        },
      })

      setStatus('Invitacion creada correctamente.')
      setEmail('')
      setFullName('')
    } catch (inviteError) {
      setError(inviteError.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mt-6 rounded-lg border border-neutral-200 bg-white p-5">
      <h2 className="font-semibold">Invitar usuario interno</h2>
      <p className="mt-1 text-sm text-neutral-600">Crea invitaciones para admin, recepcionista o barbero.</p>
      <form onSubmit={handleInvite} className="mt-5 grid gap-3 md:grid-cols-5">
        <input
          className="rounded-md border border-neutral-300 px-3 py-2"
          placeholder="Nombre"
          value={fullName}
          onChange={(event) => setFullName(event.target.value)}
        />
        <input
          className="rounded-md border border-neutral-300 px-3 py-2"
          placeholder="Correo"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
        <select className="rounded-md border border-neutral-300 px-3 py-2" value={role} onChange={(event) => setRole(event.target.value)}>
          <option value="barber">Barbero</option>
          <option value="receptionist">Recepcionista</option>
          <option value="admin">Admin</option>
        </select>
        <input
          className="rounded-md border border-neutral-300 px-3 py-2"
          placeholder="barbershop_id"
          value={barbershopId}
          onChange={(event) => setBarbershopId(event.target.value)}
          required
        />
        <Button type="submit" disabled={submitting}>
          {submitting ? 'Enviando...' : 'Invitar'}
        </Button>
      </form>
      {status && <p className="mt-3 rounded-md bg-neutral-100 p-3 text-sm text-neutral-700">{status}</p>}
      {error && <p className="mt-3 rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>}
    </div>
  )
}
