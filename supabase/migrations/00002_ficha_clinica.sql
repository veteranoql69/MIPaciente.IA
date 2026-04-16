-- Migración: Ficha Clínica y Bloqueo de 24 hrs
-- Objetivo: Crear registros clínicos inmutables post-24hrs y la tabla de anotaciones.
-- Convención: Todas las tablas usan prefijo mpaci_

-- A. Ficha Clínica (Asociada a la cita, se asume 1 cita = 1 ficha clínica)
CREATE TABLE IF NOT EXISTS public.mpaci_fichas_clinicas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cita_id UUID NOT NULL UNIQUE REFERENCES public.mpaci_citas(id) ON DELETE CASCADE,
    medico_id UUID NOT NULL REFERENCES public.mpaci_usuarios(id),
    contenido_texto TEXT, -- Notas clínicas, de evaluación, etc.
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    actualizado_en TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- B. Anotaciones Posteriores (Permitidas después de las 24 hrs sin modificar lo original)
CREATE TABLE IF NOT EXISTS public.mpaci_anotaciones_clinicas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ficha_id UUID NOT NULL REFERENCES public.mpaci_fichas_clinicas(id) ON DELETE CASCADE,
    medico_id UUID NOT NULL REFERENCES public.mpaci_usuarios(id),
    contenido TEXT NOT NULL,
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- SEGURIDAD A NIVEL DE FILAS (Row Level Security - RLS)
ALTER TABLE public.mpaci_fichas_clinicas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mpaci_anotaciones_clinicas ENABLE ROW LEVEL SECURITY;

-- Políticas para 'mpaci_fichas_clinicas'
DROP POLICY IF EXISTS "Ver fichas clinicas" ON public.mpaci_fichas_clinicas;
CREATE POLICY "Ver fichas clinicas" ON public.mpaci_fichas_clinicas FOR SELECT
    USING (auth.uid() = medico_id OR EXISTS (SELECT 1 FROM public.mpaci_usuarios WHERE id = auth.uid() AND rol IN ('admin', 'gerente')));

DROP POLICY IF EXISTS "Medicos crean ficha" ON public.mpaci_fichas_clinicas;
CREATE POLICY "Medicos crean ficha" ON public.mpaci_fichas_clinicas FOR INSERT
    WITH CHECK (auth.uid() = medico_id);

-- 🛑 REGLA MVP: El médico puede EDITAR la ficha SOLO si han pasado menos de 24 HORAS
DROP POLICY IF EXISTS "Medicos editan ficha por 24hrs" ON public.mpaci_fichas_clinicas;
CREATE POLICY "Medicos editan ficha por 24hrs" ON public.mpaci_fichas_clinicas FOR UPDATE
    USING (
        auth.uid() = medico_id
        AND (EXTRACT(EPOCH FROM (now() - creado_en))) <= 86400
    );

-- Políticas para 'mpaci_anotaciones_clinicas'
DROP POLICY IF EXISTS "Medicos insertan anotaciones" ON public.mpaci_anotaciones_clinicas;
CREATE POLICY "Medicos insertan anotaciones" ON public.mpaci_anotaciones_clinicas FOR INSERT
    WITH CHECK (auth.uid() = medico_id);

DROP POLICY IF EXISTS "Ver anotaciones" ON public.mpaci_anotaciones_clinicas;
CREATE POLICY "Ver anotaciones" ON public.mpaci_anotaciones_clinicas FOR SELECT
    USING (auth.uid() = medico_id OR EXISTS (SELECT 1 FROM public.mpaci_usuarios WHERE id = auth.uid() AND rol IN ('admin', 'gerente')));

-- Las anotaciones posteriores son inmutables
DROP POLICY IF EXISTS "Anotaciones son inmutables" ON public.mpaci_anotaciones_clinicas;
CREATE POLICY "Anotaciones son inmutables" ON public.mpaci_anotaciones_clinicas FOR UPDATE USING (false);

DROP POLICY IF EXISTS "Anotaciones no se pueden borrar" ON public.mpaci_anotaciones_clinicas;
CREATE POLICY "Anotaciones no se pueden borrar" ON public.mpaci_anotaciones_clinicas FOR DELETE USING (false);
