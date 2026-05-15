'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react'
import type { CitaRecepcion } from '@/modules/agenda/queries'

// ─── Constantes ────────────────────────────────────────────────────────────────

const OPERATIVO_DOT: Record<string, string> = {
  'Agendada':                                       'bg-indigo-400',
  'Realizada':                                      'bg-slate-400',
  'No realizada (presente)':                        'bg-orange-400',
  'No asistió':                                     'bg-red-500',
  'Cancelada por clínica':                          'bg-rose-400',
  'Cancelada por paciente dentro de plazo':         'bg-rose-300',
  'Cancelada por paciente fuera de plazo':          'bg-red-300',
}

const DIAS_SEMANA = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do']

// ─── Helpers ───────────────────────────────────────────────────────────────────

function getMonthGrid(mesStart: string): Array<string | null> {
  const [year, month] = mesStart.split('-').map(Number)
  const firstDay = new Date(year, month - 1, 1)
  const lastDay  = new Date(year, month, 0)

  // Offset: 0=Lun, 1=Mar, ..., 6=Dom
  const offset = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1

  const cells: Array<string | null> = Array(offset).fill(null)
  for (let d = 1; d <= lastDay.getDate(); d++) {
    const str = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    cells.push(str)
  }

  // Rellenar hasta completar la última semana
  while (cells.length % 7 !== 0) cells.push(null)

  return cells
}

function fmtMesHeader(mesStart: string): string {
  const d = new Date(mesStart + 'T12:00:00')
  const mes = d.toLocaleDateString('es-CL', { month: 'long' })
  const año = d.getFullYear()
  return mes.charAt(0).toUpperCase() + mes.slice(1) + ' ' + año
}

function shiftMonth(mesStart: string, months: number): string {
  const [year, month] = mesStart.split('-').map(Number)
  const d = new Date(year, month - 1 + months, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
}

function isoToDate(iso: string, tz: string): string {
  return new Date(iso).toLocaleDateString('en-CA', { timeZone: tz })
}

function isToday(fecha: string): boolean {
  return fecha === new Date().toISOString().slice(0, 10)
}

function currentMesStart(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
}

// ─── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  citas:       CitaRecepcion[]
  mesStart:    string
  timezone:    string
  empresaSlug: string
}

// ─── Componente ────────────────────────────────────────────────────────────────

export default function AgendaRecepcionMesClient({
  citas,
  mesStart,
  timezone,
  empresaSlug,
}: Props) {
  const router = useRouter()

  const grid = getMonthGrid(mesStart)

  // Agrupar citas por fecha local
  const citasPorDia = citas.reduce<Record<string, CitaRecepcion[]>>((acc, c) => {
    const d = isoToDate(c.fecha_inicio, timezone)
    if (!acc[d]) acc[d] = []
    acc[d].push(c)
    return acc
  }, {})

  function navMonth(months: number) {
    router.push(`/${empresaSlug}/agenda/recepcion/mes?fecha=${shiftMonth(mesStart, months)}`)
  }

  function goToDay(fecha: string) {
    router.push(`/${empresaSlug}/agenda/recepcion?fecha=${fecha}`)
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
            href={`/${empresaSlug}/agenda/recepcion?fecha=${mesStart}`}
            className="px-3 py-1.5 text-xs font-bold rounded-lg text-slate-500 hover:text-slate-700 transition-colors"
          >
            Día
          </Link>
          <Link
            href={`/${empresaSlug}/agenda/recepcion/semana?fecha=${mesStart}`}
            className="px-3 py-1.5 text-xs font-bold rounded-lg text-slate-500 hover:text-slate-700 transition-colors"
          >
            Semana
          </Link>
          <span className="px-3 py-1.5 text-xs font-black rounded-lg bg-white text-indigo-700 shadow-sm select-none">
            Mes
          </span>
        </div>

        <div className="flex-1" />

        {/* Navegación de mes */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => navMonth(-1)}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm font-bold text-slate-700 w-44 text-center select-none">
            {fmtMesHeader(mesStart)}
          </span>
          <button
            onClick={() => navMonth(1)}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => router.push(`/${empresaSlug}/agenda/recepcion/mes?fecha=${currentMesStart()}`)}
            className="ml-1 px-3 py-1.5 text-xs font-black rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors"
          >
            Hoy
          </button>
        </div>

        <div className="flex-1" />

        <span className="text-xs text-slate-400 font-bold">
          {citas.length} cita{citas.length !== 1 ? 's' : ''} este mes
        </span>
      </header>

      {/* ── Calendario ── */}
      <div className="flex-1 overflow-auto p-4">
        <div className="max-w-5xl mx-auto">

          {/* Cabeceras de días de semana */}
          <div className="grid grid-cols-7 mb-1">
            {DIAS_SEMANA.map(d => (
              <div key={d} className="text-center text-xs font-black text-slate-400 uppercase tracking-wider py-2">
                {d}
              </div>
            ))}
          </div>

          {/* Celdas del mes */}
          <div className="grid grid-cols-7 gap-1">
            {grid.map((fecha, idx) => {
              if (!fecha) {
                return <div key={`empty-${idx}`} className="aspect-square" />
              }

              const citasDia = citasPorDia[fecha] ?? []
              const today    = isToday(fecha)
              const hasCitas = citasDia.length > 0

              // Agrupar dots por estado_operativo (máx 4 únicos)
              const dots = [...new Set(citasDia.map(c => c.estado_operativo))].slice(0, 4)

              return (
                <button
                  key={fecha}
                  onClick={() => goToDay(fecha)}
                  className={[
                    'aspect-square rounded-xl flex flex-col items-center justify-start pt-2 px-1 transition-all',
                    today
                      ? 'bg-indigo-600 shadow-lg shadow-indigo-200 text-white'
                      : hasCitas
                        ? 'bg-white hover:bg-indigo-50 text-slate-800 shadow-sm hover:shadow-md border border-slate-100'
                        : 'bg-white/60 hover:bg-slate-50 text-slate-400 border border-slate-100/60',
                  ].join(' ')}
                >
                  {/* Número del día */}
                  <span className={`text-sm font-black leading-none ${today ? 'text-white' : hasCitas ? 'text-slate-800' : 'text-slate-400'}`}>
                    {parseInt(fecha.split('-')[2])}
                  </span>

                  {/* Dots de estados */}
                  {hasCitas && (
                    <div className="flex flex-wrap justify-center gap-0.5 mt-1.5 px-0.5">
                      {dots.map(estado => (
                        <span
                          key={estado}
                          className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                            today ? 'bg-white/70' : (OPERATIVO_DOT[estado] ?? 'bg-slate-300')
                          }`}
                        />
                      ))}
                    </div>
                  )}

                  {/* Contador */}
                  {hasCitas && (
                    <span className={`mt-auto mb-1.5 text-[9px] font-black ${
                      today ? 'text-white/80' : 'text-slate-500'
                    }`}>
                      {citasDia.length}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
