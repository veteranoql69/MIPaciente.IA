'use client'

import { useState, useTransition } from 'react'
import { RotateCcw, ChevronDown, ChevronRight, Loader2 } from 'lucide-react'
import { togglePermiso, restaurarPermisosPorRol } from '@/modules/configuracion/actions'
import type { UsuarioRow, PermisoRow } from '@/modules/configuracion/queries'

// ─── Schema de módulos y permisos ────────────────────────────

const MODULOS = [
  {
    key: 'agenda',
    label: 'Agenda',
    color: 'text-indigo-600 bg-indigo-50',
    permisos: [
      { key: 'acceder',               label: 'Acceder al módulo' },
      { key: 'ver_completa',          label: 'Ver agenda completa' },
      { key: 'ver_solo_propia',       label: 'Ver solo agenda propia' },
      { key: 'ver_agenda_asignada',   label: 'Ver agenda asignada' },
      { key: 'crear_modificar_citas', label: 'Crear y modificar citas' },
      { key: 'cancelar_citas',        label: 'Cancelar citas' },
      { key: 'ver_estado_pago',       label: 'Ver estado de pago' },
      { key: 'marcar_asistencia',     label: 'Marcar asistencia' },
    ],
  },
  {
    key: 'crm',
    label: 'CRM / Prospectos',
    color: 'text-violet-600 bg-violet-50',
    permisos: [
      { key: 'acceder',             label: 'Acceder al módulo' },
      { key: 'ver_todos',           label: 'Ver todos los prospectos' },
      { key: 'ver_solo_asignados',  label: 'Ver solo asignados' },
      { key: 'crear_editar',        label: 'Crear y editar' },
      { key: 'cambiar_etapa',       label: 'Cambiar etapa del funnel' },
      { key: 'marcar_ganado_perdido', label: 'Marcar ganado / perdido' },
      { key: 'crear_editar_tareas', label: 'Gestionar tareas' },
      { key: 'exportar',            label: 'Exportar datos' },
    ],
  },
  {
    key: 'ficha_clinica',
    label: 'Ficha Clínica',
    color: 'text-teal-600 bg-teal-50',
    permisos: [
      { key: 'acceder',             label: 'Acceder al módulo' },
      { key: 'ver_fichas',          label: 'Ver fichas' },
      { key: 'ver_solo_propias',    label: 'Ver solo propias' },
      { key: 'ver_datos_admin',     label: 'Ver datos administrativos' },
      { key: 'ver_datos_clinicos',  label: 'Ver datos clínicos' },
      { key: 'editar',              label: 'Editar fichas' },
      { key: 'ver_notas_privadas',  label: 'Ver notas privadas' },
      { key: 'subir_documentos',    label: 'Subir documentos' },
      { key: 'descargar_imprimir',  label: 'Descargar e imprimir' },
    ],
  },
  {
    key: 'estadisticas',
    label: 'Estadísticas',
    color: 'text-amber-600 bg-amber-50',
    permisos: [
      { key: 'acceder',         label: 'Acceder al módulo' },
      { key: 'crear_tableros',  label: 'Crear tableros' },
      { key: 'editar_propios',  label: 'Editar propios' },
      { key: 'editar_ajenos',   label: 'Editar ajenos' },
      { key: 'eliminar',        label: 'Eliminar tableros' },
      { key: 'duplicar',        label: 'Duplicar tableros' },
    ],
  },
]

// ─── Toggle switch ────────────────────────────────────────────

function PermisoToggle({
  active,
  onChange,
  disabled,
}: {
  active: boolean
  onChange: (v: boolean) => void
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={active}
      disabled={disabled}
      onClick={() => onChange(!active)}
      className={[
        'relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200',
        'focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1',
        'disabled:opacity-40 disabled:cursor-not-allowed',
        active ? 'bg-indigo-600' : 'bg-slate-200',
      ].join(' ')}
    >
      <span
        className={[
          'pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200',
          active ? 'translate-x-4' : 'translate-x-0',
        ].join(' ')}
      />
    </button>
  )
}

// ─── Module section ───────────────────────────────────────────

function ModuloSection({
  modulo,
  permisosActivos,
  onToggle,
  isSuperAdmin,
}: {
  modulo: typeof MODULOS[number]
  permisosActivos: Set<string>
  onToggle: (modulo: string, permiso: string, activo: boolean) => void
  isSuperAdmin: boolean
}) {
  const [open, setOpen] = useState(true)
  const count = modulo.permisos.filter(p => permisosActivos.has(`${modulo.key}.${p.key}`)).length

  return (
    <div className="border border-slate-200/60 rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 bg-slate-50/60 hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <span className={`text-xs font-black px-2 py-0.5 rounded-md ${modulo.color}`}>
            {modulo.label}
          </span>
          <span className="text-xs text-slate-400">
            {count}/{modulo.permisos.length} activos
          </span>
        </div>
        {open
          ? <ChevronDown className="w-4 h-4 text-slate-400" />
          : <ChevronRight className="w-4 h-4 text-slate-400" />
        }
      </button>

      {open && (
        <div className="divide-y divide-slate-100">
          {modulo.permisos.map(p => {
            const key = `${modulo.key}.${p.key}`
            const activo = permisosActivos.has(key)
            return (
              <div key={p.key} className="flex items-center justify-between px-4 py-2.5">
                <span className="text-sm text-slate-700">{p.label}</span>
                <PermisoToggle
                  active={activo}
                  onChange={v => onToggle(modulo.key, p.key, v)}
                  disabled={isSuperAdmin}
                />
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────

interface Props {
  usuarios: UsuarioRow[]
  permisos: PermisoRow[]
  empresaSlug: string
  currentUserId: string
}

export function PermisosMatrixClient({ usuarios, permisos, empresaSlug, currentUserId }: Props) {
  const [selectedUserId, setSelectedUserId] = useState<string>(
    usuarios.find(u => u.id !== currentUserId && u.rol !== 'admin_general')?.id ?? usuarios[0]?.id ?? ''
  )
  const [localPermisos, setLocalPermisos] = useState<Map<string, Set<string>>>(() => {
    const map = new Map<string, Set<string>>()
    for (const p of permisos) {
      if (!p.activo) continue
      if (!map.has(p.usuario_id)) map.set(p.usuario_id, new Set())
      map.get(p.usuario_id)!.add(`${p.modulo}.${p.permiso}`)
    }
    return map
  })
  const [savingKey, setSavingKey] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const selectedUser = usuarios.find(u => u.id === selectedUserId)
  const isSuperAdmin = selectedUser?.rol === 'admin_general'
  const permisosActivos = localPermisos.get(selectedUserId) ?? new Set()

  function handleToggle(modulo: string, permiso: string, activo: boolean) {
    const key = `${modulo}.${permiso}`
    setSavingKey(key)

    // Optimistic update
    setLocalPermisos(prev => {
      const next = new Map(prev)
      const set = new Set(next.get(selectedUserId) ?? [])
      if (activo) set.add(key)
      else set.delete(key)
      next.set(selectedUserId, set)
      return next
    })

    const fd = new FormData()
    fd.set('empresaSlug', empresaSlug)
    fd.set('usuarioId', selectedUserId)
    fd.set('modulo', modulo)
    fd.set('permiso', permiso)
    fd.set('activo', String(activo))

    startTransition(async () => {
      const result = await togglePermiso(null, fd)
      if (result?.error) {
        // Revert on error
        setLocalPermisos(prev => {
          const next = new Map(prev)
          const set = new Set(next.get(selectedUserId) ?? [])
          if (activo) set.delete(key)
          else set.add(key)
          next.set(selectedUserId, set)
          return next
        })
      }
      setSavingKey(null)
    })
  }

  function handleRestore() {
    if (!selectedUserId) return
    const fd = new FormData()
    fd.set('empresaSlug', empresaSlug)
    fd.set('usuarioId', selectedUserId)

    startTransition(async () => {
      await restaurarPermisosPorRol(null, fd)
      // After restore, reload the page to refresh permisos from server
      window.location.reload()
    })
  }

  const nonAdminUsers = usuarios.filter(u => u.rol !== 'admin_general')

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[260px,1fr] gap-6">
      {/* User picker */}
      <div className="space-y-1">
        <p className="text-xs font-black text-slate-500 uppercase tracking-wide px-1 mb-3">Usuario</p>
        {nonAdminUsers.length === 0 ? (
          <p className="text-sm text-slate-400 px-1">No hay usuarios para configurar.</p>
        ) : (
          nonAdminUsers.map(u => (
            <button
              key={u.id}
              type="button"
              onClick={() => setSelectedUserId(u.id)}
              className={[
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-150',
                selectedUserId === u.id
                  ? 'bg-indigo-50 border border-indigo-100/80 shadow-sm'
                  : 'hover:bg-slate-50 border border-transparent',
              ].join(' ')}
            >
              <div className="w-8 h-8 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0">
                <span className="text-xs font-black text-indigo-700">
                  {u.nombre_completo.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()}
                </span>
              </div>
              <div className="min-w-0">
                <p className={`text-sm font-black truncate ${selectedUserId === u.id ? 'text-indigo-700' : 'text-slate-800'}`}>
                  {u.nombre_completo}
                </p>
                <p className="text-[11px] text-slate-400 truncate capitalize">{u.rol.replace('_', ' ')}</p>
              </div>
            </button>
          ))
        )}
      </div>

      {/* Permissions panel */}
      {selectedUser ? (
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-black text-slate-900">{selectedUser.nombre_completo}</h3>
              <p className="text-xs text-slate-400 capitalize mt-0.5">{selectedUser.rol.replace('_', ' ')}</p>
            </div>
            {!isSuperAdmin && (
              <button
                type="button"
                onClick={handleRestore}
                disabled={isPending}
                className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 hover:bg-slate-100 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
              >
                {isPending
                  ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  : <RotateCcw className="w-3.5 h-3.5" />
                }
                Restaurar plantilla
              </button>
            )}
          </div>

          {isSuperAdmin ? (
            <div className="bg-violet-50 border border-violet-100 rounded-2xl p-6 text-center">
              <p className="text-sm font-bold text-violet-700">
                El Administrador General tiene acceso total a todos los módulos.
              </p>
              <p className="text-xs text-violet-500 mt-1">Los permisos no son editables para este rol.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {MODULOS.map(mod => (
                <ModuloSection
                  key={mod.key}
                  modulo={mod}
                  permisosActivos={permisosActivos}
                  onToggle={handleToggle}
                  isSuperAdmin={false}
                />
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="flex items-center justify-center h-40 text-sm text-slate-400">
          Selecciona un usuario para editar sus permisos.
        </div>
      )}
    </div>
  )
}
