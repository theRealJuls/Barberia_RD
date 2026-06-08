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
const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173'
const hasValidSupabaseUrl = /^https?:\/\//i.test(supabaseUrl || '')
const serviceKeyRole = getJwtRole(supabaseServiceRoleKey)
const hasServiceRoleKey = serviceKeyRole === 'service_role'

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

if (supabaseServiceRoleKey && !hasServiceRoleKey) {
  console.warn(`SUPABASE_SERVICE_ROLE_KEY no es service_role; rol detectado: ${serviceKeyRole}. El backend no podra saltar RLS.`)
}

app.use(cors({ origin: frontendUrl }))
app.use(express.json())

function getJwtRole(jwt) {
  try {
    const payload = jwt?.split('.')[1]

    if (!payload) {
      return 'missing'
    }

    return JSON.parse(Buffer.from(payload, 'base64url').toString()).role || 'unknown'
  } catch (_error) {
    return 'invalid'
  }
}

function requireSupabase(_req, res, next) {
  if (!supabaseAdmin) {
    return res.status(500).json({ error: 'Supabase no esta configurado en el backend.' })
  }

  if (!hasServiceRoleKey) {
    return res.status(500).json({
      error: 'Back-end/.env tiene SUPABASE_SERVICE_ROLE_KEY con la anon key. Usa la service_role key de Supabase Project Settings -> API.',
    })
  }

  next()
}

function getBearerToken(req) {
  const header = req.headers.authorization || ''
  const [type, token] = header.split(' ')

  if (type?.toLowerCase() !== 'bearer' || !token) {
    return null
  }

  return token
}

async function getProfile(user) {
  const { data: profile, error } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!error && profile) {
    return profile
  }

  const fullName =
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    user.email?.split('@')[0] ||
    'Usuario'
  const phone = user.user_metadata?.phone || null

  const { data: createdProfile, error: createError } = await supabaseAdmin
    .from('profiles')
    .upsert(
      {
        id: user.id,
        full_name: fullName,
        phone,
        email: user.email,
        avatar_url: user.user_metadata?.avatar_url || null,
        role: 'client',
      },
      { onConflict: 'id' }
    )
    .select('*')
    .single()

  if (!createError) {
    return createdProfile
  }

  console.warn('Profile upsert full payload failed, retrying minimal payload:', createError.message)

  const { data: minimalProfile, error: minimalError } = await supabaseAdmin
    .from('profiles')
    .upsert(
      {
        id: user.id,
        full_name: fullName,
        role: 'client',
      },
      { onConflict: 'id' }
    )
    .select('*')
    .single()

  if (minimalError) {
    throw minimalError
  }

  return minimalProfile
}

async function getStaffMemberships(profileId) {
  const { data, error } = await supabaseAdmin
    .from('barbershop_staff')
    .select('*')
    .eq('profile_id', profileId)
    .eq('is_active', true)

  if (error) {
    console.warn('No se pudieron cargar permisos staff; usando cliente por defecto:', error.message)
    return []
  }

  return data || []
}

function getPrimaryAccess(profile, staffMemberships) {
  if (profile.role === 'super_admin') {
    return {
      role: 'super_admin',
      panelPath: '/super-admin',
      barbershopId: null,
      membership: null,
    }
  }

  const firstStaffMembership = staffMemberships[0]

  if (firstStaffMembership) {
    const panelByRole = {
      admin: '/admin',
      receptionist: '/recepcion',
      barber: '/barbero',
    }

    return {
      role: firstStaffMembership.role,
      panelPath: panelByRole[firstStaffMembership.role] || '/cliente',
      barbershopId: firstStaffMembership.barbershop_id,
      membership: firstStaffMembership,
    }
  }

  return {
    role: 'client',
    panelPath: '/cliente',
    barbershopId: null,
    membership: null,
  }
}

async function buildAuthContext(user) {
  const profile = await getProfile(user)
  const staffMemberships = await getStaffMemberships(user.id)
  const access = getPrimaryAccess(profile, staffMemberships)

  return {
    user,
    profile,
    staffMemberships,
    access,
  }
}

async function requireAuth(req, res, next) {
  try {
    if (!supabaseAdmin) {
      return res.status(500).json({ error: 'Supabase no esta configurado en el backend.' })
    }

    if (!hasServiceRoleKey) {
      return res.status(500).json({
        error: 'Back-end/.env tiene SUPABASE_SERVICE_ROLE_KEY con la anon key. Usa la service_role key de Supabase Project Settings -> API.',
      })
    }

    const token = getBearerToken(req)

    if (!token) {
      return res.status(401).json({ error: 'Token requerido.' })
    }

    const { data, error } = await supabaseAdmin.auth.getUser(token)

    if (error || !data?.user) {
      return res.status(401).json({ error: 'Sesion invalida.' })
    }

    req.auth = await buildAuthContext(data.user)
    next()
  } catch (error) {
    console.error('Auth middleware error:', error)
    res.status(500).json({ error: error.message || 'No se pudo validar la sesion.' })
  }
}

function canManageStaff(auth, barbershopId) {
  if (auth.profile.role === 'super_admin') {
    return true
  }

  return auth.staffMemberships.some((membership) => {
    const membershipBarbershopId = membership.barbershop_id || membership.barbershopId

    return (
      membershipBarbershopId === barbershopId &&
      membership.role === 'admin' &&
      membership.is_active
    )
  })
}

async function upsertProfileForUser(user, fallbackRole = 'client') {
  const fullName =
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    user.email?.split('@')[0] ||
    'Usuario'
  const phone = user.user_metadata?.phone || null

  const { data, error } = await supabaseAdmin
    .from('profiles')
    .upsert(
      {
        id: user.id,
        full_name: fullName,
        phone,
        email: user.email,
        avatar_url: user.user_metadata?.avatar_url || null,
        role: fallbackRole,
      },
      { onConflict: 'id' }
    )
    .select('*')
    .single()

  if (!error) {
    return data
  }

  console.warn('Staff profile upsert full payload failed, retrying minimal payload:', error.message)

  const { data: minimalData, error: minimalError } = await supabaseAdmin
    .from('profiles')
    .upsert(
      {
        id: user.id,
        full_name: fullName,
        role: fallbackRole,
      },
      { onConflict: 'id' }
    )
    .select('*')
    .single()

  if (minimalError) {
    throw minimalError
  }

  return minimalData
}

async function findUserByEmail(email) {
  const { data, error } = await supabaseAdmin.auth.admin.listUsers()

  if (error) {
    throw error
  }

  return data.users.find((user) => user.email?.toLowerCase() === email.toLowerCase()) || null
}

app.get('/health', (_req, res) => {
  res.json({
    ok: true,
    service: 'trimio-backend',
    supabaseConfigured: Boolean(supabaseAdmin),
  })
})

app.get('/api/auth/me', requireAuth, (req, res) => {
  res.json({
    user: {
      id: req.auth.user.id,
      email: req.auth.user.email,
    },
    profile: req.auth.profile,
    staffMemberships: req.auth.staffMemberships,
    access: req.auth.access,
  })
})

app.patch('/api/auth/profile', requireAuth, async (req, res) => {
  try {
    const fullName = String(req.body.fullName || '').trim()
    const phone = String(req.body.phone || '').trim()

    if (!fullName || !phone) {
      return res.status(400).json({ error: 'Nombre completo y telefono son requeridos.' })
    }

    const { data: profile, error } = await supabaseAdmin
      .from('profiles')
      .update({
        full_name: fullName,
        phone,
      })
      .eq('id', req.auth.user.id)
      .select('*')
      .single()

    if (error) {
      throw error
    }

    res.json({ profile })
  } catch (error) {
    console.error('update profile error:', error)
    res.status(500).json({ error: 'No se pudo actualizar el perfil.' })
  }
})

app.post('/api/admin/invite-user', requireAuth, async (req, res) => {
  try {
    const { email, fullName, role, barbershopId } = req.body
    const allowedRoles = ['admin', 'receptionist', 'barber']

    if (!email || !role || !barbershopId) {
      return res.status(400).json({ error: 'email, role y barbershopId son requeridos.' })
    }

    if (!allowedRoles.includes(role)) {
      return res.status(400).json({ error: 'Rol invalido para staff.' })
    }

    if (!canManageStaff(req.auth, barbershopId)) {
      return res.status(403).json({ error: 'No tienes permiso para crear usuarios en esta barberia.' })
    }

    const { data: invited, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
      data: {
        full_name: fullName || email.split('@')[0],
      },
      redirectTo: `${frontendUrl}/auth/callback`,
    })

    let invitedUser = invited?.user

    if (inviteError) {
      invitedUser = await findUserByEmail(email)

      if (!invitedUser) {
        return res.status(400).json({ error: inviteError.message })
      }
    }

    const profile = await upsertProfileForUser(
      {
        ...invitedUser,
        user_metadata: {
          ...invitedUser.user_metadata,
          full_name: fullName || invitedUser.user_metadata?.full_name,
        },
      },
      role
    )

    const { data: membership, error: staffError } = await supabaseAdmin
      .from('barbershop_staff')
      .upsert(
        {
          barbershop_id: barbershopId,
          profile_id: invitedUser.id,
          role,
          is_active: true,
        },
        { onConflict: 'barbershop_id,profile_id' }
      )
      .select('*')
      .single()

    if (staffError) {
      throw staffError
    }

    res.status(201).json({ profile, membership })
  } catch (error) {
    console.error('invite-user error:', error)
    res.status(500).json({ error: 'No se pudo invitar el usuario.' })
  }
})

app.post('/api/admin/assign-role', requireAuth, async (req, res) => {
  try {
    const { profileId, role, barbershopId } = req.body
    const allowedRoles = ['admin', 'receptionist', 'barber']

    if (!profileId || !role || !barbershopId) {
      return res.status(400).json({ error: 'profileId, role y barbershopId son requeridos.' })
    }

    if (!allowedRoles.includes(role)) {
      return res.status(400).json({ error: 'Rol invalido para staff.' })
    }

    if (!canManageStaff(req.auth, barbershopId)) {
      return res.status(403).json({ error: 'No tienes permiso para asignar roles en esta barberia.' })
    }

    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({ role })
      .eq('id', profileId)
      .select('*')
      .single()

    if (profileError) {
      throw profileError
    }

    const { data: membership, error: staffError } = await supabaseAdmin
      .from('barbershop_staff')
      .upsert(
        {
          barbershop_id: barbershopId,
          profile_id: profileId,
          role,
          is_active: true,
        },
        { onConflict: 'barbershop_id,profile_id' }
      )
      .select('*')
      .single()

    if (staffError) {
      throw staffError
    }

    res.json({ profile, membership })
  } catch (error) {
    console.error('assign-role error:', error)
    res.status(500).json({ error: 'No se pudo asignar el rol.' })
  }
})

app.post('/api/clients/ensure', requireAuth, async (req, res) => {
  try {
    const { barbershopId } = req.body

    if (!barbershopId) {
      return res.status(400).json({ error: 'barbershopId es requerido.' })
    }

    const { data: client, error } = await supabaseAdmin
      .from('clients')
      .upsert(
        {
          barbershop_id: barbershopId,
          profile_id: req.auth.user.id,
          is_active: true,
        },
        { onConflict: 'barbershop_id,profile_id' }
      )
      .select('*')
      .single()

    if (error) {
      throw error
    }

    res.status(201).json({ client })
  } catch (error) {
    console.error('clients/ensure error:', error)
    res.status(500).json({ error: 'No se pudo registrar el cliente en la barberia.' })
  }
})

app.get('/api/barbershops/:slug', requireSupabase, async (req, res) => {
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
