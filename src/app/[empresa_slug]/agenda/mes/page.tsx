import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { getCitasRango, getAntecedentesMap } from '@/modules/agenda/queries'
import AgendaMesClient from '@/modules/agenda/components/AgendaMesClient'
import { DateTime } from 'luxon'
import { getMonthBounds, buildCalendarDays, isoDate } from '@/lib/dates'
import type { AppRole } from '@/lib/database.types'

type Props = {
  params: Promise<{ empresa_slug: string }>
  searchParams: Promise<{ fecha?: string }>
}

export default async function AgendaMesPage({ params, searchParams }: Props) {
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

  const { firstOfMonth, firstOfNextMonth } = getMonthBounds(
    reference.year,
    reference.month,
    timezone
  )

  const citas = await getCitasRango(
    usuario.empresa_id,
    user.id,
    usuario.rol as AppRole,
    medicosAsignados,
    firstOfMonth.toUTC().toISO()!,
    firstOfNextMonth.toUTC().toISO()!,
  )

  const contactoIds = [...new Set(citas.map(c => c.contacto?.id).filter(Boolean) as string[])]
  const antecedentes = await getAntecedentesMap(usuario.empresa_id, contactoIds)

  const calendarDays = buildCalendarDays(firstOfMonth, timezone, citas)

  const fechaLabel = firstOfMonth.setLocale('es').toFormat('LLLL yyyy')

  const prevMonth = firstOfMonth.minus({ months: 1 })
  const nextMonth = firstOfMonth.plus({ months: 1 })

  return (
    <div className="flex h-screen bg-slate-50">
      <div className="flex-1 flex flex-col overflow-hidden">
        <AgendaMesClient
          citas={citas}
          antecedentes={antecedentes}
          empresaSlug={empresa_slug}
          timezone={timezone}
          calendarDays={calendarDays}
          prevHref={`/${empresa_slug}/agenda/mes?fecha=${isoDate(prevMonth)}`}
          nextHref={`/${empresa_slug}/agenda/mes?fecha=${isoDate(nextMonth)}`}
          fechaLabel={fechaLabel}
        />
      </div>
    </div>
  )
}
