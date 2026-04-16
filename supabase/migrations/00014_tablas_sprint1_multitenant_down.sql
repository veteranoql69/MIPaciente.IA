-- Rollback: 00014_tablas_sprint1_multitenant_down.sql

-- Revertir políticas RLS a versión Sprint 1
DROP POLICY IF EXISTS "Staff ve actividades de su empresa" ON public.mpaci_actividades;
DROP POLICY IF EXISTS "Staff gestiona actividades de su empresa" ON public.mpaci_actividades;

DROP POLICY IF EXISTS "Visibilidad actividades" ON public.mpaci_actividades;
CREATE POLICY "Visibilidad actividades" ON public.mpaci_actividades FOR SELECT
    USING (EXISTS (SELECT 1 FROM public.mpaci_usuarios WHERE id = auth.uid() AND rol IN ('admin', 'asistente', 'gerente')));
DROP POLICY IF EXISTS "Gestion de actividades" ON public.mpaci_actividades;
CREATE POLICY "Gestion de actividades" ON public.mpaci_actividades FOR ALL
    USING (EXISTS (SELECT 1 FROM public.mpaci_usuarios WHERE id = auth.uid() AND rol IN ('admin', 'asistente', 'gerente')));

DROP POLICY IF EXISTS "Staff ve bitacora de su empresa" ON public.mpaci_bitacora;
DROP POLICY IF EXISTS "Insertar en bitacora de su empresa" ON public.mpaci_bitacora;

DROP POLICY IF EXISTS "Visibilidad bitacora" ON public.mpaci_bitacora;
CREATE POLICY "Visibilidad bitacora" ON public.mpaci_bitacora FOR SELECT
    USING (EXISTS (SELECT 1 FROM public.mpaci_usuarios WHERE id = auth.uid() AND rol IN ('admin', 'asistente', 'gerente')));
DROP POLICY IF EXISTS "Insertar en bitacora" ON public.mpaci_bitacora;
CREATE POLICY "Insertar en bitacora" ON public.mpaci_bitacora FOR INSERT
    WITH CHECK (EXISTS (SELECT 1 FROM public.mpaci_usuarios WHERE id = auth.uid() AND rol IN ('admin', 'asistente', 'gerente', 'sistema')));

DROP POLICY IF EXISTS "Staff ve anotaciones de su empresa" ON public.mpaci_anotaciones_clinicas;
DROP POLICY IF EXISTS "Medicos insertan anotaciones en su empresa" ON public.mpaci_anotaciones_clinicas;

DROP POLICY IF EXISTS "Ver anotaciones" ON public.mpaci_anotaciones_clinicas;
CREATE POLICY "Ver anotaciones" ON public.mpaci_anotaciones_clinicas FOR SELECT
    USING (auth.uid() = medico_id OR EXISTS (SELECT 1 FROM public.mpaci_usuarios WHERE id = auth.uid() AND rol IN ('admin', 'gerente')));
DROP POLICY IF EXISTS "Medicos insertan anotaciones" ON public.mpaci_anotaciones_clinicas;
CREATE POLICY "Medicos insertan anotaciones" ON public.mpaci_anotaciones_clinicas FOR INSERT
    WITH CHECK (auth.uid() = medico_id);

-- Eliminar columnas empresa_id
ALTER TABLE public.mpaci_actividades DROP COLUMN IF EXISTS empresa_id;
ALTER TABLE public.mpaci_bitacora DROP COLUMN IF EXISTS empresa_id;
ALTER TABLE public.mpaci_anotaciones_clinicas DROP COLUMN IF EXISTS empresa_id;
