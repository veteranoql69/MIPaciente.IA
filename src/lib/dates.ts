/**
 * Capa de fechas con timezone explícita.
 * Usar siempre en lugar de Date nativo para cálculos de agenda.
 * Compatible con server y client components.
 */
import { DateTime } from 'luxon'

export const DEFAULT_TZ = 'America/Santiago'

/** Fecha ISO YYYY-MM-DD en la timezone dada */
export function isoDate(dt: DateTime): string {
  return dt.toISODate()!
}

/** Minutos desde medianoche en la timezone dada (para posicionar pills en el grid) */
export function toMinutesInTz(iso: string, tz: string): number {
  const dt = DateTime.fromISO(iso, { setZone: true }).setZone(tz)
  return dt.hour * 60 + dt.minute
}

/** Hora formateada HH:MM en la timezone dada */
export function formatTimeInTz(iso: string, tz: string): string {
  return DateTime.fromISO(iso, { setZone: true })
    .setZone(tz)
    .toFormat('HH:mm')
}

/** Rango de la semana (lunes–domingo) que contiene `reference`, en la timezone dada */
export function getWeekBounds(reference: DateTime, tz: string) {
  const ref = reference.setZone(tz)
  const monday = ref.startOf('week')           // luxon: semana empieza en lunes ✓
  const sunday = monday.plus({ days: 7 })      // exclusive upper bound
  return { monday, sunday }
}

/** Array de 7 días (lun–dom) para el grid semanal */
export function buildWeekDays(monday: DateTime, tz: string, citasByIso: Record<string, import('@/modules/agenda/queries').CitaHoy[]>) {
  const today = DateTime.now().setZone(tz).toISODate()!
  return Array.from({ length: 7 }, (_, i) => {
    const d = monday.plus({ days: i })
    const iso = d.toISODate()!
    return {
      iso,
      label: d.setLocale('es').toFormat("cccc d 'de' LLLL"),
      short: d.setLocale('es').toFormat('ccc'),
      isToday: iso === today,
      citas: citasByIso[iso] ?? [],
    }
  })
}

/** Inicio y fin de mes (exclusive) para la timezone dada */
export function getMonthBounds(year: number, month: number, tz: string) {
  const firstOfMonth = DateTime.fromObject({ year, month }, { zone: tz }).startOf('month')
  const firstOfNextMonth = firstOfMonth.plus({ months: 1 })
  return { firstOfMonth, firstOfNextMonth }
}

/** Grid calendario mensual (5 o 6 semanas), con citas pre-filtradas */
export function buildCalendarDays(
  firstOfMonth: DateTime,
  tz: string,
  citas: import('@/modules/agenda/queries').CitaHoy[]
) {
  const today = DateTime.now().setZone(tz).toISODate()!
  const month = firstOfMonth.month
  const gridStart = firstOfMonth.startOf('week')  // lunes de la semana del día 1

  const cells = Array.from({ length: 42 }, (_, i) => {
    const d = gridStart.plus({ days: i })
    const iso = d.toISODate()!
    return {
      iso,
      day: d.day,
      inMonth: d.month === month,
      isToday: iso === today,
      citas: citas.filter(c => c.fecha_inicio.startsWith(iso)),
    }
  })

  // Recortar a 35 si la última semana es toda fuera de mes
  return cells[34].inMonth || cells[35].inMonth ? cells : cells.slice(0, 35)
}
