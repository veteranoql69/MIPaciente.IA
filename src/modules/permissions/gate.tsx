'use client'

import { usePermission } from './context'
import type { PermisoKey } from './types'

interface PermissionGateProps {
  // Permiso requerido — o varios (basta con uno si se usa anyOf)
  permission?: PermisoKey
  anyOf?: PermisoKey[]
  allOf?: PermisoKey[]
  // Qué renderizar si no tiene permiso (por defecto: nada)
  fallback?: React.ReactNode
  children: React.ReactNode
}

// Uso:
//   <PermissionGate permission="agenda.ver_estado_pago">
//     <ColumnaFinanciera />
//   </PermissionGate>
//
//   <PermissionGate anyOf={['agenda.ver_completa', 'agenda.ver_agenda_asignada']}>
//     <SelectorMedico />
//   </PermissionGate>
export function PermissionGate({
  permission,
  anyOf,
  allOf,
  fallback = null,
  children,
}: PermissionGateProps) {
  const { hasPermission, hasAnyPermission, hasAllPermissions } = usePermission()

  let allowed = false

  if (permission) {
    allowed = hasPermission(permission)
  } else if (anyOf && anyOf.length > 0) {
    allowed = hasAnyPermission(...anyOf)
  } else if (allOf && allOf.length > 0) {
    allowed = hasAllPermissions(...allOf)
  }

  return allowed ? <>{children}</> : <>{fallback}</>
}
