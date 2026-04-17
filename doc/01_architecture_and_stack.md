# Arquitectura y Stack Tecnológico

El proyecto de **Mi-Paciente.com** sigue una arquitectura robusta de Modular Monolith basada en principios de Domain-Driven Design (DDD).

## Stack "Golden Stack" (Estricto)
El stack definido para el MVP no se debe modificar e incluye las siguientes tecnologías clave:

- **Core Framework:** Next.js 16.2.3 (App Router, Server Actions) con React 19.2.4.
- **UI & Styling:** Tailwind CSS, `shadcn/ui` (para componentes granulares), `@dnd-kit/core` (para drag & drop, e.g., en la vista de Agenda Semanal).
- **Backend & Database:** Supabase Self-Hosted (PostgreSQL, Auth, Storage, Realtime habilitado).
- **AI Orchestration:** Vercel AI SDK (`ai`, `@ai-sdk/google` usando Gemini).
- **AI Observability:** Langfuse (Self-hosted).
- **PDF Generation:** Stirling PDF (Self-hosted REST API). No usar herramientas de frontend puro como react-pdf o Puppeteer.
- **Validation:** `zod` para todo (API routes, Server Actions, y schemas de AI Tools).

## Patrón Arquitectónico: Modular Monolith
El enrutamiento público recae únicamente sobre `src/app`. Toda la lógica de negocio vive agrupada dentro de `src/modules/` y se rige por fronteras estrictas de contexto (Domain-Driven Design).

**Módulos del Sistema y Fronteras:**
1. **`crm`:** Gestiona humanamente los `mpaci_prospectos` y estados en un Kanban Pipeline (Nuevo, Seguimiento, Interesado, etc.).
2. **`agenda`:** Gestiona citas (`mpaci_citas`), servicios/precios y constraints de base de datos nativos usando `EXCLUDE USING gist` para evitar doble reserva. Es la "Única Fuente de Verdad" para precios de clínicas.
3. **`ficha-clinica`:** Maneja las `mpaci_fichas_clinicas` de forma inmutable tras pasar 24h, anotaciones clínicas apendizables, y conexión a Stirling PDF.
4. **`ai-agent`:** Interactúa primariamente a través de `mpaci_contactos` o la ingesta omnicanal (por ejemplo WhatsApp). Define herramientas seguras (AI Tools), prompts base, AI Elements (Components) para interfaces chat, e implementa telemetría envolviendo las respuestas genéricas IA con `observeNext` de Langfuse.
5. **`estadisticas`:** Consultas agregadas vía Server Actions para tableros de conversión e ingresos cruzados por la tabla maestro multi-tenant.

## Rutas y Middleware (Enrutamiento por Slug)
El enrutamiento de la aplicación adopta la estrategia Path-Based Routing `[empresa_slug]` dentro del App Router para el multi-tenancy.
1. `/login` o configuraciones como `/auth/*` son públicas.
2. Si un usuario no posee empresa, ni ha completado su `onboarding_completado`, el middleware de Next.js redirige forzosamente hacia `/onboarding` (Wizard de 3 pasos).
3. Una vez se comprueban credenciales y empresa vinculada, recae sobre las sub-aplicaciones internas (p. ej. `[slug]/agenda/hoy` si es médico, o `[slug]/dashboard` si es asistente).
4. El Middleware nunca asume confianzas del `[empresa_slug]` en la URL; debe cruzar explícitamente el `empresa_id` en contexto contra la DB en cada petición para prevenir Cross-Tenant Data Leaking.
