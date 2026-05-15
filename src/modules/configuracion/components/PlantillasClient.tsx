'use client'

import { Shield, Users, Stethoscope, ClipboardList, Cross, Globe } from 'lucide-react'

// Rol templates overview — purely informational, read-only for Sprint 5b.
// Full custom template CRUD is Sprint 6.

const PLANTILLAS = [
  {
    rol: 'admin',
    label: 'Administrador',
    icon: Shield,
    color: 'bg-indigo-100 text-indigo-700',
    badge: 'bg-indigo-50 border-indigo-200',
    descripcion: 'Gestión completa de agenda, CRM y fichas. Sin acceso a configuración de integraciones.',
    modulos: ['Agenda completa', 'CRM completo', 'Ficha clínica', 'Estadísticas', 'Configuración básica'],
  },
  {
    rol: 'medico',
    label: 'Médico / Cirujano',
    icon: Stethoscope,
    color: 'bg-teal-100 text-teal-700',
    badge: 'bg-teal-50 border-teal-200',
    descripcion: 'Ve su propia agenda. Acceso completo a fichas de sus pacientes. Notas privadas habilitadas.',
    modulos: ['Agenda propia', 'CRM asignado', 'Ficha clínica completa', 'Estadísticas (solo lectura)'],
  },
  {
    rol: 'asistente',
    label: 'Asistente / Coordinador',
    icon: ClipboardList,
    color: 'bg-sky-100 text-sky-700',
    badge: 'bg-sky-50 border-sky-200',
    descripcion: 'Agenda de médicos asignados. CRM para coordinación. Datos administrativos de fichas.',
    modulos: ['Agenda asignada', 'CRM completo', 'Ficha clínica (admin)', 'Estadísticas (solo lectura)'],
  },
  {
    rol: 'enfermera_tens',
    label: 'Enfermera / TENS',
    icon: Cross,
    color: 'bg-rose-100 text-rose-700',
    badge: 'bg-rose-50 border-rose-200',
    descripcion: 'Agenda asignada, marcar asistencia. Datos clínicos y subir documentos en ficha.',
    modulos: ['Agenda asignada (marcar)', 'Ficha clínica (clínico + docs)'],
  },
  {
    rol: 'externo',
    label: 'Colaborador Externo',
    icon: Globe,
    color: 'bg-slate-100 text-slate-600',
    badge: 'bg-slate-50 border-slate-200',
    descripcion: 'Acceso mínimo. Solo estadísticas de solo lectura.',
    modulos: ['Estadísticas (solo lectura)'],
  },
]

export function PlantillasClient() {
  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between mb-2">
        <div>
          <h2 className="text-lg font-black text-slate-900">Plantillas de permisos</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Cada rol tiene una plantilla base. Al invitar un usuario se aplica automáticamente.
          </p>
        </div>
        <span className="text-[10px] font-black bg-amber-100 text-amber-600 px-2 py-1 rounded-lg uppercase tracking-tight mt-1">
          Sprint 6: plantillas custom
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {PLANTILLAS.map(p => {
          const Icon = p.icon
          return (
            <div
              key={p.rol}
              className={`rounded-2xl border p-5 flex flex-col gap-3 ${p.badge}`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${p.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-black text-slate-900">{p.label}</p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">Plantilla base</p>
                </div>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">{p.descripcion}</p>

              <div className="flex flex-wrap gap-1.5 mt-1">
                {p.modulos.map(m => (
                  <span
                    key={m}
                    className="text-[10px] font-bold bg-white/70 border border-slate-200 px-2 py-0.5 rounded-lg text-slate-600"
                  >
                    {m}
                  </span>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {/* Admin General note */}
      <div className="mt-2 bg-violet-50 border border-violet-100 rounded-2xl p-5 flex items-start gap-4">
        <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center shrink-0">
          <Users className="w-5 h-5 text-violet-700" />
        </div>
        <div>
          <p className="text-sm font-black text-violet-900 mb-1">Administrador General</p>
          <p className="text-xs text-violet-600 leading-relaxed">
            El rol <strong>admin_general</strong> tiene acceso total e irrestricto a todos los módulos del sistema.
            Sus permisos no son editables y no requieren plantilla — la función{' '}
            <code className="bg-violet-100 px-1 py-0.5 rounded text-[11px]">tiene_permiso()</code> siempre retorna{' '}
            <code className="bg-violet-100 px-1 py-0.5 rounded text-[11px]">true</code> para este rol.
          </p>
        </div>
      </div>
    </div>
  )
}
