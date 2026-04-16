import { LayoutDashboard, TrendingUp, Users, Calendar, DollarSign, Clock } from 'lucide-react'

type Props = {
  params: Promise<{ empresa_slug: string }>
}

export default async function DashboardPage({ params }: Props) {
  await params

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Resumen operativo de tu clínica</p>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Citas hoy', value: '—', icon: Calendar, color: 'border-primary' },
          { label: 'Prospectos activos', value: '—', icon: Users, color: 'border-violet-400' },
          { label: 'Ingresos del mes', value: '—', icon: DollarSign, color: 'border-accent' },
          { label: 'Tasa conversión', value: '—', icon: TrendingUp, color: 'border-amber-400' },
        ].map(kpi => (
          <div key={kpi.label} className={`bg-card border border-border rounded-xl p-4 border-l-4 ${kpi.color}`}>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">{kpi.label}</p>
              <kpi.icon className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
            </div>
            <p className="text-3xl font-bold text-foreground">{kpi.value}</p>
            <p className="text-xs text-muted-foreground mt-1">Sin datos aún</p>
          </div>
        ))}
      </div>

      {/* Empty state */}
      <div className="bg-card border border-border rounded-2xl p-12 flex flex-col items-center text-center">
        <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center mb-4">
          <LayoutDashboard className="w-8 h-8 text-primary" aria-hidden="true" />
        </div>
        <h2 className="text-lg font-semibold text-foreground mb-2">Dashboard en construcción</h2>
        <p className="text-sm text-muted-foreground max-w-sm leading-relaxed">
          Gráficos de conversión, ingresos y actividad del equipo llegan en Sprint 4 junto con el módulo CRM.
        </p>
        <div className="mt-6 flex items-center gap-2 px-4 py-2 bg-muted rounded-full text-xs text-muted-foreground font-medium">
          <Clock className="w-3.5 h-3.5" aria-hidden="true" />
          Disponible en Sprint 4
        </div>
      </div>
    </div>
  )
}
