-- 00018: Documenta contrato precio_base
COMMENT ON COLUMN public.mpaci_citas.precio_base IS 'Contrato: precio = mpaci_servicios_precios.precio (si encuentra cobertura) sino precio = mpaci_servicios.precio_base';
