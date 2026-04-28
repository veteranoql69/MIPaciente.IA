'use client'

import { useActionState, useState, useTransition } from 'react'
import { createWorkspace } from './actions'

const ROLES = [
  { value: 'admin_general', label: 'Administrador General' },
  { value: 'admin', label: 'Administrador' },
  { value: 'medico', label: 'Médico / Cirujano' },
  { value: 'asistente', label: 'Asistente / Coordinador' },
  { value: 'enfermera_tens', label: 'Enfermera / TENS' },
  { value: 'externo', label: 'Colaborador Externo' },
]

type Invitado = { email: string; rol: string }

interface Props {
  firstName: string
  fullName: string
  email: string
}

function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50)
}

export default function OnboardingOwnerClient({ firstName, fullName, email }: Props) {
  const [step, setStep] = useState(0)
  const [nombreClinica, setNombreClinica] = useState('')
  const [slug, setSlug] = useState('')
  const [slugManual, setSlugManual] = useState(false)
  const [invitados, setInvitados] = useState<Invitado[]>([])
  const [newEmail, setNewEmail] = useState('')
  const [newRol, setNewRol] = useState('asistente')
  const [emailError, setEmailError] = useState('')
  const [, startTransition] = useTransition()

  const [state, formAction] = useActionState(createWorkspace, null)

  const handleNombreChange = (val: string) => {
    setNombreClinica(val)
    if (!slugManual) setSlug(slugify(val))
  }

  const handleSlugChange = (val: string) => {
    setSlugManual(true)
    setSlug(slugify(val))
  }

  const addInvitado = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(newEmail)) {
      setEmailError('Email inválido')
      return
    }
    if (invitados.some(i => i.email === newEmail)) {
      setEmailError('Este email ya fue agregado')
      return
    }
    setEmailError('')
    setInvitados(prev => [...prev, { email: newEmail, rol: newRol }])
    setNewEmail('')
    setNewRol('asistente')
  }

  const removeInvitado = (idx: number) => {
    setInvitados(prev => prev.filter((_, i) => i !== idx))
  }

  const canProceedStep1 = nombreClinica.trim().length >= 3 && slug.length >= 3

  const steps = [
    { label: 'Bienvenida' },
    { label: 'Tu clínica' },
    { label: 'Tu equipo' },
    { label: 'Confirmar' },
  ]

  return (
    <div className="relative min-h-dvh w-full flex flex-col items-center justify-center p-4 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-cover bg-center bg-no-repeat scale-105" style={{ backgroundImage: "url('/images/login-bg.png')" }} />
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]" />
      <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-indigo-500/20 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-indigo-600/20 rounded-full blur-[120px] animate-pulse" />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center w-full">

      {/* Progress dots */}
      <div className="flex gap-2 mb-8">
        {steps.map((s, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold transition-all duration-300 ${
              i < step ? 'bg-indigo-600 text-white shadow-md' :
              i === step ? 'bg-indigo-600 text-white ring-4 ring-indigo-200 shadow-md' :
              'bg-white/80 text-slate-400 border border-slate-200 backdrop-blur-sm'
            }`}>
              {i < step ? '✓' : i + 1}
            </div>
            {i < steps.length - 1 && (
              <div className={`w-8 h-0.5 transition-all duration-300 ${i < step ? 'bg-indigo-600' : 'bg-slate-200'}`} />
            )}
          </div>
        ))}
      </div>

      {/* Card */}
      <div className="w-full max-w-lg bg-white/80 backdrop-blur-md rounded-2xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07)] border border-slate-200/60 overflow-hidden">
        {/* Header gradient */}
        <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 px-8 py-6 shadow-sm">
          <p className="text-indigo-200 text-xs font-bold uppercase tracking-widest mb-1">Mi-Paciente</p>
          <h1 className="text-white text-2xl font-bold leading-snug">
            {step === 0 && `Hola, ${firstName} 👋`}
            {step === 1 && 'Tu espacio de trabajo'}
            {step === 2 && 'Invita a tu equipo'}
            {step === 3 && 'Todo listo'}
          </h1>
          <p className="text-indigo-100 text-sm mt-1">
            {step === 0 && 'Vamos a configurar tu clínica en minutos.'}
            {step === 1 && 'El nombre y URL única de tu clínica.'}
            {step === 2 && 'Opcional — puedes hacerlo después también.'}
            {step === 3 && 'Revisa los datos antes de crear tu clínica.'}
          </p>
        </div>

        <div className="px-8 py-6">
          {/* Step 0: Welcome */}
          {step === 0 && (
            <div className="space-y-5">
              <div className="flex items-center gap-4 p-4 bg-slate-50/80 rounded-xl border border-slate-200/60 shadow-sm backdrop-blur-sm">
                <div className="w-12 h-12 rounded-full bg-indigo-600 flex items-center justify-center text-white text-lg font-bold flex-shrink-0 shadow-sm">
                  {(fullName || email)[0]?.toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-slate-800">{fullName || email}</p>
                  <p className="text-sm text-slate-500">{email}</p>
                </div>
              </div>
              <p className="text-slate-600 text-sm leading-relaxed">
                Detectamos que es tu primera vez aquí. En los próximos pasos vamos a:
              </p>
              <ul className="space-y-2">
                {['Darle nombre a tu clínica', 'Crear tu URL única', 'Invitar a tu equipo (opcional)'].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm text-slate-700">
                    <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold flex-shrink-0">{i + 1}</span>
                    {item}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => setStep(1)}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-xl transition-all duration-200 active:scale-[0.98] shadow-sm hover:shadow"
              >
                Empezar configuración →
              </button>
            </div>
          )}

          {/* Step 1: Workspace */}
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Nombre de tu clínica
                </label>
                <input
                  type="text"
                  value={nombreClinica}
                  onChange={e => handleNombreChange(e.target.value)}
                  placeholder="Ej: Clínica San Rafael"
                  maxLength={100}
                  className="w-full border border-slate-200/60 rounded-xl px-4 py-3 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all bg-white/50 backdrop-blur-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  URL de tu clínica
                </label>
                <div className="flex items-center border border-slate-200/60 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500/50 focus-within:border-indigo-500 transition-all bg-white/50 backdrop-blur-sm">
                  <span className="px-3 py-3 bg-slate-50/50 text-slate-400 text-sm border-r border-slate-200/60 whitespace-nowrap">
                    mipaciente.com/
                  </span>
                  <input
                    type="text"
                    value={slug}
                    onChange={e => handleSlugChange(e.target.value)}
                    placeholder="clinica-san-rafael"
                    maxLength={50}
                    className="flex-1 px-3 py-3 text-slate-800 placeholder-slate-400 focus:outline-none bg-transparent"
                  />
                </div>
                <p className="mt-1 text-xs text-slate-400">Solo minúsculas, números y guiones.</p>
              </div>

              {slug && (
                <div className="bg-indigo-50/50 border border-indigo-100/50 rounded-xl px-4 py-3 flex items-center gap-2 backdrop-blur-sm">
                  <span className="text-indigo-600 text-lg">🔗</span>
                  <span className="text-sm text-indigo-700 font-medium">mipaciente.com/<strong>{slug}</strong></span>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setStep(0)}
                  className="flex-1 border border-slate-200/60 text-slate-600 font-semibold py-3 rounded-xl hover:bg-slate-50/80 transition-all duration-200 active:scale-[0.98] bg-white/50 backdrop-blur-sm"
                >
                  ← Atrás
                </button>
                <button
                  onClick={() => setStep(2)}
                  disabled={!canProceedStep1}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-all duration-200 active:scale-[0.98] shadow-sm hover:shadow"
                >
                  Continuar →
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Invitations */}
          {step === 2 && (
            <div className="space-y-5">
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Email del colaborador</label>
                  <input
                    type="email"
                    value={newEmail}
                    onChange={e => { setNewEmail(e.target.value); setEmailError('') }}
                    onKeyDown={e => e.key === 'Enter' && addInvitado()}
                    placeholder="correo@ejemplo.com"
                    className="w-full border border-slate-200/60 rounded-xl px-4 py-3 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all bg-white/50 backdrop-blur-sm"
                  />
                  {emailError && <p className="mt-1 text-xs text-red-500">{emailError}</p>}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Rol</label>
                  <select
                    value={newRol}
                    onChange={e => setNewRol(e.target.value)}
                    className="w-full border border-slate-200/60 rounded-xl px-4 py-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all bg-white/50 backdrop-blur-sm"
                  >
                    {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                  </select>
                </div>
                <button
                  onClick={addInvitado}
                  className="w-full border-2 border-dashed border-indigo-300 text-indigo-600 hover:bg-indigo-50/50 font-semibold py-2.5 rounded-xl transition-all duration-200 active:scale-[0.98] text-sm"
                >
                  + Agregar invitado
                </button>
              </div>

              {invitados.length > 0 && (
                <div className="space-y-2 max-h-40 overflow-y-auto pr-1 custom-scrollbar">
                  {invitados.map((inv, i) => (
                    <div key={i} className="flex items-center justify-between bg-indigo-50/50 border border-indigo-100/50 rounded-xl px-4 py-2.5 backdrop-blur-sm">
                      <div>
                        <p className="text-sm font-medium text-slate-800">{inv.email}</p>
                        <p className="text-xs text-slate-500">{ROLES.find(r => r.value === inv.rol)?.label}</p>
                      </div>
                      <button onClick={() => removeInvitado(i)} className="text-slate-400 hover:text-red-500 transition-colors text-lg leading-none">×</button>
                    </div>
                  ))}
                </div>
              )}

              {invitados.length === 0 && (
                <p className="text-center text-sm text-slate-400 py-2">Puedes invitar a tu equipo ahora o después desde Configuración.</p>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 border border-slate-200/60 text-slate-600 font-semibold py-3 rounded-xl hover:bg-slate-50/80 transition-all duration-200 active:scale-[0.98] bg-white/50 backdrop-blur-sm"
                >
                  ← Atrás
                </button>
                <button
                  onClick={() => setStep(3)}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-xl transition-all duration-200 active:scale-[0.98] shadow-sm hover:shadow"
                >
                  {invitados.length > 0 ? 'Continuar →' : 'Omitir →'}
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Confirmation */}
          {step === 3 && (
            <form
              action={(fd) => startTransition(() => formAction(fd))}
              className="space-y-5"
            >
              <input type="hidden" name="nombre_clinica" value={nombreClinica} />
              <input type="hidden" name="slug" value={slug} />
              <input type="hidden" name="invitaciones_json" value={JSON.stringify(invitados)} />

              <div className="space-y-3">
                <div className="flex justify-between items-start py-3 border-b border-slate-100">
                  <span className="text-sm text-slate-500">Clínica</span>
                  <span className="text-sm font-semibold text-slate-800 text-right">{nombreClinica}</span>
                </div>
                <div className="flex justify-between items-start py-3 border-b border-slate-100/60">
                  <span className="text-sm text-slate-500">URL</span>
                  <span className="text-sm font-semibold text-indigo-700 text-right">/{slug}</span>
                </div>
                <div className="flex justify-between items-start py-3 border-b border-slate-100">
                  <span className="text-sm text-slate-500">Tu rol</span>
                  <span className="text-sm font-semibold text-slate-800">Administrador General</span>
                </div>
                <div className="flex justify-between items-start py-3">
                  <span className="text-sm text-slate-500">Invitaciones</span>
                  <span className="text-sm font-semibold text-slate-800">
                    {invitados.length === 0 ? 'Ninguna' : `${invitados.length} persona${invitados.length > 1 ? 's' : ''}`}
                  </span>
                </div>
              </div>

              {state?.error && (
                <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
                  {state.error}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="flex-1 border border-slate-200/60 text-slate-600 font-semibold py-3 rounded-xl hover:bg-slate-50/80 transition-all duration-200 active:scale-[0.98] bg-white/50 backdrop-blur-sm"
                >
                  ← Atrás
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-xl transition-all duration-200 active:scale-[0.98] shadow-sm hover:shadow"
                >
                  Crear clínica ✓
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      <p className="mt-6 text-xs text-slate-400">© {new Date().getFullYear()} Mi-Paciente · Sistema de gestión clínica</p>
      </div>
    </div>
  )
}
