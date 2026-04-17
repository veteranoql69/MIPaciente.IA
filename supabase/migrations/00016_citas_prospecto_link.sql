-- 00016: link directo CRM-Agenda para queries eficientes
ALTER TABLE public.mpaci_citas
    ADD COLUMN IF NOT EXISTS prospecto_id UUID REFERENCES public.mpaci_prospectos(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_mpaci_citas_prospecto ON public.mpaci_citas(prospecto_id);
