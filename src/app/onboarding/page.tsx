'use client'

import { useEffect, useState, useActionState } from 'react'
import { Building2, User, CheckCircle2, ChevronRight, ChevronLeft, Loader2 } from 'lucide-react'
import { getEmpresasActivas, completeOnboarding } from './actions'

type Empresa = { id: string; nombre: string; slug: string }

const STEPS = ['Clínica', 'Tu nombre', 'Confirmación']

export default function OnboardingPage() {
  const [step, setStep] = useState(0)
  const [empresas, setEmpresas] = useState<Empresa[]>([])
  const [loadingEmpresas, setLoadingEmpresas] = useState(true)
  const [selectedEmpresaId, setSelectedEmpresaId] = useState('')
  const [nombreCompleto, setNombreCompleto] = useState('')

  const [state, action, isPending] = useActionState(completeOnboarding, null)

  useEffect(() => {
    getEmpresasActivas()
      .then(setEmpresas)
      .catch(() => {/* handled in render */})
      .finally(() => setLoadingEmpresas(false))
  }, [])

  const selectedEmpresa = empresas.find(e => e.id === selectedEmpresaId)

  const canAdvance = step === 0
    ? !!selectedEmpresaId
    : step === 1
      ? nombreCompleto.trim().length >= 2
      : false

  return (
    <div className="min-h-dvh bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <span className="text-2xl font-bold text-primary">Mi-Paciente</span>
          <p className="text-muted-foreground text-sm mt-1">Configura tu cuenta en 3 pasos</p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {STEPS.map((label, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold transition-colors ${
                i < step
                  ? 'bg-accent text-white'
                  : i === step
                    ? 'bg-primary text-white'
                    : 'bg-muted text-muted-foreground'
              }`}>
                {i < step ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
              </div>
              <span className={`text-xs font-medium hidden sm:block ${
                i === step ? 'text-foreground' : 'text-muted-foreground'
              }`}>
                {label}
              </span>
              {i < STEPS.length - 1 && (
                <div className={`w-6 h-px mx-1 ${i < step ? 'bg-accent' : 'bg-border'}`} />
              )}
            </div>
          ))}
        </div>

        {/* Card */}
        <div className="bg-card border border-border rounded-2xl p-6 shadow-md">

          {/* Step 0: Select empresa */}
          {step === 0 && (
            <div>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="font-semibold text-foreground">Selecciona tu clínica</h2>
                  <p className="text-xs text-muted-foreground">Elige la clínica donde trabajas</p>
                </div>
              </div>

              {loadingEmpresas ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-5 h-5 animate-spin text-primary" />
                </div>
              ) : empresas.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No hay clínicas disponibles. Contacta al administrador.
                </p>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {empresas.map(empresa => (
                    <button
                      key={empresa.id}
                      type="button"
                      onClick={() => setSelectedEmpresaId(empresa.id)}
                      className={`w-full text-left px-4 py-3 rounded-xl border transition-all cursor-pointer ${
                        selectedEmpresaId === empresa.id
                          ? 'border-primary bg-secondary text-primary font-semibold'
                          : 'border-border bg-card text-foreground hover:bg-muted hover:border-primary/50'
                      }`}
                    >
                      <span className="text-sm">{empresa.nombre}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 1: nombre_completo */}
          {step === 1 && (
            <div>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                  <User className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="font-semibold text-foreground">¿Cómo te llamas?</h2>
                  <p className="text-xs text-muted-foreground">Tu nombre aparecerá en registros y fichas</p>
                </div>
              </div>
              <div>
                <label htmlFor="nombre_completo" className="block text-sm font-medium text-foreground mb-1.5">
                  Nombre completo <span className="text-destructive">*</span>
                </label>
                <input
                  id="nombre_completo"
                  type="text"
                  value={nombreCompleto}
                  onChange={e => setNombreCompleto(e.target.value)}
                  placeholder="Ej: Dr. Carlos Martínez"
                  autoFocus
                  autoComplete="name"
                  className="w-full px-3.5 py-2.5 border border-input rounded-lg text-base text-foreground bg-card focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary transition-colors min-h-[44px]"
                />
                <p className="text-xs text-muted-foreground mt-1.5">Mínimo 2 caracteres</p>
              </div>
            </div>
          )}

          {/* Step 2: Confirmation + submit */}
          {step === 2 && (
            <form action={action}>
              <input type="hidden" name="empresa_id" value={selectedEmpresaId} />
              <input type="hidden" name="nombre_completo" value={nombreCompleto.trim()} />

              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="font-semibold text-foreground">Confirma tus datos</h2>
                  <p className="text-xs text-muted-foreground">Revisa antes de finalizar</p>
                </div>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex items-center justify-between px-4 py-3 bg-muted rounded-xl">
                  <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Clínica</span>
                  <span className="text-sm font-semibold text-foreground">{selectedEmpresa?.nombre}</span>
                </div>
                <div className="flex items-center justify-between px-4 py-3 bg-muted rounded-xl">
                  <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Nombre</span>
                  <span className="text-sm font-semibold text-foreground">{nombreCompleto.trim()}</span>
                </div>
                <div className="flex items-center justify-between px-4 py-3 bg-muted rounded-xl">
                  <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Rol inicial</span>
                  <span className="text-sm font-semibold text-foreground">Asistente</span>
                </div>
              </div>

              <p className="text-xs text-muted-foreground mb-4">
                El administrador de tu clínica puede cambiar tu rol cuando sea necesario.
              </p>

              {state?.error && (
                <div role="alert" className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                  {state.error}
                </div>
              )}

              <button
                type="submit"
                disabled={isPending}
                className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-accent text-white rounded-xl font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] cursor-pointer"
              >
                {isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Comenzar a usar Mi-Paciente
                  </>
                )}
              </button>
            </form>
          )}

          {/* Navigation (steps 0 and 1) */}
          {step < 2 && (
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-border">
              <button
                type="button"
                onClick={() => setStep(s => s - 1)}
                disabled={step === 0}
                className="flex items-center gap-1 px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                Anterior
              </button>
              <button
                type="button"
                onClick={() => setStep(s => s + 1)}
                disabled={!canAdvance}
                className="flex items-center gap-1 px-4 py-2 bg-primary text-white rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed min-h-[44px] cursor-pointer"
              >
                Siguiente
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Back from step 2 */}
          {step === 2 && (
            <button
              type="button"
              onClick={() => setStep(1)}
              className="mt-4 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              Editar datos
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
