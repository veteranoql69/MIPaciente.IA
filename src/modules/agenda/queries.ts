import { createClient } from '@/utils/supabase/server'
import type { AppRole } from '@/lib/database.types'

export type ServicioCita = {
  id: string
  nombre: string
  duracion_minutos: number
  categoria: string | null
  es_cirugia: boolean
  descripcion_procedimiento: string | null
  cuidados_post_op: string[] | null
  instrucciones_pre_op: string[] | null
  plantilla_consentimiento: string | null
}

export type CitaHoy = {
  id: string
  fecha_inicio: string
  fecha_fin: string
  estado_operativo: string
  estado_confirmacion: string
  estado_pago: string
  precio_base: number
  medico: { id: string; nombre_completo: string } | null
  contacto: { id: string; nombre: string } | null
  servicio: ServicioCita | null
  sala: { id: string; nombre: string } | null
}

export type AntecedentePaciente = {
  contacto_id: string
  nombre: string
  fecha_nacimiento: string | null
  genero: string | null
  prevision: string | null
  telefono: string | null
  email: string | null
  alergias: {
    id: string
    sustancia: string
    severidad: 'leve' | 'moderada' | 'severa' | null
    reaccion: string | null
  }[]
  diagnosticos: {
    id: string
    codigo_cie10: string
    descripcion: string
    estado: string
    lateralidad: string | null
  }[]
  medicamentos: {
    id: string
    nombre: string
    nota: string | null
  }[]
  cirugias: {
    id: string
    nombre: string
    fecha: string | null
  }[]
  citas_previas: {
    id: string
    fecha_inicio: string
    estado_operativo: string
    servicio_nombre: string | null
  }[]
  fichas_recientes: {
    id: string
    cita_id: string
    fecha: string
    motivos_consulta_ids: string[]
    notas_medicas: string | null
    examenes_solicitados: string[]
    notas_examenes: string | null
    examen_fisico: Record<string, unknown> | null
  }[]
}

// ─── Query genérica por rango de fechas ──────────────────────────────────────

export async function getCitasRango(
  empresaId: string,
  usuarioId: string,
  rol: AppRole,
  medicosAsignados: string[],
  inicio: string,
  fin: string
): Promise<CitaHoy[]> {
  const supabase = await createClient()

  if (rol === 'asistente' && medicosAsignados.length === 0) return []

  let query = supabase
    .from('mpaci_citas')
    .select(`
      id, fecha_inicio, fecha_fin,
      estado_operativo, estado_confirmacion, estado_pago,
      precio_base,
      medico:medico_id(id, nombre_completo),
      contacto:contacto_id(id, nombre),
      servicio:servicio_id(id, nombre, duracion_minutos, categoria, es_cirugia,
        descripcion_procedimiento, cuidados_post_op, instrucciones_pre_op, plantilla_consentimiento),
      sala:sala_id(id, nombre)
    `)
    .eq('empresa_id', empresaId)
    .gte('fecha_inicio', inicio)
    .lt('fecha_inicio', fin)
    .order('fecha_inicio', { ascending: true })

  if (rol === 'medico') {
    query = query.eq('medico_id', usuarioId)
  } else if (rol === 'asistente') {
    query = query.in('medico_id', medicosAsignados)
  }

  const { data, error } = await query
  if (error) {
    console.error('[getCitasRango]', error.message)
    return []
  }
  return (data ?? []) as unknown as CitaHoy[]
}

export async function getCitasHoy(
  empresaId: string,
  usuarioId: string,
  rol: AppRole,
  medicosAsignados: string[],
  timezone = 'America/Santiago'
): Promise<CitaHoy[]> {
  const supabase = await createClient()

  const { DateTime } = await import('luxon')
  const hoyTz = DateTime.now().setZone(timezone)
  const inicioHoy = hoyTz.startOf('day').toUTC().toISO()!
  const finHoy   = hoyTz.plus({ days: 1 }).startOf('day').toUTC().toISO()!

  if (rol === 'asistente' && medicosAsignados.length === 0) return []

  let query = supabase
    .from('mpaci_citas')
    .select(`
      id, fecha_inicio, fecha_fin,
      estado_operativo, estado_confirmacion, estado_pago,
      precio_base,
      medico:medico_id(id, nombre_completo),
      contacto:contacto_id(id, nombre),
      servicio:servicio_id(id, nombre, duracion_minutos, categoria, es_cirugia,
        descripcion_procedimiento, cuidados_post_op, instrucciones_pre_op, plantilla_consentimiento),
      sala:sala_id(id, nombre)
    `)
    .eq('empresa_id', empresaId)
    .gte('fecha_inicio', inicioHoy)
    .lt('fecha_inicio', finHoy)
    .order('fecha_inicio', { ascending: true })

  if (rol === 'medico') {
    query = query.eq('medico_id', usuarioId)
  } else if (rol === 'asistente') {
    query = query.in('medico_id', medicosAsignados)
  }

  const { data, error } = await query
  if (error) {
    console.error('[getCitasHoy]', error.message)
    return []
  }
  return (data ?? []) as unknown as CitaHoy[]
}

export async function getAntecedentesMap(
  empresaId: string,
  contactoIds: string[]
): Promise<Record<string, AntecedentePaciente>> {
  if (contactoIds.length === 0) return {}

  const supabase = await createClient()

  const [
    { data: contactos },
    { data: alergias },
    { data: diagnosticos },
    { data: medicamentos },
    { data: cirugias },
    { data: citasPrevias },
    { data: fichas },
  ] = await Promise.all([
    supabase
      .from('mpaci_contactos')
      .select('id, nombre, fecha_nacimiento, genero, prevision, telefono, email')
      .eq('empresa_id', empresaId)
      .in('id', contactoIds),
    supabase
      .from('mpaci_alergias')
      .select('id, contacto_id, sustancia, severidad, reaccion')
      .eq('empresa_id', empresaId)
      .in('contacto_id', contactoIds),
    supabase
      .from('mpaci_diagnosticos')
      .select('id, contacto_id, codigo_cie10, descripcion, estado, lateralidad')
      .eq('empresa_id', empresaId)
      .in('contacto_id', contactoIds)
      .eq('estado', 'activo'),
    supabase
      .from('mpaci_medicamentos_paciente')
      .select('id, contacto_id, nombre, nota')
      .eq('empresa_id', empresaId)
      .in('contacto_id', contactoIds)
      .eq('estado', 'activo'),
    supabase
      .from('mpaci_cirugias_externas')
      .select('id, contacto_id, nombre, fecha')
      .eq('empresa_id', empresaId)
      .in('contacto_id', contactoIds),
    supabase
      .from('mpaci_citas')
      .select('id, contacto_id, fecha_inicio, estado_operativo, servicio:servicio_id(nombre)')
      .eq('empresa_id', empresaId)
      .in('contacto_id', contactoIds)
      .eq('estado_operativo', 'Realizada')
      .order('fecha_inicio', { ascending: false })
      .limit(60),
    supabase
      .from('mpaci_fichas_clinicas')
      .select('id, cita_id, contacto_id, ultima_edicion_en, motivos_consulta_ids, notas_medicas, examenes_solicitados, notas_examenes, examen_fisico')
      .eq('empresa_id', empresaId)
      .in('contacto_id', contactoIds)
      .order('ultima_edicion_en', { ascending: false })
      .limit(20),
  ])

  const result: Record<string, AntecedentePaciente> = {}

  for (const c of contactos ?? []) {
    result[c.id] = {
      contacto_id: c.id,
      nombre: c.nombre,
      fecha_nacimiento: c.fecha_nacimiento,
      genero: c.genero,
      prevision: c.prevision,
      telefono: c.telefono,
      email: c.email,
      alergias: [],
      diagnosticos: [],
      medicamentos: [],
      cirugias: [],
      citas_previas: [],
      fichas_recientes: [],
    }
  }

  for (const a of alergias ?? []) {
    result[a.contacto_id]?.alergias.push({
      id: a.id,
      sustancia: a.sustancia,
      severidad: a.severidad,
      reaccion: a.reaccion,
    })
  }

  for (const d of diagnosticos ?? []) {
    result[d.contacto_id]?.diagnosticos.push({
      id: d.id,
      codigo_cie10: d.codigo_cie10,
      descripcion: d.descripcion,
      estado: d.estado,
      lateralidad: d.lateralidad,
    })
  }

  for (const m of medicamentos ?? []) {
    result[m.contacto_id]?.medicamentos.push({
      id: m.id,
      nombre: m.nombre,
      nota: m.nota,
    })
  }

  for (const c of cirugias ?? []) {
    result[c.contacto_id]?.cirugias.push({
      id: c.id,
      nombre: c.nombre,
      fecha: c.fecha,
    })
  }

  for (const cp of citasPrevias ?? []) {
    const servicio = (cp.servicio as unknown) as { nombre: string } | null
    if (!cp.contacto_id || !result[cp.contacto_id]) continue
    result[cp.contacto_id].citas_previas.push({
      id: cp.id,
      fecha_inicio: cp.fecha_inicio,
      estado_operativo: cp.estado_operativo,
      servicio_nombre: servicio?.nombre ?? null,
    })
  }

  for (const f of fichas ?? []) {
    if (!f.contacto_id || !result[f.contacto_id]) continue
    result[f.contacto_id].fichas_recientes.push({
      id: f.id,
      cita_id: f.cita_id,
      fecha: f.ultima_edicion_en ?? '',
      motivos_consulta_ids: (f.motivos_consulta_ids as string[]) ?? [],
      notas_medicas: f.notas_medicas ?? null,
      examenes_solicitados: (f.examenes_solicitados as string[]) ?? [],
      notas_examenes: f.notas_examenes ?? null,
      examen_fisico: (f.examen_fisico as Record<string, unknown>) ?? null,
    })
  }

  return result
}

// ─── Antecedente único (para actualización live en cliente) ──────────────────

export async function getAntecedenteUnico(
  empresaId: string,
  contactoId: string
): Promise<AntecedentePaciente | null> {
  const map = await getAntecedentesMap(empresaId, [contactoId])
  return map[contactoId] ?? null
}
