'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronLeft, ChevronRight, CalendarDays, CalendarRange, Calendar } from 'lucide-react'

type Props = {
  empresaSlug: string
  fechaLabel: string
  prevHref: string
  nextHref: string
}

export function AgendaViewNav({ empresaSlug, fechaLabel, prevHref, nextHref }: Props) {
  const pathname = usePathname()

  const tabs = [
    { label: 'Día',    href: `/${empresaSlug}/agenda/hoy`,    icon: CalendarDays },
    { label: 'Semana', href: `/${empresaSlug}/agenda/semana`, icon: CalendarRange },
    { label: 'Mes',    href: `/${empresaSlug}/agenda/mes`,    icon: Calendar },
  ]

  return (
    <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200/60 bg-white">
      {/* Tabs vista */}
      <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
        {tabs.map(({ label, href, icon: Icon }) => {
          const active = pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                active
                  ? 'bg-white text-indigo-700 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </Link>
          )
        })}
      </div>

      {/* Navegación de fecha */}
      <div className="flex items-center gap-2">
        <Link
          href={prevHref}
          className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </Link>
        <span className="text-sm font-semibold text-slate-700 min-w-[180px] text-center capitalize">
          {fechaLabel}
        </span>
        <Link
          href={nextHref}
          className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  )
}
