export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      mpaci_usuarios: {
        Row: {
          id: string
          email: string
          nombre_completo: string
          rol: 'admin' | 'gerente' | 'asistente' | 'medico' | 'sistema'
          avatar_url: string | null
          empresa_id: string | null
          onboarding_completado: boolean
          ultima_sesion: string | null
          creado_en: string | null
        }
        Insert: {
          id: string
          email: string
          nombre_completo: string
          rol?: 'admin' | 'gerente' | 'asistente' | 'medico' | 'sistema'
          avatar_url?: string | null
          empresa_id?: string | null
          onboarding_completado?: boolean
          ultima_sesion?: string | null
          creado_en?: string | null
        }
        Update: {
          id?: string
          email?: string
          nombre_completo?: string
          rol?: 'admin' | 'gerente' | 'asistente' | 'medico' | 'sistema'
          avatar_url?: string | null
          empresa_id?: string | null
          onboarding_completado?: boolean
          ultima_sesion?: string | null
          creado_en?: string | null
        }
        Relationships: []
      }
      mpaci_contactos: {
        Row: {
          id: string
          rut: string | null
          nombre: string
          telefono: string | null
          email: string | null
          canal_origen: string
          empresa_id: string | null
          canal_contacto: string | null
          canal_referencia: string | null
          creado_en: string | null
        }
        Insert: {
          id?: string
          rut?: string | null
          nombre: string
          telefono?: string | null
          email?: string | null
          canal_origen: string
          empresa_id?: string | null
          canal_contacto?: string | null
          canal_referencia?: string | null
          creado_en?: string | null
        }
        Update: {
          id?: string
          rut?: string | null
          nombre?: string
          telefono?: string | null
          email?: string | null
          canal_origen?: string
          empresa_id?: string | null
          canal_contacto?: string | null
          canal_referencia?: string | null
          creado_en?: string | null
        }
        Relationships: []
      }
      mpaci_servicios: {
        Row: {
          id: string
          nombre: string
          duracion_minutos: number
          precio_base: number
          activo: boolean | null
          empresa_id: string | null
        }
        Insert: {
          id?: string
          nombre: string
          duracion_minutos: number
          precio_base: number
          activo?: boolean | null
          empresa_id?: string | null
        }
        Update: {
          id?: string
          nombre?: string
          duracion_minutos?: number
          precio_base?: number
          activo?: boolean | null
          empresa_id?: string | null
        }
        Relationships: []
      }
      mpaci_prospectos: {
        Row: {
          id: string
          contacto_id: string
          responsable_id: string | null
          estado: string
          servicio_id: string | null
          empresa_id: string | null
          creado_en: string | null
        }
        Insert: {
          id?: string
          contacto_id: string
          responsable_id?: string | null
          estado?: string
          servicio_id?: string | null
          empresa_id?: string | null
          creado_en?: string | null
        }
        Update: {
          id?: string
          contacto_id?: string
          responsable_id?: string | null
          estado?: string
          servicio_id?: string | null
          empresa_id?: string | null
          creado_en?: string | null
        }
        Relationships: []
      }
      mpaci_citas: {
        Row: {
          id: string
          contacto_id: string
          servicio_id: string
          medico_id: string
          fecha_inicio: string
          fecha_fin: string
          estado_operativo: string
          estado_pago: string
          precio_base: number
          descuento: number | null
          empresa_id: string | null
          sucursal_id: string | null
          creado_en: string | null
        }
        Insert: {
          id?: string
          contacto_id: string
          servicio_id: string
          medico_id: string
          fecha_inicio: string
          fecha_fin: string
          estado_operativo?: string
          estado_pago?: string
          precio_base: number
          descuento?: number | null
          empresa_id?: string | null
          sucursal_id?: string | null
          creado_en?: string | null
        }
        Update: {
          id?: string
          contacto_id?: string
          servicio_id?: string
          medico_id?: string
          fecha_inicio?: string
          fecha_fin?: string
          estado_operativo?: string
          estado_pago?: string
          precio_base?: number
          descuento?: number | null
          empresa_id?: string | null
          sucursal_id?: string | null
          creado_en?: string | null
        }
        Relationships: []
      }
      mpaci_fichas_clinicas: {
        Row: {
          id: string
          cita_id: string
          medico_id: string
          contenido_texto: string | null
          empresa_id: string | null
          creado_en: string | null
          actualizado_en: string | null
        }
        Insert: {
          id?: string
          cita_id: string
          medico_id: string
          contenido_texto?: string | null
          empresa_id?: string | null
          creado_en?: string | null
          actualizado_en?: string | null
        }
        Update: {
          id?: string
          cita_id?: string
          medico_id?: string
          contenido_texto?: string | null
          empresa_id?: string | null
          creado_en?: string | null
          actualizado_en?: string | null
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
        Update: {
          id?: string
          ficha_id?: string
          medico_id?: string
          contenido?: string
          empresa_id?: string | null
          creado_en?: string | null
        }
        Relationships: []
      }
      mpaci_bloques_horarios: {
        Row: {
          id: string
          medico_id: string
          rango_tiempo: string
          estado_bloque: string
          cita_id: string | null
          empresa_id: string | null
          sucursal_id: string | null
          creado_en: string | null
        }
        Insert: {
          id?: string
          medico_id: string
          rango_tiempo: string
          estado_bloque?: string
          cita_id?: string | null
          empresa_id?: string | null
          sucursal_id?: string | null
          creado_en?: string | null
        }
        Update: {
          id?: string
          medico_id?: string
          rango_tiempo?: string
          estado_bloque?: string
          cita_id?: string | null
          empresa_id?: string | null
          sucursal_id?: string | null
          creado_en?: string | null
        }
        Relationships: []
      }
      mpaci_actividades: {
        Row: {
          id: string
          prospecto_id: string
          asignado_a_id: string
          tipo_actividad: string
          descripcion: string | null
          fecha_vencimiento: string
          completada: boolean | null
          empresa_id: string | null
          creado_en: string | null
        }
        Insert: {
          id?: string
          prospecto_id: string
          asignado_a_id: string
          tipo_actividad: string
          descripcion?: string | null
          fecha_vencimiento: string
          completada?: boolean | null
          empresa_id?: string | null
          creado_en?: string | null
        }
        Update: {
          id?: string
          prospecto_id?: string
          asignado_a_id?: string
          tipo_actividad?: string
          descripcion?: string | null
          fecha_vencimiento?: string
          completada?: boolean | null
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
      mpaci_empresas: {
        Row: {
          id: string
          slug: string
          nombre: string
          plan_suscripcion: string | null
          activo: boolean | null
          creado_en: string | null
        }
        Insert: {
          id?: string
          slug: string
          nombre: string
          plan_suscripcion?: string | null
          activo?: boolean | null
          creado_en?: string | null
        }
        Update: {
          id?: string
          slug?: string
          nombre?: string
          plan_suscripcion?: string | null
          activo?: boolean | null
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
      mpaci_servicios_precios: {
        Row: {
          id: string
          servicio_id: string
          empresa_id: string
          cobertura: string
          precio: number
          etiqueta: string | null
          activo: boolean | null
          creado_en: string | null
        }
        Insert: {
          id?: string
          servicio_id: string
          empresa_id: string
          cobertura: string
          precio: number
          etiqueta?: string | null
          activo?: boolean | null
          creado_en?: string | null
        }
        Update: {
          id?: string
          servicio_id?: string
          empresa_id?: string
          cobertura?: string
          precio?: number
          etiqueta?: string | null
          activo?: boolean | null
          creado_en?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_my_empresa_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
    }
    Enums: {
      app_role: 'admin' | 'gerente' | 'asistente' | 'medico' | 'sistema'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
