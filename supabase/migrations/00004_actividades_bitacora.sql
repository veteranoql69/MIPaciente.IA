-- Migración: CRM Actividades Operativas y Bitácora Audit
-- Objetivo: Soportar tareas asignadas en el CRM y registrar un historial de auditoría de los prospectos.
-- Convención: Todas las tablas usan prefijo mpaci_

-- 1. TABLA DE ACTIVIDADES (Tareas CRM)
CREATE TABLE IF NOT EXISTS public.mpaci_actividades (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    prospecto_id UUID NOT NULL REFERENCES public.mpaci_prospectos(id) ON DELETE CASCADE,
    asignado_a_id UUID NOT NULL REFERENCES public.mpaci_usuarios(id),
    tipo_actividad TEXT NOT NULL, -- Ej: 'Llamada', 'WhatsApp', 'Email', 'Seguimiento'
    descripcion TEXT,
    fecha_vencimiento TIMESTAMP WITH TIME ZONE NOT NULL,
    completada BOOLEAN DEFAULT false,
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. TABLA DE BITÁCORA (Historial del Pipeline y auditoría)
CREATE TABLE IF NOT EXISTS public.mpaci_bitacora (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    prospecto_id UUID NOT NULL REFERENCES public.mpaci_prospectos(id) ON DELETE CASCADE,
    usuario_accion_id UUID REFERENCES public.mpaci_usuarios(id), -- Puede ser nulo si lo hace el sistema/IA
    accion TEXT NOT NULL, -- Ej: 'CAMBIO_ESTADO', 'ASIGNACION', 'NOTA'
    estado_anterior TEXT,
    estado_nuevo TEXT,
    detalles TEXT,
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 3. SEGURIDAD A NIVEL DE FILAS (Row Level Security - RLS)
ALTER TABLE public.mpaci_actividades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mpaci_bitacora ENABLE ROW LEVEL SECURITY;

-- Actividades
DROP POLICY IF EXISTS "Visibilidad actividades" ON public.mpaci_actividades;
CREATE POLICY "Visibilidad actividades" ON public.mpaci_actividades FOR SELECT
    USING (EXISTS (SELECT 1 FROM public.mpaci_usuarios WHERE id = auth.uid() AND rol IN ('admin', 'asistente', 'gerente')));

DROP POLICY IF EXISTS "Gestion de actividades" ON public.mpaci_actividades;
CREATE POLICY "Gestion de actividades" ON public.mpaci_actividades FOR ALL
    USING (EXISTS (SELECT 1 FROM public.mpaci_usuarios WHERE id = auth.uid() AND rol IN ('admin', 'asistente', 'gerente')));

-- Bitácora
DROP POLICY IF EXISTS "Visibilidad bitacora" ON public.mpaci_bitacora;
CREATE POLICY "Visibilidad bitacora" ON public.mpaci_bitacora FOR SELECT
    USING (EXISTS (SELECT 1 FROM public.mpaci_usuarios WHERE id = auth.uid() AND rol IN ('admin', 'asistente', 'gerente')));

-- La bitácora NUNCA se edita ni se borra (Inmutabilidad de auditoría)
DROP POLICY IF EXISTS "Insertar en bitacora" ON public.mpaci_bitacora;
CREATE POLICY "Insertar en bitacora" ON public.mpaci_bitacora FOR INSERT
    WITH CHECK (EXISTS (SELECT 1 FROM public.mpaci_usuarios WHERE id = auth.uid() AND rol IN ('admin', 'asistente', 'gerente', 'sistema')));

DROP POLICY IF EXISTS "No Editar bitacora" ON public.mpaci_bitacora;
CREATE POLICY "No Editar bitacora" ON public.mpaci_bitacora FOR UPDATE USING (false);

DROP POLICY IF EXISTS "No Borrar bitacora" ON public.mpaci_bitacora;
CREATE POLICY "No Borrar bitacora" ON public.mpaci_bitacora FOR DELETE USING (false);
