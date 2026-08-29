# Blih Brain — Knowledge Base Frontend

A production-ready **Next.js 16** application that powers the public-facing knowledge base reader and the admin dashboard for **Blih Brain** — a company knowledge base platform where teams write, organize, and publish internal documentation, policies, and guides.

---

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Architecture](#architecture)
  - [Public Reader](#public-reader)
  - [Admin Dashboard](#admin-dashboard)
  - [API Layer](#api-layer)
  - [Authentication](#authentication)
  - [Rich Text Editor](#rich-text-editor)
- [Routes](#routes)
- [Key Components](#key-components)
- [Design System](#design-system)
- [Scripts](#scripts)
- [Deployment](#deployment)

---

## Overview

Blih Brain is a two-sided platform:

| Side | Purpose |
|---|---|
| **Public reader** (`/`) | Browse categories → sections → documents in a 3-panel layout |
| **Admin dashboard** (`/admin`) | Create and manage categories, sections, and documents via a rich text editor |

All content is stored in **MongoDB** through the separate backend API. The frontend is fully **server-rendered** for public pages (SEO-ready) and uses **client-side React** for the interactive admin editor.

---

## Tech Stack

| Category | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5.7 |
| Styling | Tailwind CSS v4 |
| UI Components | shadcn/ui (Radix UI primitives) |
| Authentication | NextAuth.js v4 (JWT strategy) |
| Rich Text Editor | TipTap v3 (ProseMirror) |
| Forms | React Hook Form + Zod |
| HTTP Client | Axios |
| Package Manager | pnpm |

---

## Project Structure

```
blih-knowledge-base-front/
├── app/
│   ├── admin/
│   │   ├── layout.tsx          # Auth guard + shadcn Sidebar layout
│   │   ├── page.tsx            # Login page (Zod validation)
│   │   ├── dashboard/          # Stats overview + quick actions
│   │   ├── content/            # Document list + editor launcher
│   │   └── structure/          # Category & section CRUD
│   ├── api/
│   │   ├── auth/[...nextauth]/ # NextAuth route handler
│   │   └── proxy/[...path]/    # Transparent API proxy (forwards auth header)
│   ├── documents/
│   │   └── [category]/[section]/[document]/  # Document reader page (Server Component)
│   ├── globals.css             # Design tokens (CSS variables) + Tailwind base
│   ├── layout.tsx              # Root layout (SessionProvider, fonts)
│   └── page.tsx                # Home page — category grid (Server Component)
│
├── components/
│   ├── ui/                     # shadcn/ui generated components
│   ├── AdminLayout.tsx         # (legacy — sidebar now in app/admin/layout.tsx)
│   ├── DocumentEditor.tsx      # Admin editor: title, category/section pickers, TipTap
│   ├── DocumentViewer.tsx      # Renders contentHtml with Tailwind prose styles
│   ├── Header.tsx              # Public site top bar with search
│   ├── RichTextEditor.tsx      # TipTap wrapper — emits HTML + JSON on change
│   ├── SearchWrapper.tsx       # Client-side search filter for the home page
│   ├── SearchBar.tsx           # Debounced search input
│   ├── SectionCard.tsx         # Section card on the home page
│   ├── Sidebar.tsx             # 3-panel reader left sidebar
│   └── TableOfContents.tsx     # Auto-generated TOC from HTML headings
│
├── hooks/
│   └── use-auth.ts             # useAuth() — wraps useSession for typed access
│
├── lib/
│   ├── admin-context.tsx       # AdminProvider — categories tree + CRUD actions
│   ├── api/
│   │   ├── client.ts           # serverFetch (SSR) + apiAxios (client, intercepted)
│   │   ├── axios.ts            # Raw backendAxios instance for auth-options
│   │   ├── auth.api.ts         # /auth/me endpoint
│   │   ├── documents.api.ts    # Full typed API module (public reads + admin writes)
│   │   └── index.ts            # Re-exports
│   ├── auth/
│   │   ├── auth-options.ts     # NextAuth CredentialsProvider + JWT/session callbacks
│   │   └── session-provider.tsx # <AuthProvider> client wrapper
│   └── utils.ts                # cn() helper
│
├── middleware.ts               # Edge middleware — protects /admin/* routes
├── types/                      # next-auth.d.ts module augmentation
├── .env.local.example          # Environment variable template
└── next.config.mjs
```

---

## Getting Started

### Prerequisites

- Node.js ≥ 20
- pnpm ≥ 9
- The [backend API](../blih-knowledge-base-backend) running on `http://localhost:5000`

### Installation

```bash
# Clone the repo
git clone https://github.com/blih-tech/blih-knowledge-base-front.git
cd blih-knowledge-base-front

# Install dependencies
pnpm install

# Copy and fill in environment variables
cp .env.local.example .env.local
```

### Development

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build

```bash
pnpm build
pnpm start
```

---

## Environment Variables

Copy `.env.local.example` to `.env.local` and fill in the values:

```env
# Backend API base URL
NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1

# NextAuth.js JWT encryption secret
# Generate with: openssl rand -base64 32
NEXTAUTH_SECRET=replace-me-with-a-long-random-string
```

> **Note:** NextAuth automatically detects the deployment URL (on Vercel via `VERCEL_URL` and in development from the request host) so `NEXTAUTH_URL` does not need to be manually defined.

---

## Architecture

### Public Reader

Public pages are **Next.js Server Components** — they fetch data directly from the backend at request time with no client JavaScript for data loading.

```
/ (home)
  └── getFullTree()          → fetches all categories + sections + doc summaries
      └── SectionCard        → renders section links per category

/documents/[category]/[section]/[document]
  └── getDocumentBySlug()    → fetches full document
      ├── DocumentViewer     → renders contentHtml with prose styles
      ├── Sidebar            → category/section navigation
      └── TableOfContents    → auto-extracted from HTML heading IDs
```

**No `useEffect`, no `localStorage`, no client-side data fetching** on public routes.

### Admin Dashboard

The admin section is protected at two levels:

1. **Edge middleware** (`middleware.ts`) — blocks non-admin JWT tokens before the page renders
2. **Client-side guard** (`app/admin/layout.tsx`) — secondary check using `useSession`

The dashboard uses `AdminProvider` (a React Context) to hold the full category tree in memory and expose typed CRUD methods. Every mutation calls the backend and then refreshes the local tree.

```
AdminProvider
  ├── categories: CategoryNode[]   ← full tree from GET /docs
  ├── createCategory(name)         ← POST /docs/categories
  ├── createSection(catId, name)   ← POST /docs/sections
  ├── deleteCategory(id)           ← DELETE /docs/categories/:id
  ├── deleteSection(id)            ← DELETE /docs/sections/:id
  └── createDocument / updateDocument / deleteDocument
```

### API Layer

`lib/api/` provides two fetch strategies:

| Function | Used in | Auth |
|---|---|---|
| `serverFetch<T>(path)` | Server Components | Reads `BACKEND_API_URL` directly |
| `apiAxios` | Client Components (admin) | Axios interceptor attaches Bearer token from NextAuth session |

All types are defined in `lib/api/documents.api.ts`:

```typescript
CategoryNode    → id, name, slug, count, sections[]
SectionNode     → id, name, slug, documents[]
DocSummary      → _id, title, slug, docId, order
FullDocument    → + contentHtml, contentJson, contentText, categoryId, sectionId
SearchResult    → _id, title, slug, categoryId, sectionId
```

### Authentication

NextAuth.js v4 with a **CredentialsProvider** that:

1. POSTs `{ email, password }` to `BACKEND_API_URL/auth/login`
2. Validates that `user.role === "admin"` (throws `AdminAccessDenied` otherwise)
3. Stores `accessToken`, `refreshToken`, and `accessTokenExpiresAt` in the JWT
4. Automatically refreshes the access token via `/auth/refresh-token` when it expires

Backend error messages (e.g. "Account is inactive") are propagated through `result.error` and displayed on the login form.

**Login form** (`app/admin/page.tsx`) uses **Zod** schema validation:

```typescript
z.object({
  email: z.string().email(),
  password: z.string().min(8),
})
```

### Rich Text Editor

`RichTextEditor` wraps **TipTap v3** and exposes two callbacks:

```typescript
onChange(html: string)       // for contentHtml
onChangeJson(json: object)   // for contentJson (ProseMirror document)
```

`DocumentEditor` uses both + generates `contentText` (plain text via `innerText` stripping) before saving. This implements the **dual-storage** strategy:

| Field | Purpose |
|---|---|
| `contentHtml` | Rendering in DocumentViewer |
| `contentJson` | Re-hydrating the TipTap editor |
| `contentText` | Full-text search indexing in MongoDB |

---

## Routes

### Public

| Route | Type | Description |
|---|---|---|
| `/` | Server Component | Home — category grid |
| `/documents/[category]/[section]/[document]` | Server Component | Document reader with sidebar + TOC |

### Admin (requires `role: admin`)

| Route | Description |
|---|---|
| `/admin` | Login page |
| `/admin/dashboard` | Stats overview + quick actions |
| `/admin/content` | Browse and edit all documents |
| `/admin/structure` | Manage categories and sections |

### API

| Route | Description |
|---|---|
| `/api/auth/[...nextauth]` | NextAuth route handler |
| `/api/proxy/[...path]` | Transparent proxy — forwards authenticated requests to backend |

---

## Key Components

| Component | Description |
|---|---|
| `Sidebar` | Left-panel navigation in the document reader; auto-expands the active category/section |
| `TableOfContents` | Right-panel TOC; extracts heading IDs from `contentHtml` server-side |
| `DocumentViewer` | Renders `contentHtml` inside Tailwind's `prose` plugin for consistent typography |
| `RichTextEditor` | TipTap editor with toolbar (bold, italic, headings, lists, links, code) |
| `DocumentEditor` | Full admin form: title, category/section selectors, editor, save/delete actions |
| `SearchWrapper` | Client-side fuzzy filter over the pre-fetched category tree on the home page |
| `SectionCard` | Compact section card with flat document links (no accordion) |

---

## Design System

The color system is defined as CSS variables in `app/globals.css` and consumed via Tailwind's `@theme inline` block.

**Primary palette — deep teal**

| Token | Value | Usage |
|---|---|---|
| `--primary` | `#0d9488` (teal-600) | Buttons, active states, links |
| `--primary-foreground` | `#ffffff` | Text on primary backgrounds |
| `--accent` | `#0f766e` (teal-700) | Hover states, highlighted text |
| `--sidebar-accent` | `#f0fdfa` | Active sidebar item background |
| `--sidebar-accent-foreground` | `#0d9488` | Active sidebar item text |

All shadcn/ui components consume these tokens — changing a variable updates the entire UI consistently.

---

## Scripts

```bash
pnpm dev        # Start development server (http://localhost:3000)
pnpm build      # Production build
pnpm start      # Start production server
pnpm lint       # ESLint
```

---

## Deployment

### Environment

Set the following in your hosting environment (Vercel, Railway, etc.):

```
NEXT_PUBLIC_API_URL=https://api.yourdomain.com/api/v1
NEXTAUTH_SECRET=<32-byte random string>
```

### Vercel

```bash
vercel --prod
```

The app uses `export const dynamic = "force-dynamic"` on the home page to ensure content is always fresh. Document pages can be statically generated if desired by adding `generateStaticParams`.

### Backend dependency

This frontend requires the backend API to be running. The backend must have:
- `CORS_ORIGIN` set to the frontend's domain
- MongoDB seeded with an admin user (`npm run seed:admin` in the backend)

---

## Related

- [Backend Repository](../blih-knowledge-base-backend) — Express.js + MongoDB API
