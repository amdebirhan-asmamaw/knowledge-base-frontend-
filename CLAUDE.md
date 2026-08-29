# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

Package manager is **pnpm** (see `pnpm-lock.yaml`).

- `pnpm dev` — start Next.js dev server on http://localhost:3000
- `pnpm build` — production build
- `pnpm start` — run the production build
- `pnpm lint` — ESLint over the repo

There is no test runner configured.

`next.config.mjs` sets `typescript.ignoreBuildErrors: true`, so `pnpm build` will succeed even with TS errors. Treat the editor / `tsc --noEmit` output as the source of truth for type correctness.

## Environment

Copy `.env.local.example` → `.env.local`. Variables:

- `NEXT_PUBLIC_API_URL` — backend base URL, no trailing slash. Defaults to `http://localhost:5000/api/v1` (see `lib/api/client.ts`).
- `NEXT_PUBLIC_ADMIN_PASSWORD` — legacy localStorage-only admin gate used by `lib/admin-auth.ts`.
- `NEXT_PUBLIC_APP_NAME`, `NEXT_PUBLIC_APP_TITLE`, `NEXT_PUBLIC_COMPANY_NAME`, etc. — optional branding overrides (see `config/app.config.ts`).

## App Configuration & Branding

Application settings, branding, metadata, navigation, and logos are centrally configured in `config/app.config.ts`.
- Use `import { appConfig } from "@/config/app.config"` to access application settings.
- Use `import { AppLogo } from "@/components/AppLogo"` for rendering brand logos (variants: `"header"`, `"sidebar"`, `"footer"`, `"auth"`, `"admin"`, `"icon-only"`, `"text-only"`).

## Architecture

Next.js 16 App Router, React 19, TypeScript, Tailwind v4, Radix UI primitives wrapped in `components/ui/*` (shadcn-style). Content editor is TipTap. The project was bootstrapped from v0 — `main` auto-deploys when merged.

### Two parallel data stories (important)

The repo is mid-migration. **Auth is real backend**; **content is still localStorage + mock data**. Don't confuse the two.

1. **Auth — JWT against backend API** (`lib/api/`, `lib/auth/`)
   - `lib/api/client.ts` — thin `fetch` wrapper. Unwraps the backend's `{ data: T }` envelope, throws `ApiError(status, message, data)` on non-2xx, and attaches `Authorization: Bearer <token>` when a token is passed.
   - `lib/api/auth.api.ts` — `authApi.{login, register, getMe, refreshTokens}` against `/auth/*`.
   - `lib/auth/token.store.ts` — access + refresh tokens kept in `localStorage` under `blih_access_token` / `blih_refresh_token`.
   - `lib/auth/auth.context.tsx` — `AuthProvider` restores the session on mount: calls `/auth/me`; on 401 attempts `refreshTokens()` once, then `/me` again; on any failure clears tokens.
   - `hooks/use-auth.ts` re-exports `useAuthContext` as `useAuth`. Use this everywhere.
   - `app/admin/layout.tsx` wraps the admin tree in `<AuthProvider><AdminGuard><AdminProvider>...`. `AdminGuard` redirects to `/admin` if not authenticated and renders nothing unless `isAdmin` (role === "admin") is true.

2. **Knowledge-base content — localStorage with mock fallback** (`lib/data.ts`, `lib/admin-context.tsx`, `lib/get-content.ts`)
   - `lib/data.ts` exports `documentsData` as the seed/mock.
   - `lib/admin-context.tsx` — `AdminProvider` mirrors `categories` to `localStorage['blih-brain-admin-data']` on every change; loads from there on mount, falling back to `documentsData`. Used by all admin pages.
   - `lib/get-content.ts` — the **public** site reads the same `blih-brain-admin-data` key (passed through `convertAdminDataToPublic`) so admin edits appear immediately on the public site within the same browser. SSR returns mock data (no `window`).
   - Consequence: content does not sync across browsers and is wiped if localStorage is cleared. If you're adding a content backend, replace `AdminProvider`'s persistence and `get-content.ts`'s read path together.

`lib/admin-auth.ts` is the **old** password-gated admin session (`admin-session-token` in localStorage). It is superseded by the JWT flow in `lib/auth/` and the `AdminGuard` in `app/admin/layout.tsx`. Don't add new code against it.

### Routing

- `app/page.tsx` — public landing
- `app/documents/[category]/...` — public document browsing
- `app/admin/page.tsx` — admin login
- `app/admin/dashboard`, `app/admin/content`, `app/admin/structure` — admin CRUD UI; all inherit the `AuthProvider + AdminGuard + AdminProvider` stack from `app/admin/layout.tsx`.

### Domain types

`lib/types.ts` defines the content shape: `DocumentCategory → DocumentSection → DocumentItem`, plus `DocumentContent` (the rendered body with `sections`, `tableOfContents`). `DocumentItem.category` is a fixed union (`'procedures' | 'job-descriptions' | 'company-overview' | 'policies'`) — adding a category means widening this type.

### Path alias

`@/*` resolves to repo root (`tsconfig.json`). Import as `@/lib/...`, `@/components/...`, `@/hooks/...`.

## Notes for further work

- The backend API contract is assumed to wrap responses as `{ data: T }` — `apiClient` will misbehave against a backend that returns `T` directly.
- `ADMIN_DASHBOARD_GUIDE.md` documents the admin UX and still references the localStorage-only flow; treat the JWT/AuthGuard implementation in `lib/auth/` and `app/admin/layout.tsx` as authoritative where they disagree.
