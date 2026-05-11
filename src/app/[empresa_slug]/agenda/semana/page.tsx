import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { getCitasRango, getAntecedentesMap } from '@/modules/agenda/queries'
import AgendaSemanaClient from '@/modules/agenda/components/AgendaSemanaClient'
import { DateTime } from 'luxon'
import { getWeekBounds, buildWeekDays, isoDate } from '@/lib/dates'
import type { AppRole } from '@/lib/database.types'

type Props = {
  params: Promise<{ empresa_slug: string }>
  searchParams: Promise<{ fecha?: string }>
}

export default async function AgendaSemanaPage({ params, searchParams }: Props) {
  const { empresa_slug } = await params
  const { fecha } = await searchParams

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: usuario } = await supabase
    .from('mpaci_usuarios')
    .select('id, rol, empresa_id')
    .eq('id', user.id)
    .single()

  if (!usuario?.empresa_id) redirect('/unauthorized')

  const { data: empresa } = await supabase
    .from('mpaci_empresas')
    .select('timezone')
    .eq('id', usuario.empresa_id)
    .single()
  const timezone: string = empresa?.timezone ?? 'America/Santiago'

  let medicosAsignados: string[] = []
  if (usuario.rol === 'asistente') {
    const { data } = await supabase
      .from('mpaci_asignaciones_medico')
      .select('medico_id')
      .eq('asistente_id', user.id)
      .eq('activo', true)
    medicosAsignados = (data ?? []).map(r => r.medico_id)
  }

  const reference = fecha
    ? DateTime.fromISO(fecha, { zone: timezone })
    : DateTime.now().setZone(timezone)

  const { monday, sunday } = getWeekBounds(reference, timezone)

  const citas = await getCitasRango(
    usuario.empresa_id,
    user.id,
    usuario.rol as AppRole,
    medicosAsignados,
    monday.toUTC().toISO()!,
    sunday.toUTC().toISO()!,
  )

  const contactoIds = [...new Set(citas.map(c => c.contacto?.id).filter(Boolean) as string[])]
  const antecedentes = await getAntecedentesMap(usuario.empresa_id, contactoIds)

  // Agrupar citas por día (server-side) antes de pasar al cliente
  const citasByIso: Record<string, typeof citas> = {}
  for (const c of citas) {
    const dayIso = DateTime.fromISO(c.fecha_inicio, { setZone: true }).setZone(timezone).toISODate()!
    if (!citasByIso[dayIso]) citasByIso[dayIso] = []
    citasByIso[dayIso].push(c)
  }

  const weekDays = buildWeekDays(monday, timezone, citasByIso)

  const fechaLabel = `${monday.setLocale('es').toFormat("d 'de' MMM")} – ${
    monday.plus({ days: 6 }).setLocale('es').toFormat("d 'de' MMM yyyy")
  }`

  const prevWeek = monday.minus({ weeks: 1 })
  const nextWeek = monday.plus({ weeks: 1 })

  return (
    <div className="flex h-screen bg-slate-50">
      <div className="flex-1 flex flex-col overflow-hidden">
        <AgendaSemanaClient
          citas={citas}
          antecedentes={antecedentes}
          empresaSlug={empresa_slug}
          timezone={timezone}
          weekDays={weekDays}
          prevHref={`/${empresa_slug}/agenda/semana?fecha=${isoDate(prevWeek)}`}
          nextHref={`/${empresa_slug}/agenda/semana?fecha=${isoDate(nextWeek)}`}
          fechaLabel={fechaLabel}
        />
      </div>
    </div>
  )
}
