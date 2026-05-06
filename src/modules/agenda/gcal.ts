'use server'

import { createAdminClient } from '@/utils/supabase/admin'

// ─── Tipos ───────────────────────────────────────────────────────
export type GCalToken = {
  gcal_access_token: string
  gcal_refresh_token: string
  gcal_token_expiry: string
}

export type GCalEvent = {
  id?: string
  summary: string
  description?: string
  start: { dateTime: string; timeZone: string }
  end: { dateTime: string; timeZone: string }
  attendees?: { email: string; displayName?: string }[]
}

// ─── Refresh de tokens ──────────────────────────────────────────
/**
 * Lee los tokens GCal del usuario desde mpaci_usuarios.
 * Si el access_token expiró, lo renueva usando el refresh_token
 * y persiste el nuevo par en la DB (vía service_role, sin RLS).
 */
export async function getValidGCalToken(usuarioId: string): Promise<string | null> {
  const admin = createAdminClient()

  const { data, error } = await admin
    .from('mpaci_usuarios')
    .select('gcal_access_token, gcal_refresh_token, gcal_token_expiry')
    .eq('id', usuarioId)
    .single()

  if (error || !data?.gcal_refresh_token) {
    console.warn('[gcal] Usuario sin tokens GCal:', usuarioId)
    return null
  }

  const expiry = new Date(data.gcal_token_expiry)
  const ahora = new Date()

  // Si el token aún es válido (con 2 min de margen), devolverlo directo.
  if (data.gcal_access_token && expiry.getTime() - ahora.getTime() > 120_000) {
    return data.gcal_access_token
  }

  // Refresh usando Google OAuth2
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      refresh_token: data.gcal_refresh_token,
      grant_type: 'refresh_token',
    }),
  })

  if (!res.ok) {
    const body = await res.text()
    console.error('[gcal] Error renovando token:', res.status, body)
    return null
  }

  const tokenData = (await res.json()) as {
    access_token: string
    expires_in: number
  }

  // Persistir nuevo access_token y expiración
  const nuevaExpiracion = new Date(Date.now() + tokenData.expires_in * 1000).toISOString()

  await admin
    .from('mpaci_usuarios')
    .update({
      gcal_access_token: tokenData.access_token,
      gcal_token_expiry: nuevaExpiracion,
    })
    .eq('id', usuarioId)

  return tokenData.access_token
}

// ─── Fetch autenticado contra Google Calendar API ───────────────
async function gcalFetch(
  accessToken: string,
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  return fetch(`https://www.googleapis.com/calendar/v3${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })
}

// ─── CRUD de Eventos ────────────────────────────────────────────

/** Listar eventos del calendario primario en un rango de fechas */
export async function listarEventos(
  usuarioId: string,
  timeMin: string,
  timeMax: string
): Promise<GCalEvent[]> {
  const token = await getValidGCalToken(usuarioId)
  if (!token) return []

  const params = new URLSearchParams({
    timeMin,
    timeMax,
    singleEvents: 'true',
    orderBy: 'startTime',
    maxResults: '50',
  })

  const res = await gcalFetch(token, `/calendars/primary/events?${params}`)
  if (!res.ok) {
    console.error('[gcal] Error listando eventos:', res.status)
    return []
  }

  const body = await res.json()
  return body.items ?? []
}

/** Crear un evento en el calendario primario */
export async function crearEvento(
  usuarioId: string,
  evento: GCalEvent
): Promise<GCalEvent | null> {
  const token = await getValidGCalToken(usuarioId)
  if (!token) return null

  const res = await gcalFetch(token, '/calendars/primary/events', {
    method: 'POST',
    body: JSON.stringify(evento),
  })

  if (!res.ok) {
    console.error('[gcal] Error creando evento:', res.status, await res.text())
    return null
  }

  return (await res.json()) as GCalEvent
}

/** Actualizar un evento existente */
export async function actualizarEvento(
  usuarioId: string,
  eventId: string,
  cambios: Partial<GCalEvent>
): Promise<GCalEvent | null> {
  const token = await getValidGCalToken(usuarioId)
  if (!token) return null

  const res = await gcalFetch(token, `/calendars/primary/events/${eventId}`, {
    method: 'PATCH',
    body: JSON.stringify(cambios),
  })

  if (!res.ok) {
    console.error('[gcal] Error actualizando evento:', res.status, await res.text())
    return null
  }

  return (await res.json()) as GCalEvent
}

/** Eliminar un evento del calendario primario */
export async function eliminarEvento(
  usuarioId: string,
  eventId: string
): Promise<boolean> {
  const token = await getValidGCalToken(usuarioId)
  if (!token) return false

  const res = await gcalFetch(token, `/calendars/primary/events/${eventId}`, {
    method: 'DELETE',
  })

  if (!res.ok && res.status !== 410) {
    console.error('[gcal] Error eliminando evento:', res.status)
    return false
  }

  return true
}
