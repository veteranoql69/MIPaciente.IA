'use client'

import { useState, useActionState } from 'react'
import {
  UserPlus, Mail, Shield, Clock, ChevronDown, X, Check, Loader2, AlertCircle,
} from 'lucide-react'
import { invitarUsuario, cambiarRolUsuario } from '@/modules/configuracion/actions'
import type { UsuarioRow, InvitacionRow } from '@/modules/configuracion/queries'

const ROL_LABELS: Record<string, string> = {
  admin_general: 'Admin General',
  admin: 'Administrador',
  medico: 'Médico',
  asistente: 'Asistente',
  enfermera_tens: 'Enfermera / TENS',
  externo: 'Externo',
}

const ROL_COLORS: Record<string, string> = {
  admin_general: 'bg-violet-100 text-violet-700',
  admin: 'bg-indigo-100 text-indigo-700',
  medico: 'bg-teal-100 text-teal-700',
  asistente: 'bg-sky-100 text-sky-700',
  enfermera_tens: 'bg-rose-100 text-rose-700',
  externo: 'bg-slate-100 text-slate-600',
}

const ROLES_INVITABLES = [
  { value: 'admin', label: 'Administrador' },
  { value: 'medico', label: 'Médico / Cirujano' },
  { value: 'asistente', label: 'Asistente / Coordinador' },
  { value: 'enfermera_tens', label: 'Enfermera / TENS' },
  { value: 'externo', label: 'Colaborador Externo' },
]

function formatDate(iso: string | null) {
  if (!iso) return '—'
  return new Intl.DateTimeFormat('es-CL', { dateStyle: 'medium' }).format(new Date(iso))
}

function formatRelative(iso: string) {
  const now = Date.now()
  const then = new Date(iso).getTime()
  const diff = now - then
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `hace ${mins}m`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `hace ${hrs}h`
  const days = Math.floor(hrs / 24)
  return `hace ${days}d`
}

// ─── Invite Modal ─────────────────────────────────────────────

function InvitarModal({
  empresaSlug,
  onClose,
}: { empresaSlug: string; onClose: () => void }) {
  const [state, dispatch, pending] = useActionState(invitarUsuario, null)

  if (state?.ok) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-sm w-full text-center">
          <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
            <Check className="w-7 h-7 text-emerald-600" />
          </div>
          <h3 className="text-lg font-black text-slate-900 mb-2">¡Invitación enviada!</h3>
          <p className="text-sm text-slate-500 mb-6">El correo llegará en unos momentos con el código de acceso.</p>
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-700 transition-colors"
          >
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
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center">
              <UserPlus className="w-4.5 h-4.5 text-indigo-600" />
            </div>
            <h2 className="text-base font-black text-slate-900">Invitar colaborador</h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form action={dispatch} className="p-6 space-y-4">
          <input type="hidden" name="empresaSlug" value={empresaSlug} />

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5" htmlFor="inv-email">
              Correo electrónico
            </label>
            <input
              id="inv-email"
              name="email"
              type="email"
              required
              placeholder="nombre@ejemplo.com"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5" htmlFor="inv-rol">
              Rol asignado
            </label>
            <div className="relative">
              <select
                id="inv-rol"
                name="rol"
                required
                defaultValue=""
                className="w-full appearance-none px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent pr-9 bg-white"
              >
                <option value="" disabled>Selecciona un rol…</option>
                {ROLES_INVITABLES.map(r => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
          </div>

          {state?.error && (
            <div className="flex items-center gap-2 px-3.5 py-2.5 bg-rose-50 border border-rose-100 rounded-xl text-sm text-rose-600">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {state.error}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={pending}
              className="flex-1 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-700 disabled:opacity-60 transition-colors flex items-center justify-center gap-2"
            >
              {pending && <Loader2 className="w-4 h-4 animate-spin" />}
              {pending ? 'Enviando…' : 'Enviar invitación'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Rol selector inline ──────────────────────────────────────

function RolSelector({
  usuario,
  empresaSlug,
  currentUserId,
}: {
  usuario: UsuarioRow
  empresaSlug: string
  currentUserId: string
}) {
  const [state, dispatch, pending] = useActionState(cambiarRolUsuario, null)
  const isSelf = usuario.id === currentUserId
  const isAdminGeneral = usuario.rol === 'admin_general'

  if (isSelf || isAdminGeneral) {
    return (
      <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold ${ROL_COLORS[usuario.rol] ?? 'bg-slate-100 text-slate-600'}`}>
        {ROL_LABELS[usuario.rol] ?? usuario.rol}
      </span>
    )
  }

  return (
    <form action={dispatch} className="flex items-center gap-2">
      <input type="hidden" name="empresaSlug" value={empresaSlug} />
      <input type="hidden" name="usuarioId" value={usuario.id} />
      <div className="relative">
        <select
          name="nuevoRol"
          defaultValue={usuario.rol}
          onChange={e => {
            const form = e.target.closest('form') as HTMLFormElement
            if (form) {
              const fd = new FormData(form)
              fd.set('nuevoRol', e.target.value)
              dispatch(fd)
            }
          }}
          disabled={pending}
          className={`appearance-none pl-2.5 pr-7 py-1 rounded-lg border text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60 ${ROL_COLORS[usuario.rol] ?? 'bg-slate-100 text-slate-600'} border-transparent`}
        >
          {ROLES_INVITABLES.map(r => (
            <option key={r.value} value={r.value}>{r.label}</option>
          ))}
        </select>
        {pending
          ? <Loader2 className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 animate-spin text-current opacity-60" />
          : <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-current opacity-60 pointer-events-none" />
        }
      </div>
      {state?.error && <span className="text-xs text-rose-500">{state.error}</span>}
    </form>
  )
}

// ─── Main component ───────────────────────────────────────────

interface Props {
  usuarios: UsuarioRow[]
  invitaciones: InvitacionRow[]
  empresaSlug: string
  currentUserId: string
}

export function UsuariosClient({ usuarios, invitaciones, empresaSlug, currentUserId }: Props) {
  const [showInvite, setShowInvite] = useState(false)

  return (
    <>
      {showInvite && (
        <InvitarModal empresaSlug={empresaSlug} onClose={() => setShowInvite(false)} />
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-black text-slate-900">Equipo</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {usuarios.length} {usuarios.length === 1 ? 'miembro' : 'miembros'} activos
          </p>
        </div>
        <button
          onClick={() => setShowInvite(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 transition-colors shadow-sm shadow-indigo-100"
        >
          <UserPlus className="w-4 h-4" />
          Invitar
        </button>
      </div>

      {/* Users table */}
      <div className="bg-white rounded-2xl border border-slate-200/60 overflow-hidden mb-6">
        {usuarios.length === 0 ? (
          <div className="p-10 text-center">
            <Shield className="w-8 h-8 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-bold text-slate-500">No hay usuarios en esta empresa.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="text-left px-5 py-3 text-xs font-black text-slate-500 uppercase tracking-wide">Usuario</th>
                  <th className="text-left px-4 py-3 text-xs font-black text-slate-500 uppercase tracking-wide">Rol</th>
                  <th className="text-left px-4 py-3 text-xs font-black text-slate-500 uppercase tracking-wide hidden md:table-cell">Último acceso</th>
                  <th className="text-left px-4 py-3 text-xs font-black text-slate-500 uppercase tracking-wide hidden lg:table-cell">Desde</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {usuarios.map(u => (
                  <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0">
                          <span className="text-xs font-black text-indigo-700">
                            {u.nombre_completo.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-black text-slate-900 truncate flex items-center gap-1.5">
                            {u.nombre_completo}
                            {u.id === currentUserId && (
                              <span className="text-[9px] font-black bg-indigo-100 text-indigo-600 px-1.5 py-0.5 rounded-md uppercase tracking-tight">Tú</span>
                            )}
                          </p>
                          <p className="text-xs text-slate-400 truncate flex items-center gap-1">
                            <Mail className="w-3 h-3 shrink-0" />
                            {u.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <RolSelector usuario={u} empresaSlug={empresaSlug} currentUserId={currentUserId} />
                    </td>
                    <td className="px-4 py-3.5 hidden md:table-cell">
                      <span className="flex items-center gap-1.5 text-xs text-slate-500">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        {u.ultima_sesion ? formatRelative(u.ultima_sesion) : 'Nunca'}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 hidden lg:table-cell text-xs text-slate-400">
                      {formatDate(u.creado_en)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pending invitations */}
      {invitaciones.length > 0 && (
        <>
          <h3 className="text-sm font-black text-slate-700 mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            Invitaciones pendientes
          </h3>
          <div className="bg-white rounded-2xl border border-slate-200/60 overflow-hidden">
            <div className="divide-y divide-slate-100">
              {invitaciones.map(inv => {
                const expiresIn = new Date(inv.expires_at).getTime() - Date.now()
                const hrsLeft = Math.floor(expiresIn / 3600000)
                return (
                  <div key={inv.id} className="flex items-center justify-between px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                        <Mail className="w-4 h-4 text-amber-600" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900">{inv.email}</p>
                        <p className="text-xs text-slate-400">
                          {ROL_LABELS[inv.rol] ?? inv.rol} · vence en {hrsLeft}h
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] font-black bg-amber-100 text-amber-600 px-2 py-1 rounded-lg uppercase tracking-tight">
                      Pendiente
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        </>
      )}
    </>
  )
}
