'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'

async function assertAdminGeneral() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No autenticado')

  const { data: perfil } = await supabase
    .from('mpaci_usuarios')
    .select('rol, empresa_id')
    .eq('id', user.id)
    .single()

  if (!perfil || perfil.rol !== 'admin_general') throw new Error('Sin permisos')
  if (!perfil.empresa_id) throw new Error('Sin empresa asignada')
  return { user, empresaId: perfil.empresa_id as string }
}

// ═══════════════════════════════════════════════════════════
// SERVICIOS
// ═══════════════════════════════════════════════════════════

const ServicioSchema = z.object({
  empresaSlug: z.string().min(1),
  id: z.string().uuid().optional(),
  nombre: z.string().min(1).max(120),
  duracion_minutos: z.coerce.number().int().min(5).max(480),
  precio_base: z.coerce.number().min(0),
  categoria: z.enum(['consulta', 'evaluacion', 'procedimiento', 'cirugia', 'control', 'examen', 'otro']),
  es_cirugia: z.coerce.boolean().default(false),
  activo: z.coerce.boolean().default(true),
})

export async function upsertServicio(_: unknown, formData: FormData) {
  try {
    const parsed = ServicioSchema.safeParse(Object.fromEntries(formData))
    if (!parsed.success) return { error: 'Datos inválidos: ' + parsed.error.issues[0]?.message }

    const { empresaId } = await assertAdminGeneral()
    const { empresaSlug, id, ...fields } = parsed.data
    const admin = createAdminClient()

    if (id) {
      const { error } = await admin
        .from('mpaci_servicios')
        .update({ ...fields, empresa_id: empresaId })
        .eq('id', id)
        .eq('empresa_id', empresaId)
      if (error) return { error: error.message }
    } else {
      const { error } = await admin
        .from('mpaci_servicios')
        .insert({ ...fields, empresa_id: empresaId })
      if (error) return { error: error.message }
    }

    revalidatePath(`/${empresaSlug}/configuracion/clinica/servicios`)
    return { ok: true }
  } catch (e: any) {
    return { error: e.message }
  }
}

export async function toggleServicioActivo(_: unknown, formData: FormData) {
  try {
    const id = z.string().uuid().parse(formData.get('id'))
    const activo = formData.get('activo') === 'true'
    const empresaSlug = z.string().min(1).parse(formData.get('empresaSlug'))

    const { empresaId } = await assertAdminGeneral()
    const admin = createAdminClient()

    await admin
      .from('mpaci_servicios')
      .update({ activo })
      .eq('id', id)
      .eq('empresa_id', empresaId)

    revalidatePath(`/${empresaSlug}/configuracion/clinica/servicios`)
    return { ok: true }
  } catch (e: any) {
    return { error: e.message }
  }
}

// ─── Precios por cobertura ─────────────────────────────────

const COBERTURAS = ['isapre_particular', 'pad_2026', 'ejercito', 'fonasa', 'otra'] as const

const PrecioSchema = z.object({
  empresaSlug: z.string().min(1),
  id: z.string().uuid().optional(),
  servicio_id: z.string().uuid(),
  cobertura: z.enum(COBERTURAS),
  precio: z.coerce.number().min(0),
  etiqueta: z.string().max(60).optional(),
  activo: z.coerce.boolean().default(true),
})

export async function upsertPrecio(_: unknown, formData: FormData) {
  try {
    const parsed = PrecioSchema.safeParse(Object.fromEntries(formData))
    if (!parsed.success) return { error: 'Datos inválidos: ' + parsed.error.issues[0]?.message }

    const { empresaId } = await assertAdminGeneral()
    const { empresaSlug, id, ...fields } = parsed.data
    const admin = createAdminClient()

    const { error } = await admin
      .from('mpaci_servicios_precios')
      .upsert(
        { ...fields, empresa_id: empresaId, ...(id ? { id } : {}) },
        { onConflict: 'servicio_id,empresa_id,cobertura' },
      )

    if (error) return { error: error.message }

    revalidatePath(`/${empresaSlug}/configuracion/clinica/servicios`)
    return { ok: true }
  } catch (e: any) {
    return { error: e.message }
  }
}

// ═══════════════════════════════════════════════════════════
// SUCURSALES
// ═══════════════════════════════════════════════════════════

const SucursalSchema = z.object({
  empresaSlug: z.string().min(1),
  id: z.string().uuid().optional(),
  nombre: z.string().min(1).max(120),
  direccion: z.string().max(200).optional(),
  activo: z.coerce.boolean().default(true),
})

export async function upsertSucursal(_: unknown, formData: FormData) {
  try {
    const parsed = SucursalSchema.safeParse(Object.fromEntries(formData))
    if (!parsed.success) return { error: 'Datos inválidos: ' + parsed.error.issues[0]?.message }

    const { empresaId } = await assertAdminGeneral()
    const { empresaSlug, id, ...fields } = parsed.data
    const admin = createAdminClient()

    if (id) {
      const { error } = await admin
        .from('mpaci_sucursales')
        .update({ ...fields })
        .eq('id', id)
        .eq('empresa_id', empresaId)
      if (error) return { error: error.message }
    } else {
      const { error } = await admin
        .from('mpaci_sucursales')
        .insert({ ...fields, empresa_id: empresaId })
      if (error) return { error: error.message }
    }

    revalidatePath(`/${empresaSlug}/configuracion/clinica/sedes`)
    return { ok: true }
  } catch (e: any) {
    return { error: e.message }
  }
}

export async function toggleSucursalActiva(_: unknown, formData: FormData) {
  try {
    const id = z.string().uuid().parse(formData.get('id'))
    const activo = formData.get('activo') === 'true'
    const empresaSlug = z.string().min(1).parse(formData.get('empresaSlug'))

    const { empresaId } = await assertAdminGeneral()
    const admin = createAdminClient()

    await admin
      .from('mpaci_sucursales')
      .update({ activo })
      .eq('id', id)
      .eq('empresa_id', empresaId)

    revalidatePath(`/${empresaSlug}/configuracion/clinica/sedes`)
    return { ok: true }
  } catch (e: any) {
    return { error: e.message }
  }
}

// ─── Salas ─────────────────────────────────────────────────

const SalaSchema = z.object({
  empresaSlug: z.string().min(1),
  id: z.string().uuid().optional(),
  sucursal_id: z.string().uuid(),
  nombre: z.string().min(1).max(80),
  descripcion: z.string().max(200).optional(),
  activo: z.coerce.boolean().default(true),
})

export async function upsertSala(_: unknown, formData: FormData) {
  try {
    const parsed = SalaSchema.safeParse(Object.fromEntries(formData))
    if (!parsed.success) return { error: 'Datos inválidos: ' + parsed.error.issues[0]?.message }

    const { empresaId } = await assertAdminGeneral()
    const { empresaSlug, id, ...fields } = parsed.data
    const admin = createAdminClient()

    if (id) {
      const { error } = await admin
        .from('mpaci_salas')
        .update({ ...fields })
        .eq('id', id)
        .eq('empresa_id', empresaId)
      if (error) return { error: error.message }
    } else {
      const { error } = await admin
        .from('mpaci_salas')
        .insert({ ...fields, empresa_id: empresaId })
      if (error) return { error: error.message }
    }

    revalidatePath(`/${empresaSlug}/configuracion/clinica/sedes`)
    return { ok: true }
  } catch (e: any) {
    return { error: e.message }
  }
}

export async function toggleSalaActiva(_: unknown, formData: FormData) {
  try {
    const id = z.string().uuid().parse(formData.get('id'))
    const activo = formData.get('activo') === 'true'
    const empresaSlug = z.string().min(1).parse(formData.get('empresaSlug'))

    const { empresaId } = await assertAdminGeneral()
    const admin = createAdminClient()

    await admin
      .from('mpaci_salas')
      .update({ activo })
      .eq('id', id)
      .eq('empresa_id', empresaId)

    revalidatePath(`/${empresaSlug}/configuracion/clinica/sedes`)
    return { ok: true }
  } catch (e: any) {
    return { error: e.message }
  }
}

// ═══════════════════════════════════════════════════════════
// SERVICIOS CONFIG (Prestadores)
// ═══════════════════════════════════════════════════════════

const ServicioConfigSchema = z.object({
  empresaSlug: z.string().min(1),
  id: z.string().uuid().optional(),
  servicio_id: z.string().uuid(),
  medico_id: z.string().uuid(),
  sucursal_id: z.string().uuid(),
  duracion_minutos: z.coerce.number().int().min(5).max(480).optional(),
  buffer_pre_min: z.coerce.number().int().min(0).max(120).default(0),
  buffer_post_min: z.coerce.number().int().min(0).max(120).default(0),
  sala_id: z.string().uuid().optional(),
  modelo_honorarios: z.enum(['fijo', 'bloque_procedimiento', 'cirugia_general']).optional(),
  monto_bloque: z.coerce.number().min(0).optional(),
  monto_por_cirugia: z.coerce.number().min(0).optional(),
  alias: z.string().max(80).optional(),
  activo: z.coerce.boolean().default(true),
})

export async function upsertServicioConfig(_: unknown, formData: FormData) {
  try {
    const raw: Record<string, string> = {}
    formData.forEach((v, k) => { raw[k] = v as string })

    const parsed = ServicioConfigSchema.safeParse(raw)
    if (!parsed.success) return { error: 'Datos inválidos: ' + parsed.error.issues[0]?.message }

    const { empresaId } = await assertAdminGeneral()
    const { empresaSlug, id, ...fields } = parsed.data

    // Clean up empty optional fields
    const payload: Record<string, unknown> = { ...fields, empresa_id: empresaId }
    if (!payload.sala_id) delete payload.sala_id
    if (!payload.modelo_honorarios) delete payload.modelo_honorarios
    if (!payload.duracion_minutos) delete payload.duracion_minutos

    const admin = createAdminClient()

    if (id) {
      const { error } = await admin
        .from('mpaci_servicios_config')
        .update(payload)
        .eq('id', id)
        .eq('empresa_id', empresaId)
      if (error) return { error: error.message }
    } else {
      const { error } = await admin
        .from('mpaci_servicios_config')
        .insert(payload)
      if (error) {
        if (error.code === '23505') return { error: 'Ya existe una configuración para ese médico, servicio y sede.' }
        return { error: error.message }
      }
    }

    revalidatePath(`/${empresaSlug}/configuracion/clinica/prestadores`)
    return { ok: true }
  } catch (e: any) {
    return { error: e.message }
  }
}

export async function toggleServicioConfigActivo(_: unknown, formData: FormData) {
  try {
    const id = z.string().uuid().parse(formData.get('id'))
    const activo = formData.get('activo') === 'true'
    const empresaSlug = z.string().min(1).parse(formData.get('empresaSlug'))

    const { empresaId } = await assertAdminGeneral()
    const admin = createAdminClient()

    await admin
      .from('mpaci_servicios_config')
      .update({ activo })
      .eq('id', id)
      .eq('empresa_id', empresaId)

    revalidatePath(`/${empresaSlug}/configuracion/clinica/prestadores`)
    return { ok: true }
  } catch (e: any) {
    return { error: e.message }
  }
}
