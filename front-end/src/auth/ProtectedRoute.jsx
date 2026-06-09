import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './AuthContext'

export function ProtectedRoute({ allowedRoles, children }) {
  const { access, loading, session, role } = useAuth()
  const location = useLocation()

  if (loading || (session && !role)) {
    return (
      <div className="grid min-h-screen place-items-center bg-neutral-50 text-neutral-600">
        Cargando sesion...
      </div>
    )
  }

  if (!session) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  if (allowedRoles?.length && !allowedRoles.includes(role)) {
    return <Navigate to={access?.panelPath || '/no-autorizado'} replace />
  }

  return children
}
