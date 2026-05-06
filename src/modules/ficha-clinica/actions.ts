'use server'

import { z } from 'zod'
import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

// ─── Schemas Zod ─────────────────────────────────────────────────────────────

/**
 * Schema de ExamenFisico — espeja la estructura JSONB de la BD.
 * imc se calcula en el servidor (nunca confiamos en el cliente).
 */
const ExamenFisicoSchema = z.object({
  peso_kg:          z.coerce.number().positive().max(600).nullable().optional(),
  talla_cm:         z.coerce.number().positive().max(300).nullable().optional(),
  presion_arterial: z.string().max(20).nullable().optional(),
  hallazgos:        z.string().max(4000).nullable().optional(),
})

/**
 * Schema principal de la consulta rápida desde el panel de doble-clic.
 * Una consulta = una fila en mpaci_fichas_clinicas (upsert por cita_id).
 */
const ConsultaRapidaSchema = z.object({
  cita_id:               z.string().min(10, 'ID de cita inválido'),
  contacto_id:           z.string().min(10, 'ID de paciente inválido'),
  motivos_consulta_ids:  z.array(z.string()).default([]),
  notas_medicas:         z.string().max(10_000).nullable().optional(),
  examenes_solicitados:  z.array(z.string().max(100)).default([]),
  notas_examenes:        z.string().max(4000).nullable().optional(),
  examen_fisico:         ExamenFisicoSchema.optional(),
})

export type ConsultaRapidaInput = z.infer<typeof ConsultaRapidaSchema>

const NuevoMotivoSchema = z.object({
  nombre: z.string().min(2).max(100).trim(),
})

// ─── Helper interno ───────────────────────────────────────────────────────────

function calcularIMC(pesoKg?: number | null, tallaCm?: number | null): number | null {
  if (!pesoKg || !tallaCm || tallaCm === 0) return null
  return Math.round((pesoKg / Math.pow(tallaCm / 100, 2)) * 10) / 10
}

// ─── 1. Obtener motivos de consulta (catálogo) ────────────────────────────────

/**
 * Devuelve motivos globales (empresa_id IS NULL) + los propios de la empresa.
 * Ordenados por `orden` ASC.
 */
export async function getMotivosConsulta() {
  const supabase = await createClient()

  const { data: usuario } = await supabase
    .from('mpaci_usuarios')
    .select('empresa_id')
    .eq('id', (await supabase.auth.getUser()).data.user?.id ?? '')
    .single()

  if (!usuario?.empresa_id) return []

  const { data, error } = await supabase
    .from('mpaci_motivos_consulta')
    .select('id, nombre, orden')
    .or(`empresa_id.is.null,empresa_id.eq.${usuario.empresa_id}`)
    .eq('activo', true)
    .order('orden', { ascending: true })

  if (error) {
    console.error('[getMotivosConsulta]', error.message)
    return []
  }

  return data ?? []
}

// ─── 2. Agregar nuevo motivo personalizado ────────────────────────────────────

/**
 * Crea un nuevo motivo de consulta asociado a la empresa del usuario.
 * Lo devuelve para que el front lo agregue inmediatamente a la lista.
 */
export async function agregarMotivoConsulta(nombre: string) {
  try {
    const parsed = NuevoMotivoSchema.parse({ nombre })
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'No autenticado' }

    const { data: usuario } = await supabase
      .from('mpaci_usuarios')
      .select('empresa_id')
      .eq('id', user.id)
      .single()

    if (!usuario?.empresa_id) return { error: 'Sin empresa asociada' }

    // Upsert: si el nombre ya existe para esta empresa, lo devuelve igualmente
    const { data, error } = await supabase
      .from('mpaci_motivos_consulta')
      .upsert(
        {
          empresa_id: usuario.empresa_id,
          nombre: parsed.nombre,
          creado_por: user.id,
          orden: 200, // Al final de la lista
        },
        { onConflict: 'empresa_id,nombre', ignoreDuplicates: false }
      )
      .select('id, nombre, orden')
      .single()

    if (error) {
      console.error('[agregarMotivoConsulta]', error.message)
      return { error: error.message }
    }

    return { success: true, motivo: data }

  } catch (err) {
    if (err instanceof z.ZodError) {
      return { error: err.issues.map(e => e.message).join(', ') }
    }
    console.error('[agregarMotivoConsulta] Unexpected:', err)
    return { error: 'Error al guardar el motivo' }
  }
}

// ─── 3. Guardar consulta rápida (panel doble-clic) ───────────────────────────

/**
 * Persiste el contenido del panel de doble-clic en mpaci_fichas_clinicas.
 *
 * Flujo:
 *  1. Valida el input con Zod.
 *  2. Verifica sesión y empresa_id del médico.
 *  3. Verifica que la cita pertenece a la empresa (seguridad).
 *  4. UPSERT en mpaci_fichas_clinicas (una ficha por cita).
 *     - Si ya existe → UPDATE (respetando ventana 24h).
 *     - Si no existe → INSERT + crea la ficha.
 *  5. Registra evento en mpaci_timeline_eventos.
 *  6. Revalida la ruta de la agenda.
 */
export async function guardarConsultaRapida(
  input: ConsultaRapidaInput,
  empresaSlug: string
) {
  try {
    // ── 1. Validar input ──────────────────────────────────────────
    const parsed = ConsultaRapidaSchema.parse(input)

    const supabase = await createClient()

    // ── 2. Verificar sesión ───────────────────────────────────────
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'No autenticado' }

    const { data: usuario } = await supabase
      .from('mpaci_usuarios')
      .select('empresa_id, rol')
      .eq('id', user.id)
      .single()

    if (!usuario?.empresa_id) return { error: 'Sin empresa asociada' }
    if (!['admin', 'medico', 'admin_general'].includes(usuario.rol)) {
      return { error: 'Sin permisos para registrar consultas' }
    }

    // ── 3. Verificar que la cita pertenece a la empresa ───────────
    const { data: cita, error: errorCita } = await supabase
      .from('mpaci_citas')
      .select('id, empresa_id, medico_id')
      .eq('id', parsed.cita_id)
      .eq('empresa_id', usuario.empresa_id)
      .single()

    if (errorCita || !cita) {
      return { error: 'Cita no encontrada o sin acceso' }
    }

    // ── 4. Calcular IMC en servidor ───────────────────────────────
    const ef = parsed.examen_fisico ?? {}
    const imcCalculado = calcularIMC(ef.peso_kg, ef.talla_cm)

    const examenFisicoFinal = {
      ...ef,
      ...(imcCalculado !== null ? { imc: imcCalculado } : {}),
    }

    // ── 5. Buscar ficha existente para esta cita ──────────────────
    const { data: fichaExistente } = await supabase
      .from('mpaci_fichas_clinicas')
      .select('id, ultima_edicion_en')
      .eq('cita_id', parsed.cita_id)
      .single()

    // ── 6a. UPDATE si la ficha existe ─────────────────────────────
    if (fichaExistente) {
      // Verificar ventana de 24h (la RLS también lo valida, esto es UX)
      const ultimaEdicionStr = (fichaExistente as { id: string; ultima_edicion_en: string | null }).ultima_edicion_en
      const edicion = new Date(ultimaEdicionStr ?? new Date().toISOString())
      const ahoraMs = Date.now()
      const diffHoras = (ahoraMs - edicion.getTime()) / 1000 / 3600

      if (diffHoras > 24 && usuario.rol !== 'admin') {
        return {
          error: 'La ficha clínica está bloqueada (más de 24h). Contacta al administrador.',
          bloqueada: true,
        }
      }

      const { data: updatedFicha, error: errorUpdate } = await supabase
        .from('mpaci_fichas_clinicas')
        .update({
          motivos_consulta_ids:  parsed.motivos_consulta_ids,
          notas_medicas:         parsed.notas_medicas ?? null,
          examenes_solicitados:  parsed.examenes_solicitados,
          notas_examenes:        parsed.notas_examenes ?? null,
          examen_fisico:         examenFisicoFinal,
          medico_consulta_id:    user.id,
          ultima_edicion_en:     new Date().toISOString(),
        })
        .eq('id', fichaExistente.id)
        .select('id')
        .single()

      if (errorUpdate || !updatedFicha) {
        console.error('[guardarConsultaRapida] UPDATE error:', errorUpdate?.message)
        return { error: 'No se pudo actualizar. Es posible que no tengas permisos sobre esta ficha (RLS).' }
      }

      await _registrarTimeline(supabase, {
        empresa_id:  usuario.empresa_id,
        contacto_id: parsed.contacto_id,
        cita_id:     parsed.cita_id,
        user_id:     user.id,
        descripcion: 'Consulta rápida actualizada desde agenda',
      })

      revalidatePath(`/${empresaSlug}/agenda/hoy`)
      return { success: true, fichaId: fichaExistente.id }
    }

    // ── 6b. INSERT si no existe ───────────────────────────────────
    const { data: nuevaFicha, error: errorInsert } = await supabase
      .from('mpaci_fichas_clinicas')
      .insert({
        empresa_id:            usuario.empresa_id,
        cita_id:               parsed.cita_id,
        motivos_consulta_ids:  parsed.motivos_consulta_ids,
        notas_medicas:         parsed.notas_medicas ?? null,
        examenes_solicitados:  parsed.examenes_solicitados,
        notas_examenes:        parsed.notas_examenes ?? null,
        examen_fisico:         examenFisicoFinal,
        medico_id:             user.id,
        medico_consulta_id:    user.id,
        ultima_edicion_en:     new Date().toISOString(),
      })
      .select('id')
      .single()

    if (errorInsert || !nuevaFicha) {
      console.error('[guardarConsultaRapida] INSERT error:', errorInsert?.message)
      return { error: errorInsert?.message ?? 'Error al crear la ficha' }
    }

    await _registrarTimeline(supabase, {
      empresa_id:  usuario.empresa_id,
      contacto_id: parsed.contacto_id,
      cita_id:     parsed.cita_id,
      user_id:     user.id,
      descripcion: 'Consulta rápida registrada desde agenda',
    })

    revalidatePath(`/${empresaSlug}/agenda/hoy`)
    return { success: true, fichaId: nuevaFicha.id }

  } catch (err) {
    if (err instanceof z.ZodError) {
      return { error: err.issues.map(e => e.message).join(', ') }
    }
    console.error('[guardarConsultaRapida] Unexpected:', err)
    return { error: 'Error inesperado al guardar la consulta' }
  }
}

// ─── Helper timeline ──────────────────────────────────────────────────────────

async function _registrarTimeline(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  opts: {
    empresa_id:  string
    contacto_id: string
    cita_id:     string
    user_id:     string
    descripcion: string
  }
) {
  try {
    await supabase.from('mpaci_timeline_eventos').insert({
      empresa_id:       opts.empresa_id,
      contacto_id:      opts.contacto_id,
      origen:           'ficha_clinica',
      referencia_id:    opts.cita_id,
      referencia_tabla: 'mpaci_citas',
      descripcion:      opts.descripcion,
      usuario_id:       opts.user_id,
      es_automatico:    false,
    })
  } catch {
    // Non-blocking: el timeline no debe interrumpir el guardado clínico
  }
}
