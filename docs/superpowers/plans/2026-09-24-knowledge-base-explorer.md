# Knowledge Base Explorer & Workspace Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the monolithic Knowledge Base structure management page into a world-class Dual-Pane "Explorer & Workspace" interface featuring an interactive hierarchy tree, dynamic document listing (List & Grid views), slide-over quick preview drawer, 1-click document placement dialog, and contextual creation modals.

**Architecture:** Decompose the 924-line monolith into single-responsibility components in `components/structure/`. A left sidebar provides tree navigation, search, and quick views (`All`, `My Documents`, `Hidden`). The fluid right workspace dynamically renders filtered documents with instant search, sorting, and view toggling. Document previewing uses a slide-over `Sheet` drawer, and placement reassignment uses a lightweight modal.

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS, Lucide React icons, Radix UI / shadcn components (`Sheet`, `Dialog`, `DropdownMenu`, `Select`, `Switch`, `Badge`, `Card`, `Button`, `Input`), `@tanstack/react-query`, Sonner toasts.

## Global Constraints

- **Strict 1:1 Fine-Grained Permissions:** Every action must explicitly check its exact permission token via `useAuth().hasPermission` (`structure:category:create`, `structure:category:update`, `structure:category:toggle-visibility`, `structure:category:delete`, `structure:section:create`, `structure:section:update`, `structure:section:toggle-visibility`, `structure:section:delete`, `content:create`, `content:update:*`, `content:delete:*`, `content:versions:read`, `content:export`).
- **No Dynamic / Inline Imports:** Always use standard top-level imports.
- **Zero Type Errors:** `npx tsc --noEmit` must pass with 0 errors after every task.
- **Brand & Aesthetics Floor:** Follow modern enterprise styling (subtle borders, refined neutral canvas, emerald `#0d9488` primary accent, smooth 150ms transitions, legible typography).

---

### Task 1: Shared Models, Types & Contextual Modals

**Files:**
- Create: `d:/FILES/SELF/knowledge-base/knowledge-base-frontend-/components/structure/types.ts`
- Create: `d:/FILES/SELF/knowledge-base/knowledge-base-frontend-/components/structure/CategoryModal.tsx`
- Create: `d:/FILES/SELF/knowledge-base/knowledge-base-frontend-/components/structure/SectionModal.tsx`

**Interfaces:**
- Produces:
  - `ActiveSelection`: `{ type: 'all' } | { type: 'my_docs' } | { type: 'hidden' } | { type: 'category'; categoryId: string } | { type: 'section'; categoryId: string; sectionId: string }`
  - `FlatDocument`: Normalized document with `categoryId`, `categoryName`, `sectionId`, `sectionName` for table/grid rendering.
  - `<CategoryModal isOpen={boolean} mode={'create' | 'rename'} initialName?: string categoryId?: string onClose: () => void />`
  - `<SectionModal isOpen={boolean} mode={'create' | 'rename'} categoryId: string categoryName: string initialName?: string sectionId?: string onClose: () => void />`

- [ ] **Step 1: Create components/structure/types.ts**
Define navigation selection union types, sort options, and flat document models:
```typescript
import type { DocSummary, CategoryNode, SectionNode } from "@/lib/api/documents.api";

export type ActiveSelection =
  | { type: "all" }
  | { type: "my_docs" }
  | { type: "hidden" }
  | { type: "category"; categoryId: string }
  | { type: "section"; categoryId: string; sectionId: string };

export type ViewMode = "list" | "grid";

export type SortField = "title" | "updatedAt" | "docId";
export type SortOrder = "asc" | "desc";

export interface FlatDocument extends DocSummary {
  categoryId: string;
  categoryName: string;
  categoryIsActive?: boolean;
  sectionId: string;
  sectionName: string;
  sectionIsActive?: boolean;
}
```

- [ ] **Step 2: Create components/structure/CategoryModal.tsx**
Accessible dialog replacing the pinned "Add New Category" banner and inline rename input:
```tsx
"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, FolderPlus, Edit3 } from "lucide-react";
import { useDocumentTree } from "@/hooks/use-document-tree";
import { toast } from "sonner";

interface CategoryModalProps {
  isOpen: boolean;
  mode: "create" | "rename";
  categoryId?: string;
  initialName?: string;
  onClose: () => void;
}

export function CategoryModal({
  isOpen,
  mode,
  categoryId,
  initialName = "",
  onClose,
}: CategoryModalProps) {
  const [name, setName] = useState(initialName);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { createCategory, updateCategory } = useDocumentTree();

  useEffect(() => {
    if (isOpen) setName(initialName);
  }, [isOpen, initialName]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
      if (mode === "create") {
        await createCategory(name.trim());
        toast.success(`Category "${name.trim()}" created`);
      } else if (categoryId) {
        await updateCategory(categoryId, { name: name.trim() });
        toast.success(`Category renamed to "${name.trim()}"`);
      }
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save category");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-foreground">
              {mode === "create" ? (
                <>
                  <FolderPlus className="w-5 h-5 text-teal-600" />
                  <span>Create Category</span>
                </>
              ) : (
                <>
                  <Edit3 className="w-5 h-5 text-teal-600" />
                  <span>Rename Category</span>
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {mode === "create"
                ? "Add a top-level category to organize sections and documents."
                : "Enter a new name for this category."}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <Input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Engineering & Technology"
              disabled={isSubmitting}
              className="w-full"
            />
          </div>

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!name.trim() || isSubmitting}
              className="bg-teal-600 hover:bg-teal-700 text-white"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
              ) : null}
              {mode === "create" ? "Create Category" : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 3: Create components/structure/SectionModal.tsx**
Accessible dialog for creating and renaming sections under a category:
```tsx
"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, BookPlus, Edit3 } from "lucide-react";
import { useDocumentTree } from "@/hooks/use-document-tree";
import { toast } from "sonner";

interface SectionModalProps {
  isOpen: boolean;
  mode: "create" | "rename";
  categoryId: string;
  categoryName: string;
  sectionId?: string;
  initialName?: string;
  onClose: () => void;
}

export function SectionModal({
  isOpen,
  mode,
  categoryId,
  categoryName,
  sectionId,
  initialName = "",
  onClose,
}: SectionModalProps) {
  const [name, setName] = useState(initialName);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { createSection, updateSection } = useDocumentTree();

  useEffect(() => {
    if (isOpen) setName(initialName);
  }, [isOpen, initialName]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
      if (mode === "create") {
        await createSection(categoryId, name.trim());
        toast.success(`Section "${name.trim()}" created in ${categoryName}`);
      } else if (sectionId) {
        await updateSection(sectionId, { name: name.trim() });
        toast.success(`Section renamed to "${name.trim()}"`);
      }
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save section");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-foreground">
              {mode === "create" ? (
                <>
                  <BookPlus className="w-5 h-5 text-teal-600" />
                  <span>Add Section</span>
                </>
              ) : (
                <>
                  <Edit3 className="w-5 h-5 text-teal-600" />
                  <span>Rename Section</span>
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {mode === "create" ? (
                <>
                  Create a new section within <strong>{categoryName}</strong>.
                </>
              ) : (
                "Enter a new name for this section."
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <Input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Procedures & Runbooks"
              disabled={isSubmitting}
              className="w-full"
            />
          </div>

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!name.trim() || isSubmitting}
              className="bg-teal-600 hover:bg-teal-700 text-white"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
              ) : null}
              {mode === "create" ? "Create Section" : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 4: Verify TypeScript compilation**
Run: `npx tsc --noEmit` in `d:\FILES\SELF\knowledge-base\knowledge-base-frontend-`.
Expected: PASS (0 errors).

- [ ] **Step 5: Commit Task 1**
```bash
git add components/structure/types.ts components/structure/CategoryModal.tsx components/structure/SectionModal.tsx
git commit -m "feat(structure): add shared models and accessible category and section modals"
```

---

### Task 2: Fast Document Placement ("Move to..." Dialog)

**Files:**
- Create: `d:/FILES/SELF/knowledge-base/knowledge-base-frontend-/components/structure/MoveDocumentDialog.tsx`

**Interfaces:**
- Produces: `<MoveDocumentDialog isOpen={boolean} documentId: string documentTitle: string currentCategoryId: string currentSectionId: string onClose: () => void />`
- Consumes: `useDocumentTree().categories`, `useDocumentTree().updateDocument`.

- [ ] **Step 1: Implement MoveDocumentDialog.tsx**
Allow instant reassignment of a document to any Category/Section without opening the full editor:
```tsx
"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ArrowRightLeft, Loader2 } from "lucide-react";
import { useDocumentTree } from "@/hooks/use-document-tree";
import { toast } from "sonner";

interface MoveDocumentDialogProps {
  isOpen: boolean;
  documentId: string;
  documentTitle: string;
  currentCategoryId: string;
  currentSectionId: string;
  onClose: () => void;
}

export function MoveDocumentDialog({
  isOpen,
  documentId,
  documentTitle,
  currentCategoryId,
  currentSectionId,
  onClose,
}: MoveDocumentDialogProps) {
  const { categories, updateDocument } = useDocumentTree();
  const [selectedCatId, setSelectedCatId] = useState(currentCategoryId);
  const [selectedSecId, setSelectedSecId] = useState(currentSectionId);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSelectedCatId(currentCategoryId);
      setSelectedSecId(currentSectionId);
    }
  }, [isOpen, currentCategoryId, currentSectionId]);

  const targetCategory = categories.find((c) => c.id === selectedCatId);
  const targetSections = targetCategory?.sections ?? [];

  const handleCategoryChange = (catId: string) => {
    setSelectedCatId(catId);
    const newCategory = categories.find((c) => c.id === catId);
    // Auto-select first section in the newly selected category if available
    setSelectedSecId(newCategory?.sections[0]?.id ?? "");
  };

  const handleMove = async () => {
    if (!selectedCatId || !selectedSecId) return;
    if (selectedCatId === currentCategoryId && selectedSecId === currentSectionId) {
      onClose();
      return;
    }

    setIsSubmitting(true);
    try {
      await updateDocument(documentId, {
        categoryId: selectedCatId,
        sectionId: selectedSecId,
      });
      toast.success(`Moved "${documentTitle}" successfully`);
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to move document");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <ArrowRightLeft className="w-5 h-5 text-teal-600" />
            <span>Move Document</span>
          </DialogTitle>
          <DialogDescription className="truncate">
            Reassign <strong>&ldquo;{documentTitle}&rdquo;</strong> to a different category or section.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-3">
          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
              Destination Category
            </label>
            <Select value={selectedCatId} onValueChange={handleCategoryChange} disabled={isSubmitting}>
              <SelectTrigger>
                <SelectValue placeholder="Select Category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name} ({c.sections.length} sections)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
              Destination Section
            </label>
            <Select
              value={selectedSecId}
              onValueChange={setSelectedSecId}
              disabled={isSubmitting || targetSections.length === 0}
            >
              <SelectTrigger>
                <SelectValue placeholder={targetSections.length === 0 ? "No sections available" : "Select Section"} />
              </SelectTrigger>
              <SelectContent>
                {targetSections.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {targetSections.length === 0 && (
              <p className="text-xs text-amber-600 mt-1">
                This category has no sections. Create a section first to move documents here.
              </p>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleMove}
            disabled={!selectedSecId || isSubmitting}
            className="bg-teal-600 hover:bg-teal-700 text-white"
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : null}
            Confirm Move
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 2: Verify TypeScript compilation**
Run: `npx tsc --noEmit` in `d:\FILES\SELF\knowledge-base\knowledge-base-frontend-`.
Expected: PASS (0 errors).

- [ ] **Step 3: Commit Task 2**
```bash
git add components/structure/MoveDocumentDialog.tsx
git commit -m "feat(structure): add 1-click document placement move dialog"
```

---

### Task 3: Slide-Over Quick Preview Drawer (`DocumentPreviewDrawer.tsx`)

**Files:**
- Create: `d:/FILES/SELF/knowledge-base/knowledge-base-frontend-/components/structure/DocumentPreviewDrawer.tsx`

**Interfaces:**
- Produces: `<DocumentPreviewDrawer documentId: string | null onClose: () => void onOpenEdit: (id: string) => void onOpenMove: (doc: FlatDocument) => void />`
- Consumes: `useDocument(documentId)` from `@/hooks/use-document-tree`, `useAuth().hasPermission`.

- [ ] **Step 1: Implement DocumentPreviewDrawer.tsx**
Sleek slide-over drawer displaying rendered document content, metadata, version history trigger, copy, and print actions:
```tsx
"use client";

import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UserChip } from "@/components/UserChip";
import { useDocument } from "@/hooks/use-document-tree";
import { useAuth } from "@/hooks/use-auth";
import {
  Edit2,
  Copy,
  Printer,
  Check,
  FileText,
  Calendar,
  Layers,
  ArrowRightLeft,
  Loader2,
  ExternalLink,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import type { FlatDocument } from "./types";

interface DocumentPreviewDrawerProps {
  activeDoc: FlatDocument | null;
  onClose: () => void;
  onOpenEdit: (id: string) => void;
  onOpenMove: (doc: FlatDocument) => void;
}

export function DocumentPreviewDrawer({
  activeDoc,
  onClose,
  onOpenEdit,
  onOpenMove,
}: DocumentPreviewDrawerProps) {
  const { hasPermission, hasScopePermission } = useAuth();
  const { data: fullDoc, isLoading } = useDocument(activeDoc?._id);
  const [copied, setCopied] = useState(false);

  const canEdit =
    hasPermission("content:update:all") ||
    hasScopePermission("content", "update", "own");
  const canExport =
    hasPermission("content:export") ||
    hasScopePermission("content", "read", "own");

  const handleCopy = () => {
    if (!fullDoc?.contentText && !fullDoc?.contentHtml) return;
    const text =
      fullDoc.contentText ||
      fullDoc.contentHtml?.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim() ||
      "";
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Document text copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  if (!activeDoc) return null;

  return (
    <Sheet open={!!activeDoc} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-2xl flex flex-col p-0 bg-white">
        {/* Header Ribbon */}
        <SheetHeader className="p-6 border-b border-border bg-slate-50/50">
          <div className="flex items-center justify-between gap-3 mb-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground">
                {activeDoc.categoryName} › {activeDoc.sectionName}
              </span>
              {activeDoc.docId && (
                <Badge variant="outline" className="font-mono text-[10px] bg-white">
                  {activeDoc.docId}
                </Badge>
              )}
            </div>
            {/* Quick Actions */}
            <div className="flex items-center gap-1.5">
              {canExport && (
                <Button variant="ghost" size="icon-sm" onClick={handleCopy} title="Copy text">
                  {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-muted-foreground" />}
                </Button>
              )}
              {canExport && (
                <Button variant="ghost" size="icon-sm" onClick={handlePrint} title="Print">
                  <Printer className="w-4 h-4 text-muted-foreground" />
                </Button>
              )}
              {canEdit && (
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => onOpenMove(activeDoc)}
                  title="Move to another section"
                >
                  <ArrowRightLeft className="w-4 h-4 text-muted-foreground" />
                </Button>
              )}
              {canEdit && (
                <Button
                  size="sm"
                  onClick={() => onOpenEdit(activeDoc._id)}
                  className="gap-1.5 bg-teal-600 hover:bg-teal-700 text-white text-xs h-8 ml-1"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Edit</span>
                </Button>
              )}
            </div>
          </div>

          <SheetTitle className="text-xl font-bold text-foreground text-left leading-snug">
            {activeDoc.title}
          </SheetTitle>

          {/* Metadata bar */}
          <div className="flex items-center gap-4 pt-3 flex-wrap text-xs text-muted-foreground">
            {activeDoc.owner && (
              <div className="flex items-center gap-1.5">
                <span className="text-muted-foreground/70">Owner:</span>
                <UserChip compact user={activeDoc.owner} />
              </div>
            )}
            {activeDoc.updatedAt && (
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                <span>Updated {format(new Date(activeDoc.updatedAt), "PP")}</span>
              </div>
            )}
          </div>
        </SheetHeader>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {isLoading ? (
            <div className="space-y-4 py-8">
              <div className="h-6 w-3/4 rounded bg-muted animate-pulse" />
              <div className="h-24 w-full rounded bg-muted animate-pulse" />
              <div className="h-40 w-full rounded bg-muted animate-pulse" />
            </div>
          ) : fullDoc?.contentHtml ? (
            <div
              className="prose prose-slate max-w-none text-sm leading-relaxed text-foreground [&_h1]:text-xl [&_h2]:text-lg [&_h3]:text-base [&_table]:border-collapse [&_th]:border [&_th]:border-border [&_th]:p-2 [&_td]:border [&_td]:border-border [&_td]:p-2 [&_pre]:bg-slate-900 [&_pre]:text-slate-100 [&_pre]:p-3 [&_pre]:rounded-lg"
              dangerouslySetInnerHTML={{ __html: fullDoc.contentHtml }}
            />
          ) : (
            <div className="py-12 text-center text-muted-foreground">
              <FileText className="w-10 h-10 text-muted-foreground/40 mx-auto mb-2" />
              <p className="text-sm">This document has no content yet.</p>
              {canEdit && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onOpenEdit(activeDoc._id)}
                  className="mt-3 gap-1.5"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  Add Content
                </Button>
              )}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
```

- [ ] **Step 2: Verify TypeScript compilation**
Run: `npx tsc --noEmit` in `d:\FILES\SELF\knowledge-base\knowledge-base-frontend-`.
Expected: PASS (0 errors).

- [ ] **Step 3: Commit Task 3**
```bash
git add components/structure/DocumentPreviewDrawer.tsx
git commit -m "feat(structure): add slide-over quick preview drawer for documents"
```

---

### Task 4: High-Density Document List & Visual Grid Views

**Files:**
- Create: `d:/FILES/SELF/knowledge-base/knowledge-base-frontend-/components/structure/DocumentListView.tsx`
- Create: `d:/FILES/SELF/knowledge-base/knowledge-base-frontend-/components/structure/DocumentGridView.tsx`

**Interfaces:**
- Produces:
  - `<DocumentListView documents: FlatDocument[] onPreview: (doc: FlatDocument) => void onEdit: (id: string) => void onMove: (doc: FlatDocument) => void onDelete: (doc: FlatDocument) => void />`
  - `<DocumentGridView documents: FlatDocument[] onPreview: (doc: FlatDocument) => void onEdit: (id: string) => void onMove: (doc: FlatDocument) => void onDelete: (doc: FlatDocument) => void />`

- [ ] **Step 1: Implement DocumentListView.tsx**
Clean tabular list with file icons, ID badges, owner chips, and action toolbars:
```tsx
"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UserChip } from "@/components/UserChip";
import { useAuth } from "@/hooks/use-auth";
import {
  FileText,
  Eye,
  Edit2,
  ArrowRightLeft,
  Trash2,
  Clock,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { FlatDocument } from "./types";

interface DocumentListViewProps {
  documents: FlatDocument[];
  onPreview: (doc: FlatDocument) => void;
  onEdit: (id: string) => void;
  onMove: (doc: FlatDocument) => void;
  onDelete: (doc: FlatDocument) => void;
}

export function DocumentListView({
  documents,
  onPreview,
  onEdit,
  onMove,
  onDelete,
}: DocumentListViewProps) {
  const { user, hasPermission, hasScopePermission } = useAuth();
  const canUpdateAll = hasPermission("content:update:all");
  const canDeleteAll = hasPermission("content:delete:all");

  const canEditDoc = (ownerId?: string) =>
    canUpdateAll || (!!ownerId && ownerId === user?.id && hasScopePermission("content", "update", "own"));

  const canDeleteDoc = (ownerId?: string) =>
    canDeleteAll || (!!ownerId && ownerId === user?.id && hasScopePermission("content", "delete", "own"));

  return (
    <div className="space-y-1.5">
      {documents.map((doc) => {
        const userCanEdit = canEditDoc(doc.owner?._id);
        const userCanDelete = canDeleteDoc(doc.owner?._id);

        return (
          <div
            key={doc._id}
            onClick={() => onPreview(doc)}
            className="w-full flex items-center justify-between gap-3 px-4 py-3 rounded-lg bg-white border border-border/80 hover:border-teal-400 hover:shadow-2xs transition-all group cursor-pointer select-none"
          >
            {/* Title & Metadata */}
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="p-2 rounded-md bg-teal-50 text-teal-700 shrink-0 group-hover:bg-teal-100 transition-colors">
                <FileText className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-semibold text-foreground truncate group-hover:text-teal-700 transition-colors">
                    {doc.title}
                  </span>
                  {doc.docId && (
                    <Badge variant="outline" className="font-mono text-[10px] bg-slate-50 border-slate-200 shrink-0">
                      {doc.docId}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                  <span>
                    {doc.categoryName} › {doc.sectionName}
                  </span>
                  {doc.updatedAt && (
                    <>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDistanceToNow(new Date(doc.updatedAt), { addSuffix: true })}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Owner & Action Buttons */}
            <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
              {doc.owner && <UserChip compact user={doc.owner} />}

              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => onPreview(doc)}
                className="text-muted-foreground hover:text-teal-700 hover:bg-teal-50"
                title="Preview document"
              >
                <Eye className="w-3.5 h-3.5" />
              </Button>

              {userCanEdit && (
                <>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => onMove(doc)}
                    className="text-muted-foreground hover:text-teal-700 hover:bg-teal-50"
                    title="Move to another category/section"
                  >
                    <ArrowRightLeft className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => onEdit(doc._id)}
                    className="text-muted-foreground hover:text-teal-700 hover:bg-teal-50"
                    title="Edit document"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </Button>
                </>
              )}

              {userCanDelete && (
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => onDelete(doc)}
                  className="text-muted-foreground hover:text-red-600 hover:bg-red-50"
                  title="Delete document"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 2: Implement DocumentGridView.tsx**
Engaging card-based layout for visual scanning:
```tsx
"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { UserChip } from "@/components/UserChip";
import { useAuth } from "@/hooks/use-auth";
import {
  FileText,
  Eye,
  Edit2,
  ArrowRightLeft,
  Trash2,
  Clock,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { FlatDocument } from "./types";

interface DocumentGridViewProps {
  documents: FlatDocument[];
  onPreview: (doc: FlatDocument) => void;
  onEdit: (id: string) => void;
  onMove: (doc: FlatDocument) => void;
  onDelete: (doc: FlatDocument) => void;
}

export function DocumentGridView({
  documents,
  onPreview,
  onEdit,
  onMove,
  onDelete,
}: DocumentGridViewProps) {
  const { user, hasPermission, hasScopePermission } = useAuth();
  const canUpdateAll = hasPermission("content:update:all");
  const canDeleteAll = hasPermission("content:delete:all");

  const canEditDoc = (ownerId?: string) =>
    canUpdateAll || (!!ownerId && ownerId === user?.id && hasScopePermission("content", "update", "own"));

  const canDeleteDoc = (ownerId?: string) =>
    canDeleteAll || (!!ownerId && ownerId === user?.id && hasScopePermission("content", "delete", "own"));

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
      {documents.map((doc) => {
        const userCanEdit = canEditDoc(doc.owner?._id);
        const userCanDelete = canDeleteDoc(doc.owner?._id);

        return (
          <Card
            key={doc._id}
            onClick={() => onPreview(doc)}
            className="p-4 bg-white border border-border/80 hover:border-teal-400 hover:shadow-xs transition-all flex flex-col justify-between cursor-pointer group"
          >
            <div>
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="p-2 rounded-lg bg-teal-50 text-teal-700 shrink-0 group-hover:bg-teal-100 transition-colors">
                  <FileText className="w-4 h-4" />
                </div>
                {doc.docId && (
                  <Badge variant="outline" className="font-mono text-[10px] bg-slate-50 border-slate-200">
                    {doc.docId}
                  </Badge>
                )}
              </div>

              <h3 className="font-semibold text-sm text-foreground line-clamp-2 mb-1 group-hover:text-teal-700 transition-colors">
                {doc.title}
              </h3>
              <p className="text-xs text-muted-foreground truncate mb-3">
                {doc.categoryName} › {doc.sectionName}
              </p>
            </div>

            <div className="pt-3 border-t border-border/60 flex items-center justify-between gap-2">
              <div className="min-w-0">
                {doc.owner ? (
                  <UserChip compact user={doc.owner} />
                ) : (
                  <span className="text-[11px] text-muted-foreground">Unassigned</span>
                )}
              </div>

              <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => onPreview(doc)}
                  className="text-muted-foreground hover:text-teal-700 hover:bg-teal-50"
                  title="Preview"
                >
                  <Eye className="w-3.5 h-3.5" />
                </Button>
                {userCanEdit && (
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => onEdit(doc._id)}
                    className="text-muted-foreground hover:text-teal-700 hover:bg-teal-50"
                    title="Edit"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </Button>
                )}
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 3: Verify TypeScript compilation**
Run: `npx tsc --noEmit` in `d:\FILES\SELF\knowledge-base\knowledge-base-frontend-`.
Expected: PASS (0 errors).

- [ ] **Step 4: Commit Task 4**
```bash
git add components/structure/DocumentListView.tsx components/structure/DocumentGridView.tsx
git commit -m "feat(structure): add high-density document list and visual card grid views"
```

---

### Task 5: Left Tree Navigator (`StructureTreeSidebar.tsx`)

**Files:**
- Create: `d:/FILES/SELF/knowledge-base/knowledge-base-frontend-/components/structure/StructureTreeSidebar.tsx`

**Interfaces:**
- Produces: `<StructureTreeSidebar categories: CategoryNode[] activeSelection: ActiveSelection onSelect: (s: ActiveSelection) => void onOpenCreateCategory: () => void onOpenRenameCategory: (cat: CategoryNode) => void onOpenCreateSection: (cat: CategoryNode) => void onOpenRenameSection: (sec: SectionNode, cat: CategoryNode) => void onDeleteCategory: (cat: CategoryNode) => void onDeleteSection: (sec: SectionNode) => void totalDocsCount: number />`

- [ ] **Step 1: Implement StructureTreeSidebar.tsx**
Interactive left tree pane with instant search, quick filters, category folders, section items, and context menus (`...`):
```tsx
"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Search,
  Folder,
  FolderOpen,
  BookOpen,
  Files,
  FileUser,
  EyeOff,
  MoreVertical,
  Plus,
  Edit2,
  Trash2,
  ChevronDown,
  ChevronRight,
  FolderPlus,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useDocumentTree } from "@/hooks/use-document-tree";
import type { CategoryNode, SectionNode } from "@/lib/api/documents.api";
import type { ActiveSelection } from "./types";

interface StructureTreeSidebarProps {
  categories: CategoryNode[];
  activeSelection: ActiveSelection;
  onSelect: (selection: ActiveSelection) => void;
  onOpenCreateCategory: () => void;
  onOpenRenameCategory: (cat: CategoryNode) => void;
  onOpenCreateSection: (cat: CategoryNode) => void;
  onOpenRenameSection: (sec: SectionNode, cat: CategoryNode) => void;
  onDeleteCategory: (cat: CategoryNode) => void;
  onDeleteSection: (sec: SectionNode) => void;
  totalDocsCount: number;
}

export function StructureTreeSidebar({
  categories,
  activeSelection,
  onSelect,
  onOpenCreateCategory,
  onOpenRenameCategory,
  onOpenCreateSection,
  onOpenRenameSection,
  onDeleteCategory,
  onDeleteSection,
  totalDocsCount,
}: StructureTreeSidebarProps) {
  const { hasPermission } = useAuth();
  const { updateCategory, updateSection } = useDocumentTree();
  const [filterQuery, setFilterQuery] = useState("");
  const [expandedCats, setExpandedCats] = useState<Set<string>>(
    new Set(categories.map((c) => c.id))
  );

  const canCreateCat = hasPermission("structure:category:create");
  const canUpdateCat = hasPermission("structure:category:update");
  const canToggleCat = hasPermission("structure:category:toggle-visibility");
  const canDeleteCat = hasPermission("structure:category:delete");

  const canCreateSec = hasPermission("structure:section:create");
  const canUpdateSec = hasPermission("structure:section:update");
  const canToggleSec = hasPermission("structure:section:toggle-visibility");
  const canDeleteSec = hasPermission("structure:section:delete");

  const toggleExpand = (catId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedCats((prev) => {
      const next = new Set(prev);
      if (next.has(catId)) next.delete(catId);
      else next.add(catId);
      return next;
    });
  };

  const handleToggleCatVisibility = async (cat: CategoryNode, current: boolean) => {
    await updateCategory(cat.id, { isActive: !current });
  };

  const handleToggleSecVisibility = async (sec: SectionNode, current: boolean) => {
    await updateSection(sec.id, { isActive: !current });
  };

  // Filter categories and sections by query
  const query = filterQuery.trim().toLowerCase();
  const filteredCategories = categories.filter((cat) => {
    if (!query) return true;
    if (cat.name.toLowerCase().includes(query)) return true;
    return cat.sections.some(
      (s) =>
        s.name.toLowerCase().includes(query) ||
        s.documents.some((d) => d.title.toLowerCase().includes(query))
    );
  });

  return (
    <aside className="w-full lg:w-80 shrink-0 bg-white border border-border rounded-xl flex flex-col overflow-hidden shadow-2xs">
      {/* Search Header */}
      <div className="p-3 border-b border-border bg-slate-50/50">
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            placeholder="Filter tree..."
            className="pl-8 h-8 text-xs bg-white"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-4">
        {/* Quick Views */}
        <div>
          <p className="px-2 text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
            Quick Views
          </p>
          <div className="space-y-0.5">
            <button
              onClick={() => onSelect({ type: "all" })}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                activeSelection.type === "all"
                  ? "bg-teal-50 text-teal-800 font-semibold"
                  : "text-muted-foreground hover:bg-slate-100 hover:text-foreground"
              }`}
            >
              <div className="flex items-center gap-2">
                <Files className="w-3.5 h-3.5 text-teal-600" />
                <span>All Documents</span>
              </div>
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 font-normal">
                {totalDocsCount}
              </Badge>
            </button>

            <button
              onClick={() => onSelect({ type: "my_docs" })}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                activeSelection.type === "my_docs"
                  ? "bg-teal-50 text-teal-800 font-semibold"
                  : "text-muted-foreground hover:bg-slate-100 hover:text-foreground"
              }`}
            >
              <div className="flex items-center gap-2">
                <FileUser className="w-3.5 h-3.5 text-blue-600" />
                <span>My Documents</span>
              </div>
            </button>

            <button
              onClick={() => onSelect({ type: "hidden" })}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                activeSelection.type === "hidden"
                  ? "bg-teal-50 text-teal-800 font-semibold"
                  : "text-muted-foreground hover:bg-slate-100 hover:text-foreground"
              }`}
            >
              <div className="flex items-center gap-2">
                <EyeOff className="w-3.5 h-3.5 text-amber-600" />
                <span>Hidden Items</span>
              </div>
            </button>
          </div>
        </div>

        {/* Categories Tree */}
        <div>
          <div className="flex items-center justify-between px-2 mb-1">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              Categories & Sections
            </p>
            {canCreateCat && (
              <button
                onClick={onOpenCreateCategory}
                className="text-teal-700 hover:text-teal-800 p-0.5 rounded hover:bg-teal-50"
                title="Add Category"
              >
                <FolderPlus className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="space-y-1">
            {filteredCategories.length === 0 ? (
              <p className="text-xs text-muted-foreground px-2 py-3 text-center">
                No matching categories.
              </p>
            ) : (
              filteredCategories.map((category) => {
                const isExpanded = query ? true : expandedCats.has(category.id);
                const isCatSelected =
                  activeSelection.type === "category" &&
                  activeSelection.categoryId === category.id;

                return (
                  <div key={category.id} className="space-y-0.5">
                    {/* Category Item */}
                    <div
                      onClick={() => onSelect({ type: "category", categoryId: category.id })}
                      className={`group flex items-center justify-between px-2 py-1.5 rounded-lg text-xs cursor-pointer transition-colors ${
                        isCatSelected
                          ? "bg-teal-100/70 text-teal-900 font-semibold"
                          : "text-foreground hover:bg-slate-100/80"
                      }`}
                    >
                      <div className="flex items-center gap-1.5 min-w-0 flex-1">
                        <button
                          onClick={(e) => toggleExpand(category.id, e)}
                          className="p-0.5 hover:bg-slate-200 rounded text-muted-foreground"
                        >
                          {isExpanded ? (
                            <ChevronDown className="w-3.5 h-3.5" />
                          ) : (
                            <ChevronRight className="w-3.5 h-3.5" />
                          )}
                        </button>
                        {isExpanded ? (
                          <FolderOpen className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                        ) : (
                          <Folder className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                        )}
                        <span className="truncate">{category.name}</span>
                        {category.isActive === false && (
                          <Badge variant="outline" className="text-[9px] px-1 py-0 text-amber-700 border-amber-300">
                            Hidden
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0 font-normal">
                          {category.count}
                        </Badge>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon-sm" className="h-6 w-6 text-muted-foreground">
                              <MoreVertical className="w-3.5 h-3.5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-40 text-xs">
                            {canCreateSec && (
                              <DropdownMenuItem onClick={() => onOpenCreateSection(category)}>
                                <Plus className="w-3.5 h-3.5 mr-2" /> Add Section
                              </DropdownMenuItem>
                            )}
                            {canUpdateCat && (
                              <DropdownMenuItem onClick={() => onOpenRenameCategory(category)}>
                                <Edit2 className="w-3.5 h-3.5 mr-2" /> Rename
                              </DropdownMenuItem>
                            )}
                            {canToggleCat && (
                              <DropdownMenuItem
                                onClick={() => handleToggleCatVisibility(category, category.isActive !== false)}
                              >
                                <EyeOff className="w-3.5 h-3.5 mr-2" />
                                {category.isActive !== false ? "Hide Category" : "Show Category"}
                              </DropdownMenuItem>
                            )}
                            {canDeleteCat && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => onDeleteCategory(category)}
                                  className="text-red-600 focus:text-red-700"
                                >
                                  <Trash2 className="w-3.5 h-3.5 mr-2" /> Delete
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>

                    {/* Section Sub-Items */}
                    {isExpanded && (
                      <div className="ml-5 pl-2 border-l border-border/80 space-y-0.5">
                        {category.sections.map((section) => {
                          const isSecSelected =
                            activeSelection.type === "section" &&
                            activeSelection.sectionId === section.id;

                          return (
                            <div
                              key={section.id}
                              onClick={() =>
                                onSelect({
                                  type: "section",
                                  categoryId: category.id,
                                  sectionId: section.id,
                                })
                              }
                              className={`group flex items-center justify-between px-2 py-1 rounded-md text-xs cursor-pointer transition-colors ${
                                isSecSelected
                                  ? "bg-teal-50 text-teal-800 font-semibold"
                                  : "text-muted-foreground hover:bg-slate-100 hover:text-foreground"
                              }`}
                            >
                              <div className="flex items-center gap-1.5 min-w-0 flex-1">
                                <BookOpen className="w-3 h-3 text-slate-500 shrink-0" />
                                <span className="truncate">{section.name}</span>
                                {section.isActive === false && (
                                  <Badge variant="outline" className="text-[9px] px-1 py-0 text-amber-700 border-amber-300">
                                    Hidden
                                  </Badge>
                                )}
                              </div>

                              <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                                <span className="text-[10px] text-muted-foreground">
                                  {section.documents.length}
                                </span>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon-sm" className="h-5 w-5 text-muted-foreground">
                                      <MoreVertical className="w-3 h-3" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" className="w-36 text-xs">
                                    {canUpdateSec && (
                                      <DropdownMenuItem onClick={() => onOpenRenameSection(section, category)}>
                                        <Edit2 className="w-3.5 h-3.5 mr-2" /> Rename
                                      </DropdownMenuItem>
                                    )}
                                    {canToggleSec && (
                                      <DropdownMenuItem
                                        onClick={() => handleToggleSecVisibility(section, section.isActive !== false)}
                                      >
                                        <EyeOff className="w-3.5 h-3.5 mr-2" />
                                        {section.isActive !== false ? "Hide Section" : "Show Section"}
                                      </DropdownMenuItem>
                                    )}
                                    {canDeleteSec && (
                                      <>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem
                                          onClick={() => onDeleteSection(section)}
                                          className="text-red-600 focus:text-red-700"
                                        >
                                          <Trash2 className="w-3.5 h-3.5 mr-2" /> Delete
                                        </DropdownMenuItem>
                                      </>
                                    )}
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}
```

- [ ] **Step 2: Verify TypeScript compilation**
Run: `npx tsc --noEmit` in `d:\FILES\SELF\knowledge-base\knowledge-base-frontend-`.
Expected: PASS (0 errors).

- [ ] **Step 3: Commit Task 5**
```bash
git add components/structure/StructureTreeSidebar.tsx
git commit -m "feat(structure): add interactive left tree navigator with search and quick views"
```

---

### Task 6: Main Dual-Pane Explorer & App Mounting

**Files:**
- Create: `d:/FILES/SELF/knowledge-base/knowledge-base-frontend-/components/structure/KnowledgeBaseExplorer.tsx`
- Modify: `d:/FILES/SELF/knowledge-base/knowledge-base-frontend-/app/admin/structure/page.tsx`

**Interfaces:**
- Produces: `<KnowledgeBaseExplorer />` component integrating left sidebar, top header, dynamic document views, modals, and preview drawer.
- Updates: `app/admin/structure/page.tsx` to mount `KnowledgeBaseExplorer`.

- [ ] **Step 1: Implement KnowledgeBaseExplorer.tsx**
Assemble the Dual-Pane Explorer & Workspace:
```tsx
"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useDocumentTree } from "@/hooks/use-document-tree";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Plus,
  Search,
  LayoutList,
  LayoutGrid,
  FolderPlus,
  BookPlus,
  FilePlus,
  Loader2,
  Folder,
} from "lucide-react";
import { StructureTreeSidebar } from "./StructureTreeSidebar";
import { DocumentListView } from "./DocumentListView";
import { DocumentGridView } from "./DocumentGridView";
import { DocumentPreviewDrawer } from "./DocumentPreviewDrawer";
import { MoveDocumentDialog } from "./MoveDocumentDialog";
import { CategoryModal } from "./CategoryModal";
import { SectionModal } from "./SectionModal";
import type { CategoryNode, SectionNode } from "@/lib/api/documents.api";
import type { ActiveSelection, ViewMode, FlatDocument, SortField, SortOrder } from "./types";
import { toast } from "sonner";

export function KnowledgeBaseExplorer() {
  const router = useRouter();
  const { user, hasPermission } = useAuth();
  const { categories, isLoading, deleteCategory, deleteSection, deleteDocument } = useDocumentTree();

  // ── Permissions ────────────────────────────────────────────────────────────
  const canCreateCat = hasPermission("structure:category:create");
  const canCreateSec = hasPermission("structure:section:create");
  const canCreateContent = hasPermission("content:create");

  // ── State ──────────────────────────────────────────────────────────────────
  const [activeSelection, setActiveSelection] = useState<ActiveSelection>({ type: "all" });
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "hidden">("all");
  const [sortField, setSortField] = useState<SortField>("title");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");

  // Drawers & Modals
  const [previewDoc, setPreviewDoc] = useState<FlatDocument | null>(null);
  const [moveDoc, setMoveDoc] = useState<FlatDocument | null>(null);

  const [categoryModal, setCategoryModal] = useState<{
    isOpen: boolean;
    mode: "create" | "rename";
    categoryId?: string;
    initialName?: string;
  }>({ isOpen: false, mode: "create" });

  const [sectionModal, setSectionModal] = useState<{
    isOpen: boolean;
    mode: "create" | "rename";
    categoryId: string;
    categoryName: string;
    sectionId?: string;
    initialName?: string;
  }>({ isOpen: false, mode: "create", categoryId: "", categoryName: "" });

  // Delete Confirmations
  const [deleteTarget, setDeleteTarget] = useState<{
    type: "category" | "section" | "document";
    id: string;
    name: string;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // ── Flatten All Documents for Filter/Search ────────────────────────────────
  const allFlatDocuments = useMemo(() => {
    const list: FlatDocument[] = [];
    categories.forEach((cat) => {
      cat.sections.forEach((sec) => {
        sec.documents.forEach((doc) => {
          list.push({
            ...doc,
            categoryId: cat.id,
            categoryName: cat.name,
            categoryIsActive: cat.isActive !== false,
            sectionId: sec.id,
            sectionName: sec.name,
            sectionIsActive: sec.isActive !== false,
          });
        });
      });
    });
    return list;
  }, [categories]);

  // ── Filtered & Sorted Workspace Documents ─────────────────────────────────
  const displayedDocuments = useMemo(() => {
    let result = allFlatDocuments;

    // Filter by Active Selection
    if (activeSelection.type === "my_docs") {
      result = result.filter(
        (doc) =>
          doc.owner?._id === user?.id ||
          doc.contributors?.some((c) => c._id === user?.id)
      );
    } else if (activeSelection.type === "hidden") {
      result = result.filter(
        (doc) => !doc.categoryIsActive || !doc.sectionIsActive
      );
    } else if (activeSelection.type === "category") {
      result = result.filter((doc) => doc.categoryId === activeSelection.categoryId);
    } else if (activeSelection.type === "section") {
      result = result.filter((doc) => doc.sectionId === activeSelection.sectionId);
    }

    // Filter by Status Dropdown
    if (statusFilter === "active") {
      result = result.filter((doc) => doc.categoryIsActive && doc.sectionIsActive);
    } else if (statusFilter === "hidden") {
      result = result.filter((doc) => !doc.categoryIsActive || !doc.sectionIsActive);
    }

    // Filter by Search Query
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      result = result.filter(
        (doc) =>
          doc.title.toLowerCase().includes(q) ||
          (doc.docId && doc.docId.toLowerCase().includes(q)) ||
          doc.categoryName.toLowerCase().includes(q) ||
          doc.sectionName.toLowerCase().includes(q) ||
          (doc.owner?.name && doc.owner.name.toLowerCase().includes(q))
      );
    }

    // Sort
    return result.sort((a, b) => {
      let comparison = 0;
      if (sortField === "title") {
        comparison = a.title.localeCompare(b.title);
      } else if (sortField === "updatedAt") {
        comparison =
          new Date(a.updatedAt || 0).getTime() - new Date(b.updatedAt || 0).getTime();
      } else if (sortField === "docId") {
        comparison = (a.docId || "").localeCompare(b.docId || "");
      }
      return sortOrder === "asc" ? comparison : -comparison;
    });
  }, [allFlatDocuments, activeSelection, statusFilter, searchQuery, sortField, sortOrder, user?.id]);

  // ── Context Title ─────────────────────────────────────────────────────────
  const contextTitle = useMemo(() => {
    if (activeSelection.type === "all") return "All Documents";
    if (activeSelection.type === "my_docs") return "My Documents";
    if (activeSelection.type === "hidden") return "Hidden Items";
    if (activeSelection.type === "category") {
      const cat = categories.find((c) => c.id === activeSelection.categoryId);
      return cat ? cat.name : "Category";
    }
    if (activeSelection.type === "section") {
      for (const cat of categories) {
        const sec = cat.sections.find((s) => s.id === activeSelection.sectionId);
        if (sec) return `${cat.name} › ${sec.name}`;
      }
    }
    return "Knowledge Base";
  }, [activeSelection, categories]);

  // ── Actions ────────────────────────────────────────────────────────────────
  const handleOpenNewDocument = () => {
    let url = "/admin/structure/new";
    if (activeSelection.type === "category") {
      const cat = categories.find((c) => c.id === activeSelection.categoryId);
      const firstSec = cat?.sections[0]?.id;
      if (firstSec) url += `?categoryId=${cat.id}&sectionId=${firstSec}`;
    } else if (activeSelection.type === "section") {
      url += `?categoryId=${activeSelection.categoryId}&sectionId=${activeSelection.sectionId}`;
    }
    router.push(url);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      if (deleteTarget.type === "category") {
        await deleteCategory(deleteTarget.id);
        toast.success(`Deleted category "${deleteTarget.name}"`);
        if (activeSelection.type === "category" && activeSelection.categoryId === deleteTarget.id) {
          setActiveSelection({ type: "all" });
        }
      } else if (deleteTarget.type === "section") {
        await deleteSection(deleteTarget.id);
        toast.success(`Deleted section "${deleteTarget.name}"`);
        if (activeSelection.type === "section" && activeSelection.sectionId === deleteTarget.id) {
          setActiveSelection({ type: "all" });
        }
      } else if (deleteTarget.type === "document") {
        await deleteDocument(deleteTarget.id);
        toast.success(`Deleted document "${deleteTarget.name}"`);
      }
      setDeleteTarget(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Deletion failed");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* ── Top Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">
            Knowledge Base Explorer
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Organize knowledge base categories, departmental sections, and documents
          </p>
        </div>

        {/* Global Action CTAs */}
        <div className="flex items-center gap-2 flex-wrap">
          {canCreateCat && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCategoryModal({ isOpen: true, mode: "create" })}
              className="gap-1.5 text-xs text-muted-foreground hover:text-foreground"
            >
              <FolderPlus className="w-3.5 h-3.5" />
              <span>+ Category</span>
            </Button>
          )}

          {canCreateSec && categories.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const targetCat =
                  activeSelection.type === "category"
                    ? categories.find((c) => c.id === activeSelection.categoryId)
                    : activeSelection.type === "section"
                    ? categories.find((c) => c.id === activeSelection.categoryId)
                    : categories[0];
                if (targetCat) {
                  setSectionModal({
                    isOpen: true,
                    mode: "create",
                    categoryId: targetCat.id,
                    categoryName: targetCat.name,
                  });
                }
              }}
              className="gap-1.5 text-xs text-muted-foreground hover:text-foreground"
            >
              <BookPlus className="w-3.5 h-3.5" />
              <span>+ Section</span>
            </Button>
          )}

          {canCreateContent && (
            <Button
              size="sm"
              onClick={handleOpenNewDocument}
              className="gap-1.5 bg-teal-600 hover:bg-teal-700 text-white text-xs shadow-xs"
            >
              <FilePlus className="w-3.5 h-3.5" />
              <span>New Document</span>
            </Button>
          )}
        </div>
      </div>

      {/* ── Dual-Pane Layout Shell ── */}
      <div className="flex flex-col lg:flex-row gap-5 items-start">
        {/* Left Tree Sidebar */}
        <StructureTreeSidebar
          categories={categories}
          activeSelection={activeSelection}
          onSelect={setActiveSelection}
          onOpenCreateCategory={() => setCategoryModal({ isOpen: true, mode: "create" })}
          onOpenRenameCategory={(cat: CategoryNode) =>
            setCategoryModal({
              isOpen: true,
              mode: "rename",
              categoryId: cat.id,
              initialName: cat.name,
            })
          }
          onOpenCreateSection={(cat: CategoryNode) =>
            setSectionModal({
              isOpen: true,
              mode: "create",
              categoryId: cat.id,
              categoryName: cat.name,
            })
          }
          onOpenRenameSection={(sec: SectionNode, cat: CategoryNode) =>
            setSectionModal({
              isOpen: true,
              mode: "rename",
              categoryId: cat.id,
              categoryName: cat.name,
              sectionId: sec.id,
              initialName: sec.name,
            })
          }
          onDeleteCategory={(cat: CategoryNode) =>
            setDeleteTarget({ type: "category", id: cat.id, name: cat.name })
          }
          onDeleteSection={(sec: SectionNode) =>
            setDeleteTarget({ type: "section", id: sec.id, name: sec.name })
          }
          totalDocsCount={allFlatDocuments.length}
        />

        {/* Right Main Workspace */}
        <main className="flex-1 w-full bg-white border border-border rounded-xl p-5 shadow-2xs space-y-4">
          {/* Workspace Title & Toolbar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/80">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-foreground">{contextTitle}</h2>
                <Badge variant="secondary" className="text-xs font-normal">
                  {displayedDocuments.length} doc{displayedDocuments.length !== 1 ? "s" : ""}
                </Badge>
              </div>
            </div>

            {/* View Mode & Filter Controls */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Search */}
              <div className="relative w-48 sm:w-56">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search in view..."
                  className="pl-8 h-8 text-xs bg-slate-50 border-border"
                />
              </div>

              {/* Status Filter */}
              <Select
                value={statusFilter}
                onValueChange={(v) => setStatusFilter(v as "all" | "active" | "hidden")}
              >
                <SelectTrigger className="h-8 text-xs w-28">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active Only</SelectItem>
                  <SelectItem value="hidden">Hidden Only</SelectItem>
                </SelectContent>
              </Select>

              {/* List / Grid Toggle */}
              <div className="flex items-center border border-border rounded-lg p-0.5 bg-slate-50">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => setViewMode("list")}
                  className={`h-7 w-7 rounded ${viewMode === "list" ? "bg-white shadow-2xs text-teal-700" : "text-muted-foreground"}`}
                  title="List View"
                >
                  <LayoutList className="w-3.5 h-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => setViewMode("grid")}
                  className={`h-7 w-7 rounded ${viewMode === "grid" ? "bg-white shadow-2xs text-teal-700" : "text-muted-foreground"}`}
                  title="Grid View"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          </div>

          {/* Document Content List / Grid */}
          {isLoading ? (
            <div className="space-y-3 py-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 rounded-xl bg-muted animate-pulse" />
              ))}
            </div>
          ) : displayedDocuments.length === 0 ? (
            <div className="p-12 text-center border-dashed border border-border/80 rounded-xl bg-slate-50/50">
              <Folder className="w-10 h-10 text-muted-foreground/40 mx-auto mb-2" />
              <h3 className="text-base font-semibold text-foreground">No documents found</h3>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                {searchQuery
                  ? `No documents matched "${searchQuery}".`
                  : "No documents in this view. Click below to create your first document."}
              </p>
              {canCreateContent && (
                <Button
                  size="sm"
                  onClick={handleOpenNewDocument}
                  className="mt-4 gap-1.5 bg-teal-600 hover:bg-teal-700 text-white text-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create Document</span>
                </Button>
              )}
            </div>
          ) : viewMode === "list" ? (
            <DocumentListView
              documents={displayedDocuments}
              onPreview={setPreviewDoc}
              onEdit={(id) => router.push(`/admin/structure/${id}/edit`)}
              onMove={setMoveDoc}
              onDelete={(doc) =>
                setDeleteTarget({ type: "document", id: doc._id, name: doc.title })
              }
            />
          ) : (
            <DocumentGridView
              documents={displayedDocuments}
              onPreview={setPreviewDoc}
              onEdit={(id) => router.push(`/admin/structure/${id}/edit`)}
              onMove={setMoveDoc}
              onDelete={(doc) =>
                setDeleteTarget({ type: "document", id: doc._id, name: doc.title })
              }
            />
          )}
        </main>
      </div>

      {/* ── Slide-Over Document Preview Drawer ── */}
      <DocumentPreviewDrawer
        activeDoc={previewDoc}
        onClose={() => setPreviewDoc(null)}
        onOpenEdit={(id) => {
          setPreviewDoc(null);
          router.push(`/admin/structure/${id}/edit`);
        }}
        onOpenMove={(doc) => {
          setPreviewDoc(null);
          setMoveDoc(doc);
        }}
      />

      {/* ── Move Document Placement Dialog ── */}
      {moveDoc && (
        <MoveDocumentDialog
          isOpen={!!moveDoc}
          documentId={moveDoc._id}
          documentTitle={moveDoc.title}
          currentCategoryId={moveDoc.categoryId}
          currentSectionId={moveDoc.sectionId}
          onClose={() => setMoveDoc(null)}
        />
      )}

      {/* ── Category Create / Rename Modal ── */}
      <CategoryModal
        isOpen={categoryModal.isOpen}
        mode={categoryModal.mode}
        categoryId={categoryModal.categoryId}
        initialName={categoryModal.initialName}
        onClose={() => setCategoryModal({ isOpen: false, mode: "create" })}
      />

      {/* ── Section Create / Rename Modal ── */}
      <SectionModal
        isOpen={sectionModal.isOpen}
        mode={sectionModal.mode}
        categoryId={sectionModal.categoryId}
        categoryName={sectionModal.categoryName}
        sectionId={sectionModal.sectionId}
        initialName={sectionModal.initialName}
        onClose={() =>
          setSectionModal({
            isOpen: false,
            mode: "create",
            categoryId: "",
            categoryName: "",
          })
        }
      />

      {/* ── Delete Confirmation Dialog ── */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete {deleteTarget?.type} &ldquo;{deleteTarget?.name}&rdquo;?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget?.type === "category"
                ? "This will permanently delete this category, along with all of its sections and documents."
                : deleteTarget?.type === "section"
                ? "This will permanently delete this section and all of its documents."
                : "This will permanently delete this document. This action cannot be undone."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleConfirmDelete();
              }}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isDeleting ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : null}
              Confirm Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
```

- [ ] **Step 2: Update app/admin/structure/page.tsx**
Replace the 924-line monolith with a clean entrypoint mounting `<KnowledgeBaseExplorer />`:
```tsx
"use client";

import { KnowledgeBaseExplorer } from "@/components/structure/KnowledgeBaseExplorer";

export default function StructureManagementPage() {
  return <KnowledgeBaseExplorer />;
}
```

- [ ] **Step 3: Verify TypeScript compilation**
Run: `npx tsc --noEmit` in `d:\FILES\SELF\knowledge-base\knowledge-base-frontend-`.
Expected: PASS (0 errors).

- [ ] **Step 4: Commit Task 6**
```bash
git add components/structure/KnowledgeBaseExplorer.tsx app/admin/structure/page.tsx
git commit -m "feat(structure): implement dual-pane knowledge base explorer and mount in structure page"
```

---

### Task 7: Full System Verification & Code Quality Review

**Files:**
- All modified and created files in `components/structure/` and `app/admin/structure/`.

- [ ] **Step 1: Run TypeScript verification across frontend**
Run: `npx tsc --noEmit` in `d:\FILES\SELF\knowledge-base\knowledge-base-frontend-`.
Expected: 0 errors.

- [ ] **Step 2: Run TypeScript verification across backend**
Run: `npx tsc --noEmit` in `d:\FILES\SELF\knowledge-base\knowledge-base-backend`.
Expected: 0 errors.

- [ ] **Step 3: Audit all permission gates**
Verify that every button, dropdown, and dialog in `components/structure/` cleanly respects the fine-grained permission tokens.

- [ ] **Step 4: Final Git Commit and Status Check**
Ensure git status is clean and all commits adhere to Conventional Commits format.
