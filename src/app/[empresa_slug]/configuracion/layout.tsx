import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { Settings } from 'lucide-react'
import { ConfigTabNav } from './_components/ConfigTabNav'

type Props = {
  params: Promise<{ empresa_slug: string }>
  children: React.ReactNode
}

export default async function ConfiguracionLayout({ params, children }: Props) {
  const { empresa_slug } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: usuario } = await supabase
    .from('mpaci_usuarios')
    .select('rol')
    .eq('id', user.id)
    .single()

  if (!usuario || usuario.rol !== 'admin_general') {
    redirect(`/${empresa_slug}/dashboard`)
  }

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
          <Settings className="w-5 h-5 text-slate-600" />
        </div>
        <div>
          <h1 className="text-xl font-black text-slate-900">Configuración</h1>
          <p className="text-xs text-slate-500 mt-0.5">Gestión de usuarios, roles y permisos</p>
        </div>
      </div>

      <ConfigTabNav empresaSlug={empresa_slug} />

      {children}
    </div>
  )
}
