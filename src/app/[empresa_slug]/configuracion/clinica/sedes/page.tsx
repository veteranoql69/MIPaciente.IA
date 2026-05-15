import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { getSucursales, getSalasAll } from '@/modules/configuracion/queries-clinica'
import { SedesClient } from '@/modules/configuracion/components/SedesClient'

type Props = { params: Promise<{ empresa_slug: string }> }

export default async function SedesPage({ params }: Props) {
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

  const [sucursales, salas] = await Promise.all([
    getSucursales(empresa.id),
    getSalasAll(empresa.id),
  ])

  return (
    <SedesClient
      sucursales={sucursales}
      salas={salas}
      empresaSlug={empresa_slug}
    />
  )
}
