import cors from 'cors'
import dotenv from 'dotenv'
import express from 'express'
import { createClient } from '@supabase/supabase-js'

dotenv.config()

const app = express()
const port = process.env.PORT || 4000
const host = process.env.HOST || '127.0.0.1'

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const hasValidSupabaseUrl = /^https?:\/\//i.test(supabaseUrl || '')

const supabaseAdmin =
  hasValidSupabaseUrl && supabaseServiceRoleKey
    ? createClient(supabaseUrl, supabaseServiceRoleKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      })
    : null

if (!supabaseAdmin) {
  console.warn('Supabase backend no configurado. Revisa SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en Back-end/.env')
}

app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  })
)
app.use(express.json())

app.get('/health', (_req, res) => {
  res.json({
    ok: true,
    service: 'trimio-backend',
    supabaseConfigured: Boolean(supabaseAdmin),
  })
})

app.get('/api/barbershops/:slug', async (req, res) => {
  if (!supabaseAdmin) {
    return res.status(500).json({
      error: 'Supabase no esta configurado en el backend.',
    })
  }

  const { slug } = req.params
  const { data, error } = await supabaseAdmin
    .from('barbershops')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .single()

  if (error) {
    return res.status(404).json({ error: 'Barberia no encontrada.' })
  }

  res.json({ barbershop: data })
})

app.use((_req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada.' })
})

const server = app.listen(port, host, () => {
  console.log(`Backend corriendo en http://${host}:${port}`)
})

server.on('error', (error) => {
  console.error(`No se pudo iniciar el backend en ${host}:${port}`, error)
})

server.ref()
