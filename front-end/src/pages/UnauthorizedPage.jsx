import { Link } from 'react-router-dom'
import { useAuth } from '@/auth/AuthContext'
import Button from '@/components/Button'

export default function UnauthorizedPage() {
  const { access } = useAuth()

  return (
    <div className="grid min-h-screen place-items-center bg-neutral-50 px-4">
      <div className="max-w-md rounded-lg border border-neutral-200 bg-white p-6 text-center">
        <h1 className="text-2xl font-semibold">No autorizado</h1>
        <p className="mt-2 text-neutral-600">Tu cuenta no tiene permisos para acceder a este panel.</p>
        <Link to={access?.panelPath || '/cliente'} className="mt-5 inline-block">
          <Button>Ir a mi panel</Button>
        </Link>
      </div>
    </div>
  )
}
