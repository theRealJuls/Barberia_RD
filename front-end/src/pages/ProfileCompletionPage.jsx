import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Scissors } from 'lucide-react'
import { useAuth } from '@/auth/AuthContext'
import Button from '@/components/Button'

export default function ProfileCompletionPage() {
  const { profile, updateProfile, loading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [fullName, setFullName] = useState(profile?.full_name || '')
  const [phone, setPhone] = useState(profile?.phone || '')
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState('')

  useEffect(() => {
    if (!loading) {
      setFullName(profile?.full_name || '')
      setPhone(profile?.phone || '')
    }
  }, [loading, profile])

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSubmitting(true)
    setFormError('')

    try {
      await updateProfile({ fullName, phone })
      navigate(location.state?.from || '/cliente', { replace: true })
    } catch (error) {
      setFormError(error.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="grid min-h-screen place-items-center bg-neutral-50 px-4">
      <div className="w-full max-w-sm rounded-lg border border-neutral-200 bg-white p-6 shadow-sm">
        <Link to="/" className="mb-6 flex items-center gap-2 font-semibold">
          <span className="grid h-9 w-9 place-items-center rounded-md bg-neutral-900 text-white"><Scissors size={18} /></span>
          Trimio
        </Link>
        <h1 className="text-2xl font-semibold">Completar perfil</h1>
        <p className="mt-2 text-sm text-neutral-600">Necesitamos estos datos para tus reservas y permisos.</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-3">
          <input
            className="w-full rounded-md border border-neutral-300 px-3 py-2"
            placeholder="Nombre completo"
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            required
          />
          <input
            className="w-full rounded-md border border-neutral-300 px-3 py-2"
            placeholder="Telefono"
            type="tel"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            required
          />
          {formError && <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">{formError}</p>}
          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? 'Guardando...' : 'Continuar'}
          </Button>
        </form>
      </div>
    </div>
  )
}
