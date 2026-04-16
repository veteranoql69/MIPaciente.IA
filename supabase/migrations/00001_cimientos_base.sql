-- Migración Inicial: Cimientos Base (Urbamed)
-- Objetivo: Crear estructura de roles, tablas principales y RLS según MVP.
-- Convención: Todas las tablas usan prefijo mpaci_

-- 1. EXTENSIONES BÁSICAS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TIPOS Y ENUMS
-- PostgreSQL no soporta CREATE TYPE IF NOT EXISTS, usamos bloque seguro
DO $$ BEGIN
    CREATE TYPE app_role AS ENUM ('admin', 'gerente', 'asistente', 'medico', 'sistema');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- 3. TABLAS BASE

-- A. Usuarios (Perfiles extendidos de la tabla de autenticación)
CREATE TABLE IF NOT EXISTS public.mpaci_usuarios (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    nombre_completo TEXT NOT NULL,
    rol app_role NOT NULL DEFAULT 'asistente',
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- B. Contactos (Universo completo, incluye personas sin atención humana aún)
CREATE TABLE IF NOT EXISTS public.mpaci_contactos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rut TEXT UNIQUE, -- RUT o ID (opcional en los primeros pasos)
    nombre TEXT NOT NULL,
    telefono TEXT,
    email TEXT,
    canal_origen TEXT NOT NULL, -- WhatsApp, Formulario, Manual, Redes Sociales
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- C. Servicios (Catálogo clínico Base)
CREATE TABLE IF NOT EXISTS public.mpaci_servicios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre TEXT NOT NULL,
    duracion_minutos INTEGER NOT NULL,
    precio_base NUMERIC NOT NULL,
    activo BOOLEAN DEFAULT true
);

-- D. Prospectos CRM (Derivan de Contactos, exigen manejo humano)
CREATE TABLE IF NOT EXISTS public.mpaci_prospectos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contacto_id UUID NOT NULL REFERENCES public.mpaci_contactos(id) ON DELETE CASCADE,
    responsable_id UUID REFERENCES public.mpaci_usuarios(id),
    estado TEXT NOT NULL DEFAULT 'Nuevo', -- Nuevo, En seguimiento, Interesado, Agendado, Ganado, Perdido
    servicio_id UUID REFERENCES public.mpaci_servicios(id),
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- E. Citas de Agenda (Hecho Clínico)
CREATE TABLE IF NOT EXISTS public.mpaci_citas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contacto_id UUID NOT NULL REFERENCES public.mpaci_contactos(id),
    servicio_id UUID NOT NULL REFERENCES public.mpaci_servicios(id),
    medico_id UUID NOT NULL REFERENCES public.mpaci_usuarios(id),
    fecha_inicio TIMESTAMP WITH TIME ZONE NOT NULL,
    fecha_fin TIMESTAMP WITH TIME ZONE NOT NULL,
    estado_operativo TEXT NOT NULL DEFAULT 'Agendada', -- Agendada, Realizada, No asistió, Cancelada
    estado_pago TEXT NOT NULL DEFAULT 'No pagado', -- No pagado, Pago parcial, Pago total, Cortesía
    precio_base NUMERIC NOT NULL,
    descuento NUMERIC DEFAULT 0,
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 4. SEGURIDAD A NIVEL DE FILAS (Row Level Security - RLS)

-- Activamos RLS en todas las tablas
ALTER TABLE public.mpaci_usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mpaci_contactos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mpaci_servicios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mpaci_prospectos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mpaci_citas ENABLE ROW LEVEL SECURITY;

-- Políticas para 'mpaci_usuarios'
DROP POLICY IF EXISTS "Usuarios ven su propio perfil" ON public.mpaci_usuarios;
CREATE POLICY "Usuarios ven su propio perfil" ON public.mpaci_usuarios FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Admins ven todos los perfiles" ON public.mpaci_usuarios;
CREATE POLICY "Admins ven todos los perfiles" ON public.mpaci_usuarios FOR SELECT 
    USING (EXISTS (SELECT 1 FROM public.mpaci_usuarios WHERE id = auth.uid() AND rol = 'admin'));

-- Políticas para 'mpaci_servicios'
DROP POLICY IF EXISTS "Staff lee servicios" ON public.mpaci_servicios;
CREATE POLICY "Staff lee servicios" ON public.mpaci_servicios FOR SELECT
    USING (EXISTS (SELECT 1 FROM public.mpaci_usuarios WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Admin gestiona servicios" ON public.mpaci_servicios;
CREATE POLICY "Admin gestiona servicios" ON public.mpaci_servicios FOR ALL
    USING (EXISTS (SELECT 1 FROM public.mpaci_usuarios WHERE id = auth.uid() AND rol = 'admin'));

-- Políticas para 'mpaci_citas'
DROP POLICY IF EXISTS "Medicos ven sus propias citas" ON public.mpaci_citas;
CREATE POLICY "Medicos ven sus propias citas" ON public.mpaci_citas FOR SELECT
    USING (auth.uid() = medico_id OR EXISTS (SELECT 1 FROM public.mpaci_usuarios WHERE id = auth.uid() AND rol IN ('admin', 'asistente', 'gerente')));

-- Políticas para 'mpaci_contactos'
DROP POLICY IF EXISTS "Accesos a contactos para staff" ON public.mpaci_contactos;
CREATE POLICY "Accesos a contactos para staff" ON public.mpaci_contactos FOR ALL
    USING (EXISTS (SELECT 1 FROM public.mpaci_usuarios WHERE id = auth.uid() AND rol IN ('admin', 'asistente', 'gerente', 'sistema')));

-- Políticas para 'mpaci_prospectos'
DROP POLICY IF EXISTS "Accesos a prospectos para comerciales" ON public.mpaci_prospectos;
CREATE POLICY "Accesos a prospectos para comerciales" ON public.mpaci_prospectos FOR ALL
    USING (EXISTS (SELECT 1 FROM public.mpaci_usuarios WHERE id = auth.uid() AND rol IN ('admin', 'asistente', 'gerente')));

-- (El médico explícitamente no tiene política en Prospectos, por lo que NO podrá verlos, como dicta el MVP).

