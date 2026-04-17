<!-- /autoplan restore point: /c/Users/siste/.gstack/projects/urbamed/master-autoplan-restore-20260416-130244.md -->
# Plan Maestro MVP — Mi-Paciente.com

**Fecha:** 16 Abril 2026
**Deadline:** 6 meses inamovibles (180 días). Early adopters en producción al finalizar.
**Branch:** master
**Stack:** Next.js 16.2.3 App Router (React 19.2.4) · Supabase Self-Hosted · Tailwind + shadcn/ui · Vercel AI SDK (Gemini) · Langfuse · Stirling PDF · Docker

---

## Estado General

| Sprint | Período | Nombre | DB | Frontend | Estado |
|--------|---------|--------|----|---------|----|
| S1 | Días 1-15 | Infraestructura Base | ✅ | ✅ | **COMPLETADO** |
| S2 | Días 16-30 | Multi-Tenant + Auth + Onboarding | ✅ | ⏳ | **DB lista, frontend pendiente** |
| S3 | Días 31-45 | Módulo Agenda Parte 1 | ⏳ | ⏳ | Pendiente |
| S4 | Días 46-60 | Módulo Agenda Parte 2 + Vista Integrada | — | ⏳ | Pendiente |
| S5 | Días 61-75 | CRM Base | ⏳ | ⏳ | Pendiente |
| S6 | Días 76-90 | Ficha Clínica + PDFs | — | ⏳ | Pendiente |
| S7 | Días 91-105 | Ingesta Omnicanal (WhatsApp) | ⏳ | ⏳ | Pendiente |
| S8 | Días 106-120 | Agente IA Parte 1 | — | ⏳ | Pendiente |
| S9 | Días 121-135 | Agente IA Parte 2 (Tools) | — | ⏳ | Pendiente |
| S10 | Días 136-150 | Observabilidad (Langfuse) | — | ⏳ | Pendiente |
| S11 | Días 151-165 | Dashboard de Estadísticas | — | ⏳ | Pendiente |
| S12 | Días 166-180 | QA E2E + Producción | — | ⏳ | Pendiente |

---

## Sprint 1 — Infraestructura Base ✅ COMPLETADO

**Migraciones aplicadas:** 00001–00006 + seed base

| Entregable | Archivo | Estado |
|-----------|---------|--------|
| Tablas base | `00001_cimientos_base.sql` | ✅ |
| Ficha clínica + anotaciones | `00002_ficha_clinica.sql` | ✅ |
| Agenda (GiST constraint) | `00003_bloques_agenda.sql` | ✅ |
| Actividades + Bitácora CRM | `00004_actividades_bitacora.sql` | ✅ |
| Trigger nuevo usuario | `00005_trigger_nuevo_usuario.sql` | ✅ |
| Avatar + última sesión | `00006_usuario_avatar.sql` | ✅ |
| Google Auth + callback | `src/app/auth/callback/route.ts` | ✅ |
| shadcn components | sidebar, tabs, card, dialog, table, input, badge, avatar, sheet, skeleton, tooltip | ✅ |
| Supabase client/server helpers | `src/lib/supabase/` | ✅ |

**Tablas creadas:** `mpaci_usuarios`, `mpaci_contactos`, `mpaci_servicios`, `mpaci_prospectos`, `mpaci_citas`, `mpaci_fichas_clinicas`, `mpaci_anotaciones_clinicas`, `mpaci_bloques_horarios`, `mpaci_actividades`, `mpaci_bitacora`

---

## Sprint 2 — Multi-Tenant + Auth + Onboarding

**DB: ✅ COMPLETA** (migraciones 00007-00015 + 00019 aplicadas)
**Frontend: ⏳ PENDIENTE**

### DB Aplicada

| Migración | Descripción |
|-----------|-------------|
| `00007_empresas` | `mpaci_empresas` (slug UNIQUE LOWERCASE, nombre, plan_suscripcion) |
| `00008_sucursales` | `mpaci_sucursales` (empresa_id FK, nombre, direccion) |
| `00009_multi_tenant_fks` | empresa_id + sucursal_id + canal_contacto + canal_referencia + onboarding_completado |
| `00010_empresa_helper` | `get_my_empresa_id()` SECURITY DEFINER |
| `00011_multi_tenant_rls` | 9 políticas RLS multi-tenant reescritas |
| `00012_trigger_fix` | NULL email guard + onboarding_completado en handle_new_user() |
| `00013_servicios_precios` | `mpaci_servicios_precios` (adelantado del Sprint 3) |
| `00014_tablas_sprint1_multitenant` | empresa_id en actividades/bitacora/anotaciones + RLS multi-tenant |
| `00015_empresas_onboarding_policy` | Política RLS para que wizard liste empresas durante onboarding |
| `00019_slug_lowercase` | Backfill slug a lowercase + CHECK constraint + formato `^[a-z0-9][a-z0-9\-]*` |
| `seed.sql` | Empresa 'urbamed' + Sucursal Principal + 3 servicios base |

### Frontend Pendiente

```
src/
├── proxy.ts                               ← PRIMERO: valida slug + gate onboarding (Next.js 16 proxy convention)
├── app/
│   ├── unauthorized/page.tsx             ← slug no coincide con empresa del usuario
│   ├── onboarding/page.tsx               ← wizard 3 pasos
│   └── [empresa_slug]/
│       ├── layout.tsx                    ← EmpresaProvider (carga contexto empresa)
│       ├── agenda/hoy/page.tsx           ← redirect médico (placeholder Sprint 3)
│       ├── dashboard/page.tsx            ← redirect asistente (placeholder Sprint 5)
│       └── estadisticas/page.tsx        ← redirect admin (placeholder Sprint 11)
```

### Lógica Middleware

```typescript
// Flujo src/proxy.ts (Next.js 16 proxy convention):
// 1. Ruta pública (/login, /auth/*, /unauthorized) → pasar
// 2. No autenticado → redirigir a /login
// 3. onboarding_completado = false → redirigir a /onboarding
// 4. Ruta con [empresa_slug]:
//    a. Resolver slug → empresa_id desde DB (nunca confiar en URL)
//    b. Comparar con empresa_id del usuario
//    c. Mismatch → redirigir a /unauthorized
// 5. Pasar
```

### Wizard Onboarding — Estado Matrix

| Estado | empresa_id | rol | completado | Resultado |
|--------|-----------|-----|-----------|-----------|
| Nuevo usuario | null | asistente (default) | false | → wizard paso 1 |
| Paso 1 done | set | asistente (default) | false | → wizard paso 2 |
| Paso 2 done | set | set | false | → wizard paso 3 |
| Completo | set | set | true | → dashboard por rol |
| Cuenta incompleta | null | any | true | → error "contactar soporte" |

**Paso 1:** Lista de empresas activas (policy "Onboarding lista empresas activas" — usa auth.uid() IS NOT NULL + get_my_empresa_id() IS NULL)
**Paso 2:** Médico / Asistente (Admin es configurado manualmente por equipo Mi-Paciente)
**Paso 3:** Confirmación → guarda empresa_id + rol + onboarding_completado = true → redirect por rol

### Redirección por Rol

| Rol | Destino |
|-----|---------|
| medico | `/[slug]/agenda/hoy` |
| asistente | `/[slug]/dashboard` |
| admin | `/[slug]/estadisticas` |

---

## Sprint 3 — Módulo Agenda Parte 1

**Días 31-45 · DB: ⏳ · Frontend: ⏳**


### Frontend Pendiente

```
src/modules/agenda/
├── actions/
│   ├── crear-bloque.ts         ← Server Action: crea bloque horario médico
│   ├── reservar-cita.ts        ← Server Action: crea cita (verifica disponibilidad)
│   └── get-precio-servicio.ts  ← busca precio por (servicio_id, cobertura); fallback precio_base
├── components/
│   ├── CalendarioMedico.tsx    ← vista semanal/diaria del médico
│   ├── SelectorCobertura.tsx   ← dropdown coberturas de mpaci_servicios_precios
│   └── FormCita.tsx            ← servicio + cobertura + precio auto-relleno + descuento
└── types.ts

src/app/[empresa_slug]/
└── agenda/
    ├── hoy/page.tsx            ← Dashboard médico: citas del día
    └── nueva/page.tsx          ← Agendar nueva cita
```

### Regla de Precio al Agendar

```
1. Asistente selecciona: Servicio + Cobertura del paciente
2. Server Action busca en mpaci_servicios_precios WHERE servicio_id = X AND empresa_id = Y AND cobertura = Z
3. Si encuentra → precio = mpaci_servicios_precios.precio
4. Si no encuentra → precio = mpaci_servicios.precio_base
5. precio_base en mpaci_citas se auto-rellena (editable con descuento)
```

### Coberturas Configuradas en Seed (Urbamed)

| Servicio | Cobertura | Precio |
|---------|-----------|--------|
| Vasectomía | isapre_particular | $1.490.000 |
| Vasectomía | pad_2026 | $853.610 |
| Vasectomía | ejercito | $719.000 |
| Circuncisión | isapre_particular | $1.490.000 |
| Circuncisión | fonasa | $790.000 |

*(Insertar en mpaci_servicios_precios durante Sprint 3)*

---

## Sprint 4 — Módulo Agenda Parte 2 + Vista Integrada

**Días 46-60 · DB: — · Frontend: ⏳**

```
src/modules/agenda/components/
├── AgendaSemanalView.tsx       ← Vista visual de la semana (grid horario)
├── BloqueHorario.tsx           ← Componente bloque arrastrable (@dnd-kit/core)
└── VistaPaciente.tsx           ← 3 columnas: Contacto | Citas | Ficha Clínica

src/app/[empresa_slug]/
└── agenda/
    ├── semana/page.tsx
    └── paciente/[contacto_id]/page.tsx
```

**Nota:** @dnd-kit/core ya está en el stack (SKILL.md). No instalar alternativas.

---

## Sprint 5 — CRM Base

**Días 61-75 · DB: ⏳ · Frontend: ⏳**

### DB Pendiente

| Migración | Descripción |
|-----------|-------------|
| `00016_citas_prospecto_link.sql` | Agrega prospecto_id nullable a mpaci_citas + índice |
| `00017_canal_origen_deprecate.sql` | Backfill canal_origen → canal_contacto + deprecation comment |

### Frontend Pendiente

```
src/modules/crm/
├── actions/
│   ├── crear-prospecto.ts      ← Server Action: crea prospecto desde contacto
│   ├── cambiar-estado.ts       ← Server Action: actualiza estado + escribe bitácora
│   └── asignar-actividad.ts    ← Server Action: crea actividad CRM
├── components/
│   ├── KanbanPipeline.tsx      ← columnas: Nuevo | Seguimiento | Interesado | Agendado | Ganado | Perdido
│   ├── ProspectoCard.tsx       ← card del prospecto con canal_origen/referencia visible
│   ├── BitacoraTimeline.tsx    ← historial inmutable de cambios de estado
│   └── ActividadItem.tsx       ← tarea con fecha vencimiento + toggle completada
└── types.ts

src/app/[empresa_slug]/
├── dashboard/page.tsx          ← CRM pipeline asistente (reemplaza placeholder S2)
└── crm/
    └── [prospecto_id]/page.tsx ← detalle prospecto: info + bitácora + actividades + citas
```

**Módulo:** `src/modules/crm` → maneja `mpaci_prospectos`, `mpaci_actividades`, `mpaci_bitacora`

---

## Sprint 6 — Ficha Clínica + PDFs

**Días 76-90 · DB: — · Frontend: ⏳**

```
src/modules/ficha-clinica/
├── actions/
│   ├── crear-ficha.ts          ← Server Action: crea ficha (solo médico, solo 1 por cita)
│   ├── editar-ficha.ts         ← Server Action: edita solo si < 24h desde creado_en
│   ├── agregar-anotacion.ts    ← Server Action: anotación inmutable post-24h
│   └── generar-pdf.ts          ← Server Action: payload → Stirling PDF API → Supabase Storage
├── components/
│   ├── FichaClinica.tsx        ← editor de notas clínicas con lock visual a las 24h
│   ├── AnotacionItem.tsx       ← anotación inmutable (append-only)
│   └── PDFPreview.tsx          ← preview del PDF generado
└── types.ts

src/app/[empresa_slug]/
└── ficha/[cita_id]/page.tsx
```

**Regla 24h:** La RLS en `mpaci_fichas_clinicas` ya implementa el lock:
```sql
-- 00002: EXTRACT(EPOCH FROM (now() - creado_en)) <= 86400
```
El frontend muestra el formulario editable o un banner "Ficha bloqueada — solo anotaciones" según `now() - creado_en`.

**PDF:** Stirling PDF (Self-Hosted REST API). NO usar Puppeteer ni react-pdf. Flujo:
```
Server Action → formatea datos → POST Stirling PDF API → recibe buffer → PUT Supabase Storage → devuelve URL
```

---

## Sprint 7 — Ingesta Omnicanal (WhatsApp)

**Días 91-105 · DB: ⏳ · Frontend: ⏳**

### DB Pendiente

(Migración `00020_mensajes_entrantes.sql` creada para manejar mensajes entrantes antes de convertirse en contactos)

### Frontend + Backend Pendiente

```
src/app/api/webhooks/
└── whatsapp/route.ts           ← POST webhook WhatsApp Cloud API (firma HMAC verificada)

src/modules/ai-agent/
├── ingesta/
│   ├── whatsapp-handler.ts     ← parsea webhook → crea mpaci_mensajes_entrantes
│   └── contacto-resolver.ts    ← busca contacto por número WA; crea si no existe
└── types.ts
```

**Reglas de atribución automática:**
- Webhook WA recibido → `canal_contacto = 'whatsapp'` (auto)
- `canal_referencia` = pregunta manual (la IA pregunta "¿cómo supo de nosotros?" en primer contacto)

---

## Sprint 8 — Agente IA Parte 1 (Conversación)

**Días 106-120 · DB: — · Frontend: ⏳**

**AI Elements:** Instalar `Conversation`, `Message`, `PromptInput`, `Suggestion`

```
src/modules/ai-agent/
├── actions/
│   └── chat-stream.ts          ← Server Action: Vercel AI SDK streamText con Gemini
├── prompts/
│   └── system-prompt.ts        ← prompt base del agente
├── components/
│   ├── ChatWindow.tsx           ← AI Elements: Conversation + Message
│   ├── InputBar.tsx             ← AI Elements: PromptInput + Suggestion
│   └── ContactoIA.tsx           ← vista completa del contacto con chat embebido
└── langfuse.ts                  ← wrapper observeNext (TODOS los calls IA pasan por aquí)

src/app/[empresa_slug]/
└── contacto/[contacto_id]/page.tsx ← Vista integrada IA
```

**Langfuse:** Obligatorio en todos los AI calls:
```typescript
// Patrón obligatorio — sin excepción
const result = await observeNext(async () => streamText({ model, messages, tools }), {
  name: 'agent-conversation', sessionId: contacto_id
});
```

---

## Sprint 9 — Agente IA Parte 2 (Tools)

**Días 121-135 · DB: — · Frontend: ⏳**

**AI Elements:** Instalar `Tool`, `Confirmation`

```
src/modules/ai-agent/tools/
├── consultar-agenda.ts         ← Zod schema + consulta bloques disponibles por médico/sucursal
├── reservar-cita.ts            ← Zod schema + crea cita (confirma precio por cobertura)
├── crear-prospecto.ts          ← Zod schema + deriva contacto al CRM humano
└── index.ts                    ← exporta todas las tools para el agente
```

**Regla de seguridad:** Cada tool tiene Zod schema estricto. Patrón "IA propone, humano aprueba":
```
IA genera ToolCall → UI muestra Confirmation component → humano aprueba → Server Action ejecuta
```

---

## Sprint 10 — Observabilidad y Auditoría (Langfuse)

**Días 136-150 · DB: — · Frontend: ⏳**

**AI Elements:** Instalar `Reasoning`, `Chain of Thought`

```
src/app/[empresa_slug]/
└── admin/
    └── ia-observabilidad/page.tsx ← dashboard de trazas Langfuse + costos IA

src/modules/ai-agent/
└── observabilidad/
    ├── traces-dashboard.tsx     ← AI Elements: Reasoning + Chain of Thought
    └── costos-ia.tsx            ← métricas de costo por contacto/sesión
```

---

## Sprint 11 — Dashboard de Estadísticas

**Días 151-165 · DB: — · Frontend: ⏳**

```
src/app/[empresa_slug]/
└── estadisticas/page.tsx       ← reemplaza placeholder S2

src/modules/estadisticas/
├── components/
│   ├── EmbудоConversion.tsx    ← Recharts: contacto→prospecto→cita→ganado
│   ├── AtribucionCanales.tsx   ← Recharts: ingresos agendados por canal_referencia
│   ├── IngresosAgendados.tsx   ← citas sin pagar × precio esperado
│   └── TasaReconversion.tsx    ← % pacientes que vuelven por canal RRSS
└── queries/
    └── estadisticas.ts         ← Server Actions para métricas (usa empresa_id implícito via RLS)
```

**Queries clave:**
```sql
-- Atribución: ingresos esperados por canal que trajo al paciente
SELECT c.canal_referencia, SUM(ci.precio_base - ci.descuento) as ingreso_esperado
FROM mpaci_contactos c
JOIN mpaci_citas ci ON ci.contacto_id = c.id
WHERE ci.empresa_id = get_my_empresa_id()
  AND ci.estado_operativo != 'Cancelada'
GROUP BY c.canal_referencia;
```

---

## Sprint 12 — QA E2E + Producción

**Días 166-180 · DB: — · Frontend: ⏳**

### Tests E2E Obligatorios

| Test | Flujo | Herramienta |
|------|-------|-------------|
| T1 | Cross-tenant RLS: usuario A no ve datos de empresa B | Supabase SQL + Jest |
| T2 | Onboarding incompleto bloquea acceso a `/[slug]/` | Playwright |
| T3 | Slug mismatch → 401 unauthorized | Playwright |
| T4 | Trigger NULL email no rompe registro | Supabase SQL |
| T5 | Precio por cobertura → fallback precio_base | Jest |
| T6 | Ficha clínica lock a las 24h | Jest + clock mock |
| T7 | WhatsApp webhook → contacto creado con canal_contacto = 'whatsapp' | Jest |
| T8 | Tool IA propone cita → Confirmation → cita creada en DB | Playwright |

### Deploy Checklist

- [ ] Variables de entorno en producción (Supabase URL, Anon Key, Gemini API Key, Langfuse Key, Stirling PDF URL, WA Cloud API token)
- [ ] DNS configurado para mipaciente.io
- [ ] Staging con datos reales de Urbamed validado por cliente
- [ ] Rollback plan: down.sql disponibles para cada migración

---

## Modelo de Datos — Estado Final

```
auth.users (Supabase GoTrue)
    └── mpaci_usuarios (empresa_id[nullable], rol, onboarding_completado, avatar_url, ultima_sesion)

mpaci_empresas (slug LOWERCASE, nombre, plan_suscripcion[nullable], activo)
    ├── mpaci_sucursales (empresa_id, nombre, direccion, activo)
    ├── mpaci_servicios (empresa_id, nombre, duracion_minutos, precio_base[FALLBACK NOT NULL], activo)
    │       └── mpaci_servicios_precios (servicio_id, empresa_id, cobertura TEXT, precio) [UNIQUE per cobertura]
    ├── mpaci_contactos (empresa_id, canal_contacto, canal_referencia, canal_origen[DEPRECATED S5])
    │       └── mpaci_prospectos (empresa_id, contacto_id, responsable_id, estado, servicio_id)
    │               ├── mpaci_actividades (empresa_id, prospecto_id, tipo, fecha_vencimiento, completada)
    │               └── mpaci_bitacora (empresa_id, prospecto_id, accion, estado_anterior, estado_nuevo) [INMUTABLE]
    ├── mpaci_citas (empresa_id, sucursal_id, contacto_id, prospecto_id[nullable S5], servicio_id, medico_id, precio_base, descuento)
    │       └── mpaci_fichas_clinicas (empresa_id, cita_id UNIQUE, contenido_texto) [LOCK 24h]
    │               └── mpaci_anotaciones_clinicas (empresa_id, ficha_id, medico_id, contenido) [INMUTABLE]
    ├── mpaci_bloques_horarios (empresa_id, sucursal_id, medico_id, rango_tiempo TSTZRANGE) [GIST EXCLUDE]
    └── mpaci_mensajes_entrantes (empresa_id, canal, remitente, contenido, contacto_id) [S7]
```

### Reglas de Negocio Críticas

| Regla | Mecanismo |
|-------|-----------|
| Aislamiento multi-tenant | `empresa_id = get_my_empresa_id()` en todas las políticas RLS |
| NULL guard | `AND empresa_id IS NOT NULL` en todas las políticas RLS |
| No solapamiento médico | `EXCLUDE USING gist (medico_id WITH =, rango_tiempo WITH &&)` |
| Ficha inmutable >24h | RLS UPDATE: `EXTRACT(EPOCH FROM (now() - creado_en)) <= 86400` |
| Bitácora/Anotaciones inmutables | `FOR UPDATE USING (false)` y `FOR DELETE USING (false)` |
| Precio: cobertura > fallback | Lógica en Server Action (busca primero servicios_precios, fallback a precio_base) |
| Onboarding gate | Middleware verifica `onboarding_completado = true` antes de `[empresa_slug]` |
| Slug siempre lowercase | CHECK constraint `slug = lower(slug)` + formato `^[a-z0-9][a-z0-9\-]*` |
| PDF: solo Stirling | No Puppeteer, no react-pdf — REST API Stirling → buffer → Supabase Storage |
| IA sin observeNext = bloqueado | Todos los AI calls deben pasar por Langfuse `observeNext` |

---

## AI Elements — Plan de Integración

| Sprint | Acción | Componentes |
|--------|--------|-------------|
| S2 | Registrar registry en `components.json` | *(no instalar aún)* |
| S8 | Instalar | `Conversation`, `Message`, `PromptInput`, `Suggestion` |
| S9 | Instalar | `Tool`, `Confirmation` |
| S10 | Instalar | `Reasoning`, `Chain of Thought` |

Fuente: https://elements.ai-sdk.dev — construido sobre shadcn/ui.

---

## Migraciones Pendientes por Sprint

| Sprint | Migración | Gap | Estado |
|--------|-----------|-----|--------|
| S3 | `00018_precio_contrato.sql` | Documenta contrato precio_base | ✅ Archivo |
| S5 | `00016_citas_prospecto_link.sql` | FK prospecto_id en mpaci_citas | ✅ Archivo |
| S5 | `00017_canal_origen_deprecate.sql` | Backfill + deprecation canal_origen | ✅ Archivo |
| S7 | `00020_mensajes_entrantes.sql` | Tabla mpaci_mensajes_entrantes | ✅ Archivo |

---

## Scope FUERA del MVP

1. Subdomain-based routing (`manmec.mipaciente.io`) — wildcard DNS, post-MVP
2. Onboarding Admin/Dueño self-service (logo, info clínica)
3. Landing page pública dinámica por clínica
4. `mpaci_canales_configuracion` — CRUD canales desde UI Admin
5. Multi-empresa por usuario (médico en 2 empresas distintas)
6. Integración RRSS tiempo real (Instagram API, Google Analytics)
7. Automated ARCO rights (Ley 21.719) — arquitectura ready
8. Eliminar `canal_origen` definitivamente — Sprint 5+
9. Subdomain routing (`clinica.mipaciente.io`)

---

## Preguntas Abiertas

1. **Previsión del paciente:** ¿Cuándo se captura la cobertura médica? (primer contacto IA / CRM / solo al agendar). Impacta flujo de `mpaci_servicios_precios`.
2. **canal_referencia en IA:** ¿La IA pregunta "¿cómo supo de nosotros?" automáticamente en primer mensaje WhatsApp (Sprint 7), o siempre manual?
3. **Slug Urbamed:** ¿El slug de producción es `urbamed` o `manmec`?
4. **Staging día 1:** ¿La primera clínica (Urbamed) usa datos reales desde staging?

---

## Decision Audit Trail

| # | Sprint | Decisión | Tipo | Principio | Rationale |
|---|--------|---------|------|-----------|-----------|
| 1 | S2 | Path-based routing `/[empresa_slug]` | Mecánica | P5 | No DNS/SSL extra para MVP |
| 2 | S2 | Services scoped per-company | Taste | P3 | MVP tiene 1 clínica; catálogo global es prematura optimización |
| 3 | S2 | TEXT para canal_contacto/canal_referencia | Mecánica | P1 | ENUM requiere migración para nuevos valores |
| 4 | S2 | canal_referencia UI → Sprint 7 (IA) | Mecánica | P2 | DB schema en S2, UI en Sprint 7 cuando llegue IA |
| 5 | S2 | plan_suscripcion nullable en mpaci_empresas | Taste | P1 | Billing futuro; nullable = zero risk ahora |
| 6 | S2 | Onboarding: clínica primero, luego rol | Mecánica | P5 | Clínica valida rol; reduce riesgo de mentir el rol |
| 7 | S2 | empresa_id nullable en mpaci_usuarios | Mecánica | P5 | NOT NULL rompe handle_new_user() trigger |
| 8 | S2 | get_my_empresa_id() SECURITY DEFINER | Mecánica | P5 | Single indexed lookup vs subquery en cada política |
| 9 | S2 | Middleware nunca confía en slug | Mecánica | P1 | User A puede probar /companyB/agenda |
| 10 | S2 | down.sql para cada migración | Mecánica | P1 | Sin rollback = data loss risk |
| 11 | S2 | Sucursales en Sprint 2 | Taste | P2 | sucursal_id en mpaci_citas; ahora evita migración disruptiva S3 |
| 12 | S3 | precio_base = fallback, no deprecated | Mecánica | P5 | Precio cuando no existe cobertura específica |
| 13 | S3 | Coberturas en TEXT, no ENUM | Mecánica | P1 | Nuevas isapres/convenios sin migración |
| 14 | S5 | prospecto_id nullable en mpaci_citas | Mecánica | P5 | No toda cita nace de un prospecto CRM |
| 15 | S5 | canal_origen deprecated con backfill, no eliminado | Mecánica | P6 | Posibles referencias en código; eliminar con módulo CRM |
| 16 | S6 | PDF: solo Stirling PDF REST API | Mecánica | P5 | Stack definido; no Puppeteer ni react-pdf |
| 17 | S8-10 | Todos los AI calls pasan por Langfuse | Mecánica | P1 | Trazabilidad + costos; no negociable |
| 18 | S9 | "IA propone, humano aprueba" con Confirmation | Mecánica | P1 | Seguridad en acciones irreversibles (citas, derivaciones) |

---

## GSTACK REVIEW REPORT

| Review | Trigger | Runs | Status | Findings |
|--------|---------|------|--------|----------|
| CEO Review | `/plan-ceo-review` | 1 | clean | 18 auto-decisions, 2 taste choices, 0 user challenges |
| Model Validation | Manual (screenshot + migraciones) | 1 | clean | 7 gaps identificados y resueltos |
| Eng Review | `/plan-eng-review` | 1 | clean | Security + get_my_empresa_id() + middleware pattern |
| Design Review | `/plan-design-review` | 1 | clean | Onboarding order + state matrix |
| DX Review | `/plan-devex-review` | 1 | clean | down.sql + seed + execution order |

**VERDICT:** APROBADO — Plan maestro unificado. 12 sprints, 18 decisiones, DB Sprint 2 completa.
**Modo review:** `[subagent-only]` — codex no disponible en este entorno.
