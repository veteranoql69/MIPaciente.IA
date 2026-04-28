import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import OnboardingOwnerClient from './client'

export default async function OnboardingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Si ya completó onboarding, redirigir (el middleware lo hace, pero por seguridad)
  const { data: perfil } = await supabase
    .from('mpaci_usuarios')
    .select('onboarding_completado, empresa_id')
    .eq('id', user.id)
    .single()

  if (perfil?.onboarding_completado && perfil.empresa_id) {
    const { data: empresa } = await supabase
      .from('mpaci_empresas')
      .select('slug')
      .eq('id', perfil.empresa_id)
      .single()
    if (empresa?.slug) redirect(`/${empresa.slug}/agenda/hoy`)
  }

  const rawName: string =
    user.user_metadata?.full_name ??
    user.user_metadata?.name ??
    user.email?.split('@')[0] ??
    ''

  const firstName = rawName.split(' ')[0] || 'allí'
  const fullName = rawName || ''

  return (
    <OnboardingOwnerClient
      firstName={firstName}
      fullName={fullName}
      email={user.email ?? ''}
    />
  )
}
