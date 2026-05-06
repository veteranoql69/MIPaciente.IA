'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  Calendar, LayoutDashboard, Users, BarChart3, Settings,
  LogOut, Activity, Menu, X, ChevronLeft, ChevronRight,
} from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import type { Database } from '@/lib/database.types'

type Rol = Database['public']['Tables']['mpaci_usuarios']['Row']['rol']

interface NavItem {
  label: string
  href: string
  icon: React.ElementType
  soon?: boolean
}

const NAV_ITEMS: Record<Rol, NavItem[]> = {
  admin_general: [
    { label: 'Dashboard',     href: 'dashboard',   icon: LayoutDashboard },
    { label: 'Agenda de hoy', href: 'agenda/hoy',  icon: Calendar },
    { label: 'CRM / Prospectos', href: 'crm',      icon: Users,          soon: true },
    { label: 'Estadísticas',  href: 'estadisticas', icon: BarChart3 },
    { label: 'Configuración', href: 'configuracion', icon: Settings,      soon: true },
  ],
  admin: [
    { label: 'Dashboard',     href: 'dashboard',   icon: LayoutDashboard },
    { label: 'Agenda de hoy', href: 'agenda/hoy',  icon: Calendar },
    { label: 'CRM / Prospectos', href: 'crm',      icon: Users,          soon: true },
    { label: 'Estadísticas',  href: 'estadisticas', icon: BarChart3 },
  ],
  gerente: [
    { label: 'Dashboard',     href: 'dashboard',   icon: LayoutDashboard },
    { label: 'Agenda de hoy', href: 'agenda/hoy',  icon: Calendar },
    { label: 'Estadísticas',  href: 'estadisticas', icon: BarChart3 },
  ],
  medico: [
    { label: 'Agenda de hoy', href: 'agenda/hoy',  icon: Calendar },
    { label: 'Fichas clínicas', href: 'fichas',    icon: Activity,       soon: true },
  ],
  asistente: [
    { label: 'Agenda de hoy', href: 'agenda/hoy',  icon: Calendar },
    { label: 'CRM / Prospectos', href: 'crm',      icon: Users,          soon: true },
  ],
  enfermera_tens: [
    { label: 'Agenda de hoy', href: 'agenda/hoy',  icon: Calendar },
  ],
  externo: [
    { label: 'Agenda de hoy', href: 'agenda/hoy',  icon: Calendar },
  ],
  sistema: [],
}

interface Props {
  empresaSlug: string
  empresaNombre: string
  usuarioNombre: string
  usuarioEmail: string
  rol: Rol
}

// ─── Tooltip wrapper para modo colapsado ────────────────────────────────────

function NavTooltip({ label, show, children }: { label: string; show: boolean; children: React.ReactNode }) {
  const [visible, setVisible] = useState(false)
  if (!show) return <>{children}</>
  return (
    <div
      className="relative"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      {children}
      {visible && (
        <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 z-50 pointer-events-none">
          <div className="bg-slate-900 text-white text-xs font-semibold px-2.5 py-1.5 rounded-lg shadow-xl whitespace-nowrap">
            {label}
            <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-slate-900" />
          </div>
        </div>
      )}
    </div>
  )
}

export function SidebarNav({ empresaSlug, empresaNombre, usuarioNombre, usuarioEmail, rol }: Props) {
  const pathname  = usePathname()
  const router    = useRouter()
  const items     = NAV_ITEMS[rol] ?? []

  // ── Mobile open state ──
  const [mobileOpen, setMobileOpen] = useState(false)

  // ── Desktop collapse state — persisted in localStorage ──
  const [collapsed, setCollapsed] = useState(false)
  useEffect(() => {
    setCollapsed(localStorage.getItem('sidebar-collapsed') === 'true')
  }, [])

  function toggleCollapse() {
    const next = !collapsed
    setCollapsed(next)
    localStorage.setItem('sidebar-collapsed', String(next))
  }

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  // ── Initials for avatar ──
  const initials = usuarioNombre
    .split(' ')
    .slice(0, 2)
    .map(w => w[0])
    .join('')
    .toUpperCase()

  return (
    <>
      {/* ─── Mobile toggle button ─────────────────────────────────────── */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2.5 bg-white/90 backdrop-blur-md border border-slate-200 rounded-xl shadow-lg text-slate-600 active:scale-95 transition-all"
        aria-label={mobileOpen ? 'Cerrar menú' : 'Abrir menú'}
      >
        {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* ─── Mobile backdrop ───────────────────────────────────────────── */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ─── Sidebar ───────────────────────────────────────────────────── */}
      <aside
        className={[
          // Shared
          'flex flex-col bg-white border-r border-slate-200/60 transition-all duration-300 ease-in-out',
          // Mobile: fixed overlay
          'fixed inset-y-0 left-0 z-40 w-60',
          mobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full',
          // Desktop: sticky in flex flow, collapsible width, always visible
          'lg:relative lg:inset-auto lg:z-auto lg:translate-x-0 lg:sticky lg:top-0 lg:h-dvh',
          collapsed ? 'lg:w-14' : 'lg:w-60',
        ].join(' ')}
      >
        {/* ── Logo / Brand ── */}
        <div className={`flex items-center border-b border-slate-100 transition-all duration-300 ${collapsed ? 'px-3 py-5 justify-center' : 'px-5 py-6 gap-3'}`}>
          <Link
            href={`/${empresaSlug}/dashboard`}
            onClick={() => setMobileOpen(false)}
            className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-100 shrink-0 hover:bg-indigo-700 transition-colors"
            title="Mi-Paciente"
          >
            <Activity className="w-5 h-5 text-white" />
          </Link>
          {!collapsed && (
            <div className="min-w-0 overflow-hidden">
              <p className="text-base font-black text-slate-900 tracking-tight truncate">Mi-Paciente</p>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest font-black truncate">
                {empresaNombre}
              </p>
            </div>
          )}
        </div>

        {/* ── Nav items ── */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden py-4 space-y-0.5 px-2" aria-label="Navegación principal">
          {items.map(item => {
            const href     = `/${empresaSlug}/${item.href}`
            const isActive = pathname === href || pathname.startsWith(href + '/')
            const Icon     = item.icon

            if (item.soon) {
              return (
                <NavTooltip key={item.href} label={item.label} show={collapsed}>
                  <div
                    className={`flex items-center gap-3 rounded-2xl text-slate-400 opacity-60 cursor-not-allowed select-none transition-all duration-300 ${collapsed ? 'px-2.5 py-3 justify-center' : 'px-4 py-3'}`}
                    title={collapsed ? undefined : 'Disponible próximamente'}
                  >
                    <Icon className="w-5 h-5 shrink-0" />
                    {!collapsed && (
                      <>
                        <span className="text-sm font-bold flex-1 whitespace-nowrap">{item.label}</span>
                        <span className="text-[9px] font-black bg-slate-100 px-1.5 py-0.5 rounded-md text-slate-400 uppercase tracking-tight">
                          Pronto
                        </span>
                      </>
                    )}
                  </div>
                </NavTooltip>
              )
            }

            return (
              <NavTooltip key={item.href} label={item.label} show={collapsed}>
                <Link
                  href={href}
                  onClick={() => setMobileOpen(false)}
                  aria-current={isActive ? 'page' : undefined}
                  className={[
                    'flex items-center gap-3 rounded-2xl transition-all duration-200',
                    collapsed ? 'px-2.5 py-3 justify-center' : 'px-4 py-3',
                    isActive
                      ? 'bg-indigo-50 text-indigo-700 shadow-sm border border-indigo-100/50'
                      : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900',
                  ].join(' ')}
                >
                  <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                  {!collapsed && (
                    <span className={`text-sm whitespace-nowrap ${isActive ? 'font-black' : 'font-bold'}`}>
                      {item.label}
                    </span>
                  )}
                </Link>
              </NavTooltip>
            )
          })}
        </nav>

        {/* ── User profile + logout ── */}
        <div className={`border-t border-slate-100 bg-slate-50/50 transition-all duration-300 ${collapsed ? 'p-2 space-y-1' : 'p-3 space-y-1'}`}>
          {collapsed ? (
            // Collapsed: just avatar
            <NavTooltip label={usuarioNombre} show>
              <div className="flex items-center justify-center py-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-100 flex items-center justify-center">
                  <span className="text-xs font-black text-indigo-700">{initials}</span>
                </div>
              </div>
            </NavTooltip>
          ) : (
            // Expanded: full profile card
            <div className="flex items-center gap-3 px-3 py-2.5 bg-white rounded-2xl border border-slate-200/60 shadow-sm">
              <div className="w-8 h-8 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0">
                <span className="text-xs font-black text-indigo-700">{initials}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-black text-slate-800 truncate leading-none mb-0.5">{usuarioNombre}</p>
                <p className="text-[10px] font-bold text-slate-500 truncate">{usuarioEmail}</p>
              </div>
            </div>
          )}

          <NavTooltip label="Cerrar sesión" show={collapsed}>
            <button
              onClick={handleLogout}
              className={[
                'flex items-center gap-3 rounded-2xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-all duration-200 w-full cursor-pointer group',
                collapsed ? 'px-2.5 py-2.5 justify-center' : 'px-4 py-2.5',
              ].join(' ')}
            >
              <LogOut className="w-4 h-4 shrink-0 group-hover:translate-x-0.5 transition-transform" />
              {!collapsed && <span className="text-sm font-bold whitespace-nowrap">Cerrar sesión</span>}
            </button>
          </NavTooltip>
        </div>

        {/* ─── Desktop collapse toggle — flota en el borde derecho ─────── */}
        <button
          onClick={toggleCollapse}
          className={[
            'hidden lg:flex absolute top-20 -right-3 z-50',
            'w-6 h-6 rounded-full bg-white border border-slate-200 shadow-md',
            'items-center justify-center text-slate-400',
            'hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200',
            'hover:shadow-lg hover:shadow-indigo-100',
            'transition-all duration-200 active:scale-90',
          ].join(' ')}
          title={collapsed ? 'Expandir menú' : 'Colapsar menú'}
          aria-label={collapsed ? 'Expandir menú' : 'Colapsar menú'}
        >
          {collapsed
            ? <ChevronRight className="w-3.5 h-3.5" />
            : <ChevronLeft  className="w-3.5 h-3.5" />
          }
        </button>
      </aside>
    </>
  )
}
