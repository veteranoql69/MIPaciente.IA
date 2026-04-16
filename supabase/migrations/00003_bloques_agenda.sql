-- Migración: Bloques Horarios de Agenda y Prevención de Solapamiento
-- Objetivo: Crear la tabla de disponibilidad de los médicos y evitar reservas duplicadas nativamente
-- Convención: Todas las tablas usan prefijo mpaci_

-- 1. EXTENSIÓN NECESARIA PARA RESTRICCIONES DE EXCLUSIÓN CON RANGOS Y UUIDS
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- 2. TABLA DE BLOQUES HORARIOS
CREATE TABLE IF NOT EXISTS public.mpaci_bloques_horarios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    medico_id UUID NOT NULL REFERENCES public.mpaci_usuarios(id) ON DELETE CASCADE,
    rango_tiempo TSTZRANGE NOT NULL,
    estado_bloque TEXT NOT NULL DEFAULT 'Disponible', -- 'Disponible', 'Reservado', 'Bloqueado_Personal'
    cita_id UUID REFERENCES public.mpaci_citas(id) ON DELETE SET NULL, -- Solo si está reservado
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    
    -- REGLA CRÍTICA MVP: El mismo médico NO puede tener dos bloques que se superpongan en el tiempo
    CONSTRAINT sin_solapamiento_agenda_medico 
        EXCLUDE USING gist (
            medico_id WITH =,
            rango_tiempo WITH &&
        )
);

-- 3. SEGURIDAD A NIVEL DE FILAS (Row Level Security - RLS)
ALTER TABLE public.mpaci_bloques_horarios ENABLE ROW LEVEL SECURITY;

-- Médicos pueden ver sus propios bloques, staff puede ver todos
DROP POLICY IF EXISTS "Visibilidad bloques horarios" ON public.mpaci_bloques_horarios;
CREATE POLICY "Visibilidad bloques horarios" ON public.mpaci_bloques_horarios FOR SELECT
    USING (auth.uid() = medico_id OR EXISTS (SELECT 1 FROM public.mpaci_usuarios WHERE id = auth.uid() AND rol IN ('admin', 'asistente', 'gerente')));

-- Asistentes, Gerentes y Admins pueden gestionar la agenda (crear/modificar bloques)
DROP POLICY IF EXISTS "Staff gestiona agenda" ON public.mpaci_bloques_horarios;
CREATE POLICY "Staff gestiona agenda" ON public.mpaci_bloques_horarios FOR ALL
    USING (EXISTS (SELECT 1 FROM public.mpaci_usuarios WHERE id = auth.uid() AND rol IN ('admin', 'asistente', 'gerente')));

-- Médicos pueden gestionar sus propios bloques (ej: bloquear horario de colación)
DROP POLICY IF EXISTS "Medicos gestionan sus bloques" ON public.mpaci_bloques_horarios;
CREATE POLICY "Medicos gestionan sus bloques" ON public.mpaci_bloques_horarios FOR ALL
    USING (auth.uid() = medico_id);
