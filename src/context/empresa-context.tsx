'use client'

import { createContext, useContext } from 'react'
import type { Database } from '@/lib/database.types'

type Empresa = Database['public']['Tables']['mpaci_empresas']['Row']
type Usuario = Database['public']['Tables']['mpaci_usuarios']['Row']

interface EmpresaContextValue {
  empresa: Empresa
  usuario: Usuario
}

const EmpresaContext = createContext<EmpresaContextValue | null>(null)

export function EmpresaProvider({
  children,
  empresa,
  usuario,
}: {
  children: React.ReactNode
  empresa: Empresa
  usuario: Usuario
}) {
  return (
    <EmpresaContext.Provider value={{ empresa, usuario }}>
      {children}
    </EmpresaContext.Provider>
  )
}

export function useEmpresa() {
  const ctx = useContext(EmpresaContext)
  if (!ctx) throw new Error('useEmpresa must be used within EmpresaProvider')
  return ctx
}
