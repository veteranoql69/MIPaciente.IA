# Módulo de Onboarding e Invitaciones

Este módulo gestiona la creación de nuevos espacios de trabajo (Clínicas) y la incorporación de miembros del equipo.

## 1. Flujo de Registro (Asistente de Onboarding)
El proceso se divide en 3 pasos principales en el frontend (`OnboardingOwnerClient`):
1. **Datos de la Clínica:** Nombre y generación de `slug` único.
2. **Configuración de Equipo:** Lista dinámica de correos y roles (Admin, Médico, Secretaria).
3. **Confirmación:** Resumen y ejecución de la Server Action `createWorkspace`.

## 2. Server Action: `createWorkspace`
Ubicada en `src/app/onboarding/actions.ts`, esta acción realiza las siguientes tareas de forma atómica:
1. **Validación:** Verifica que el usuario esté autenticado y que el slug no exista.
2. **Creación de Empresa:** Inserta en `mpaci_empresas`.
3. **Actualización de Perfil:** Asigna el `empresa_id` al usuario creador y lo marca como `owner` con `onboarding_completado = true`.
4. **Gestión de Invitaciones:** 
   - Genera un código único para cada invitado.
   - Inserta los registros en `mpaci_invitaciones`.
   - Dispara el envío de correos.

## 3. Envío de Correos (Resend API)
El envío se realiza mediante la función `sendInvitationEmail` en `src/modules/invitaciones/email.ts`.

### Consideración Técnica Crítica:
Next.js Server Actions pueden interrumpir procesos asíncronos si se ejecuta un `redirect()` antes de que finalicen. Por ello, el bucle de invitaciones utiliza `await` para asegurar que Resend acepte el correo antes de redirigir al usuario a su dashboard.

```typescript
// Patrón utilizado en actions.ts
for (const inv of invitaciones) {
  // ... lógica de DB ...
  await sendInvitationEmail({ ... }); // Esperamos confirmación de despacho
}
redirect('/dashboard');
```

## 4. Aceptación de Invitación
Cuando un invitado recibe el correo:
1. Hace clic en el enlace con el código.
2. El sistema lo valida contra la tabla `mpaci_invitaciones`.
3. Si es válido, se le vincula a la empresa y se marca la invitación como usada.
