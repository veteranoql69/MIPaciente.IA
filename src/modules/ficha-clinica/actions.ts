'use server'

import { z } from 'zod'
import { createClient } from '@/utils/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
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
        contacto_id:           parsed.contacto_id,
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

// ─── 4. Guardar procedimiento clínico ────────────────────────────────────────

const ProcedimientoClinicoSchema = z.object({
  cita_id:              z.string().min(10),
  contacto_id:          z.string().min(10),
  notas_medicas:        z.string().max(10_000).nullable().optional(),
  notas_al_paciente:    z.string().max(10_000).nullable().optional(),
  cuidados_editados:    z.array(z.string().max(300)).default([]),
})

export type ProcedimientoClinicoInput = z.infer<typeof ProcedimientoClinicoSchema>

/**
 * Persiste el formulario de Vista Procedimiento en mpaci_fichas_clinicas.
 * notas_medicas → campo privado (no va al PDF)
 * notas_al_paciente → contenido_texto (va al PDF)
 * cuidados_editados → examenes_solicitados[] (controles post-op editables)
 */
export async function guardarProcedimientoClinico(
  input: ProcedimientoClinicoInput,
  empresaSlug: string
) {
  try {
    const parsed = ProcedimientoClinicoSchema.parse(input)
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'No autenticado' }

    const { data: usuario } = await supabase
      .from('mpaci_usuarios')
      .select('empresa_id, rol')
      .eq('id', user.id)
      .single()

    if (!usuario?.empresa_id) return { error: 'Sin empresa asociada' }
    if (!['admin', 'medico', 'admin_general'].includes(usuario.rol)) {
      return { error: 'Sin permisos para registrar procedimientos' }
    }

    const { data: cita } = await supabase
      .from('mpaci_citas')
      .select('id, empresa_id')
      .eq('id', parsed.cita_id)
      .eq('empresa_id', usuario.empresa_id)
      .single()

    if (!cita) return { error: 'Cita no encontrada o sin acceso' }

    const { data: fichaExistente } = await supabase
      .from('mpaci_fichas_clinicas')
      .select('id, ultima_edicion_en')
      .eq('cita_id', parsed.cita_id)
      .single()

    if (fichaExistente) {
      const diffHoras = (Date.now() - new Date(fichaExistente.ultima_edicion_en ?? new Date()).getTime()) / 3_600_000
      if (diffHoras > 24 && usuario.rol !== 'admin') {
        return { error: 'La ficha está bloqueada (más de 24h).', bloqueada: true }
      }

      const { data: updated, error: errUpdate } = await supabase
        .from('mpaci_fichas_clinicas')
        .update({
          notas_medicas:        parsed.notas_medicas ?? null,
          contenido_texto:      parsed.notas_al_paciente ?? null,
          examenes_solicitados: parsed.cuidados_editados,
          medico_consulta_id:   user.id,
          ultima_edicion_en:    new Date().toISOString(),
        })
        .eq('id', fichaExistente.id)
        .select('id')
        .single()

      if (errUpdate || !updated) return { error: 'Error al actualizar la ficha' }

      await _registrarTimeline(supabase, {
        empresa_id:  usuario.empresa_id,
        contacto_id: parsed.contacto_id,
        cita_id:     parsed.cita_id,
        user_id:     user.id,
        descripcion: 'Protocolo quirúrgico actualizado',
      })

      revalidatePath(`/${empresaSlug}/agenda/hoy`)
      return { success: true, fichaId: fichaExistente.id }
    }

    const { data: nuevaFicha, error: errInsert } = await supabase
      .from('mpaci_fichas_clinicas')
      .insert({
        empresa_id:           usuario.empresa_id,
        cita_id:              parsed.cita_id,
        contacto_id:          parsed.contacto_id,
        medico_id:            user.id,
        medico_consulta_id:   user.id,
        notas_medicas:        parsed.notas_medicas ?? null,
        contenido_texto:      parsed.notas_al_paciente ?? null,
        examenes_solicitados: parsed.cuidados_editados,
        ultima_edicion_en:    new Date().toISOString(),
      })
      .select('id')
      .single()

    if (errInsert || !nuevaFicha) return { error: errInsert?.message ?? 'Error al crear la ficha' }

    await _registrarTimeline(supabase, {
      empresa_id:  usuario.empresa_id,
      contacto_id: parsed.contacto_id,
      cita_id:     parsed.cita_id,
      user_id:     user.id,
      descripcion: 'Protocolo quirúrgico registrado',
    })

    revalidatePath(`/${empresaSlug}/agenda/hoy`)
    return { success: true, fichaId: nuevaFicha.id }

  } catch (err) {
    if (err instanceof z.ZodError) return { error: err.issues.map(e => e.message).join(', ') }
    console.error('[guardarProcedimientoClinico]', err)
    return { error: 'Error inesperado' }
  }
}

// ─── 5. Generar Protocolo PDF (Stirling PDF) ─────────────────────────────────

/**
 * Genera el PDF del protocolo quirúrgico:
 * 1. Lee ficha + cita + servicio (con template) de la BD
 * 2. Construye HTML
 * 3. POST a STIRLING_PDF_URL/api/v1/convert/html/pdf
 * 4. Sube el PDF a Supabase Storage (bucket: documentos)
 * 5. Registra en mpaci_documentos (tipo: protocolo_quirurgico)
 * 6. Devuelve la URL pública
 */
export async function generarProtocoloPDF(fichaId: string, empresaSlug: string) {
  const stirlingUrl = process.env.STIRLING_PDF_URL
  if (!stirlingUrl) return { error: 'STIRLING_PDF_URL no configurado en .env' }
  const stirlingApiKey = process.env.STIRLING_PDF_API_KEY

  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  const { data: usuario } = await supabase
    .from('mpaci_usuarios')
    .select('empresa_id, nombre_completo')
    .eq('id', user.id)
    .single()

  if (!usuario?.empresa_id) return { error: 'Sin empresa asociada' }

  // Leer ficha
  const { data: ficha } = await supabase
    .from('mpaci_fichas_clinicas')
    .select('id, cita_id, contenido_texto, notas_medicas, examenes_solicitados')
    .eq('id', fichaId)
    .single()

  if (!ficha) return { error: 'Ficha no encontrada' }

  // Leer cita + contacto + servicio con template
  const { data: cita } = await supabase
    .from('mpaci_citas')
    .select(`
      id, fecha_inicio,
      contacto:contacto_id(id, nombre, rut),
      medico:medico_id(id, nombre_completo),
      servicio:servicio_id(
        id, nombre,
        descripcion_procedimiento, cuidados_post_op, plantilla_consentimiento
      )
    `)
    .eq('id', ficha.cita_id)
    .eq('empresa_id', usuario.empresa_id)
    .single()

  if (!cita) return { error: 'Cita no encontrada' }

  const contacto = cita.contacto as unknown as { id: string; nombre: string; rut: string | null } | null
  const medico   = cita.medico   as unknown as { id: string; nombre_completo: string } | null

  if (!contacto?.id) return { error: 'La cita no tiene paciente asociado' }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const servicio = cita.servicio as any

  const fechaFormateada = new Date(cita.fecha_inicio).toLocaleDateString('es-CL', {
    day: '2-digit', month: 'long', year: 'numeric',
  })

  // ── Fetch empresa identidad + plantilla en paralelo ───────────────────────
  const servicioId = servicio?.id as string | undefined

  const [empresaRes, plantillaEspecificaRes] = await Promise.all([
    (supabase as any)
      .from('mpaci_empresas')
      .select('nombre, logo_url, email_clinica, telefono_clinica, direccion_clinica')
      .eq('id', usuario.empresa_id)
      .single(),
    servicioId
      ? (supabase as any)
          .from('mpaci_plantillas_documentos')
          .select('*')
          .eq('empresa_id', usuario.empresa_id)
          .eq('tipo', 'protocolo')
          .eq('activo', true)
          .eq('servicio_id', servicioId)
          .limit(1)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ])

  // Si no hay plantilla específica para el servicio, buscar genérica de tipo protocolo
  let plantilla = plantillaEspecificaRes.data
  if (!plantilla) {
    const { data: generica } = await (supabase as any)
      .from('mpaci_plantillas_documentos')
      .select('*')
      .eq('empresa_id', usuario.empresa_id)
      .eq('tipo', 'protocolo')
      .eq('activo', true)
      .is('servicio_id', null)
      .order('creado_en', { ascending: true })
      .limit(1)
      .maybeSingle()
    plantilla = generica
  }

  const empresa = empresaRes.data as {
    nombre: string
    logo_url: string | null
    email_clinica: string | null
    telefono_clinica: string | null
    direccion_clinica: string | null
  } | null

  // ── Mapa de variables para resolución de plantillas ───────────────────────
  const varMap: Record<string, string> = {
    '{{clinica_nombre}}':     empresa?.nombre ?? '—',
    '{{clinica_telefono}}':   empresa?.telefono_clinica ?? '',
    '{{clinica_direccion}}':  empresa?.direccion_clinica ?? '',
    '{{medico_nombre}}':      medico?.nombre_completo ?? '—',
    '{{paciente_nombre}}':    contacto.nombre,
    '{{paciente_rut}}':       contacto.rut ?? '—',
    '{{paciente_edad}}':      '—',
    '{{fecha_hoy}}':          fechaFormateada,
    '{{servicio_nombre}}':    servicio?.nombre ?? '—',
    '{{cita_fecha}}':         fechaFormateada,
    '{{diagnostico}}':        ficha.contenido_texto ?? '',
    '{{hallazgos}}':          '',
    '{{tecnica_quirurgica}}': '',
    '{{anestesia}}':          '',
    '{{complicaciones}}':     '',
    // Compat con variable legacy de plantilla_consentimiento
    '{{nombre_paciente}}':    contacto.nombre,
    '{{rut_paciente}}':       contacto.rut ?? '—',
    '{{nombre_medico}}':      medico?.nombre_completo ?? '—',
    '{{rut_medico}}':         '—',
    '{{fecha}}':              fechaFormateada,
  }

  const resolveVars = (text: string) =>
    Object.entries(varMap).reduce((s, [k, v]) => s.split(k).join(v), text)

  // ── Construcción del HTML ─────────────────────────────────────────────────
  let html: string

  if (plantilla) {
    // HTML dinámico a partir de la plantilla configurada en Configuración → Plantillas
    const header = (plantilla.contenido?.header ?? {}) as Record<string, boolean>
    const secciones = (plantilla.contenido?.secciones ?? []) as { titulo: string; cuerpo: string }[]

    const logoHtml = (header.mostrar_logo && empresa?.logo_url)
      ? `<img src="${empresa.logo_url}" alt="Logo" style="max-height:60px;max-width:200px;object-fit:contain;display:block;">`
      : ''

    const clinicaNombreHtml = header.mostrar_nombre_clinica
      ? `<p style="font-size:14px;font-weight:bold;color:#1e3a5f;margin:6px 0 2px">${empresa?.nombre ?? ''}</p>`
      : ''

    const seccionesHtml = secciones
      .map(sec => `
        ${sec.titulo ? `<h2>${sec.titulo}</h2>` : ''}
        <div class="box">${resolveVars(sec.cuerpo).replace(/\n/g, '<br>')}</div>
      `)
      .join('')

    const footerLinea = [empresa?.telefono_clinica, empresa?.direccion_clinica]
      .filter(Boolean).join(' · ')

    html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<style>
  body { font-family: Arial, sans-serif; font-size: 12px; color: #1a1a1a; margin: 40px; }
  h1 { font-size: 16px; color: #1e3a5f; border-bottom: 2px solid #1e3a5f; padding-bottom: 6px; margin: 4px 0 8px; }
  h2 { font-size: 13px; color: #1e3a5f; margin-top: 20px; }
  .doc-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; padding-bottom: 16px; border-bottom: 1px solid #e2e8f0; }
  .header-logo { display: flex; align-items: center; gap: 16px; }
  .badge { background: #f0f4ff; border: 1px solid #c7d2fe; padding: 4px 10px; border-radius: 4px; font-size: 11px; }
  .box { border: 1px solid #e2e8f0; border-radius: 6px; padding: 12px; margin: 10px 0; white-space: pre-wrap; line-height: 1.6; }
  .firma { display: flex; justify-content: space-around; margin-top: 56px; }
  .firma-item { text-align: center; }
  .firma-linea { border-top: 1px solid #64748b; width: 200px; margin: 0 auto; padding-top: 6px; font-size: 11px; color: #64748b; }
  .footer { margin-top: 32px; font-size: 10px; color: #94a3b8; text-align: center; border-top: 1px solid #f1f5f9; padding-top: 12px; }
</style>
</head>
<body>
  <div class="doc-header">
    <div class="header-logo">
      ${logoHtml}
      <div>
        ${clinicaNombreHtml}
        <h1>${plantilla.nombre}</h1>
        <p style="margin:2px 0"><strong>Procedimiento:</strong> ${servicio?.nombre ?? '—'}</p>
      </div>
    </div>
    <div style="text-align:right;min-width:160px">
      ${header.mostrar_fecha !== false ? `<div class="badge">Fecha: ${fechaFormateada}</div>` : ''}
      ${header.mostrar_medico !== false ? `<p style="margin-top:6px"><strong>Médico:</strong> ${medico?.nombre_completo ?? '—'}</p>` : ''}
    </div>
  </div>

  <h2>Datos del Paciente</h2>
  <div class="box">
    <strong>${contacto.nombre}</strong><br>
    RUT: ${contacto.rut ?? '—'}
  </div>

  ${seccionesHtml}

  <div class="firma">
    <div class="firma-item">
      <div class="firma-linea">Firma del Médico<br>${medico?.nombre_completo ?? ''}</div>
    </div>
    <div class="firma-item">
      <div class="firma-linea">Firma del Paciente<br>${contacto.nombre}</div>
    </div>
  </div>

  <div class="footer">
    ${footerLinea ? `${footerLinea} · ` : ''}Documento generado el ${new Date().toLocaleString('es-CL')} — Mi-Paciente
  </div>
</body>
</html>`

  } else {
    // Fallback: HTML genérico cuando no hay ninguna plantilla configurada
    const cuidadosLista = (ficha.examenes_solicitados ?? [])
      .map((c: string) => `<li>${c}</li>`).join('')

    const consentimiento = resolveVars(
      (servicio?.plantilla_consentimiento ?? '').replace(/\n/g, '<br>')
    )

    html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<style>
  body { font-family: Arial, sans-serif; font-size: 12px; color: #1a1a1a; margin: 40px; }
  h1 { font-size: 18px; color: #1e3a5f; border-bottom: 2px solid #1e3a5f; padding-bottom: 8px; }
  h2 { font-size: 13px; color: #1e3a5f; margin-top: 20px; }
  .header { display: flex; justify-content: space-between; margin-bottom: 24px; }
  .badge { background: #f0f4ff; border: 1px solid #c7d2fe; padding: 4px 10px; border-radius: 4px; font-size: 11px; }
  .box { border: 1px solid #e2e8f0; border-radius: 6px; padding: 12px; margin: 10px 0; }
  .consent { background: #fefce8; border: 1px solid #fde68a; border-radius: 6px; padding: 14px; margin: 20px 0; font-size: 11px; white-space: pre-wrap; }
  ul { padding-left: 18px; }
  li { margin-bottom: 4px; }
  .firma { display: flex; justify-content: space-around; margin-top: 48px; }
  .firma-item { text-align: center; }
  .firma-linea { border-top: 1px solid #64748b; width: 200px; margin: 0 auto; padding-top: 6px; font-size: 11px; color: #64748b; }
  .footer { margin-top: 32px; font-size: 10px; color: #94a3b8; text-align: center; }
</style>
</head>
<body>
  <div class="header">
    <div>
      <h1>PROTOCOLO QUIRÚRGICO</h1>
      <p><strong>Procedimiento:</strong> ${servicio?.nombre ?? '—'}</p>
    </div>
    <div style="text-align:right">
      <div class="badge">Fecha: ${fechaFormateada}</div>
      <p style="margin-top:6px"><strong>Médico:</strong> ${medico?.nombre_completo ?? '—'}</p>
    </div>
  </div>

  <h2>Datos del Paciente</h2>
  <div class="box">
    <strong>${contacto.nombre}</strong><br>
    RUT: ${contacto.rut ?? '—'}
  </div>

  ${servicio?.descripcion_procedimiento ? `
  <h2>Descripción del Procedimiento</h2>
  <div class="box">${servicio.descripcion_procedimiento}</div>
  ` : ''}

  ${ficha.contenido_texto ? `
  <h2>Indicaciones al Paciente</h2>
  <div class="box">${ficha.contenido_texto.replace(/\n/g, '<br>')}</div>
  ` : ''}

  ${cuidadosLista ? `
  <h2>Cuidados Post-Operatorios</h2>
  <div class="box"><ul>${cuidadosLista}</ul></div>
  ` : ''}

  ${consentimiento ? `
  <h2>Consentimiento Informado</h2>
  <div class="consent">${consentimiento}</div>
  ` : ''}

  <div class="firma">
    <div class="firma-item">
      <div class="firma-linea">Firma del Médico<br>${medico?.nombre_completo ?? ''}</div>
    </div>
    <div class="firma-item">
      <div class="firma-linea">Firma del Paciente<br>${contacto.nombre}</div>
    </div>
  </div>

  <div class="footer">Documento generado el ${new Date().toLocaleString('es-CL')} — Mi-Paciente</div>
</body>
</html>`
  }

  // POST a Stirling PDF
  let pdfBuffer: ArrayBuffer
  try {
    const formData = new FormData()
    const htmlBlob = new Blob([html], { type: 'text/html' })
    formData.append('fileInput', htmlBlob, 'protocolo.html')

    const headers: Record<string, string> = {}
    if (stirlingApiKey) headers['X-API-Key'] = stirlingApiKey

    const resp = await fetch(`${stirlingUrl}/api/v1/convert/html/pdf`, {
      method: 'POST',
      headers,
      body: formData,
    })

    if (!resp.ok) {
      const msg = await resp.text().catch(() => resp.statusText)
      console.error('[generarProtocoloPDF] Stirling error:', msg)
      return { error: `Error generando PDF: ${resp.status}` }
    }

    pdfBuffer = await resp.arrayBuffer()
  } catch (err) {
    console.error('[generarProtocoloPDF] fetch error:', err)
    return { error: 'No se pudo conectar con el servicio de PDF' }
  }

  // Subir a Supabase Storage con Service Role para evadir RLS de Storage
  const fileName = `protocolo_${fichaId}_${Date.now()}.pdf`
  const storagePath = `documentos/${usuario.empresa_id}/${fileName}`

  const supabaseAdmin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { error: storageErr } = await supabaseAdmin.storage
    .from('documentos')
    .upload(storagePath, pdfBuffer, { contentType: 'application/pdf', upsert: true })

  if (storageErr) {
    console.error('[generarProtocoloPDF] Storage error:', storageErr.message)
    return { error: 'Error al guardar el PDF en el servidor' }
  }

  const { data: publicUrl } = supabaseAdmin.storage.from('documentos').getPublicUrl(storagePath)

  // Registrar en mpaci_documentos
  await supabase.from('mpaci_documentos').insert({
    empresa_id:    usuario.empresa_id,
    contacto_id:   contacto.id,
    cita_id:       ficha.cita_id,
    ficha_id:      fichaId,
    tipo:          'clinico',
    nombre:        `Protocolo ${servicio?.nombre ?? 'Procedimiento'} — ${fechaFormateada}`,
    storage_path:  storagePath,
    mime_type:     'application/pdf',
    tamanio_bytes: pdfBuffer.byteLength,
    origen:        'generado_sistema',
    subido_por:    user.id,
  })

  revalidatePath(`/${empresaSlug}/agenda/hoy`)
  return { 
    success: true, 
    url: publicUrl.publicUrl, 
    fileName
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
