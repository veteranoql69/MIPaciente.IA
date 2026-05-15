'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Users, ShieldCheck, Layout, Stethoscope } from 'lucide-react'

const TABS = [
  { href: 'usuarios',   label: 'Usuarios',         icon: Users },
  { href: 'roles',      label: 'Roles y Permisos',  icon: ShieldCheck },
  { href: 'plantillas', label: 'Plantillas',        icon: Layout },
  { href: 'clinica',    label: 'Clínica',           icon: Stethoscope },
]

export function ConfigTabNav({ empresaSlug }: { empresaSlug: string }) {
  const pathname = usePathname()

  return (
    <nav
      className="flex gap-1 p-1 bg-slate-100 rounded-2xl w-fit mb-8"
      aria-label="Secciones de configuración"
    >
      {TABS.map(tab => {
        const href = `/${empresaSlug}/configuracion/${tab.href}`
        const isActive = pathname.startsWith(href)
        const Icon = tab.icon
        return (
          <Link
            key={tab.href}
            href={href}
            className={[
              'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all duration-200',
              isActive
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-700',
            ].join(' ')}
          >
            <Icon className="w-4 h-4" />
            <span className="hidden sm:inline">{tab.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
