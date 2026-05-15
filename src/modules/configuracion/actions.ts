'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { sendInvitationEmail } from '@/modules/invitaciones/email'

// ─── Helpers ──────────────────────────────────────────────────

function generateCodigo(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

async function assertAdminGeneral() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No autenticado')

  const { data: perfil } = await supabase
    .from('mpaci_usuarios')
    .select('rol, empresa_id, nombre_completo')
    .eq('id', user.id)
    .single()

  if (!perfil || perfil.rol !== 'admin_general') throw new Error('Sin permisos')
  return { user, perfil }
}

// ─── Invitar usuario ──────────────────────────────────────────

const InvitarSchema = z.object({
  empresaSlug: z.string().min(1),
  email: z.string().email(),
  rol: z.enum(['admin', 'medico', 'asistente', 'enfermera_tens', 'externo']),
})

export async function invitarUsuario(_: unknown, formData: FormData) {
  try {
    const parsed = InvitarSchema.safeParse({
      empresaSlug: formData.get('empresaSlug'),
      email: formData.get('email'),
      rol: formData.get('rol'),
    })
    if (!parsed.success) return { error: 'Datos inválidos.' }

    const { user, perfil } = await assertAdminGeneral()
    if (!perfil.empresa_id) return { error: 'Sin empresa asignada.' }

    const supabase = await createClient()
    const admin = createAdminClient()

    // Get empresa name
    const { data: empresa } = await supabase
      .from('mpaci_empresas')
      .select('id, nombre')
      .eq('slug', parsed.data.empresaSlug)
      .single()

    if (!empresa) return { error: 'Empresa no encontrada.' }

    // Check existing active invitation for same email
    const { data: existing } = await admin
      .from('mpaci_invitaciones')
      .select('id')
      .eq('empresa_id', empresa.id)
      .eq('email', parsed.data.email)
      .eq('usado', false)
      .gt('expires_at', new Date().toISOString())
      .maybeSingle()

    if (existing) return { error: 'Ya existe una invitación activa para este correo.' }

    const codigo = generateCodigo()

    const { error: insertError } = await admin
      .from('mpaci_invitaciones')
      .insert({
        empresa_id: empresa.id,
        email: parsed.data.email,
        rol: parsed.data.rol,
        codigo,
        created_by: user.id,
      })

    if (insertError) return { error: 'Error al crear invitación.' }

    await sendInvitationEmail({
      to: parsed.data.email,
      clinicName: empresa.nombre,
      inviterName: perfil.nombre_completo,
      rol: parsed.data.rol,
      codigo,
    })

    revalidatePath(`/${parsed.data.empresaSlug}/configuracion/usuarios`)
    return { ok: true }
  } catch (err: any) {
    return { error: err.message ?? 'Error inesperado.' }
  }
}

// ─── Cambiar rol de usuario ───────────────────────────────────

const CambiarRolSchema = z.object({
  empresaSlug: z.string().min(1),
  usuarioId: z.string().uuid(),
  nuevoRol: z.enum(['admin', 'medico', 'asistente', 'enfermera_tens', 'externo']),
})

export async function cambiarRolUsuario(_: unknown, formData: FormData) {
  try {
    const parsed = CambiarRolSchema.safeParse({
      empresaSlug: formData.get('empresaSlug'),
      usuarioId: formData.get('usuarioId'),
      nuevoRol: formData.get('nuevoRol'),
    })
    if (!parsed.success) return { error: 'Datos inválidos.' }

    const { perfil } = await assertAdminGeneral()
    if (!perfil.empresa_id) return { error: 'Sin empresa asignada.' }

    // Can't change own role
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (parsed.data.usuarioId === user?.id) return { error: 'No puedes cambiar tu propio rol.' }

    const admin = createAdminClient()
    const { error } = await admin
      .from('mpaci_usuarios')
      .update({ rol: parsed.data.nuevoRol })
      .eq('id', parsed.data.usuarioId)
      .eq('empresa_id', perfil.empresa_id)

    if (error) return { error: 'Error al actualizar rol.' }

    // Re-seed permissions for new role (adds missing, doesn't remove customizations)
    await admin.rpc('seed_permisos_por_rol', {
      p_usuario_id: parsed.data.usuarioId,
      p_empresa_id: perfil.empresa_id,
      p_rol: parsed.data.nuevoRol,
      p_otorgado_por: user?.id ?? null,
    })

    revalidatePath(`/${parsed.data.empresaSlug}/configuracion/usuarios`)
    revalidatePath(`/${parsed.data.empresaSlug}/configuracion/roles`)
    return { ok: true }
  } catch (err: any) {
    return { error: err.message ?? 'Error inesperado.' }
  }
}

// ─── Desactivar usuario ───────────────────────────────────────

const DesactivarSchema = z.object({
  empresaSlug: z.string().min(1),
  usuarioId: z.string().uuid(),
})

export async function desactivarUsuario(_: unknown, formData: FormData) {
  try {
    const parsed = DesactivarSchema.safeParse({
      empresaSlug: formData.get('empresaSlug'),
      usuarioId: formData.get('usuarioId'),
    })
    if (!parsed.success) return { error: 'Datos inválidos.' }

    const { perfil } = await assertAdminGeneral()
    if (!perfil.empresa_id) return { error: 'Sin empresa asignada.' }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (parsed.data.usuarioId === user?.id) return { error: 'No puedes desactivarte a ti mismo.' }

    // Desactivar todos los permisos del usuario
    const admin = createAdminClient()
    await admin
      .from('mpaci_permisos_usuario')
      .update({ activo: false })
      .eq('usuario_id', parsed.data.usuarioId)
      .eq('empresa_id', perfil.empresa_id)

    revalidatePath(`/${parsed.data.empresaSlug}/configuracion/usuarios`)
    return { ok: true }
  } catch (err: any) {
    return { error: err.message ?? 'Error inesperado.' }
  }
}

// ─── Alternar permiso individual ──────────────────────────────

const TogglePermisoSchema = z.object({
  empresaSlug: z.string().min(1),
  usuarioId: z.string().uuid(),
  modulo: z.string().min(1),
  permiso: z.string().min(1),
  activo: z.coerce.boolean(),
})

export async function togglePermiso(_: unknown, formData: FormData) {
  try {
    const parsed = TogglePermisoSchema.safeParse({
      empresaSlug: formData.get('empresaSlug'),
      usuarioId: formData.get('usuarioId'),
      modulo: formData.get('modulo'),
      permiso: formData.get('permiso'),
      activo: formData.get('activo'),
    })
    if (!parsed.success) return { error: 'Datos inválidos.' }

    const { perfil } = await assertAdminGeneral()
    if (!perfil.empresa_id) return { error: 'Sin empresa asignada.' }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const admin = createAdminClient()

    // Upsert — create if not exists, update if exists
    const { error } = await admin
      .from('mpaci_permisos_usuario')
      .upsert({
        empresa_id: perfil.empresa_id,
        usuario_id: parsed.data.usuarioId,
        modulo: parsed.data.modulo,
        permiso: parsed.data.permiso,
        activo: parsed.data.activo,
        otorgado_por: user?.id ?? null,
      }, { onConflict: 'usuario_id,modulo,permiso' })

    if (error) return { error: 'Error al actualizar permiso.' }

    revalidatePath(`/${parsed.data.empresaSlug}/configuracion/roles`)
    return { ok: true }
  } catch (err: any) {
    return { error: err.message ?? 'Error inesperado.' }
  }
}

// ─── Restaurar permisos de rol por defecto ────────────────────

const RestaurarPermisosSchema = z.object({
  empresaSlug: z.string().min(1),
  usuarioId: z.string().uuid(),
})

export async function restaurarPermisosPorRol(_: unknown, formData: FormData) {
  try {
    const parsed = RestaurarPermisosSchema.safeParse({
      empresaSlug: formData.get('empresaSlug'),
      usuarioId: formData.get('usuarioId'),
    })
    if (!parsed.success) return { error: 'Datos inválidos.' }

    const { perfil } = await assertAdminGeneral()
    if (!perfil.empresa_id) return { error: 'Sin empresa asignada.' }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const admin = createAdminClient()

    // Get target user's role
    const { data: target } = await admin
      .from('mpaci_usuarios')
      .select('rol')
      .eq('id', parsed.data.usuarioId)
      .eq('empresa_id', perfil.empresa_id)
      .single()

    if (!target) return { error: 'Usuario no encontrado.' }

    // Delete all current permissions and reseed
    await admin
      .from('mpaci_permisos_usuario')
      .delete()
      .eq('usuario_id', parsed.data.usuarioId)
      .eq('empresa_id', perfil.empresa_id)

    await admin.rpc('seed_permisos_por_rol', {
      p_usuario_id: parsed.data.usuarioId,
      p_empresa_id: perfil.empresa_id,
      p_rol: target.rol,
      p_otorgado_por: user?.id ?? null,
    })

    revalidatePath(`/${parsed.data.empresaSlug}/configuracion/roles`)
    return { ok: true }
  } catch (err: any) {
    return { error: err.message ?? 'Error inesperado.' }
  }
}
