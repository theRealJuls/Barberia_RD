import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Scissors } from 'lucide-react'
import { useAuth } from '@/auth/AuthContext'
import Button from '@/components/Button'
import GoogleIcon from '@/components/GoogleIcon'

export default function LoginPage() {
  const [mode, setMode] = useState('login')
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [formError, setFormError] = useState('')
  const { signInWithEmail, signInWithGoogle, signUpClient } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const redirectTo = location.state?.from || null
  const getAuthErrorMessage = (error) => {
    const message = error?.message || ''

    if (message.toLowerCase().includes('email rate limit')) {
      return 'El envio de correos esta temporalmente limitado. Espera unos minutos o entra con Google.'
    }

    if (message.toLowerCase().includes('invalid login credentials')) {
      return 'Correo o contrasena incorrectos.'
    }

    if (message.toLowerCase().includes('email not confirmed') || message.toLowerCase().includes('confirmada por correo')) {
      return 'Revisa tu correo y confirma la cuenta antes de iniciar sesion.'
    }

    if (message.toLowerCase().includes('session') || message.toLowerCase().includes('sesion')) {
      return 'No se pudo validar la sesion. Cierra sesion, confirma tu correo e intenta de nuevo.'
    }

    return message || 'No se pudo completar la accion.'
  }

  const handleEmailSubmit = async (event) => {
    event.preventDefault()
    setSubmitting(true)
    setFormError('')
    setMessage('')

    try {
      const authData =
        mode === 'register'
          ? await signUpClient({ email, password, fullName, phone, returnTo: redirectTo || '/cliente' })
          : await signInWithEmail({ email, password })

      if (!authData && mode === 'register') {
        setMessage('Revisa tu correo para confirmar la cuenta.')
        return
      }

      if (authData?.access?.role === 'client' && authData?.profile && (!authData.profile.full_name || !authData.profile.phone)) {
        navigate('/completar-perfil', { replace: true, state: { from: redirectTo || authData?.access?.panelPath || '/cliente' } })
        return
      }

      navigate(redirectTo || authData?.access?.panelPath || '/cliente', { replace: true })
    } catch (error) {
      setFormError(getAuthErrorMessage(error))
    } finally {
      setSubmitting(false)
    }
  }

  const handleGoogle = async () => {
    setSubmitting(true)
    setFormError('')

    try {
      await signInWithGoogle({ returnTo: redirectTo || '/cliente' })
    } catch (error) {
      setFormError(getAuthErrorMessage(error))
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
        <h1 className="text-2xl font-semibold">{mode === 'login' ? 'Iniciar sesion' : 'Crear cuenta'}</h1>
        <p className="mt-2 text-sm text-neutral-600">
          {mode === 'login' ? 'Accede a tu panel segun tus permisos.' : 'Crea tu cuenta para acceder a Trimio.'}
        </p>

        <form onSubmit={handleEmailSubmit} className="mt-6 space-y-3">
          {mode === 'register' && (
            <>
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
            </>
          )}
          <input
            className="w-full rounded-md border border-neutral-300 px-3 py-2"
            placeholder="Correo"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
          <input
            className="w-full rounded-md border border-neutral-300 px-3 py-2"
            placeholder="Contrasena"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            minLength={6}
          />
          {formError && <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">{formError}</p>}
          {message && <p className="rounded-md bg-neutral-100 p-3 text-sm text-neutral-700">{message}</p>}
          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? 'Procesando...' : mode === 'login' ? 'Entrar' : 'Crear cuenta'}
          </Button>
        </form>

        <Button type="button" variant="outline" className="mt-3 w-full" onClick={handleGoogle} disabled={submitting}>
          <GoogleIcon />
          Continuar con Google
        </Button>

        <button
          type="button"
          className="mt-5 w-full text-center text-sm text-neutral-600 hover:text-neutral-950"
          onClick={() => {
            setMode(mode === 'login' ? 'register' : 'login')
            setFormError('')
            setMessage('')
          }}
        >
          {mode === 'login' ? 'Crear cuenta' : 'Iniciar sesion'}
        </button>
      </div>
    </div>
  )
}
