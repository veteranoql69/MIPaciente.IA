'use client'

import { useActionState, useRef, useState } from 'react'
import { validateInvitationCode } from './actions'

const ROL_LABELS: Record<string, string> = {
  admin_general: 'Administrador General',
  admin: 'Administrador',
  medico: 'Médico / Cirujano',
  asistente: 'Asistente / Coordinador',
  enfermera_tens: 'Enfermera / TENS',
  externo: 'Colaborador Externo',
}

interface Props {
  invitacionId: string
  empresaNombre: string
  rol: string
}

export default function InvitadoClient({ invitacionId, empresaNombre, rol }: Props) {
  const [digits, setDigits] = useState<string[]>(['', '', '', '', '', ''])
  const refs = useRef<(HTMLInputElement | null)[]>([])

  const [state, formAction] = useActionState(validateInvitationCode, null)

  const handleDigit = (idx: number, val: string) => {
    const char = val.replace(/\D/g, '').slice(-1)
    const next = [...digits]
    next[idx] = char
    setDigits(next)
    if (char && idx < 5) refs.current[idx + 1]?.focus()
  }

  const handleKeyDown = (idx: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[idx] && idx > 0) {
      refs.current[idx - 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (pasted.length === 6) {
      setDigits(pasted.split(''))
      refs.current[5]?.focus()
      e.preventDefault()
    }
  }

  const codigo = digits.join('')
  const isComplete = codigo.length === 6

  return (
    <div className="relative min-h-dvh w-full flex flex-col items-center justify-center p-4 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-cover bg-center bg-no-repeat scale-105" style={{ backgroundImage: "url('/images/login-bg.png')" }} />
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]" />
      <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-indigo-500/20 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-indigo-600/20 rounded-full blur-[120px] animate-pulse" />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center w-full">
      <div className="w-full max-w-md bg-white/80 backdrop-blur-md rounded-2xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07)] border border-slate-200/60 overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 px-8 py-6 text-center shadow-sm">
          <p className="text-indigo-200 text-xs font-bold uppercase tracking-widest mb-1">Mi-Paciente</p>
          <h1 className="text-white text-2xl font-bold">¡Fuiste invitado!</h1>
          <p className="text-indigo-100 text-sm mt-1">
            Únete al equipo de <strong>{empresaNombre}</strong>
          </p>
        </div>

        <div className="px-8 py-7 space-y-6">
          <div className="text-center">
            <span className="inline-block bg-indigo-100 text-indigo-700 text-sm font-semibold px-4 py-1.5 rounded-full shadow-sm">
              {ROL_LABELS[rol] ?? rol}
            </span>
            <p className="text-slate-500 text-sm mt-3">
              Ingresa el código de 6 dígitos que recibiste por correo.
            </p>
          </div>

          <form action={formAction} className="space-y-5">
            <input type="hidden" name="invitacion_id" value={invitacionId} />
            <input type="hidden" name="codigo" value={codigo} />

            {/* OTP inputs */}
            <div className="flex gap-2 justify-center" onPaste={handlePaste}>
              {digits.map((d, i) => (
                <input
                  key={i}
                  ref={el => { refs.current[i] = el }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={d}
                  onChange={e => handleDigit(i, e.target.value)}
                  onKeyDown={e => handleKeyDown(i, e)}
                  className={`w-12 h-14 text-center text-2xl font-bold border-2 rounded-xl focus:outline-none transition-all bg-white/50 backdrop-blur-sm ${
                    d ? 'border-indigo-500 bg-indigo-50/50 text-indigo-800' : 'border-slate-200/60 text-slate-800'
                  } focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20`}
                />
              ))}
            </div>

            {state?.error && (
              <div className="bg-red-50/80 border border-red-200/60 rounded-xl px-4 py-3 text-sm text-red-700 text-center backdrop-blur-sm">
                {state.error}
              </div>
            )}

            <button
              type="submit"
              disabled={!isComplete}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-all duration-200 active:scale-[0.98] shadow-sm hover:shadow"
            >
              Ingresar a {empresaNombre}
            </button>
          </form>

          <p className="text-center text-xs text-slate-400">
            El código es válido por 48 horas y solo puede usarse una vez.
          </p>
        </div>
      </div>

      <p className="mt-6 text-xs text-slate-400">© {new Date().getFullYear()} Mi-Paciente · Sistema de gestión clínica</p>
      </div>
    </div>
  )
}
