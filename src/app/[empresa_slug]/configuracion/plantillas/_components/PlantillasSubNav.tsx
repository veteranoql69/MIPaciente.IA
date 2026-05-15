'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ShieldCheck, FileText } from 'lucide-react'

const SUBNAV = [
  { href: 'permisos',   label: 'Permisos por Rol', icon: ShieldCheck },
  { href: 'documentos', label: 'Documentos',        icon: FileText },
]

export function PlantillasSubNav({ empresaSlug }: { empresaSlug: string }) {
  const pathname = usePathname()

  return (
    <div className="flex gap-1 mb-6 border-b border-slate-200">
      {SUBNAV.map(tab => {
        const href = `/${empresaSlug}/configuracion/plantillas/${tab.href}`
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
