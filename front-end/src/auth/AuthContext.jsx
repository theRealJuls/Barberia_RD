import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { apiRequest } from '@/lib/api'
import { supabase } from '@/lib/supabase'

const AuthContext = createContext(null)

function getRedirectPath(authData) {
  return authData?.access?.panelPath || '/cliente'
}

function getStoredReturnTo() {
  const returnTo = window.localStorage.getItem('trimio:returnTo')
  window.localStorage.removeItem('trimio:returnTo')
  return returnTo
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [authData, setAuthData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadMe = useCallback(async (activeSession) => {
    if (!activeSession?.access_token) {
      setAuthData(null)
      return null
    }

    const me = await apiRequest('/api/auth/me', {
      token: activeSession.access_token,
    })

    setAuthData(me)
    return me
  }, [])

  const refreshAuth = useCallback(async ({ throwOnError = false } = {}) => {
    setLoading(true)
    setError('')

    try {
      const { data, error: sessionError } = await supabase.auth.getSession()

      if (sessionError) {
        throw sessionError
      }

      setSession(data.session)

      if (data.session) {
        return await loadMe(data.session)
      }

      setAuthData(null)
      return null
    } catch (refreshError) {
      setError(refreshError.message)
      setAuthData(null)

      if (throwOnError) {
        throw refreshError
      }

      return null
    } finally {
      setLoading(false)
    }
  }, [loadMe])

  useEffect(() => {
    refreshAuth()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)

      if (nextSession) {
        loadMe(nextSession).catch((loadError) => {
          setError(loadError.message)
          setAuthData(null)
        })
      } else {
        setAuthData(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [loadMe, refreshAuth])

  const signInWithGoogle = async ({ returnTo } = {}) => {
    window.localStorage.setItem('trimio:returnTo', returnTo || window.location.pathname)

    const { error: googleError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (googleError) {
      throw googleError
    }
  }

  const signInWithEmail = async ({ email, password }) => {
    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (signInError) {
      throw signInError
    }

    setSession(data.session)
    return loadMe(data.session)
  }

  const signUpClient = async ({ email, password, fullName, phone, returnTo }) => {
    window.localStorage.setItem('trimio:returnTo', returnTo || window.location.pathname)

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          phone,
        },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (signUpError) {
      throw signUpError
    }

    if (data.session) {
      setSession(data.session)
      return loadMe(data.session)
    }

    return null
  }

  const updateProfile = useCallback(async ({ fullName, phone }) => {
    if (!session?.access_token) {
      throw new Error('Debes iniciar sesion para actualizar tu perfil.')
    }

    const result = await apiRequest('/api/auth/profile', {
      method: 'PATCH',
      token: session.access_token,
      body: {
        fullName,
        phone,
      },
    })

    await refreshAuth()
    return result
  }, [refreshAuth, session?.access_token])

  const finishAuthCallback = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''))
      const hashError = hashParams.get('error_description') || hashParams.get('error')

      if (hashError) {
        throw new Error(hashError)
      }

      const code = new URLSearchParams(window.location.search).get('code')

      if (code) {
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

        if (exchangeError) {
          throw exchangeError
        }
      }

      const authDataResult = await refreshAuth({ throwOnError: true })

      if (!authDataResult) {
        throw new Error('No se pudo crear la sesion de Google. Revisa la configuracion de Google y Supabase.')
      }

      return {
        authData: authDataResult,
        returnTo: getStoredReturnTo(),
      }
    } catch (callbackError) {
      setError(callbackError.message)
      throw callbackError
    } finally {
      setLoading(false)
    }
  }, [refreshAuth])

  const signOut = async () => {
    await supabase.auth.signOut()
    setSession(null)
    setAuthData(null)
  }

  const ensureClientForBarbershop = async (barbershopId) => {
    if (!session?.access_token) {
      throw new Error('Debes iniciar sesion para reservar.')
    }

    return apiRequest('/api/clients/ensure', {
      method: 'POST',
      token: session.access_token,
      body: { barbershopId },
    })
  }

  const value = useMemo(
    () => ({
      session,
      user: session?.user || null,
      profile: authData?.profile || null,
      staffMemberships: authData?.staffMemberships || [],
      access: authData?.access || null,
      role: authData?.access?.role || null,
      loading,
      error,
      needsProfileCompletion: Boolean(
        authData?.access?.role === 'client' &&
        authData?.profile &&
        (!authData.profile.full_name || !authData.profile.phone)
      ),
      refreshAuth,
      signInWithGoogle,
      signInWithEmail,
      signUpClient,
      updateProfile,
      finishAuthCallback,
      signOut,
      ensureClientForBarbershop,
      getRedirectPath: () => getRedirectPath(authData),
    }),
    [authData, error, finishAuthCallback, loading, refreshAuth, session, updateProfile]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider.')
  }

  return context
}
