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
  ChevronRight,
  X,
} from "lucide-react";
import { StructureTreeSidebar } from "./StructureTreeSidebar";
import { DocumentListView } from "./DocumentListView";
import { DocumentGridView } from "./DocumentGridView";
import { DocumentDetailModal } from "./DocumentDetailModal";
import { MoveDocumentDialog } from "./MoveDocumentDialog";
import { CategoryModal } from "./CategoryModal";
import { SectionModal } from "./SectionModal";
import type { CategoryNode, SectionNode } from "@/lib/api/documents.api";
import type { ActiveSelection, ViewMode, FlatDocument, SortField, SortOrder } from "./types";
import { toast } from "sonner";

interface KnowledgeBaseExplorerProps {
  title?: string;
  subtitle?: string;
  defaultViewMode?: ViewMode;
}

export function KnowledgeBaseExplorer({
  title = "Documents",
  subtitle = "Browse, filter, preview, and manage documents across your organizational structure",
  defaultViewMode = "list",
}: KnowledgeBaseExplorerProps = {}) {
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

  // ── View Context & Breadcrumb ─────────────────────────────────────────────
  const viewContext = useMemo(() => {
    if (activeSelection.type === "all") {
      return {
        title: "All Documents",
        breadcrumb: null,
      };
    }
    if (activeSelection.type === "my_docs") {
      return {
        title: "My Documents",
        breadcrumb: ["Quick Views", "My Documents"],
      };
    }
    if (activeSelection.type === "hidden") {
      return {
        title: "Hidden Items",
        breadcrumb: ["Quick Views", "Hidden Items"],
      };
    }
    if (activeSelection.type === "category") {
      const cat = categories.find((c) => String(c.id) === String(activeSelection.categoryId));
      return {
        title: cat ? cat.name : "Category",
        breadcrumb: ["Categories", cat ? cat.name : "Category"],
      };
    }
    if (activeSelection.type === "section") {
      for (const cat of categories) {
        const sec = cat.sections.find((s) => String(s.id) === String(activeSelection.sectionId));
        if (sec) {
          return {
            title: sec.name,
            breadcrumb: [cat.name, sec.name],
          };
        }
      }
    }
    return {
      title: "Knowledge Base",
      breadcrumb: null,
    };
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
    <div className="space-y-6 w-full pb-12">
      {/* ── Top Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">
            {title}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {subtitle}
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
          {/* Workspace Header: Title, Breadcrumb & Count */}
          <div className="pb-4 border-b border-border/70 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                {viewContext.breadcrumb && (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1 font-medium">
                    <span>{viewContext.breadcrumb[0]}</span>
                    <ChevronRight className="w-3 h-3 text-muted-foreground/50 shrink-0" />
                    <span className="text-teal-700 font-semibold">{viewContext.breadcrumb[1]}</span>
                  </div>
                )}
                <div className="flex items-center gap-2.5">
                  <h2 className="text-xl font-bold text-foreground tracking-tight">
                    {viewContext.title}
                  </h2>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
                    {displayedDocuments.length} {displayedDocuments.length === 1 ? "doc" : "docs"}
                  </span>
                </div>
              </div>

              {/* Quick create button inside workspace header */}
              {canCreateContent && (
                <Button
                  size="sm"
                  onClick={handleOpenNewDocument}
                  className="self-start sm:self-auto gap-1.5 bg-teal-600 hover:bg-teal-700 text-white text-xs h-8 font-medium shadow-2xs"
                >
                  <FilePlus className="w-3.5 h-3.5" />
                  <span>New Document</span>
                </Button>
              )}
            </div>

            {/* Dedicated Search & Filter Toolbar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-1">
              {/* Search input with Clear button */}
              <div className="relative flex-1 sm:max-w-xs">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search in view..."
                  className="pl-8 pr-7 h-8 text-xs bg-slate-50 hover:bg-slate-100/70 focus:bg-white border-border/80 rounded-md transition-colors"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5 rounded-full transition-colors"
                    title="Clear search"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>

              {/* Filter & View Mode Controls */}
              <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                <Select
                  value={statusFilter}
                  onValueChange={(v) => setStatusFilter(v as "all" | "active" | "hidden")}
                >
                  <SelectTrigger className="h-8 text-xs w-28 bg-slate-50 hover:bg-slate-100/70 border-border/80">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-border shadow-lg">
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active Only</SelectItem>
                    <SelectItem value="hidden">Hidden Only</SelectItem>
                  </SelectContent>
                </Select>

                <div className="flex items-center border border-border/80 rounded-md p-0.5 bg-slate-50">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => setViewMode("list")}
                    className={`h-7 w-7 rounded-sm transition-all ${
                      viewMode === "list"
                        ? "bg-white shadow-2xs text-teal-700 font-semibold"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                    title="List View"
                  >
                    <LayoutList className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => setViewMode("grid")}
                    className={`h-7 w-7 rounded-sm transition-all ${
                      viewMode === "grid"
                        ? "bg-white shadow-2xs text-teal-700 font-semibold"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                    title="Grid View"
                  >
                    <LayoutGrid className="w-3.5 h-3.5" />
                  </Button>
                </div>
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
              {searchQuery ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSearchQuery("")}
                  className="mt-4 text-xs"
                >
                  Clear Search Filter
                </Button>
              ) : canCreateContent ? (
                <Button
                  size="sm"
                  onClick={handleOpenNewDocument}
                  className="mt-4 gap-1.5 bg-teal-600 hover:bg-teal-700 text-white text-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create Document</span>
                </Button>
              ) : null}
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

      {/* ── Document Detail Centered Modal Dialog ── */}
      <DocumentDetailModal
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
