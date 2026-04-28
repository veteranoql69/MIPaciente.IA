import { createClient } from '@/utils/supabase/server'
import type { PermisoKey, UserPermissions } from './types'

// Llamada única desde el Server Component del tenant layout.
// Devuelve los permisos del usuario autenticado para toda la sesión.
export async function getMyPermissions(userId: string): Promise<UserPermissions> {
  const supabase = await createClient()

  const [permisosRes, asignacionesRes] = await Promise.all([
    supabase
      .from('mpaci_permisos_usuario')
      .select('modulo, permiso')
      .eq('usuario_id', userId)
      .eq('activo', true),

    supabase
      .from('mpaci_asignaciones_medico')
      .select('medico_id')
      .eq('asistente_id', userId)
      .eq('activo', true),
  ])

  const permisos = new Set<PermisoKey>(
    (permisosRes.data ?? []).map(
      (r) => `${r.modulo}.${r.permiso}` as PermisoKey
    )
  )

  const medicosAsignados = (asignacionesRes.data ?? []).map((r) => r.medico_id)

  return { permisos, medicosAsignados }
}
