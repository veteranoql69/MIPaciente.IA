import { createClient } from '@/utils/supabase/server'

export type UsuarioRow = {
  id: string
  nombre_completo: string
  email: string
  rol: string
  ultima_sesion: string | null
  creado_en: string | null
}

export type InvitacionRow = {
  id: string
  email: string
  rol: string
  expires_at: string
  usado: boolean
  created_at: string
}

export type PermisoRow = {
  id: string
  usuario_id: string
  modulo: string
  permiso: string
  activo: boolean
}

export async function getUsuariosEmpresa(empresaId: string): Promise<UsuarioRow[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('mpaci_usuarios')
    .select('id, nombre_completo, email, rol, ultima_sesion, creado_en')
    .eq('empresa_id', empresaId)
    .order('creado_en', { ascending: true })

  if (error) throw new Error(error.message)
  return data ?? []
}

export async function getInvitacionesPendientes(empresaId: string): Promise<InvitacionRow[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('mpaci_invitaciones')
    .select('id, email, rol, expires_at, usado, created_at')
    .eq('empresa_id', empresaId)
    .eq('usado', false)
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return data ?? []
}

export async function getPermisosUsuario(usuarioId: string): Promise<PermisoRow[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('mpaci_permisos_usuario')
    .select('id, usuario_id, modulo, permiso, activo')
    .eq('usuario_id', usuarioId)
    .order('modulo', { ascending: true })

  if (error) throw new Error(error.message)
  return data ?? []
}

export async function getPermisosEmpresa(empresaId: string): Promise<PermisoRow[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('mpaci_permisos_usuario')
    .select('id, usuario_id, modulo, permiso, activo')
    .eq('empresa_id', empresaId)
    .order('modulo', { ascending: true })

  if (error) throw new Error(error.message)
  return data ?? []
}
