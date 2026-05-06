// ============================================================
// database.types.ts
// Generado manualmente a partir de las migraciones 00001-00045.
// Refleja el estado final del schema tras aplicar Olas A, B y C.
// Si regeneras con `supabase gen types typescript`, este archivo
// se reescribe; hasta entonces mantenerlo en paridad con SQL.
// ============================================================

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type AppRole =
  | 'admin_general'
  | 'admin'
  | 'gerente' // deprecated (00042). No usar en c├│digo nuevo.
  | 'asistente'
  | 'medico'
  | 'enfermera_tens'
  | 'externo'
  | 'sistema'

export interface Database {
  public: {
    Tables: {
      // ----------------------------------------------------------
      // CORE: Usuarios, Empresas, Sucursales
      // ----------------------------------------------------------
      mpaci_usuarios: {
        Row: {
          id: string
          email: string
          nombre_completo: string
          rol: AppRole
          avatar_url: string | null
          empresa_id: string | null
          onboarding_completado: boolean
          ultima_sesion: string | null
          permisos: Json
          plantilla_permisos_id: string | null
          creado_en: string | null
          gcal_access_token: string | null
          gcal_refresh_token: string | null
          gcal_token_expiry: string | null
        }
        Insert: {
          id: string
          email: string
          nombre_completo: string
          rol?: AppRole
          avatar_url?: string | null
          empresa_id?: string | null
          onboarding_completado?: boolean
          ultima_sesion?: string | null
          permisos?: Json
          plantilla_permisos_id?: string | null
          creado_en?: string | null
          gcal_access_token?: string | null
          gcal_refresh_token?: string | null
          gcal_token_expiry?: string | null
        }
        Update: {
          id?: string
          email?: string
          nombre_completo?: string
          rol?: AppRole
          avatar_url?: string | null
          empresa_id?: string | null
          onboarding_completado?: boolean
          ultima_sesion?: string | null
          permisos?: Json
          plantilla_permisos_id?: string | null
          creado_en?: string | null
          gcal_access_token?: string | null
          gcal_refresh_token?: string | null
          gcal_token_expiry?: string | null
        }
        Relationships: []
      }
      mpaci_empresas: {
        Row: {
          id: string
          slug: string
          nombre: string
          plan_suscripcion: string | null
          activo: boolean | null
          bloque_base_min: number
          creado_en: string | null
        }
        Insert: {
          id?: string
          slug: string
          nombre: string
          plan_suscripcion?: string | null
          activo?: boolean | null
          bloque_base_min?: number
          creado_en?: string | null
        }
        Update: {
          id?: string
          slug?: string
          nombre?: string
          plan_suscripcion?: string | null
          activo?: boolean | null
          bloque_base_min?: number
          creado_en?: string | null
        }
        Relationships: []
      }
      mpaci_sucursales: {
        Row: {
          id: string
          empresa_id: string
          nombre: string
          direccion: string | null
          activo: boolean | null
          creado_en: string | null
        }
        Insert: {
          id?: string
          empresa_id: string
          nombre: string
          direccion?: string | null
          activo?: boolean | null
          creado_en?: string | null
        }
        Update: {
          id?: string
          empresa_id?: string
          nombre?: string
          direccion?: string | null
          activo?: boolean | null
          creado_en?: string | null
        }
        Relationships: []
      }

      // ----------------------------------------------------------
      // CONTACTOS + CRM
      // ----------------------------------------------------------
      mpaci_contactos: {
        Row: {
          id: string
          rut: string | null
          nombre: string
          telefono: string | null
          email: string | null
          canal_origen: string
          canal_contacto: string | null
          canal_referencia: string | null
          empresa_id: string | null
          fecha_nacimiento: string | null
          genero: string | null
          direccion: string | null
          comuna: string | null
          region: string | null
          telefono_secundario: string | null
          email_alternativo: string | null
          prevision: string | null
          plan_convenio: string | null
          empresa_paciente: string | null
          peso_kg: number | null
          talla_cm: number | null
          emergencia_nombre: string | null
          emergencia_telefono: string | null
          observaciones_internas: string | null
          campos_personalizados: Json
          fuente_id: string | null
          campana_id: string | null
          actualizado_en: string | null
          creado_en: string | null
        }
        Insert: {
          id?: string
          rut?: string | null
          nombre: string
          telefono?: string | null
          email?: string | null
          canal_origen: string
          canal_contacto?: string | null
          canal_referencia?: string | null
          empresa_id?: string | null
          fecha_nacimiento?: string | null
          genero?: string | null
          direccion?: string | null
          comuna?: string | null
          region?: string | null
          telefono_secundario?: string | null
          email_alternativo?: string | null
          prevision?: string | null
          plan_convenio?: string | null
          empresa_paciente?: string | null
          peso_kg?: number | null
          talla_cm?: number | null
          emergencia_nombre?: string | null
          emergencia_telefono?: string | null
          observaciones_internas?: string | null
          campos_personalizados?: Json
          fuente_id?: string | null
          campana_id?: string | null
          actualizado_en?: string | null
          creado_en?: string | null
        }
        Update: {
          id?: string
          rut?: string | null
          nombre?: string
          telefono?: string | null
          email?: string | null
          canal_origen?: string
          canal_contacto?: string | null
          canal_referencia?: string | null
          empresa_id?: string | null
          fecha_nacimiento?: string | null
          genero?: string | null
          direccion?: string | null
          comuna?: string | null
          region?: string | null
          telefono_secundario?: string | null
          email_alternativo?: string | null
          prevision?: string | null
          plan_convenio?: string | null
          empresa_paciente?: string | null
          peso_kg?: number | null
          talla_cm?: number | null
          emergencia_nombre?: string | null
          emergencia_telefono?: string | null
          observaciones_internas?: string | null
          campos_personalizados?: Json
          fuente_id?: string | null
          campana_id?: string | null
          actualizado_en?: string | null
          creado_en?: string | null
        }
        Relationships: []
      }
      mpaci_prospectos: {
        Row: {
          id: string
          contacto_id: string
          responsable_id: string | null
          estado: 'Nuevo' | 'En seguimiento' | 'Interesado' | 'Agendado' | 'Ganado' | 'Perdido'
          servicio_id: string | null
          empresa_id: string | null
          campos_personalizados: Json
          creado_en: string | null
        }
        Insert: {
          id?: string
          contacto_id: string
          responsable_id?: string | null
          estado?: 'Nuevo' | 'En seguimiento' | 'Interesado' | 'Agendado' | 'Ganado' | 'Perdido'
          servicio_id?: string | null
          empresa_id?: string | null
          campos_personalizados?: Json
          creado_en?: string | null
        }
        Update: {
          id?: string
          contacto_id?: string
          responsable_id?: string | null
          estado?: 'Nuevo' | 'En seguimiento' | 'Interesado' | 'Agendado' | 'Ganado' | 'Perdido'
          servicio_id?: string | null
          empresa_id?: string | null
          campos_personalizados?: Json
          creado_en?: string | null
        }
        Relationships: []
      }
      mpaci_actividades: {
        Row: {
          id: string
          prospecto_id: string | null
          contacto_id: string | null
          asignado_a_id: string
          asignado_por: string | null
          tipo_actividad: string
          titulo: string | null
          descripcion: string | null
          prioridad: 'baja' | 'normal' | 'alta' | 'urgente'
          categoria: 'comercial' | 'clinica' | 'administrativa'
          estado: 'pendiente' | 'en_progreso' | 'completada' | 'cancelada'
          es_de_ia: boolean
          fecha_vencimiento: string
          completada: boolean | null
          completada_en: string | null
          completada_por: string | null
          empresa_id: string | null
          creado_en: string | null
        }
        Insert: {
          id?: string
          prospecto_id?: string | null
          contacto_id?: string | null
          asignado_a_id: string
          asignado_por?: string | null
          tipo_actividad: string
          titulo?: string | null
          descripcion?: string | null
          prioridad?: 'baja' | 'normal' | 'alta' | 'urgente'
          categoria?: 'comercial' | 'clinica' | 'administrativa'
          estado?: 'pendiente' | 'en_progreso' | 'completada' | 'cancelada'
          es_de_ia?: boolean
          fecha_vencimiento: string
          completada?: boolean | null
          completada_en?: string | null
          completada_por?: string | null
          empresa_id?: string | null
          creado_en?: string | null
        }
        Update: {
          id?: string
          prospecto_id?: string | null
          contacto_id?: string | null
          asignado_a_id?: string
          asignado_por?: string | null
          tipo_actividad?: string
          titulo?: string | null
          descripcion?: string | null
          prioridad?: 'baja' | 'normal' | 'alta' | 'urgente'
          categoria?: 'comercial' | 'clinica' | 'administrativa'
          estado?: 'pendiente' | 'en_progreso' | 'completada' | 'cancelada'
          es_de_ia?: boolean
          fecha_vencimiento?: string
          completada?: boolean | null
          completada_en?: string | null
          completada_por?: string | null
          empresa_id?: string | null
          creado_en?: string | null
        }
        Relationships: []
      }
      mpaci_bitacora: {
        Row: {
          id: string
          prospecto_id: string
          usuario_accion_id: string | null
          accion: string
          estado_anterior: string | null
          estado_nuevo: string | null
          detalles: string | null
          empresa_id: string | null
          creado_en: string | null
        }
        Insert: {
          id?: string
          prospecto_id: string
          usuario_accion_id?: string | null
          accion: string
          estado_anterior?: string | null
          estado_nuevo?: string | null
          detalles?: string | null
          empresa_id?: string | null
          creado_en?: string | null
        }
        Update: {
          id?: string
          prospecto_id?: string
          usuario_accion_id?: string | null
          accion?: string
          estado_anterior?: string | null
          estado_nuevo?: string | null
          detalles?: string | null
          empresa_id?: string | null
          creado_en?: string | null
        }
        Relationships: []
      }
      mpaci_timeline_eventos: {
        Row: {
          id: string
          empresa_id: string
          contacto_id: string
          origen: 'crm' | 'agenda' | 'ficha_clinica' | 'whatsapp' | 'email' | 'ia' | 'automatizacion' | 'sistema'
          referencia_id: string | null
          referencia_tabla: string | null
          descripcion: string
          metadata: Json | null
          usuario_id: string | null
          es_automatico: boolean
          creado_en: string | null
        }
        Insert: {
          id?: string
          empresa_id: string
          contacto_id: string
          origen: 'crm' | 'agenda' | 'ficha_clinica' | 'whatsapp' | 'email' | 'ia' | 'automatizacion' | 'sistema'
          referencia_id?: string | null
          referencia_tabla?: string | null
          descripcion: string
          metadata?: Json | null
          usuario_id?: string | null
          es_automatico?: boolean
          creado_en?: string | null
        }
        Update: never // INMUTABLE (RLS bloquea UPDATE/DELETE)
        Relationships: []
      }
      mpaci_mensajes_entrantes: {
        Row: {
          id: string
          empresa_id: string
          canal: string
          remitente: string
          contenido: string
          metadata: Json | null
          procesado: boolean
          contacto_id: string | null
          creado_en: string | null
        }
        Insert: {
          id?: string
          empresa_id: string
          canal: string
          remitente: string
          contenido: string
          metadata?: Json | null
          procesado?: boolean
          contacto_id?: string | null
          creado_en?: string | null
        }
        Update: {
          id?: string
          empresa_id?: string
          canal?: string
          remitente?: string
          contenido?: string
          metadata?: Json | null
          procesado?: boolean
          contacto_id?: string | null
          creado_en?: string | null
        }
        Relationships: []
      }

      // ----------------------------------------------------------
      // AGENDA
      // ----------------------------------------------------------
      mpaci_servicios: {
        Row: {
          id: string
          nombre: string
          duracion_minutos: number
          precio_base: number
          activo: boolean | null
          empresa_id: string | null
          categoria: 'consulta' | 'evaluacion' | 'procedimiento' | 'cirugia' | 'control' | 'examen' | 'otro' | null
          es_cirugia: boolean
          roles_sugeridos: Json
        }
        Insert: {
          id?: string
          nombre: string
          duracion_minutos: number
          precio_base: number
          activo?: boolean | null
          empresa_id?: string | null
          categoria?: 'consulta' | 'evaluacion' | 'procedimiento' | 'cirugia' | 'control' | 'examen' | 'otro' | null
          es_cirugia?: boolean
          roles_sugeridos?: Json
        }
        Update: {
          id?: string
          nombre?: string
          duracion_minutos?: number
          precio_base?: number
          activo?: boolean | null
          empresa_id?: string | null
          categoria?: 'consulta' | 'evaluacion' | 'procedimiento' | 'cirugia' | 'control' | 'examen' | 'otro' | null
          es_cirugia?: boolean
          roles_sugeridos?: Json
        }
        Relationships: []
      }
      mpaci_servicios_precios: {
        Row: {
          id: string
          servicio_id: string
          empresa_id: string
          cobertura: 'particular' | 'fonasa' | 'isapre_particular' | 'pad_2026' | 'ejercito' | 'otra'
          precio: number
          etiqueta: string | null
          activo: boolean | null
          creado_en: string | null
        }
        Insert: {
          id?: string
          servicio_id: string
          empresa_id: string
          cobertura: 'particular' | 'fonasa' | 'isapre_particular' | 'pad_2026' | 'ejercito' | 'otra'
          precio: number
          etiqueta?: string | null
          activo?: boolean | null
          creado_en?: string | null
        }
        Update: {
          id?: string
          servicio_id?: string
          empresa_id?: string
          cobertura?: 'particular' | 'fonasa' | 'isapre_particular' | 'pad_2026' | 'ejercito' | 'otra'
          precio?: number
          etiqueta?: string | null
          activo?: boolean | null
          creado_en?: string | null
        }
        Relationships: []
      }
      mpaci_servicios_config: {
        Row: {
          id: string
          empresa_id: string
          servicio_id: string
          medico_id: string
          sucursal_id: string
          duracion_minutos: number | null
          buffer_pre_min: number
          buffer_post_min: number
          sala_id: string | null
          modelo_honorarios: 'fijo' | 'bloque_procedimiento' | 'cirugia_general' | null
          monto_bloque: number | null
          monto_por_cirugia: number | null
          monto_por_cirugia_general: number | null
          honorarios_por_rol: Json
          modo_bloque: 'automatico' | 'confirmacion' | null
          unidad_honorario: 'caso' | 'bloque' | 'hora'
          pct_no_realizada: number
          fee_cancelacion_tardia: number
          alias: string | null
          notas_privadas: string | null
          activo: boolean | null
          creado_en: string | null
        }
        Insert: {
          id?: string
          empresa_id: string
          servicio_id: string
          medico_id: string
          sucursal_id: string
          duracion_minutos?: number | null
          buffer_pre_min?: number
          buffer_post_min?: number
          sala_id?: string | null
          modelo_honorarios?: 'fijo' | 'bloque_procedimiento' | 'cirugia_general' | null
          monto_bloque?: number | null
          monto_por_cirugia?: number | null
          monto_por_cirugia_general?: number | null
          honorarios_por_rol?: Json
          modo_bloque?: 'automatico' | 'confirmacion' | null
          unidad_honorario?: 'caso' | 'bloque' | 'hora'
          pct_no_realizada?: number
          fee_cancelacion_tardia?: number
          alias?: string | null
          notas_privadas?: string | null
          activo?: boolean | null
          creado_en?: string | null
        }
        Update: {
          id?: string
          empresa_id?: string
          servicio_id?: string
          medico_id?: string
          sucursal_id?: string
          duracion_minutos?: number | null
          buffer_pre_min?: number
          buffer_post_min?: number
          sala_id?: string | null
          modelo_honorarios?: 'fijo' | 'bloque_procedimiento' | 'cirugia_general' | null
          monto_bloque?: number | null
          monto_por_cirugia?: number | null
          monto_por_cirugia_general?: number | null
          honorarios_por_rol?: Json
          modo_bloque?: 'automatico' | 'confirmacion' | null
          unidad_honorario?: 'caso' | 'bloque' | 'hora'
          pct_no_realizada?: number
          fee_cancelacion_tardia?: number
          alias?: string | null
          notas_privadas?: string | null
          activo?: boolean | null
          creado_en?: string | null
        }
        Relationships: []
      }
      mpaci_salas: {
        Row: {
          id: string
          empresa_id: string
          sucursal_id: string
          nombre: string
          descripcion: string | null
          activo: boolean | null
          creado_en: string | null
        }
        Insert: {
          id?: string
          empresa_id: string
          sucursal_id: string
          nombre: string
          descripcion?: string | null
          activo?: boolean | null
          creado_en?: string | null
        }
        Update: {
          id?: string
          empresa_id?: string
          sucursal_id?: string
          nombre?: string
          descripcion?: string | null
          activo?: boolean | null
          creado_en?: string | null
        }
        Relationships: []
      }
      mpaci_citas: {
        Row: {
          id: string
          contacto_id: string | null // deprecated; usar mpaci_cita_pacientes
          servicio_id: string | null // deprecated; usar mpaci_cita_procedimientos
          prospecto_id: string | null
          medico_id: string
          fecha_inicio: string
          fecha_fin: string
          estado_operativo:
            | 'Agendada'
            | 'Realizada'
            | 'No realizada (presente)'
            | 'No asisti├│'
            | 'Cancelada por cl├¡nica'
            | 'Cancelada por paciente dentro de plazo'
            | 'Cancelada por paciente fuera de plazo'
          estado_pago: 'No pagado' | 'Pago parcial' | 'Pago total' | 'Cortes├¡a' | 'Reembolsado'
          estado_confirmacion: 'no_confirmada' | 'confirmada'
          cobertura_usada: string | null
          gcal_event_id: string | null
          sala_id: string | null
          motivo_cancelacion: string | null
          precio_base: number
          descuento: number | null
          precio_snapshot: number | null
          duracion_snapshot_min: number | null
          config_snapshot: Json | null
          honorarios_snapshot: Json | null
          empresa_id: string | null
          sucursal_id: string | null
          creado_en: string | null
        }
        Insert: {
          id?: string
          contacto_id?: string | null
          servicio_id?: string | null
          prospecto_id?: string | null
          medico_id: string
          fecha_inicio: string
          fecha_fin: string
          estado_operativo?: string
          estado_pago?: string
          estado_confirmacion?: 'no_confirmada' | 'confirmada'
          cobertura_usada?: string | null
          gcal_event_id?: string | null
          sala_id?: string | null
          motivo_cancelacion?: string | null
          precio_base: number
          descuento?: number | null
          precio_snapshot?: number | null
          duracion_snapshot_min?: number | null
          config_snapshot?: Json | null
          honorarios_snapshot?: Json | null
          empresa_id?: string | null
          sucursal_id?: string | null
          creado_en?: string | null
        }
        Update: {
          id?: string
          contacto_id?: string | null
          servicio_id?: string | null
          prospecto_id?: string | null
          medico_id?: string
          fecha_inicio?: string
          fecha_fin?: string
          estado_operativo?: string
          estado_pago?: string
          estado_confirmacion?: 'no_confirmada' | 'confirmada'
          cobertura_usada?: string | null
          gcal_event_id?: string | null
          sala_id?: string | null
          motivo_cancelacion?: string | null
          precio_base?: number
          descuento?: number | null
          // Campos snapshot son INMUTABLES por trigger; evitar tocarlos
          empresa_id?: string | null
          sucursal_id?: string | null
          creado_en?: string | null
        }
        Relationships: []
      }
      mpaci_cita_procedimientos: {
        Row: {
          id: string
          empresa_id: string
          cita_id: string
          servicio_id: string
          orden: number
          tipo_ejecucion: 'concurrente' | 'secuencial'
          duracion_snapshot_min: number | null
          precio_snapshot: number | null
          honorarios_snapshot: Json | null
          cobertura_usada: string | null
          creado_en: string | null
        }
        Insert: {
          id?: string
          empresa_id: string
          cita_id: string
          servicio_id: string
          orden?: number
          tipo_ejecucion?: 'concurrente' | 'secuencial'
          duracion_snapshot_min?: number | null
          precio_snapshot?: number | null
          honorarios_snapshot?: Json | null
          cobertura_usada?: string | null
          creado_en?: string | null
        }
        Update: {
          id?: string
          empresa_id?: string
          cita_id?: string
          servicio_id?: string
          orden?: number
          tipo_ejecucion?: 'concurrente' | 'secuencial'
          duracion_snapshot_min?: number | null
          precio_snapshot?: number | null
          honorarios_snapshot?: Json | null
          cobertura_usada?: string | null
          creado_en?: string | null
        }
        Relationships: []
      }
      mpaci_cita_pacientes: {
        Row: {
          id: string
          empresa_id: string
          cita_id: string
          contacto_id: string
          es_principal: boolean
          estado_asistencia: 'pendiente' | 'asistio' | 'no_asistio'
          creado_en: string | null
        }
        Insert: {
          id?: string
          empresa_id: string
          cita_id: string
          contacto_id: string
          es_principal?: boolean
          estado_asistencia?: 'pendiente' | 'asistio' | 'no_asistio'
          creado_en?: string | null
        }
        Update: {
          id?: string
          empresa_id?: string
          cita_id?: string
          contacto_id?: string
          es_principal?: boolean
          estado_asistencia?: 'pendiente' | 'asistio' | 'no_asistio'
          creado_en?: string | null
        }
        Relationships: []
      }
      mpaci_bloques_horarios: {
        Row: {
          id: string
          medico_id: string
          rango_tiempo: string // tstzrange serializado como text
          estado_bloque: 'Disponible' | 'Reservado' | 'Bloqueado_Personal'
          cita_id: string | null
          motivo: string | null
          tipo: 'no_disponible' | 'excepcion_puntual' | 'vacaciones' | 'colacion'
          empresa_id: string | null
          sucursal_id: string | null
          creado_en: string | null
        }
        Insert: {
          id?: string
          medico_id: string
          rango_tiempo: string
          estado_bloque?: 'Disponible' | 'Reservado' | 'Bloqueado_Personal'
          cita_id?: string | null
          motivo?: string | null
          tipo?: 'no_disponible' | 'excepcion_puntual' | 'vacaciones' | 'colacion'
          empresa_id?: string | null
          sucursal_id?: string | null
          creado_en?: string | null
        }
        Update: {
          id?: string
          medico_id?: string
          rango_tiempo?: string
          estado_bloque?: 'Disponible' | 'Reservado' | 'Bloqueado_Personal'
          cita_id?: string | null
          motivo?: string | null
          tipo?: 'no_disponible' | 'excepcion_puntual' | 'vacaciones' | 'colacion'
          empresa_id?: string | null
          sucursal_id?: string | null
          creado_en?: string | null
        }
        Relationships: []
      }
      mpaci_horarios_prestador: {
        Row: {
          id: string
          empresa_id: string
          medico_id: string
          sucursal_id: string
          dia_semana: number
          hora_inicio: string
          hora_fin: string
          vigente_desde: string
          vigente_hasta: string | null
          activo: boolean | null
          creado_en: string | null
        }
        Insert: {
          id?: string
          empresa_id: string
          medico_id: string
          sucursal_id: string
          dia_semana: number
          hora_inicio: string
          hora_fin: string
          vigente_desde?: string
          vigente_hasta?: string | null
          activo?: boolean | null
          creado_en?: string | null
        }
        Update: {
          id?: string
          empresa_id?: string
          medico_id?: string
          sucursal_id?: string
          dia_semana?: number
          hora_inicio?: string
          hora_fin?: string
          vigente_desde?: string
          vigente_hasta?: string | null
          activo?: boolean | null
          creado_en?: string | null
        }
        Relationships: []
      }
      mpaci_horarios_pausas: {
        Row: {
          id: string
          horario_id: string
          hora_inicio: string
          hora_fin: string
          motivo: string | null
        }
        Insert: {
          id?: string
          horario_id: string
          hora_inicio: string
          hora_fin: string
          motivo?: string | null
        }
        Update: {
          id?: string
          horario_id?: string
          hora_inicio?: string
          hora_fin?: string
          motivo?: string | null
        }
        Relationships: []
      }
      mpaci_horarios_excepciones: {
        Row: {
          id: string
          empresa_id: string
          medico_id: string
          fecha: string
          tipo: 'no_disponible' | 'horario_especial'
          hora_inicio: string | null
          hora_fin: string | null
          motivo: string | null
          creado_en: string | null
        }
        Insert: {
          id?: string
          empresa_id: string
          medico_id: string
          fecha: string
          tipo: 'no_disponible' | 'horario_especial'
          hora_inicio?: string | null
          hora_fin?: string | null
          motivo?: string | null
          creado_en?: string | null
        }
        Update: {
          id?: string
          empresa_id?: string
          medico_id?: string
          fecha?: string
          tipo?: 'no_disponible' | 'horario_especial'
          hora_inicio?: string | null
          hora_fin?: string | null
          motivo?: string | null
          creado_en?: string | null
        }
        Relationships: []
      }
      mpaci_notas_agenda: {
        Row: {
          id: string
          empresa_id: string
          sucursal_id: string | null
          alcance: 'dia' | 'semana'
          fecha: string
          titulo: string | null
          contenido: string
          creado_por: string | null
          creado_en: string | null
          actualizado_en: string | null
        }
        Insert: {
          id?: string
          empresa_id: string
          sucursal_id?: string | null
          alcance: 'dia' | 'semana'
          fecha: string
          titulo?: string | null
          contenido: string
          creado_por?: string | null
          creado_en?: string | null
          actualizado_en?: string | null
        }
        Update: {
          id?: string
          empresa_id?: string
          sucursal_id?: string | null
          alcance?: 'dia' | 'semana'
          fecha?: string
          titulo?: string | null
          contenido?: string
          creado_por?: string | null
          creado_en?: string | null
          actualizado_en?: string | null
        }
        Relationships: []
      }

      // ----------------------------------------------------------
      // AGENDA ÔÇö Equipo, Honorarios, Pagos, Auditor├¡a
      // ----------------------------------------------------------
      mpaci_equipo_cita: {
        Row: {
          id: string
          empresa_id: string
          cita_id: string
          usuario_id: string
          rol_clinico: 'cirujano' | 'ayudante' | 'anestesista' | 'arsenalera' | 'encargada_pabellon'
          honorario_calculado: number | null
          honorario_fijado: number | null
          fijado_en: string | null
          fijado_por: string | null
          creado_en: string | null
        }
        Insert: {
          id?: string
          empresa_id: string
          cita_id: string
          usuario_id: string
          rol_clinico: 'cirujano' | 'ayudante' | 'anestesista' | 'arsenalera' | 'encargada_pabellon'
          honorario_calculado?: number | null
          honorario_fijado?: number | null
          fijado_en?: string | null
          fijado_por?: string | null
          creado_en?: string | null
        }
        Update: {
          id?: string
          empresa_id?: string
          cita_id?: string
          usuario_id?: string
          rol_clinico?: 'cirujano' | 'ayudante' | 'anestesista' | 'arsenalera' | 'encargada_pabellon'
          honorario_calculado?: number | null
          // honorario_fijado, fijado_en, fijado_por: INMUTABLES una vez set (trigger)
          honorario_fijado?: number | null
          fijado_en?: string | null
          fijado_por?: string | null
          creado_en?: string | null
        }
        Relationships: []
      }
      mpaci_honorarios_bloque: {
        Row: {
          id: string
          empresa_id: string
          medico_id: string
          sucursal_id: string | null
          fecha: string
          bloque_rango: string // tstzrange
          monto: number
          estado: 'auto' | 'pendiente_confirmacion' | 'confirmado' | 'rechazado'
          confirmado_en: string | null
          confirmado_por: string | null
          config_snapshot: Json | null
          creado_en: string | null
        }
        Insert: {
          id?: string
          empresa_id: string
          medico_id: string
          sucursal_id?: string | null
          fecha: string
          bloque_rango: string
          monto: number
          estado?: 'auto' | 'pendiente_confirmacion' | 'confirmado' | 'rechazado'
          confirmado_en?: string | null
          confirmado_por?: string | null
          config_snapshot?: Json | null
          creado_en?: string | null
        }
        Update: {
          id?: string
          empresa_id?: string
          medico_id?: string
          sucursal_id?: string | null
          fecha?: string
          bloque_rango?: string
          monto?: number
          estado?: 'auto' | 'pendiente_confirmacion' | 'confirmado' | 'rechazado'
          confirmado_en?: string | null
          confirmado_por?: string | null
          config_snapshot?: Json | null
          creado_en?: string | null
        }
        Relationships: []
      }
      mpaci_permisos_usuario: {
        Row: {
          id: string
          empresa_id: string
          usuario_id: string
          modulo: 'agenda' | 'crm' | 'ficha_clinica' | 'estadisticas' | 'configuracion' | 'integraciones'
          permiso: string
          activo: boolean
          otorgado_por: string | null
          otorgado_en: string
        }
        Insert: {
          id?: string
          empresa_id: string
          usuario_id: string
          modulo: 'agenda' | 'crm' | 'ficha_clinica' | 'estadisticas' | 'configuracion' | 'integraciones'
          permiso: string
          activo?: boolean
          otorgado_por?: string | null
          otorgado_en?: string
        }
        Update: {
          id?: string
          empresa_id?: string
          usuario_id?: string
          modulo?: 'agenda' | 'crm' | 'ficha_clinica' | 'estadisticas' | 'configuracion' | 'integraciones'
          permiso?: string
          activo?: boolean
          otorgado_por?: string | null
          otorgado_en?: string
        }
        Relationships: [
          { foreignKeyName: 'mpaci_permisos_usuario_empresa_id_fkey'; columns: ['empresa_id']; referencedRelation: 'mpaci_empresas'; referencedColumns: ['id'] },
          { foreignKeyName: 'mpaci_permisos_usuario_usuario_id_fkey'; columns: ['usuario_id']; referencedRelation: 'mpaci_usuarios'; referencedColumns: ['id'] },
          { foreignKeyName: 'mpaci_permisos_usuario_otorgado_por_fkey'; columns: ['otorgado_por']; referencedRelation: 'mpaci_usuarios'; referencedColumns: ['id'] }
        ]
      }
      mpaci_asignaciones_medico: {
        Row: {
          id: string
          empresa_id: string
          asistente_id: string
          medico_id: string
          activo: boolean
          creado_por: string | null
          creado_en: string
        }
        Insert: {
          id?: string
          empresa_id: string
          asistente_id: string
          medico_id: string
          activo?: boolean
          creado_por?: string | null
          creado_en?: string
        }
        Update: {
          id?: string
          empresa_id?: string
          asistente_id?: string
          medico_id?: string
          activo?: boolean
          creado_por?: string | null
          creado_en?: string
        }
        Relationships: [
          { foreignKeyName: 'mpaci_asignaciones_medico_empresa_id_fkey'; columns: ['empresa_id']; referencedRelation: 'mpaci_empresas'; referencedColumns: ['id'] },
          { foreignKeyName: 'mpaci_asignaciones_medico_asistente_id_fkey'; columns: ['asistente_id']; referencedRelation: 'mpaci_usuarios'; referencedColumns: ['id'] },
          { foreignKeyName: 'mpaci_asignaciones_medico_medico_id_fkey'; columns: ['medico_id']; referencedRelation: 'mpaci_usuarios'; referencedColumns: ['id'] }
        ]
      }
      mpaci_pagos_cita: {
        Row: {
          id: string
          empresa_id: string
          cita_id: string
          tipo: 'pago' | 'abono' | 'reembolso' | 'cortesia'
          monto: number
          medio_pago: string | null
          referencia: string | null
          registrado_por: string
          creado_en: string | null
        }
        Insert: {
          id?: string
          empresa_id: string
          cita_id: string
          tipo: 'pago' | 'abono' | 'reembolso' | 'cortesia'
          monto: number
          medio_pago?: string | null
          referencia?: string | null
          registrado_por: string
          creado_en?: string | null
        }
        Update: never // INMUTABLE por RLS
        Relationships: []
      }
      mpaci_auditoria_citas: {
        Row: {
          id: string
          empresa_id: string
          cita_id: string
          tipo_evento: string
          valor_anterior: string | null
          valor_nuevo: string | null
          usuario_id: string | null
          motivo: string | null
          version_config: string | null
          creado_en: string | null
        }
        Insert: {
          id?: string
          empresa_id: string
          cita_id: string
          tipo_evento: string
          valor_anterior?: string | null
          valor_nuevo?: string | null
          usuario_id?: string | null
          motivo?: string | null
          version_config?: string | null
          creado_en?: string | null
        }
        Update: never
        Relationships: []
      }

      // ----------------------------------------------------------
      // AGENDA ÔÇö Recursos (insumos, equipamiento)
      // ----------------------------------------------------------
      mpaci_insumos: {
        Row: {
          id: string
          empresa_id: string
          sucursal_id: string | null
          nombre: string
          sku: string | null
          unidad: string
          stock_actual: number
          stock_minimo: number
          activo: boolean | null
          creado_en: string | null
        }
        Insert: {
          id?: string
          empresa_id: string
          sucursal_id?: string | null
          nombre: string
          sku?: string | null
          unidad?: string
          stock_actual?: number
          stock_minimo?: number
          activo?: boolean | null
          creado_en?: string | null
        }
        Update: {
          id?: string
          empresa_id?: string
          sucursal_id?: string | null
          nombre?: string
          sku?: string | null
          unidad?: string
          stock_actual?: number
          stock_minimo?: number
          activo?: boolean | null
          creado_en?: string | null
        }
        Relationships: []
      }
      mpaci_equipamiento: {
        Row: {
          id: string
          empresa_id: string
          sucursal_id: string | null
          nombre: string
          descripcion: string | null
          activo: boolean | null
          creado_en: string | null
        }
        Insert: {
          id?: string
          empresa_id: string
          sucursal_id?: string | null
          nombre: string
          descripcion?: string | null
          activo?: boolean | null
          creado_en?: string | null
        }
        Update: {
          id?: string
          empresa_id?: string
          sucursal_id?: string | null
          nombre?: string
          descripcion?: string | null
          activo?: boolean | null
          creado_en?: string | null
        }
        Relationships: []
      }
      mpaci_servicios_config_recursos: {
        Row: {
          id: string
          servicios_config_id: string
          tipo_recurso: 'insumo' | 'equipamiento'
          recurso_id: string
          cantidad: number
        }
        Insert: {
          id?: string
          servicios_config_id: string
          tipo_recurso: 'insumo' | 'equipamiento'
          recurso_id: string
          cantidad?: number
        }
        Update: {
          id?: string
          servicios_config_id?: string
          tipo_recurso?: 'insumo' | 'equipamiento'
          recurso_id?: string
          cantidad?: number
        }
        Relationships: []
      }

      // ----------------------------------------------------------
      // FICHA CL├ìNICA
      // ----------------------------------------------------------
      mpaci_fichas_clinicas: {
        Row: {
          id: string
          cita_id: string
          medico_id: string
          contenido_texto: string | null // deprecated (usar mpaci_registros_clinicos)
          empresa_id: string | null
          creado_en: string | null
          actualizado_en: string | null
          // ── Columnas 00050: Consulta Rápida ────────────────────
          motivos_consulta_ids: string[] | null
          notas_medicas: string | null
          examenes_solicitados: string[] | null
          notas_examenes: string | null
          examen_fisico: Json | null
          fotos_examenes_paths: string[] | null
          medico_consulta_id: string | null
          ultima_edicion_en: string | null
          contacto_id: string | null
          creado_por: string | null
        }
        Insert: {
          id?: string
          cita_id: string
          medico_id?: string
          contenido_texto?: string | null
          empresa_id?: string | null
          creado_en?: string | null
          actualizado_en?: string | null
          motivos_consulta_ids?: string[] | null
          notas_medicas?: string | null
          examenes_solicitados?: string[] | null
          notas_examenes?: string | null
          examen_fisico?: Json | null
          fotos_examenes_paths?: string[] | null
          medico_consulta_id?: string | null
          ultima_edicion_en?: string | null
          contacto_id?: string | null
          creado_por?: string | null
        }
        Update: {
          id?: string
          cita_id?: string
          medico_id?: string
          contenido_texto?: string | null
          empresa_id?: string | null
          creado_en?: string | null
          actualizado_en?: string | null
          motivos_consulta_ids?: string[] | null
          notas_medicas?: string | null
          examenes_solicitados?: string[] | null
          notas_examenes?: string | null
          examen_fisico?: Json | null
          fotos_examenes_paths?: string[] | null
          medico_consulta_id?: string | null
          ultima_edicion_en?: string | null
          contacto_id?: string | null
          creado_por?: string | null
        }
        Relationships: []
      }
      // ── 00050: Catálogo de Motivos de Consulta ──────────────────
      mpaci_motivos_consulta: {
        Row: {
          id: string
          empresa_id: string | null // NULL = global
          nombre: string
          activo: boolean
          orden: number
          creado_por: string | null
          creado_en: string | null
        }
        Insert: {
          id?: string
          empresa_id?: string | null
          nombre: string
          activo?: boolean
          orden?: number
          creado_por?: string | null
          creado_en?: string | null
        }
        Update: {
          id?: string
          empresa_id?: string | null
          nombre?: string
          activo?: boolean
          orden?: number
          creado_por?: string | null
          creado_en?: string | null
        }
        Relationships: []
      }
      mpaci_anotaciones_clinicas: {
        Row: {
          id: string
          ficha_id: string
          medico_id: string
          contenido: string
          empresa_id: string | null
          creado_en: string | null
        }
        Insert: {
          id?: string
          ficha_id: string
          medico_id: string
          contenido: string
          empresa_id?: string | null
          creado_en?: string | null
        }
        Update: never // INMUTABLE
        Relationships: []
      }
      mpaci_diagnosticos: {
        Row: {
          id: string
          empresa_id: string
          contacto_id: string
          codigo_cie10: string
          descripcion: string
          lateralidad: 'bilateral' | 'izquierdo' | 'derecho' | null
          estado: 'activo' | 'inactivo' | 'resuelto'
          es_principal: boolean
          es_favorito: boolean
          nota: string | null
          creado_por: string | null
          creado_en: string | null
        }
        Insert: {
          id?: string
          empresa_id: string
          contacto_id: string
          codigo_cie10: string
          descripcion: string
          lateralidad?: 'bilateral' | 'izquierdo' | 'derecho' | null
          estado?: 'activo' | 'inactivo' | 'resuelto'
          es_principal?: boolean
          es_favorito?: boolean
          nota?: string | null
          creado_por?: string | null
          creado_en?: string | null
        }
        Update: {
          id?: string
          empresa_id?: string
          contacto_id?: string
          codigo_cie10?: string
          descripcion?: string
          lateralidad?: 'bilateral' | 'izquierdo' | 'derecho' | null
          estado?: 'activo' | 'inactivo' | 'resuelto'
          es_principal?: boolean
          es_favorito?: boolean
          nota?: string | null
          creado_por?: string | null
          creado_en?: string | null
        }
        Relationships: []
      }
      mpaci_medicamentos_paciente: {
        Row: {
          id: string
          empresa_id: string
          contacto_id: string
          nombre: string
          estado: 'activo' | 'suspendido' | 'completado'
          es_principal: boolean
          es_favorito: boolean
          nota: string | null
          catalogo_id: string | null
          creado_por: string | null
          creado_en: string | null
        }
        Insert: {
          id?: string
          empresa_id: string
          contacto_id: string
          nombre: string
          estado?: 'activo' | 'suspendido' | 'completado'
          es_principal?: boolean
          es_favorito?: boolean
          nota?: string | null
          catalogo_id?: string | null
          creado_por?: string | null
          creado_en?: string | null
        }
        Update: {
          id?: string
          empresa_id?: string
          contacto_id?: string
          nombre?: string
          estado?: 'activo' | 'suspendido' | 'completado'
          es_principal?: boolean
          es_favorito?: boolean
          nota?: string | null
          catalogo_id?: string | null
          creado_por?: string | null
          creado_en?: string | null
        }
        Relationships: []
      }
      mpaci_alergias: {
        Row: {
          id: string
          empresa_id: string
          contacto_id: string
          sustancia: string
          reaccion: string | null
          severidad: 'leve' | 'moderada' | 'severa' | null
          es_principal: boolean
          nota: string | null
          creado_por: string | null
          creado_en: string | null
        }
        Insert: {
          id?: string
          empresa_id: string
          contacto_id: string
          sustancia: string
          reaccion?: string | null
          severidad?: 'leve' | 'moderada' | 'severa' | null
          es_principal?: boolean
          nota?: string | null
          creado_por?: string | null
          creado_en?: string | null
        }
        Update: {
          id?: string
          empresa_id?: string
          contacto_id?: string
          sustancia?: string
          reaccion?: string | null
          severidad?: 'leve' | 'moderada' | 'severa' | null
          es_principal?: boolean
          nota?: string | null
          creado_por?: string | null
          creado_en?: string | null
        }
        Relationships: []
      }
      mpaci_cirugias_externas: {
        Row: {
          id: string
          empresa_id: string
          contacto_id: string
          nombre: string
          fecha: string | null
          profesional_lugar: string | null
          es_principal: boolean
          nota: string | null
          creado_por: string | null
          creado_en: string | null
        }
        Insert: {
          id?: string
          empresa_id: string
          contacto_id: string
          nombre: string
          fecha?: string | null
          profesional_lugar?: string | null
          es_principal?: boolean
          nota?: string | null
          creado_por?: string | null
          creado_en?: string | null
        }
        Update: {
          id?: string
          empresa_id?: string
          contacto_id?: string
          nombre?: string
          fecha?: string | null
          profesional_lugar?: string | null
          es_principal?: boolean
          nota?: string | null
          creado_por?: string | null
          creado_en?: string | null
        }
        Relationships: []
      }
      mpaci_plantillas_clinicas: {
        Row: {
          id: string
          empresa_id: string
          nombre: string
          categoria: string | null
          campos: Json
          version: number
          activo: boolean | null
          creado_por: string | null
          creado_en: string | null
        }
        Insert: {
          id?: string
          empresa_id: string
          nombre: string
          categoria?: string | null
          campos?: Json
          version?: number
          activo?: boolean | null
          creado_por?: string | null
          creado_en?: string | null
        }
        Update: {
          id?: string
          empresa_id?: string
          nombre?: string
          categoria?: string | null
          campos?: Json
          // version se incrementa solo por trigger
          activo?: boolean | null
          creado_por?: string | null
          creado_en?: string | null
        }
        Relationships: []
      }
      mpaci_plantillas_clinicas_versiones: {
        Row: {
          id: string
          plantilla_id: string
          version: number
          campos: Json
          nombre: string
          categoria: string | null
          creado_por: string | null
          creado_en: string | null
        }
        Insert: {
          id?: string
          plantilla_id: string
          version: number
          campos: Json
          nombre: string
          categoria?: string | null
          creado_por?: string | null
          creado_en?: string | null
        }
        Update: never // INMUTABLE
        Relationships: []
      }
      mpaci_registros_clinicos: {
        Row: {
          id: string
          empresa_id: string
          ficha_id: string
          plantilla_id: string | null
          version_plantilla: number | null
          contenido: Json
          creado_por: string | null
          creado_en: string | null
        }
        Insert: {
          id?: string
          empresa_id: string
          ficha_id: string
          plantilla_id?: string | null
          version_plantilla?: number | null
          contenido?: Json
          creado_por?: string | null
          creado_en?: string | null
        }
        Update: {
          id?: string
          empresa_id?: string
          ficha_id?: string
          plantilla_id?: string | null
          version_plantilla?: number | null
          contenido?: Json
          creado_por?: string | null
          creado_en?: string | null
        }
        Relationships: []
      }
      mpaci_documentos: {
        Row: {
          id: string
          empresa_id: string
          contacto_id: string
          cita_id: string | null
          ficha_id: string | null
          tipo: 'clinico' | 'administrativo' | 'otro'
          nombre: string
          storage_path: string
          mime_type: string | null
          tamanio_bytes: number | null
          origen: string | null
          subido_por: string | null
          creado_en: string | null
        }
        Insert: {
          id?: string
          empresa_id: string
          contacto_id: string
          cita_id?: string | null
          ficha_id?: string | null
          tipo: 'clinico' | 'administrativo' | 'otro'
          nombre: string
          storage_path: string
          mime_type?: string | null
          tamanio_bytes?: number | null
          origen?: string | null
          subido_por?: string | null
          creado_en?: string | null
        }
        Update: {
          id?: string
          empresa_id?: string
          contacto_id?: string
          cita_id?: string | null
          ficha_id?: string | null
          tipo?: 'clinico' | 'administrativo' | 'otro'
          nombre?: string
          storage_path?: string
          mime_type?: string | null
          tamanio_bytes?: number | null
          origen?: string | null
          subido_por?: string | null
          creado_en?: string | null
        }
        Relationships: []
      }
      mpaci_frases_rapidas: {
        Row: {
          id: string
          empresa_id: string
          ambito: 'institucional' | 'personal'
          usuario_id: string | null
          atajo: string | null
          contenido: string
          uso_count: number
          creado_en: string | null
        }
        Insert: {
          id?: string
          empresa_id: string
          ambito: 'institucional' | 'personal'
          usuario_id?: string | null
          atajo?: string | null
          contenido: string
          uso_count?: number
          creado_en?: string | null
        }
        Update: {
          id?: string
          empresa_id?: string
          ambito?: 'institucional' | 'personal'
          usuario_id?: string | null
          atajo?: string | null
          contenido?: string
          uso_count?: number
          creado_en?: string | null
        }
        Relationships: []
      }

      // ----------------------------------------------------------
      // CAT├üLOGOS GLOBALES
      // ----------------------------------------------------------
      mpaci_catalogo_cie10: {
        Row: {
          codigo: string
          descripcion: string
          capitulo: string | null
          bloque: string | null
          activo: boolean | null
          creado_en: string | null
        }
        Insert: {
          codigo: string
          descripcion: string
          capitulo?: string | null
          bloque?: string | null
          activo?: boolean | null
          creado_en?: string | null
        }
        Update: {
          codigo?: string
          descripcion?: string
          capitulo?: string | null
          bloque?: string | null
          activo?: boolean | null
          creado_en?: string | null
        }
        Relationships: []
      }
      mpaci_catalogo_medicamentos: {
        Row: {
          id: string
          nombre_generico: string
          nombre_comercial: string | null
          principio_activo: string | null
          forma_farmaceutica: string | null
          concentracion: string | null
          activo: boolean | null
          creado_en: string | null
        }
        Insert: {
          id?: string
          nombre_generico: string
          nombre_comercial?: string | null
          principio_activo?: string | null
          forma_farmaceutica?: string | null
          concentracion?: string | null
          activo?: boolean | null
          creado_en?: string | null
        }
        Update: {
          id?: string
          nombre_generico?: string
          nombre_comercial?: string | null
          principio_activo?: string | null
          forma_farmaceutica?: string | null
          concentracion?: string | null
          activo?: boolean | null
          creado_en?: string | null
        }
        Relationships: []
      }

      // ----------------------------------------------------------
      // PERMISOS (plantillas + auditor├¡a)
      // ----------------------------------------------------------
      mpaci_plantillas_permisos: {
        Row: {
          id: string
          empresa_id: string
          nombre: string
          permisos: Json
          es_sistema: boolean | null
          creado_por: string | null
          creado_en: string | null
        }
        Insert: {
          id?: string
          empresa_id: string
          nombre: string
          permisos?: Json
          es_sistema?: boolean | null
          creado_por?: string | null
          creado_en?: string | null
        }
        Update: {
          id?: string
          empresa_id?: string
          nombre?: string
          permisos?: Json
          es_sistema?: boolean | null
          creado_por?: string | null
          creado_en?: string | null
        }
        Relationships: []
      }
      mpaci_auditoria_permisos: {
        Row: {
          id: string
          empresa_id: string
          usuario_afectado: string
          modificado_por: string
          permiso_clave: string | null
          valor_anterior: boolean | null
          valor_nuevo: boolean | null
          plantilla_anterior_id: string | null
          plantilla_nueva_id: string | null
          rol_anterior: string | null
          rol_nuevo: string | null
          creado_en: string | null
        }
        Insert: {
          id?: string
          empresa_id: string
          usuario_afectado: string
          modificado_por: string
          permiso_clave?: string | null
          valor_anterior?: boolean | null
          valor_nuevo?: boolean | null
          plantilla_anterior_id?: string | null
          plantilla_nueva_id?: string | null
          rol_anterior?: string | null
          rol_nuevo?: string | null
          creado_en?: string | null
        }
        Update: never // INMUTABLE
        Relationships: []
      }

      // ----------------------------------------------------------
      // ESTAD├ìSTICAS
      // ----------------------------------------------------------
      mpaci_reportes: {
        Row: {
          id: string
          empresa_id: string
          nombre: string
          descripcion: string | null
          configuracion: Json
          tipo_visualizacion: string
          visibilidad: 'creador' | 'roles' | 'sede' | 'usuarios'
          visibilidad_config: Json
          creado_por: string
          creado_en: string | null
          actualizado_en: string | null
        }
        Insert: {
          id?: string
          empresa_id: string
          nombre: string
          descripcion?: string | null
          configuracion?: Json
          tipo_visualizacion?: string
          visibilidad?: 'creador' | 'roles' | 'sede' | 'usuarios'
          visibilidad_config?: Json
          creado_por: string
          creado_en?: string | null
          actualizado_en?: string | null
        }
        Update: {
          id?: string
          empresa_id?: string
          nombre?: string
          descripcion?: string | null
          configuracion?: Json
          tipo_visualizacion?: string
          visibilidad?: 'creador' | 'roles' | 'sede' | 'usuarios'
          visibilidad_config?: Json
          creado_por?: string
          creado_en?: string | null
          actualizado_en?: string | null
        }
        Relationships: []
      }
      mpaci_tableros: {
        Row: {
          id: string
          empresa_id: string
          nombre: string
          descripcion: string | null
          configuracion_visual: Json
          creado_por: string
          creado_en: string | null
          actualizado_en: string | null
        }
        Insert: {
          id?: string
          empresa_id: string
          nombre: string
          descripcion?: string | null
          configuracion_visual?: Json
          creado_por: string
          creado_en?: string | null
          actualizado_en?: string | null
        }
        Update: {
          id?: string
          empresa_id?: string
          nombre?: string
          descripcion?: string | null
          configuracion_visual?: Json
          creado_por?: string
          creado_en?: string | null
          actualizado_en?: string | null
        }
        Relationships: []
      }
      mpaci_tableros_reportes: {
        Row: {
          tablero_id: string
          reporte_id: string
          posicion: number
          ancho: 'completo' | 'medio'
        }
        Insert: {
          tablero_id: string
          reporte_id: string
          posicion?: number
          ancho?: 'completo' | 'medio'
        }
        Update: {
          tablero_id?: string
          reporte_id?: string
          posicion?: number
          ancho?: 'completo' | 'medio'
        }
        Relationships: []
      }
      mpaci_permisos_tablero: {
        Row: {
          tablero_id: string
          tipo: 'usuario' | 'rol' | 'sede'
          referencia_id: string
          referencia_texto: string | null
        }
        Insert: {
          tablero_id: string
          tipo: 'usuario' | 'rol' | 'sede'
          referencia_id: string
          referencia_texto?: string | null
        }
        Update: {
          tablero_id?: string
          tipo?: 'usuario' | 'rol' | 'sede'
          referencia_id?: string
          referencia_texto?: string | null
        }
        Relationships: []
      }

      // ----------------------------------------------------------
      // CRM ÔåÆ ANAL├ìTICA (reasignaciones, campa├▒as, fuentes)
      // ----------------------------------------------------------
      mpaci_reasignaciones: {
        Row: {
          id: string
          empresa_id: string
          contacto_id: string | null
          prospecto_id: string | null
          de_usuario_id: string | null
          a_usuario_id: string
          motivo: string
          motivo_categoria: string | null
          ejecutado_por: string | null
          ejecutado_por_ia: boolean
          creado_en: string | null
        }
        Insert: {
          id?: string
          empresa_id: string
          contacto_id?: string | null
          prospecto_id?: string | null
          de_usuario_id?: string | null
          a_usuario_id: string
          motivo: string
          motivo_categoria?: string | null
          ejecutado_por?: string | null
          ejecutado_por_ia?: boolean
          creado_en?: string | null
        }
        Update: never // INMUTABLE
        Relationships: []
      }
      mpaci_fuentes_lead: {
        Row: {
          id: string
          empresa_id: string
          nombre: string
          tipo: 'organico' | 'pagado' | 'referido' | 'manual' | 'ia'
          activo: boolean | null
          creado_en: string | null
        }
        Insert: {
          id?: string
          empresa_id: string
          nombre: string
          tipo: 'organico' | 'pagado' | 'referido' | 'manual' | 'ia'
          activo?: boolean | null
          creado_en?: string | null
        }
        Update: {
          id?: string
          empresa_id?: string
          nombre?: string
          tipo?: 'organico' | 'pagado' | 'referido' | 'manual' | 'ia'
          activo?: boolean | null
          creado_en?: string | null
        }
        Relationships: []
      }
      mpaci_campanas: {
        Row: {
          id: string
          empresa_id: string
          fuente_id: string | null
          nombre: string
          canal: string | null
          fecha_inicio: string | null
          fecha_fin: string | null
          inversion: number
          moneda: string
          objetivo: string | null
          activa: boolean | null
          creado_en: string | null
        }
        Insert: {
          id?: string
          empresa_id: string
          fuente_id?: string | null
          nombre: string
          canal?: string | null
          fecha_inicio?: string | null
          fecha_fin?: string | null
          inversion?: number
          moneda?: string
          objetivo?: string | null
          activa?: boolean | null
          creado_en?: string | null
        }
        Update: {
          id?: string
          empresa_id?: string
          fuente_id?: string | null
          nombre?: string
          canal?: string | null
          fecha_inicio?: string | null
          fecha_fin?: string | null
          inversion?: number
          moneda?: string
          objetivo?: string | null
          activa?: boolean | null
          creado_en?: string | null
        }
        Relationships: []
      }
      mpaci_invitaciones: {
        Row: {
          id: string
          empresa_id: string
          email: string
          rol: AppRole
          codigo: string
          expires_at: string
          usado: boolean
          usado_en: string | null
          usado_por: string | null
          created_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          empresa_id: string
          email: string
          rol: AppRole
          codigo: string
          expires_at?: string
          usado?: boolean
          usado_en?: string | null
          usado_por?: string | null
          created_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          empresa_id?: string
          email?: string
          rol?: AppRole
          codigo?: string
          expires_at?: string
          usado?: boolean
          usado_en?: string | null
          usado_por?: string | null
          created_by?: string | null
          created_at?: string
        }
        Relationships: []
      }
    }

    Views: {
      mpaci_v_saldo_cita: {
        Row: {
          cita_id: string
          empresa_id: string | null
          monto_total: number | null
          total_pagado: number
          total_reembolsado: number
          total_cortesia: number
          saldo_pendiente: number
          estado_derivado: 'sin_cargo' | 'cortesia' | 'pagado' | 'parcial' | 'no_pagado'
        }
        Relationships: []
      }
      mpaci_v_citas_dia: {
        Row: {
          empresa_id: string | null
          medico_id: string
          sucursal_id: string | null
          fecha: string
          total_citas: number
          citas_realizadas: number
          citas_no_asistio: number
          citas_canceladas: number
          citas_confirmadas: number
          ingreso_bruto_esperado: number | null
        }
        Relationships: []
      }
    }

    Functions: {
      get_my_empresa_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      check_permission: {
        Args: { p_user_id: string; p_permission_key: string }
        Returns: boolean
      }
    }

    Enums: {
      app_role: AppRole
    }

    CompositeTypes: {
      [_ in never]: never
    }
  }
}
