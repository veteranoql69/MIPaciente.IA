'use client'

import { createContext, useContext } from 'react'
import type { PermisoKey, UserPermissions } from './types'

const PermissionContext = createContext<UserPermissions>({
  permisos: new Set(),
  medicosAsignados: [],
})

interface PermissionProviderProps {
  value: UserPermissions
  children: React.ReactNode
}

export function PermissionProvider({ value, children }: PermissionProviderProps) {
  return (
    <PermissionContext.Provider value={value}>
      {children}
    </PermissionContext.Provider>
  )
}

// Hook principal: O(1) lookup — nunca hace fetch, lee del contexto cargado en layout
export function usePermission() {
  const ctx = useContext(PermissionContext)

  const hasPermission = (permiso: PermisoKey): boolean =>
    ctx.permisos.has(permiso)

  const hasAnyPermission = (...permisos: PermisoKey[]): boolean =>
    permisos.some((p) => ctx.permisos.has(p))

  const hasAllPermissions = (...permisos: PermisoKey[]): boolean =>
    permisos.every((p) => ctx.permisos.has(p))

  return {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    medicosAsignados: ctx.medicosAsignados,
  }
}
