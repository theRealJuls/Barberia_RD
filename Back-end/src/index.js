import cors from 'cors'
import dotenv from 'dotenv'
import express from 'express'
import { createClient } from '@supabase/supabase-js'

dotenv.config()

const app = express()
const port = process.env.PORT || 4000
const host = process.env.HOST || '0.0.0.0'

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

app.use(cors({ origin: true }))
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
    const fullName =
      profile.full_name ||
      user.user_metadata?.full_name ||
      user.user_metadata?.name ||
      user.email?.split('@')[0] ||
      'Usuario'
    const phone = profile.phone || user.user_metadata?.phone || null
    const email = profile.email || user.email || null
    const avatarUrl = profile.avatar_url || user.user_metadata?.avatar_url || null

    if (
      fullName !== profile.full_name ||
      phone !== profile.phone ||
      email !== profile.email ||
      avatarUrl !== profile.avatar_url
    ) {
      const { data: updatedProfile, error: updateError } = await supabaseAdmin
        .from('profiles')
        .update({
          full_name: fullName,
          phone,
          email,
          avatar_url: avatarUrl,
        })
        .eq('id', user.id)
        .select('*')
        .single()

      if (!updateError && updatedProfile) {
        return updatedProfile
      }

      console.warn('Profile hydration failed, using existing profile:', updateError?.message)
    }

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
      console.warn('Invalid auth session:', error?.message || 'No user returned')
      return res.status(401).json({ error: error?.message || 'Sesion invalida.' })
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

function requireSuperAdmin(req, res, next) {
  if (req.auth?.profile?.role !== 'super_admin') {
    return res.status(403).json({ error: 'Solo super admin puede hacer esta accion.' })
  }

  next()
}

function canManageBarbershop(auth, barbershopId) {
  return auth.profile.role === 'super_admin' || canManageStaff(auth, barbershopId)
}

function normalizeSlug(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function buildBarbershopPayload(body, userId, includeCreateFields = false) {
  const name = String(body.name || '').trim()
  const slug = normalizeSlug(body.slug || name)

  if (!name || !slug) {
    throw new Error('Nombre y slug son requeridos.')
  }

  const payload = {
    name,
    slug,
    logo_url: String(body.logo_url || '').trim() || null,
    cover_image_url: String(body.cover_image_url || '').trim() || null,
    phone: String(body.phone || '').trim() || null,
    whatsapp_phone: String(body.whatsapp_phone || '').trim() || null,
    email: String(body.email || '').trim() || null,
    address: String(body.address || '').trim() || null,
    city: String(body.city || '').trim() || null,
    province: String(body.province || '').trim() || null,
    country: String(body.country || 'Republica Dominicana').trim(),
    description: String(body.description || '').trim() || null,
    opening_time: String(body.opening_time || '').trim() || null,
    closing_time: String(body.closing_time || '').trim() || null,
    slot_buffer_minutes: Number(body.slot_buffer_minutes || 15),
    is_active: body.is_active === undefined ? true : Boolean(body.is_active),
    seo_title: String(body.seo_title || '').trim() || null,
    seo_description: String(body.seo_description || '').trim() || null,
    seo_keywords: String(body.seo_keywords || '').trim() || null,
    google_maps_url: String(body.google_maps_url || '').trim() || null,
    latitude: body.latitude === '' || body.latitude === undefined || body.latitude === null ? null : Number(body.latitude),
    longitude: body.longitude === '' || body.longitude === undefined || body.longitude === null ? null : Number(body.longitude),
    public_page_enabled: body.public_page_enabled === undefined ? true : Boolean(body.public_page_enabled),
  }

  if (includeCreateFields) {
    payload.created_by = userId
  }

  return payload
}

function buildServicePayload(body, barbershopId) {
  const name = String(body.name || '').trim()

  if (!name) {
    throw new Error('Nombre del servicio es requerido.')
  }

  return {
    barbershop_id: barbershopId,
    name,
    description: String(body.description || '').trim() || null,
    base_price: Number(body.base_price || 0),
    base_duration_minutes: Number(body.base_duration_minutes || 0),
    is_active: body.is_active === undefined ? true : Boolean(body.is_active),
  }
}

function buildBarberServicePayload(body, barbershopId, barberProfileId, serviceId) {
  return {
    barbershop_id: barbershopId,
    barber_profile_id: barberProfileId,
    service_id: serviceId,
    custom_price: body.custom_price === '' || body.custom_price === undefined || body.custom_price === null
      ? null
      : Number(body.custom_price),
    custom_duration_minutes:
      body.custom_duration_minutes === '' || body.custom_duration_minutes === undefined || body.custom_duration_minutes === null
        ? null
        : Number(body.custom_duration_minutes),
    is_active: body.is_active === undefined ? true : Boolean(body.is_active),
  }
}

async function upsertProfileForUser(user, fallbackRole = 'client') {
  const { data: existingProfile } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle()

  const fullName =
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    existingProfile?.full_name ||
    user.email?.split('@')[0] ||
    'Usuario'
  const phone = user.user_metadata?.phone || existingProfile?.phone || null

  const { data, error } = await supabaseAdmin
    .from('profiles')
    .upsert(
      {
        id: user.id,
        full_name: fullName,
        phone,
        email: user.email || existingProfile?.email || null,
        avatar_url: user.user_metadata?.avatar_url || existingProfile?.avatar_url || null,
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
    let invitationSent = Boolean(invitedUser)
    let existingUser = false

    if (inviteError) {
      invitedUser = await findUserByEmail(email)

      if (!invitedUser) {
        return res.status(400).json({ error: inviteError.message })
      }

      invitationSent = false
      existingUser = true
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

    res.status(201).json({ profile, membership, invitationSent, existingUser })
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

app.get('/api/admin/barbershops', requireAuth, requireSuperAdmin, async (_req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('barbershops')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      throw error
    }

    res.json({ barbershops: data || [] })
  } catch (error) {
    console.error('list barbershops error:', error)
    res.status(500).json({ error: 'No se pudieron cargar las barberias.' })
  }
})

app.get('/api/admin/barbershops/:id', requireAuth, async (req, res) => {
  try {
    if (!canManageBarbershop(req.auth, req.params.id)) {
      return res.status(403).json({ error: 'No tienes permiso para ver esta barberia.' })
    }

    const { data, error } = await supabaseAdmin
      .from('barbershops')
      .select('*')
      .eq('id', req.params.id)
      .single()

    if (error) {
      throw error
    }

    res.json({ barbershop: data })
  } catch (error) {
    console.error('get admin barbershop error:', error)
    res.status(500).json({ error: 'No se pudo cargar la barberia.' })
  }
})

app.post('/api/admin/barbershops', requireAuth, requireSuperAdmin, async (req, res) => {
  try {
    const payload = buildBarbershopPayload(req.body, req.auth.user.id, true)

    const { data, error } = await supabaseAdmin
      .from('barbershops')
      .insert(payload)
      .select('*')
      .single()

    if (error) {
      throw error
    }

    res.status(201).json({ barbershop: data })
  } catch (error) {
    console.error('create barbershop error:', error)
    const status = error.message === 'Nombre y slug son requeridos.' ? 400 : 500
    res.status(status).json({ error: status === 400 ? error.message : 'No se pudo crear la barberia.' })
  }
})

app.patch('/api/admin/barbershops/:id', requireAuth, async (req, res) => {
  try {
    if (!canManageBarbershop(req.auth, req.params.id)) {
      return res.status(403).json({ error: 'No tienes permiso para editar esta barberia.' })
    }

    const payload = buildBarbershopPayload(req.body, req.auth.user.id)

    const { data, error } = await supabaseAdmin
      .from('barbershops')
      .update(payload)
      .eq('id', req.params.id)
      .select('*')
      .single()

    if (error) {
      throw error
    }

    res.json({ barbershop: data })
  } catch (error) {
    console.error('update barbershop error:', error)
    const status = error.message === 'Nombre y slug son requeridos.' ? 400 : 500
    res.status(status).json({ error: status === 400 ? error.message : 'No se pudo actualizar la barberia.' })
  }
})

app.get('/api/admin/barbershops/:id/staff', requireAuth, async (req, res) => {
  try {
    if (!canManageBarbershop(req.auth, req.params.id)) {
      return res.status(403).json({ error: 'No tienes permiso para ver empleados de esta barberia.' })
    }

    const { data: memberships, error: staffError } = await supabaseAdmin
      .from('barbershop_staff')
      .select('*')
      .eq('barbershop_id', req.params.id)
      .eq('is_active', true)

    if (staffError) {
      throw staffError
    }

    const profileIds = (memberships || []).map((membership) => membership.profile_id).filter(Boolean)
    let profiles = []

    if (profileIds.length) {
      const { data: profileRows, error: profilesError } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .in('id', profileIds)

      if (profilesError) {
        throw profilesError
      }

      profiles = profileRows || []
    }

    const profilesById = new Map(profiles.map((profile) => [profile.id, profile]))
    const staff = (memberships || []).map((membership) => ({
      ...membership,
      profile: profilesById.get(membership.profile_id) || null,
    }))

    res.json({ staff })
  } catch (error) {
    console.error('list staff error:', error)
    res.status(500).json({ error: 'No se pudieron cargar los empleados.' })
  }
})

app.get('/api/admin/barbershops/:id/services', requireAuth, async (req, res) => {
  try {
    if (!canManageBarbershop(req.auth, req.params.id)) {
      return res.status(403).json({ error: 'No tienes permiso para ver servicios de esta barberia.' })
    }

    const { data, error } = await supabaseAdmin
      .from('services')
      .select('*')
      .eq('barbershop_id', req.params.id)
      .order('created_at', { ascending: false })

    if (error) {
      throw error
    }

    res.json({ services: data || [] })
  } catch (error) {
    console.error('list services error:', error)
    res.status(500).json({ error: 'No se pudieron cargar los servicios.' })
  }
})

app.post('/api/admin/barbershops/:id/services', requireAuth, async (req, res) => {
  try {
    if (!canManageBarbershop(req.auth, req.params.id)) {
      return res.status(403).json({ error: 'No tienes permiso para crear servicios en esta barberia.' })
    }

    const payload = buildServicePayload(req.body, req.params.id)
    const { data, error } = await supabaseAdmin
      .from('services')
      .insert(payload)
      .select('*')
      .single()

    if (error) {
      throw error
    }

    res.status(201).json({ service: data })
  } catch (error) {
    console.error('create service error:', error)
    const status = error.message === 'Nombre del servicio es requerido.' ? 400 : 500
    res.status(status).json({ error: status === 400 ? error.message : 'No se pudo crear el servicio.' })
  }
})

app.patch('/api/admin/barbershops/:id/services/:serviceId', requireAuth, async (req, res) => {
  try {
    if (!canManageBarbershop(req.auth, req.params.id)) {
      return res.status(403).json({ error: 'No tienes permiso para editar servicios en esta barberia.' })
    }

    const payload = buildServicePayload(req.body, req.params.id)
    const { data, error } = await supabaseAdmin
      .from('services')
      .update(payload)
      .eq('id', req.params.serviceId)
      .eq('barbershop_id', req.params.id)
      .select('*')
      .single()

    if (error) {
      throw error
    }

    res.json({ service: data })
  } catch (error) {
    console.error('update service error:', error)
    const status = error.message === 'Nombre del servicio es requerido.' ? 400 : 500
    res.status(status).json({ error: status === 400 ? error.message : 'No se pudo actualizar el servicio.' })
  }
})

app.get('/api/admin/barbershops/:id/barbers/:barberProfileId/services', requireAuth, async (req, res) => {
  try {
    const { id, barberProfileId } = req.params

    if (!canManageBarbershop(req.auth, id)) {
      return res.status(403).json({ error: 'No tienes permiso para ver servicios de este barbero.' })
    }

    const { data: membership, error: membershipError } = await supabaseAdmin
      .from('barbershop_staff')
      .select('*')
      .eq('barbershop_id', id)
      .eq('profile_id', barberProfileId)
      .eq('role', 'barber')
      .eq('is_active', true)
      .maybeSingle()

    if (membershipError) {
      throw membershipError
    }

    if (!membership) {
      return res.status(404).json({ error: 'Este usuario no es barbero activo de esta barberia.' })
    }

    const { data: services, error: servicesError } = await supabaseAdmin
      .from('services')
      .select('*')
      .eq('barbershop_id', id)
      .order('created_at', { ascending: false })

    if (servicesError) {
      throw servicesError
    }

    const { data: assignments, error: assignmentsError } = await supabaseAdmin
      .from('barber_services')
      .select('*')
      .eq('barbershop_id', id)
      .eq('barber_profile_id', barberProfileId)

    if (assignmentsError) {
      throw assignmentsError
    }

    const assignmentsByService = new Map((assignments || []).map((assignment) => [assignment.service_id, assignment]))
    const serviceAssignments = (services || []).map((service) => ({
      service,
      assignment: assignmentsByService.get(service.id) || null,
    }))

    res.json({ serviceAssignments })
  } catch (error) {
    console.error('list barber service assignments error:', error)
    res.status(500).json({ error: 'No se pudieron cargar los servicios del barbero.' })
  }
})

app.put('/api/admin/barbershops/:id/barbers/:barberProfileId/services', requireAuth, async (req, res) => {
  try {
    const { id, barberProfileId } = req.params
    const assignments = Array.isArray(req.body.assignments) ? req.body.assignments : []

    if (!canManageBarbershop(req.auth, id)) {
      return res.status(403).json({ error: 'No tienes permiso para asignar servicios a este barbero.' })
    }

    const { data: membership, error: membershipError } = await supabaseAdmin
      .from('barbershop_staff')
      .select('*')
      .eq('barbershop_id', id)
      .eq('profile_id', barberProfileId)
      .eq('role', 'barber')
      .eq('is_active', true)
      .maybeSingle()

    if (membershipError) {
      throw membershipError
    }

    if (!membership) {
      return res.status(404).json({ error: 'Este usuario no es barbero activo de esta barberia.' })
    }

    const serviceIds = assignments.map((assignment) => assignment.service_id).filter(Boolean)

    if (serviceIds.length) {
      const { data: validServices, error: validServicesError } = await supabaseAdmin
        .from('services')
        .select('id')
        .eq('barbershop_id', id)
        .in('id', serviceIds)

      if (validServicesError) {
        throw validServicesError
      }

      const validServiceIds = new Set((validServices || []).map((service) => service.id))

      if (serviceIds.some((serviceId) => !validServiceIds.has(serviceId))) {
        return res.status(400).json({ error: 'Uno de los servicios no pertenece a esta barberia.' })
      }
    }

    const savedAssignments = []

    for (const assignment of assignments) {
      const payload = buildBarberServicePayload(assignment, id, barberProfileId, assignment.service_id)
      const { data: existing, error: existingError } = await supabaseAdmin
        .from('barber_services')
        .select('id')
        .eq('barbershop_id', id)
        .eq('barber_profile_id', barberProfileId)
        .eq('service_id', assignment.service_id)
        .maybeSingle()

      if (existingError) {
        throw existingError
      }

      const query = existing
        ? supabaseAdmin.from('barber_services').update(payload).eq('id', existing.id)
        : supabaseAdmin.from('barber_services').insert(payload)

      const { data: saved, error: saveError } = await query.select('*').single()

      if (saveError) {
        throw saveError
      }

      savedAssignments.push(saved)
    }

    res.json({ assignments: savedAssignments })
  } catch (error) {
    console.error('save barber service assignments error:', error)
    res.status(500).json({ error: 'No se pudieron guardar los servicios del barbero.' })
  }
})

app.get('/api/barbershops/:slug', requireSupabase, async (req, res) => {
  const { slug } = req.params
  const { data: barbershop, error } = await supabaseAdmin
    .from('barbershops')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .single()

  if (error) {
    return res.status(404).json({ error: 'Barberia no encontrada.' })
  }

  const { data: services, error: servicesError } = await supabaseAdmin
    .from('services')
    .select('*')
    .eq('barbershop_id', barbershop.id)
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  if (servicesError) {
    return res.status(500).json({ error: 'No se pudieron cargar los servicios.' })
  }

  const { data: memberships, error: staffError } = await supabaseAdmin
    .from('barbershop_staff')
    .select('*')
    .eq('barbershop_id', barbershop.id)
    .eq('role', 'barber')
    .eq('is_active', true)

  if (staffError) {
    return res.status(500).json({ error: 'No se pudieron cargar los barberos.' })
  }

  const profileIds = (memberships || []).map((membership) => membership.profile_id).filter(Boolean)
  let profiles = []

  if (profileIds.length) {
    const { data: profileRows, error: profilesError } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name, avatar_url')
      .in('id', profileIds)

    if (profilesError) {
      return res.status(500).json({ error: 'No se pudieron cargar los perfiles de barberos.' })
    }

    profiles = profileRows || []
  }

  const profilesById = new Map(profiles.map((profile) => [profile.id, profile]))
  const barbers = (memberships || []).map((membership) => ({
    id: membership.profile_id,
    profile: profilesById.get(membership.profile_id) || null,
  }))

  res.json({ barbershop, services: services || [], barbers })
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
