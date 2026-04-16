# Design System Master File — Mi-Paciente

> **LOGIC:** When building a specific page, first check `design-system/pages/[page-name].md`.
> If that file exists, its rules **override** this Master file.
> If not, strictly follow the rules below.

---

**Project:** Mi-Paciente
**Updated:** 2026-04-16
**Category:** Medical SaaS — CRM + Agenda + Ficha Clínica + IA Operativa
**Style:** Accessible & Ethical (WCAG AAA)
**Product Type:** SaaS Dashboard + Clinical Operations

---

## Global Rules

### Color Palette — Medical Clinic

| Role | Hex | CSS Variable | Usage |
|------|-----|--------------|-------|
| Primary | `#0891B2` | `--color-primary` | Nav, links, interactive elements |
| On Primary | `#FFFFFF` | `--color-on-primary` | Text on primary bg |
| Secondary | `#22D3EE` | `--color-secondary` | Hover states, secondary actions |
| Accent / CTA | `#16A34A` | `--color-accent` | Confirm buttons, success states |
| Background | `#F0FDFA` | `--color-background` | App background (teal tint) |
| Surface | `#FFFFFF` | `--color-surface` | Cards, modals, panels |
| Foreground | `#134E4A` | `--color-foreground` | Body text (deep teal, WCAG AAA) |
| Muted Text | `#64748B` | `--color-muted-text` | Labels, secondary text |
| Muted Surface | `#E8F1F6` | `--color-muted` | Disabled fields, subtle bg |
| Border | `#CCFBF1` | `--color-border` | Card borders, dividers |
| Destructive | `#DC2626` | `--color-destructive` | Delete, errors |
| Ring | `#0891B2` | `--color-ring` | Focus outlines |

**Color Notes:** Medical teal + health green. Foreground #134E4A on Background #F0FDFA = 10.2:1 contrast (WCAG AAA). Accent #16A34A on white = 4.65:1 (WCAG AA).

### Status Badge Colors — Clinical Domain

| Estado | Background | Text | Border | Tailwind |
|--------|-----------|------|--------|---------|
| Agendada | `#CFFAFE` | `#0E7490` | `#0891B2` | `bg-cyan-100 text-cyan-700` |
| Confirmada | `#DBEAFE` | `#1D4ED8` | `#3B82F6` | `bg-blue-100 text-blue-700` |
| Realizada | `#DCFCE7` | `#15803D` | `#16A34A` | `bg-green-100 text-green-700` |
| No asistió | `#FEF3C7` | `#B45309` | `#F59E0B` | `bg-amber-100 text-amber-700` |
| Cancelada | `#FEE2E2` | `#B91C1C` | `#DC2626` | `bg-red-100 text-red-700` |
| Activo (prospecto) | `#DCFCE7` | `#15803D` | `#16A34A` | `bg-green-100 text-green-700` |
| Lead | `#EDE9FE` | `#6D28D9` | `#7C3AED` | `bg-violet-100 text-violet-700` |
| Inactivo | `#F1F5F9` | `#64748B` | `#CBD5E1` | `bg-slate-100 text-slate-500` |

### Typography — Plus Jakarta Sans

- **Primary Font:** Plus Jakarta Sans (all weights: 300, 400, 500, 600, 700)
- **Fallback:** system-ui, -apple-system, sans-serif
- **Mood:** friendly SaaS, modern, accessible, clean
- **Rationale:** Better than Figtree for medical context — slightly more authoritative while remaining approachable. Better than Inter for brand differentiation.

**Google Fonts Import:**
```css
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap');
```

**Next.js Font Setup (`src/app/layout.tsx`):**
```tsx
import { Plus_Jakarta_Sans } from 'next/font/google'

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-sans',
  display: 'swap',
})
```

**Type Scale:**

| Token | Size | Weight | Line Height | Usage |
|-------|------|--------|-------------|-------|
| `text-xs` | 12px | 400 | 1.5 | Micro labels, timestamps |
| `text-sm` | 14px | 400/500 | 1.5 | Table cells, helper text |
| `text-base` | 16px | 400 | 1.625 | Body text (minimum mobile) |
| `text-lg` | 18px | 500 | 1.5 | Card titles, subheadings |
| `text-xl` | 20px | 600 | 1.4 | Section headings |
| `text-2xl` | 24px | 700 | 1.3 | Page titles |
| `text-3xl` | 30px | 700 | 1.2 | Dashboard KPI numbers |
| `text-4xl` | 36px | 700 | 1.1 | Hero numbers |

---

## Spacing System

| Token | Value | Usage |
|-------|-------|-------|
| `--space-xs` | `4px / 0.25rem` | Icon gaps, tight inline |
| `--space-sm` | `8px / 0.5rem` | Badge padding, icon spacing |
| `--space-md` | `16px / 1rem` | Card padding small, form gap |
| `--space-lg` | `24px / 1.5rem` | Card padding, section gap |
| `--space-xl` | `32px / 2rem` | Large section padding |
| `--space-2xl` | `48px / 3rem` | Page-level margins |
| `--space-3xl` | `64px / 4rem` | Hero / splash padding |

---

## Shadow Depths

| Level | Value | Usage |
|-------|-------|-------|
| `--shadow-sm` | `0 1px 2px rgba(0,0,0,0.05)` | Subtle borders, inputs |
| `--shadow-md` | `0 4px 6px rgba(0,0,0,0.07)` | Cards, buttons |
| `--shadow-lg` | `0 10px 15px rgba(0,0,0,0.1)` | Dropdowns, popovers |
| `--shadow-xl` | `0 20px 25px rgba(0,0,0,0.12)` | Modals, sheet overlays |

---

## Component Specs

### Buttons

```css
/* Primary — Accent green for confirmations/CTAs */
.btn-primary {
  background: #16A34A;
  color: white;
  padding: 10px 20px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 14px;
  transition: all 200ms ease;
  cursor: pointer;
  min-height: 44px; /* touch target */
}
.btn-primary:hover { background: #15803D; }
.btn-primary:focus-visible { outline: 3px solid #0891B2; outline-offset: 2px; }
.btn-primary:disabled { opacity: 0.4; cursor: not-allowed; }

/* Secondary — Primary teal for navigation actions */
.btn-secondary {
  background: transparent;
  color: #0891B2;
  border: 1.5px solid #0891B2;
  padding: 10px 20px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 14px;
  transition: all 200ms ease;
  cursor: pointer;
  min-height: 44px;
}
.btn-secondary:hover { background: #F0FDFA; }

/* Destructive */
.btn-destructive {
  background: #DC2626;
  color: white;
  padding: 10px 20px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 14px;
  min-height: 44px;
  cursor: pointer;
  transition: all 200ms ease;
}
.btn-destructive:hover { background: #B91C1C; }
```

### Cards

```css
.card {
  background: #FFFFFF;
  border-radius: 12px;
  padding: 24px;
  border: 1px solid #CCFBF1;
  box-shadow: var(--shadow-md);
  transition: box-shadow 200ms ease;
}
.card:hover { box-shadow: var(--shadow-lg); }

/* KPI card variant */
.card-kpi {
  background: #FFFFFF;
  border-radius: 12px;
  padding: 20px 24px;
  border-left: 4px solid #0891B2;
  box-shadow: var(--shadow-sm);
}
```

### Inputs & Forms

```css
.input {
  padding: 10px 14px;
  border: 1.5px solid #E2E8F0;
  border-radius: 8px;
  font-size: 16px; /* prevents iOS zoom */
  font-family: var(--font-sans);
  min-height: 44px; /* touch target */
  width: 100%;
  transition: border-color 200ms ease;
  background: white;
  color: #134E4A;
}
.input:focus {
  border-color: #0891B2;
  outline: none;
  box-shadow: 0 0 0 3px rgba(8, 145, 178, 0.15);
}
.input:invalid, .input.error {
  border-color: #DC2626;
  box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.12);
}
/* Error message */
.field-error {
  color: #B91C1C;
  font-size: 13px;
  margin-top: 4px;
  display: flex;
  align-items: center;
  gap: 4px;
}
```

### Modals / Dialogs

```css
.modal-overlay {
  background: rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(4px);
}
.modal {
  background: white;
  border-radius: 16px;
  padding: 32px;
  box-shadow: var(--shadow-xl);
  max-width: 520px;
  width: 90vw;
  animation: modal-enter 200ms ease-out;
}
@keyframes modal-enter {
  from { opacity: 0; transform: scale(0.96) translateY(8px); }
  to { opacity: 1; transform: scale(1) translateY(0); }
}
@media (prefers-reduced-motion: reduce) {
  .modal { animation: none; }
}
```

### Tables

```css
.table-container {
  border: 1px solid #CCFBF1;
  border-radius: 12px;
  overflow: hidden;
}
.table th {
  background: #F0FDFA;
  color: #64748B;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  padding: 12px 16px;
  text-align: left;
}
.table td {
  padding: 12px 16px;
  border-top: 1px solid #E8F1F6;
  color: #134E4A;
  font-size: 14px;
}
.table tr:hover td { background: #F0FDFA; }
```

### Sidebar Navigation

```css
/* Active nav item */
.nav-item-active {
  background: #CFFAFE;
  color: #0E7490;
  font-weight: 600;
  border-right: 3px solid #0891B2;
}
/* Hover nav item */
.nav-item:hover {
  background: #F0FDFA;
  color: #0891B2;
}
```

---

## shadcn/ui Configuration

**`components.json`:**
```json
{
  "style": "default",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "tailwind.config.ts",
    "css": "src/app/globals.css",
    "baseColor": "cyan",
    "cssVariables": true,
    "prefix": ""
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  }
}
```

**`tailwind.config.ts` extend colors:**
```ts
extend: {
  colors: {
    primary: '#0891B2',
    accent: '#16A34A',
    background: '#F0FDFA',
    foreground: '#134E4A',
    muted: '#E8F1F6',
    border: '#CCFBF1',
    destructive: '#DC2626',
  },
  fontFamily: {
    sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
  },
}
```

---

## Page Patterns

### Dashboard (Admin / Gerente)
- **Layout:** Sidebar fixed left (240px) + main content area
- **Nav:** Logo → KPI strip (citas hoy, prospectos activos, ingresos) → module nav
- **KPI Strip:** 3-4 cards horizontal, each with metric + delta vs. yesterday
- **Primary CTA per screen:** One per view. Agenda = "Nueva Cita", Prospectos = "Nuevo Prospecto"
- **Empty states:** Illustrated + CTA — never show blank tables

### Agenda (Médico / Asistente)
- **Layout:** Calendar week view + cita detail panel (slide-in from right)
- **Status colors:** Use badge table above — always text + color, never color alone
- **Time slots:** 30-min minimum tap target height

### Onboarding Wizard (3 steps)
- **Multi-step progress:** Step indicator at top (1/3, 2/3, 3/3)
- **Back button:** Always visible on steps 2+
- **No skip:** Clinical onboarding is mandatory
- **Confirm before close:** Dialog if user tries to abandon mid-flow

### Forms (Ficha Clínica, Nueva Cita)
- **Label position:** Above input, always visible
- **Validation:** On blur, not on keystroke
- **Error placement:** Below the specific field
- **Required fields:** Mark with `*` + legend at bottom of form
- **Auto-save:** Long forms (ficha clínica) save draft every 30s

---

## Accessibility Rules (WCAG AAA Target)

- All text minimum 4.5:1 contrast. Body text #134E4A on #F0FDFA = 10.2:1 (AAA).
- Interactive elements minimum 44×44px touch target.
- Focus rings: 3px solid #0891B2, 2px offset — never remove.
- Icon-only buttons require `aria-label`.
- Color never sole differentiator — always pair with icon or text.
- `aria-live="polite"` on form error regions.
- `role="alert"` for destructive action confirmations.
- `prefers-reduced-motion`: remove all transforms, keep opacity fades only.
- Skip link `#main-content` for keyboard users.
- All images: descriptive `alt`. Decorative images: `alt=""`.

---

## Animation Rules

- Micro-interactions: 150–200ms ease-out
- Page transitions: 250ms ease-out
- Modals: 200ms scale+fade from trigger
- Loading skeletons: shimmer animation 1.5s ease-in-out infinite
- Never animate `width`, `height`, `top`, `left` — only `transform` + `opacity`
- Exit animations: 60–70% of enter duration (faster feels responsive)

---

## Anti-Patterns — Do NOT Use

- ❌ Emojis as icons — use Lucide React only
- ❌ Raw hex values in component JSX — use CSS variables or Tailwind tokens
- ❌ Color as sole status differentiator — always pair with text label
- ❌ Placeholder-only labels — always show visible label above input
- ❌ Missing cursor-pointer on clickable elements
- ❌ Instant state changes (0ms) — minimum 150ms transition
- ❌ Invisible or removed focus rings — accessibility blocker
- ❌ Font size below 16px for body text on mobile (triggers iOS zoom)
- ❌ Horizontal scroll on mobile
- ❌ Fixed px container widths — use max-w-* with px-4 padding
- ❌ "Loading..." text alone — use skeleton screens for >300ms operations
- ❌ Mixing Lucide with other icon sets (Heroicons, Font Awesome, etc.)
- ❌ `z-index` values without a defined scale (use: 0/10/20/40/100/1000)
- ❌ Gray text on gray background — minimum contrast 4.5:1 always

---

## Pre-Delivery Checklist

Before delivering any UI code, verify:

- [ ] All icons from Lucide React — no emojis, no other icon sets
- [ ] Font: Plus Jakarta Sans loaded via `next/font/google`
- [ ] Colors use CSS variables or Tailwind tokens — no raw hex in JSX
- [ ] Minimum 44×44px touch targets on all interactive elements
- [ ] `cursor-pointer` on all clickable elements
- [ ] Visible focus ring on all interactive elements (`focus-visible`)
- [ ] Hover + active + disabled states implemented
- [ ] Form labels visible above inputs (not placeholder-only)
- [ ] Error messages below the relevant field with `aria-live`
- [ ] Status badges use text + color (never color alone)
- [ ] `prefers-reduced-motion` respected
- [ ] Responsive tested: 375px, 768px, 1024px, 1440px
- [ ] No horizontal scroll at any breakpoint
- [ ] No content hidden behind fixed nav (use padding-top offset)
- [ ] Loading states: skeleton for async operations >300ms
- [ ] Destructive actions require confirmation dialog
- [ ] Text contrast ≥ 4.5:1 on all backgrounds (WCAG AA minimum)
