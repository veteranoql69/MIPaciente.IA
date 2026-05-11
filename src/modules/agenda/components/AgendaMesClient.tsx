'use client'

import { useState } from 'react'
import { User } from 'lucide-react'
import { AgendaViewNav } from './AgendaViewNav'
import type { CitaHoy, AntecedentePaciente } from '@/modules/agenda/queries'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTime(iso: string, tz: string) {
  return new Date(iso).toLocaleTimeString('es-CL', {
    hour: '2-digit', minute: '2-digit', timeZone: tz,
  })
}

function calcEdad(fechaNacimiento: string | null): string {
  if (!fechaNacimiento) return '—'
  const hoy = new Date()
  const nac = new Date(fechaNacimiento)
  let edad = hoy.getFullYear() - nac.getFullYear()
  if (hoy.getMonth() < nac.getMonth() || (hoy.getMonth() === nac.getMonth() && hoy.getDate() < nac.getDate())) edad--
  return `${edad} años`
}

function previsionLabel(p: string | null) {
  if (!p) return 'Sin previsión'
  const map: Record<string, string> = {
    fonasa: 'FONASA', isapre_banmedica: 'Bánmédica', isapre_colmena: 'Colmena',
    isapre_cruz_blanca: 'Cruz Blanca', particular: 'Particular',
  }
  return map[p] ?? p
}

function getCategoryDot(categoria: string | null | undefined) {
  switch (categoria) {
    case 'cirugia':       return 'bg-violet-500'
    case 'procedimiento': return 'bg-teal-500'
    case 'control':       return 'bg-slate-400'
    default:              return 'bg-indigo-400'
  }
}

// ─── Tipos ────────────────────────────────────────────────────────────────────

type DayCell = {
  iso: string       // YYYY-MM-DD
  day: number
  inMonth: boolean
  isToday: boolean
  citas: CitaHoy[]
}

type Props = {
  citas: CitaHoy[]
  antecedentes: Record<string, AntecedentePaciente>
  empresaSlug: string
  timezone: string
  calendarDays: DayCell[]
  prevHref: string
  nextHref: string
  fechaLabel: string
}

// ─── Panel antecedente ────────────────────────────────────────────────────────

function PanelDia({
  dayCell,
  antecedentes,
  onClose,
  timezone,
}: {
  dayCell: DayCell
  antecedentes: Record<string, AntecedentePaciente>
  onClose: () => void
  timezone: string
}) {
  return (
    <div className="w-72 flex-shrink-0 border-l border-slate-200 bg-white flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
        <span className="text-xs font-bold text-slate-600 uppercase tracking-wide">
          {new Date(dayCell.iso + 'T12:00:00').toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long' })}
        </span>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-lg leading-none">&times;</button>
      </div>

      <div className="overflow-y-auto flex-1 p-4 space-y-3">
        {dayCell.citas.length === 0 ? (
          <p className="text-slate-400 text-xs text-center py-8">Sin citas este día</p>
        ) : (
          dayCell.citas.map(cita => {
            const ant = cita.contacto?.id ? antecedentes[cita.contacto.id] : null
            return (
              <div key={cita.id} className="rounded-xl border border-slate-200 p-3 space-y-2 bg-white shadow-sm">
                <div className="flex items-start gap-2">
                  <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center shrink-0 mt-0.5">
                    <User className="w-3 h-3 text-indigo-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-800 truncate">{cita.contacto?.nombre ?? '—'}</p>
                    <p className="text-[10px] text-slate-500">{formatTime(cita.fecha_inicio, timezone)} · {cita.servicio?.nombre}</p>
                  </div>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${
                    cita.estado_operativo === 'Realizada' ? 'bg-blue-100 text-blue-700'
                    : 'bg-amber-100 text-amber-700'
                  }`}>
                    {cita.estado_operativo}
                  </span>
                </div>

                {ant && (
                  <div className="ml-9 space-y-1">
                    {ant.alergias.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {ant.alergias.map(a => (
                          <span key={a.id} className="px-1.5 py-0.5 bg-red-50 text-red-700 border border-red-200 rounded text-[9px] font-medium">
                            {a.sustancia}
                          </span>
                        ))}
                      </div>
                    )}
                    <p className="text-[10px] text-slate-500">
                      {calcEdad(ant.fecha_nacimiento)} · {previsionLabel(ant.prevision)}
                    </p>
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>

      {/* Stats del día */}
      <div className="border-t border-slate-100 px-4 py-3">
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <p className="text-lg font-bold text-slate-800">{dayCell.citas.length}</p>
            <p className="text-[9px] text-slate-400 uppercase tracking-wide">Citas</p>
          </div>
          <div>
            <p className="text-lg font-bold text-slate-800">
              {dayCell.citas.filter(c => c.estado_operativo === 'Realizada').length}
            </p>
            <p className="text-[9px] text-slate-400 uppercase tracking-wide">Realizadas</p>
          </div>
          <div>
            <p className="text-lg font-bold text-indigo-600">
              {new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 })
                .format(dayCell.citas.reduce((s, c) => s + (c.precio_base ?? 0), 0))}
            </p>
            <p className="text-[9px] text-slate-400 uppercase tracking-wide">Total</p>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Celda de día ─────────────────────────────────────────────────────────────

function DayCellView({
  cell,
  isSelected,
  onSelect,
  timezone,
}: {
  cell: DayCell
  isSelected: boolean
  onSelect: () => void
  timezone: string
}) {
  const MAX_PILLS = 3

  return (
    <button
      onClick={onSelect}
      className={`min-h-[100px] p-2 text-left border-b border-r border-slate-100 flex flex-col transition-colors ${
        !cell.inMonth ? 'bg-slate-50/60' : 'bg-white hover:bg-indigo-50/20'
      } ${isSelected ? 'ring-2 ring-inset ring-indigo-400' : ''} ${cell.isToday ? 'bg-indigo-50/40' : ''}`}
    >
      <span className={`text-xs font-bold self-start mb-1 w-6 h-6 flex items-center justify-center rounded-full ${
        cell.isToday
          ? 'bg-indigo-600 text-white'
          : cell.inMonth ? 'text-slate-700' : 'text-slate-300'
      }`}>
        {cell.day}
      </span>

      <div className="flex-1 space-y-0.5 overflow-hidden">
        {cell.citas.slice(0, MAX_PILLS).map(cita => (
          <div key={cita.id} className="flex items-center gap-1 truncate">
            <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${getCategoryDot(cita.servicio?.categoria)}`} />
            <span className="text-[10px] text-slate-600 truncate">
              {formatTime(cita.fecha_inicio, timezone)} {cita.contacto?.nombre ?? ''}
            </span>
          </div>
        ))}
        {cell.citas.length > MAX_PILLS && (
          <p className="text-[9px] text-slate-400 font-semibold">+{cell.citas.length - MAX_PILLS} más</p>
        )}
      </div>
    </button>
  )
}

// ─── Componente principal ──────────────────────────────────────────────────────

const DOW_LABELS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

export default function AgendaMesClient({
  citas: _citas,
  antecedentes,
  empresaSlug,
  timezone,
  calendarDays,
  prevHref,
  nextHref,
  fechaLabel,
}: Props) {
  const [selectedIso, setSelectedIso] = useState<string | null>(null)

  const selectedCell = calendarDays.find(d => d.iso === selectedIso) ?? null

  // Summary stats for the month (inMonth cells only)
  const inMonthCitas = calendarDays.filter(d => d.inMonth).flatMap(d => d.citas)
  const totalMes = inMonthCitas.reduce((s, c) => s + (c.precio_base ?? 0), 0)

  return (
    <div className="flex flex-col h-full">
      <AgendaViewNav
        empresaSlug={empresaSlug}
        fechaLabel={fechaLabel}
        prevHref={prevHref}
        nextHref={nextHref}
      />

      {/* Stats bar */}
      <div className="flex gap-6 px-5 py-2 border-b border-slate-100 bg-white">
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">Citas en el mes:</span>
          <span className="text-sm font-bold text-slate-800">{inMonthCitas.length}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">Realizadas:</span>
          <span className="text-sm font-bold text-blue-700">{inMonthCitas.filter(c => c.estado_operativo === 'Realizada').length}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">Facturado:</span>
          <span className="text-sm font-bold text-indigo-600">
            {new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(totalMes)}
          </span>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Calendar grid */}
        <div className="flex-1 overflow-auto">
          {/* Dow headers */}
          <div className="grid grid-cols-7 border-b border-slate-200 sticky top-0 bg-white z-10">
            {DOW_LABELS.map(d => (
              <div key={d} className="text-center py-2 text-[10px] font-bold text-slate-400 uppercase tracking-wide border-r border-slate-100 last:border-r-0">
                {d}
              </div>
            ))}
          </div>

          {/* Weeks rows */}
          <div className="grid grid-cols-7">
            {calendarDays.map(cell => (
              <DayCellView
                key={cell.iso}
                cell={cell}
                timezone={timezone}
                isSelected={selectedIso === cell.iso}
                onSelect={() => setSelectedIso(prev => (prev === cell.iso ? null : cell.iso))}
              />
            ))}
          </div>
        </div>

        {/* Day detail panel */}
        {selectedCell && (
          <PanelDia
            dayCell={selectedCell}
            antecedentes={antecedentes}
            timezone={timezone}
            onClose={() => setSelectedIso(null)}
          />
        )}
      </div>
    </div>
  )
}
