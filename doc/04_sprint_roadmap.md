# Roadmap y Estado de Sprints

El MVP de **Mi-Paciente.com** sigue un esquema estricto e inamovible de ejecución dividido en 12 Sprints de 15 días (Deadline total de 180 Días) sobre la rama `master`.

## Estado General

| Sprint | Período (Días) | Módulo / Core | Infra DB | Front / Server | Status |
|--------|----------------|---------------|----------|----------------|--------|
| **S1** | Días 1-15 | **Infraestructura Base** | ✅ Listo | ✅ Listo | **COMPLETADO** |
| **S2** | Días 16-30 | **Multi-Tenant + Auth + Onboarding** | ✅ Listo | ✅ Listo | **COMPLETADO** |
| **S3** | Días 31-45 | **Agenda (1ra Parte): Disposiciones y DB** | ⏳ Pend. | ⏳ Pend. | Planificación / Pendiente |
| **S4** | Días 46-60 | **Agenda (2da Parte): Semanal y Vistas** | — | ⏳ Pend. | Pendiente |
| **S5** | Días 61-75 | **Kanban y CRM** | ⏳ Pend. | ⏳ Pend. | Pendiente |
| **S6** | Días 76-90 | **Ficha Clínica y Firma PDFs** | — | ⏳ Pend. | Pendiente |
| **S7** | Días 91-105 | **Ingesta de Lead (Omnicanal)** | ⏳ Pend. | ⏳ Pend. | Pendiente |
| **S8** | Días 106-120 | **AI Chat - Agente Part 1** | — | ⏳ Pend. | Pendiente |
| **S9** | Días 121-135 | **AI Tools - Agente Part 2** | — | ⏳ Pend. | Pendiente |
| **S10** | Días 136-150 | **Langfuse & Trazabilidad** | — | ⏳ Pend. | Pendiente |
| **S11** | Días 151-165 | **Estadísticas Dashboards** | — | ⏳ Pend. | Pendiente |
| **S12** | Días 166-180 | **Testing E2E + V-Release** | — | ⏳ Pend. | Pendiente |

## Desglose y Focos Actuales

### Últimos Logros (Sprint 1 y Sprint 2)
Se ha completado la creación de las tablas primigenias, perfiles de base para la agenda, sistema CRM subyacente y autenticación OAuth. Adicionalmente, el frontend para el **Multi-Tenancy** ya fue consumado; con un `middleware.ts` maduro que redirige Onboarding y blinda las rutas de `[empresa_slug]`, además de contar con todas las rutas estructuradas en el App Router.

### Foco Inmediato: Sprint 3
* **Objetivo principal:** Módulo Agenda Parte 1.
* **Base de datos:** Implementar `00018_precio_contrato.sql` para forzar contratos de `precio_base`.
* **Server Actions:** Crear las primeras integraciones para buscar disponibilidad y precios por coberturas.

### Migraciones Próximas por Sprint
A medida que el Roadmap progrese se inyectarán modificaciones al Postgres:
- **Sprint 3 (`00018_precio_contrato.sql`):** Formalizará contratos y precios.
- **Sprint 5 (`00016_citas_prospecto_link.sql` y `00017...`):** Link directo hacia `mpaci_prospectos` y deprecación analítica de la llave obsoleta (`canal_origen`).
- **Sprint 7 (`00020_mensajes_entrantes.sql`):** Inicia la tabla pivot para acaparar Webhooks (p.ej WhatsApp Business).

---
*Para verificar checklist detallados o pruebas automáticas E2E destinadas al Sprint 12, referirse a `plan.md` en el root del proyecto.*
