function getApiUrl() {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL
  }

  if (window.location.port === '5173') {
    return `${window.location.protocol}//${window.location.hostname}:4000`
  }

  return window.location.origin
}

const API_URL = getApiUrl()

export async function apiRequest(path, { token, method = 'GET', body } = {}) {
  const controller = new AbortController()
  const timeout = window.setTimeout(() => controller.abort(), 10000)
  const headers = {
    'Content-Type': 'application/json',
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  try {
    const response = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    })

    const payload = await response.json().catch(() => ({}))

    if (!response.ok) {
      throw new Error(payload.error || 'Error de comunicacion con el servidor.')
    }

    return payload
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('El backend no respondio. Revisa que Back-end este corriendo en el puerto 4000.')
    }

    if (error.message === 'Failed to fetch') {
      throw new Error('No se pudo conectar con el backend.')
    }

    throw error
  } finally {
    window.clearTimeout(timeout)
  }
}
