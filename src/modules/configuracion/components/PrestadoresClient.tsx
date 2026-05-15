'use client'

import { useState, useActionState } from 'react'
import {
  Plus, Pencil, X, Loader2, AlertCircle, Check,
  ChevronDown, Stethoscope, Clock, DoorOpen, MapPin,
} from 'lucide-react'
import { upsertServicioConfig, toggleServicioConfigActivo } from '@/modules/configuracion/actions-clinica'
import type {
  MedicoRow, ServicioConfigRow, ServicioRow, SucursalRow, SalaRow,
} from '@/modules/configuracion/queries-clinica'

// ─── Helpers ──────────────────────────────────────────────────

const MODELOS_HONORARIOS = [
  { value: 'fijo',                 label: 'Monto fijo por caso' },
  { value: 'bloque_procedimiento', label: 'Bloque de procedimiento' },
  { value: 'cirugia_general',      label: 'Cirugía general' },
]

// ─── Config Modal ─────────────────────────────────────────────

type ConfigModalProps = {
  empresaSlug: string
  medicoId: string
  config: ServicioConfigRow | null
  servicios: ServicioRow[]
  sucursales: SucursalRow[]
  salasAll: SalaRow[]
  onClose: () => void
}

function ConfigModal({ empresaSlug, medicoId, config, servicios, sucursales, salasAll, onClose }: ConfigModalProps) {
  const [state, dispatch, pending] = useActionState(upsertServicioConfig, null)
  const [selectedSucursal, setSelectedSucursal] = useState(config?.sucursal_id ?? '')

  const salasDisponibles = salasAll.filter(s => s.sucursal_id === selectedSucursal && s.activo)

  if (state?.ok) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-sm w-full text-center">
          <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
            <Check className="w-7 h-7 text-emerald-600" />
          </div>
          <h3 className="text-lg font-black text-slate-900 mb-4">
            {config ? 'Configuración actualizada' : 'Configuración creada'}
          </h3>
          <button onClick={onClose} className="w-full py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-700 transition-colors">
            Listo
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90dvh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 sticky top-0 bg-white z-10">
          <h2 className="text-base font-black text-slate-900">
            {config ? 'Editar configuración' : 'Nueva configuración'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors" aria-label="Cerrar">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form action={dispatch} className="p-6 space-y-4">
          <input type="hidden" name="empresaSlug" value={empresaSlug} />
          <input type="hidden" name="medico_id" value={medicoId} />
          {config && <input type="hidden" name="id" value={config.id} />}

          {/* Servicio */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Servicio *</label>
            <div className="relative">
              <select
                name="servicio_id"
                required
                defaultValue={config?.servicio_id ?? ''}
                className="w-full appearance-none px-3.5 py-2.5 pr-9 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              >
                <option value="" disabled>Selecciona un servicio…</option>
                {servicios.filter(s => s.activo).map(s => (
                  <option key={s.id} value={s.id}>{s.nombre}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
          </div>

          {/* Sede */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Sede *</label>
            <div className="relative">
              <select
                name="sucursal_id"
                required
                value={selectedSucursal}
                onChange={e => setSelectedSucursal(e.target.value)}
                className="w-full appearance-none px-3.5 py-2.5 pr-9 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              >
                <option value="" disabled>Selecciona una sede…</option>
                {sucursales.filter(s => s.activo).map(s => (
                  <option key={s.id} value={s.id}>{s.nombre}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
          </div>

          {/* Sala (opcional) */}
          {selectedSucursal && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Sala preferida</label>
              <div className="relative">
                <select
                  name="sala_id"
                  defaultValue={config?.sala_id ?? ''}
                  className="w-full appearance-none px-3.5 py-2.5 pr-9 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                >
                  <option value="">Sin sala asignada</option>
                  {salasDisponibles.map(s => (
                    <option key={s.id} value={s.id}>{s.nombre}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>
          )}

          {/* Tiempos */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Duración (min)</label>
              <input
                name="duracion_minutos"
                type="number"
                min={5}
                max={480}
                defaultValue={config?.duracion_minutos ?? ''}
                placeholder="Base del servicio"
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Buffer pre (min)</label>
              <input
                name="buffer_pre_min"
                type="number"
                min={0}
                max={120}
                defaultValue={config?.buffer_pre_min ?? 0}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Buffer post (min)</label>
              <input
                name="buffer_post_min"
                type="number"
                min={0}
                max={120}
                defaultValue={config?.buffer_post_min ?? 0}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Honorarios */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Modelo de honorarios</label>
            <div className="relative">
              <select
                name="modelo_honorarios"
                defaultValue={config?.modelo_honorarios ?? ''}
                className="w-full appearance-none px-3.5 py-2.5 pr-9 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              >
                <option value="">Sin modelo definido</option>
                {MODELOS_HONORARIOS.map(m => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Monto bloque (CLP)</label>
              <input
                name="monto_bloque"
                type="number"
                min={0}
                defaultValue={config?.monto_bloque ?? ''}
                placeholder="0"
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Monto por cirugía (CLP)</label>
              <input
                name="monto_por_cirugia"
                type="number"
                min={0}
                defaultValue={config?.monto_por_cirugia ?? ''}
                placeholder="0"
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Alias */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Alias (Google Calendar)</label>
            <input
              name="alias"
              defaultValue={config?.alias ?? ''}
              placeholder="Nombre privado que aparece en GCal"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <label className="flex items-center gap-2.5 cursor-pointer">
            <input name="activo" type="checkbox" value="true" defaultChecked={config?.activo ?? true} className="w-4 h-4 rounded accent-indigo-600" />
            <span className="text-xs font-bold text-slate-700">Configuración activa</span>
          </label>

          {state?.error && (
            <div className="flex items-center gap-2 px-3.5 py-2.5 bg-rose-50 border border-rose-100 rounded-xl text-sm text-rose-600">
              <AlertCircle className="w-4 h-4 shrink-0" />{state.error}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={pending} className="flex-1 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-700 disabled:opacity-60 transition-colors flex items-center justify-center gap-2">
              {pending && <Loader2 className="w-4 h-4 animate-spin" />}
              {pending ? 'Guardando…' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Config card ──────────────────────────────────────────────

function ConfigCard({
  config,
  empresaSlug,
  onEdit,
}: { config: ServicioConfigRow; empresaSlug: string; onEdit: () => void }) {
  const [, dispatch, pending] = useActionState(toggleServicioConfigActivo, null)

  return (
    <div className={`bg-white rounded-2xl border overflow-hidden transition-all ${config.activo ? 'border-slate-200/60' : 'border-slate-100 opacity-60'}`}>
      <div className="flex items-start gap-3 px-4 py-3.5">
        {/* Toggle */}
        <form action={dispatch} className="mt-0.5">
          <input type="hidden" name="empresaSlug" value={empresaSlug} />
          <input type="hidden" name="id" value={config.id} />
          <input type="hidden" name="activo" value={String(!config.activo)} />
          <button type="submit" disabled={pending} role="switch" aria-checked={config.activo ?? false}
            className={`relative inline-flex h-5 w-9 rounded-full border-2 border-transparent transition-colors duration-200 disabled:opacity-50 shrink-0 ${config.activo ? 'bg-indigo-600' : 'bg-slate-200'}`}>
            <span className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${config.activo ? 'translate-x-4' : 'translate-x-0'}`} />
          </button>
        </form>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-black text-slate-900 truncate">
            {(config.servicio as any)?.nombre ?? '—'}
          </p>
          <div className="flex flex-wrap gap-2 mt-1.5 text-[11px] text-slate-500">
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {(config.sucursal as any)?.nombre ?? '—'}
            </span>
            {(config.sala as any)?.nombre && (
              <span className="flex items-center gap-1">
                <DoorOpen className="w-3 h-3" />
                {(config.sala as any).nombre}
              </span>
            )}
            {config.duracion_minutos && (
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {config.duracion_minutos} min
              </span>
            )}
            {config.modelo_honorarios && (
              <span className="bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-md font-bold">
                {MODELOS_HONORARIOS.find(m => m.value === config.modelo_honorarios)?.label ?? config.modelo_honorarios}
              </span>
            )}
          </div>
        </div>

        {/* Edit */}
        <button
          onClick={onEdit}
          className="p-2 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors shrink-0"
          aria-label="Editar configuración"
        >
          <Pencil className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────

interface Props {
  medicos: MedicoRow[]
  configs: ServicioConfigRow[]
  servicios: ServicioRow[]
  sucursales: SucursalRow[]
  salas: SalaRow[]
  empresaSlug: string
}

export function PrestadoresClient({ medicos, configs, servicios, sucursales, salas, empresaSlug }: Props) {
  const [selectedMedicoId, setSelectedMedicoId] = useState<string>(medicos[0]?.id ?? '')
  const [modal, setModal] = useState<null | 'create' | ServicioConfigRow>(null)

  const medicoConfigs = configs.filter(c => c.medico_id === selectedMedicoId)
  const selectedMedico = medicos.find(m => m.id === selectedMedicoId)

  return (
    <>
      {modal !== null && selectedMedicoId && (
        <ConfigModal
          empresaSlug={empresaSlug}
          medicoId={selectedMedicoId}
          config={modal === 'create' ? null : modal}
          servicios={servicios}
          sucursales={sucursales}
          salasAll={salas}
          onClose={() => setModal(null)}
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[260px,1fr] gap-6">
        {/* Médico selector */}
        <div>
          <p className="text-xs font-black text-slate-500 uppercase tracking-wide px-1 mb-3">Médico</p>
          {medicos.length === 0 ? (
            <p className="text-sm text-slate-400 px-1">No hay médicos registrados.</p>
          ) : (
            <div className="space-y-1">
              {medicos.map(m => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setSelectedMedicoId(m.id)}
                  className={[
                    'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-150',
                    selectedMedicoId === m.id
                      ? 'bg-indigo-50 border border-indigo-100/80 shadow-sm'
                      : 'hover:bg-slate-50 border border-transparent',
                  ].join(' ')}
                >
                  <div className="w-8 h-8 rounded-xl bg-teal-100 flex items-center justify-center shrink-0">
                    <span className="text-xs font-black text-teal-700">
                      {m.nombre_completo.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className={`text-sm font-black truncate ${selectedMedicoId === m.id ? 'text-indigo-700' : 'text-slate-800'}`}>
                      {m.nombre_completo}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      {configs.filter(c => c.medico_id === m.id).length} config
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Configs panel */}
        {selectedMedico ? (
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-black text-slate-900">
                  {selectedMedico.nombre_completo}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {medicoConfigs.length} servicio{medicoConfigs.length !== 1 ? 's' : ''} configurado{medicoConfigs.length !== 1 ? 's' : ''}
                </p>
              </div>
              <button
                onClick={() => setModal('create')}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Agregar servicio
              </button>
            </div>

            {medicoConfigs.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200/60 p-8 text-center">
                <Stethoscope className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-sm font-bold text-slate-500">Sin servicios configurados</p>
                <p className="text-xs text-slate-400 mt-1">
                  Agrega el primer servicio que puede atender este médico.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {medicoConfigs.map(config => (
                  <ConfigCard
                    key={config.id}
                    config={config}
                    empresaSlug={empresaSlug}
                    onEdit={() => setModal(config)}
                  />
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center h-40 text-sm text-slate-400">
            Selecciona un médico para ver sus configuraciones.
          </div>
        )}
      </div>
    </>
  )
}
