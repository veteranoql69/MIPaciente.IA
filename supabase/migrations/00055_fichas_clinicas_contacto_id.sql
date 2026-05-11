-- Agrega contacto_id a mpaci_fichas_clinicas para permitir
-- consultas de fichas por paciente sin hacer JOIN a mpaci_citas.
-- Se rellena retroactivamente desde mpaci_citas.

ALTER TABLE mpaci_fichas_clinicas
  ADD COLUMN IF NOT EXISTS contacto_id UUID REFERENCES mpaci_contactos(id) ON DELETE SET NULL;

-- Backfill: asignar contacto_id desde la cita asociada
UPDATE mpaci_fichas_clinicas f
SET contacto_id = c.contacto_id
FROM mpaci_citas c
WHERE f.cita_id = c.id
  AND f.contacto_id IS NULL;

-- Índice para queries por paciente
CREATE INDEX IF NOT EXISTS idx_fichas_clinicas_contacto_id
  ON mpaci_fichas_clinicas(contacto_id);
