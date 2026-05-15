import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { getServicios, getPreciosAllServicios } from '@/modules/configuracion/queries-clinica'
import { ServiciosClient } from '@/modules/configuracion/components/ServiciosClient'

type Props = { params: Promise<{ empresa_slug: string }> }

export default async function ServiciosPage({ params }: Props) {
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

  const [servicios, precios] = await Promise.all([
    getServicios(empresa.id),
    getPreciosAllServicios(empresa.id),
  ])

  return (
    <ServiciosClient
      servicios={servicios}
      precios={precios}
      empresaSlug={empresa_slug}
    />
  )
}
