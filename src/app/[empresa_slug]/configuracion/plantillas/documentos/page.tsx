import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { getEmpresaIdentidad, getPlantillas } from '@/modules/configuracion/queries-plantillas'
import { getServicios } from '@/modules/configuracion/queries-clinica'
import { DocumentosClient } from '@/modules/configuracion/components/DocumentosClient'

type Props = { params: Promise<{ empresa_slug: string }> }

export default async function DocumentosPage({ params }: Props) {
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

  const [identidad, plantillas, servicios] = await Promise.all([
    getEmpresaIdentidad(empresa.id),
    getPlantillas(empresa.id),
    getServicios(empresa.id),
  ])

  // Solo servicios marcados como cirugía aplican para protocolos quirúrgicos
  const procedimientos = servicios.filter(s => s.es_cirugia)

  return (
    <DocumentosClient
      identidad={identidad}
      plantillas={plantillas}
      procedimientos={procedimientos}
      empresaSlug={empresa_slug}
    />
  )
}
