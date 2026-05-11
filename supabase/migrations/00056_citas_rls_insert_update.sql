-- Políticas INSERT y UPDATE para mpaci_citas
-- Solo existían SELECT policies; sin INSERT la creación de citas fallaba con RLS error.

CREATE POLICY "Usuarios autorizados pueden crear citas"
ON mpaci_citas
FOR INSERT
TO authenticated
WITH CHECK (
  -- Admin y admin_general: cualquier cita de su empresa
  (EXISTS (
    SELECT 1 FROM mpaci_usuarios
    WHERE id = uid()
      AND empresa_id = mpaci_citas.empresa_id
      AND rol IN ('admin_general', 'admin')
  ))
  OR
  -- Médico: solo citas donde él es el médico
  (uid() = medico_id AND EXISTS (
    SELECT 1 FROM mpaci_usuarios
    WHERE id = uid()
      AND empresa_id = mpaci_citas.empresa_id
      AND rol = 'medico'
  ))
  OR
  -- Asistente: solo para médicos que tiene asignados
  (EXISTS (
    SELECT 1 FROM mpaci_asignaciones_medico am
    JOIN mpaci_usuarios u ON u.id = uid()
    WHERE am.asistente_id = uid()
      AND am.medico_id = mpaci_citas.medico_id
      AND am.activo = true
      AND u.empresa_id = mpaci_citas.empresa_id
  ))
);

CREATE POLICY "Usuarios autorizados pueden actualizar citas"
ON mpaci_citas
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM mpaci_usuarios
    WHERE id = uid()
      AND empresa_id = mpaci_citas.empresa_id
      AND rol IN ('admin_general', 'admin', 'medico', 'asistente')
  )
)
WITH CHECK (
  empresa_id = get_my_empresa_id()
);
