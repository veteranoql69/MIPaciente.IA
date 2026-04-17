# Cuestionario de Descubrimiento (Discovery): Sprints 1 y 2

*(Estas preguntas están diseñadas utilizando los frameworks de las skills `product-manager`, `ui-ux-pro-max` y `auth-implementation-patterns`. Su objetivo es recopilar las definiciones técnicas y de negocio necesarias para cerrar el diseño de la Arquitectura Base y UI/UX sin alucinaciones).*

---

### 1. Autenticación, Roles y Seguridad (Ley 21.719)

*Skills involucradas: `nextjs-supabase-auth`, `auth-implementation-patterns`, `privacy-by-design`*

1. **Restricción de Acceso (Google Auth):** Al configurar el Login con Google, ¿permitiremos el ingreso a cualquier cuenta de Google (`@gmail.com`) que haya sido previamente invitada, o el sistema estará restringido herméticamente a un dominio corporativo específico (`@tuclinica.cl`) de Google Workspace?
2. **Semilla de Administradores:** Necesitamos crear una lista blanca (*whitelist*) inicial. ¿Qué correos electrónicos debemos pre-configurar en la base de datos con el rol inmutable de `admin` desde el Día 1?
3. **Disclosure de Privacidad (MVP):** Pensando en la Ley 21.719, en la pantalla inicial de Login debe haber un "Consentimiento trazable" o cláusula de privacidad básica. ¿Tienen ya una redacción legal mínima para esto, o prefieren que redactemos una propuesta estándar de "Acepta los términos y el uso corporativo de los datos" antes de presionar el botón de Google?

---

### 2. Branding, Diseño Base y Experiencia de Usuario (UI/UX)

*Skills involucradas: `tailwind-patterns`, `antigravity-design-expert`, `ui-ux-pro-max`*

1. **Identidad Visual Corporativa:** Para inyectar los "Design Tokens" (variables de color) en el framework Tailwind y shadcn, ¿nos pueden proporcionar su manual de marca, logotipo oficial (preferiblemente en SVG limpio) y la paleta de colores principales (HEX o RGB)?
2. **Estética General:** Según el plan, diseñaremos un producto "premium" con micro-animaciones (tipo Glassmorphism). ¿Desean priorizar un "Modo Claro" (estilo médico clásico, luminoso y aséptico), un "Modo Oscuro" (impacto visual moderno y menor fatiga visual), o dejamos que la aplicación detecte la preferencia del sistema operativo de cada usuario?
3. **Pantalla de Entrada Minimalista:** La regla del MVP (Letra H) dicta que el dashboard es un simple *control de accesos primario* (Botones para Agenda, CRM, Estadísticas). ¿Debemos incluir el manifiesto o logo de la clínica de forma inmensa allí, o priorizamos la absoluta eficiencia visual ("menos es más")?

---

### 3. Infraestructura Cloud y Staging (Entregas Continuas)

*Skills involucradas: `docker-expert`, `postgres-best-practices`*

1. **Dominio de Entregas (Staging):** En el Sprint 2 configuraremos el entorno de Semi-Producción para que puedan ir probando todo el producto real. ¿Qué subdominio DNS habilitaremos para este propósito? *(Ejemplo: `staging.mi-paciente.com` o usarán subdominios internos de manmec.cl como `app.manmec.cl`)*.
2. **Catálogo de Prueba (Seed Data):** Para no testear el sistema con datos irreales como "Servicio X", ¿nos pueden entregar un Top 5 de sus servicios reales (con su duración en minutos y precio base en CLP)? Esto asegurará que durante el Sprint 2 (Frontend) ya vean su propia realidad en los menús desplegables.
3. **Orígenes de Captación (Estructura de BD):** En la base de datos ya está creada la columna `canal_origen` de los contactos. ¿Cuál es su lista oficial cerrada (enum) de donde provienen hoy los contactos para bloquearla por base de datos? *(Opción sugerida: WhatsApp, Instagram, Facebook Ads, Google Ads, Formulario Web, Presencial/Manual).*
