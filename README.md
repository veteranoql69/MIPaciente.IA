# Mi-Paciente.com (Urbamed) - AI-Native CRM & Agenda

Bienvenido al repositorio central de **Mi-Paciente.com**, un sistema AI-Native diseñado para la gestión clínica integral (CRM, Agenda y Ficha Clínica).

## 🚀 Estado del Proyecto
Actualmente hemos completado la **Infraestructura Base** y el **Sistema Multi-Tenant con Onboarding**.

- **Sprint 1 (Completado):** Base de datos, Auth, Perfiles y Agenda core.
- **Sprint 2 (Completado):** Aislamiento Multi-Tenant (RLS), Onboarding de Clínicas, Invitaciones de Equipo (Resend).
- **Sprint 3 (En Curso):** Módulo de Agenda Avanzada y Gestión de Disponibilidad.

## 📚 Documentación Técnica (Wiki)
Para entender la arquitectura y las reglas de negocio, consulta los siguientes documentos:

1. [Esquema de Base de Datos](doc/02_database_schema.md) - Estructura de tablas y relaciones.
2. [Arquitectura de Seguridad (RLS)](doc/05_arquitectura_seguridad.md) - Cómo aislamos los datos y evitamos recursión.
3. [Módulo de Onboarding e Invitaciones](doc/06_onboarding_invitaciones.md) - Flujo de registro de nuevas clínicas.
4. [Roadmap de Sprints](doc/04_sprint_roadmap.md) - Seguimiento detallado del progreso.

## 🛠️ Stack Tecnológico
- **Frontend:** Next.js 15 (App Router), Tailwind CSS, shadcn/ui.
- **Backend:** Supabase (PostgreSQL + Auth + Storage).
- **Email:** Resend.
- **AI:** Vercel AI SDK + Gemini.

## 💻 Desarrollo Local

```bash
# Instalar dependencias
npm install

# Levantar servidor de desarrollo
npm run dev
```

El proyecto utiliza un sistema de **Proxy de Rutas** (`src/proxy.ts`) para manejar el aislamiento por `empresa_slug`.

## 🛡️ Seguridad
Todas las tablas deben seguir la convención de nomenclatura `mpaci_` y tener habilitado **RLS**. Consulta [Arquitectura de Seguridad](doc/05_arquitectura_seguridad.md) antes de crear nuevas políticas.
