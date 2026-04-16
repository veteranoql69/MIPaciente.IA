import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { EmpresaProvider } from '@/context/empresa-context'
import { SidebarNav } from './_components/sidebar-nav'

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

  return (
    <EmpresaProvider empresa={empresa} usuario={usuario}>
      <div className="flex min-h-dvh">
        <SidebarNav
          empresaSlug={empresa_slug}
          empresaNombre={empresa.nombre}
          usuarioNombre={usuario.nombre_completo}
          usuarioEmail={usuario.email}
          rol={usuario.rol}
        />
        {/* Main content: offset by sidebar width */}
        <main id="main-content" className="flex-1 ml-60 min-h-dvh bg-background">
          {children}
        </main>
      </div>
    </EmpresaProvider>
  )
}
