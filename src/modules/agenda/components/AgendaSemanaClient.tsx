'use client'

import { useState } from 'react'
import { User } from 'lucide-react'
import { AgendaViewNav } from './AgendaViewNav'
import type { CitaHoy, AntecedentePaciente } from '@/modules/agenda/queries'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const HOUR_START = 7
const HOUR_END = 20
const SLOT_H = 56 // px per hour

function toMinutes(iso: string, tz: string) {
  const parts = new Date(iso)
    .toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: tz })
    .split(':')
  return parseInt(parts[0]) * 60 + parseInt(parts[1])
}

function formatHour(h: number) {
  return `${String(h).padStart(2, '0')}:00`
}

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

function getCategoriaStyle(categoria: string | null | undefined) {
  switch (categoria) {
    case 'cirugia':      return { bar: 'bg-violet-500', bg: 'bg-violet-50', text: 'text-violet-700', border: 'border-violet-200' }
    case 'procedimiento': return { bar: 'bg-teal-500',  bg: 'bg-teal-50',  text: 'text-teal-700',   border: 'border-teal-200' }
    case 'control':      return { bar: 'bg-slate-400',  bg: 'bg-slate-50', text: 'text-slate-600',   border: 'border-slate-200' }
    default:             return { bar: 'bg-indigo-500', bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200' }
  }
}

// ─── Tipos ────────────────────────────────────────────────────────────────────

type Props = {
  citas: CitaHoy[]
  antecedentes: Record<string, AntecedentePaciente>
  empresaSlug: string
  timezone: string
  weekDays: { iso: string; label: string; short: string; isToday: boolean; citas: CitaHoy[] }[]
  prevHref: string
  nextHref: string
  fechaLabel: string
}

// ─── Cita pill en el grid ──────────────────────────────────────────────────────

function CitaPill({
  cita,
  onSelect,
  isSelected,
  timezone,
}: {
  cita: CitaHoy
  onSelect: () => void
  isSelected: boolean
  timezone: string
}) {
  const startMin = toMinutes(cita.fecha_inicio, timezone) - HOUR_START * 60
  const endMin = toMinutes(cita.fecha_fin, timezone) - HOUR_START * 60
  const top = (startMin / 60) * SLOT_H
  const height = Math.max(((endMin - startMin) / 60) * SLOT_H, 24)
  const style = getCategoriaStyle(cita.servicio?.categoria)

  return (
    <button
      onClick={onSelect}
      className={`absolute left-0.5 right-0.5 rounded-md px-1.5 py-1 text-left overflow-hidden border transition-all ${style.bg} ${style.border} ${
        isSelected ? 'ring-2 ring-indigo-500 ring-offset-1' : 'hover:shadow-md'
      }`}
      style={{ top, height }}
    >
      <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-md ${style.bar}`} />
      <p className={`pl-1.5 text-[10px] font-bold truncate ${style.text}`}>
        {cita.contacto?.nombre ?? '—'}
      </p>
      {height > 32 && (
        <p className="pl-1.5 text-[9px] text-slate-500 truncate">
          {cita.servicio?.nombre ?? '—'}
        </p>
      )}
    </button>
  )
}

// ─── Panel lateral de antecedente ─────────────────────────────────────────────

function PanelAntecedente({
  cita,
  antecedente,
  onClose,
  timezone,
}: {
  cita: CitaHoy
  antecedente: AntecedentePaciente | null
  onClose: () => void
  timezone: string
}) {
  return (
    <div className="w-72 flex-shrink-0 border-l border-slate-200 bg-white flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
        <span className="text-xs font-bold text-slate-600 uppercase tracking-wide">Historia del Paciente</span>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-lg leading-none">&times;</button>
      </div>

      <div className="overflow-y-auto flex-1 p-4 space-y-4 text-xs">
        {/* Cita seleccionada */}
        <div className="bg-slate-50 rounded-xl p-3 space-y-1">
          <p className="font-bold text-slate-800">{cita.contacto?.nombre ?? '—'}</p>
          <p className="text-slate-500">{formatTime(cita.fecha_inicio, timezone)} — {formatTime(cita.fecha_fin, timezone)}</p>
          <p className="text-slate-500">{cita.servicio?.nombre}</p>
          <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${
            cita.estado_operativo === 'Realizada' ? 'bg-blue-100 text-blue-700'
            : cita.estado_operativo === 'Agendada' ? 'bg-amber-100 text-amber-700'
            : 'bg-slate-100 text-slate-600'
          }`}>
            {cita.estado_operativo}
          </span>
        </div>

        {antecedente ? (
          <>
            {/* Datos básicos */}
            <div className="space-y-1">
              <p className="font-semibold text-slate-500 uppercase tracking-wider text-[9px]">Paciente</p>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
                  <User className="w-3.5 h-3.5 text-indigo-600" />
                </div>
                <div>
                  <p className="font-semibold text-slate-800">{antecedente.nombre}</p>
                  <p className="text-slate-500">{calcEdad(antecedente.fecha_nacimiento)} · {previsionLabel(antecedente.prevision)}</p>
                </div>
              </div>
            </div>

            {/* Alergias */}
            {antecedente.alergias.length > 0 && (
              <div className="space-y-1">
                <p className="font-semibold text-slate-500 uppercase tracking-wider text-[9px]">Alergias</p>
                <div className="flex flex-wrap gap-1">
                  {antecedente.alergias.map(a => (
                    <span key={a.id} className="px-2 py-0.5 bg-red-50 text-red-700 border border-red-200 rounded text-[10px] font-medium">
                      {a.sustancia}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Diagnósticos */}
            {antecedente.diagnosticos.length > 0 && (
              <div className="space-y-1">
                <p className="font-semibold text-slate-500 uppercase tracking-wider text-[9px]">Diagnósticos activos</p>
                {antecedente.diagnosticos.map(d => (
                  <div key={d.id} className="flex gap-2">
                    <span className="px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded font-mono text-[10px]">{d.codigo_cie10}</span>
                    <span className="text-slate-700 text-[11px]">{d.descripcion}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Medicamentos */}
            {antecedente.medicamentos.length > 0 && (
              <div className="space-y-1">
                <p className="font-semibold text-slate-500 uppercase tracking-wider text-[9px]">Medicamentos</p>
                {antecedente.medicamentos.map(m => (
                  <p key={m.id} className="text-slate-700">{m.nombre}</p>
                ))}
              </div>
            )}

            {/* Citas previas */}
            {antecedente.citas_previas.length > 0 && (
              <div className="space-y-1">
                <p className="font-semibold text-slate-500 uppercase tracking-wider text-[9px]">Visitas anteriores</p>
                {antecedente.citas_previas.slice(0, 5).map(cp => (
                  <div key={cp.id} className="flex justify-between text-slate-600">
                    <span>{cp.servicio_nombre ?? '—'}</span>
                    <span className="text-slate-400">{new Date(cp.fecha_inicio).toLocaleDateString('es-CL', { day: 'numeric', month: 'short' })}</span>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <p className="text-slate-400 text-center py-6">Sin historial disponible</p>
        )}
      </div>
    </div>
  )
}

// ─── Componente principal ──────────────────────────────────────────────────────

export default function AgendaSemanaClient({
  citas,
  antecedentes,
  empresaSlug,
  timezone,
  weekDays,
  prevHref,
  nextHref,
  fechaLabel,
}: Props) {
  const [selectedCitaId, setSelectedCitaId] = useState<string | null>(null)

  const selectedCita = citas.find(c => c.id === selectedCitaId) ?? null
  const selectedAntecedente = selectedCita?.contacto?.id
    ? antecedentes[selectedCita.contacto.id] ?? null
    : null

  const hours = Array.from({ length: HOUR_END - HOUR_START }, (_, i) => HOUR_START + i)
  const totalH = hours.length * SLOT_H

  return (
    <div className="flex flex-col h-full">
      <AgendaViewNav
        empresaSlug={empresaSlug}
        fechaLabel={fechaLabel}
        prevHref={prevHref}
        nextHref={nextHref}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Grid semana */}
        <div className="flex-1 overflow-auto">
          {/* Cabecera días */}
          <div className="sticky top-0 z-10 bg-white border-b border-slate-200 flex ml-12">
            {weekDays.map(d => (
              <div
                key={d.iso}
                className={`flex-1 text-center py-2 border-r border-slate-100 last:border-r-0 ${
                  d.isToday ? 'bg-indigo-50' : ''
                }`}
              >
                <p className="text-[10px] font-semibold text-slate-400 uppercase">{d.short}</p>
                <p className={`text-lg font-bold ${d.isToday ? 'text-indigo-600' : 'text-slate-700'}`}>
                  {new Date(d.iso + 'T12:00:00').getDate()}
                </p>
              </div>
            ))}
          </div>

          {/* Tiempo + celdas */}
          <div className="flex" style={{ height: totalH }}>
            {/* Columna horas */}
            <div className="w-12 flex-shrink-0 relative border-r border-slate-100">
              {hours.map(h => (
                <div
                  key={h}
                  className="absolute w-full text-right pr-2 text-[9px] text-slate-400"
                  style={{ top: (h - HOUR_START) * SLOT_H - 6 }}
                >
                  {formatHour(h)}
                </div>
              ))}
            </div>

            {/* Columnas días */}
            {weekDays.map(d => (
              <div
                key={d.iso}
                className={`flex-1 relative border-r border-slate-100 last:border-r-0 ${
                  d.isToday ? 'bg-indigo-50/30' : ''
                }`}
              >
                {/* Líneas de hora */}
                {hours.map(h => (
                  <div
                    key={h}
                    className="absolute left-0 right-0 border-t border-slate-100"
                    style={{ top: (h - HOUR_START) * SLOT_H }}
                  />
                ))}

                {/* Citas */}
                {(d.citas ?? []).map((cita: CitaHoy) => (
                  <CitaPill
                    key={cita.id}
                    cita={cita}
                    timezone={timezone}
                    isSelected={selectedCitaId === cita.id}
                    onSelect={() =>
                      setSelectedCitaId(prev => (prev === cita.id ? null : cita.id))
                    }
                  />
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Panel antecedente */}
        {selectedCita && (
          <PanelAntecedente
            cita={selectedCita}
            antecedente={selectedAntecedente}
            timezone={timezone}
            onClose={() => setSelectedCitaId(null)}
          />
        )}
      </div>
    </div>
  )
}
