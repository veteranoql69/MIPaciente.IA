'use client'

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
  medico: [
    { label: 'Agenda de hoy', href: 'agenda/hoy', icon: Calendar },
    { label: 'Fichas clínicas', href: 'fichas', icon: Activity, soon: true },
  ],
  asistente: [
    { label: 'Agenda de hoy', href: 'agenda/hoy', icon: Calendar },
    { label: 'CRM / Prospectos', href: 'crm', icon: Users, soon: true },
  ],
  gerente: [
    { label: 'Dashboard', href: 'dashboard', icon: LayoutDashboard },
    { label: 'CRM / Prospectos', href: 'crm', icon: Users, soon: true },
    { label: 'Estadísticas', href: 'estadisticas', icon: BarChart3 },
  ],
  admin: [
    { label: 'Dashboard', href: 'dashboard', icon: LayoutDashboard },
    { label: 'CRM / Prospectos', href: 'crm', icon: Users, soon: true },
    { label: 'Estadísticas', href: 'estadisticas', icon: BarChart3 },
    { label: 'Configuración', href: 'configuracion', icon: Settings, soon: true },
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
  const items = NAV_ITEMS[rol] ?? []

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <aside className="fixed inset-y-0 left-0 z-40 w-60 flex flex-col bg-sidebar border-r border-sidebar-border">
      {/* Logo + company */}
      <div className="px-5 py-5 border-b border-sidebar-border">
        <Link href={`/${empresaSlug}/dashboard`} className="flex items-center gap-2.5 mb-3">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <Activity className="w-4 h-4 text-white" aria-hidden="true" />
          </div>
          <span className="text-base font-bold text-foreground">Mi-Paciente</span>
        </Link>
        <div className="px-1">
          <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Clínica</p>
          <p className="text-sm font-semibold text-foreground truncate" title={empresaNombre}>
            {empresaNombre}
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5" aria-label="Navegación principal">
        {items.map(item => {
          const href = `/${empresaSlug}/${item.href}`
          const isActive = pathname === href || pathname.startsWith(href + '/')
          const Icon = item.icon

          if (item.soon) {
            return (
              <div
                key={item.href}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-muted-foreground opacity-50 cursor-not-allowed select-none"
                title="Disponible próximamente"
                aria-disabled="true"
              >
                <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span className="text-sm font-medium flex-1">{item.label}</span>
                <span className="text-[10px] font-semibold bg-muted px-1.5 py-0.5 rounded text-muted-foreground">
                  Pronto
                </span>
              </div>
            )
          }

          return (
            <Link
              key={item.href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                isActive
                  ? 'bg-secondary text-primary font-semibold border-r-[3px] border-primary -mr-3 pr-[calc(0.75rem+3px)]'
                  : 'text-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
              }`}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span className="text-sm">{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* User + logout */}
      <div className="px-3 py-4 border-t border-sidebar-border space-y-1">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-7 h-7 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
            <span className="text-xs font-bold text-primary uppercase">
              {usuarioNombre.charAt(0)}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-foreground truncate">{usuarioNombre}</p>
            <p className="text-[11px] text-muted-foreground truncate">{usuarioEmail}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-red-50 transition-colors w-full text-left cursor-pointer"
        >
          <LogOut className="w-4 h-4 shrink-0" aria-hidden="true" />
          <span className="text-sm font-medium">Cerrar sesión</span>
        </button>
      </div>
    </aside>
  )
}
