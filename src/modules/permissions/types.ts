// Módulos del sistema — ref: "Usuarios y Permisos V6" §4
export type Modulo =
  | 'agenda'
  | 'crm'
  | 'ficha_clinica'
  | 'estadisticas'
  | 'configuracion'
  | 'integraciones'

// Permisos por módulo — ref: §5
export type PermisoAgenda =
  | 'acceder'
  | 'ver_completa'          // admin/admin_general — ve todos los prestadores
  | 'ver_solo_propia'       // medico — solo su propia agenda
  | 'ver_agenda_asignada'   // asistente/enfermera — médicos en mpaci_asignaciones_medico
  | 'crear_modificar_citas'
  | 'cancelar_citas'
  | 'ver_estado_pago'
  | 'marcar_asistencia'

export type PermisoCRM =
  | 'acceder'
  | 'ver_todos'
  | 'ver_solo_asignados'
  | 'crear_editar'
  | 'cambiar_etapa'
  | 'marcar_ganado_perdido'
  | 'crear_editar_tareas'
  | 'exportar'

export type PermisoFichaClinica =
  | 'acceder'
  | 'ver_fichas'
  | 'ver_solo_propias'
  | 'ver_datos_admin'
  | 'ver_datos_clinicos'
  | 'editar'
  | 'ver_notas_privadas'
  | 'subir_documentos'
  | 'descargar_imprimir'

export type PermisoEstadisticas =
  | 'acceder'
  | 'crear_tableros'
  | 'editar_propios'
  | 'editar_ajenos'
  | 'eliminar'
  | 'duplicar'

export type PermisoConfiguracion =
  | 'acceder'
  | 'gestionar_servicios'
  | 'gestionar_plantillas'
  | 'ver_usuarios'
  | 'crear_usuarios'
  | 'gestionar_integraciones'

export type PermisoIntegraciones =
  | 'acceder'
  | 'configurar'

// Tipo compuesto: "modulo.permiso"
export type PermisoKey =
  | `agenda.${PermisoAgenda}`
  | `crm.${PermisoCRM}`
  | `ficha_clinica.${PermisoFichaClinica}`
  | `estadisticas.${PermisoEstadisticas}`
  | `configuracion.${PermisoConfiguracion}`
  | `integraciones.${PermisoIntegraciones}`

// Shape que devuelve getMyPermissions() y consume el PermissionProvider
export interface UserPermissions {
  // Set de "modulo.permiso" activos para consultas O(1)
  permisos: Set<PermisoKey>
  // IDs de médicos asignados (solo relevante si tiene ver_agenda_asignada)
  medicosAsignados: string[]
}
