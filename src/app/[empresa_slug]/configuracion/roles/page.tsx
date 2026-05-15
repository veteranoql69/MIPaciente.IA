import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { getUsuariosEmpresa, getPermisosEmpresa } from '@/modules/configuracion/queries'
import { PermisosMatrixClient } from '@/modules/configuracion/components/PermisosMatrixClient'

type Props = {
  params: Promise<{ empresa_slug: string }>
}

export default async function RolesPage({ params }: Props) {
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

  const [usuarios, permisos] = await Promise.all([
    getUsuariosEmpresa(empresa.id),
    getPermisosEmpresa(empresa.id),
  ])

  return (
    <PermisosMatrixClient
      usuarios={usuarios}
      permisos={permisos}
      empresaSlug={empresa_slug}
      currentUserId={user.id}
    />
  )
}
