import { 
  Calendar, 
  Plus, 
  Clock, 
  Users, 
  CheckCircle2, 
  AlertCircle, 
  ChevronLeft, 
  ChevronRight, 
  MoreHorizontal,
  Search,
  Filter,
  CalendarDays,
  Activity
} from 'lucide-react'

type Props = {
  params: Promise<{ empresa_slug: string }>
}

export default async function AgendaHoyPage({ params }: Props) {
  const { empresa_slug } = await params

  // Formatted date
  const today = new Date()
  const formattedDate = today.toLocaleDateString('es-CL', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
  const capitalizedDate = formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1)

  // Mock appointments
  const appointments = [
    { id: 1, time: '09:00', patient: 'María González', type: 'Primera Consulta', status: 'confirmada', duration: '45 min', room: 'Box 102' },
    { id: 2, time: '10:00', patient: 'Carlos Silva', type: 'Control Post-Op', status: 'pendiente', duration: '30 min', room: 'Box 105' },
    { id: 3, time: '11:30', patient: 'Ana Soto', type: 'Procedimiento Estético', status: 'confirmada', duration: '60 min', room: 'Pabellón A' },
    { id: 4, time: '14:00', patient: 'Felipe Reyes', type: 'Control', status: 'cancelada', duration: '30 min', room: 'Box 102' },
    { id: 5, time: '15:30', patient: 'Laura Medina', type: 'Evaluación Inicial', status: 'pendiente', duration: '45 min', room: 'Box 108' },
  ]

  return (
    <div className="flex flex-col h-full bg-slate-50/50">
      {/* Premium Header */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200/60 px-8 py-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-200">
              <CalendarDays className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Agenda Médica</h1>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <p className="text-sm font-medium text-slate-500">{capitalizedDate}</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden lg:flex items-center bg-slate-100 rounded-xl p-1 border border-slate-200/50">
              <button className="px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-white hover:shadow-sm rounded-lg transition-all">Día</button>
              <button className="px-3 py-1.5 text-xs font-bold text-slate-400 hover:text-slate-600 rounded-lg transition-all">Semana</button>
              <button className="px-3 py-1.5 text-xs font-bold text-slate-400 hover:text-slate-600 rounded-lg transition-all">Mes</button>
            </div>
            
            <div className="h-8 w-px bg-slate-200 mx-1 hidden md:block" />
            
            <button className="p-2.5 text-slate-500 hover:bg-slate-100 rounded-xl border border-slate-200 transition-all">
              <Filter className="w-5 h-5" />
            </button>
            
            <button className="flex items-center gap-2.5 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm transition-all shadow-lg shadow-indigo-100 active:scale-95">
              <Plus className="w-5 h-5" />
              Nueva Cita
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 p-8 grid grid-cols-1 xl:grid-cols-4 gap-8">
        {/* Main Agenda Section */}
        <div className="xl:col-span-3 space-y-6">
          {/* Quick Filters */}
          <div className="flex items-center justify-between bg-white p-2 rounded-2xl border border-slate-200/60 shadow-sm">
            <div className="flex items-center gap-1">
              <button className="px-4 py-2 text-sm font-bold bg-indigo-50 text-indigo-700 rounded-xl">Todos</button>
              <button className="px-4 py-2 text-sm font-bold text-slate-500 hover:bg-slate-50 rounded-xl transition-all">Confirmados</button>
              <button className="px-4 py-2 text-sm font-bold text-slate-500 hover:bg-slate-50 rounded-xl transition-all">Pendientes</button>
            </div>
            <div className="relative group hidden sm:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Buscar paciente..." 
                className="pl-10 pr-4 py-2 bg-slate-50 border-transparent focus:bg-white focus:border-indigo-200 rounded-xl text-sm transition-all outline-none w-64"
              />
            </div>
          </div>

          {/* Timeline / List */}
          <div className="space-y-4">
            {appointments.map((apt) => (
              <div 
                key={apt.id} 
                className="group relative bg-white hover:bg-indigo-50/30 border border-slate-200/60 rounded-[1.5rem] p-5 transition-all hover:shadow-md hover:border-indigo-100 flex items-center gap-6"
              >
                {/* Time Indicator */}
                <div className="flex flex-col items-center justify-center w-20 border-r border-slate-100 pr-6">
                  <span className="text-lg font-black text-slate-900 leading-none">{apt.time}</span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mt-1">{apt.duration}</span>
                </div>

                {/* Patient Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="text-base font-bold text-slate-800 truncate">{apt.patient}</h3>
                    <span className={`px-2 py-0.5 text-[10px] font-black uppercase tracking-widest rounded-md ${
                      apt.status === 'confirmada' ? 'bg-emerald-100 text-emerald-700' :
                      apt.status === 'pendiente' ? 'bg-amber-100 text-amber-700' :
                      'bg-slate-100 text-slate-500'
                    }`}>
                      {apt.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-xs font-medium text-slate-500">
                    <span className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                      {apt.type}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                      {apt.room}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button className="p-2.5 text-slate-400 hover:text-indigo-600 hover:bg-white rounded-xl border border-transparent hover:border-indigo-100 transition-all">
                    <CheckCircle2 className="w-5 h-5" />
                  </button>
                  <button className="p-2.5 text-slate-400 hover:text-slate-600 hover:bg-white rounded-xl border border-transparent hover:border-slate-200 transition-all">
                    <MoreHorizontal className="w-5 h-5" />
                  </button>
                </div>

                {/* Left Accent Bar */}
                <div className={`absolute left-0 top-6 bottom-6 w-1 rounded-r-full ${
                  apt.status === 'confirmada' ? 'bg-emerald-500' :
                  apt.status === 'pendiente' ? 'bg-amber-500' :
                  'bg-slate-300'
                }`} />
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar Summary */}
        <div className="hidden xl:block space-y-6">
          <div className="bg-indigo-600 rounded-[2rem] p-6 text-white shadow-xl shadow-indigo-200">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Resumen Hoy
            </h3>
            <div className="space-y-4">
              <div className="bg-white/10 rounded-2xl p-4 backdrop-blur-sm">
                <p className="text-white/60 text-xs font-bold uppercase tracking-wider mb-1">Confirmados</p>
                <div className="flex items-end gap-2">
                  <p className="text-3xl font-black leading-none">12</p>
                  <p className="text-xs font-bold text-white/40 pb-0.5">pacientes</p>
                </div>
              </div>
              <div className="bg-white/10 rounded-2xl p-4 backdrop-blur-sm">
                <p className="text-white/60 text-xs font-bold uppercase tracking-wider mb-1">Por Confirmar</p>
                <div className="flex items-end gap-2">
                  <p className="text-3xl font-black leading-none">04</p>
                  <p className="text-xs font-bold text-white/40 pb-0.5">pendientes</p>
                </div>
              </div>
            </div>
            <button className="w-full mt-6 py-3 bg-white text-indigo-600 rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-black/10 hover:bg-slate-50 transition-all">
              Ver Reporte Diario
            </button>
          </div>

          <div className="bg-white rounded-[2rem] border border-slate-200/60 p-6 shadow-sm">
            <h3 className="text-sm font-bold text-slate-800 mb-4 uppercase tracking-widest">Novedades</h3>
            <div className="flex items-start gap-3 p-3 bg-amber-50 rounded-2xl border border-amber-100">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
              <p className="text-xs font-medium text-amber-800 leading-relaxed">
                Recuerda que la agenda interactiva completa estará disponible en el Sprint 3.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
