'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import type { ContenidoPlantilla } from './queries-plantillas'

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

// Normaliza null / "" / undefined a undefined antes de validar con Zod
const nullishToUndefined = (v: unknown) =>
  v === null || v === '' || v === undefined ? undefined : v

// ═══════════════════════════════════════════════════════════
// IDENTIDAD CORPORATIVA
// ═══════════════════════════════════════════════════════════

const IdentidadSchema = z.object({
  empresaSlug:       z.string().min(1),
  email_clinica:     z.preprocess(nullishToUndefined, z.email().optional()),
  telefono_clinica:  z.string().max(20).optional(),
  direccion_clinica: z.string().max(200).optional(),
})

export async function updateIdentidad(_prev: unknown, formData: FormData) {
  try {
    const { empresaId, user: _u } = await assertAdminGeneral()
    const parsed = IdentidadSchema.safeParse(Object.fromEntries(formData))
    if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message }

    const { email_clinica, telefono_clinica, direccion_clinica } = parsed.data
    const admin = createAdminClient()

    const { error } = await admin
      .from('mpaci_empresas')
      .update({
        email_clinica:     email_clinica     || null,
        telefono_clinica:  telefono_clinica  || null,
        direccion_clinica: direccion_clinica || null,
      })
      .eq('id', empresaId)

    if (error) return { ok: false, error: error.message }

    revalidatePath(`/${parsed.data.empresaSlug}/configuracion/plantillas/documentos`)
    return { ok: true }
  } catch (e: unknown) {
    return { ok: false, error: e instanceof Error ? e.message : 'Error inesperado' }
  }
}

export async function uploadLogo(_prev: unknown, formData: FormData) {
  try {
    const { empresaId } = await assertAdminGeneral()
    const empresaSlug = formData.get('empresaSlug') as string
    const file = formData.get('logo') as File | null

    if (!file || file.size === 0) return { ok: false, error: 'No se seleccionó archivo' }
    if (file.size > 2 * 1024 * 1024) return { ok: false, error: 'El logo debe ser menor a 2 MB' }

    const ext = file.name.split('.').pop()?.toLowerCase() ?? 'png'
    const allowed = ['png', 'jpg', 'jpeg', 'webp', 'svg']
    if (!allowed.includes(ext)) return { ok: false, error: 'Formato no permitido (PNG, JPG, WebP, SVG)' }

    const admin = createAdminClient()
    const path = `${empresaId}/logo.${ext}`

    const buffer = Buffer.from(await file.arrayBuffer())

    const { error: uploadError } = await admin.storage
      .from('empresa-assets')
      .upload(path, buffer, {
        contentType: file.type,
        upsert: true,
      })

    if (uploadError) return { ok: false, error: uploadError.message }

    const { data: { publicUrl } } = admin.storage
      .from('empresa-assets')
      .getPublicUrl(path)

    // Append cache-buster so the browser re-fetches
    const logoUrl = `${publicUrl}?v=${Date.now()}`

    const { error: updateError } = await admin
      .from('mpaci_empresas')
      .update({ logo_url: logoUrl })
      .eq('id', empresaId)

    if (updateError) return { ok: false, error: updateError.message }

    revalidatePath(`/${empresaSlug}/configuracion/plantillas/documentos`)
    return { ok: true, logo_url: logoUrl }
  } catch (e: unknown) {
    return { ok: false, error: e instanceof Error ? e.message : 'Error inesperado' }
  }
}

// ═══════════════════════════════════════════════════════════
// PLANTILLAS DE DOCUMENTOS
// ═══════════════════════════════════════════════════════════

const SeccionSchema = z.object({
  id:     z.string().min(1),
  titulo: z.string().max(120),
  cuerpo: z.string().max(8000),
})

const HeaderSchema = z.object({
  mostrar_logo:           z.boolean().default(true),
  mostrar_nombre_clinica: z.boolean().default(true),
  mostrar_fecha:          z.boolean().default(true),
  mostrar_medico:         z.boolean().default(true),
})

// Regex UUID v4 para validación manual (evita inconsistencias de Zod v4)
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const optionalUuid = z.preprocess(
  nullishToUndefined,
  z.string().regex(UUID_RE, 'ID inválido').optional(),
)

const PlantillaSchema = z.object({
  empresaSlug: z.string().min(1),
  id:          optionalUuid,
  tipo:        z.enum(['protocolo', 'receta', 'consentimiento']),
  nombre:      z.string().min(1).max(120),
  servicio_id: optionalUuid,
  contenido:   z.object({
    header:    HeaderSchema,
    secciones: z.array(SeccionSchema),
  }),
})

export async function upsertPlantilla(_prev: unknown, formData: FormData) {
  try {
    const { empresaId } = await assertAdminGeneral()

    const raw = {
      empresaSlug: formData.get('empresaSlug'),
      id:          formData.get('id'),
      tipo:        formData.get('tipo'),
      nombre:      formData.get('nombre'),
      servicio_id: formData.get('servicio_id'),
      contenido:   JSON.parse((formData.get('contenido') as string) || '{}') as ContenidoPlantilla,
    }

    const parsed = PlantillaSchema.safeParse(raw)
    if (!parsed.success) {
      const issue = parsed.error.issues[0]
      return { ok: false, error: `${issue.path.join('.')}: ${issue.message}` }
    }

    const { empresaSlug, id, tipo, nombre, servicio_id, contenido } = parsed.data
    const admin = createAdminClient()

    const payload = {
      empresa_id:  empresaId,
      tipo,
      nombre,
      servicio_id: servicio_id || null,
      contenido,
    }

    const { error } = id
      ? await admin.from('mpaci_plantillas_documentos').update(payload).eq('id', id)
      : await admin.from('mpaci_plantillas_documentos').insert({ ...payload, activo: true })

    if (error) return { ok: false, error: error.message }

    revalidatePath(`/${empresaSlug}/configuracion/plantillas/documentos`)
    return { ok: true }
  } catch (e: unknown) {
    return { ok: false, error: e instanceof Error ? e.message : 'Error inesperado' }
  }
}

export async function togglePlantillaActiva(id: string, activo: boolean, empresaSlug: string) {
  try {
    const { empresaId } = await assertAdminGeneral()
    const admin = createAdminClient()

    const { error } = await admin
      .from('mpaci_plantillas_documentos')
      .update({ activo })
      .eq('id', id)
      .eq('empresa_id', empresaId)

    if (error) return { ok: false, error: error.message }

    revalidatePath(`/${empresaSlug}/configuracion/plantillas/documentos`)
    return { ok: true }
  } catch (e: unknown) {
    return { ok: false, error: e instanceof Error ? e.message : 'Error inesperado' }
  }
}

export async function deletePlantilla(id: string, empresaSlug: string) {
  try {
    const { empresaId } = await assertAdminGeneral()
    const admin = createAdminClient()

    const { error } = await admin
      .from('mpaci_plantillas_documentos')
      .delete()
      .eq('id', id)
      .eq('empresa_id', empresaId)

    if (error) return { ok: false, error: error.message }

    revalidatePath(`/${empresaSlug}/configuracion/plantillas/documentos`)
    return { ok: true }
  } catch (e: unknown) {
    return { ok: false, error: e instanceof Error ? e.message : 'Error inesperado' }
  }
}
