# Knowledge Base Explorer & Workspace — Architecture Design Specification

**Date:** 2026-09-24  
**Status:** Approved  
**Author:** Antigravity AI  
**Scope:** `knowledge-base-frontend-` (`app/admin/structure/page.tsx` & related workspace components)

---

## 1. Executive Summary & Problem Statement

### 1.1 The Problem
The current Knowledge Base management interface (`/admin/structure`) suffers from critical UX and ergonomic deficiencies:
1. **Cluttered Vertical Monolith:** An accordion-of-accordions tree (Category → Section → Document) where every level indents further into the page, resulting in cramped cards and excessive vertical scrolling.
2. **Permanent Real-Estate Waste:** A static "Add New Category" card occupies prime screen height above the listing at all times, pushing meaningful content off the initial viewport.
3. **Disjointed Placement & Navigation:** Document creation and movement are friction-heavy. Viewing a document navigates away to a full page, wiping scroll position and search filters. Moving a document to a different section requires opening the full editor and modifying dropdowns.
4. **Coarse Visuals:** Generic card borders, default light-gray pills, and lack of visual rhythm fail to convey an enterprise-grade corporate knowledge repository.

### 1.2 The Solution
Transition the Knowledge Base into a **Dual-Pane "Explorer & Workspace"** interface (inspired by modern productivity platforms like Linear, Notion, and macOS Finder):
- **Left Explorer Pane (320px):** Interactive, searchable hierarchy tree (Categories, Sections, document counts, quick-action menus) plus quick filter views (`All Documents`, `My Documents`, `Hidden / Drafts`).
- **Right Workspace Pane (Fluid):** Dynamic, multi-view canvas showing the contents of the active selection (All, Category, or Section) with instant search, sorting, status filters, and **List / Grid View toggling**.
- **Slide-Over Quick Preview Drawer (Sheet):** Instant right-side drawer to inspect, read, copy, or print documents without leaving the hierarchy.
- **Fast Placement ("Move to..." Dialog):** Reassign any document's Category and Section in a single click.
- **Contextual Modals:** Clean, accessible dialogs for creating/renaming categories and sections, replacing messy inline forms and pinned cards.

---

## 2. Design Aesthetics & Brand Styling

Following modern visual design guidelines and enterprise design standards:
- **Palette & Contrast:**
  - Backgrounds: Clean warm canvas (`#fbfbfa` / `#ffffff`) with ultra-subtle border contrasts (`#e4e4e7` / `#e2e8f0`).
  - Brand Accents: Deep charcoal typography (`#0f172a`), emerald/teal primary accents (`#0d9488` / `#0f766e`), warm amber for drafts/hidden status (`#f59e0b` / `#b45309`), and indigo/blue for departmental sections.
- **Typography:**
  - Modern sans-serif system stack (`Inter`, system UI) with calibrated weights (600/700 for headlines, 500 for labels, 400 for content).
  - High-density tabular numbers for counts and badges (`font-variant-numeric: tabular-nums`).
- **Micro-Interactions & Transitions:**
  - Smooth 150ms hover elevations and color transitions.
  - Non-blocking slide-over drawer animation.
  - Active node visual indicators (subtle brand accent border and tinted background).

---

## 3. Information Architecture & Navigation Flows

```
┌────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Global Top Bar: Breadcrumb (Admin › KB › [Category] › [Section]) | Actions (+ Cat, + Sec, + Doc)       │
├──────────────────────────────────────┬─────────────────────────────────────────────────────────────────┤
│ Left Explorer Pane (320px)           │ Right Workspace Pane (Fluid)                                    │
│                                      │                                                                 │
│ 🔍 Quick Tree Filter                 │ Context Header: [Category Name] › [Section Name] (Badge Counts) │
│                                      │ Filter Toolbar: [Search documents...] [Status] [ ☰ List | ⊞ Grid]│
│ 📌 Quick Views                       │ ─────────────────────────────────────────────────────────────── │
│  • All Documents (6)                 │ Active Document Rows / Cards:                                   │
│  • My Documents (2)                  │  - File Icon + Title + Doc ID Badge                             │
│  • Hidden / Inactive (0)             │  - Owner Chip + Last Modified                                   │
│                                      │  - Inline Actions: [👁️ Preview] [✏️ Edit] [⇄ Move] [...]         │
│ 🗂️ Categories & Sections Tree        │                                                                 │
│  ▼ 📁 Category A (2 docs)            │ Empty States with Contextual CTAs                               │
│     ├─ 📖 Section 1 (1)              │                                                                 │
│     └─ 📖 Section 2 (1)              │                                                                 │
│  ▶ 📁 Category B (4 docs)            │                                                                 │
└──────────────────────────────────────┴─────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼ (Click on document row)
┌────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Slide-Over Preview Sheet: Rendered HTML, Metadata, Contributors, Versions, Direct Edit / Export CTA     │
└────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

### 3.1 Interaction Modes
1. **Tree Selection (`activeSelection`):**
   - `{ type: "all" }`: Workspace displays all documents across the entire knowledge base.
   - `{ type: "my_docs" }`: Workspace displays only documents where the current user is owner or contributor.
   - `{ type: "hidden" }`: Workspace displays inactive/hidden categories, sections, or documents.
   - `{ type: "category", categoryId: string }`: Workspace displays all documents in that category, grouped by section.
   - `{ type: "section", categoryId: string, sectionId: string }`: Workspace displays documents strictly in that section.
2. **Selection Preservation:**
   - Expanding/collapsing a category tree folder does not alter the right workspace unless the node itself is clicked.
   - Search filtering maintains selected view.

---

## 4. Component Architecture & Directory Structure

To eliminate code bloat in `app/admin/structure/page.tsx` (formerly 924 lines), code is decomposed into focused modular components under `components/structure/`:

```
knowledge-base-frontend-/
├── app/admin/structure/
│   └── page.tsx                         # Thin wrapper page mounting KnowledgeBaseExplorer
└── components/structure/
    ├── KnowledgeBaseExplorer.tsx         # State container & dual-pane layout shell
    ├── StructureTreeSidebar.tsx         # Left tree navigator, search & quick views
    ├── StructureTreeNode.tsx            # Recursive/nested category & section item with action menus
    ├── WorkspaceHeader.tsx              # Dynamic breadcrumb & global action buttons
    ├── WorkspaceToolbar.tsx             # Search, status filter, sort dropdown, list/grid toggle
    ├── DocumentListView.tsx             # High-density, tabular document rows with actions
    ├── DocumentGridView.tsx             # Visual card layout with excerpt & owner badges
    ├── DocumentPreviewDrawer.tsx        # Slide-over sheet for fast document reading
    ├── MoveDocumentDialog.tsx           # 1-click Category/Section reassignment dialog
    ├── CategoryModal.tsx                # Dialog for creating and renaming categories
    └── SectionModal.tsx                 # Dialog for creating and renaming sections
```

---

## 5. Detailed Component Specifications

### 5.1 `StructureTreeSidebar.tsx`
- **Search:** Top instant filter that highlights matching categories, sections, and document counts.
- **Quick Views:**
  - `All Documents`: Shows overall count, resets category filter.
  - `My Documents`: Filters tree & workspace to items matching `user.id`.
  - `Hidden / Drafts`: Shows inactive categories/sections for quick audit.
- **Tree Node Actions Menu (`...` Dropdown):**
  - Category Node: Rename Category, Toggle Visibility, Add Section, Delete Category.
  - Section Node: Rename Section, Toggle Visibility, Add Document, Delete Section.

### 5.2 `WorkspaceHeader.tsx` & `WorkspaceToolbar.tsx`
- **Breadcrumbs:** `Knowledge Base > [Category] > [Section]` with clickable navigation.
- **Primary CTAs:**
  - `+ New Document` (Emerald button, auto-binds current category/section in query params).
  - `+ Section` (Secondary button, opens Section modal with current category preselected).
  - `+ Category` (Outline button, opens Category modal).
- **Search & Sort:** Instant client-side text filtering by Title, Document ID, and Owner. Sorting by Title (A-Z, Z-A) or Updated Date (newest, oldest).

### 5.3 `DocumentListView.tsx` & `DocumentGridView.tsx`
- Displays document items with:
  - Document Title & Document ID badge (`e.g. RM-TD-001`).
  - Owner `UserChip` with avatar fallback.
  - Section/Category location badge.
  - Inline Action buttons:
    - `👁️ Preview`: Opens `DocumentPreviewDrawer`.
    - `✏️ Edit`: Navigates to `/admin/structure/[docId]/edit` (gated on edit permissions).
    - `⇄ Move`: Opens `MoveDocumentDialog` to instantly reassign category/section.
    - `🗑️ Delete`: Triggers delete alert dialog (gated on delete permissions).

### 5.4 `DocumentPreviewDrawer.tsx`
- Built using Radix UI `Sheet` / `SheetContent` (side="right", width="w-full sm:max-w-2xl"):
  - Header: Title, Document ID, Breadcrumb path, Status badge.
  - Metadata Bar: Owner chip, Contributors chips, Created Date, Last Updated Date.
  - Body: Formatted document HTML content (`prose prose-slate max-w-none`) with syntax-highlighted styles and table formatting.
  - Footer Action Bar:
    - `Open in Full Editor` (routes to `/admin/structure/[docId]/edit`).
    - `Copy Text` (copies plain text to clipboard).
    - `Print` (window.print with print styling).

### 5.5 `MoveDocumentDialog.tsx`
- Allows moving a document to any Category and Section:
  - Category `<Select>`: Lists all active categories.
  - Section `<Select>`: Dynamically filters sections belonging to the selected category.
  - Submits `updateDocument(id, { categoryId, sectionId })`.
  - Invalidates document tree query to immediately reflect new placement in both panes.

---

## 6. Fine-Grained Permission Enforcement

All actions strictly consume the 1:1 tokens established in Phase 1:
- `structure:category:create` → Gated on `+ Category` button and category creation modal.
- `structure:category:update` → Gated on category rename modal.
- `structure:category:toggle-visibility` → Gated on category visibility switch in tree menu.
- `structure:category:delete` → Gated on category delete menu action and modal.
- `structure:section:create` → Gated on `+ Section` button and section creation modal.
- `structure:section:update` → Gated on section rename modal.
- `structure:section:toggle-visibility` → Gated on section visibility switch.
- `structure:section:delete` → Gated on section delete menu action and modal.
- `content:create` → Gated on `+ New Document` and `+ Add Document` buttons.
- `content:update:*` → Gated on document `Edit` button and `Move to...` placement dialog.
- `content:delete:*` → Gated on document `Delete` button.
- `content:versions:read` & `content:export` → Gated on version history tab and export actions in preview drawer.

---

## 7. Spec Self-Review Checklist

- [x] **Placeholder Scan:** No "TBD", "TODO", or vague requirements. All components, interactions, and paths are fully defined.
- [x] **Internal Consistency:** Component hierarchy maps directly to the dual-pane architecture approved by the user.
- [x] **Scope Check:** Tightly bounded to the Knowledge Base structure listing and placement redesign, utilizing existing APIs and hooks.
- [x] **Ambiguity Check:** Explicit state types (`activeSelection`, `viewMode`, drawer open state) defined with no dual interpretations.
