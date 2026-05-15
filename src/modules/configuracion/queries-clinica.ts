import { createClient } from '@/utils/supabase/server'

// ─── Servicios ────────────────────────────────────────────────

export type ServicioRow = {
  id: string
  nombre: string
  duracion_minutos: number
  precio_base: number
  activo: boolean | null
  categoria: string | null
  es_cirugia: boolean
  empresa_id: string | null
}

export type PrecioRow = {
  id: string
  servicio_id: string
  cobertura: string
  precio: number
  etiqueta: string | null
  activo: boolean | null
}

export async function getServicios(empresaId: string): Promise<ServicioRow[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('mpaci_servicios')
    .select('id, nombre, duracion_minutos, precio_base, activo, categoria, es_cirugia, empresa_id')
    .eq('empresa_id', empresaId)
    .order('nombre', { ascending: true })

  if (error) throw new Error(error.message)
  return data ?? []
}

export async function getPreciosByServicio(servicioId: string): Promise<PrecioRow[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('mpaci_servicios_precios')
    .select('id, servicio_id, cobertura, precio, etiqueta, activo')
    .eq('servicio_id', servicioId)
    .order('cobertura', { ascending: true })

  if (error) throw new Error(error.message)
  return data ?? []
}

export async function getPreciosAllServicios(empresaId: string): Promise<PrecioRow[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('mpaci_servicios_precios')
    .select('id, servicio_id, cobertura, precio, etiqueta, activo')
    .eq('empresa_id', empresaId)

  if (error) throw new Error(error.message)
  return data ?? []
}

// ─── Sucursales y Salas ───────────────────────────────────────

export type SucursalRow = {
  id: string
  nombre: string
  direccion: string | null
  activo: boolean | null
  creado_en: string | null
}

export type SalaRow = {
  id: string
  sucursal_id: string
  nombre: string
  descripcion: string | null
  activo: boolean | null
}

export async function getSucursales(empresaId: string): Promise<SucursalRow[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('mpaci_sucursales')
    .select('id, nombre, direccion, activo, creado_en')
    .eq('empresa_id', empresaId)
    .order('nombre', { ascending: true })

  if (error) throw new Error(error.message)
  return data ?? []
}

export async function getSalasBySucursal(sucursalId: string): Promise<SalaRow[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('mpaci_salas')
    .select('id, sucursal_id, nombre, descripcion, activo')
    .eq('sucursal_id', sucursalId)
    .order('nombre', { ascending: true })

  if (error) throw new Error(error.message)
  return data ?? []
}

export async function getSalasAll(empresaId: string): Promise<SalaRow[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('mpaci_salas')
    .select('id, sucursal_id, nombre, descripcion, activo')
    .eq('empresa_id', empresaId)
    .order('nombre', { ascending: true })

  if (error) throw new Error(error.message)
  return data ?? []
}

// ─── Prestadores / Service Builder ───────────────────────────

export type MedicoRow = {
  id: string
  nombre_completo: string
  email: string
}

export type ServicioConfigRow = {
  id: string
  servicio_id: string
  medico_id: string
  sucursal_id: string
  duracion_minutos: number | null
  buffer_pre_min: number
  buffer_post_min: number
  sala_id: string | null
  modelo_honorarios: string | null
  monto_bloque: number | null
  monto_por_cirugia: number | null
  honorarios_por_rol: Record<string, number>
  alias: string | null
  activo: boolean | null
  servicio?: { nombre: string } | null
  sucursal?: { nombre: string } | null
  sala?: { nombre: string } | null
}

export async function getMedicos(empresaId: string): Promise<MedicoRow[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('mpaci_usuarios')
    .select('id, nombre_completo, email')
    .eq('empresa_id', empresaId)
    .eq('rol', 'medico')
    .order('nombre_completo', { ascending: true })

  if (error) throw new Error(error.message)
  return data ?? []
}

export async function getServiciosConfigByMedico(
  medicoId: string,
  empresaId: string,
): Promise<ServicioConfigRow[]> {
  const supabase = await createClient()
  // Flat select without FK joins to avoid PostgREST relationship resolution issues.
  // Joined fields (servicio name, sucursal name, sala name) are resolved below.
  const { data, error } = await supabase
    .from('mpaci_servicios_config')
    .select(`
      id, servicio_id, medico_id, sucursal_id,
      duracion_minutos, buffer_pre_min, buffer_post_min,
      sala_id, modelo_honorarios, monto_bloque, monto_por_cirugia,
      honorarios_por_rol, alias, activo
    `)
    .eq('medico_id', medicoId)
    .eq('empresa_id', empresaId)
    .order('activo', { ascending: false })

  if (error) throw new Error(error.message)

  const rows = data ?? []
  if (rows.length === 0) return []

  // Resolve names in parallel
  const servicioIds = [...new Set(rows.map(r => r.servicio_id))]
  const sucursalIds = [...new Set(rows.map(r => r.sucursal_id))]
  const salaIds = [...new Set(rows.map(r => r.sala_id).filter(Boolean))] as string[]

  const [srvRes, sucRes, salaRes] = await Promise.all([
    supabase.from('mpaci_servicios').select('id, nombre').in('id', servicioIds),
    supabase.from('mpaci_sucursales').select('id, nombre').in('id', sucursalIds),
    salaIds.length
      ? supabase.from('mpaci_salas').select('id, nombre').in('id', salaIds)
      : Promise.resolve({ data: [] }),
  ])

  const srvMap = Object.fromEntries((srvRes.data ?? []).map(r => [r.id, r]))
  const sucMap = Object.fromEntries((sucRes.data ?? []).map(r => [r.id, r]))
  const salaMap = Object.fromEntries(((salaRes as any).data ?? []).map((r: any) => [r.id, r]))

  return rows.map(r => ({
    ...r,
    honorarios_por_rol: (r.honorarios_por_rol as Record<string, number>) ?? {},
    servicio: srvMap[r.servicio_id] ?? null,
    sucursal: sucMap[r.sucursal_id] ?? null,
    sala: r.sala_id ? salaMap[r.sala_id] ?? null : null,
  }))
}
