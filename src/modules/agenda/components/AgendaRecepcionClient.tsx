'use client'

import { useState, useTransition, useCallback, useEffect, useMemo, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Calendar, ChevronLeft, ChevronRight, Plus, X,
  Phone, Mail, CheckCircle, Circle, Loader2,
} from 'lucide-react'
import { actualizarEstadoCita } from '@/modules/agenda/actions'
import NuevaCitaModal from './NuevaCitaModal'
import type { CitaRecepcion, MedicoRecepcion } from '@/modules/agenda/queries'
import type { SelectOption, ServicioOption, SalaOption } from './NuevaCitaModal'

// ─── Constantes de timeline ────────────────────────────────────────────────────

const HOUR_START = 7
const HOUR_END   = 20
const HOUR_H     = 64   // px por hora
const TOTAL_H    = (HOUR_END - HOUR_START) * HOUR_H

// ─── Estados válidos ───────────────────────────────────────────────────────────

const ESTADOS_OPERATIVOS = [
  'Agendada',
  'Realizada',
  'No realizada (presente)',
  'No asistió',
  'Cancelada por clínica',
  'Cancelada por paciente dentro de plazo',
  'Cancelada por paciente fuera de plazo',
] as const

// ─── Densidad de columnas ─────────────────────────────────────────────────────

type ColDensity = 'sm' | 'md' | 'lg'
const COL_MIN_W: Record<ColDensity, number> = { sm: 110, md: 160, lg: 220 }

// ─── Mapas de color ────────────────────────────────────────────────────────────

const OPERATIVO_STYLE: Record<string, string> = {
  'Agendada':                                       'border-l-indigo-400 bg-indigo-50 text-indigo-900',
  'Realizada':                                      'border-l-slate-400  bg-slate-50  text-slate-700',
  'No realizada (presente)':                        'border-l-orange-400 bg-orange-50 text-orange-900',
  'No asistió':                                     'border-l-red-500    bg-red-50    text-red-900',
  'Cancelada por clínica':                          'border-l-rose-400   bg-rose-50   text-rose-800',
  'Cancelada por paciente dentro de plazo':         'border-l-rose-300   bg-rose-50   text-rose-700',
  'Cancelada por paciente fuera de plazo':          'border-l-red-300    bg-red-50    text-red-700',
}

const PAGO_BADGE: Record<string, string> = {
  'No pagado':    'bg-red-100    text-red-700',
  'Pago parcial': 'bg-yellow-100 text-yellow-700',
  'Pago total':   'bg-green-100  text-green-700',
  'Cortesía':     'bg-purple-100 text-purple-700',
  'Reembolsado':  'bg-slate-100  text-slate-600',
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function topPx(iso: string, tz: string): number {
  const local = new Date(iso).toLocaleString('en-US', {
    timeZone: tz, hour: '2-digit', minute: '2-digit', hour12: false,
  })
  const [h, m] = local.split(':').map(Number)
  return Math.max(0, ((h - HOUR_START) * 60 + m) * (HOUR_H / 60))
}

function heightPx(inicio: string, fin: string): number {
  const mins = (new Date(fin).getTime() - new Date(inicio).getTime()) / 60000
  return Math.max(28, mins * (HOUR_H / 60))
}

function fmtTime(iso: string, tz: string): string {
  return new Date(iso).toLocaleTimeString('es-CL', {
    timeZone: tz, hour: '2-digit', minute: '2-digit', hour12: false,
  })
}

function fmtDate(fecha: string): string {
  const d   = new Date(fecha + 'T12:00:00')
  const str = d.toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long' })
  return str.charAt(0).toUpperCase() + str.slice(1)
}

function shiftDate(fecha: string, days: number): string {
  const d = new Date(fecha + 'T12:00:00')
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

function initials(nombre: string): string {
  return nombre.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
}

// ─── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  citas:          CitaRecepcion[]
  medicos:        MedicoRecepcion[]
  fecha:          string
  timezone:       string
  empresaSlug:    string
  servicios:      ServicioOption[]
  sucursales:     SelectOption[]
  salas:          SalaOption[]
  selectedCitaId?: string
}

// ─── Componente principal ──────────────────────────────────────────────────────

export default function AgendaRecepcionClient({
  citas: citasInit,
  medicos,
  fecha,
  timezone,
  empresaSlug,
  servicios,
  sucursales,
  salas,
  selectedCitaId,
}: Props) {
  const router = useRouter()
  const [citas, setCitas]           = useState<CitaRecepcion[]>(citasInit)
  const [selectedId, setSelectedId] = useState<string | null>(selectedCitaId ?? null)
  const [isPending, startTransition] = useTransition()
  const [showModal, setShowModal]   = useState(false)
  const [density, setDensity]       = useState<ColDensity>('md')
  const [colWidths, setColWidths]   = useState<Record<string, number>>({})
  const [panelWidth, setPanelWidth] = useState(420)
  const [isResizing, setIsResizing] = useState(false)
  const resizeRef      = useRef<{ id: string; startX: number; startW: number } | null>(null)
  const panelWidthRef  = useRef(420)

  // Mantener ref del panel en sync para persistir al soltar
  useEffect(() => { panelWidthRef.current = panelWidth }, [panelWidth])

  // Cargar densidad + anchos de columna + ancho del panel desde localStorage
  useEffect(() => {
    const saved = localStorage.getItem('recepcion-density') as ColDensity | null
    const d = (saved && COL_MIN_W[saved]) ? saved : 'md'
    setDensity(d)
    const w = COL_MIN_W[d]
    const initial: Record<string, number> = {}
    medicos.forEach(m => { initial[m.id] = w })
    setColWidths(initial)

    const savedPW = parseInt(localStorage.getItem('recepcion-panel-width') ?? '0')
    if (savedPW >= 320 && savedPW <= 860) setPanelWidth(savedPW)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function handleDensity(d: ColDensity) {
    setDensity(d)
    localStorage.setItem('recepcion-density', d)
    // Resetear anchos individuales al nuevo default
    const w = COL_MIN_W[d]
    const reset: Record<string, number> = {}
    medicos.forEach(m => { reset[m.id] = w })
    setColWidths(reset)
  }

  // Drag-to-resize de columnas (estilo Excel)
  function startResize(e: React.MouseEvent, medicoId: string) {
    e.preventDefault()
    resizeRef.current = {
      id: medicoId,
      startX: e.clientX,
      startW: colWidths[medicoId] ?? COL_MIN_W[density],
    }
    setIsResizing(true)

    function onMove(ev: MouseEvent) {
      if (!resizeRef.current) return
      const delta = ev.clientX - resizeRef.current.startX
      const newW  = Math.max(80, resizeRef.current.startW + delta)
      setColWidths(prev => ({ ...prev, [resizeRef.current!.id]: newW }))
    }
    function onUp() {
      resizeRef.current = null
      setIsResizing(false)
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
    }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }

  // Drag-to-resize del panel derecho (handle en el borde izquierdo)
  function startPanelResize(e: React.MouseEvent) {
    e.preventDefault()
    const startX = e.clientX
    const startW = panelWidthRef.current
    setIsResizing(true)

    function onMove(ev: MouseEvent) {
      // Arrastrar hacia la izquierda = panel más ancho
      const delta = ev.clientX - startX
      const newW  = Math.max(320, Math.min(860, startW - delta))
      setPanelWidth(newW)
    }
    function onUp() {
      setIsResizing(false)
      localStorage.setItem('recepcion-panel-width', String(panelWidthRef.current))
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
    }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }

  // Scroll automático a la cita pre-seleccionada (navegación desde semana)
  useEffect(() => {
    if (selectedCitaId) {
      const el = document.getElementById(`cita-${selectedCitaId}`)
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Posición de la hora actual en el timeline
  const nowPx = useMemo(() => {
    const now = new Date()
    const localStr = now.toLocaleString('en-US', {
      timeZone: timezone, hour: '2-digit', minute: '2-digit', hour12: false,
    })
    const [h, m] = localStr.split(':').map(Number)
    if (h < HOUR_START || h >= HOUR_END) return null
    return ((h - HOUR_START) * 60 + m) * (HOUR_H / 60)
  }, [timezone])

  const selectedCita = citas.find(c => c.id === selectedId) ?? null
  const hours = Array.from({ length: HOUR_END - HOUR_START }, (_, i) => HOUR_START + i)

  const navigate = useCallback((d: string) => {
    router.push(`/${empresaSlug}/agenda/recepcion?fecha=${d}`)
  }, [router, empresaSlug])

  const handleUpdateEstado = useCallback((
    campo: 'estado_operativo' | 'estado_confirmacion' | 'estado_pago',
    valor: string
  ) => {
    if (!selectedId) return
    // Optimistic
    setCitas(prev => prev.map(c => c.id === selectedId ? { ...c, [campo]: valor } : c))
    startTransition(async () => {
      const res = await actualizarEstadoCita(selectedId, campo, valor, empresaSlug)
      if (!res.ok) router.refresh()
    })
  }, [selectedId, empresaSlug, router])

  return (
    <div className={`flex flex-col h-dvh bg-slate-50 overflow-hidden${isResizing ? ' cursor-col-resize select-none' : ''}`}>

      {/* ── Header ── */}
      <header className="shrink-0 flex items-center gap-3 px-5 py-3 bg-white border-b border-slate-200/60 shadow-sm">
        <Calendar className="w-5 h-5 text-indigo-500 shrink-0" />
        <span className="text-base font-black text-slate-900">Recepción</span>

        {/* Tabs de vista */}
        <div className="flex items-center bg-slate-100 rounded-xl p-1 gap-0.5 ml-1">
          <span className="px-3 py-1.5 text-xs font-black rounded-lg bg-white text-indigo-700 shadow-sm select-none">
            Día
          </span>
          <Link
            href={`/${empresaSlug}/agenda/recepcion/semana?fecha=${fecha}`}
            className="px-3 py-1.5 text-xs font-bold rounded-lg text-slate-500 hover:text-slate-700 transition-colors"
          >
            Semana
          </Link>
          <Link
            href={`/${empresaSlug}/agenda/recepcion/mes?fecha=${fecha}`}
            className="px-3 py-1.5 text-xs font-bold rounded-lg text-slate-500 hover:text-slate-700 transition-colors"
          >
            Mes
          </Link>
        </div>

        <div className="flex-1" />

        {/* Navegación de fecha */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => navigate(shiftDate(fecha, -1))}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm font-bold text-slate-700 w-52 text-center select-none">
            {fmtDate(fecha)}
          </span>
          <button
            onClick={() => navigate(shiftDate(fecha, 1))}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => navigate(new Date().toISOString().slice(0, 10))}
            className="ml-1 px-3 py-1.5 text-xs font-black rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors"
          >
            Hoy
          </button>
        </div>

        <div className="flex-1" />

        {/* Toggle densidad de columnas */}
        <div className="flex items-center bg-slate-100 rounded-xl p-1 gap-0.5" title="Ancho de columnas">
          {(['sm', 'md', 'lg'] as const).map(d => (
            <button
              key={d}
              onClick={() => handleDensity(d)}
              title={{ sm: 'Compacto', md: 'Normal', lg: 'Amplio' }[d]}
              className={[
                'px-2.5 py-1.5 rounded-lg text-xs font-black transition-all',
                density === d
                  ? 'bg-white text-slate-800 shadow-sm'
                  : 'text-slate-400 hover:text-slate-600',
              ].join(' ')}
            >
              {{ sm: 'S', md: 'M', lg: 'L' }[d]}
            </button>
          ))}
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-black rounded-xl hover:bg-indigo-700 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Nueva Cita
        </button>
      </header>

      {/* ── Cuerpo ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── Timeline ── */}
        <div className={`flex-1 overflow-auto min-w-0${isResizing ? ' select-none cursor-col-resize' : ''}`}>

          {/* Cabecera de médicos (sticky) */}
          <div className="sticky top-0 z-20 bg-white border-b border-slate-200/60 flex shadow-sm">
            <div className="w-16 shrink-0" />
            {medicos.map(m => {
              const colW = colWidths[m.id] ?? COL_MIN_W[density]
              return (
                <div
                  key={m.id}
                  className="relative shrink-0 px-3 py-3 border-l border-slate-100 border-t-2 border-t-indigo-200"
                  style={{ width: colW }}
                >
                  <div className="flex items-center gap-2 pr-2">
                    <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
                      <span className="text-[10px] font-black text-indigo-700">{initials(m.nombre_completo)}</span>
                    </div>
                    <span className="text-xs font-black text-slate-800 truncate">{m.nombre_completo}</span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-0.5 pl-9">
                    {citas.filter(c => c.medico?.id === m.id).length} citas
                  </p>

                  {/* Handle de resize — arrastre estilo Excel */}
                  <div
                    onMouseDown={e => startResize(e, m.id)}
                    className="absolute right-0 top-0 bottom-0 w-3 cursor-col-resize z-10 group flex items-center justify-center"
                    title="Arrastra para cambiar el ancho"
                  >
                    <div className="w-px h-4 bg-slate-300 group-hover:bg-indigo-400 group-hover:h-full transition-all duration-150 rounded-full" />
                  </div>
                </div>
              )
            })}
            {medicos.length === 0 && <div className="flex-1 px-4 py-3 text-xs text-slate-400">Sin médicos asignados</div>}
          </div>

          {/* Grilla */}
          <div className="flex" style={{ height: TOTAL_H }}>

            {/* Etiquetas de hora */}
            <div className="w-16 shrink-0 relative bg-white border-r border-slate-100">
              {hours.map(h => (
                <div
                  key={h}
                  className="absolute w-full border-t border-slate-100 flex items-start justify-end pr-2 pt-1"
                  style={{ top: (h - HOUR_START) * HOUR_H, height: HOUR_H }}
                >
                  <span className="text-[10px] font-bold text-slate-400 tabular-nums">
                    {String(h).padStart(2, '0')}:00
                  </span>
                </div>
              ))}
            </div>

            {/* Columnas de médicos */}
            {medicos.map(m => {
              const citasMedico = citas.filter(c => c.medico?.id === m.id)
              return (
                <div
                  key={m.id}
                  className="relative shrink-0 border-l border-slate-100"
                  style={{ height: TOTAL_H, width: colWidths[m.id] ?? COL_MIN_W[density] }}
                >
                  {/* Líneas de hora */}
                  {hours.map(h => (
                    <div key={h} className="absolute w-full border-t border-slate-100"
                      style={{ top: (h - HOUR_START) * HOUR_H }} />
                  ))}
                  {/* Líneas de media hora */}
                  {hours.map(h => (
                    <div key={`${h}h`} className="absolute w-full border-t border-slate-50/80"
                      style={{ top: (h - HOUR_START) * HOUR_H + HOUR_H / 2 }} />
                  ))}

                  {/* Indicador de hora actual */}
                  {nowPx !== null && (
                    <div
                      className="absolute left-0 right-0 z-20 pointer-events-none flex items-center"
                      style={{ top: nowPx }}
                    >
                      <div className="w-2 h-2 rounded-full bg-red-500 shrink-0 -ml-1" />
                      <div className="flex-1 border-t-2 border-red-400 opacity-70" />
                    </div>
                  )}

                  {/* Bloques de cita */}
                  {citasMedico.map(cita => {
                    const top    = topPx(cita.fecha_inicio, timezone)
                    const height = heightPx(cita.fecha_inicio, cita.fecha_fin)
                    const colStyle = OPERATIVO_STYLE[cita.estado_operativo] ?? 'border-l-slate-300 bg-white text-slate-700'
                    const sel    = cita.id === selectedId

                    return (
                      <button
                        key={cita.id}
                        id={`cita-${cita.id}`}
                        onClick={() => setSelectedId(sel ? null : cita.id)}
                        className={[
                          'absolute left-1 right-1 rounded-lg border-l-4 px-2 py-1 text-left overflow-hidden',
                          'transition-all duration-150 cursor-pointer active:scale-[0.97]',
                          colStyle,
                          sel
                            ? 'ring-2 ring-indigo-500 ring-offset-2 shadow-lg scale-[1.01] z-10'
                            : 'hover:shadow-md hover:-translate-y-0.5 hover:z-[2] z-[1]',
                        ].join(' ')}
                        style={{ top: top + 1, height: height - 2 }}
                      >
                        <div className="flex items-start justify-between gap-1">
                          <span className="text-[11px] font-black leading-tight truncate">
                            {cita.contacto?.nombre ?? 'Sin nombre'}
                          </span>
                          {cita.estado_confirmacion === 'confirmada' && (
                            <CheckCircle className="w-3 h-3 shrink-0 text-green-500 mt-0.5" />
                          )}
                        </div>
                        {height > 36 && (
                          <span className="text-[10px] opacity-70 block leading-none">
                            {fmtTime(cita.fecha_inicio, timezone)}–{fmtTime(cita.fecha_fin, timezone)}
                          </span>
                        )}
                        {height > 54 && cita.servicio && (
                          <span className="text-[10px] opacity-60 truncate block">{cita.servicio.nombre}</span>
                        )}
                        {height > 68 && (
                          <span className={`mt-0.5 inline-flex text-[9px] font-black px-1.5 py-0.5 rounded-full ${PAGO_BADGE[cita.estado_pago] ?? ''}`}>
                            {cita.estado_pago}
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>
              )
            })}
          </div>
        </div>

        {/* ── Panel derecho redimensionable ── */}
        <div
          className="relative shrink-0 flex flex-col border-l border-slate-200 bg-white"
          style={{ width: panelWidth }}
        >
          {/* Handle de resize — borde izquierdo, arrastra para cambiar ancho */}
          <div
            onMouseDown={startPanelResize}
            className="absolute left-0 top-0 bottom-0 w-2 z-20 cursor-col-resize group"
            title="Arrastra para cambiar el ancho del panel"
          >
            <div className="absolute left-0.5 top-0 bottom-0 w-px bg-slate-200 group-hover:bg-indigo-400 group-hover:w-0.5 transition-all" />
          </div>

          {selectedCita ? (
            <DetailPanel
              cita={selectedCita}
              timezone={timezone}
              isPending={isPending}
              onClose={() => setSelectedId(null)}
              onUpdate={handleUpdateEstado}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center px-8">
                <div className="w-16 h-16 rounded-3xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
                  <Calendar className="w-7 h-7 text-slate-300" />
                </div>
                <p className="text-sm font-black text-slate-400">Selecciona una cita</p>
                <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
                  Haz clic en cualquier bloque para ver el detalle del paciente y gestionar el estado
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal nueva cita */}
      <NuevaCitaModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        medicos={medicos.map(m => ({ id: m.id, nombre: m.nombre_completo }))}
        servicios={servicios}
        sucursales={sucursales}
        salas={salas}
        empresaSlug={empresaSlug}
        timezone={timezone}
      />
    </div>
  )
}

// ─── Panel de detalle ──────────────────────────────────────────────────────────

const PAGO_PILL_COLORS: Record<string, { active: string; inactive: string }> = {
  'No pagado':    { active: 'bg-red-500 text-white border-red-500 shadow-sm',    inactive: 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100' },
  'Pago parcial': { active: 'bg-amber-500 text-white border-amber-500 shadow-sm', inactive: 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100' },
  'Cortesía':     { active: 'bg-violet-500 text-white border-violet-500 shadow-sm', inactive: 'bg-violet-50 text-violet-700 border-violet-200 hover:bg-violet-100' },
  'Reembolsado':  { active: 'bg-slate-500 text-white border-slate-500 shadow-sm',  inactive: 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200' },
}

function DetailPanel({
  cita, timezone, isPending, onClose, onUpdate,
}: {
  cita:      CitaRecepcion
  timezone:  string
  isPending: boolean
  onClose:   () => void
  onUpdate:  (campo: 'estado_operativo' | 'estado_confirmacion' | 'estado_pago', valor: string) => void
}) {
  const confirmada    = cita.estado_confirmacion === 'confirmada'
  const pagado        = cita.estado_pago === 'Pago total' || cita.estado_pago === 'Cortesía'
  const cancelada     = cita.estado_operativo.startsWith('Cancelada')
  const nombrePaciente = cita.contacto?.nombre ?? 'Sin nombre'

  return (
    <aside className="w-full flex flex-col overflow-hidden">

      {/* ── Cabecera del paciente ── */}
      <div className="px-5 py-4 border-b border-slate-100 bg-gradient-to-b from-slate-50 to-white shrink-0">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className="w-12 h-12 rounded-2xl bg-indigo-100 flex items-center justify-center shrink-0 mt-0.5">
              <span className="text-base font-black text-indigo-700">
                {initials(nombrePaciente)}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-base font-black text-slate-900 leading-snug">
                {nombrePaciente}
              </h2>
              <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1">
                {cita.contacto?.rut && (
                  <span className="text-xs text-slate-500 tabular-nums">RUT {cita.contacto.rut}</span>
                )}
                {cita.contacto?.prevision && (
                  <span className="text-xs font-black text-indigo-600">{cita.contacto.prevision}</span>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 transition-colors shrink-0"
            aria-label="Cerrar panel"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Botones de contacto */}
        <div className="flex gap-2">
          {cita.contacto?.telefono ? (
            <a
              href={`https://wa.me/${cita.contacto.telefono.replace(/\D/g, '')}`}
              target="_blank"
              rel="noreferrer"
              className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-green-50 text-green-700 text-sm font-bold rounded-xl hover:bg-green-100 transition-colors min-h-[44px]"
            >
              <Phone className="w-4 h-4" /> WhatsApp
            </a>
          ) : (
            <div className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-slate-100 text-slate-300 text-sm font-bold rounded-xl min-h-[44px] cursor-not-allowed select-none">
              <Phone className="w-4 h-4" /> Sin teléfono
            </div>
          )}
          {cita.contacto?.email ? (
            <a
              href={`mailto:${cita.contacto.email}`}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-sky-50 text-sky-700 text-sm font-bold rounded-xl hover:bg-sky-100 transition-colors min-h-[44px]"
            >
              <Mail className="w-4 h-4" /> Correo
            </a>
          ) : (
            <div className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-slate-100 text-slate-300 text-sm font-bold rounded-xl min-h-[44px] cursor-not-allowed select-none">
              <Mail className="w-4 h-4" /> Sin correo
            </div>
          )}
        </div>
      </div>

      {/* ── Contenido scrollable ── */}
      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">

        {/* Servicio y horario */}
        <div className="rounded-2xl bg-slate-50 p-4 space-y-1.5">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Servicio</p>
          <p className="text-base font-black text-slate-900 leading-snug">
            {cita.servicio?.nombre ?? '—'}
          </p>
          <p className="text-sm font-bold text-slate-700 tabular-nums">
            {fmtTime(cita.fecha_inicio, timezone)} – {fmtTime(cita.fecha_fin, timezone)}
            {cita.servicio && (
              <span className="text-slate-400 font-normal"> · {cita.servicio.duracion_minutos} min</span>
            )}
          </p>
          <p className="text-sm text-slate-500">{cita.medico?.nombre_completo ?? '—'}</p>
          {cita.sala && (
            <p className="text-xs text-slate-400">{cita.sala.nombre}</p>
          )}
        </div>

        {/* Confirmación de asistencia */}
        <div className="space-y-2">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
            Confirmación de Asistencia
          </p>
          <button
            onClick={() => onUpdate('estado_confirmacion', confirmada ? 'no_confirmada' : 'confirmada')}
            disabled={isPending}
            className={[
              'w-full flex items-center justify-center gap-2.5 rounded-2xl font-black text-sm transition-all min-h-[52px]',
              confirmada
                ? 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-md shadow-emerald-100'
                : 'bg-slate-100 text-slate-500 hover:bg-slate-200',
            ].join(' ')}
          >
            {isPending
              ? <Loader2 className="w-5 h-5 animate-spin" />
              : confirmada
                ? <CheckCircle className="w-5 h-5" />
                : <Circle className="w-5 h-5" />
            }
            {confirmada ? 'Paciente Confirmado ✓' : 'Marcar como Confirmado'}
          </button>
        </div>

        {/* Estado de Cita */}
        <div className="space-y-2">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
            Estado de Cita
          </p>
          <select
            value={cita.estado_operativo}
            onChange={e => onUpdate('estado_operativo', e.target.value)}
            disabled={isPending}
            className="w-full text-sm font-bold border-2 border-slate-200 rounded-2xl px-4 py-3 bg-white text-slate-800 focus:outline-none focus:border-indigo-300 cursor-pointer min-h-[52px]"
          >
            {ESTADOS_OPERATIVOS.map(e => (
              <option key={e} value={e}>{e}</option>
            ))}
          </select>
          <div className={`h-1.5 rounded-full transition-colors ${OPERATIVO_INDICATOR[cita.estado_operativo] ?? 'bg-slate-200'}`} />
        </div>

        {/* Estado de Pago — pill grid */}
        <div className="space-y-2">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
            Estado de Pago
          </p>

          {/* 4 estados secundarios en grid 2×2 */}
          <div className="grid grid-cols-2 gap-2">
            {(['No pagado', 'Pago parcial', 'Cortesía', 'Reembolsado'] as const).map(estado => {
              const active  = cita.estado_pago === estado
              const colors  = PAGO_PILL_COLORS[estado]
              return (
                <button
                  key={estado}
                  onClick={() => onUpdate('estado_pago', estado)}
                  disabled={isPending}
                  className={[
                    'flex items-center justify-center text-xs font-black rounded-xl border-2 px-3 py-3 transition-all min-h-[48px] leading-tight',
                    active ? colors.active : colors.inactive,
                  ].join(' ')}
                >
                  {estado}
                </button>
              )
            })}
          </div>

          {/* Pago total — acción principal */}
          <button
            onClick={() => onUpdate('estado_pago', 'Pago total')}
            disabled={isPending}
            className={[
              'w-full flex items-center justify-center gap-2.5 rounded-2xl font-black text-sm transition-all min-h-[52px] border-2',
              cita.estado_pago === 'Pago total'
                ? 'bg-emerald-500 text-white border-emerald-500 shadow-md shadow-emerald-100'
                : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100',
            ].join(' ')}
          >
            {cita.estado_pago === 'Pago total'
              ? <CheckCircle className="w-5 h-5" />
              : <CheckCircle className="w-5 h-5 opacity-60" />
            }
            Pago Total
          </button>
        </div>

        {/* Cierre Financiero */}
        <div className="rounded-2xl bg-slate-50 p-4 space-y-3">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
            Cierre Financiero
          </p>

          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-500">Precio del servicio</span>
              <span className="font-bold text-slate-700 tabular-nums">
                ${cita.precio_base.toLocaleString('es-CL')}
              </span>
            </div>
            <div className="border-t border-slate-200 pt-2 flex justify-between items-center">
              <span className="text-sm font-black text-slate-800">Total a cobrar</span>
              <span className="text-xl font-black text-slate-900 tabular-nums">
                ${cita.precio_base.toLocaleString('es-CL')}
              </span>
            </div>
          </div>

          {/* CTA cobrar — solo si no está pagado */}
          {!pagado && (
            <button
              onClick={() => onUpdate('estado_pago', 'Pago total')}
              disabled={isPending}
              className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-600 text-white text-sm font-black rounded-xl hover:bg-emerald-700 active:scale-[0.98] transition-all min-h-[52px] shadow-sm shadow-emerald-200 disabled:opacity-50"
            >
              {isPending
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <CheckCircle className="w-4 h-4" />
              }
              Cobrar — ${cita.precio_base.toLocaleString('es-CL')}
            </button>
          )}

          {pagado && (
            <div className="flex items-center justify-center gap-2 py-3 bg-emerald-50 text-emerald-700 text-sm font-black rounded-xl">
              <CheckCircle className="w-4 h-4" />
              {cita.estado_pago === 'Cortesía' ? 'Atendido como Cortesía' : 'Pago Registrado'}
            </div>
          )}
        </div>

      </div>

      {/* ── Footer: acción destructiva ── */}
      <div className="px-5 pb-5 pt-3 border-t border-slate-100 shrink-0">
        <button
          onClick={() => onUpdate('estado_operativo', 'Cancelada por clínica')}
          disabled={isPending || cancelada}
          className="w-full py-3 text-sm font-black bg-white text-rose-600 border-2 border-rose-200 rounded-2xl hover:bg-rose-50 active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed min-h-[48px]"
        >
          {cancelada ? 'Cita Cancelada' : 'Cancelar Cita'}
        </button>
      </div>
    </aside>
  )
}

// Barra indicadora de color bajo el select de estado operativo
const OPERATIVO_INDICATOR: Record<string, string> = {
  'Agendada':                                   'bg-indigo-400',
  'Realizada':                                  'bg-slate-400',
  'No realizada (presente)':                    'bg-orange-400',
  'No asistió':                                 'bg-red-500',
  'Cancelada por clínica':                      'bg-rose-400',
  'Cancelada por paciente dentro de plazo':     'bg-rose-300',
  'Cancelada por paciente fuera de plazo':      'bg-red-300',
}
