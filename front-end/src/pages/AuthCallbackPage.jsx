import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/auth/AuthContext'
import Button from '@/components/Button'

export default function AuthCallbackPage() {
  const { finishAuthCallback } = useAuth()
  const navigate = useNavigate()
  const [error, setError] = useState('')

  useEffect(() => {
    let mounted = true

    async function finishLogin() {
      try {
        const { authData, returnTo } = await finishAuthCallback()
        const panelPath = returnTo && returnTo !== '/login' ? returnTo : authData?.access?.panelPath || '/cliente'

        if (mounted) {
          if (authData?.profile && (!authData.profile.full_name || !authData.profile.phone)) {
            navigate('/completar-perfil', { replace: true, state: { from: panelPath } })
            return
          }

          navigate(panelPath, { replace: true })
        }
      } catch (callbackError) {
        if (mounted) {
          setError(callbackError.message)
        }
      }
    }

    finishLogin()

    return () => {
      mounted = false
    }
  }, [finishAuthCallback, navigate])

  return (
    <div className="grid min-h-screen place-items-center bg-neutral-50 px-4">
      <div className="rounded-lg border border-neutral-200 bg-white p-6 text-center">
        <h1 className="text-xl font-semibold">Completando inicio de sesion</h1>
        <p className="mt-2 text-sm text-neutral-600">
          {error || 'Estamos validando tu cuenta y permisos.'}
        </p>
        {error && (
          <Link to="/login" className="mt-4 inline-block">
            <Button>Volver a iniciar sesion</Button>
          </Link>
        )}
      </div>
    </div>
  )
}
