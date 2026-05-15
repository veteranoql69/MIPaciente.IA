import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { getMedicosRecepcion, getCitasRecepcionRango } from '@/modules/agenda/queries'
import AgendaRecepcionSemanaClient from '@/modules/agenda/components/AgendaRecepcionSemanaClient'
import type { AppRole } from '@/lib/database.types'
import { DateTime } from 'luxon'

type Props = {
  params:       Promise<{ empresa_slug: string }>
  searchParams: Promise<{ fecha?: string }>
}

function getWeekStart(fecha: string): string {
  const d = new Date(fecha + 'T12:00:00')
  const day = d.getDay() // 0=Dom, 1=Lun, ..., 6=Sáb
  const diff = day === 0 ? -6 : 1 - day // desplazar al lunes
  d.setDate(d.getDate() + diff)
  return d.toISOString().slice(0, 10)
}

export default async function AgendaRecepcionSemanaPage({ params, searchParams }: Props) {
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

  const semanaStart = getWeekStart(fechaRef)
  const semanaEndDate = new Date(semanaStart + 'T12:00:00')
  semanaEndDate.setDate(semanaEndDate.getDate() + 7)
  const semanaEnd = semanaEndDate.toISOString().slice(0, 10)

  const medicos = await getMedicosRecepcion(usuario.empresa_id, user.id, usuario.rol as AppRole)
  const medicosIds = medicos.map(m => m.id)
  const citas = await getCitasRecepcionRango(usuario.empresa_id, medicosIds, semanaStart, semanaEnd, timezone)

  return (
    <AgendaRecepcionSemanaClient
      key={semanaStart}
      citas={citas}
      medicos={medicos}
      semanaStart={semanaStart}
      timezone={timezone}
      empresaSlug={empresa_slug}
    />
  )
}
