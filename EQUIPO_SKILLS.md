# Equipo Full de Skills — Urbamed MVP Mi-Paciente.com
>
> 33 skills globales + 1 local | Actualizado con Golden Stack ArkiTech

**SkillS GloBales:** Ruta de Skills Globales C:\Users\siste\.agent\skills
---

## Skill Local (Proyecto)

| Skill | Ruta | Rol |
|---|---|---|
| `SKILL.md` | `.aiskills/SKILL.md` | Directriz maestra — stack, reglas (Monolito Modular), contexto de negocio |

---

## Core Stack (7)

| # | Skill | Módulo MVP | Justificación |
|---|---|---|---|
| 1 | `nextjs-app-router-patterns` | Todos | App Router, Server Components, Server Actions, layouts |
| 2 | `typescript-pro` | Todos | TypeScript estricto, tipado avanzado autogenerado |
| 3 | `supabase-expert` | Todos | Data fetching (PostgREST), Realtime subscriptions, RLS compatibility |
| 4 | `nextjs-supabase-auth` | Auth + Vista Integrada | Auth SSR, middleware, protección de rutas por rol |
| 5 | `shadcn` | Todos | Tabs, dialogs, tables, forms, sidebar, data-table |
| 6 | `tailwind-patterns` | Todos | Design tokens, responsive, dark mode |
| 7 | `zod-validation-expert` | CRM, Agenda, Ficha | Validación inputs, estados pipeline, esquemas estrictos para IA Tools |

---

## Integraciones Omnicanales (1)

| # | Skill | Módulo MVP | Justificación |
|---|---|---|---|
| 35 | `whatsapp-api-expert` | Ingesta de Leads | Manejo de Meta Cloud API, validación de webhooks (SHA-256), parsing de payloads complejos y envío de plantillas de reactivación. |

## Base de Datos (3)

| # | Skill | Módulo MVP | Justificación |
|---|---|---|---|
| 8 | `postgresql` | Todos | Schema clínico/comercial, tipos de datos (TSTZRANGE), constraints (GiST) |
| 9 | `postgres-best-practices` | Estadísticas, Agenda | Queries complejas, índices, performance, RPCs |
| 10 | `database-design` | Todos | Separación lógica datos clínicos ≠ comerciales ≠ conversacionales |

---

## IA y Agentes (4)

| # | Skill | Módulo MVP | Justificación |
|---|---|---|---|
| 11 | `gemini-api-dev` | Asistente IA | Uso estricto vía Vercel AI SDK, function calling, streaming |
| 12 | `ai-engineer` | Asistente IA | RAG, agente orquestador, tool-use patterns, Langfuse telemetry |
| 13 | `agent-tool-builder` | Asistente IA | Tools para captura omnicanal, validación de agenda y derivación al CRM |
| 14 | `llm-structured-output` | Asistente IA | Outputs tipados (clasificación, creación de prospectos) |

---

## Seguridad y Compliance — Ley 21.719 (4)

| # | Skill | Módulo MVP | Justificación |
|---|---|---|---|
| 15 | `auth-implementation-patterns` | Usuarios/Permisos | RBAC: ADMIN, MANAGER, ASISTENTE, MEDICO, IA/SISTEMA |
| 16 | `privacy-by-design` | Todos | Consentimiento trazable, minimización datos, Row-Level Security (RLS) |
| 17 | `gdpr-data-handling` | Ley 21.719 | Derechos ARCO, separación responsable/encargado, inmutabilidad de ficha clínica |
| 18 | `backend-security-coder` | Todos | Validación server-side, protección de API Routes y Webhooks |

---

## UI/UX y Frontend (6)

| # | Skill | Módulo MVP | Justificación |
|---|---|---|---|
| 19 | `react-best-practices` | Todos | Performance, Server Components, data fetching asíncrono |
| 20 | `react-patterns` | Vista Integrada, CRM | Composición: encabezado fijo, tabs, 3 columnas, paneles modulares |
| 21 | `antigravity-design-expert` | UI general | Glassmorphism, micro-animaciones, diseño premium |
| 22 | `react-state-management` | CRM, Ficha | Estado derivado optimizado: pipeline, chat, arrastrar y soltar (dnd-kit) |
| 23 | `ui-ux-pro-max` | Todos | 50 estilos, 21 paletas, 50 font pairings, design intelligence |
| 24 | `senior-frontend` | Todos | React/Next.js/TS/Tailwind: componentes, performance, a11y |

---

## Dashboard / Estadísticas (3)

| # | Skill | Módulo MVP | Justificación |
|---|---|---|---|
| 25 | `recharts-expert` | Dashboard | Gráficos ligeros interactivos integrados nativamente con shadcn/ui |
| 26 | `kpi-dashboard-design` | Estadísticas | Diseño dashboards, métricas de atribución (Humano vs IA) |
| 27 | `analytics-tracking` | Estadísticas | Tracking de eventos, telemetría de conversión |

---

## Deploy (1)

| # | Skill | Módulo MVP | Justificación |
|---|---|---|---|
| 28 | `docker-expert` | Deploy | Next.js standalone, multi-stage build, proxy Nginx sin buffering (SSE) |

---

## Testing y QA (2)

| # | Skill | Módulo MVP | Justificación |
|---|---|---|---|
| 29 | `e2e-testing` | Todos | Playwright: flujo CRM→Agenda→Ficha, validación por rol y RLS |
| 30 | `testing-patterns` | Todos | Jest/Vitest: unit tests, mocking Supabase SDK |

---

## Gestión de Proyecto (2)

| # | Skill | Uso | Justificación |
|---|---|---|---|
| 31 | `product-manager` | Planificación | Frameworks PM, priorización, roadmap |
| 32 | `plan-writing` | Cada fase | Planes estructurados con criterios de verificación técnica |

---

## Resumen

| Categoría | Qty | Skills |
|---|---|---|
| Local | 1 | SKILL.md (mi-paciente-architect.md) |
| Core Stack | 7 | nextjs-app-router, ts-pro, supabase-expert, supabase-auth, shadcn, tailwind, zod |
| Base de Datos | 3 | postgresql, postgres-best-practices, database-design |
| IA | 4 | gemini-api-dev, ai-engineer, agent-tool-builder, llm-structured-output |
| Seguridad | 4 | auth-patterns, privacy-by-design, gdpr, backend-security |
| Frontend | 6 | react-best-practices, react-patterns, antigravity-design, state-mgmt, ui-ux-pro-max, senior-frontend |
| Dashboard | 3 | recharts-expert, kpi-dashboard-design, analytics-tracking |
| Deploy | 1 | docker-expert |
| Testing | 2 | e2e-testing, testing-patterns |
| Gestión | 2 | product-manager, plan-writing |
| **TOTAL** | **33** | |

---

## Orden de Activación por Fase

```text
Fase 1 — Scaffolding
  nextjs-app-router-patterns → typescript-pro → shadcn → tailwind-patterns → docker-expert

Fase 2 — Data Layer (Supabase Core)
  supabase-expert → postgresql → database-design → zod-validation-expert

Fase 3 — Auth + Roles + Seguridad
  nextjs-supabase-auth → auth-implementation-patterns → privacy-by-design

Fase 4 — CRM + Vista Integrada (Frontend Modules)
  react-patterns → react-state-management → react-best-practices → ui-ux-pro-max → senior-frontend

Fase 5 — Agenda + Ficha Clínica (PDFs & Server Actions)
  backend-security-coder → gdpr-data-handling → antigravity-design-expert

Fase 6 — Asistente IA (Orquestación & Tools)
  gemini-api-dev → ai-engineer → agent-tool-builder → llm-structured-output

Fase 7 — Dashboard
  kpi-dashboard-design → recharts-expert → analytics-tracking

Fase 8 — Testing + Deploy
  e2e-testing → testing-patterns → docker-expert
