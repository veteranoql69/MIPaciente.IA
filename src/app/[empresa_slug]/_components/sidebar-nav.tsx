'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  Calendar,
  LayoutDashboard,
  Users,
  BarChart3,
  Settings,
  LogOut,
  Activity,
  Menu,
  X
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
    { label: 'Dashboard', href: 'dashboard', icon: LayoutDashboard },
    { label: 'Agenda de hoy', href: 'agenda/hoy', icon: Calendar },
    { label: 'CRM / Prospectos', href: 'crm', icon: Users, soon: true },
    { label: 'Estadísticas', href: 'estadisticas', icon: BarChart3 },
    { label: 'Configuración', href: 'configuracion', icon: Settings, soon: true },
  ],
  admin: [
    { label: 'Dashboard', href: 'dashboard', icon: LayoutDashboard },
    { label: 'Agenda de hoy', href: 'agenda/hoy', icon: Calendar },
    { label: 'CRM / Prospectos', href: 'crm', icon: Users, soon: true },
    { label: 'Estadísticas', href: 'estadisticas', icon: BarChart3 },
  ],
  gerente: [
    { label: 'Dashboard', href: 'dashboard', icon: LayoutDashboard },
    { label: 'Agenda de hoy', href: 'agenda/hoy', icon: Calendar },
    { label: 'Estadísticas', href: 'estadisticas', icon: BarChart3 },
  ],
  medico: [
    { label: 'Agenda de hoy', href: 'agenda/hoy', icon: Calendar },
    { label: 'Fichas clínicas', href: 'fichas', icon: Activity, soon: true },
  ],
  asistente: [
    { label: 'Agenda de hoy', href: 'agenda/hoy', icon: Calendar },
    { label: 'CRM / Prospectos', href: 'crm', icon: Users, soon: true },
  ],
  enfermera_tens: [
    { label: 'Agenda de hoy', href: 'agenda/hoy', icon: Calendar },
  ],
  externo: [
    { label: 'Agenda de hoy', href: 'agenda/hoy', icon: Calendar },
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

export function SidebarNav({
  empresaSlug,
  empresaNombre,
  usuarioNombre,
  usuarioEmail,
  rol,
}: Props) {
  const pathname = usePathname()
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const items = NAV_ITEMS[rol] ?? []

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <>
      {/* Mobile Toggle Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2.5 bg-white/80 backdrop-blur-md border border-slate-200 rounded-xl shadow-lg shadow-indigo-100 text-slate-600 active:scale-95 transition-all"
        aria-label={isOpen ? "Cerrar menú" : "Abrir menú"}
      >
        {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Backdrop for mobile */}
      {isOpen && (
        <div 
          className="lg:hidden fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside className={`
        fixed inset-y-0 left-0 z-40 w-60 flex flex-col bg-white border-r border-slate-200/60
        transition-transform duration-300 ease-in-out lg:translate-x-0
        ${isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Logo + company */}
        <div className="px-6 py-8 border-b border-slate-100">
          <Link 
            href={`/${empresaSlug}/dashboard`} 
            className="flex items-center gap-3 mb-6"
            onClick={() => setIsOpen(false)}
          >
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-100">
              <Activity className="w-5 h-5 text-white" aria-hidden="true" />
            </div>
            <span className="text-lg font-black text-slate-900 tracking-tight">Mi-Paciente</span>
          </Link>
          <div className="px-1">
            <p className="text-[10px] text-slate-400 uppercase tracking-[0.2em] font-black mb-1">Clínica</p>
            <p className="text-sm font-bold text-slate-700 truncate" title={empresaNombre}>
              {empresaNombre}
            </p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-1.5" aria-label="Navegación principal">
          {items.map(item => {
            const href = `/${empresaSlug}/${item.href}`
            const isActive = pathname === href || pathname.startsWith(href + '/')
            const Icon = item.icon

            if (item.soon) {
              return (
                <div
                  key={item.href}
                  className="flex items-center gap-3 px-4 py-3 rounded-2xl text-slate-400 opacity-60 cursor-not-allowed select-none"
                  title="Disponible próximamente"
                >
                  <Icon className="w-5 h-5 shrink-0" aria-hidden="true" />
                  <span className="text-sm font-bold flex-1">{item.label}</span>
                  <span className="text-[9px] font-black bg-slate-100 px-1.5 py-0.5 rounded-md text-slate-500 uppercase tracking-tighter">
                    Pronto
                  </span>
                </div>
              )
            }

            return (
              <Link
                key={item.href}
                href={href}
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-200 ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-700 shadow-sm border border-indigo-100/50'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                }`}
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} aria-hidden="true" />
                <span className={`text-sm ${isActive ? 'font-black' : 'font-bold'}`}>{item.label}</span>
              </Link>
            )
          })}
        </nav>

        {/* User + logout */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3 p-3 bg-white rounded-2xl border border-slate-200/60 shadow-sm mb-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0">
              <span className="text-xs font-black text-indigo-700 uppercase">
                {usuarioNombre.charAt(0)}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-black text-slate-800 truncate leading-none mb-0.5">{usuarioNombre}</p>
              <p className="text-[10px] font-bold text-slate-500 truncate">{usuarioEmail}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 rounded-2xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-all duration-200 w-full text-left cursor-pointer group"
          >
            <LogOut className="w-5 h-5 shrink-0 group-hover:translate-x-0.5 transition-transform" aria-hidden="true" />
            <span className="text-sm font-bold">Cerrar sesión</span>
          </button>
        </div>
      </aside>
    </>
  )
}

