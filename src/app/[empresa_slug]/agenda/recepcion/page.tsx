import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { getMedicosRecepcion, getCitasRecepcion } from '@/modules/agenda/queries'
import AgendaRecepcionClient from '@/modules/agenda/components/AgendaRecepcionClient'
import type { AppRole } from '@/lib/database.types'
import { DateTime } from 'luxon'

type Props = {
  params:       Promise<{ empresa_slug: string }>
  searchParams: Promise<{ fecha?: string; cita?: string }>
}

export default async function AgendaRecepcionPage({ params, searchParams }: Props) {
  const { empresa_slug }  = await params
  const { fecha: fechaParam, cita: citaParam } = await searchParams

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: usuario } = await supabase
    .from('mpaci_usuarios')
    .select('id, rol, empresa_id, nombre_completo')
    .eq('id', user.id)
    .single()

  if (!usuario?.empresa_id) redirect('/unauthorized')

  const rolesPermitidos = ['asistente', 'admin', 'admin_general']
  if (!rolesPermitidos.includes(usuario.rol)) redirect(`/${empresa_slug}/agenda/hoy`)

  const { data: empresa } = await supabase
    .from('mpaci_empresas')
    .select('timezone')
    .eq('id', usuario.empresa_id)
    .single()
  const timezone = empresa?.timezone ?? 'America/Santiago'

  const fecha =
    fechaParam && /^\d{4}-\d{2}-\d{2}$/.test(fechaParam)
      ? fechaParam
      : DateTime.now().setZone(timezone).toISODate()!

  const [medicos, serviciosRes, sucursalesRes, salasRes] = await Promise.all([
    getMedicosRecepcion(usuario.empresa_id, user.id, usuario.rol as AppRole),
    supabase
      .from('mpaci_servicios')
      .select('id, nombre, duracion_minutos, precio_base, categoria')
      .eq('empresa_id', usuario.empresa_id)
      .eq('activo', true)
      .order('nombre'),
    supabase
      .from('mpaci_sucursales')
      .select('id, nombre')
      .eq('empresa_id', usuario.empresa_id)
      .eq('activo', true),
    supabase
      .from('mpaci_salas')
      .select('id, nombre, sucursal_id')
      .eq('empresa_id', usuario.empresa_id)
      .eq('activo', true),
  ])

  const medicosIds = medicos.map(m => m.id)
  const citas = await getCitasRecepcion(usuario.empresa_id, medicosIds, fecha, timezone)

  const servicios = (serviciosRes.data ?? []).map(s => ({
    id: s.id, nombre: s.nombre,
    duracion_minutos: s.duracion_minutos,
    precio_base: s.precio_base,
    categoria: s.categoria ?? null,
  }))
  const sucursales = (sucursalesRes.data ?? []).map(s => ({ id: s.id, nombre: s.nombre }))
  const salas      = (salasRes.data ?? []).map(s => ({
    id: s.id, nombre: s.nombre, sucursal_id: s.sucursal_id,
  }))

  return (
    <AgendaRecepcionClient
      key={`${fecha}-${citaParam ?? ''}`}
      citas={citas}
      medicos={medicos}
      fecha={fecha}
      timezone={timezone}
      empresaSlug={empresa_slug}
      servicios={servicios}
      sucursales={sucursales}
      salas={salas}
      selectedCitaId={citaParam}
    />
  )
}
