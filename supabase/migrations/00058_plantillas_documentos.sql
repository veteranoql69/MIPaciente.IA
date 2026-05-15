-- Migración: 00058_plantillas_documentos.sql
-- Descripción: Plantillas de documentos médicos + identidad corporativa por empresa.

-- ─── Identidad corporativa en mpaci_empresas ─────────────────────────────────
ALTER TABLE public.mpaci_empresas
  ADD COLUMN IF NOT EXISTS logo_url          TEXT,
  ADD COLUMN IF NOT EXISTS email_clinica     TEXT,
  ADD COLUMN IF NOT EXISTS telefono_clinica  TEXT,
  ADD COLUMN IF NOT EXISTS direccion_clinica TEXT;

-- ─── Tabla principal ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.mpaci_plantillas_documentos (
  id             UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  empresa_id     UUID        NOT NULL REFERENCES public.mpaci_empresas(id)  ON DELETE CASCADE,
  tipo           TEXT        NOT NULL CHECK (tipo IN ('protocolo','receta','consentimiento')),
  nombre         TEXT        NOT NULL,
  servicio_id    UUID        REFERENCES public.mpaci_servicios(id) ON DELETE SET NULL,
  contenido      JSONB       NOT NULL DEFAULT '{"header":{"mostrar_logo":true,"mostrar_nombre_clinica":true,"mostrar_fecha":true,"mostrar_medico":true},"secciones":[]}',
  activo         BOOLEAN     DEFAULT true,
  creado_en      TIMESTAMPTZ DEFAULT now(),
  actualizado_en TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.mpaci_plantillas_documentos ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_plantillas_empresa ON public.mpaci_plantillas_documentos(empresa_id);
CREATE INDEX IF NOT EXISTS idx_plantillas_tipo    ON public.mpaci_plantillas_documentos(empresa_id, tipo);

-- ─── RLS ─────────────────────────────────────────────────────────────────────
CREATE POLICY "plantillas_select"
  ON public.mpaci_plantillas_documentos FOR SELECT
  USING (empresa_id = get_my_empresa_id());

CREATE POLICY "plantillas_insert"
  ON public.mpaci_plantillas_documentos FOR INSERT
  WITH CHECK (empresa_id = get_my_empresa_id());

CREATE POLICY "plantillas_update"
  ON public.mpaci_plantillas_documentos FOR UPDATE
  USING (empresa_id = get_my_empresa_id());

CREATE POLICY "plantillas_delete"
  ON public.mpaci_plantillas_documentos FOR DELETE
  USING (empresa_id = get_my_empresa_id());

-- ─── Trigger actualizado_en ───────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_plantilla_timestamp()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.actualizado_en = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_plantillas_updated
  BEFORE UPDATE ON public.mpaci_plantillas_documentos
  FOR EACH ROW EXECUTE FUNCTION update_plantilla_timestamp();

-- ─── Storage bucket empresa-assets ───────────────────────────────────────────
-- Bucket público para logos y assets corporativos por empresa.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'empresa-assets',
  'empresa-assets',
  true,
  2097152,  -- 2 MB
  ARRAY['image/png','image/jpeg','image/webp','image/svg+xml']
)
ON CONFLICT (id) DO NOTHING;

-- Lectura pública (logos en documentos PDF)
CREATE POLICY "empresa_assets_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'empresa-assets');

-- Escritura: solo usuarios autenticados de la misma empresa
CREATE POLICY "empresa_assets_auth_upload"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'empresa-assets' AND auth.role() = 'authenticated');

CREATE POLICY "empresa_assets_auth_update"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'empresa-assets' AND auth.role() = 'authenticated');

CREATE POLICY "empresa_assets_auth_delete"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'empresa-assets' AND auth.role() = 'authenticated');
