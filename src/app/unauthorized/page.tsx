import Link from 'next/link'
import { ShieldX } from 'lucide-react'

export default function UnauthorizedPage() {
  return (
    <div className="min-h-dvh bg-background flex items-center justify-center p-4">
      <div className="text-center max-w-sm">
        <div className="mx-auto w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-6">
          <ShieldX className="w-8 h-8 text-red-600" aria-hidden="true" />
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-2">
          Acceso no autorizado
        </h1>
        <p className="text-muted-foreground text-sm leading-relaxed mb-8">
          No tienes permiso para ver esta página, o la clínica que buscas no existe o está inactiva.
        </p>
        <Link
          href="/"
          className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg bg-primary text-white font-semibold text-sm hover:opacity-90 transition-opacity min-h-[44px]"
        >
          Volver al inicio
        </Link>
      </div>
    </div>
  )
}
