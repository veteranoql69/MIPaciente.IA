'use client'

import { useState, useEffect, useRef, useTransition, useCallback } from 'react'
import {
  X, Calendar, Clock, User, Stethoscope, Building2, DoorOpen,
  Search, Shield, Loader2, CheckCircle2, Sparkles
} from 'lucide-react'
import { crearCita, buscarPacientes } from '@/modules/agenda/actions'
import type { NuevaCitaInput } from '@/modules/agenda/actions'

// ─── Tipos de los selects ────────────────────────────────────────

export type SelectOption = { id: string; nombre: string }

export type ServicioOption = SelectOption & {
  duracion_minutos: number
  precio_base: number
  categoria: string | null
}

export type SalaOption = SelectOption & {
  sucursal_id: string
}

type PacienteResult = {
  id: string
  nombre: string
  rut: string | null
  telefono: string | null
  email: string | null
}

type Props = {
  isOpen: boolean
  onClose: () => void
  medicos: SelectOption[]
  servicios: ServicioOption[]
  sucursales: SelectOption[]
  salas: SalaOption[]
  empresaSlug: string
  defaultMedicoId?: string
}

// ─── Coberturas disponibles ──────────────────────────────────────

const COBERTURAS = [
  { value: '', label: 'Sin cobertura (particular)' },
  { value: 'particular', label: 'Particular' },
  { value: 'fonasa', label: 'FONASA' },
  { value: 'isapre_particular', label: 'Isapre' },
  { value: 'pad_2026', label: 'PAD 2026' },
  { value: 'ejercito', label: 'Ejército' },
  { value: 'otra', label: 'Otra' },
]

// ─── Helper ──────────────────────────────────────────────────────

function todayStr() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function nowTimeStr() {
  const d = new Date()
  const mins = Math.ceil(d.getMinutes() / 15) * 15
  d.setMinutes(mins, 0, 0)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

// ─── Componente ──────────────────────────────────────────────────

export default function NuevaCitaModal({
  isOpen,
  onClose,
  medicos,
  servicios,
  sucursales,
  salas,
  empresaSlug,
  defaultMedicoId,
}: Props) {
  // ── State ──
  const [fecha, setFecha] = useState(todayStr())
  const [hora, setHora] = useState(nowTimeStr())
  const [medicoId, setMedicoId] = useState(defaultMedicoId ?? '')
  const [servicioId, setServicioId] = useState('')
  const [sucursalId, setSucursalId] = useState(sucursales[0]?.id ?? '')
  const [salaId, setSalaId] = useState('')
  const [cobertura, setCobertura] = useState('')
  const [notas, setNotas] = useState('')

  // Paciente search
  const [pacienteQuery, setPacienteQuery] = useState('')
  const [pacienteResults, setPacienteResults] = useState<PacienteResult[]>([])
  const [selectedPaciente, setSelectedPaciente] = useState<PacienteResult | null>(null)
  const [searchingPaciente, setSearchingPaciente] = useState(false)
  const searchTimeout = useRef<ReturnType<typeof setTimeout>>(undefined)

  // Submit
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const modalRef = useRef<HTMLDivElement>(null)

  // ── Derivados ──
  const selectedServicio = servicios.find(s => s.id === servicioId)
  const salasFiltered = salas.filter(s => s.sucursal_id === sucursalId)

  // ── Búsqueda de pacientes con debounce ──
  const searchPacientes = useCallback((query: string) => {
    setPacienteQuery(query)
    setSelectedPaciente(null)
    clearTimeout(searchTimeout.current)

    if (query.length < 2) {
      setPacienteResults([])
      return
    }

    setSearchingPaciente(true)
    searchTimeout.current = setTimeout(async () => {
      const results = await buscarPacientes(query)
      setPacienteResults(results)
      setSearchingPaciente(false)
    }, 300)
  }, [])

  // ── Cerrar con Escape ──
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  // ── Reset form al cerrar ──
  useEffect(() => {
    if (!isOpen) {
      setFecha(todayStr())
      setHora(nowTimeStr())
      setMedicoId(defaultMedicoId ?? '')
      setServicioId('')
      setSucursalId(sucursales[0]?.id ?? '')
      setSalaId('')
      setCobertura('')
      setNotas('')
      setPacienteQuery('')
      setPacienteResults([])
      setSelectedPaciente(null)
      setError('')
      setSuccess(false)
    }
  }, [isOpen, defaultMedicoId, sucursales])

  // ── Submit ──
  const handleSubmit = () => {
    if (!selectedPaciente) { setError('Selecciona un paciente'); return }
    if (!medicoId) { setError('Selecciona un médico'); return }
    if (!servicioId) { setError('Selecciona un servicio'); return }
    if (!sucursalId) { setError('Selecciona una sucursal'); return }

    const fechaInicio = `${fecha}T${hora}:00`

    const input: NuevaCitaInput = {
      contacto_id: selectedPaciente.id,
      medico_id: medicoId,
      servicio_id: servicioId,
      sucursal_id: sucursalId,
      sala_id: salaId || null,
      fecha_inicio: fechaInicio,
      cobertura_usada: cobertura || null,
      notas: notas || null,
    }

    setError('')
    startTransition(async () => {
      const result = await crearCita(input, empresaSlug)
      if (result.error) {
        setError(result.error)
      } else {
        setSuccess(true)
        setTimeout(() => onClose(), 1200)
      }
    })
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* ── Backdrop ── */}
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* ── Modal ── */}
      <div
        ref={modalRef}
        className="relative w-full max-w-xl bg-white/70 backdrop-blur-2xl border border-white/50 rounded-[2rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.25)] overflow-hidden animate-in fade-in zoom-in-95 slide-in-from-bottom-4 duration-300"
      >
        {/* ── Glow decorativo ── */}
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-indigo-400/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-32 h-32 bg-violet-400/15 rounded-full blur-3xl pointer-events-none" />

        {/* ── Header ── */}
        <div className="relative px-7 pt-7 pb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-200/50">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 tracking-tight">Nueva Cita</h2>
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest">Agenda rápida</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-white/60 rounded-xl transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ── Success overlay ── */}
        {success && (
          <div className="absolute inset-0 z-20 bg-white/90 backdrop-blur-md flex flex-col items-center justify-center gap-3 animate-in fade-in duration-300">
            <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-emerald-600" />
            </div>
            <p className="text-lg font-bold text-slate-900">Cita creada</p>
            <p className="text-sm text-slate-500">Se ha registrado correctamente</p>
          </div>
        )}

        {/* ── Body ── */}
        <div className="px-7 pb-7 space-y-4">
          {/* Error */}
          {error && (
            <div className="px-4 py-2.5 bg-red-50/80 border border-red-200/60 rounded-xl text-xs font-semibold text-red-600 animate-in fade-in slide-in-from-top-2">
              {error}
            </div>
          )}

          {/* ── Paciente (búsqueda) ── */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-slate-500">
              <User className="w-3 h-3" /> Paciente
            </label>
            <div className="relative">
              {selectedPaciente ? (
                <div className="flex items-center gap-3 px-4 py-3 bg-indigo-50/60 border border-indigo-200/50 rounded-xl">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
                    <User className="w-4 h-4 text-indigo-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-800 truncate">{selectedPaciente.nombre}</p>
                    <p className="text-[10px] text-slate-500">
                      {selectedPaciente.rut ?? selectedPaciente.email ?? selectedPaciente.telefono ?? ''}
                    </p>
                  </div>
                  <button
                    onClick={() => { setSelectedPaciente(null); setPacienteQuery('') }}
                    className="p-1 text-slate-400 hover:text-red-500 rounded-lg transition-all"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <>
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    value={pacienteQuery}
                    onChange={(e) => searchPacientes(e.target.value)}
                    placeholder="Buscar por nombre..."
                    className="w-full pl-10 pr-4 py-3 bg-white/60 border border-slate-200/60 rounded-xl text-sm text-slate-800 placeholder:text-slate-300 focus:outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-50 transition-all"
                    autoFocus
                  />
                  {searchingPaciente && (
                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-400 animate-spin" />
                  )}

                  {/* Dropdown de resultados */}
                  {pacienteResults.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white/95 backdrop-blur-md border border-slate-200/60 rounded-xl shadow-xl overflow-hidden z-30">
                      {pacienteResults.map((p) => (
                        <button
                          key={p.id}
                          onClick={() => {
                            setSelectedPaciente(p)
                            setPacienteResults([])
                          }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-indigo-50/50 transition-all text-left"
                        >
                          <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                            <User className="w-3.5 h-3.5 text-slate-500" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-slate-700 truncate">{p.nombre}</p>
                            <p className="text-[10px] text-slate-400">{p.rut ?? p.email ?? ''}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* ── Fecha + Hora (row) ── */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-slate-500">
                <Calendar className="w-3 h-3" /> Fecha
              </label>
              <input
                type="date"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                min={todayStr()}
                className="w-full px-4 py-3 bg-white/60 border border-slate-200/60 rounded-xl text-sm text-slate-800 focus:outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-50 transition-all"
              />
            </div>
            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-slate-500">
                <Clock className="w-3 h-3" /> Hora
              </label>
              <input
                type="time"
                value={hora}
                onChange={(e) => setHora(e.target.value)}
                step={900}
                className="w-full px-4 py-3 bg-white/60 border border-slate-200/60 rounded-xl text-sm text-slate-800 focus:outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-50 transition-all"
              />
            </div>
          </div>

          {/* ── Médico + Servicio (row) ── */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-slate-500">
                <Stethoscope className="w-3 h-3" /> Médico
              </label>
              <select
                value={medicoId}
                onChange={(e) => setMedicoId(e.target.value)}
                className="w-full px-4 py-3 bg-white/60 border border-slate-200/60 rounded-xl text-sm text-slate-800 focus:outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-50 transition-all appearance-none"
              >
                <option value="">Seleccionar...</option>
                {medicos.map(m => (
                  <option key={m.id} value={m.id}>{m.nombre}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-slate-500">
                <Sparkles className="w-3 h-3" /> Servicio
              </label>
              <select
                value={servicioId}
                onChange={(e) => setServicioId(e.target.value)}
                className="w-full px-4 py-3 bg-white/60 border border-slate-200/60 rounded-xl text-sm text-slate-800 focus:outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-50 transition-all appearance-none"
              >
                <option value="">Seleccionar...</option>
                {servicios.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.nombre} ({s.duracion_minutos} min)
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* ── Info servicio seleccionado ── */}
          {selectedServicio && (
            <div className="flex items-center gap-3 px-4 py-2.5 bg-emerald-50/60 border border-emerald-200/40 rounded-xl animate-in fade-in duration-200">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span className="text-xs font-semibold text-emerald-700">
                {selectedServicio.duracion_minutos} min · ${selectedServicio.precio_base.toLocaleString('es-CL')}
              </span>
              {selectedServicio.categoria && (
                <span className="ml-auto px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[9px] font-black uppercase tracking-widest rounded-md">
                  {selectedServicio.categoria}
                </span>
              )}
            </div>
          )}

          {/* ── Sucursal + Sala (row) ── */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-slate-500">
                <Building2 className="w-3 h-3" /> Sucursal
              </label>
              <select
                value={sucursalId}
                onChange={(e) => { setSucursalId(e.target.value); setSalaId('') }}
                className="w-full px-4 py-3 bg-white/60 border border-slate-200/60 rounded-xl text-sm text-slate-800 focus:outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-50 transition-all appearance-none"
              >
                {sucursales.map(s => (
                  <option key={s.id} value={s.id}>{s.nombre}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-slate-500">
                <DoorOpen className="w-3 h-3" /> Sala (opcional)
              </label>
              <select
                value={salaId}
                onChange={(e) => setSalaId(e.target.value)}
                className="w-full px-4 py-3 bg-white/60 border border-slate-200/60 rounded-xl text-sm text-slate-800 focus:outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-50 transition-all appearance-none"
              >
                <option value="">Sin asignar</option>
                {salasFiltered.map(s => (
                  <option key={s.id} value={s.id}>{s.nombre}</option>
                ))}
              </select>
            </div>
          </div>

          {/* ── Cobertura ── */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-slate-500">
              <Shield className="w-3 h-3" /> Cobertura
            </label>
            <select
              value={cobertura}
              onChange={(e) => setCobertura(e.target.value)}
              className="w-full px-4 py-3 bg-white/60 border border-slate-200/60 rounded-xl text-sm text-slate-800 focus:outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-50 transition-all appearance-none"
            >
              {COBERTURAS.map(c => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>

          {/* ── Botón submit ── */}
          <button
            onClick={handleSubmit}
            disabled={isPending || !selectedPaciente || !medicoId || !servicioId}
            className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-black text-sm rounded-2xl shadow-xl shadow-indigo-200/40 transition-all duration-200 active:scale-[0.98]"
          >
            {isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Creando cita...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                Agendar Cita
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
