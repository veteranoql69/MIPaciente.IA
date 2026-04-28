import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { redirect } from 'next/navigation'
import InvitadoClient from './client'

export default async function OnboardingInvitadoPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: perfil } = await supabase
    .from('mpaci_usuarios')
    .select('onboarding_completado, empresa_id')
    .eq('id', user.id)
    .single()

  if (perfil?.onboarding_completado && perfil.empresa_id) {
    const admin = createAdminClient()
    const { data: empresa } = await admin
      .from('mpaci_empresas')
      .select('slug')
      .eq('id', perfil.empresa_id)
      .single()
    if (empresa?.slug) redirect(`/${empresa.slug}/agenda/hoy`)
  }

  const admin = createAdminClient()
  const { data: invitacion } = await admin
    .from('mpaci_invitaciones')
    .select('id, empresa_id, rol')
    .eq('email', user.email ?? '')
    .eq('usado', false)
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (!invitacion) redirect('/onboarding')

  const { data: empresa } = await admin
    .from('mpaci_empresas')
    .select('nombre')
    .eq('id', invitacion.empresa_id)
    .single()

  return (
    <InvitadoClient
      invitacionId={invitacion.id}
      empresaNombre={empresa?.nombre ?? ''}
      rol={invitacion.rol}
    />
  )
}
