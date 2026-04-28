'use server'

import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const schema = z.object({
  invitacion_id: z.string().uuid(),
  codigo: z.string().length(6),
})

export async function validateInvitationCode(_: unknown, formData: FormData) {
  const parsed = schema.safeParse({
    invitacion_id: formData.get('invitacion_id'),
    codigo: formData.get('codigo'),
  })

  if (!parsed.success) {
    return { error: 'Datos inválidos.' }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Sesión expirada. Vuelve a iniciar sesión.' }

  const admin = createAdminClient()

  const { data: inv, error: invError } = await admin
    .from('mpaci_invitaciones')
    .select('id, empresa_id, rol, codigo, expires_at, usado, email')
    .eq('id', parsed.data.invitacion_id)
    .single()

  if (invError || !inv) return { error: 'Invitación no encontrada.' }
  if (inv.usado) return { error: 'Este código ya fue utilizado.' }
  if (new Date(inv.expires_at) < new Date()) return { error: 'El código ha expirado.' }
  if (inv.email !== user.email) return { error: 'Este código no corresponde a tu cuenta.' }
  if (inv.codigo !== parsed.data.codigo) return { error: 'Código incorrecto. Verifica e intenta de nuevo.' }

  // Mark invitation as used
  await admin
    .from('mpaci_invitaciones')
    .update({ usado: true, usado_en: new Date().toISOString(), usado_por: user.id })
    .eq('id', inv.id)

  // Assign user to empresa with the invited role
  const { error: userError } = await admin
    .from('mpaci_usuarios')
    .upsert({
      id: user.id,
      email: user.email!,
      nombre_completo: user.user_metadata?.full_name ?? user.user_metadata?.name ?? user.email ?? 'Usuario',
      empresa_id: inv.empresa_id,
      rol: inv.rol,
      onboarding_completado: true,
    })

  if (userError) return { error: 'Error al configurar tu cuenta. Contacta a soporte.' }

  const { data: empresa } = await admin
    .from('mpaci_empresas')
    .select('slug')
    .eq('id', inv.empresa_id)
    .single()

  revalidatePath('/', 'layout')
  redirect(`/${empresa?.slug}/agenda/hoy`)
}
