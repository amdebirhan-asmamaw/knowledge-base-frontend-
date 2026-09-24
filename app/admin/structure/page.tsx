"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useDocumentTree } from "@/hooks/use-document-tree";
import { useAuth } from "@/hooks/use-auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { UserChip } from "@/components/UserChip";
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
  Trash2,
  ChevronDown,
  ChevronRight,
  Loader2,
  AlertCircle,
  Folder,
  BookOpen,
  FileText,
  Edit2,
  Check,
  X,
  Search,
  Eye,
  ChevronsUpDown,
  FileCheck,
  Layers,
} from "lucide-react";

export default function StructureManagementPage() {
  const router = useRouter();
  const { user, hasPermission, hasScopePermission } = useAuth();
  const {
    categories,
    isLoading,
    createCategory,
    updateCategory,
    createSection,
    updateSection,
    deleteCategory,
    deleteSection,
  } = useDocumentTree();

  // ── Permissions ────────────────────────────────────────────────────────────
  const canCreateStructure = hasPermission("structure:create");
  const canUpdateStructure = hasPermission("structure:update");
  const canDeleteStructure = hasPermission("structure:delete");
  const canCreateContent = hasPermission("content:create");
  const canUpdateContentAll = hasPermission("content:update:all");

  // ── Expansion state (Set-based multi-expand) ────────────────────────────────
  const [expandedCats, setExpandedCats] = useState<Set<string>>(new Set());
  const [expandedSecs, setExpandedSecs] = useState<Set<string>>(new Set());

  // ── Search & Filter state ──────────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState("");

  // ── Creation & Action state ────────────────────────────────────────────────
  const [newCatName, setNewCatName] = useState("");
  const [addingSectionToCat, setAddingSectionToCat] = useState<string | null>(null);
  const [newSecName, setNewSecName] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  // ── Inline rename state ────────────────────────────────────────────────────
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [editingCatName, setEditingCatName] = useState("");
  const [editingSecId, setEditingSecId] = useState<string | null>(null);
  const [editingSecName, setEditingSecName] = useState("");

  // ── Delete confirmation state ──────────────────────────────────────────────
  const [deleteCatTarget, setDeleteCatTarget] = useState<{ id: string; name: string } | null>(null);
  const [deleteSecTarget, setDeleteSecTarget] = useState<{ id: string; name: string } | null>(null);

  // ─── Filtered categories and auto-expand on search ─────────────────────────
  const { filteredCategories, totalDocsCount, hiddenCount } = useMemo(() => {
    let totalDocs = 0;
    let hidden = 0;

    const query = searchQuery.trim().toLowerCase();

    const filtered = categories
      .map((cat) => {
        if (cat.isActive === false) hidden++;
        const catMatches = cat.name.toLowerCase().includes(query);

        const filteredSections = cat.sections
          .map((sec) => {
            if (sec.isActive === false) hidden++;
            const secMatches = sec.name.toLowerCase().includes(query);

            const filteredDocs = sec.documents.filter((doc) => {
              totalDocs++;
              if (!query) return true;
              return (
                doc.title.toLowerCase().includes(query) ||
                (doc.docId && doc.docId.toLowerCase().includes(query))
              );
            });

            if (!query) return { ...sec, documents: filteredDocs };
            if (catMatches || secMatches || filteredDocs.length > 0) {
              return { ...sec, documents: filteredDocs };
            }
            return null;
          })
          .filter(Boolean) as typeof cat.sections;

        if (!query) return cat;
        if (catMatches || filteredSections.length > 0) {
          return {
            ...cat,
            sections: filteredSections,
          };
        }
        return null;
      })
      .filter(Boolean) as typeof categories;

    return { filteredCategories: filtered, totalDocsCount: totalDocs, hiddenCount: hidden };
  }, [categories, searchQuery]);

  // ─── Expand / Collapse helpers ─────────────────────────────────────────────
  const toggleCat = (id: string) => {
    setExpandedCats((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSec = (id: string) => {
    setExpandedSecs((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const expandAll = () => {
    setExpandedCats(new Set(categories.map((c) => c.id)));
    const secIds: string[] = [];
    categories.forEach((c) => c.sections.forEach((s) => secIds.push(s.id)));
    setExpandedSecs(new Set(secIds));
  };

  const collapseAll = () => {
    setExpandedCats(new Set());
    setExpandedSecs(new Set());
  };

  // ─── Navigation helpers (Separated View vs Edit) ───────────────────────────
  const openViewDocument = (documentId: string) =>
    router.push(`/admin/structure/${documentId}`);

  const openEditDocument = (documentId: string) =>
    router.push(`/admin/structure/${documentId}/edit`);

  const openNewDocument = (categoryId: string, sectionId: string) =>
    router.push(`/admin/structure/new?categoryId=${categoryId}&sectionId=${sectionId}`);

  const withBusy = async (id: string, fn: () => Promise<void>) => {
    setBusyId(id);
    setActionError(null);
    try {
      await fn();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Action failed";
      setActionError(msg);
      toast.error(msg);
    } finally {
      setBusyId(null);
    }
  };

  // ── Creation handlers ──────────────────────────────────────────────────────
  const handleAddCategory = () => {
    if (!newCatName.trim()) return;
    withBusy("new-cat", async () => {
      await createCategory(newCatName.trim());
      toast.success(`Category "${newCatName.trim()}" created`);
      setNewCatName("");
    });
  };

  const handleAddSection = (categoryId: string) => {
    if (!newSecName.trim()) return;
    withBusy(`new-sec-${categoryId}`, async () => {
      await createSection(categoryId, newSecName.trim());
      toast.success(`Section "${newSecName.trim()}" created`);
      setNewSecName("");
      setAddingSectionToCat(null);
      // Keep category expanded so new section is visible
      setExpandedCats((prev) => new Set(prev).add(categoryId));
    });
  };

  // ── Delete executions ──────────────────────────────────────────────────────
  const confirmDeleteCategory = () => {
    if (!deleteCatTarget) return;
    const { id, name } = deleteCatTarget;
    withBusy(`del-cat-${id}`, async () => {
      await deleteCategory(id);
      toast.success(`Deleted category "${name}"`);
      setDeleteCatTarget(null);
    });
  };

  const confirmDeleteSection = () => {
    if (!deleteSecTarget) return;
    const { id, name } = deleteSecTarget;
    withBusy(`del-sec-${id}`, async () => {
      await deleteSection(id);
      toast.success(`Deleted section "${name}"`);
      setDeleteSecTarget(null);
    });
  };

  // ── Rename handlers ────────────────────────────────────────────────────────
  const startEditCategory = (id: string, currentName: string) => {
    setEditingCatId(id);
    setEditingCatName(currentName);
  };

  const cancelEditCategory = () => {
    setEditingCatId(null);
    setEditingCatName("");
  };

  const handleRenameCategory = (id: string) => {
    if (!editingCatName.trim()) return;
    withBusy(`rename-cat-${id}`, async () => {
      await updateCategory(id, { name: editingCatName.trim() });
      toast.success("Category renamed");
      cancelEditCategory();
    });
  };

  const startEditSection = (id: string, currentName: string) => {
    setEditingSecId(id);
    setEditingSecName(currentName);
  };

  const cancelEditSection = () => {
    setEditingSecId(null);
    setEditingSecName("");
  };

  const handleRenameSection = (id: string) => {
    if (!editingSecName.trim()) return;
    withBusy(`rename-sec-${id}`, async () => {
      await updateSection(id, { name: editingSecName.trim() });
      toast.success("Section renamed");
      cancelEditSection();
    });
  };

  // ── Visibility toggle handlers ─────────────────────────────────────────────
  const handleToggleCategory = (id: string, currentActive: boolean) => {
    withBusy(`toggle-cat-${id}`, async () => {
      await updateCategory(id, { isActive: !currentActive });
      toast.success(!currentActive ? "Category is now visible" : "Category hidden from public view");
    });
  };

  const handleToggleSection = (id: string, currentActive: boolean) => {
    withBusy(`toggle-sec-${id}`, async () => {
      await updateSection(id, { isActive: !currentActive });
      toast.success(!currentActive ? "Section is now visible" : "Section hidden from public view");
    });
  };

  // Can user edit a specific document?
  const canEditDoc = (docOwnerId?: string | null) => {
    if (canUpdateContentAll) return true;
    if (docOwnerId && user?.id === docOwnerId && hasScopePermission("content", "update", "own")) return true;
    return false;
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Knowledge Base Structure</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Organize knowledge base categories, departmental sections, and documents
          </p>
        </div>

        {/* Expand/Collapse All */}
        {categories.length > 0 && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={expandedCats.size > 0 ? collapseAll : expandAll}
              className="gap-1.5 text-xs text-muted-foreground hover:text-foreground"
            >
              <ChevronsUpDown className="w-3.5 h-3.5" />
              <span>{expandedCats.size > 0 ? "Collapse All" : "Expand All"}</span>
            </Button>
          </div>
        )}
      </div>

      {/* ── Summary Metric Pills ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="p-3.5 border bg-white shadow-2xs flex items-center gap-3">
          <div className="p-2 rounded-lg bg-teal-50 text-teal-700">
            <Folder className="w-4 h-4" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Categories</p>
            <p className="text-lg font-bold text-foreground leading-tight">{categories.length}</p>
          </div>
        </Card>

        <Card className="p-3.5 border bg-white shadow-2xs flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-50 text-blue-700">
            <BookOpen className="w-4 h-4" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Sections</p>
            <p className="text-lg font-bold text-foreground leading-tight">
              {categories.reduce((acc, c) => acc + c.sections.length, 0)}
            </p>
          </div>
        </Card>

        <Card className="p-3.5 border bg-white shadow-2xs flex items-center gap-3">
          <div className="p-2 rounded-lg bg-emerald-50 text-emerald-700">
            <FileCheck className="w-4 h-4" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Documents</p>
            <p className="text-lg font-bold text-foreground leading-tight">{totalDocsCount}</p>
          </div>
        </Card>

        <Card className="p-3.5 border bg-white shadow-2xs flex items-center gap-3">
          <div className="p-2 rounded-lg bg-amber-50 text-amber-700">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Hidden Items</p>
            <p className="text-lg font-bold text-foreground leading-tight">{hiddenCount}</p>
          </div>
        </Card>
      </div>

      {/* ── Error Banner ── */}
      {actionError && (
        <div className="flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <span className="flex-1">{actionError}</span>
          <button onClick={() => setActionError(null)} className="text-red-500 hover:text-red-800">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ── Search Bar ── */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Filter by document title, ID, section, or category name..."
          className="pl-9 pr-9 bg-white"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* ── Add Category (if user has structure:create) ── */}
      {canCreateStructure && (
        <Card className="p-4 sm:p-5 border bg-white shadow-xs">
          <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <Folder className="w-4 h-4 text-teal-600" />
            Add New Category
          </h2>
          <div className="flex gap-2">
            <Input
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              placeholder='e.g., "HR Policies", "Engineering", or "Operations"'
              onKeyDown={(e) => e.key === "Enter" && handleAddCategory()}
              className="flex-1"
            />
            <Button
              onClick={handleAddCategory}
              disabled={!newCatName.trim() || busyId === "new-cat"}
              className="shrink-0 gap-1.5 bg-teal-600 hover:bg-teal-700 text-white"
            >
              {busyId === "new-cat" ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              Add Category
            </Button>
          </div>
        </Card>
      )}

      {/* ── Categories Tree ── */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : filteredCategories.length === 0 ? (
        <Card className="p-12 text-center border-dashed bg-white">
          <Folder className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-foreground">
            {searchQuery ? "No matching items found" : "No categories yet"}
          </h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
            {searchQuery
              ? `No documents, sections, or categories matched "${searchQuery}".`
              : "Create your first category above to begin structuring the knowledge base."}
          </p>
          {searchQuery && (
            <Button onClick={() => setSearchQuery("")} variant="outline" size="sm" className="mt-4">
              Clear Search Filter
            </Button>
          )}
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredCategories.map((category) => {
            // If search is active, automatically expand categories with matches
            const isCatExpanded = searchQuery ? true : expandedCats.has(category.id);
            const isDeleting = busyId === `del-cat-${category.id}`;

            return (
              <Card key={category.id} className="overflow-hidden border bg-white shadow-xs p-0 transition-all">
                {/* ── Category Header Row ── */}
                <div
                  className="flex items-center justify-between px-4 py-3.5 cursor-pointer hover:bg-slate-50/80 transition-colors select-none"
                  onClick={() => toggleCat(category.id)}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="p-1.5 rounded-md bg-teal-50 shrink-0 text-teal-700">
                      {isCatExpanded ? (
                        <ChevronDown className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronRight className="w-3.5 h-3.5" />
                      )}
                    </div>

                    {editingCatId === category.id ? (
                      /* ── Inline rename input ── */
                      <div className="flex items-center gap-1.5 flex-1 min-w-0" onClick={(e) => e.stopPropagation()}>
                        <Input
                          autoFocus
                          value={editingCatName}
                          onChange={(e) => setEditingCatName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleRenameCategory(category.id);
                            if (e.key === "Escape") cancelEditCategory();
                          }}
                          className="h-8 text-sm font-semibold flex-1"
                        />
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          disabled={busyId === `rename-cat-${category.id}`}
                          onClick={() => handleRenameCategory(category.id)}
                          className="text-green-600 hover:text-green-700 hover:bg-green-50 shrink-0"
                        >
                          {busyId === `rename-cat-${category.id}` ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Check className="w-4 h-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={cancelEditCategory}
                          className="text-muted-foreground hover:text-foreground shrink-0"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      /* ── Normal Category Label & Badges ── */
                      <div className="flex items-center gap-2.5 min-w-0 flex-wrap">
                        <span className={`font-semibold text-sm truncate ${category.isActive !== false ? "text-foreground" : "text-muted-foreground"}`}>
                          {category.name}
                        </span>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {category.isActive === false && (
                            <Badge variant="outline" className="text-[11px] font-normal text-amber-700 border-amber-300 bg-amber-50">
                              Hidden
                            </Badge>
                          )}
                          <Badge variant="secondary" className="text-xs font-normal">
                            {category.sections.length} section{category.sections.length !== 1 ? "s" : ""}
                          </Badge>
                          <Badge variant="secondary" className="text-xs font-normal">
                            {category.count} doc{category.count !== 1 ? "s" : ""}
                          </Badge>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions for Category */}
                  <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                    {/* Visibility Switch */}
                    {canUpdateStructure && (
                      <div
                        className="flex items-center gap-1 mr-1"
                        title={category.isActive !== false ? "Visible to users — click to hide" : "Hidden from users — click to show"}
                      >
                        <Switch
                          checked={category.isActive !== false}
                          onCheckedChange={() => handleToggleCategory(category.id, category.isActive !== false)}
                          disabled={busyId === `toggle-cat-${category.id}`}
                          className="scale-85"
                        />
                      </div>
                    )}

                    {/* Rename */}
                    {canUpdateStructure && editingCatId !== category.id && (
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => startEditCategory(category.id, category.name)}
                        className="text-muted-foreground hover:text-teal-700 hover:bg-teal-50"
                        title="Rename category"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </Button>
                    )}

                    {/* Delete Category */}
                    {canDeleteStructure && (
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        disabled={isDeleting}
                        onClick={() => setDeleteCatTarget({ id: category.id, name: category.name })}
                        className="text-muted-foreground hover:text-red-600 hover:bg-red-50"
                        title="Delete category"
                      >
                        {isDeleting ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="w-3.5 h-3.5" />
                        )}
                      </Button>
                    )}
                  </div>
                </div>

                {/* ── Category Sections ── */}
                {isCatExpanded && (
                  <div className="border-t border-border bg-slate-50/50 p-4 space-y-2.5">
                    {category.sections.length === 0 && addingSectionToCat !== category.id && (
                      <p className="text-xs text-muted-foreground ml-7 py-1">
                        No sections yet. Click &ldquo;Add Section&rdquo; below to organize documents in this category.
                      </p>
                    )}

                    {category.sections.map((section) => {
                      const isSecExpanded = searchQuery ? true : expandedSecs.has(section.id);
                      const isDeletingSec = busyId === `del-sec-${section.id}`;

                      return (
                        <div key={section.id} className="ml-0 sm:ml-6">
                          {/* Section Row */}
                          <div
                            className="flex items-center justify-between bg-white rounded-lg border border-border px-3.5 py-2.5 shadow-2xs cursor-pointer hover:bg-slate-50/60 transition-colors select-none"
                            onClick={() => toggleSec(section.id)}
                          >
                            <div className="flex items-center gap-2.5 min-w-0 flex-1">
                              <div className="text-muted-foreground shrink-0">
                                {isSecExpanded ? (
                                  <ChevronDown className="w-3.5 h-3.5" />
                                ) : (
                                  <ChevronRight className="w-3.5 h-3.5" />
                                )}
                              </div>
                              <BookOpen className="w-3.5 h-3.5 text-slate-500 shrink-0" />

                              {editingSecId === section.id ? (
                                /* ── Inline rename section ── */
                                <div className="flex items-center gap-1.5 flex-1 min-w-0" onClick={(e) => e.stopPropagation()}>
                                  <Input
                                    autoFocus
                                    value={editingSecName}
                                    onChange={(e) => setEditingSecName(e.target.value)}
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter") handleRenameSection(section.id);
                                      if (e.key === "Escape") cancelEditSection();
                                    }}
                                    className="h-7 text-sm font-medium flex-1"
                                  />
                                  <Button
                                    variant="ghost"
                                    size="icon-sm"
                                    disabled={busyId === `rename-sec-${section.id}`}
                                    onClick={() => handleRenameSection(section.id)}
                                    className="text-green-600 hover:text-green-700 hover:bg-green-50 shrink-0"
                                  >
                                    {busyId === `rename-sec-${section.id}` ? (
                                      <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                      <Check className="w-4 h-4" />
                                    )}
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon-sm"
                                    onClick={cancelEditSection}
                                    className="text-muted-foreground hover:text-foreground shrink-0"
                                  >
                                    <X className="w-4 h-4" />
                                  </Button>
                                </div>
                              ) : (
                                /* ── Normal Section Label ── */
                                <div className="flex items-center gap-2 min-w-0 flex-wrap">
                                  <span className={`text-sm font-medium truncate ${section.isActive !== false ? "text-foreground" : "text-muted-foreground"}`}>
                                    {section.name}
                                  </span>
                                  <div className="flex items-center gap-1.5 shrink-0">
                                    {section.isActive === false && (
                                      <Badge variant="outline" className="text-[10px] font-normal text-amber-700 border-amber-300 bg-amber-50 px-1.5 py-0">
                                        Hidden
                                      </Badge>
                                    )}
                                    <Badge variant="secondary" className="text-xs font-normal shrink-0">
                                      {section.documents.length} doc{section.documents.length !== 1 ? "s" : ""}
                                    </Badge>
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Section Actions */}
                            <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                              {/* Visibility Switch */}
                              {canUpdateStructure && (
                                <div
                                  className="flex items-center mr-0.5"
                                  title={section.isActive !== false ? "Visible — click to hide" : "Hidden — click to show"}
                                >
                                  <Switch
                                    checked={section.isActive !== false}
                                    onCheckedChange={() => handleToggleSection(section.id, section.isActive !== false)}
                                    disabled={busyId === `toggle-sec-${section.id}`}
                                    className="scale-75"
                                  />
                                </div>
                              )}

                              {/* Rename Section */}
                              {canUpdateStructure && editingSecId !== section.id && (
                                <Button
                                  variant="ghost"
                                  size="icon-sm"
                                  onClick={() => startEditSection(section.id, section.name)}
                                  className="text-muted-foreground hover:text-teal-700 hover:bg-teal-50"
                                  title="Rename section"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </Button>
                              )}

                              {/* Add Document to Section */}
                              {canCreateContent && (
                                <Button
                                  variant="ghost"
                                  size="icon-sm"
                                  onClick={() => openNewDocument(category.id, section.id)}
                                  className="text-muted-foreground hover:text-teal-700 hover:bg-teal-50"
                                  title="Create document in this section"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                </Button>
                              )}

                              {/* Delete Section */}
                              {canDeleteStructure && (
                                <Button
                                  variant="ghost"
                                  size="icon-sm"
                                  disabled={isDeletingSec}
                                  onClick={() => setDeleteSecTarget({ id: section.id, name: section.name })}
                                  className="text-muted-foreground hover:text-red-600 hover:bg-red-50"
                                  title="Delete section"
                                >
                                  {isDeletingSec ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  ) : (
                                    <Trash2 className="w-3.5 h-3.5" />
                                  )}
                                </Button>
                              )}
                            </div>
                          </div>

                          {/* ── Documents in this section ── */}
                          {isSecExpanded && (
                            <div className="ml-4 sm:ml-6 mt-1.5 space-y-1.5">
                              {section.documents.length === 0 ? (
                                <p className="text-xs text-muted-foreground px-3 py-2 italic bg-white/60 rounded-md border border-dashed border-border/70">
                                  No documents in this section yet.
                                </p>
                              ) : (
                                section.documents.map((doc) => {
                                  const userCanEdit = canEditDoc(doc.owner?._id);

                                  return (
                                    <div
                                      key={doc._id}
                                      onClick={() => openViewDocument(doc._id)}
                                      className="w-full flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-lg bg-white border border-border text-left hover:border-teal-300 hover:shadow-xs transition-all group cursor-pointer"
                                    >
                                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                        <FileText className="w-4 h-4 text-teal-600 shrink-0" />
                                        <span className="text-sm font-medium text-foreground truncate group-hover:text-teal-700 transition-colors">
                                          {doc.title}
                                        </span>
                                        {doc.docId && (
                                          <span className="text-xs font-mono text-muted-foreground/80 shrink-0 px-1.5 py-0.5 bg-slate-100 rounded">
                                            {doc.docId}
                                          </span>
                                        )}
                                      </div>

                                      <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                                        {doc.owner && (
                                          <UserChip compact user={doc.owner} />
                                        )}

                                        {/* View Action */}
                                        <Button
                                          variant="ghost"
                                          size="icon-sm"
                                          onClick={() => openViewDocument(doc._id)}
                                          className="text-muted-foreground hover:text-teal-700 hover:bg-teal-50"
                                          title="View document"
                                        >
                                          <Eye className="w-3.5 h-3.5" />
                                        </Button>

                                        {/* Edit Action (if user has edit permission) */}
                                        {userCanEdit && (
                                          <Button
                                            variant="ghost"
                                            size="icon-sm"
                                            onClick={() => openEditDocument(doc._id)}
                                            className="text-muted-foreground hover:text-teal-700 hover:bg-teal-50"
                                            title="Edit document"
                                          >
                                            <Edit2 className="w-3.5 h-3.5" />
                                          </Button>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })
                              )}

                              {/* Add document CTA inside section */}
                              {canCreateContent && (
                                <button
                                  onClick={() => openNewDocument(category.id, section.id)}
                                  className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-dashed border-border text-xs text-muted-foreground hover:border-teal-500 hover:text-teal-700 hover:bg-teal-50/50 transition-colors"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                  <span>Add document to &ldquo;{section.name}&rdquo;</span>
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {/* Add Section inline form */}
                    {canCreateStructure && (
                      addingSectionToCat === category.id ? (
                        <div className="ml-0 sm:ml-6 flex gap-2 pt-1">
                          <Input
                            autoFocus
                            value={newSecName}
                            onChange={(e) => setNewSecName(e.target.value)}
                            placeholder="Section name (e.g. Procedures, Guidelines)"
                            onKeyDown={(e) => e.key === "Enter" && handleAddSection(category.id)}
                            className="h-8 text-sm bg-white"
                          />
                          <Button
                            size="sm"
                            disabled={!newSecName.trim() || busyId === `new-sec-${category.id}`}
                            onClick={() => handleAddSection(category.id)}
                            className="shrink-0 bg-teal-600 hover:bg-teal-700 text-white"
                          >
                            {busyId === `new-sec-${category.id}` ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              "Add"
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setAddingSectionToCat(null);
                              setNewSecName("");
                            }}
                            className="shrink-0"
                          >
                            Cancel
                          </Button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setAddingSectionToCat(category.id)}
                          className="ml-0 sm:ml-6 mt-1 flex items-center gap-1.5 text-xs font-medium text-teal-700 hover:text-teal-800 transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add Section to &ldquo;{category.name}&rdquo;</span>
                        </button>
                      )
                    )}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* ── Category Deletion Confirmation Modal ── */}
      <AlertDialog open={!!deleteCatTarget} onOpenChange={(open) => !open && setDeleteCatTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete category &ldquo;{deleteCatTarget?.name}&rdquo;?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this category, along with all of its sections and documents.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                confirmDeleteCategory();
              }}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete Category
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Section Deletion Confirmation Modal ── */}
      <AlertDialog open={!!deleteSecTarget} onOpenChange={(open) => !open && setDeleteSecTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete section &ldquo;{deleteSecTarget?.name}&rdquo;?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this section and all documents contained within it.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                confirmDeleteSection();
              }}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete Section
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
