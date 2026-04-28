import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { EmpresaProvider } from '@/context/empresa-context'
import { SidebarNav } from './_components/sidebar-nav'
import { PermissionProvider } from '@/modules/permissions/context'
import { getMyPermissions } from '@/modules/permissions/queries'

type Props = {
  params: Promise<{ empresa_slug: string }>
  children: React.ReactNode
}

export default async function EmpresaLayout({ params, children }: Props) {
  const { empresa_slug } = await params
  const supabase = await createClient()

  // Get current user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Fetch empresa by slug (RLS ensures this belongs to the user)
  const { data: empresa } = await supabase
    .from('mpaci_empresas')
    .select('*')
    .eq('slug', empresa_slug)
    .single()

  if (!empresa) redirect('/unauthorized')

  // Fetch user profile
  const { data: usuario } = await supabase
    .from('mpaci_usuarios')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!usuario) redirect('/unauthorized')

  // Carga permisos una sola vez — el PermissionProvider los distribuye sin más fetches
  const permissions = await getMyPermissions(user.id)

  return (
    <EmpresaProvider empresa={empresa} usuario={usuario}>
      <PermissionProvider value={permissions}>
        <div className="flex min-h-dvh flex-col lg:flex-row">
          <SidebarNav
            empresaSlug={empresa_slug}
            empresaNombre={empresa.nombre}
            usuarioNombre={usuario.nombre_completo}
            usuarioEmail={usuario.email}
            rol={usuario.rol}
          />
          {/* Main content: responsive margin */}
          <main id="main-content" className="flex-1 lg:ml-60 min-h-dvh bg-background w-full">
            {children}
          </main>
        </div>
      </PermissionProvider>
    </EmpresaProvider>
  )
}
