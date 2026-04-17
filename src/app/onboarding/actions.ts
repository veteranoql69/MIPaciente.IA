'use server'

import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { z } from 'zod'

const onboardingSchema = z.object({
  empresa_id: z.uuid({ error: 'Selecciona una clínica válida' }),
  nombre_completo: z.string().min(2, 'Mínimo 2 caracteres').max(100, 'Máximo 100 caracteres').trim(),
  rol: z.enum(['medico', 'asistente'], { error: 'Selecciona un rol válido' }),
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
    rol: formData.get('rol'),
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Sesión expirada. Por favor vuelve a iniciar sesión.' }
  }

  const { error: updateError } = await supabase
    .from('mpaci_usuarios')
    .update({
      nombre_completo: parsed.data.nombre_completo,
      empresa_id: parsed.data.empresa_id,
      rol: parsed.data.rol,
      onboarding_completado: true,
    })
    .eq('id', user.id)

  if (updateError) {
    const { error: insertError } = await supabase
      .from('mpaci_usuarios')
      .insert({
        id: user.id,
        email: user.email ?? '',
        nombre_completo: parsed.data.nombre_completo,
        empresa_id: parsed.data.empresa_id,
        rol: parsed.data.rol,
        onboarding_completado: true,
      })

    if (insertError) {
      return { error: 'Error al guardar los datos. Intenta de nuevo.' }
    }
  }

  redirect('/')
}
