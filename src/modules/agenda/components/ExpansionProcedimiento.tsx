'use client'

import { useState, useTransition } from 'react'
import {
  AlertTriangle, ChevronDown, ChevronUp, FileText,
  Loader2, Save, CheckCircle2, XCircle, Plus, X,
} from 'lucide-react'
import {
  guardarProcedimientoClinico,
  generarProtocoloPDF,
} from '@/modules/ficha-clinica/actions'
import type { CitaHoy } from '@/modules/agenda/queries'
import type { AntecedentePaciente } from '@/modules/agenda/queries'

type Props = {
  cita: CitaHoy
  antecedente?: AntecedentePaciente
  empresaSlug: string
}

export function ExpansionProcedimiento({ cita, antecedente, empresaSlug }: Props) {
  const servicio = cita.servicio
  const contactoId = cita.contacto?.id ?? ''

  // ── estado formulario ────────────────────────────────────────────────────────
  const [notasInternas, setNotasInternas] = useState('')
  const [notasPaciente, setNotasPaciente] = useState('')
  const [cuidados, setCuidados] = useState<string[]>(servicio?.cuidados_post_op ?? [])
  const [nuevoCuidado, setNuevoCuidado] = useState('')
  const [descExpanded, setDescExpanded] = useState(false)
  const [preOpExpanded, setPreOpExpanded] = useState(false)

  // ── estados UI ───────────────────────────────────────────────────────────────
  const [isPending, startTransition] = useTransition()
  const [isPendingPdf, startTransitionPdf] = useTransition()
  const [saveState, setSaveState] = useState<'idle' | 'saved' | 'error'>('idle')
  const [pdfState, setPdfState] = useState<'idle' | 'done' | 'error'>('idle')
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [fichaId, setFichaId] = useState<string | null>(null)

  const alergiasCriticas = antecedente?.alergias.filter(
    a => a.severidad === 'severa'
  ) ?? []

  function agregarCuidado() {
    const t = nuevoCuidado.trim()
    if (!t) return
    setCuidados(prev => [...prev, t])
    setNuevoCuidado('')
  }

  function quitarCuidado(idx: number) {
    setCuidados(prev => prev.filter((_, i) => i !== idx))
  }

  function handleGuardar() {
    startTransition(async () => {
      setSaveState('idle')
      setErrorMsg(null)

      const res = await guardarProcedimientoClinico(
        {
          cita_id:           cita.id,
          contacto_id:       contactoId,
          notas_medicas:     notasInternas || null,
          notas_al_paciente: notasPaciente || null,
          cuidados_editados: cuidados,
        },
        empresaSlug
      )

      if (res.error) {
        setSaveState('error')
        setErrorMsg(res.error)
        return
      }

      setSaveState('saved')
      if (res.fichaId) setFichaId(res.fichaId)
      setTimeout(() => setSaveState('idle'), 3000)
    })
  }

  function handleGenerarPDF() {
    if (!fichaId) return
    startTransitionPdf(async () => {
      setPdfState('idle')
      setErrorMsg(null)

      const res = await generarProtocoloPDF(fichaId, empresaSlug)

      if (res.error) {
        setPdfState('error')
        setErrorMsg(res.error)
        return
      }

      setPdfState('done')
      setPdfUrl(res.url ?? null)
    })
  }

  return (
    <div className="border-t border-violet-100 bg-violet-50/30 rounded-b-[1.5rem] px-5 pb-5 pt-4 space-y-4">

      {/* ── Badge procedimiento ──────────────────────────────────────────── */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-violet-100 text-violet-700 text-[10px] font-bold uppercase tracking-wider">
          <FileText className="w-3 h-3" />
          Protocolo Quirúrgico
        </span>
        {alergiasCriticas.map(a => (
          <span key={a.id} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-100 text-red-700 text-[10px] font-bold uppercase tracking-wider">
            <AlertTriangle className="w-3 h-3" />
            ALERGIA: {a.sustancia}
          </span>
        ))}
      </div>

      {/* ── Descripción del procedimiento (colapsable) ────────────────────── */}
      {servicio?.descripcion_procedimiento && (
        <div className="rounded-xl border border-violet-100 bg-white overflow-hidden">
          <button
            type="button"
            onClick={() => setDescExpanded(v => !v)}
            className="w-full flex items-center justify-between px-4 py-2.5 text-left hover:bg-violet-50/50 transition-colors"
          >
            <span className="text-xs font-semibold text-violet-700 uppercase tracking-wide">
              Descripción del procedimiento
            </span>
            {descExpanded
              ? <ChevronUp className="w-4 h-4 text-violet-400" />
              : <ChevronDown className="w-4 h-4 text-violet-400" />}
          </button>
          {descExpanded && (
            <div className="px-4 pb-3 text-xs text-slate-600 leading-relaxed border-t border-violet-50">
              {servicio.descripcion_procedimiento}
            </div>
          )}
        </div>
      )}

      {/* ── Instrucciones pre-op (colapsable) ────────────────────────────── */}
      {(servicio?.instrucciones_pre_op ?? []).length > 0 && (
        <div className="rounded-xl border border-amber-100 bg-white overflow-hidden">
          <button
            type="button"
            onClick={() => setPreOpExpanded(v => !v)}
            className="w-full flex items-center justify-between px-4 py-2.5 text-left hover:bg-amber-50/50 transition-colors"
          >
            <span className="text-xs font-semibold text-amber-700 uppercase tracking-wide">
              Instrucciones pre-operatorias
            </span>
            {preOpExpanded
              ? <ChevronUp className="w-4 h-4 text-amber-400" />
              : <ChevronDown className="w-4 h-4 text-amber-400" />}
          </button>
          {preOpExpanded && (
            <ul className="px-4 pb-3 border-t border-amber-50 space-y-1">
              {(servicio?.instrucciones_pre_op ?? []).map((inst, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-slate-600 pt-1.5">
                  <span className="mt-0.5 w-4 h-4 flex-shrink-0 rounded-full bg-amber-100 text-amber-700 text-[9px] font-bold flex items-center justify-center">
                    {i + 1}
                  </span>
                  {inst}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* ── Notas internas + Notas al paciente ───────────────────────────── */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Notas Internas
            <span className="ml-1.5 text-[9px] font-normal text-slate-400 normal-case">(no aparecen en el PDF)</span>
          </label>
          <textarea
            value={notasInternas}
            onChange={e => setNotasInternas(e.target.value)}
            placeholder="Hallazgos intraoperatorios, incidencias, decisiones técnicas..."
            rows={5}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs text-slate-800 placeholder-slate-300 resize-none focus:outline-none focus:ring-2 focus:ring-violet-300 focus:border-violet-400 transition-all"
          />
        </div>

        <div className="space-y-1.5">
          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Notas al Paciente
            <span className="ml-1.5 text-[9px] font-normal text-slate-400 normal-case">(incluidas en el PDF)</span>
          </label>
          <textarea
            value={notasPaciente}
            onChange={e => setNotasPaciente(e.target.value)}
            placeholder="Indicaciones post-procedimiento, próximos pasos, señales de alarma..."
            rows={5}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs text-slate-800 placeholder-slate-300 resize-none focus:outline-none focus:ring-2 focus:ring-violet-300 focus:border-violet-400 transition-all"
          />
        </div>
      </div>

      {/* ── Cuidados post-op (editable) ───────────────────────────────────── */}
      <div className="space-y-2">
        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
          Cuidados Post-Operatorios
          <span className="ml-1.5 text-[9px] font-normal text-slate-400 normal-case">(pre-llenados, editables — van al PDF)</span>
        </label>
        <div className="rounded-xl border border-slate-200 bg-white p-3 space-y-1.5">
          {cuidados.map((c, i) => (
            <div key={i} className="flex items-start gap-2 group">
              <span className="mt-0.5 w-4 h-4 flex-shrink-0 rounded-full bg-violet-100 text-violet-600 text-[9px] font-bold flex items-center justify-center">
                {i + 1}
              </span>
              <span className="flex-1 text-xs text-slate-700 leading-relaxed">{c}</span>
              <button
                type="button"
                onClick={() => quitarCuidado(i)}
                className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-400 transition-all flex-shrink-0"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}

          {/* Agregar cuidado */}
          <div className="flex items-center gap-2 pt-1 border-t border-slate-100 mt-2">
            <input
              type="text"
              value={nuevoCuidado}
              onChange={e => setNuevoCuidado(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), agregarCuidado())}
              placeholder="Agregar cuidado adicional..."
              className="flex-1 text-xs border-0 bg-transparent text-slate-700 placeholder-slate-300 focus:outline-none"
            />
            <button
              type="button"
              onClick={agregarCuidado}
              disabled={!nuevoCuidado.trim()}
              className="flex-shrink-0 p-1 rounded-lg text-violet-500 hover:bg-violet-50 disabled:opacity-30 transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* ── Feedback de error ─────────────────────────────────────────────── */}
      {errorMsg && (
        <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2 flex items-center gap-2">
          <XCircle className="w-3.5 h-3.5 flex-shrink-0" />
          {errorMsg}
        </p>
      )}

      {/* ── Acciones ─────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between pt-1 gap-3 flex-wrap">
        {/* Guardar */}
        <button
          type="button"
          onClick={handleGuardar}
          disabled={isPending}
          className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all active:scale-95 shadow-sm"
        >
          {isPending
            ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
            : saveState === 'saved'
              ? <CheckCircle2 className="w-3.5 h-3.5" />
              : <Save className="w-3.5 h-3.5" />}
          {saveState === 'saved' ? 'Guardado' : 'Guardar Protocolo'}
        </button>

        {/* Generar PDF — visible solo si ya hay ficha guardada */}
        {fichaId && (
          <button
            type="button"
            onClick={handleGenerarPDF}
            disabled={isPendingPdf}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-violet-200 hover:bg-violet-50 disabled:opacity-50 text-violet-700 rounded-xl text-xs font-bold transition-all active:scale-95"
          >
            {isPendingPdf
              ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
              : <FileText className="w-3.5 h-3.5" />}
            {pdfState === 'done' ? 'PDF generado' : 'Generar PDF para firma'}
          </button>
        )}

        {/* Link al PDF generado */}
        {pdfUrl && (
          <a
            href={pdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs text-violet-600 hover:text-violet-800 underline underline-offset-2"
          >
            <FileText className="w-3.5 h-3.5" />
            Abrir PDF
          </a>
        )}
      </div>
    </div>
  )
}
