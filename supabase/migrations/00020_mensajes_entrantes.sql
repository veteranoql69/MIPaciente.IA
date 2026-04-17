-- 00020: Nueva tabla para mensajes entrantes antes de convertirse en contactos
CREATE TABLE IF NOT EXISTS public.mpaci_mensajes_entrantes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID NOT NULL REFERENCES public.mpaci_empresas(id),
    canal TEXT NOT NULL,           -- 'whatsapp', 'instagram', 'formulario_web'
    remitente TEXT NOT NULL,       -- número WA, usuario IG, email
    contenido TEXT NOT NULL,
    metadata JSONB,                -- payload crudo del webhook
    procesado BOOLEAN DEFAULT false,
    contacto_id UUID REFERENCES public.mpaci_contactos(id),
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

-- Enable RLS
ALTER TABLE public.mpaci_mensajes_entrantes ENABLE ROW LEVEL SECURITY;

-- Adding basic RLS policy based on multi-tenant structure
CREATE POLICY "Aislamiento multi-tenant mensajes entrantes" ON public.mpaci_mensajes_entrantes
    FOR ALL
    USING (empresa_id = public.get_my_empresa_id() AND empresa_id IS NOT NULL);
