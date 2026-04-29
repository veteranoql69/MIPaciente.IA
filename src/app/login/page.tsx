'use client'

import { createClient } from '@/utils/supabase/client'
import { useState } from 'react'
import { Loader2, Stethoscope, ShieldCheck, ArrowRight } from 'lucide-react'

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const supabase = createClient()

  const handleGoogleLogin = async () => {
    setIsLoading(true)
    setError('')
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          // TODO: restaurar calendar scope + prompt:consent cuando la app pase a Production en Google Console
          // scopes: 'openid email profile https://www.googleapis.com/auth/calendar.events',
          // queryParams: { access_type: 'offline', prompt: 'consent' },
        },
      })
      if (error) throw error
    } catch {
      setError('No se pudo iniciar sesión. Intenta de nuevo.')
      setIsLoading(false)
    }
  }

  return (
    <div className="relative min-h-dvh w-full flex items-center justify-center overflow-hidden font-sans">
      {/* Background Image with Overlay */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat scale-105"
        style={{ backgroundImage: "url('/images/login-bg.png')" }}
      />
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]" />

      {/* Decorative Gradient Glows */}
      <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-indigo-500/20 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-indigo-600/20 rounded-full blur-[120px] animate-pulse" />

      <main className="relative z-10 w-full max-w-lg p-6">
        <div className="bg-white/80 backdrop-blur-xl border border-white/40 rounded-[2.5rem] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)] overflow-hidden">
          
          {/* Header Section */}
          <div className="px-8 pt-10 pb-6 text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-[2rem] bg-indigo-600 shadow-lg shadow-indigo-200/50 mb-6 transition-transform hover:scale-105 duration-300">
              <Stethoscope className="w-10 h-10 text-white" strokeWidth={1.5} />
            </div>
            
            <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 mb-2">
              Mi-Paciente
            </h1>
            <p className="text-slate-500 font-medium text-lg leading-relaxed max-w-xs mx-auto">
              Gestión clínica inteligente para centros de alto rendimiento
            </p>
          </div>

          {/* Body Section */}
          <div className="px-10 pb-12">
            {error && (
              <div role="alert" className="mb-6 flex items-start gap-3 p-4 bg-rose-50 border border-rose-200 rounded-2xl text-sm text-rose-600 animate-in fade-in slide-in-from-top-2">
                <div className="w-1 h-full bg-rose-500 rounded-full" />
                <p className="font-medium">{error}</p>
              </div>
            )}

            <div className="space-y-4">
              <button
                onClick={handleGoogleLogin}
                disabled={isLoading}
                className="group relative w-full flex items-center justify-between px-6 py-5 bg-indigo-600 hover:bg-indigo-700 rounded-3xl shadow-xl shadow-indigo-100/30 transition-all duration-300 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed overflow-hidden"
              >
                {/* Button Hover Glow */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                
                <div className="flex items-center gap-4">
                  <div className="flex items-center justify-center w-10 h-10 bg-white rounded-2xl shadow-sm">
                    <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                    </svg>
                  </div>
                  <span className="text-white font-bold text-lg">
                    {isLoading ? 'Autenticando...' : 'Acceso con Google'}
                  </span>
                </div>
                
                {isLoading ? (
                  <Loader2 className="w-6 h-6 animate-spin text-white/80" />
                ) : (
                  <ArrowRight className="w-6 h-6 text-white/50 group-hover:text-white group-hover:translate-x-1 transition-all" />
                )}
              </button>

              <div className="flex items-center gap-3 px-4 py-3 bg-slate-50/50 rounded-2xl border border-slate-100">
                <ShieldCheck className="w-5 h-5 text-indigo-500" />
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-widest">
                  Entorno Seguro & Encriptado
                </span>
              </div>
            </div>

            <div className="mt-10 text-center space-y-2">
              <p className="text-sm text-slate-400 font-medium">
                Uso exclusivo para personal clínico autorizado.
              </p>
              <p className="text-xs text-slate-400">
                © 2026 Mi-Paciente.IO ·{' '}
                <a
                  href="https://sditecnologia.cl"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline underline-offset-2 hover:text-slate-600 transition-colors"
                >
                  Política de Privacidad
                </a>
                {' · '}
                <a
                  href="https://sditecnologia.cl"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline underline-offset-2 hover:text-slate-600 transition-colors"
                >
                  Términos de Servicio
                </a>
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

