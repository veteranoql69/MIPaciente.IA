# Documentación del Proyecto: Mi-Paciente.com (MVP)

Bienvenido a la carpeta de documentación oficial de **Mi-Paciente.com**. Esta documentación ha sido generada a partir del `plan.md` maestro del proyecto y está dividida en varias secciones clave para facilitar su lectura y actualización continua.

## Índice de Documentación

0. [Guía de Onboarding para Desarrolladores](00_onboarding_guide.md)
   Punto de entrada principal para nuevos contribuidores y resumen arquitectónico.

1. [Arquitectura y Stack Tecnológico](01_architecture_and_stack.md)
   Información sobre las herramientas utilizadas, integraciones de IA (Vercel AI SDK) y metodologías.
   
2. [Modelo de Datos (DB Schema)](02_database_schema.md)
   Detalles sobre las tablas de Supabase (todas con prefijo `mpaci_`), esquema multi-tenant y configuración RLS.

3. [Reglas de Negocio Críticas](03_business_rules.md)
   Las restricciones estrictas de negocio, flujos de la agenda, inmutabilidad de la ficha clínica de 24h y seguridad.

4. [Roadmap de Sprints](04_sprint_roadmap.md)
   El plan de ejecución de 180 días (12 Sprints), desde la infraestructura base hasta QA en producción.

5. [Arquitectura de Seguridad y RLS](05_arquitectura_seguridad.md)
   Lecciones aprendidas, resolución de recursión infinita en RLS y políticas de aislamiento.

6. [Onboarding e Invitaciones](06_onboarding_invitaciones.md)
   Flujo de registro de empresas y sistema de invitaciones por rol.

7. [Control AI con Langfuse](07_langfuse_ai_control.md)
   Estrategia de desacoplamiento de IA, gestión de prompts y observabilidad.

8. [Configuración Clínica y Plantillas](08_configuracion_clinica.md)
   Gestión de identidad, servicios, sedes y plantillas dinámicas de documentos.

---
**Nota:** Estos documentos reflejan el estado de diseño y desarrollo del proyecto (Actualizado al 14 de Mayo, 2026). Cualquier cambio arquitectónico, regla de negocio o adición de modelos debe actualizarse directamente en los archivos correspondientes.
