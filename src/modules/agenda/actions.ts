'use server'

import { z } from 'zod'
import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { crearEvento } from '@/modules/agenda/gcal'
import { revalidatePath } from 'next/cache'
import { getAntecedenteUnico } from './queries'
import type { AntecedentePaciente } from './queries'

// ─── Antecedente único (live refresh desde cliente tras guardar consulta) ─────

export async function getAntecedenteAction(
  contactoId: string
): Promise<AntecedentePaciente | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: usuario } = await supabase
    .from('mpaci_usuarios')
    .select('empresa_id')
    .eq('id', user.id)
    .single()

  if (!usuario?.empresa_id) return null

  return getAntecedenteUnico(usuario.empresa_id, contactoId)
}

// ─── Schemas Zod ────────────────────────────────────────────────

const NuevaCitaSchema = z.object({
  contacto_id: z.string().uuid('Paciente requerido'),
  medico_id: z.string().uuid('Médico requerido'),
  servicio_id: z.string().uuid('Servicio requerido'),
  sucursal_id: z.string().uuid('Sucursal requerida'),
  sala_id: z.string().uuid().nullable().optional(),
  fecha_inicio: z.string().min(1, 'Fecha y hora requeridas'),
  cobertura_usada: z.string().nullable().optional(),
  notas: z.string().max(500).nullable().optional(),
})

export type NuevaCitaInput = z.infer<typeof NuevaCitaSchema>

// ─── Búsqueda de pacientes (autocomplete) ───────────────────────

export async function buscarPacientes(query: string) {
  if (!query || query.length < 2) return []

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('mpaci_contactos')
    .select('id, nombre, rut, telefono, email')
    .ilike('nombre', `%${query}%`)
    .limit(8)

  if (error) {
    console.error('[buscarPacientes]', error.message)
    return []
  }

  return data ?? []
}

// ─── Crear cita ─────────────────────────────────────────────────

export async function crearCita(input: NuevaCitaInput, empresaSlug: string) {
  try {
    const parsed = NuevaCitaSchema.parse(input)
    const supabase = await createClient()

    // 1. Verificar usuario autenticado
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'No autenticado' }

    // 2. Obtener empresa_id del usuario
    const { data: usuario } = await supabase
      .from('mpaci_usuarios')
      .select('empresa_id')
      .eq('id', user.id)
      .single()

    if (!usuario?.empresa_id) return { error: 'Sin empresa asociada' }

    // 3. Obtener duración y precio del servicio
    const { data: servicio } = await supabase
      .from('mpaci_servicios')
      .select('duracion_minutos, precio_base, nombre')
      .eq('id', parsed.servicio_id)
      .single()

    if (!servicio) return { error: 'Servicio no encontrado' }

    // 4. Calcular fecha_fin
    const inicio = new Date(parsed.fecha_inicio)
    const fin = new Date(inicio.getTime() + servicio.duracion_minutos * 60_000)

    // 5. Si hay cobertura específica, buscar precio contrato
    let precioFinal = servicio.precio_base
    if (parsed.cobertura_usada) {
      const { data: precioCobertura } = await supabase
        .from('mpaci_servicios_precios')
        .select('precio')
        .eq('servicio_id', parsed.servicio_id)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .eq('cobertura', parsed.cobertura_usada as any)
        .eq('activo', true)
        .single()

      if (precioCobertura) precioFinal = precioCobertura.precio
    }

    // 6. Insertar cita
    const { data: cita, error: errorCita } = await supabase
      .from('mpaci_citas')
      .insert({
        contacto_id: parsed.contacto_id,
        servicio_id: parsed.servicio_id,
        medico_id: parsed.medico_id,
        sucursal_id: parsed.sucursal_id,
        sala_id: parsed.sala_id ?? null,
        fecha_inicio: inicio.toISOString(),
        fecha_fin: fin.toISOString(),
        precio_base: precioFinal,
        cobertura_usada: parsed.cobertura_usada ?? null,
        empresa_id: usuario.empresa_id,
        estado_operativo: 'Agendada',
        estado_pago: 'No pagado',
        estado_confirmacion: 'no_confirmada',
      })
      .select('id')
      .single()

    if (errorCita) {
      console.error('[crearCita] Insert error:', errorCita.message)
      return { error: errorCita.message }
    }

    // 7. Registrar paciente principal en mpaci_cita_pacientes
    await supabase.from('mpaci_cita_pacientes').insert({
      empresa_id: usuario.empresa_id,
      cita_id: cita.id,
      contacto_id: parsed.contacto_id,
      es_principal: true,
    })

    // 8. Obtener nombre del paciente para GCal
    const { data: contacto } = await supabase
      .from('mpaci_contactos')
      .select('nombre')
      .eq('id', parsed.contacto_id)
      .single()

    // 9. Sync con Google Calendar (best-effort, no bloquea)
    try {
      const gcalEvento = await crearEvento(parsed.medico_id, {
        summary: `Cita: ${contacto?.nombre ?? 'Paciente'}`,
        description: `Servicio: ${servicio.nombre}${parsed.notas ? `\nNotas: ${parsed.notas}` : ''}`,
        start: { dateTime: inicio.toISOString(), timeZone: 'America/Santiago' },
        end: { dateTime: fin.toISOString(), timeZone: 'America/Santiago' },
      })

      // Guardar gcal_event_id para futura sincronización
      if (gcalEvento?.id) {
        const admin = createAdminClient()
        await admin
          .from('mpaci_citas')
          .update({ gcal_event_id: gcalEvento.id })
          .eq('id', cita.id)
      }
    } catch (gcalErr) {
      console.warn('[crearCita] GCal sync failed (non-blocking):', gcalErr)
    }

    // 10. Registrar en timeline
    await supabase.from('mpaci_timeline_eventos').insert({
      empresa_id: usuario.empresa_id,
      contacto_id: parsed.contacto_id,
      origen: 'agenda',
      referencia_id: cita.id,
      referencia_tabla: 'mpaci_citas',
      descripcion: `Cita agendada: ${servicio.nombre}`,
      usuario_id: user.id,
      es_automatico: false,
    })

    revalidatePath(`/${empresaSlug}/agenda/hoy`)
    return { success: true, citaId: cita.id }

  } catch (err) {
    if (err instanceof z.ZodError) {
      return { error: err.issues.map((e: { message: string }) => e.message).join(', ') }
    }
    console.error('[crearCita] Unexpected error:', err)
    return { error: 'Error inesperado al crear la cita' }
  }
}
