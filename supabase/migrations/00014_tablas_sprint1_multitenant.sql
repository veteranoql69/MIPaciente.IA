-- Migración: 00014_tablas_sprint1_multitenant.sql
-- Descripción: Agrega empresa_id a las 3 tablas creadas en Sprint 1 que quedaron sin multi-tenant.
-- Afecta: mpaci_actividades, mpaci_bitacora, mpaci_anotaciones_clinicas
-- Ejecutar DESPUÉS de 00013.

-- ============================================================
-- 1. AGREGAR empresa_id A LAS 3 TABLAS
-- ============================================================

ALTER TABLE public.mpaci_actividades
    ADD COLUMN IF NOT EXISTS empresa_id UUID REFERENCES public.mpaci_empresas(id);

ALTER TABLE public.mpaci_bitacora
    ADD COLUMN IF NOT EXISTS empresa_id UUID REFERENCES public.mpaci_empresas(id);

ALTER TABLE public.mpaci_anotaciones_clinicas
    ADD COLUMN IF NOT EXISTS empresa_id UUID REFERENCES public.mpaci_empresas(id);

-- ============================================================
-- 2. BACKFILL: derivar empresa_id desde la cadena de FKs
-- ============================================================

-- mpaci_actividades -> mpaci_prospectos -> empresa_id
UPDATE public.mpaci_actividades a
SET empresa_id = p.empresa_id
FROM public.mpaci_prospectos p
WHERE a.prospecto_id = p.id
  AND a.empresa_id IS NULL;

-- mpaci_bitacora -> mpaci_prospectos -> empresa_id
UPDATE public.mpaci_bitacora b
SET empresa_id = p.empresa_id
FROM public.mpaci_prospectos p
WHERE b.prospecto_id = p.id
  AND b.empresa_id IS NULL;

-- mpaci_anotaciones_clinicas -> mpaci_fichas_clinicas -> empresa_id
UPDATE public.mpaci_anotaciones_clinicas ac
SET empresa_id = fc.empresa_id
FROM public.mpaci_fichas_clinicas fc
WHERE ac.ficha_id = fc.id
  AND ac.empresa_id IS NULL;

-- ============================================================
-- 3. REESCRIBIR RLS — mpaci_actividades
-- ============================================================

DROP POLICY IF EXISTS "Visibilidad actividades" ON public.mpaci_actividades;
DROP POLICY IF EXISTS "Gestion de actividades" ON public.mpaci_actividades;

CREATE POLICY "Staff ve actividades de su empresa" ON public.mpaci_actividades FOR SELECT
    USING (
        empresa_id IS NOT NULL
        AND empresa_id = get_my_empresa_id()
        AND EXISTS (
            SELECT 1 FROM public.mpaci_usuarios
            WHERE id = auth.uid() AND rol IN ('admin', 'asistente', 'gerente')
        )
    );

CREATE POLICY "Staff gestiona actividades de su empresa" ON public.mpaci_actividades FOR ALL
    USING (
        empresa_id IS NOT NULL
        AND empresa_id = get_my_empresa_id()
        AND EXISTS (
            SELECT 1 FROM public.mpaci_usuarios
            WHERE id = auth.uid() AND rol IN ('admin', 'asistente', 'gerente')
        )
    );

-- ============================================================
-- 4. REESCRIBIR RLS — mpaci_bitacora
-- ============================================================

DROP POLICY IF EXISTS "Visibilidad bitacora" ON public.mpaci_bitacora;
DROP POLICY IF EXISTS "Insertar en bitacora" ON public.mpaci_bitacora;
-- UPDATE y DELETE se mantienen en false (ya definidos en 00004 — inmutabilidad de auditoría)

CREATE POLICY "Staff ve bitacora de su empresa" ON public.mpaci_bitacora FOR SELECT
    USING (
        empresa_id IS NOT NULL
        AND empresa_id = get_my_empresa_id()
        AND EXISTS (
            SELECT 1 FROM public.mpaci_usuarios
            WHERE id = auth.uid() AND rol IN ('admin', 'asistente', 'gerente')
        )
    );

CREATE POLICY "Insertar en bitacora de su empresa" ON public.mpaci_bitacora FOR INSERT
    WITH CHECK (
        empresa_id IS NOT NULL
        AND empresa_id = get_my_empresa_id()
        AND EXISTS (
            SELECT 1 FROM public.mpaci_usuarios
            WHERE id = auth.uid() AND rol IN ('admin', 'asistente', 'gerente', 'sistema')
        )
    );

-- ============================================================
-- 5. REESCRIBIR RLS — mpaci_anotaciones_clinicas
-- ============================================================

DROP POLICY IF EXISTS "Medicos insertan anotaciones" ON public.mpaci_anotaciones_clinicas;
DROP POLICY IF EXISTS "Ver anotaciones" ON public.mpaci_anotaciones_clinicas;
-- UPDATE y DELETE se mantienen en false (inmutabilidad clínica)

CREATE POLICY "Staff ve anotaciones de su empresa" ON public.mpaci_anotaciones_clinicas FOR SELECT
    USING (
        empresa_id IS NOT NULL
        AND empresa_id = get_my_empresa_id()
    );

CREATE POLICY "Medicos insertan anotaciones en su empresa" ON public.mpaci_anotaciones_clinicas FOR INSERT
    WITH CHECK (
        empresa_id IS NOT NULL
        AND empresa_id = get_my_empresa_id()
        AND auth.uid() = medico_id
    );

COMMENT ON COLUMN public.mpaci_actividades.empresa_id IS
    'Tenant FK. Derivado de mpaci_prospectos.empresa_id. Backfilled en migración 00014.';
COMMENT ON COLUMN public.mpaci_bitacora.empresa_id IS
    'Tenant FK. Derivado de mpaci_prospectos.empresa_id. Backfilled en migración 00014.';
COMMENT ON COLUMN public.mpaci_anotaciones_clinicas.empresa_id IS
    'Tenant FK. Derivado de mpaci_fichas_clinicas.empresa_id. Backfilled en migración 00014.';
