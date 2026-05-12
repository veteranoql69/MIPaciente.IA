'use server'

import { createClient } from '@/utils/supabase/server'
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

  // 2. Llamada a n8n para el Reset Completo
  const webhookUrl = process.env.N8N_RESTORE_DEMO_WEBHOOK_URL
  if (!webhookUrl) {
    return { ok: false, message: 'Webhook de n8n no configurado' }
  }

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'restore_demo_full',
        empresa_id: usuario.empresa_id,
        empresa_slug: empresaSlug,
        usuario_email: user.email,
        timestamp: new Date().toISOString()
      })
    })

    if (!response.ok) {
      throw new Error(`n8n error: ${response.statusText}`)
    }

    // Esperamos la respuesta de n8n (puedes configurar n8n para que responda 
    // "Proceso iniciado" de inmediato o esperar al final)
    const result = await response.json().catch(() => ({ message: 'Reset iniciado correctamente' }))

    revalidatePath(`/${empresaSlug}/agenda/hoy`)
    return { ok: true, message: result.message || 'Restauración completa iniciada' }

  } catch (err: any) {
    console.error('[resetDemoData n8n]', err.message)
    return { ok: false, message: 'Error al conectar con n8n' }
  }
}
