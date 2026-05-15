'use client'

import { useState, useActionState } from 'react'
import {
  Plus, Pencil, X, Loader2, AlertCircle, Check,
  ChevronDown, ChevronRight, DollarSign, Clock, Tag,
} from 'lucide-react'
import { upsertServicio, toggleServicioActivo, upsertPrecio } from '@/modules/configuracion/actions-clinica'
import type { ServicioRow, PrecioRow } from '@/modules/configuracion/queries-clinica'

// ─── Constants ───────────────────────────────────────────────

const CATEGORIAS = [
  { value: 'consulta',     label: 'Consulta' },
  { value: 'evaluacion',   label: 'Evaluación' },
  { value: 'procedimiento',label: 'Procedimiento' },
  { value: 'cirugia',      label: 'Cirugía' },
  { value: 'control',      label: 'Control' },
  { value: 'examen',       label: 'Examen' },
  { value: 'otro',         label: 'Otro' },
]

const COBERTURAS = [
  { value: 'isapre_particular', label: 'Isapre / Particular' },
  { value: 'fonasa',            label: 'FONASA' },
  { value: 'pad_2026',          label: 'PAD 2026' },
  { value: 'ejercito',          label: 'Ejército' },
  { value: 'otra',              label: 'Otra' },
]

const CAT_COLORS: Record<string, string> = {
  consulta:      'bg-sky-100 text-sky-700',
  evaluacion:    'bg-teal-100 text-teal-700',
  procedimiento: 'bg-violet-100 text-violet-700',
  cirugia:       'bg-rose-100 text-rose-700',
  control:       'bg-emerald-100 text-emerald-700',
  examen:        'bg-amber-100 text-amber-700',
  otro:          'bg-slate-100 text-slate-600',
}

function formatCLP(n: number) {
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(n)
}

// ─── Servicio Modal ───────────────────────────────────────────

type ServicioModalProps = {
  empresaSlug: string
  servicio: ServicioRow | null
  onClose: () => void
}

function ServicioModal({ empresaSlug, servicio, onClose }: ServicioModalProps) {
  const [state, dispatch, pending] = useActionState(upsertServicio, null)

  if (state?.ok) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-sm w-full text-center">
          <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
            <Check className="w-7 h-7 text-emerald-600" />
          </div>
          <h3 className="text-lg font-black text-slate-900 mb-2">
            {servicio ? 'Servicio actualizado' : 'Servicio creado'}
          </h3>
          <button onClick={onClose} className="w-full py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-700 transition-colors mt-2">
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
            {servicio ? 'Editar servicio' : 'Nuevo servicio'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors" aria-label="Cerrar">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form action={dispatch} className="p-6 space-y-4">
          <input type="hidden" name="empresaSlug" value={empresaSlug} />
          {servicio && <input type="hidden" name="id" value={servicio.id} />}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Nombre del servicio *</label>
            <input
              name="nombre"
              required
              defaultValue={servicio?.nombre ?? ''}
              placeholder="Ej: Vasectomía sin Bisturí"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Duración (minutos) *</label>
              <input
                name="duracion_minutos"
                type="number"
                required
                min={5}
                max={480}
                defaultValue={servicio?.duracion_minutos ?? 30}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Precio base (CLP) *</label>
              <input
                name="precio_base"
                type="number"
                required
                min={0}
                defaultValue={servicio?.precio_base ?? 0}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Categoría *</label>
              <div className="relative">
                <select
                  name="categoria"
                  required
                  defaultValue={servicio?.categoria ?? ''}
                  className="w-full appearance-none px-3.5 py-2.5 pr-9 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                >
                  <option value="" disabled>Selecciona…</option>
                  {CATEGORIAS.map(c => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>
            <div className="flex flex-col justify-end pb-0.5">
              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <input
                  name="es_cirugia"
                  type="checkbox"
                  value="true"
                  defaultChecked={servicio?.es_cirugia ?? false}
                  className="w-4 h-4 rounded accent-rose-600"
                />
                <div>
                  <p className="text-xs font-bold text-slate-700">Es cirugía</p>
                  <p className="text-[10px] text-slate-400">Aparece en ficha clínica</p>
                </div>
              </label>
            </div>
          </div>

          <div>
            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <input
                name="activo"
                type="checkbox"
                value="true"
                defaultChecked={servicio?.activo ?? true}
                className="w-4 h-4 rounded accent-indigo-600"
              />
              <span className="text-xs font-bold text-slate-700">Activo (visible en agenda)</span>
            </label>
          </div>

          {state?.error && (
            <div className="flex items-center gap-2 px-3.5 py-2.5 bg-rose-50 border border-rose-100 rounded-xl text-sm text-rose-600">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {state.error}
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

// ─── Precio row form ──────────────────────────────────────────

function PrecioRow({
  precio,
  servicioId,
  empresaSlug,
}: {
  precio?: PrecioRow
  servicioId: string
  empresaSlug: string
  cobertura: string
  label: string
}) {
  const [state, dispatch, pending] = useActionState(upsertPrecio, null)
  const [value, setValue] = useState(String(precio?.precio ?? ''))

  return (
    <form action={dispatch} className="contents">
      <input type="hidden" name="empresaSlug" value={empresaSlug} />
      <input type="hidden" name="servicio_id" value={servicioId} />
      <input type="hidden" name="cobertura" value={precio ? precio.cobertura : ''} />
      {precio?.id && <input type="hidden" name="id" value={precio.id} />}
      <input type="hidden" name="activo" value="true" />
      <input
        name="precio"
        type="number"
        min={0}
        value={value}
        onChange={e => setValue(e.target.value)}
        onBlur={e => {
          if (e.target.value !== String(precio?.precio ?? '')) {
            const form = e.target.closest('form') as HTMLFormElement
            dispatch(new FormData(form))
          }
        }}
        className={`w-full px-2.5 py-1.5 rounded-lg border text-sm text-right focus:outline-none focus:ring-1 focus:ring-indigo-400 ${state?.error ? 'border-rose-300' : 'border-slate-200'}`}
      />
      {pending && <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-500 absolute right-2 top-2" />}
    </form>
  )
}

// ─── Precios expandable ───────────────────────────────────────

function PreciosPanel({
  servicio,
  precios,
  empresaSlug,
}: {
  servicio: ServicioRow
  precios: PrecioRow[]
  empresaSlug: string
}) {
  const [expanded, setExpanded] = useState(false)
  const [state, dispatch, pending] = useActionState(upsertPrecio, null)

  const precioMap = Object.fromEntries(precios.map(p => [p.cobertura, p]))

  return (
    <div className="border-t border-slate-100">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-slate-500 hover:text-indigo-600 transition-colors w-full text-left"
      >
        {expanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
        <DollarSign className="w-3.5 h-3.5" />
        Precios por cobertura
        <span className="ml-auto text-[10px] bg-slate-100 px-1.5 py-0.5 rounded-md">
          {precios.filter(p => p.activo).length} cobertura{precios.filter(p => p.activo).length !== 1 ? 's' : ''}
        </span>
      </button>

      {expanded && (
        <div className="px-5 pb-4">
          <div className="bg-slate-50 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left px-3 py-2 text-xs font-black text-slate-500 uppercase tracking-wide">Cobertura</th>
                  <th className="text-right px-3 py-2 text-xs font-black text-slate-500 uppercase tracking-wide w-36">Precio (CLP)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {COBERTURAS.map(cob => {
                  const existing = precioMap[cob.value]
                  return (
                    <tr key={cob.value}>
                      <td className="px-3 py-2 text-sm text-slate-700">{cob.label}</td>
                      <td className="px-3 py-2 relative">
                        <form action={dispatch}>
                          <input type="hidden" name="empresaSlug" value={empresaSlug} />
                          <input type="hidden" name="servicio_id" value={servicio.id} />
                          <input type="hidden" name="cobertura" value={cob.value} />
                          <input type="hidden" name="etiqueta" value={cob.label} />
                          <input type="hidden" name="activo" value="true" />
                          {existing?.id && <input type="hidden" name="id" value={existing.id} />}
                          <div className="flex items-center gap-1.5">
                            <input
                              name="precio"
                              type="number"
                              min={0}
                              defaultValue={existing?.precio ?? ''}
                              placeholder={String(servicio.precio_base)}
                              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-sm text-right focus:outline-none focus:ring-1 focus:ring-indigo-400 bg-white"
                            />
                            <button
                              type="submit"
                              disabled={pending}
                              className="p-1.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors disabled:opacity-50"
                              aria-label="Guardar precio"
                            >
                              {pending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </form>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          {state?.error && (
            <p className="text-xs text-rose-500 mt-2 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" />
              {state.error}
            </p>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Toggle activo ────────────────────────────────────────────

function ActiveToggle({ servicio, empresaSlug }: { servicio: ServicioRow; empresaSlug: string }) {
  const [, dispatch, pending] = useActionState(toggleServicioActivo, null)
  return (
    <form action={dispatch}>
      <input type="hidden" name="empresaSlug" value={empresaSlug} />
      <input type="hidden" name="id" value={servicio.id} />
      <input type="hidden" name="activo" value={String(!servicio.activo)} />
      <button
        type="submit"
        disabled={pending}
        role="switch"
        aria-checked={servicio.activo ?? false}
        className={`relative inline-flex h-5 w-9 rounded-full border-2 border-transparent transition-colors duration-200 disabled:opacity-50 ${servicio.activo ? 'bg-indigo-600' : 'bg-slate-200'}`}
      >
        <span className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${servicio.activo ? 'translate-x-4' : 'translate-x-0'}`} />
      </button>
    </form>
  )
}

// ─── Main component ───────────────────────────────────────────

interface Props {
  servicios: ServicioRow[]
  precios: PrecioRow[]
  empresaSlug: string
}

export function ServiciosClient({ servicios, precios, empresaSlug }: Props) {
  const [modal, setModal] = useState<null | 'create' | ServicioRow>(null)

  const preciosByServicio = precios.reduce<Record<string, PrecioRow[]>>((acc, p) => {
    if (!acc[p.servicio_id]) acc[p.servicio_id] = []
    acc[p.servicio_id].push(p)
    return acc
  }, {})

  return (
    <>
      {modal !== null && (
        <ServicioModal
          empresaSlug={empresaSlug}
          servicio={modal === 'create' ? null : modal}
          onClose={() => setModal(null)}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-black text-slate-900">Catálogo de servicios</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {servicios.filter(s => s.activo).length} activos · {servicios.filter(s => !s.activo).length} inactivos
          </p>
        </div>
        <button
          onClick={() => setModal('create')}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 transition-colors shadow-sm shadow-indigo-100"
        >
          <Plus className="w-4 h-4" />
          Nuevo servicio
        </button>
      </div>

      {servicios.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/60 p-12 text-center">
          <Tag className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-bold text-slate-500">No hay servicios registrados.</p>
          <p className="text-xs text-slate-400 mt-1">Crea el primer servicio con el botón de arriba.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {servicios.map(s => (
            <div key={s.id} className="bg-white rounded-2xl border border-slate-200/60 overflow-hidden">
              <div className="flex items-center gap-4 px-5 py-4">
                {/* Status */}
                <ActiveToggle servicio={s} empresaSlug={empresaSlug} />

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className={`text-sm font-black ${s.activo ? 'text-slate-900' : 'text-slate-400 line-through'}`}>
                      {s.nombre}
                    </p>
                    {s.es_cirugia && (
                      <span className="text-[9px] font-black bg-rose-100 text-rose-600 px-1.5 py-0.5 rounded-md uppercase tracking-tight">
                        Cirugía
                      </span>
                    )}
                    {s.categoria && (
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg ${CAT_COLORS[s.categoria] ?? 'bg-slate-100 text-slate-500'}`}>
                        {CATEGORIAS.find(c => c.value === s.categoria)?.label ?? s.categoria}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {s.duracion_minutos} min
                    </span>
                    <span className="flex items-center gap-1">
                      <DollarSign className="w-3 h-3" />
                      {formatCLP(s.precio_base)} base
                    </span>
                  </div>
                </div>

                {/* Edit */}
                <button
                  onClick={() => setModal(s)}
                  className="p-2 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                  aria-label="Editar servicio"
                >
                  <Pencil className="w-4 h-4" />
                </button>
              </div>

              {/* Precios expandable */}
              <PreciosPanel
                servicio={s}
                precios={preciosByServicio[s.id] ?? []}
                empresaSlug={empresaSlug}
              />
            </div>
          ))}
        </div>
      )}
    </>
  )
}
