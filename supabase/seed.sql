-- Exploración de Datos Iniciales (Seed)
-- Objetivo: Configurar la empresa principal y sucursales base para desarrollo local y testing.

-- 1. Crear Empresa Principal (Urbamed / Manmec)
INSERT INTO public.mpaci_empresas (id, slug, nombre, plan_suscripcion, activo)
VALUES (
    'd837f400-60b5-4b53-b0df-2b9a71b12345', -- UUID estático para desarrollo
    'Urbamed',
    'Urbamed IA',
    'pro',
    true
)
ON CONFLICT (slug) DO NOTHING;

-- 2. Crear Sucursal Principal
INSERT INTO public.mpaci_sucursales (id, empresa_id, nombre, direccion, activo)
VALUES (
    'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    'd837f400-60b5-4b53-b0df-2b9a71b12345', -- Usamos el ID explícito de la empresa arriba
    'Sede Principal Santiago',
    'Av. Providencia 1234, Oficina 501',
    true
)
ON CONFLICT (id) DO NOTHING;

-- 3. Inserción de servicios base vinculados a la empresa
INSERT INTO public.mpaci_servicios (nombre, duracion_minutos, precio_base, activo, empresa_id)
VALUES 
    ('Consulta Urología General', 20, 50000, true, 'd837f400-60b5-4b53-b0df-2b9a71b12345'),
    ('Vasectomía', 45, 1490000, true, 'd837f400-60b5-4b53-b0df-2b9a71b12345'),
    ('Circuncisión', 40, 1490000, true, 'd837f400-60b5-4b53-b0df-2b9a71b12345')
ON CONFLICT DO NOTHING;
