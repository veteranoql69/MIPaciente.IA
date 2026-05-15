import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { getMedicosRecepcion, getCitasRecepcionRango } from '@/modules/agenda/queries'
import AgendaRecepcionMesClient from '@/modules/agenda/components/AgendaRecepcionMesClient'
import type { AppRole } from '@/lib/database.types'
import { DateTime } from 'luxon'

type Props = {
  params:       Promise<{ empresa_slug: string }>
  searchParams: Promise<{ fecha?: string }>
}

export default async function AgendaRecepcionMesPage({ params, searchParams }: Props) {
  const { empresa_slug }      = await params
  const { fecha: fechaParam } = await searchParams

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: usuario } = await supabase
    .from('mpaci_usuarios')
    .select('id, rol, empresa_id')
    .eq('id', user.id)
    .single()

  if (!usuario?.empresa_id) redirect('/unauthorized')

  const rolesPermitidos = ['asistente', 'admin', 'admin_general']
  if (!rolesPermitidos.includes(usuario.rol)) redirect(`/${empresa_slug}/agenda/hoy`)

  const { data: empresa } = await supabase
    .from('mpaci_empresas')
    .select('timezone')
    .eq('id', usuario.empresa_id)
    .single()
  const timezone = empresa?.timezone ?? 'America/Santiago'

  const fechaRef =
    fechaParam && /^\d{4}-\d{2}-\d{2}$/.test(fechaParam)
      ? fechaParam
      : DateTime.now().setZone(timezone).toISODate()!

  // Rango = mes completo del fechaRef
  const mesStart = fechaRef.slice(0, 7) + '-01'
  const dt = DateTime.fromISO(mesStart, { zone: timezone })
  const mesEnd = dt.plus({ months: 1 }).toISODate()!

  const medicos = await getMedicosRecepcion(usuario.empresa_id, user.id, usuario.rol as AppRole)
  const medicosIds = medicos.map(m => m.id)
  const citas = await getCitasRecepcionRango(usuario.empresa_id, medicosIds, mesStart, mesEnd, timezone)

  return (
    <AgendaRecepcionMesClient
      key={mesStart}
      citas={citas}
      mesStart={mesStart}
      timezone={timezone}
      empresaSlug={empresa_slug}
    />
  )
}
