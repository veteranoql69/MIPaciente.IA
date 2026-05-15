import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { getUsuariosEmpresa, getInvitacionesPendientes } from '@/modules/configuracion/queries'
import { UsuariosClient } from '@/modules/configuracion/components/UsuariosClient'

type Props = {
  params: Promise<{ empresa_slug: string }>
}

export default async function UsuariosPage({ params }: Props) {
  const { empresa_slug } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: empresa } = await supabase
    .from('mpaci_empresas')
    .select('id')
    .eq('slug', empresa_slug)
    .single()

  if (!empresa) redirect('/unauthorized')

  const [usuarios, invitaciones] = await Promise.all([
    getUsuariosEmpresa(empresa.id),
    getInvitacionesPendientes(empresa.id),
  ])

  return (
    <UsuariosClient
      usuarios={usuarios}
      invitaciones={invitaciones}
      empresaSlug={empresa_slug}
      currentUserId={user.id}
    />
  )
}
