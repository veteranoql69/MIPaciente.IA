import { BarChart3, Clock } from 'lucide-react'

type Props = {
  params: Promise<{ empresa_slug: string }>
}

export default async function EstadisticasPage({ params }: Props) {
  await params

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Estadísticas</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Análisis de rendimiento de la clínica</p>
      </div>

      {/* Placeholder cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
        {[
          'Ingresos por período',
          'Citas por médico',
          'Tasa de conversión del funnel',
          'Canales de origen',
          'Servicios más solicitados',
          'Retención de pacientes',
        ].map(title => (
          <div key={title} className="bg-card border border-border rounded-xl p-5">
            <p className="text-sm font-medium text-muted-foreground mb-4">{title}</p>
            <div className="h-28 bg-muted rounded-lg flex items-center justify-center">
              <BarChart3 className="w-8 h-8 text-muted-foreground/40" aria-hidden="true" />
            </div>
          </div>
        ))}
      </div>

      {/* Coming soon banner */}
      <div className="bg-card border border-border rounded-2xl p-8 flex flex-col items-center text-center">
        <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center mb-4">
          <BarChart3 className="w-8 h-8 text-primary" aria-hidden="true" />
        </div>
        <h2 className="text-lg font-semibold text-foreground mb-2">Módulo de estadísticas</h2>
        <p className="text-sm text-muted-foreground max-w-sm leading-relaxed">
          Reportes con datos reales, exportación a Excel y comparativas mensuales llegan en Sprint 6.
        </p>
        <div className="mt-6 flex items-center gap-2 px-4 py-2 bg-muted rounded-full text-xs text-muted-foreground font-medium">
          <Clock className="w-3.5 h-3.5" aria-hidden="true" />
          Disponible en Sprint 6
        </div>
      </div>
    </div>
  )
}
