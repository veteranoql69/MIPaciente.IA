'use client'

import { useRef, useState, useCallback, useTransition } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import {
  CalendarDays, Users, ClipboardList, TrendingUp, Settings,
  AlertTriangle, ChevronDown, ChevronUp, Pill, Stethoscope,
  Scissors, CheckCircle2, MoreHorizontal, Search,
  Filter, Plus, Activity, Zap, FileText, FlaskConical,
  Loader2, X, User, Save
} from 'lucide-react'
import type { CitaHoy, AntecedentePaciente } from '@/modules/agenda/queries'
import { ExpansionProcedimiento } from './ExpansionProcedimiento'
import NuevaCitaModal from './NuevaCitaModal'
import type { SelectOption, ServicioOption, SalaOption } from './NuevaCitaModal'
import {
  guardarConsultaRapida,
  agregarMotivoConsulta,
} from '@/modules/ficha-clinica/actions'

// ─── Tipos ────────────────────────────────────────────────────────────────────

type AppRoleSimple = 'admin_general' | 'admin' | 'medico' | 'asistente' | 'enfermera_tens' | 'externo' | 'gerente' | 'sistema'

type Props = {
  citas: CitaHoy[]
  antecedentes: Record<string, AntecedentePaciente>
  usuarioRol: AppRoleSimple
  empresaSlug: string
  formattedDate: string
  showMedico: boolean
  medicos: SelectOption[]
  servicios: ServicioOption[]
  sucursales: SelectOption[]
  salas: SalaOption[]
  currentUserId: string
  currentUserRol: string
  motivosCatalog: { id: string; nombre: string; orden: number }[]
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('es-CL', {
    hour: '2-digit', minute: '2-digit', timeZone: 'America/Santiago',
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

function formatFecha(iso: string) {
  return new Date(iso).toLocaleDateString('es-CL', { day: 'numeric', month: 'short', year: 'numeric' })
}

function calcDuracion(inicio: string, fin: string) {
  const mins = Math.round((new Date(fin).getTime() - new Date(inicio).getTime()) / 60000)
  return `${mins} min`
}

function previsionLabel(p: string | null) {
  if (!p) return 'Sin previsión'
  const map: Record<string, string> = {
    fonasa: 'FONASA', isapre_banmedica: 'Bánmédica', isapre_colmena: 'Colmena',
    isapre_cruz_blanca: 'Cruz Blanca', particular: 'Particular',
  }
  return map[p] ?? p
}

// ─── Color coding por categoría de servicio ───────────────────────────────────

function getCategoriaStyle(categoria: string | null | undefined) {
  switch (categoria) {
    case 'cirugia':      return { dot: 'bg-violet-500', text: 'text-violet-700', bg: 'bg-violet-50' }
    case 'procedimiento': return { dot: 'bg-teal-500',  text: 'text-teal-700',   bg: 'bg-teal-50' }
    case 'control':      return { dot: 'bg-slate-400',  text: 'text-slate-600',  bg: 'bg-slate-50' }
    default:             return { dot: 'bg-indigo-400', text: 'text-indigo-700', bg: 'bg-indigo-50' }  // consulta
  }
}

// ─── Color coding por estado operativo ────────────────────────────────────────

function getEstadoStyle(estadoOp: string, estadoConf: string) {
  if (estadoOp === 'Agendada') {
    return estadoConf === 'confirmada'
      ? { label: 'Confirmada', bar: 'bg-emerald-500', badge: 'bg-emerald-100 text-emerald-700' }
      : { label: 'Por confirmar', bar: 'bg-amber-400', badge: 'bg-amber-100 text-amber-700' }
  }
  if (estadoOp === 'Realizada')   return { label: 'Realizada',  bar: 'bg-blue-400',  badge: 'bg-blue-100 text-blue-700' }
  if (estadoOp === 'No asistió')  return { label: 'No asistió', bar: 'bg-red-400',   badge: 'bg-red-100 text-red-700' }
  if (estadoOp.startsWith('Cancelada')) return { label: 'Cancelada', bar: 'bg-slate-300', badge: 'bg-slate-100 text-slate-500' }
  return { label: estadoOp, bar: 'bg-slate-300', badge: 'bg-slate-100 text-slate-500' }
}

// ─── Severidad alergias ───────────────────────────────────────────────────────

function severidadColor(s: string | null) {
  if (s === 'severa')   return 'bg-red-100 text-red-700 border-red-200'
  if (s === 'moderada') return 'bg-amber-100 text-amber-700 border-amber-200'
  return 'bg-yellow-50 text-yellow-700 border-yellow-200'
}

// ─── Menú lateral ─────────────────────────────────────────────────────────────

function MenuLateral({ rol, empresaSlug }: { rol: AppRoleSimple; empresaSlug: string }) {
  const pathname = usePathname()
  const isAdmin = rol === 'admin_general' || rol === 'admin'

  const items = [
    { label: 'Agenda', href: `/${empresaSlug}/agenda/hoy`, icon: CalendarDays },
    { label: 'Pacientes', href: `/${empresaSlug}/pacientes`, icon: Users },
    { label: 'Historial', href: `/${empresaSlug}/historial`, icon: ClipboardList },
    ...(isAdmin ? [
      { label: 'CRM', href: `/${empresaSlug}/crm`, icon: TrendingUp },
      { label: 'Configuración', href: `/${empresaSlug}/configuracion`, icon: Settings },
    ] : []),
  ]

  return (
    <aside className="w-52 flex-shrink-0 bg-white border-r border-slate-200/60 flex flex-col py-6 px-3 gap-1">
      <div className="px-3 mb-4">
        <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center mb-1">
          <Activity className="w-4 h-4 text-white" />
        </div>
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Mi-Paciente</p>
      </div>
      {items.map((item) => {
        const active = pathname.startsWith(item.href)
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              active
                ? 'bg-indigo-50 text-indigo-700'
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
            }`}
          >
            <item.icon className={`w-4 h-4 ${active ? 'text-indigo-600' : ''}`} />
            {item.label}
          </Link>
        )
      })}
    </aside>
  )
}

// ─── Panel Antecedentes (columna derecha — single click) ──────────────────────

function PanelAntecedentes({ data }: { data: AntecedentePaciente }) {
  const [hoverAlergia, setHoverAlergia] = useState<string | null>(null)

  return (
    <div className="h-full overflow-y-auto p-5 space-y-5">
      {/* Encabezado paciente */}
      <div className="space-y-1">
        <div className="flex items-start gap-2">
          <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
            <User className="w-4 h-4 text-indigo-600" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-sm leading-tight">{data.nombre}</h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {calcEdad(data.fecha_nacimiento)}
              {data.genero && ` · ${data.genero === 'masculino' ? 'Hombre' : data.genero === 'femenino' ? 'Mujer' : data.genero}`}
            </p>
          </div>
        </div>
        <div className="ml-11 flex flex-wrap gap-1.5">
          <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-[10px] font-black uppercase tracking-wider rounded-md border border-indigo-100">
            {previsionLabel(data.prevision)}
          </span>
          {data.alergias.length > 0 && (
            <span className="px-2 py-0.5 bg-red-50 text-red-700 text-[10px] font-black uppercase tracking-wider rounded-md border border-red-100">
              ⚠ Alergias
            </span>
          )}
        </div>
      </div>

      {/* Alergias con hover tooltip */}
      {data.alergias.length > 0 && (
        <section>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Alergias</p>
          <div className="space-y-1.5">
            {data.alergias.map((a) => (
              <div
                key={a.id}
                className="relative"
                onMouseEnter={() => setHoverAlergia(a.id)}
                onMouseLeave={() => setHoverAlergia(null)}
              >
                <div className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border cursor-default ${severidadColor(a.severidad)}`}>
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  <span className="text-xs font-semibold">{a.sustancia}</span>
                  {a.severidad && (
                    <span className="ml-auto text-[10px] font-bold uppercase">{a.severidad}</span>
                  )}
                </div>
                {hoverAlergia === a.id && a.reaccion && (
                  <div className="absolute left-0 top-full mt-1 z-50 bg-slate-900 text-white text-xs rounded-lg px-3 py-2 shadow-xl max-w-[220px] leading-relaxed">
                    <span className="font-bold">Reacción:</span> {a.reaccion}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Diagnósticos activos */}
      {data.diagnosticos.length > 0 && (
        <section>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Diagnósticos Activos</p>
          <div className="space-y-1">
            {data.diagnosticos.map((d) => (
              <div key={d.id} className="flex items-start gap-2 px-2.5 py-1.5 bg-slate-50 rounded-lg">
                <Stethoscope className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-slate-800">{d.descripcion}</p>
                  <p className="text-[10px] text-slate-400 font-mono">{d.codigo_cie10}{d.lateralidad ? ` · ${d.lateralidad}` : ''}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Medicamentos activos */}
      {data.medicamentos.length > 0 && (
        <section>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Medicamentos Activos</p>
          <div className="space-y-1">
            {data.medicamentos.map((m) => (
              <div key={m.id} className="flex items-center gap-2 px-2.5 py-1.5 bg-slate-50 rounded-lg">
                <Pill className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <p className="text-xs font-medium text-slate-700">{m.nombre}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Cirugías externas */}
      {data.cirugias.length > 0 && (
        <section>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Cirugías Previas</p>
          <div className="space-y-1">
            {data.cirugias.map((c) => (
              <div key={c.id} className="flex items-center gap-2 px-2.5 py-1.5 bg-slate-50 rounded-lg">
                <Scissors className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <div>
                  <p className="text-xs font-medium text-slate-700">{c.nombre}</p>
                  {c.fecha && <p className="text-[10px] text-slate-400">{formatFecha(c.fecha)}</p>}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Historial de visitas */}
      {data.citas_previas.length > 0 && (
        <section>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Historial de Visitas</p>
          <div className="space-y-1">
            {data.citas_previas.slice(0, 5).map((cp) => (
              <div key={cp.id} className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-300 shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs text-slate-600 truncate">{cp.servicio_nombre ?? 'Visita'}</p>
                  <p className="text-[10px] text-slate-400">{formatFecha(cp.fecha_inicio)}</p>
                </div>
              </div>
            ))}
            {data.citas_previas.length > 5 && (
              <p className="text-[10px] text-slate-400 text-center pt-1">
                +{data.citas_previas.length - 5} visitas anteriores
              </p>
            )}
          </div>
        </section>
      )}

      {/* Resumen IA — placeholder */}
      <section className="border border-dashed border-indigo-200 rounded-xl p-3 bg-indigo-50/40">
        <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400 mb-1 flex items-center gap-1">
          <Zap className="w-3 h-3" /> Resumen IA
        </p>
        <p className="text-[11px] text-indigo-500/70 italic">
          Disponible en Sprint 9 — el modelo sintetizará el historial del paciente automáticamente.
        </p>
      </section>
    </div>
  )
}

// ─── Panel historial (columna derecha cuando está expandida una cita) ─────────

function PanelHistorial({ data }: { data: AntecedentePaciente }) {
  return (
    <div className="h-full overflow-y-auto p-5 space-y-4">
      <div>
        <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-1">Modo Consulta</p>
        <h3 className="font-bold text-slate-900 text-sm">{data.nombre}</h3>
        <p className="text-[11px] text-slate-500">{calcEdad(data.fecha_nacimiento)} · {previsionLabel(data.prevision)}</p>
      </div>

      {data.alergias.length > 0 && (
        <div className="bg-red-50 border border-red-100 rounded-xl p-3">
          <p className="text-[10px] font-black uppercase tracking-wider text-red-500 mb-1.5 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" /> Alergias
          </p>
          {data.alergias.map((a) => (
            <p key={a.id} className="text-xs text-red-700 font-medium">• {a.sustancia} {a.severidad ? `(${a.severidad})` : ''}</p>
          ))}
        </div>
      )}

      {data.diagnosticos.length > 0 && (
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Diagnósticos</p>
          {data.diagnosticos.map((d) => (
            <p key={d.id} className="text-xs text-slate-600 mb-1">• {d.descripcion} <span className="text-slate-400 font-mono">({d.codigo_cie10})</span></p>
          ))}
        </div>
      )}

      {data.citas_previas.length > 0 && (
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Visitas anteriores</p>
          <div className="relative border-l-2 border-slate-200 ml-1 space-y-3 pl-4">
            {data.citas_previas.map((cp) => (
              <div key={cp.id} className="relative">
                <div className="absolute -left-[21px] top-1 w-2 h-2 rounded-full bg-blue-300" />
                <p className="text-xs font-semibold text-slate-700">{cp.servicio_nombre ?? 'Visita médica'}</p>
                <p className="text-[10px] text-slate-400">{formatFecha(cp.fecha_inicio)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {data.citas_previas.length === 0 && data.diagnosticos.length === 0 && (
        <p className="text-xs text-slate-400 text-center py-4">Sin historial previo registrado</p>
      )}
    </div>
  )
}

// ─── Chips de selección rápida ────────────────────────────────────────────────

const MOTIVOS_CONSULTA = [
  'Control post-op', 'Síntomas urinarios', 'Dolor pélvico',
  'Cólico renal', 'Consulta de inicio', 'Revisión de exámenes',
  'Seguimiento tratamiento', 'Segunda opinión',
]

const CHIPS_NOTAS_MEDICAS = [
  'Paciente en buen estado general',
  'Sin fiebre, hemodinámicamente estable',
  'Dolor EVA 3/10',
  'Próstata aumentada al tacto',
  'Sin signos de irritación peritoneal',
  'Herida operatoria en buenas condiciones',
]

const CHIPS_EXAMENES = [
  'Ecografía vesical', 'PSA total', 'Orina completa',
  'Uroflujometría', 'Biopsia próstata', 'Creatinina', 'Hemograma',
]

function ChipSelector({
  chips,
  selected,
  onToggle,
}: {
  chips: string[]
  selected: string[]
  onToggle: (chip: string) => void
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {chips.map((chip) => {
        const active = selected.includes(chip)
        return (
          <button
            key={chip}
            type="button"
            onClick={() => onToggle(chip)}
            className={`px-2.5 py-1 text-[11px] font-semibold rounded-full transition-all active:scale-95 ${
              active
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {chip}
          </button>
        )
      })}
    </div>
  )
}

// ─── Expansión clínica inline (double click) ──────────────────────────────────

type ExpansionClinicaProps = {
  antecedente?: AntecedentePaciente
  citaId: string
  contactoId: string
  empresaSlug: string
  motivosCatalog: { id: string; nombre: string; orden: number }[]
}

function ExpansionClinica({ antecedente, citaId, contactoId, empresaSlug, motivosCatalog }: ExpansionClinicaProps) {
  const [isPending, startTransition] = useTransition()
  const [saveState, setSaveState] = useState<'idle' | 'saved' | 'error' | 'bloqueada'>('idle')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  // Motivo de consulta
  const [motivosSeleccionados, setMotivosSeleccionados] = useState<string[]>([])
  const [nuevoMotivo, setNuevoMotivo] = useState('')
  const [mostrarNuevoMotivo, setMostrarNuevoMotivo] = useState(false)
  const [motivosCustom, setMotivosCustom] = useState<{ id: string; nombre: string }[]>([])

  // Notas médicas
  const [notasMedicas, setNotasMedicas] = useState('')
  const [saved, setSaved] = useState(false)

  // Exámenes
  const [examenesSeleccionados, setExamenesSeleccionados] = useState<string[]>([])
  const [notasExamenes, setNotasExamenes] = useState('')

  // Examen físico
  const [peso, setPeso] = useState('')
  const [talla, setTalla] = useState('')
  const [presionArterial, setPresionArterial] = useState('')
  const [hallazgos, setHallazgos] = useState('')

  const imc = peso && talla
    ? (parseFloat(peso) / Math.pow(parseFloat(talla) / 100, 2)).toFixed(1)
    : ''

  function toggleMotivo(m: string) {
    setMotivosSeleccionados(prev =>
      prev.includes(m) ? prev.filter(x => x !== m) : [...prev, m]
    )
  }

  // Guarda el nuevo motivo en BD y lo agrega localmente
  function agregarNuevoMotivo() {
    const t = nuevoMotivo.trim()
    if (!t) return
    startTransition(async () => {
      const res = await agregarMotivoConsulta(t)
      if (res.error || !res.motivo) {
        setErrorMsg(res.error || 'Error al agregar motivo')
        return
      }
      setMotivosCustom(prev => [...prev, { id: res.motivo.id, nombre: res.motivo.nombre }])
      setMotivosSeleccionados(prev => [...prev, res.motivo.id])
      setNuevoMotivo('')
      setMostrarNuevoMotivo(false)
    })
  }

  function toggleChipNota(chip: string) {
    setNotasMedicas(prev => {
      if (prev.includes(chip)) return prev
      return prev ? `${prev}\n${chip}` : chip
    })
    setSaved(false)
    setTimeout(() => setSaved(true), 800)
  }

  function toggleExamen(e: string) {
    setExamenesSeleccionados(prev =>
      prev.includes(e) ? prev.filter(x => x !== e) : [...prev, e]
    )
  }

  // Envía todos los datos al Server Action
  function handleGuardar() {
    startTransition(async () => {
      setSaveState('idle')
      setErrorMsg(null)
      const res = await guardarConsultaRapida(
        {
          cita_id:              citaId,
          contacto_id:          contactoId,
          motivos_consulta_ids: motivosSeleccionados,
          notas_medicas:        notasMedicas || null,
          examenes_solicitados: examenesSeleccionados,
          notas_examenes:       notasExamenes || null,
          examen_fisico: {
            peso_kg:          peso ? parseFloat(peso) : undefined,
            talla_cm:         talla ? parseFloat(talla) : undefined,
            presion_arterial: presionArterial || undefined,
            hallazgos:        hallazgos || undefined,
          },
        },
        empresaSlug
      )
      if (res.error) {
        setSaveState(res.bloqueada ? 'bloqueada' : 'error')
        setErrorMsg(res.error)
      } else {
        setSaveState('saved')
        setSaved(true)
      }
    })
  }

  const todosMotivos = [...motivosCatalog, ...motivosCustom]

  return (
    <div className="border-t border-indigo-100 bg-indigo-50/30 rounded-b-[1.5rem] px-5 pb-5 pt-4 space-y-5">
      
      {/* Feedback Alert */}
      {saveState === 'error' && (
        <div className="bg-red-50 text-red-600 text-xs p-3 rounded-lg border border-red-200 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" /> {errorMsg}
        </div>
      )}
      {saveState === 'bloqueada' && (
        <div className="bg-amber-50 text-amber-700 text-xs p-3 rounded-lg border border-amber-200 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" /> Esta ficha ya pasó su ventana de edición de 24h. Solo puede ser modificada por un administrador.
        </div>
      )}

      {/* ── Alerta antecedentes rápidos ── */}
      {antecedente && (antecedente.alergias.length > 0 || antecedente.diagnosticos.length > 0) && (
        <div className="flex flex-wrap gap-2 pb-3 border-b border-indigo-100/60">
          {antecedente.alergias.map((a) => (
            <span key={a.id} className={`text-[10px] font-black px-2 py-0.5 rounded-md border ${severidadColor(a.severidad)}`}>
              ⚠ {a.sustancia}
            </span>
          ))}
          {antecedente.diagnosticos.slice(0, 3).map((d) => (
            <span key={d.id} className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200">
              {d.codigo_cie10} {d.descripcion}
            </span>
          ))}
        </div>
      )}

      {/* ── 1. Motivo de Consulta ── */}
      <div className="space-y-2">
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-1">
          <Zap className="w-3 h-3 text-indigo-500" /> Motivo de consulta principal
        </p>
        <div className="flex flex-wrap gap-1.5">
          {todosMotivos.map((m) => {
            const isSelected = motivosSeleccionados.includes(m.id)
            return (
              <button
                key={m.id}
                onClick={() => toggleMotivo(m.id)}
                className={`px-3 py-1.5 rounded-xl text-[11px] font-semibold transition-all border ${
                  isSelected
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm shadow-indigo-200'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300 hover:bg-indigo-50'
                }`}
              >
                {m.nombre}
              </button>
            )
          })}
        </div>
        {mostrarNuevoMotivo ? (
          <div className="flex items-center gap-2 mt-1">
            <input
              autoFocus
              type="text"
              value={nuevoMotivo}
              onChange={(e) => setNuevoMotivo(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') agregarNuevoMotivo() }}
              placeholder="Nuevo motivo de consulta..."
              className="flex-1 text-xs bg-white border border-indigo-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-100"
            />
            <button
              onClick={agregarNuevoMotivo}
              className="px-3 py-1.5 text-[11px] font-bold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all active:scale-95"
            >
              Agregar
            </button>
            <button
              onClick={() => { setMostrarNuevoMotivo(false); setNuevoMotivo('') }}
              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setMostrarNuevoMotivo(true)}
            className="text-[11px] font-semibold text-indigo-500 hover:text-indigo-700 flex items-center gap-1 mt-1 transition-colors"
          >
            <Plus className="w-3 h-3" /> Nuevo motivo
          </button>
        )}
      </div>

      {/* ── 2 + 3. Notas médicas + Exámenes ── */}
      <div className="grid grid-cols-2 gap-4">

        {/* Notas Médicas */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-1">
              <FileText className="w-3 h-3" /> Notas Médicas
            </p>
            {saved && (
              <span className="text-[10px] font-semibold text-emerald-500">✓ Guardado</span>
            )}
          </div>
          <ChipSelector
            chips={CHIPS_NOTAS_MEDICAS}
            selected={[]}
            onToggle={toggleChipNota}
          />
          <textarea
            value={notasMedicas}
            onChange={(e) => { setNotasMedicas(e.target.value); setSaved(false) }}
            placeholder="Hallazgos, evolución, observaciones..."
            rows={4}
            className="w-full text-sm text-slate-800 bg-white border border-slate-200 rounded-xl px-3 py-2.5 resize-none focus:outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-50 placeholder:text-slate-300 transition-all"
          />
        </div>

        {/* Notas de Exámenes */}
        <div className="space-y-2">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-1">
            <FlaskConical className="w-3 h-3" /> Solicitar / Anotar Exámenes
          </p>
          <ChipSelector
            chips={CHIPS_EXAMENES}
            selected={examenesSeleccionados}
            onToggle={toggleExamen}
          />
          <textarea
            value={notasExamenes}
            onChange={(e) => setNotasExamenes(e.target.value)}
            placeholder="Resultados o instrucciones adicionales..."
            rows={4}
            className="w-full text-sm text-slate-800 bg-white border border-slate-200 rounded-xl px-3 py-2.5 resize-none focus:outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-50 placeholder:text-slate-300 transition-all"
          />
          <p className="text-[10px] text-slate-400">
            Se guardará en historial del paciente
          </p>
        </div>
      </div>

      {/* ── 4. Examen Físico ── */}
      <div className="space-y-2">
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-1">
          <Activity className="w-3 h-3" /> Examen Físico
        </p>
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: 'Peso (kg)', value: peso, set: setPeso, placeholder: '70' },
            { label: 'Talla (cm)', value: talla, set: setTalla, placeholder: '175' },
            { label: 'IMC', value: imc, set: () => {}, placeholder: '—', readonly: true },
            { label: 'P. Arterial', value: presionArterial, set: setPresionArterial, placeholder: '120/80' },
          ].map(({ label, value, set, placeholder, readonly }) => (
            <div key={label} className="space-y-1">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">{label}</p>
              <input
                type="text"
                value={value}
                onChange={(e) => !readonly && set(e.target.value)}
                placeholder={placeholder}
                readOnly={readonly}
                className={`w-full text-sm font-semibold text-slate-800 border rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-indigo-300 transition-all ${
                  readonly
                    ? 'bg-slate-50 border-slate-100 text-slate-500 cursor-default'
                    : 'bg-white border-slate-200'
                }`}
              />
            </div>
          ))}
        </div>
        <textarea
          value={hallazgos}
          onChange={(e) => setHallazgos(e.target.value)}
          placeholder="Hallazgos del examen físico..."
          rows={2}
          className="w-full text-sm text-slate-800 bg-white border border-slate-200 rounded-xl px-3 py-2.5 resize-none focus:outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-50 placeholder:text-slate-300 transition-all"
        />
      </div>

      {/* ── Footer ── */}
      <div className="flex items-center justify-between pt-1 border-t border-indigo-100/60">
        <div>
          {saveState === 'saved' && (
            <p className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Guardado en ficha clínica
            </p>
          )}
          {(saveState === 'error' || saveState === 'bloqueada') && errorMsg && (
            <p className="text-[11px] font-semibold text-rose-500 max-w-xs leading-tight">
              {errorMsg}
            </p>
          )}
          {saveState === 'idle' && (
            <p className="text-[10px] text-slate-400 italic">
              Los datos se guardarán en la ficha clínica del paciente
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleGuardar}
            disabled={isPending || saveState === 'bloqueada'}
            className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl transition-all active:scale-95 ${
              isPending
                ? 'bg-indigo-50 text-indigo-400 border border-indigo-100 cursor-wait'
                : saveState === 'bloqueada'
                ? 'bg-slate-50 text-slate-400 border border-slate-200 cursor-not-allowed'
                : 'bg-white text-slate-700 border border-slate-200 hover:border-indigo-300 hover:text-indigo-700'
            }`}
          >
            {isPending
              ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Guardando...</>
              : <><Save className="w-3.5 h-3.5" /> Guardar borrador</>
            }
          </button>
          <button
            disabled
            className="px-4 py-2 text-xs font-black text-indigo-400 bg-indigo-50 border border-indigo-100 rounded-xl cursor-not-allowed"
          >
            Cerrar visita
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function AgendaHoyClient({
  citas: initialCitas,
  antecedentes: initialAntecedentes,
  usuarioRol,
  empresaSlug,
  formattedDate,
  showMedico,
  medicos,
  servicios,
  sucursales,
  salas,
  currentUserId,
  currentUserRol,
  motivosCatalog,
}: Props) {
  const [showNuevaCita, setShowNuevaCita] = useState(false)
  const [selectedCitaId, setSelectedCitaId] = useState<string | null>(null)
  const [expandedCitaId, setExpandedCitaId] = useState<string | null>(null)
  const [filtro, setFiltro] = useState<'todos' | 'confirmados' | 'pendientes'>('todos')
  const clickTimer = useRef<ReturnType<typeof setTimeout>>(undefined)

  const confirmadas = initialCitas.filter(c => c.estado_operativo === 'Agendada' && c.estado_confirmacion === 'confirmada').length
  const porConfirmar = initialCitas.filter(c => c.estado_operativo === 'Agendada' && c.estado_confirmacion === 'no_confirmada').length

  const citasFiltradas = initialCitas.filter(c => {
    if (filtro === 'confirmados') return c.estado_operativo === 'Agendada' && c.estado_confirmacion === 'confirmada'
    if (filtro === 'pendientes') return c.estado_operativo === 'Agendada' && c.estado_confirmacion === 'no_confirmada'
    return true
  })

  const handleClick = useCallback((id: string) => {
    clearTimeout(clickTimer.current)
    clickTimer.current = setTimeout(() => {
      setSelectedCitaId(prev => prev === id ? null : id)
    }, 200)
  }, [])

  const handleDoubleClick = useCallback((id: string) => {
    clearTimeout(clickTimer.current)
    setExpandedCitaId(prev => prev === id ? null : id)
    setSelectedCitaId(id)
  }, [])

  const selectedCita = initialCitas.find(c => c.id === selectedCitaId)
  const selectedContactoId = selectedCita?.contacto?.id ?? null
  const selectedAntecedente = selectedContactoId ? initialAntecedentes[selectedContactoId] : null
  const expandedCita = initialCitas.find(c => c.id === expandedCitaId)
  const expandedAntecedente = expandedCita?.contacto?.id ? initialAntecedentes[expandedCita.contacto.id] : undefined

  return (
    <div className="flex h-screen bg-slate-50/50 overflow-hidden">
      {/* ── Columna izquierda: menú ── */}
      <MenuLateral rol={usuarioRol} empresaSlug={empresaSlug} />

      {/* ── Columna central: lista de citas ── */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-slate-200/60 px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">Agenda del Día</h1>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <p className="text-xs font-medium text-slate-500">{formattedDate}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button className="p-2 text-slate-500 hover:bg-slate-100 rounded-xl border border-slate-200 transition-all">
                <Filter className="w-4 h-4" />
              </button>
              <button
                onClick={() => setShowNuevaCita(true)}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs transition-all shadow-lg shadow-indigo-100 active:scale-95"
              >
                <Plus className="w-4 h-4" /> Nueva Cita
              </button>
            </div>
          </div>

          {/* Quick filters + search */}
          <div className="flex items-center justify-between mt-3">
            <div className="flex items-center gap-1">
              {([
                { key: 'todos',       label: `Todos (${initialCitas.length})` },
                { key: 'confirmados', label: `Confirmados (${confirmadas})` },
                { key: 'pendientes',  label: `Pendientes (${porConfirmar})` },
              ] as const).map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setFiltro(key)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                    filtro === key
                      ? 'bg-indigo-50 text-indigo-700'
                      : 'text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="relative hidden sm:block">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar paciente..."
                className="pl-8 pr-3 py-1.5 bg-slate-50 border border-transparent focus:bg-white focus:border-indigo-200 rounded-xl text-xs outline-none w-48 transition-all"
              />
            </div>
          </div>
        </header>

        {/* Lista */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-2">
          {citasFiltradas.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-slate-400">
              <CalendarDays className="w-10 h-10 mb-3 opacity-30" />
              <p className="font-semibold">Sin citas para este filtro</p>
            </div>
          ) : (
            citasFiltradas.map((cita) => {
              const status = getEstadoStyle(cita.estado_operativo, cita.estado_confirmacion)
              const catStyle = getCategoriaStyle(cita.servicio?.categoria)
              const isSelected = selectedCitaId === cita.id
              const isExpanded = expandedCitaId === cita.id
              const contactoId = cita.contacto?.id ?? null
              const ant = contactoId ? initialAntecedentes[contactoId] : null

              return (
                <div key={cita.id}>
                  <div
                    onClick={() => handleClick(cita.id)}
                    onDoubleClick={() => handleDoubleClick(cita.id)}
                    className={`group relative bg-white border rounded-[1.25rem] p-4 transition-all cursor-pointer select-none flex items-center gap-5 ${
                      isSelected || isExpanded
                        ? 'border-indigo-300 shadow-md shadow-indigo-50 bg-indigo-50/20'
                        : 'border-slate-200/60 hover:border-indigo-200 hover:shadow-sm'
                    } ${isExpanded ? 'rounded-b-none' : ''}`}
                  >
                    {/* Barra estado */}
                    <div className={`absolute left-0 top-5 bottom-5 w-1 rounded-r-full ${status.bar}`} />

                    {/* Hora */}
                    <div className="flex flex-col items-center w-16 border-r border-slate-100 pr-4 shrink-0">
                      <span className="text-base font-black text-slate-900 leading-none">{formatTime(cita.fecha_inicio)}</span>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight mt-1">
                        {calcDuracion(cita.fecha_inicio, cita.fecha_fin)}
                      </span>
                    </div>

                    {/* Info principal */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <h3 className="text-sm font-bold text-slate-800 truncate">
                          {cita.contacto?.nombre ?? 'Paciente sin nombre'}
                        </h3>
                        {ant?.alergias.length ? (
                          <span title="Tiene alergias registradas">
                            <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                          </span>
                        ) : null}
                        <span className={`px-1.5 py-0.5 text-[9px] font-black uppercase tracking-widest rounded-md ${status.badge}`}>
                          {status.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
                        <span className={`flex items-center gap-1 font-semibold ${catStyle.text}`}>
                          <div className={`w-1.5 h-1.5 rounded-full ${catStyle.dot}`} />
                          {cita.servicio?.nombre ?? 'Sin servicio'}
                        </span>
                        {cita.sala && (
                          <span className="text-slate-400">{cita.sala.nombre}</span>
                        )}
                        {showMedico && cita.medico && (
                          <span className="text-slate-400">{cita.medico.nombre_completo}</span>
                        )}
                      </div>
                    </div>

                    {/* Acciones */}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => e.stopPropagation()}
                        className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all"
                        title="Confirmar cita"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => e.stopPropagation()}
                        className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-all"
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Indicador expand */}
                    <div className="text-slate-300 shrink-0">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  </div>

                  {/* Expansión clínica inline */}
                  {isExpanded && (
                    (cita.servicio?.es_cirugia || cita.servicio?.categoria === 'procedimiento')
                      ? <ExpansionProcedimiento
                          cita={cita}
                          antecedente={expandedAntecedente}
                          empresaSlug={empresaSlug}
                        />
                      : <ExpansionClinica
                          antecedente={expandedAntecedente}
                          citaId={cita.id}
                          contactoId={cita.contacto?.id ?? ''}
                          empresaSlug={empresaSlug}
                          motivosCatalog={motivosCatalog}
                        />
                  )}
                </div>
              )
            })
          )}
        </div>
      </main>

      {/* ── Columna derecha: panel paciente ── */}
      <aside className="w-72 xl:w-80 flex-shrink-0 bg-white border-l border-slate-200/60 flex flex-col overflow-hidden">
        {selectedAntecedente ? (
          <>
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                {expandedCitaId && selectedCitaId === expandedCitaId
                  ? (() => { const s = initialCitas.find(c => c.id === expandedCitaId)?.servicio; return s?.es_cirugia || s?.categoria === 'procedimiento' })()
                    ? 'Protocolo Quirúrgico'
                    : 'Consulta Activa'
                  : 'Antecedentes'}
              </p>
              <button
                onClick={() => { setSelectedCitaId(null); setExpandedCitaId(null) }}
                className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              {expandedCitaId && selectedCitaId === expandedCitaId
                ? <PanelHistorial data={selectedAntecedente} />
                : <PanelAntecedentes data={selectedAntecedente} />
              }
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-slate-300 px-6 text-center">
            <User className="w-10 h-10 mb-3" />
            <p className="text-sm font-semibold text-slate-400">Selecciona una cita</p>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              Clic simple → antecedentes<br />Doble clic → abrir consulta
            </p>
          </div>
        )}
      </aside>

      {/* ── Modal Nueva Cita ── */}
      <NuevaCitaModal
        isOpen={showNuevaCita}
        onClose={() => setShowNuevaCita(false)}
        medicos={medicos}
        servicios={servicios}
        sucursales={sucursales}
        salas={salas}
        empresaSlug={empresaSlug}
        defaultMedicoId={currentUserRol === 'medico' ? currentUserId : undefined}
      />
    </div>
  )
}
