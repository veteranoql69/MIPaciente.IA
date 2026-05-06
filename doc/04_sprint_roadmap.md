# Roadmap y Estado de Sprints

El MVP de **Mi-Paciente.com** sigue un esquema estricto e inamovible de ejecución dividido en 12 Sprints de 15 días (Deadline total de 180 Días) sobre la rama `master`.

## Estado General

| Sprint | Período (Días) | Módulo / Core | Infra DB | Front / Server | Status |
|--------|----------------|---------------|----------|----------------|--------|
| **S1** | Días 1-15 | **Infraestructura Base** | ✅ Listo | ✅ Listo | **COMPLETADO** |
| **S2** | Días 16-30 | **Multi-Tenant + Auth + Onboarding** | ✅ Listo | ✅ Listo | **COMPLETADO** |
| **S3** | Días 31-45 | **Agenda (1ra Parte): Disposiciones y DB** | ✅ Listo | ⏳ Pend. | **EN CURSO** |
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

### Últimos Logros (Sprint 1 y Sprint 2 - COMPLETADOS)
Se ha consolidado el sistema **Multi-Tenant** y el flujo de **Onboarding**. Se resolvió de manera exitosa la recursión infinita en las políticas RLS de `mpaci_usuarios`, permitiendo un acceso fluido y seguro a los dashboards dinámicos según el `empresa_slug`. 

La infraestructura de Autenticación ahora cuenta con:
- Login nativo y soporte para OAuth.
- Integración nativa con **Google Calendar API** (tokens off-line en columnas de `mpaci_usuarios`).
- Sistema robusto de Invitaciones vía e-mail (usando Resend).
- Sistema de Control de Acceso (ABAC) con el módulo `permissions`.

### Foco Inmediato: Sprint 3 (EN CURSO)
* **Objetivo principal:** Módulo Agenda Parte 1.
* **Componentes clave:** Implementar la vista diaria de citas (`AgendaHoyClient`), gestión de bloques horarios y validación de disponibilidad.
* **Base de datos:** Formalizar contratos de precios y coberturas médicas.

### Migraciones Próximas por Sprint
A medida que el Roadmap progrese se inyectarán modificaciones al Postgres:
- **Sprint 3 (`00018_precio_contrato.sql`):** Formalizará contratos y precios.
- **Sprint 5 (`00016_citas_prospecto_link.sql` y `00017...`):** Link directo hacia `mpaci_prospectos` y deprecación analítica de la llave obsoleta (`canal_origen`).
- **Sprint 7 (`00020_mensajes_entrantes.sql`):** Inicia la tabla pivot para acaparar Webhooks (p.ej WhatsApp Business).

---
*Para verificar checklist detallados o pruebas automáticas E2E destinadas al Sprint 12, referirse a `plan.md` en el root del proyecto.*
