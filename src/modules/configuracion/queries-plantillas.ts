import { createClient } from '@/utils/supabase/server'

// ─── Empresa / Identidad ──────────────────────────────────────────────────────

export type EmpresaIdentidad = {
  id: string
  nombre: string
  logo_url: string | null
  email_clinica: string | null
  telefono_clinica: string | null
  direccion_clinica: string | null
}

export async function getEmpresaIdentidad(empresaId: string): Promise<EmpresaIdentidad | null> {
  const supabase = await createClient()
  // Cast to any: columns logo_url / email_clinica / telefono_clinica / direccion_clinica
  // are added in migration 00058 — types regenerate after applying.
  const { data, error } = await (supabase as any)
    .from('mpaci_empresas')
    .select('id, nombre, logo_url, email_clinica, telefono_clinica, direccion_clinica')
    .eq('id', empresaId)
    .single()
  if (error) throw new Error(error.message)
  return data as EmpresaIdentidad | null
}

// ─── Plantillas de Documentos ─────────────────────────────────────────────────

export type TipoPlantilla = 'protocolo' | 'receta' | 'consentimiento'

export type SeccionPlantilla = {
  id: string
  titulo: string
  cuerpo: string
}

export type HeaderPlantilla = {
  mostrar_logo: boolean
  mostrar_nombre_clinica: boolean
  mostrar_fecha: boolean
  mostrar_medico: boolean
}

export type ContenidoPlantilla = {
  header: HeaderPlantilla
  secciones: SeccionPlantilla[]
}

export type PlantillaRow = {
  id: string
  empresa_id: string
  tipo: TipoPlantilla
  nombre: string
  servicio_id: string | null
  contenido: ContenidoPlantilla
  activo: boolean | null
  creado_en: string | null
  actualizado_en: string | null
}

export async function getPlantillas(empresaId: string): Promise<PlantillaRow[]> {
  const supabase = await createClient()
  // Cast to any: table added in migration 00058 — types regenerate after applying.
  const { data, error } = await (supabase as any)
    .from('mpaci_plantillas_documentos')
    .select('id, empresa_id, tipo, nombre, servicio_id, contenido, activo, creado_en, actualizado_en')
    .eq('empresa_id', empresaId)
    .order('tipo', { ascending: true })
    .order('nombre', { ascending: true })
  if (error) throw new Error(error.message)
  return ((data as unknown) ?? []) as PlantillaRow[]
}
