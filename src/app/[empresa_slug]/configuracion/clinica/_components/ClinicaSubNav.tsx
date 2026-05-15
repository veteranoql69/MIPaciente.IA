'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Tag, Building2, Stethoscope } from 'lucide-react'

const SUBNAV = [
  { href: 'servicios',   label: 'Servicios',       icon: Tag },
  { href: 'sedes',       label: 'Sedes y Salas',   icon: Building2 },
  { href: 'prestadores', label: 'Prestadores',     icon: Stethoscope },
]

export function ClinicaSubNav({ empresaSlug }: { empresaSlug: string }) {
  const pathname = usePathname()

  return (
    <div className="flex gap-1 mb-6 border-b border-slate-200">
      {SUBNAV.map(tab => {
        const href = `/${empresaSlug}/configuracion/clinica/${tab.href}`
        const isActive = pathname.startsWith(href)
        const Icon = tab.icon
        return (
          <Link
            key={tab.href}
            href={href}
            className={[
              'flex items-center gap-1.5 px-4 py-2.5 text-sm font-bold transition-all duration-150 border-b-2 -mb-px',
              isActive
                ? 'border-indigo-600 text-indigo-700'
                : 'border-transparent text-slate-500 hover:text-slate-800',
            ].join(' ')}
          >
            <Icon className="w-4 h-4" />
            <span className="hidden sm:inline">{tab.label}</span>
          </Link>
        )
      })}
    </div>
  )
}
