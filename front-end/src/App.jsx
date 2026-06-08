import { Route, Routes } from 'react-router-dom'
import { ProtectedRoute } from '@/auth/ProtectedRoute'
import AuthCallbackPage from '@/pages/AuthCallbackPage'
import BarbershopPage from '@/pages/BarbershopPage'
import BookingPage from '@/pages/BookingPage'
import Dashboard from '@/pages/Dashboard'
import HomePage from '@/pages/HomePage'
import LoginPage from '@/pages/LoginPage'
import ProfileCompletionPage from '@/pages/ProfileCompletionPage'
import UnauthorizedPage from '@/pages/UnauthorizedPage'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/barberia/:slug" element={<BarbershopPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/registro" element={<LoginPage />} />
      <Route path="/auth/callback" element={<AuthCallbackPage />} />
      <Route path="/no-autorizado" element={<UnauthorizedPage />} />
      <Route
        path="/completar-perfil"
        element={
          <ProtectedRoute allowedRoles={['client', 'admin', 'receptionist', 'barber', 'super_admin']}>
            <ProfileCompletionPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/cliente/reservar/:barbershopSlug"
        element={
          <ProtectedRoute allowedRoles={['client']}>
            <BookingPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/cliente/*"
        element={
          <ProtectedRoute allowedRoles={['client']}>
            <Dashboard role="cliente" />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/*"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <Dashboard role="admin" />
          </ProtectedRoute>
        }
      />
      <Route
        path="/recepcion/*"
        element={
          <ProtectedRoute allowedRoles={['receptionist']}>
            <Dashboard role="recepcion" />
          </ProtectedRoute>
        }
      />
      <Route
        path="/barbero/*"
        element={
          <ProtectedRoute allowedRoles={['barber']}>
            <Dashboard role="barbero" />
          </ProtectedRoute>
        }
      />
      <Route
        path="/super-admin/*"
        element={
          <ProtectedRoute allowedRoles={['super_admin']}>
            <Dashboard role="super-admin" />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<HomePage />} />
    </Routes>
  )
}
