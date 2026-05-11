'use server'

import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { revalidatePath } from 'next/cache'

export async function resetDemoDataAction(empresaSlug: string): Promise<{ ok: boolean; message: string }> {
  // Solo admin_general de la empresa demo puede invocar esto
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, message: 'No autenticado' }

  const { data: usuario } = await supabase
    .from('mpaci_usuarios')
    .select('rol, empresa_id')
    .eq('id', user.id)
    .single()

  const rolesPermitidos = ['admin_general', 'medico']
  if (!usuario?.rol || !rolesPermitidos.includes(usuario.rol) || !usuario.empresa_id) {
    return { ok: false, message: 'Solo administradores y médicos pueden restaurar datos de demo' }
  }

  // Verificar que es la empresa demo
  const { data: empresa } = await supabase
    .from('mpaci_empresas')
    .select('slug')
    .eq('id', usuario.empresa_id)
    .single()

  if (empresa?.slug !== 'clinica-urologia-demo') {
    return { ok: false, message: 'Esta función solo está disponible en el ambiente de demo' }
  }

  const admin = createAdminClient()
  const { data, error } = await admin.rpc('reset_demo_staging')

  if (error) {
    console.error('[resetDemoData]', error.message)
    return { ok: false, message: error.message }
  }

  revalidatePath(`/${empresaSlug}/agenda/hoy`)
  return { ok: true, message: String(data) }
}
