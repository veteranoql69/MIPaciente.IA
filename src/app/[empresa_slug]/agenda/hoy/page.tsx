import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { getCitasHoy, getAntecedentesMap } from '@/modules/agenda/queries'
import AgendaHoyClient from '@/modules/agenda/components/AgendaHoyClient'
import type { AppRole } from '@/lib/database.types'
import { getMotivosConsulta } from '@/modules/ficha-clinica/actions'

type Props = {
  params: Promise<{ empresa_slug: string }>
}

export default async function AgendaHoyPage({ params }: Props) {
  const { empresa_slug } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: usuario } = await supabase
    .from('mpaci_usuarios')
    .select('id, rol, empresa_id, nombre_completo')
    .eq('id', user.id)
    .single()

  if (!usuario?.empresa_id) redirect('/unauthorized')

  let medicosAsignados: string[] = []
  if (usuario.rol === 'asistente') {
    const { data } = await supabase
      .from('mpaci_asignaciones_medico')
      .select('medico_id')
      .eq('asistente_id', user.id)
      .eq('activo', true)
    medicosAsignados = (data ?? []).map((r) => r.medico_id)
  }

  const rol = usuario.rol as AppRole

  // ── Datos para el formulario Nueva Cita ──
  const [citasRes, medicosRes, serviciosRes, sucursalesRes, salasRes] = await Promise.all([
    getCitasHoy(usuario.empresa_id, user.id, rol, medicosAsignados),
    supabase
      .from('mpaci_usuarios')
      .select('id, nombre_completo')
      .eq('empresa_id', usuario.empresa_id)
      .eq('rol', 'medico'),
    supabase
      .from('mpaci_servicios')
      .select('id, nombre, duracion_minutos, precio_base, categoria')
      .eq('empresa_id', usuario.empresa_id)
      .eq('activo', true)
      .order('nombre'),
    supabase
      .from('mpaci_sucursales')
      .select('id, nombre')
      .eq('empresa_id', usuario.empresa_id)
      .eq('activo', true),
    supabase
      .from('mpaci_salas')
      .select('id, nombre, sucursal_id')
      .eq('empresa_id', usuario.empresa_id)
      .eq('activo', true),
  ])

  const citas = citasRes
  const medicos = (medicosRes.data ?? []).map(m => ({ id: m.id, nombre: m.nombre_completo }))
  const servicios = (serviciosRes.data ?? []).map(s => ({
    id: s.id,
    nombre: s.nombre,
    duracion_minutos: s.duracion_minutos,
    precio_base: s.precio_base,
    categoria: s.categoria,
  }))
  const sucursales = (sucursalesRes.data ?? []).map(s => ({ id: s.id, nombre: s.nombre }))
  const salas = (salasRes.data ?? []).map(s => ({ id: s.id, nombre: s.nombre, sucursal_id: s.sucursal_id }))

  // TODO: Borrar después de verificar
  console.log('[AgendaHoy] Diagnóstico formulario Nueva Cita:')
  console.log('  médicos:', medicos.length, medicos.map(m => m.nombre))
  console.log('  servicios:', servicios.length)
  console.log('  sucursales:', sucursales.length)
  console.log('  salas:', salas.length)
  if (medicosRes.error) console.error('  ERROR médicos:', medicosRes.error.message)

  const contactoIds = [...new Set(
    citas.map(c => c.contacto?.id).filter(Boolean) as string[]
  )]

  const [antecedentes, motivosCatalog] = await Promise.all([
    getAntecedentesMap(usuario.empresa_id, contactoIds),
    getMotivosConsulta()
  ])

  const formattedDate = (() => {
    const d = new Date().toLocaleDateString('es-CL', {
      weekday: 'long', day: 'numeric', month: 'long',
    })
    return d.charAt(0).toUpperCase() + d.slice(1)
  })()

  const showMedico = ['admin_general', 'admin', 'asistente'].includes(usuario.rol)

  return (
    <AgendaHoyClient
      citas={citas}
      antecedentes={antecedentes}
      usuarioRol={rol as 'admin_general' | 'admin' | 'medico' | 'asistente' | 'enfermera_tens' | 'externo' | 'gerente' | 'sistema'}
      empresaSlug={empresa_slug}
      formattedDate={formattedDate}
      showMedico={showMedico}
      medicos={medicos}
      servicios={servicios}
      sucursales={sucursales}
      salas={salas}
      currentUserId={user.id}
      currentUserRol={usuario.rol}
      motivosCatalog={motivosCatalog}
    />
  )
}

