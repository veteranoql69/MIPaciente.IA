'use client'

import { useState, useActionState } from 'react'
import {
  Plus, Pencil, X, Loader2, AlertCircle, Check,
  MapPin, DoorOpen, Building2,
} from 'lucide-react'
import {
  upsertSucursal, toggleSucursalActiva,
  upsertSala, toggleSalaActiva,
} from '@/modules/configuracion/actions-clinica'
import type { SucursalRow, SalaRow } from '@/modules/configuracion/queries-clinica'

// ─── Modals ───────────────────────────────────────────────────

function SucursalModal({
  empresaSlug,
  sucursal,
  onClose,
}: { empresaSlug: string; sucursal: SucursalRow | null; onClose: () => void }) {
  const [state, dispatch, pending] = useActionState(upsertSucursal, null)

  if (state?.ok) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-sm w-full text-center">
          <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
            <Check className="w-7 h-7 text-emerald-600" />
          </div>
          <h3 className="text-lg font-black text-slate-900 mb-4">
            {sucursal ? 'Sede actualizada' : 'Sede creada'}
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
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
          <h2 className="text-base font-black text-slate-900">
            {sucursal ? 'Editar sede' : 'Nueva sede'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors" aria-label="Cerrar">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form action={dispatch} className="p-6 space-y-4">
          <input type="hidden" name="empresaSlug" value={empresaSlug} />
          {sucursal && <input type="hidden" name="id" value={sucursal.id} />}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Nombre de la sede *</label>
            <input
              name="nombre"
              required
              defaultValue={sucursal?.nombre ?? ''}
              placeholder="Ej: Sede Principal · Providencia"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Dirección</label>
            <input
              name="direccion"
              defaultValue={sucursal?.direccion ?? ''}
              placeholder="Ej: Av. Providencia 1234, Santiago"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <label className="flex items-center gap-2.5 cursor-pointer">
            <input name="activo" type="checkbox" value="true" defaultChecked={sucursal?.activo ?? true} className="w-4 h-4 rounded accent-indigo-600" />
            <span className="text-xs font-bold text-slate-700">Sede activa</span>
          </label>

          {state?.error && (
            <div className="flex items-center gap-2 px-3.5 py-2.5 bg-rose-50 border border-rose-100 rounded-xl text-sm text-rose-600">
              <AlertCircle className="w-4 h-4 shrink-0" />{state.error}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors">Cancelar</button>
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

function SalaModal({
  empresaSlug,
  sucursalId,
  sala,
  onClose,
}: { empresaSlug: string; sucursalId: string; sala: SalaRow | null; onClose: () => void }) {
  const [state, dispatch, pending] = useActionState(upsertSala, null)

  if (state?.ok) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-sm w-full text-center">
          <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
            <Check className="w-7 h-7 text-emerald-600" />
          </div>
          <h3 className="text-lg font-black text-slate-900 mb-4">
            {sala ? 'Sala actualizada' : 'Sala creada'}
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
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
          <h2 className="text-base font-black text-slate-900">
            {sala ? 'Editar sala' : 'Nueva sala'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors" aria-label="Cerrar">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form action={dispatch} className="p-6 space-y-4">
          <input type="hidden" name="empresaSlug" value={empresaSlug} />
          <input type="hidden" name="sucursal_id" value={sucursalId} />
          {sala && <input type="hidden" name="id" value={sala.id} />}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Nombre de la sala *</label>
            <input
              name="nombre"
              required
              defaultValue={sala?.nombre ?? ''}
              placeholder="Ej: Pabellón 1 · Consulta A"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Descripción</label>
            <input
              name="descripcion"
              defaultValue={sala?.descripcion ?? ''}
              placeholder="Ej: Equipada para procedimientos ambulatorios"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <label className="flex items-center gap-2.5 cursor-pointer">
            <input name="activo" type="checkbox" value="true" defaultChecked={sala?.activo ?? true} className="w-4 h-4 rounded accent-indigo-600" />
            <span className="text-xs font-bold text-slate-700">Sala activa</span>
          </label>

          {state?.error && (
            <div className="flex items-center gap-2 px-3.5 py-2.5 bg-rose-50 border border-rose-100 rounded-xl text-sm text-rose-600">
              <AlertCircle className="w-4 h-4 shrink-0" />{state.error}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors">Cancelar</button>
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

// ─── Active toggle ────────────────────────────────────────────

function SucursalToggle({ s, empresaSlug }: { s: SucursalRow; empresaSlug: string }) {
  const [, dispatch, pending] = useActionState(toggleSucursalActiva, null)
  return (
    <form action={dispatch}>
      <input type="hidden" name="empresaSlug" value={empresaSlug} />
      <input type="hidden" name="id" value={s.id} />
      <input type="hidden" name="activo" value={String(!s.activo)} />
      <button type="submit" disabled={pending} role="switch" aria-checked={s.activo ?? false}
        className={`relative inline-flex h-5 w-9 rounded-full border-2 border-transparent transition-colors duration-200 disabled:opacity-50 ${s.activo ? 'bg-indigo-600' : 'bg-slate-200'}`}>
        <span className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${s.activo ? 'translate-x-4' : 'translate-x-0'}`} />
      </button>
    </form>
  )
}

function SalaToggle({ sala, empresaSlug }: { sala: SalaRow; empresaSlug: string }) {
  const [, dispatch, pending] = useActionState(toggleSalaActiva, null)
  return (
    <form action={dispatch}>
      <input type="hidden" name="empresaSlug" value={empresaSlug} />
      <input type="hidden" name="id" value={sala.id} />
      <input type="hidden" name="activo" value={String(!sala.activo)} />
      <button type="submit" disabled={pending} role="switch" aria-checked={sala.activo ?? false}
        className={`relative inline-flex h-4 w-8 rounded-full border-2 border-transparent transition-colors duration-200 disabled:opacity-50 ${sala.activo ? 'bg-teal-500' : 'bg-slate-200'}`}>
        <span className={`inline-block h-3 w-3 rounded-full bg-white shadow-sm transition-transform duration-200 ${sala.activo ? 'translate-x-4' : 'translate-x-0'}`} />
      </button>
    </form>
  )
}

// ─── Main component ───────────────────────────────────────────

interface Props {
  sucursales: SucursalRow[]
  salas: SalaRow[]
  empresaSlug: string
}

export function SedesClient({ sucursales, salas, empresaSlug }: Props) {
  const [sucursalModal, setSucursalModal] = useState<null | 'create' | SucursalRow>(null)
  const [salaModal, setSalaModal] = useState<null | { sucursalId: string; sala: SalaRow | null }>(null)
  const [selectedSucursal, setSelectedSucursal] = useState<string>(sucursales[0]?.id ?? '')

  const salasBySucursal = salas.reduce<Record<string, SalaRow[]>>((acc, s) => {
    if (!acc[s.sucursal_id]) acc[s.sucursal_id] = []
    acc[s.sucursal_id].push(s)
    return acc
  }, {})

  const currentSalas = salasBySucursal[selectedSucursal] ?? []

  return (
    <>
      {sucursalModal !== null && (
        <SucursalModal
          empresaSlug={empresaSlug}
          sucursal={sucursalModal === 'create' ? null : sucursalModal}
          onClose={() => setSucursalModal(null)}
        />
      )}
      {salaModal !== null && (
        <SalaModal
          empresaSlug={empresaSlug}
          sucursalId={salaModal.sucursalId}
          sala={salaModal.sala}
          onClose={() => setSalaModal(null)}
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[320px,1fr] gap-6">
        {/* ── Sucursales panel ── */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-black text-slate-900">Sedes</h2>
            <button
              onClick={() => setSucursalModal('create')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Nueva sede
            </button>
          </div>

          {sucursales.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200/60 p-8 text-center">
              <Building2 className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-500">Sin sedes registradas</p>
            </div>
          ) : (
            <div className="space-y-2">
              {sucursales.map(s => (
                <div
                  key={s.id}
                  onClick={() => setSelectedSucursal(s.id)}
                  className={`flex items-center gap-3 p-3.5 rounded-2xl cursor-pointer border transition-all duration-150 ${selectedSucursal === s.id ? 'bg-indigo-50 border-indigo-200 shadow-sm' : 'bg-white border-slate-200/60 hover:bg-slate-50'}`}
                >
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${selectedSucursal === s.id ? 'bg-indigo-100' : 'bg-slate-100'}`}>
                    <Building2 className={`w-4.5 h-4.5 ${selectedSucursal === s.id ? 'text-indigo-600' : 'text-slate-500'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-black truncate ${selectedSucursal === s.id ? 'text-indigo-700' : 'text-slate-800'}`}>{s.nombre}</p>
                    {s.direccion && (
                      <p className="text-[11px] text-slate-400 flex items-center gap-1 truncate">
                        <MapPin className="w-3 h-3 shrink-0" />{s.direccion}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                    <SucursalToggle s={s} empresaSlug={empresaSlug} />
                    <button
                      onClick={e => { e.stopPropagation(); setSucursalModal(s) }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                      aria-label="Editar sede"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Salas panel ── */}
        <div>
          {!selectedSucursal ? (
            <div className="flex items-center justify-center h-40 text-sm text-slate-400">
              Selecciona una sede para ver sus salas.
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-base font-black text-slate-900">
                    Salas · {sucursales.find(s => s.id === selectedSucursal)?.nombre}
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">{currentSalas.length} sala{currentSalas.length !== 1 ? 's' : ''}</p>
                </div>
                <button
                  onClick={() => setSalaModal({ sucursalId: selectedSucursal, sala: null })}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-600 text-white text-xs font-bold rounded-lg hover:bg-teal-700 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Nueva sala
                </button>
              </div>

              {currentSalas.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200/60 p-8 text-center">
                  <DoorOpen className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm font-bold text-slate-500">Sin salas en esta sede</p>
                  <p className="text-xs text-slate-400 mt-1">Agrega la primera sala con el botón de arriba.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {currentSalas.map(sala => (
                    <div key={sala.id} className="bg-white rounded-2xl border border-slate-200/60 p-4 flex items-start gap-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${sala.activo ? 'bg-teal-100' : 'bg-slate-100'}`}>
                        <DoorOpen className={`w-4.5 h-4.5 ${sala.activo ? 'text-teal-600' : 'text-slate-400'}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-black truncate ${sala.activo ? 'text-slate-900' : 'text-slate-400'}`}>{sala.nombre}</p>
                        {sala.descripcion && (
                          <p className="text-[11px] text-slate-400 mt-0.5 truncate">{sala.descripcion}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <SalaToggle sala={sala} empresaSlug={empresaSlug} />
                        <button
                          onClick={() => setSalaModal({ sucursalId: sala.sucursal_id, sala })}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                          aria-label="Editar sala"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  )
}
