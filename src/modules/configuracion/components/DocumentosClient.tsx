'use client'

import { useActionState, useState, useCallback, useTransition, useId } from 'react'
import {
  Building2, FileText, Stethoscope, Pill, Plus, Trash2,
  ChevronDown, ChevronRight, Eye, EyeOff, Loader2,
  CheckCircle, XCircle, Save, GripVertical, AlertTriangle,
} from 'lucide-react'
import { upsertPlantilla, togglePlantillaActiva, deletePlantilla } from '@/modules/configuracion/actions-plantillas'
import { IdentidadPanel } from './IdentidadPanel'
import type { EmpresaIdentidad, PlantillaRow, TipoPlantilla, SeccionPlantilla, ContenidoPlantilla } from '../queries-plantillas'
import type { ServicioRow } from '../queries-clinica'

// ─── Types ────────────────────────────────────────────────────────────────────

type Props = {
  identidad: EmpresaIdentidad | null
  plantillas: PlantillaRow[]
  procedimientos: ServicioRow[]
  empresaSlug: string
}

type Selection =
  | { kind: 'identidad' }
  | { kind: 'plantilla'; plantilla: PlantillaRow }
  | { kind: 'nueva'; tipo: TipoPlantilla }

type EditForm = {
  id?: string
  tipo: TipoPlantilla
  nombre: string
  servicio_id: string
  header: ContenidoPlantilla['header']
  secciones: SeccionPlantilla[]
}

// ─── Constants ────────────────────────────────────────────────────────────────

const TIPO_META: Record<TipoPlantilla, { label: string; icon: React.ElementType; color: string; badge: string }> = {
  protocolo:      { label: 'Protocolo Quirúrgico', icon: Stethoscope, color: 'text-violet-700', badge: 'bg-violet-100' },
  receta:         { label: 'Receta',               icon: Pill,        color: 'text-sky-700',    badge: 'bg-sky-100' },
  consentimiento: { label: 'Consentimiento',       icon: FileText,    color: 'text-amber-700',  badge: 'bg-amber-100' },
}

const VARIABLES: Record<TipoPlantilla | 'comun', { label: string; vars: { tag: string; desc: string }[] }> = {
  comun: {
    label: 'Comunes',
    vars: [
      { tag: '{{clinica_nombre}}',    desc: 'Nombre de la clínica' },
      { tag: '{{clinica_telefono}}',  desc: 'Teléfono' },
      { tag: '{{clinica_direccion}}', desc: 'Dirección' },
      { tag: '{{medico_nombre}}',     desc: 'Nombre del médico' },
      { tag: '{{paciente_nombre}}',   desc: 'Nombre del paciente' },
      { tag: '{{paciente_rut}}',      desc: 'RUT del paciente' },
      { tag: '{{paciente_edad}}',     desc: 'Edad del paciente' },
      { tag: '{{fecha_hoy}}',         desc: 'Fecha actual' },
    ],
  },
  protocolo: {
    label: 'Protocolo',
    vars: [
      { tag: '{{servicio_nombre}}',      desc: 'Nombre del procedimiento' },
      { tag: '{{cita_fecha}}',           desc: 'Fecha de la cirugía' },
      { tag: '{{diagnostico}}',          desc: 'Diagnóstico' },
      { tag: '{{hallazgos}}',            desc: 'Hallazgos intraoperatorios' },
      { tag: '{{tecnica_quirurgica}}',   desc: 'Técnica utilizada' },
      { tag: '{{anestesia}}',            desc: 'Tipo de anestesia' },
      { tag: '{{complicaciones}}',       desc: 'Complicaciones' },
    ],
  },
  receta: {
    label: 'Receta',
    vars: [
      { tag: '{{med_1_nombre}}',       desc: 'Medicamento 1' },
      { tag: '{{med_1_dosis}}',        desc: 'Dosis 1' },
      { tag: '{{med_1_frecuencia}}',   desc: 'Frecuencia 1' },
      { tag: '{{med_1_indicaciones}}', desc: 'Indicaciones 1' },
      { tag: '{{med_2_nombre}}',       desc: 'Medicamento 2' },
      { tag: '{{med_2_dosis}}',        desc: 'Dosis 2' },
      { tag: '{{indicaciones_gral}}',  desc: 'Indicaciones generales' },
    ],
  },
  consentimiento: {
    label: 'Consentimiento',
    vars: [
      { tag: '{{servicio_nombre}}',   desc: 'Nombre del procedimiento' },
      { tag: '{{riesgos}}',           desc: 'Riesgos específicos' },
      { tag: '{{alternativas}}',      desc: 'Alternativas terapéuticas' },
      { tag: '{{fecha_firma}}',       desc: 'Fecha de firma' },
    ],
  },
}

function newSeccion(): SeccionPlantilla {
  return { id: crypto.randomUUID(), titulo: '', cuerpo: '' }
}

function defaultForm(tipo: TipoPlantilla): EditForm {
  return {
    tipo,
    nombre: '',
    servicio_id: '',
    header: { mostrar_logo: true, mostrar_nombre_clinica: true, mostrar_fecha: true, mostrar_medico: true },
    secciones: [newSeccion()],
  }
}

// ─── Subcomponents ────────────────────────────────────────────────────────────

function VarChips({ tipo }: { tipo: TipoPlantilla }) {
  const [copied, setCopied] = useState<string | null>(null)

  const copy = (tag: string) => {
    navigator.clipboard.writeText(tag).catch(() => {})
    setCopied(tag)
    setTimeout(() => setCopied(null), 1500)
  }

  const groups = ['comun', tipo] as const

  return (
    <div className="space-y-3">
      {groups.map(g => (
        <div key={g}>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
            {VARIABLES[g].label}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {VARIABLES[g].vars.map(v => (
              <button
                key={v.tag}
                type="button"
                onClick={() => copy(v.tag)}
                title={v.desc}
                className={[
                  'text-[10px] font-mono font-bold px-2 py-1 rounded-lg border transition-all',
                  copied === v.tag
                    ? 'bg-emerald-100 border-emerald-300 text-emerald-700'
                    : 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-indigo-50 hover:border-indigo-300 hover:text-indigo-700',
                ].join(' ')}
              >
                {copied === v.tag ? '✓ copiado' : v.tag}
              </button>
            ))}
          </div>
        </div>
      ))}
      <p className="text-[10px] text-slate-400">Haz clic en una variable para copiarla al portapapeles.</p>
    </div>
  )
}

// ─── Tree left panel ──────────────────────────────────────────────────────────

function TreeItem({
  label, active, onClick, icon: Icon, count, color,
}: {
  label: string; active: boolean; onClick: () => void
  icon: React.ElementType; count?: number; color: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left text-sm font-bold transition-all',
        active
          ? 'bg-indigo-600 text-white shadow-sm'
          : 'text-slate-700 hover:bg-slate-100',
      ].join(' ')}
    >
      <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-white' : color}`} />
      <span className="flex-1 truncate">{label}</span>
      {count !== undefined && (
        <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-md ${active ? 'bg-white/20' : 'bg-slate-200 text-slate-500'}`}>
          {count}
        </span>
      )}
    </button>
  )
}

function CategoryGroup({
  tipo, plantillas, selection, onSelect, onNew,
}: {
  tipo: TipoPlantilla
  plantillas: PlantillaRow[]
  selection: Selection
  onSelect: (p: PlantillaRow) => void
  onNew: (t: TipoPlantilla) => void
}) {
  const [open, setOpen] = useState(true)
  const meta = TIPO_META[tipo]
  const Icon = meta.icon

  const isNewActive = selection.kind === 'nueva' && selection.tipo === tipo

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-2 px-2 py-1.5 text-xs font-black text-slate-500 uppercase tracking-widest hover:text-slate-800 transition-colors"
      >
        {open ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
        <Icon className={`w-3.5 h-3.5 ${meta.color}`} />
        {meta.label}
        <span className="ml-auto text-[10px] font-bold bg-slate-100 px-1.5 py-0.5 rounded-md">
          {plantillas.length}
        </span>
      </button>

      {open && (
        <div className="ml-4 mt-1 space-y-0.5">
          {plantillas.map(p => {
            const isActive = selection.kind === 'plantilla' && selection.plantilla.id === p.id
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => onSelect(p)}
                className={[
                  'w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2',
                  isActive
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-600 hover:bg-slate-100',
                ].join(' ')}
              >
                <span className="flex-1 truncate">{p.nombre}</span>
                {!(p.activo ?? true) && (
                  <span className={`text-[9px] font-black px-1.5 rounded ${isActive ? 'bg-white/20' : 'bg-slate-200 text-slate-400'}`}>
                    inactivo
                  </span>
                )}
              </button>
            )
          })}

          <button
            type="button"
            onClick={() => onNew(tipo)}
            className={[
              'w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all border border-dashed',
              isNewActive
                ? 'border-indigo-300 bg-indigo-50 text-indigo-600'
                : 'border-slate-200 text-slate-400 hover:border-indigo-300 hover:text-indigo-500',
            ].join(' ')}
          >
            <Plus className="w-3.5 h-3.5" />
            Nueva plantilla
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Editor panel ─────────────────────────────────────────────────────────────

type ActionResult = { ok: boolean; error?: string } | null

function PlantillaEditor({
  form, setForm, empresaSlug, procedimientos, onDeleted,
}: {
  form: EditForm
  setForm: React.Dispatch<React.SetStateAction<EditForm>>
  empresaSlug: string
  procedimientos: ServicioRow[]
  onDeleted?: () => void
}) {
  const formId = useId()
  const [upsertState, upsertAction, upsertPending] = useActionState<ActionResult, FormData>(
    upsertPlantilla,
    null,
  )
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [deletePending, startDelete] = useTransition()
  const [, startUpsert] = useTransition()

  const updateSeccion = (idx: number, field: keyof SeccionPlantilla, value: string) => {
    setForm(f => ({
      ...f,
      secciones: f.secciones.map((s, i) => i === idx ? { ...s, [field]: value } : s),
    }))
  }

  const addSeccion = () => setForm(f => ({ ...f, secciones: [...f.secciones, newSeccion()] }))

  const removeSeccion = (idx: number) =>
    setForm(f => ({ ...f, secciones: f.secciones.filter((_, i) => i !== idx) }))

  const handleDelete = () => {
    if (!form.id) return
    startDelete(async () => {
      const res = await deletePlantilla(form.id!, empresaSlug)
      if (res.ok) onDeleted?.()
    })
  }

  const handleSubmit = (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    fd.set('contenido', JSON.stringify({
      header: form.header,
      secciones: form.secciones,
    }))
    startUpsert(() => { upsertAction(fd) })
  }

  return (
    <form
      id={formId}
      onSubmit={handleSubmit}
      className="h-full flex flex-col gap-5 overflow-y-auto pr-1"
    >
      <input type="hidden" name="empresaSlug" value={empresaSlug} />
      {form.id && <input type="hidden" name="id" value={form.id} />}
      <input type="hidden" name="tipo" value={form.tipo} />
      <input type="hidden" name="contenido" value="{}" />

      {/* Header options */}
      <div className="bg-slate-50 rounded-xl p-4 space-y-3">
        <p className="text-xs font-black text-slate-700 mb-2">Nombre de la plantilla *</p>
        <input
          type="text"
          name="nombre"
          value={form.nombre}
          onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
          placeholder={`Ej: ${form.tipo === 'protocolo' ? 'Protocolo Colecistectomía' : form.tipo === 'receta' ? 'Receta Post-Operatoria' : 'Consentimiento Cirugía Mayor'}`}
          required
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />

        {form.tipo === 'protocolo' && (
          <>
            <p className="text-xs font-black text-slate-700">Procedimiento asociado</p>
            <select
              name="servicio_id"
              value={form.servicio_id}
              onChange={e => setForm(f => ({ ...f, servicio_id: e.target.value }))}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            >
              <option value="">— Sin asociar (genérico) —</option>
              {procedimientos.map(p => (
                <option key={p.id} value={p.id}>{p.nombre}</option>
              ))}
            </select>
          </>
        )}

        {/* Header toggles */}
        <p className="text-xs font-black text-slate-700 mt-1">Encabezado del documento</p>
        <div className="grid grid-cols-2 gap-2">
          {([
            ['mostrar_logo',           'Mostrar logo'],
            ['mostrar_nombre_clinica', 'Nombre clínica'],
            ['mostrar_fecha',          'Fecha emisión'],
            ['mostrar_medico',         'Nombre médico'],
          ] as const).map(([key, label]) => (
            <label key={key} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.header[key]}
                onChange={e => setForm(f => ({ ...f, header: { ...f.header, [key]: e.target.checked } }))}
                className="w-4 h-4 rounded accent-indigo-600"
              />
              <span className="text-xs text-slate-600 font-medium">{label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Variables reference */}
      <div className="bg-slate-50 rounded-xl p-4">
        <p className="text-xs font-black text-slate-700 mb-3">Variables disponibles</p>
        <VarChips tipo={form.tipo} />
      </div>

      {/* Secciones */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-black text-slate-700">Secciones del documento</p>
          <button
            type="button"
            onClick={addSeccion}
            className="flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800"
          >
            <Plus className="w-3.5 h-3.5" /> Agregar sección
          </button>
        </div>

        {form.secciones.map((sec, idx) => (
          <div key={sec.id} className="rounded-xl border border-slate-200 bg-white overflow-hidden">
            <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 border-b border-slate-200">
              <GripVertical className="w-4 h-4 text-slate-300" />
              <input
                type="text"
                value={sec.titulo}
                onChange={e => updateSeccion(idx, 'titulo', e.target.value)}
                placeholder={`Título sección ${idx + 1}`}
                className="flex-1 bg-transparent text-xs font-bold text-slate-800 focus:outline-none placeholder:text-slate-300"
              />
              <button
                type="button"
                onClick={() => removeSeccion(idx)}
                disabled={form.secciones.length === 1}
                className="text-slate-300 hover:text-red-500 disabled:opacity-30 transition-colors"
                aria-label="Eliminar sección"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
            <textarea
              value={sec.cuerpo}
              onChange={e => updateSeccion(idx, 'cuerpo', e.target.value)}
              placeholder="Escribe el contenido. Usa {{variable}} para insertar datos dinámicos."
              rows={5}
              className="w-full px-3 py-2.5 text-xs text-slate-700 focus:outline-none resize-y font-mono leading-relaxed"
            />
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 pt-2 border-t border-slate-100">
        {form.id && (
          deleteConfirm ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-red-600 font-bold">¿Eliminar definitivamente?</span>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deletePending}
                className="text-xs font-black text-white bg-red-600 hover:bg-red-700 px-3 py-1.5 rounded-lg flex items-center gap-1 disabled:opacity-50"
              >
                {deletePending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                Confirmar
              </button>
              <button
                type="button"
                onClick={() => setDeleteConfirm(false)}
                className="text-xs font-bold text-slate-500 hover:text-slate-800"
              >
                Cancelar
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setDeleteConfirm(true)}
              className="text-xs font-bold text-slate-400 hover:text-red-500 flex items-center gap-1 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" /> Eliminar
            </button>
          )
        )}

        {upsertState && (
          <div className={`flex items-center gap-1.5 text-xs font-bold rounded-lg px-3 py-1.5 ${upsertState.ok ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
            {upsertState.ok
              ? <><CheckCircle className="w-3.5 h-3.5" /> Guardado</>
              : <><XCircle className="w-3.5 h-3.5" /> {upsertState.error}</>
            }
          </div>
        )}

        <button
          type="submit"
          disabled={upsertPending}
          className="ml-auto flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-black hover:bg-indigo-700 disabled:opacity-50 transition-colors"
        >
          {upsertPending
            ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Guardando…</>
            : <><Save className="w-3.5 h-3.5" /> Guardar plantilla</>
          }
        </button>
      </div>
    </form>
  )
}

// ─── Plantilla detail (existing, with toggle) ────────────────────────────────

function PlantillaDetail({
  plantilla, empresaSlug, procedimientos, onToggle, onDeleted,
}: {
  plantilla: PlantillaRow
  empresaSlug: string
  procedimientos: ServicioRow[]
  onToggle: (id: string, activo: boolean) => void
  onDeleted: () => void
}) {
  const [editMode, setEditMode] = useState(false)
  const meta = TIPO_META[plantilla.tipo]
  const Icon = meta.icon

  const [form, setForm] = useState<EditForm>({
    id:          plantilla.id,
    tipo:        plantilla.tipo,
    nombre:      plantilla.nombre,
    servicio_id: plantilla.servicio_id ?? '',
    header:      plantilla.contenido.header ?? {
      mostrar_logo: true, mostrar_nombre_clinica: true, mostrar_fecha: true, mostrar_medico: true,
    },
    secciones: plantilla.contenido.secciones?.length
      ? plantilla.contenido.secciones
      : [newSeccion()],
  })

  const [togglePending, startToggle] = useTransition()

  const handleToggle = () => {
    const next = !(plantilla.activo ?? true)
    startToggle(async () => {
      const res = await togglePlantillaActiva(plantilla.id, next, empresaSlug)
      if (res.ok) onToggle(plantilla.id, next)
    })
  }

  if (editMode) {
    return (
      <div className="h-full flex flex-col">
        <div className="flex items-center gap-3 mb-5">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${meta.badge}`}>
            <Icon className={`w-5 h-5 ${meta.color}`} />
          </div>
          <div className="flex-1">
            <p className="text-sm font-black text-slate-900">Editando: {plantilla.nombre}</p>
            <p className="text-xs text-slate-500">{meta.label}</p>
          </div>
          <button
            type="button"
            onClick={() => setEditMode(false)}
            className="text-xs font-bold text-slate-400 hover:text-slate-700 transition-colors"
          >
            ← Cancelar
          </button>
        </div>

        <PlantillaEditor
          form={form}
          setForm={setForm}
          empresaSlug={empresaSlug}
          procedimientos={procedimientos}
          onDeleted={onDeleted}
        />
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start gap-4">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${meta.badge}`}>
          <Icon className={`w-6 h-6 ${meta.color}`} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-black text-slate-900 truncate">{plantilla.nombre}</h3>
          <p className="text-xs text-slate-500 mt-0.5">{meta.label}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleToggle}
            disabled={togglePending}
            title={(plantilla.activo ?? true) ? 'Desactivar' : 'Activar'}
            className={[
              'flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl transition-colors border',
              (plantilla.activo ?? true)
                ? 'border-slate-200 text-slate-600 hover:border-red-300 hover:text-red-600 bg-white'
                : 'border-emerald-200 text-emerald-700 hover:bg-emerald-50 bg-emerald-50',
            ].join(' ')}
          >
            {togglePending
              ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
              : (plantilla.activo ?? true) ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />
            }
            {(plantilla.activo ?? true) ? 'Activa' : 'Inactiva'}
          </button>

          <button
            type="button"
            onClick={() => setEditMode(true)}
            className="flex items-center gap-1.5 text-xs font-black px-3 py-1.5 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
          >
            Editar
          </button>
        </div>
      </div>

      {/* Sections preview */}
      <div className="space-y-3">
        <p className="text-xs font-black text-slate-500 uppercase tracking-widest">
          Secciones ({plantilla.contenido.secciones?.length ?? 0})
        </p>
        {(plantilla.contenido.secciones ?? []).length === 0 ? (
          <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 rounded-xl px-4 py-3">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            Esta plantilla no tiene secciones. Edítala para agregar contenido.
          </div>
        ) : (
          plantilla.contenido.secciones.map((sec, i) => (
            <div key={sec.id ?? i} className="rounded-xl border border-slate-200 overflow-hidden">
              <div className="px-3 py-2 bg-slate-50 border-b border-slate-100">
                <p className="text-xs font-black text-slate-700">{sec.titulo || `Sección ${i + 1}`}</p>
              </div>
              <pre className="px-3 py-2.5 text-xs text-slate-600 font-mono whitespace-pre-wrap leading-relaxed line-clamp-4">
                {sec.cuerpo || <span className="text-slate-300 italic">Sin contenido</span>}
              </pre>
            </div>
          ))
        )}
      </div>

      {/* Encabezado flags */}
      <div className="bg-slate-50 rounded-xl p-4">
        <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-3">Encabezado</p>
        <div className="grid grid-cols-2 gap-2">
          {([
            ['mostrar_logo',           'Logo'],
            ['mostrar_nombre_clinica', 'Nombre clínica'],
            ['mostrar_fecha',          'Fecha emisión'],
            ['mostrar_medico',         'Médico'],
          ] as const).map(([key, label]) => (
            <div key={key} className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${plantilla.contenido.header?.[key] ? 'bg-emerald-500' : 'bg-slate-300'}`} />
              <span className="text-xs text-slate-600">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function DocumentosClient({ identidad, plantillas: initialPlantillas, procedimientos, empresaSlug }: Props) {
  const [plantillas, setPlantillas] = useState<PlantillaRow[]>(initialPlantillas)
  const [selection, setSelection] = useState<Selection>({ kind: 'identidad' })

  const [newForm, setNewForm] = useState<EditForm>(defaultForm('protocolo'))

  const byTipo = (tipo: TipoPlantilla) => plantillas.filter(p => p.tipo === tipo)

  const selectPlantilla = useCallback((p: PlantillaRow) => {
    setSelection({ kind: 'plantilla', plantilla: p })
  }, [])

  const selectNew = useCallback((tipo: TipoPlantilla) => {
    setNewForm(defaultForm(tipo))
    setSelection({ kind: 'nueva', tipo })
  }, [])

  const handleToggle = useCallback((id: string, activo: boolean) => {
    setPlantillas(ps => ps.map(p => p.id === id ? { ...p, activo } : p))
    setSelection(s =>
      s.kind === 'plantilla' && s.plantilla.id === id
        ? { kind: 'plantilla', plantilla: { ...s.plantilla, activo } }
        : s
    )
  }, [])

  const handleDeleted = useCallback(() => {
    setSelection({ kind: 'identidad' })
  }, [])

  return (
    <div className="flex gap-0 h-[calc(100vh-14rem)] min-h-[500px] rounded-2xl border border-slate-200 overflow-hidden bg-white">

      {/* ── Left tree ── */}
      <div className="w-72 shrink-0 border-r border-slate-200 flex flex-col overflow-y-auto bg-slate-50/60">
        <div className="p-3 space-y-1">

          {/* Identidad */}
          <TreeItem
            label="Identidad corporativa"
            active={selection.kind === 'identidad'}
            onClick={() => setSelection({ kind: 'identidad' })}
            icon={Building2}
            color="text-violet-600"
          />

          <div className="pt-2 space-y-1">
            {(['protocolo', 'receta', 'consentimiento'] as TipoPlantilla[]).map(tipo => (
              <CategoryGroup
                key={tipo}
                tipo={tipo}
                plantillas={byTipo(tipo)}
                selection={selection}
                onSelect={selectPlantilla}
                onNew={selectNew}
              />
            ))}
          </div>
        </div>
      </div>

      {/* ── Right editor / detail ── */}
      <div className="flex-1 overflow-y-auto p-6">

        {selection.kind === 'identidad' && (
          <IdentidadPanel identidad={identidad} empresaSlug={empresaSlug} />
        )}

        {selection.kind === 'nueva' && (
          <div className="h-full flex flex-col">
            <div className="flex items-center gap-3 mb-5">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${TIPO_META[selection.tipo].badge}`}>
                {(() => { const I = TIPO_META[selection.tipo].icon; return <I className={`w-5 h-5 ${TIPO_META[selection.tipo].color}`} /> })()}
              </div>
              <div>
                <p className="text-sm font-black text-slate-900">Nueva {TIPO_META[selection.tipo].label}</p>
                <p className="text-xs text-slate-500">Completa los datos y guarda</p>
              </div>
            </div>
            <PlantillaEditor
              form={newForm}
              setForm={setNewForm}
              empresaSlug={empresaSlug}
              procedimientos={procedimientos}
              onDeleted={handleDeleted}
            />
          </div>
        )}

        {selection.kind === 'plantilla' && (
          <PlantillaDetail
            key={selection.plantilla.id}
            plantilla={selection.plantilla}
            empresaSlug={empresaSlug}
            procedimientos={procedimientos}
            onToggle={handleToggle}
            onDeleted={handleDeleted}
          />
        )}
      </div>
    </div>
  )
}
