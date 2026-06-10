import { useState } from 'react'
import { Mail, ShieldCheck, User } from 'lucide-react'
import Button from '@/components/Button'
import { useAuth } from '@/auth/AuthContext'

export default function BarberPanel({ path }) {
  if (path.startsWith('/barbero/agenda')) {
    return <BarberAgenda />
  }

  if (path.startsWith('/barbero/disponibilidad')) {
    return <BarberAvailability />
  }

  if (path.startsWith('/barbero/configuracion')) {
    return <BarberSettings />
  }

  return <BarberHome />
}

function BarberHome() {
  const { profile } = useAuth()

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
      <div className="rounded-lg border border-neutral-200 bg-white p-5">
        <p className="text-sm text-neutral-500">Bienvenido</p>
        <h2 className="mt-1 text-2xl font-semibold">{profile?.full_name || 'Barbero'}</h2>
        <p className="mt-3 text-neutral-600">
          Desde aqui puedes revisar tu agenda, disponibilidad y datos de perfil.
        </p>
      </div>
      <div className="rounded-lg border border-neutral-200 bg-white p-5">
        <p className="text-sm text-neutral-500">Estado</p>
        <h3 className="mt-2 font-semibold">Sin citas conectadas</h3>
        <p className="mt-2 text-sm text-neutral-600">
          Cuando el modulo de reservas este conectado, tus proximas citas apareceran aqui.
        </p>
      </div>
    </div>
  )
}

function BarberAgenda() {
  return (
    <div className="rounded-lg border border-neutral-200 bg-white">
      <div className="border-b border-neutral-200 p-5">
        <h2 className="font-semibold">Agenda</h2>
        <p className="mt-1 text-sm text-neutral-600">Citas asignadas a tu usuario.</p>
      </div>
      <p className="p-5 text-sm text-neutral-600">
        Todavia no hay citas reales conectadas para este barbero.
      </p>
    </div>
  )
}

function BarberAvailability() {
  return (
    <div className="rounded-lg border border-neutral-200 bg-white">
      <div className="border-b border-neutral-200 p-5">
        <h2 className="font-semibold">Disponibilidad</h2>
        <p className="mt-1 text-sm text-neutral-600">Horarios y bloqueos del barbero.</p>
      </div>
      <p className="p-5 text-sm text-neutral-600">
        Todavia no hay horarios reales conectados para este barbero.
      </p>
    </div>
  )
}

function BarberSettings() {
  const { profile, updatePassword, updateProfile } = useAuth()
  const [form, setForm] = useState({
    fullName: profile?.full_name || '',
    phone: profile?.phone || '',
  })
  const [password, setPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSaving(true)
    setStatus('')
    setError('')

    try {
      await updateProfile(form)

      if (password) {
        await updatePassword(password)
        setPassword('')
      }

      setStatus(password ? 'Perfil y contrasena actualizados correctamente.' : 'Perfil actualizado correctamente.')
    } catch (saveError) {
      setError(saveError.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
      <form onSubmit={handleSubmit} className="rounded-lg border border-neutral-200 bg-white">
        <div className="border-b border-neutral-200 p-5">
          <h2 className="font-semibold">Configuracion de perfil</h2>
          <p className="mt-1 text-sm text-neutral-600">Manten tus datos personales y acceso actualizados.</p>
        </div>

        <div className="grid gap-6 p-5 lg:grid-cols-2">
          <section className="grid gap-4">
            <div className="flex items-center gap-2">
              <span className="grid h-9 w-9 place-items-center rounded-md bg-neutral-100">
                <User size={18} />
              </span>
              <div>
                <h3 className="text-sm font-semibold">Datos personales</h3>
                <p className="text-xs text-neutral-500">Informacion visible para administracion.</p>
              </div>
            </div>
            <label className="grid gap-1 text-sm font-medium text-neutral-700">
              Nombre completo
              <input
                className="rounded-md border border-neutral-300 px-3 py-2 font-normal text-neutral-950"
                value={form.fullName}
                onChange={(event) => setForm({ ...form, fullName: event.target.value })}
                required
              />
            </label>
            <label className="grid gap-1 text-sm font-medium text-neutral-700">
              Telefono
              <input
                className="rounded-md border border-neutral-300 px-3 py-2 font-normal text-neutral-950"
                type="tel"
                value={form.phone}
                onChange={(event) => setForm({ ...form, phone: event.target.value })}
                required
              />
            </label>
          </section>

          <section className="grid content-start gap-4">
            <div className="flex items-center gap-2">
              <span className="grid h-9 w-9 place-items-center rounded-md bg-neutral-100">
                <ShieldCheck size={18} />
              </span>
              <div>
                <h3 className="text-sm font-semibold">Acceso</h3>
                <p className="text-xs text-neutral-500">Cambia tu contrasena cuando sea necesario.</p>
              </div>
            </div>
            <label className="grid gap-1 text-sm font-medium text-neutral-700">
              Nueva contrasena
              <input
                className="rounded-md border border-neutral-300 px-3 py-2 font-normal text-neutral-950"
                placeholder="Opcional"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                minLength={6}
              />
            </label>
            <p className="rounded-md bg-neutral-50 p-3 text-xs text-neutral-600">
              Si dejas este campo vacio, solo se actualizan tu nombre y telefono.
            </p>
          </section>
        </div>

        <div className="flex flex-col gap-3 border-t border-neutral-200 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-h-10">
            {status && <p className="rounded-md bg-neutral-100 p-3 text-sm text-neutral-700">{status}</p>}
            {error && <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>}
          </div>
          <Button type="submit" className="w-full sm:w-auto" disabled={saving}>
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </Button>
        </div>
      </form>

      <aside className="rounded-lg border border-neutral-200 bg-white p-5">
        <div className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-md bg-neutral-100">
            <Mail size={18} />
          </span>
          <div>
            <h3 className="text-sm font-semibold">Cuenta</h3>
            <p className="text-xs text-neutral-500">Correo y rol asignado.</p>
          </div>
        </div>
        <div className="mt-5 space-y-4 text-sm">
          <div>
            <p className="text-xs uppercase tracking-wide text-neutral-500">Correo</p>
            <p className="mt-1 break-words font-medium">{profile?.email || 'Sin correo'}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-neutral-500">Rol</p>
            <p className="mt-1 font-medium">{profile?.role || 'barber'}</p>
          </div>
        </div>
      </aside>
    </div>
  )
}
