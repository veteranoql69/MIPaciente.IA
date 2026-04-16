import { Calendar, Plus, Clock } from 'lucide-react'

type Props = {
  params: Promise<{ empresa_slug: string }>
}

export default async function AgendaHoyPage({ params }: Props) {
  const { empresa_slug } = await params

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Agenda de hoy</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {new Date().toLocaleDateString('es-CL', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </p>
        </div>
        <button
          className="flex items-center gap-2 px-4 py-2.5 bg-accent text-white rounded-lg font-semibold text-sm hover:opacity-90 transition-opacity min-h-[44px] cursor-pointer"
          aria-label="Nueva cita"
        >
          <Plus className="w-4 h-4" aria-hidden="true" />
          Nueva cita
        </button>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Citas hoy', value: '—', color: 'border-primary' },
          { label: 'Confirmadas', value: '—', color: 'border-accent' },
          { label: 'Pendientes', value: '—', color: 'border-amber-400' },
        ].map(kpi => (
          <div key={kpi.label} className={`bg-card border border-border rounded-xl p-4 border-l-4 ${kpi.color}`}>
            <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium mb-1">{kpi.label}</p>
            <p className="text-3xl font-bold text-foreground">{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* Empty state */}
      <div className="bg-card border border-border rounded-2xl p-12 flex flex-col items-center text-center">
        <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center mb-4">
          <Calendar className="w-8 h-8 text-primary" aria-hidden="true" />
        </div>
        <h2 className="text-lg font-semibold text-foreground mb-2">Agenda en construcción</h2>
        <p className="text-sm text-muted-foreground max-w-sm leading-relaxed">
          El módulo de agenda con vista semanal, bloques horarios y drag-and-drop llega en Sprint 3.
        </p>
        <div className="mt-6 flex items-center gap-2 px-4 py-2 bg-muted rounded-full text-xs text-muted-foreground font-medium">
          <Clock className="w-3.5 h-3.5" aria-hidden="true" />
          Disponible en Sprint 3
        </div>
      </div>
    </div>
  )
}
