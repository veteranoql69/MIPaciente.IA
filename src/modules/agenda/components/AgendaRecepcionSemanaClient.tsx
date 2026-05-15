'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react'
import type { CitaRecepcion, MedicoRecepcion } from '@/modules/agenda/queries'

// ─── Constantes ────────────────────────────────────────────────────────────────

const OPERATIVO_BORDER: Record<string, string> = {
  'Agendada':                                       'border-l-indigo-400',
  'Realizada':                                      'border-l-slate-400',
  'No realizada (presente)':                        'border-l-orange-400',
  'No asistió':                                     'border-l-red-500',
  'Cancelada por clínica':                          'border-l-rose-400',
  'Cancelada por paciente dentro de plazo':         'border-l-rose-300',
  'Cancelada por paciente fuera de plazo':          'border-l-red-300',
}

const PAGO_BADGE: Record<string, string> = {
  'No pagado':    'bg-red-100 text-red-700',
  'Pago parcial': 'bg-yellow-100 text-yellow-700',
  'Pago total':   'bg-green-100 text-green-700',
  'Cortesía':     'bg-purple-100 text-purple-700',
  'Reembolsado':  'bg-slate-100 text-slate-600',
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function shiftWeek(semanaStart: string, weeks: number): string {
  const d = new Date(semanaStart + 'T12:00:00')
  d.setDate(d.getDate() + weeks * 7)
  return d.toISOString().slice(0, 10)
}

function getWeekDays(semanaStart: string): string[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(semanaStart + 'T12:00:00')
    d.setDate(d.getDate() + i)
    return d.toISOString().slice(0, 10)
  })
}

function fmtDayHeader(fecha: string): { dia: string; num: string; mes: string } {
  const d = new Date(fecha + 'T12:00:00')
  const dia = d.toLocaleDateString('es-CL', { weekday: 'short' })
  const num = d.toLocaleDateString('es-CL', { day: 'numeric' })
  const mes = d.toLocaleDateString('es-CL', { month: 'short' })
  return {
    dia: dia.charAt(0).toUpperCase() + dia.slice(1, 3),
    num,
    mes: mes.charAt(0).toUpperCase() + mes.slice(1, 3),
  }
}

function fmtRangoSemana(semanaStart: string): string {
  const inicio = new Date(semanaStart + 'T12:00:00')
  const fin = new Date(semanaStart + 'T12:00:00')
  fin.setDate(fin.getDate() + 6)

  const mesIni = inicio.toLocaleDateString('es-CL', { month: 'long' })
  const mesFin = fin.toLocaleDateString('es-CL', { month: 'long' })
  const año    = fin.getFullYear()

  if (inicio.getMonth() === fin.getMonth()) {
    return `${inicio.getDate()}–${fin.getDate()} de ${mesIni} ${año}`
  }
  return `${inicio.getDate()} ${mesIni} – ${fin.getDate()} ${mesFin} ${año}`
}

function fmtTime(iso: string, tz: string): string {
  return new Date(iso).toLocaleTimeString('es-CL', {
    timeZone: tz, hour: '2-digit', minute: '2-digit', hour12: false,
  })
}

function isoToDate(iso: string, tz: string): string {
  return new Date(iso).toLocaleDateString('en-CA', { timeZone: tz }) // YYYY-MM-DD
}

function isToday(fecha: string): boolean {
  return fecha === new Date().toISOString().slice(0, 10)
}

// ─── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  citas:       CitaRecepcion[]
  medicos:     MedicoRecepcion[]
  semanaStart: string
  timezone:    string
  empresaSlug: string
}

// ─── Componente ────────────────────────────────────────────────────────────────

export default function AgendaRecepcionSemanaClient({
  citas,
  semanaStart,
  timezone,
  empresaSlug,
}: Props) {
  const router = useRouter()
  const [hoveredCita, setHoveredCita] = useState<string | null>(null)

  const dias = getWeekDays(semanaStart)
  const citasPorDia = dias.reduce<Record<string, CitaRecepcion[]>>((acc, d) => {
    acc[d] = citas.filter(c => isoToDate(c.fecha_inicio, timezone) === d)
    return acc
  }, {})

  const totalSemana = citas.length

  function navWeek(weeks: number) {
    const next = shiftWeek(semanaStart, weeks)
    router.push(`/${empresaSlug}/agenda/recepcion/semana?fecha=${next}`)
  }

  function goToDay(fecha: string) {
    router.push(`/${empresaSlug}/agenda/recepcion?fecha=${fecha}`)
  }

  function goToCita(citaId: string, fecha: string) {
    router.push(`/${empresaSlug}/agenda/recepcion?fecha=${fecha}&cita=${citaId}`)
  }

  return (
    <div className="flex flex-col h-dvh bg-slate-50 overflow-hidden">

      {/* ── Header ── */}
      <header className="shrink-0 flex items-center gap-3 px-5 py-3 bg-white border-b border-slate-200/60 shadow-sm">
        <Calendar className="w-5 h-5 text-indigo-500 shrink-0" />
        <span className="text-base font-black text-slate-900">Recepción</span>

        {/* Tabs de vista */}
        <div className="flex items-center bg-slate-100 rounded-xl p-1 gap-0.5 ml-1">
          <Link
            href={`/${empresaSlug}/agenda/recepcion?fecha=${semanaStart}`}
            className="px-3 py-1.5 text-xs font-bold rounded-lg text-slate-500 hover:text-slate-700 transition-colors"
          >
            Día
          </Link>
          <span className="px-3 py-1.5 text-xs font-black rounded-lg bg-white text-indigo-700 shadow-sm select-none">
            Semana
          </span>
          <Link
            href={`/${empresaSlug}/agenda/recepcion/mes?fecha=${semanaStart}`}
            className="px-3 py-1.5 text-xs font-bold rounded-lg text-slate-500 hover:text-slate-700 transition-colors"
          >
            Mes
          </Link>
        </div>

        <div className="flex-1" />

        {/* Navegación de semana */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => navWeek(-1)}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm font-bold text-slate-700 w-56 text-center select-none">
            {fmtRangoSemana(semanaStart)}
          </span>
          <button
            onClick={() => navWeek(1)}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              const today = new Date().toISOString().slice(0, 10)
              const day = new Date(today + 'T12:00:00').getDay()
              const diff = day === 0 ? -6 : 1 - day
              const d = new Date(today + 'T12:00:00')
              d.setDate(d.getDate() + diff)
              router.push(`/${empresaSlug}/agenda/recepcion/semana?fecha=${d.toISOString().slice(0, 10)}`)
            }}
            className="ml-1 px-3 py-1.5 text-xs font-black rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors"
          >
            Hoy
          </button>
        </div>

        <div className="flex-1" />

        <span className="text-xs text-slate-400 font-bold">
          {totalSemana} cita{totalSemana !== 1 ? 's' : ''} esta semana
        </span>
      </header>

      {/* ── Grid semanal ── */}
      <div className="flex flex-1 overflow-hidden">
        <div className="flex flex-1 overflow-auto">

          {/* Columnas de días */}
          <div className="flex min-w-full">
            {dias.map(dia => {
              const citasDia = citasPorDia[dia] ?? []
              const { dia: dStr, num, mes } = fmtDayHeader(dia)
              const today = isToday(dia)

              return (
                <div key={dia} className="flex-1 min-w-[140px] flex flex-col border-r border-slate-200/60 last:border-r-0">

                  {/* Cabecera del día */}
                  <button
                    onClick={() => goToDay(dia)}
                    className={[
                      'sticky top-0 z-10 flex flex-col items-center py-3 border-b border-slate-200/60 transition-colors',
                      today
                        ? 'bg-indigo-600 text-white'
                        : 'bg-white hover:bg-slate-50 text-slate-700',
                    ].join(' ')}
                  >
                    <span className={`text-[10px] font-black uppercase tracking-wider ${today ? 'text-indigo-100' : 'text-slate-400'}`}>
                      {dStr}
                    </span>
                    <span className={`text-xl font-black leading-none ${today ? 'text-white' : 'text-slate-800'}`}>
                      {num}
                    </span>
                    <span className={`text-[10px] font-bold ${today ? 'text-indigo-200' : 'text-slate-400'}`}>
                      {mes}
                    </span>
                    {citasDia.length > 0 && (
                      <span className={`mt-1 text-[10px] font-black px-1.5 py-0.5 rounded-full ${
                        today ? 'bg-white/20 text-white' : 'bg-indigo-100 text-indigo-600'
                      }`}>
                        {citasDia.length}
                      </span>
                    )}
                  </button>

                  {/* Citas del día */}
                  <div className="flex-1 overflow-y-auto p-2 space-y-1.5 bg-slate-50/50">
                    {citasDia.length === 0 && (
                      <div className="flex items-center justify-center h-16 text-xs text-slate-300 font-bold">
                        —
                      </div>
                    )}
                    {citasDia.map(cita => {
                      const borderColor = OPERATIVO_BORDER[cita.estado_operativo] ?? 'border-l-slate-300'
                      const pagoBadge  = PAGO_BADGE[cita.estado_pago] ?? 'bg-slate-100 text-slate-500'
                      const hovered    = hoveredCita === cita.id

                      return (
                        <button
                          key={cita.id}
                          onClick={() => goToCita(cita.id, dia)}
                          onMouseEnter={() => setHoveredCita(cita.id)}
                          onMouseLeave={() => setHoveredCita(null)}
                          className={[
                            'w-full text-left border-l-2 rounded-lg px-2.5 py-2 bg-white transition-all',
                            borderColor,
                            hovered ? 'shadow-md -translate-y-px' : 'shadow-sm',
                          ].join(' ')}
                        >
                          {/* Hora */}
                          <p className="text-[10px] font-black text-slate-500 tabular-nums">
                            {fmtTime(cita.fecha_inicio, timezone)}
                            {' – '}
                            {fmtTime(cita.fecha_fin, timezone)}
                          </p>

                          {/* Paciente */}
                          <p className="text-xs font-black text-slate-800 truncate mt-0.5">
                            {cita.contacto?.nombre ?? '—'}
                          </p>

                          {/* Servicio */}
                          {cita.servicio && (
                            <p className="text-[10px] text-slate-400 truncate">{cita.servicio.nombre}</p>
                          )}

                          {/* Doctor */}
                          {cita.medico && (
                            <p className="text-[10px] text-indigo-500 font-bold truncate mt-0.5">
                              {cita.medico.nombre_completo}
                            </p>
                          )}

                          {/* Estado pago */}
                          <span className={`mt-1 inline-block text-[9px] font-black px-1.5 py-0.5 rounded-full ${pagoBadge}`}>
                            {cita.estado_pago}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
