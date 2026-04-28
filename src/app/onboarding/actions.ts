'use server'

import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { sendInvitationEmail } from '@/modules/invitaciones/email'
import fs from 'fs'
import path from 'path'

function logDebug(msg: string) {
  const logPath = path.join(process.cwd(), 'doc', 'proxy_debug.log')
  const timestamp = new Date().toISOString()
  try {
    fs.appendFileSync(logPath, `[${timestamp}] ${msg}\n`)
  } catch (e) {
    console.error('Failed to write log:', e)
  }
}

const invitadoSchema = z.object({
  email: z.email(),
  rol: z.enum(['admin_general', 'admin', 'medico', 'asistente', 'enfermera_tens', 'externo']),
})

const workspaceSchema = z.object({
  nombre_clinica: z.string().min(3, 'Mínimo 3 caracteres').max(100),
  slug: z
    .string()
    .min(3, 'Mínimo 3 caracteres')
    .max(50, 'Máximo 50 caracteres')
    .regex(/^[a-z0-9-]+$/, 'Solo letras minúsculas, números y guiones'),
  invitaciones_json: z.string().optional(),
})

export async function createWorkspace(_: unknown, formData: FormData) {
  const parsed = workspaceSchema.safeParse({
    nombre_clinica: formData.get('nombre_clinica'),
    slug: formData.get('slug'),
    invitaciones_json: formData.get('invitaciones_json'),
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Sesión expirada. Vuelve a iniciar sesión.' }

  const { nombre_clinica, slug, invitaciones_json } = parsed.data

  logDebug(`[Onboarding] Invitaciones JSON recibidas: ${invitaciones_json || 'VACÍO'}`)

  let invitaciones: { email: string; rol: string }[] = []
  if (invitaciones_json) {
    try {
      invitaciones = z.array(invitadoSchema).parse(JSON.parse(invitaciones_json))
    } catch {
      return { error: 'Error al procesar las invitaciones. Intenta de nuevo.' }
    }
  }

  const admin = createAdminClient()
  logDebug('[Onboarding] createWorkspace triggered')

  // 1. Crear empresa
  const { data: empresa, error: empresaError } = await admin
    .from('mpaci_empresas')
    .insert({ nombre: nombre_clinica, slug, activo: true })
    .select('id, slug, nombre')
    .single()

  if (empresaError) {
    if (empresaError.code === '23505') {
      return { error: 'Esa URL ya está en uso. Elige un nombre diferente.' }
    }
    return { error: 'Error al crear la clínica. Intenta de nuevo.' }
  }

  // 2. Elevar usuario a admin_general y completar onboarding
  // Usamos upsert por si el registro fue borrado (hard reset) pero la sesión persiste
  const { error: userError } = await admin
    .from('mpaci_usuarios')
    .upsert({ 
      id: user.id, 
      email: user.email!,
      nombre_completo: user.user_metadata?.full_name ?? user.user_metadata?.name ?? user.email ?? 'Usuario',
      empresa_id: empresa.id, 
      rol: 'admin_general', 
      onboarding_completado: true 
    })

  logDebug(`[Onboarding] Profile upserted for user: ${user.id}, Error: ${JSON.stringify(userError)}`)

  if (userError) {
    console.error('Error upserting user profile:', userError)
    return { error: 'Error al configurar tu cuenta. Contacta a soporte.' }
  }

  // 3. Crear invitaciones y enviar emails (best-effort, no bloquea)
  const nombreInvitador =
    user.user_metadata?.full_name ?? user.user_metadata?.name ?? user.email ?? 'El administrador'

  for (const inv of invitaciones) {
    const codigo = String(Math.floor(100000 + Math.random() * 900000))

    const { error: invError } = await admin
      .from('mpaci_invitaciones')
      .insert({
        empresa_id: empresa.id,
        email: inv.email,
        rol: inv.rol as 'admin_general' | 'admin' | 'medico' | 'asistente' | 'enfermera_tens' | 'externo',
        codigo,
        created_by: user.id,
      })

    if (invError) {
      logDebug(`[Onboarding] Error al insertar invitación para ${inv.email}: ${JSON.stringify(invError)}`)
    } else {
      try {
        await sendInvitationEmail({
          to: inv.email,
          clinicName: empresa.nombre,
          inviterName: nombreInvitador,
          rol: inv.rol,
          codigo,
        })
      } catch (emailErr: any) {
        logDebug(`[Onboarding] Error de envío de email a ${inv.email}: ${emailErr.message}`)
      }
    }
  }

  logDebug(`[Onboarding] All steps completed, redirecting to: /${empresa.slug}/agenda/hoy`)
  revalidatePath('/', 'layout')
  redirect(`/${empresa.slug}/agenda/hoy`)
}
