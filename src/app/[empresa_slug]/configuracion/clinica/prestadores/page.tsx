import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import {
  getMedicos, getServiciosConfigByMedico, getServicios,
  getSucursales, getSalasAll,
} from '@/modules/configuracion/queries-clinica'
import { PrestadoresClient } from '@/modules/configuracion/components/PrestadoresClient'

type Props = { params: Promise<{ empresa_slug: string }> }

export default async function PrestadoresPage({ params }: Props) {
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

  const [medicos, servicios, sucursales, salas] = await Promise.all([
    getMedicos(empresa.id),
    getServicios(empresa.id),
    getSucursales(empresa.id),
    getSalasAll(empresa.id),
  ])

  // Fetch configs for all medicos in parallel
  const configsNested = await Promise.all(
    medicos.map(m => getServiciosConfigByMedico(m.id, empresa.id))
  )
  const configs = configsNested.flat()

  return (
    <PrestadoresClient
      medicos={medicos}
      configs={configs}
      servicios={servicios}
      sucursales={sucursales}
      salas={salas}
      empresaSlug={empresa_slug}
    />
  )
}
