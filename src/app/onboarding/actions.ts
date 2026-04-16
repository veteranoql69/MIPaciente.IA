'use server'

import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { z } from 'zod'

const onboardingSchema = z.object({
  empresa_id: z.uuid({ error: 'Selecciona una clínica válida' }),
  nombre_completo: z.string().min(2, 'Mínimo 2 caracteres').max(100, 'Máximo 100 caracteres').trim(),
})

export async function getEmpresasActivas() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('mpaci_empresas')
    .select('id, nombre, slug')
    .eq('activo', true)
    .order('nombre')

  if (error) throw new Error('No se pudieron cargar las clínicas')
  return data ?? []
}

export async function completeOnboarding(_: unknown, formData: FormData) {
  const parsed = onboardingSchema.safeParse({
    empresa_id: formData.get('empresa_id'),
    nombre_completo: formData.get('nombre_completo'),
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Sesión expirada. Por favor vuelve a iniciar sesión.' }
  }

  // Try update first (profile row exists via auth trigger)
  const { error: updateError } = await supabase
    .from('mpaci_usuarios')
    .update({
      nombre_completo: parsed.data.nombre_completo,
      empresa_id: parsed.data.empresa_id,
      onboarding_completado: true,
    })
    .eq('id', user.id)

  if (updateError) {
    // Profile row doesn't exist yet — insert it
    const { error: insertError } = await supabase
      .from('mpaci_usuarios')
      .insert({
        id: user.id,
        email: user.email ?? '',
        nombre_completo: parsed.data.nombre_completo,
        empresa_id: parsed.data.empresa_id,
        onboarding_completado: true,
        rol: 'asistente',
      })

    if (insertError) {
      return { error: 'Error al guardar los datos. Intenta de nuevo.' }
    }
  }

  redirect('/')
}
