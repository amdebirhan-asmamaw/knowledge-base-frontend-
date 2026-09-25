# Brand Color Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Overhaul the entire application color system using the custom teal brand scale (`--brand-50` through `--brand-950`), yellow-green Crayola accent (`--brand-accent: #aed580`), and off-white background (`--background: oklch(0.98 0 0)`), ensuring full WCAG AA/AAA contrast and visual harmony across light and dark modes.

**Architecture:** Define the 12 brand tokens in `:root` and `.dark` within `app/globals.css`. Map them into semantic design tokens (`--primary`, `--secondary`, `--accent`, `--card`, `--border`, `--sidebar-*`) and register them in Tailwind v4 `@theme inline`. Alias legacy emerald utility color mappings to the brand scale so existing components instantly inherit the new brand identity, while also explicitly refining key surfaces (`Footer.tsx`, `AppLogo.tsx`, `FloatingAiAssistant.tsx`).

**Tech Stack:** Next.js 15, React 19, Tailwind CSS v4 (`@theme inline`), OKLCH & HEX color spaces, Lucide React icons.

## Global Constraints

- Use exact user color values:
  - `--brand-50: #eff9f8`
  - `--brand-100: #d7f0ec`
  - `--brand-200: #b3e1dc`
  - `--brand-300: #86c9c3`
  - `--brand-400: #5baaa4`
  - `--brand-500: #3b8e88`
  - `--brand-600: #0b7a6b`
  - `--brand-700: #1c6259`
  - `--brand-800: #1a4f49`
  - `--brand-900: #18413e`
  - `--brand-950: #0c2624`
  - `--brand-accent: #aed580`
  - `--background: oklch(0.98 0 0)`
- All text must maintain minimum 4.5:1 contrast ratio against its background (WCAG AA). Text on `--brand-accent` (`#aed580`) must use dark `--brand-950` (`#0c2624`), never white.
- Dark mode must use rich dark teal tones (`#0c2624` background, `#18413e` cards, `#1a4f49` borders) rather than muddy grays.
- Keep build clean with zero TypeScript errors (`npx tsc --noEmit`).

---

### Task 1: Update Global CSS Color System in `app/globals.css`

**Files:**
- Modify: `d:/FILES/SELF/knowledge-base/knowledge-base-frontend-/app/globals.css`

**Interfaces:**
- Consumes: User color specifications.
- Produces: CSS custom properties (`--brand-50`..`950`, `--brand-accent`), semantic tokens (`--background`, `--foreground`, `--primary`, `--secondary`, `--accent`, `--border`, `--ring`, `--sidebar-*`), and Tailwind v4 theme definitions (`--color-brand-*`, `--color-emerald-*`).

- [x] **Step 1: Check existing build status before modifications**
- [x] **Step 2: Update `:root` and `.dark` variables in `app/globals.css`**
- [x] **Step 3: Register `@theme inline` aliases in `app/globals.css`**
- [x] **Step 4: Verify CSS syntax and typecheck**
- [x] **Step 5: Staged for commit**

---

### Task 2: Harmonize Footer and Logo Components

**Files:**
- Modify: `d:/FILES/SELF/knowledge-base/knowledge-base-frontend-/components/Footer.tsx`
- Modify: `d:/FILES/SELF/knowledge-base/knowledge-base-frontend-/components/AppLogo.tsx`

**Interfaces:**
- Consumes: Brand palette tokens and classes.
- Produces: Polished footer with `--brand-950` deep background, `--brand-800` borders, `--brand-accent` operational indicator, and dynamic primary logo surfaces.

- [x] **Step 1: Update `components/Footer.tsx`**
- [x] **Step 2: Update `components/AppLogo.tsx`**
- [x] **Step 3: Verify TypeScript compilation**
- [x] **Step 4: Staged for commit**

---

### Task 3: Harmonize Floating AI Assistant Visual Accents

**Files:**
- Modify: `d:/FILES/SELF/knowledge-base/knowledge-base-frontend-/components/FloatingAiAssistant.tsx`
- Modify: `d:/FILES/SELF/knowledge-base/knowledge-base-frontend-/config/app.config.ts`

**Interfaces:**
- Consumes: Tailwind brand tokens (`brand-*`, `brand-accent`).
- Produces: Premium floating launcher with brand gradient and animated Crayola yellow-green accent dot, polished badge styling, and elevated contrast.

- [x] **Step 1: Update launcher button styling**
- [x] **Step 2: Update AI modal badge and highlights**
- [x] **Step 3: Verify TypeScript compilation**
- [x] **Step 4: Staged for commit**

---

### Task 4: End-to-End Verification & Verification Gate

**Files:**
- Verification only

- [x] **Step 1: Run typecheck (`npx tsc --noEmit`) - PASS (0 errors)**
- [x] **Step 2: Verify all 12 brand tokens and semantic tokens active in light & dark modes**
- [x] **Step 3: Confirm WCAG AA/AAA contrast ratios**
