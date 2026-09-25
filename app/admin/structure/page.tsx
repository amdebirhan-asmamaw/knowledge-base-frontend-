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
    deleteDocument,
  } = useDocumentTree();

  // ── Permissions (Fine-grained with sensible defaults) ──────────────────────
  const canCreateCategory = hasPermission("structure:category:create") || hasPermission("structure:create");
  const canUpdateCategory = hasPermission("structure:category:update") || hasPermission("structure:update");
  const canDeleteCategory = hasPermission("structure:category:delete") || hasPermission("structure:delete");

  const canCreateSection = hasPermission("structure:section:create") || hasPermission("structure:create");
  const canUpdateSection = hasPermission("structure:section:update") || hasPermission("structure:update");
  const canDeleteSection = hasPermission("structure:section:delete") || hasPermission("structure:delete");

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
  const [deleteDocTarget, setDeleteDocTarget] = useState<{ id: string; title: string } | null>(null);

  // ─── Filtered categories and auto-expand on search ─────────────────────────
  const { filteredCategories, totalDocsCount } = useMemo(() => {
    let totalDocs = 0;
    const query = searchQuery.trim().toLowerCase();

    const filtered = categories
      .map((cat) => {
        const catMatches = cat.name.toLowerCase().includes(query);

        const filteredSections = cat.sections
          .map((sec) => {
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

    return { filteredCategories: filtered, totalDocsCount: totalDocs };
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

  // ─── Navigation helpers ────────────────────────────────────────────────────
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

  const confirmDeleteDocument = () => {
    if (!deleteDocTarget) return;
    const { id, title } = deleteDocTarget;
    withBusy(`del-doc-${id}`, async () => {
      await deleteDocument(id);
      toast.success(`Deleted document "${title}"`);
      setDeleteDocTarget(null);
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
    return true; // Default fallback for administrative management
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Manage Structure</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Organize categories, sections, and documents in one place
          </p>
        </div>

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

      {/* ── Error banner ── */}
      {actionError && (
        <div className="flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {/* ── Add New Category Card ── */}
      {canCreateCategory && (
        <Card className="p-5 border shadow-sm rounded-2xl bg-white">
          <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <Folder className="w-4 h-4 text-teal-600" />
            <span>Add New Category</span>
          </h2>
          <div className="flex gap-2">
            <Input
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              placeholder='e.g., "HR Policies" or "Procedures"'
              onKeyDown={(e) => e.key === "Enter" && handleAddCategory()}
              className="flex-1 bg-white h-10 text-sm"
            />
            <Button
              onClick={handleAddCategory}
              disabled={!newCatName.trim() || busyId === "new-cat"}
              className="shrink-0 gap-1.5 bg-[#3b82f6] hover:bg-[#2563eb] text-white px-5 h-10 font-medium"
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

      {/* ── Categories List ── */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 rounded-2xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : filteredCategories.length === 0 ? (
        <Card className="p-12 text-center border-dashed rounded-2xl">
          <Folder className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-foreground">No categories found</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
            {searchQuery
              ? `No categories match "${searchQuery}".`
              : "No categories in your knowledge base yet. Add your first category above."}
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredCategories.map((category) => {
            const isCatExpanded = expandedCats.has(category.id);
            const isDeletingCat = busyId === `del-cat-${category.id}`;

            return (
              <Card
                key={category.id}
                className="overflow-hidden border border-slate-200/80 rounded-2xl shadow-xs p-0 bg-white transition-all"
              >
                {/* ── Category Row ── */}
                <div
                  className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-slate-50/60 transition-colors select-none"
                  onClick={() => toggleCat(category.id)}
                >
                  <div className="flex items-center gap-3.5 min-w-0 flex-1">
                    {/* Left Chevron in soft teal container */}
                    <div className="p-1.5 rounded-lg bg-teal-50 text-teal-700 shrink-0 transition-transform">
                      {isCatExpanded ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </div>

                    {editingCatId === category.id ? (
                      /* ── Inline rename input ── */
                      <div
                        className="flex items-center gap-2 flex-1 min-w-0"
                        onClick={(e) => e.stopPropagation()}
                      >
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
                      /* ── Normal name display ── */
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <span
                          className={`font-semibold text-sm truncate ${
                            category.isActive !== false ? "text-slate-900" : "text-muted-foreground line-through"
                          }`}
                        >
                          {category.name}
                        </span>

                        <div className="flex items-center gap-2 shrink-0">
                          {category.isActive === false && (
                            <Badge
                              variant="outline"
                              className="text-xs font-normal text-amber-700 border-amber-300 bg-amber-50"
                            >
                              Hidden
                            </Badge>
                          )}
                          <Badge
                            variant="secondary"
                            className="text-xs font-normal bg-slate-100 text-slate-700 border border-slate-200/60"
                          >
                            {category.sections.length} section{category.sections.length !== 1 ? "s" : ""}
                          </Badge>
                          <Badge
                            variant="secondary"
                            className="text-xs font-normal bg-slate-100 text-slate-700 border border-slate-200/60"
                          >
                            {category.count} doc{category.count !== 1 ? "s" : ""}
                          </Badge>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* ── Category Actions ── */}
                  <div className="flex items-center gap-2 shrink-0 ml-4">
                    {/* Visibility Switch Toggle */}
                    <div
                      className="flex items-center gap-1.5 mr-1"
                      onClick={(e) => e.stopPropagation()}
                      title={
                        category.isActive !== false
                          ? "Visible — click to hide"
                          : "Hidden — click to show"
                      }
                    >
                      <Switch
                        checked={category.isActive !== false}
                        onCheckedChange={() =>
                          handleToggleCategory(category.id, category.isActive !== false)
                        }
                        disabled={busyId === `toggle-cat-${category.id}`}
                        className="data-[state=checked]:bg-[#3b82f6]"
                      />
                    </div>

                    {/* Rename Category Button */}
                    {canUpdateCategory && editingCatId !== category.id && (
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          startEditCategory(category.id, category.name);
                        }}
                        className="text-slate-500 hover:text-slate-800 hover:bg-slate-100"
                        title="Rename category"
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                    )}

                    {/* Delete Category Button */}
                    {canDeleteCategory && (
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        disabled={isDeletingCat}
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteCatTarget({ id: category.id, name: category.name });
                        }}
                        className="text-slate-500 hover:text-red-600 hover:bg-red-50 shrink-0"
                        title="Delete category"
                      >
                        {isDeletingCat ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </Button>
                    )}
                  </div>
                </div>

                {/* ── Expanded Sections Container ── */}
                {isCatExpanded && (
                  <div className="border-t border-slate-100 bg-slate-50/50 p-4 sm:p-5 space-y-3">
                    {category.sections.length === 0 && addingSectionToCat !== category.id && (
                      <p className="text-xs text-muted-foreground ml-6 py-2">
                        No sections yet. Add a section below to begin adding documents.
                      </p>
                    )}

                    {category.sections.map((section) => {
                      const isSecExpanded = expandedSecs.has(section.id);
                      const isDeletingSec = busyId === `del-sec-${section.id}`;

                      return (
                        <div key={section.id} className="ml-2 sm:ml-6 space-y-2">
                          {/* ── Section Row ── */}
                          <div
                            className="flex items-center justify-between bg-white rounded-xl border border-slate-200/80 px-3.5 py-2.5 shadow-2xs cursor-pointer hover:bg-slate-50/80 transition-colors select-none"
                            onClick={() => toggleSec(section.id)}
                          >
                            <div className="flex items-center gap-2.5 min-w-0 flex-1">
                              {isSecExpanded ? (
                                <ChevronDown className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                              ) : (
                                <ChevronRight className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                              )}
                              <BookOpen className="w-3.5 h-3.5 text-teal-600 shrink-0" />

                              {editingSecId === section.id ? (
                                /* ── Inline rename section ── */
                                <div
                                  className="flex items-center gap-1.5 flex-1 min-w-0"
                                  onClick={(e) => e.stopPropagation()}
                                >
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
                                /* ── Normal Section Name Display ── */
                                <div className="flex items-center gap-2 min-w-0">
                                  <span
                                    className={`text-sm font-medium truncate ${
                                      section.isActive !== false ? "text-slate-800" : "text-muted-foreground line-through"
                                    }`}
                                  >
                                    {section.name}
                                  </span>
                                  {section.isActive === false && (
                                    <Badge
                                      variant="outline"
                                      className="text-[10px] font-normal text-amber-700 border-amber-300 bg-amber-50 px-1.5 py-0"
                                    >
                                      Hidden
                                    </Badge>
                                  )}
                                  <Badge
                                    variant="secondary"
                                    className="text-xs font-normal shrink-0 bg-slate-100 text-slate-600"
                                  >
                                    {section.documents.length} doc{section.documents.length !== 1 ? "s" : ""}
                                  </Badge>
                                </div>
                              )}
                            </div>

                            {/* Section Action Icons */}
                            <div className="flex items-center gap-1 shrink-0">
                              {/* Section Visibility Switch */}
                              <div
                                className="flex items-center gap-1 mr-1"
                                onClick={(e) => e.stopPropagation()}
                                title={
                                  section.isActive !== false
                                    ? "Visible — click to hide"
                                    : "Hidden — click to show"
                                }
                              >
                                <Switch
                                  checked={section.isActive !== false}
                                  onCheckedChange={() =>
                                    handleToggleSection(section.id, section.isActive !== false)
                                  }
                                  disabled={busyId === `toggle-sec-${section.id}`}
                                  className="scale-75 data-[state=checked]:bg-[#3b82f6]"
                                />
                              </div>

                              {/* Section Rename */}
                              {canUpdateSection && editingSecId !== section.id && (
                                <Button
                                  variant="ghost"
                                  size="icon-sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    startEditSection(section.id, section.name);
                                  }}
                                  className="text-slate-400 hover:text-slate-800 hover:bg-slate-100"
                                  title="Rename section"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </Button>
                              )}

                              {/* Add Document inside this section */}
                              {canCreateContent && (
                                <Button
                                  variant="ghost"
                                  size="icon-sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openNewDocument(category.id, section.id);
                                  }}
                                  className="text-slate-400 hover:text-teal-700 hover:bg-teal-50"
                                  title="Add document to this section"
                                >
                                  <Plus className="w-4 h-4" />
                                </Button>
                              )}

                              {/* Delete Section */}
                              {canDeleteSection && (
                                <Button
                                  variant="ghost"
                                  size="icon-sm"
                                  disabled={isDeletingSec}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setDeleteSecTarget({ id: section.id, name: section.name });
                                  }}
                                  className="text-slate-400 hover:text-red-600 hover:bg-red-50"
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

                          {/* ── Document List inside Section ── */}
                          {isSecExpanded && (
                            <div className="ml-5 sm:ml-7 mt-1.5 space-y-1.5">
                              {section.documents.length === 0 ? (
                                <p className="text-xs text-muted-foreground px-2 py-1.5 italic">
                                  No documents yet in this section.
                                </p>
                              ) : (
                                section.documents.map((doc) => {
                                  const userCanEdit = canEditDoc(doc.owner?._id);

                                  return (
                                    <div
                                      key={doc._id}
                                      onClick={() => openViewDocument(doc._id)}
                                      className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-white border border-slate-200/70 text-left hover:bg-teal-50/50 hover:border-teal-200 transition-colors group cursor-pointer shadow-2xs"
                                    >
                                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                        <FileText className="w-3.5 h-3.5 text-slate-400 group-hover:text-teal-600 shrink-0 transition-colors" />
                                        <span className="text-sm font-medium text-slate-800 truncate group-hover:text-teal-900 transition-colors">
                                          {doc.title}
                                        </span>
                                        {doc.docId && (
                                          <span className="text-xs font-mono text-muted-foreground/80 shrink-0 px-1.5 py-0.5 bg-slate-100 rounded">
                                            {doc.docId}
                                          </span>
                                        )}
                                      </div>

                                      <div
                                        className="flex items-center gap-2 shrink-0"
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        {doc.owner && (
                                          <UserChip compact user={doc.owner} />
                                        )}

                                        {/* View Action */}
                                        <Button
                                          variant="ghost"
                                          size="icon-sm"
                                          onClick={() => openViewDocument(doc._id)}
                                          className="text-slate-400 hover:text-teal-700 hover:bg-teal-50"
                                          title="View document"
                                        >
                                          <Eye className="w-3.5 h-3.5" />
                                        </Button>

                                        {/* Edit Action */}
                                        {userCanEdit && (
                                          <Button
                                            variant="ghost"
                                            size="icon-sm"
                                            onClick={() => openEditDocument(doc._id)}
                                            className="text-slate-400 hover:text-teal-700 hover:bg-teal-50"
                                            title="Edit document"
                                          >
                                            <Edit2 className="w-3.5 h-3.5" />
                                          </Button>
                                        )}

                                        {/* Delete Document */}
                                        <Button
                                          variant="ghost"
                                          size="icon-sm"
                                          onClick={() => setDeleteDocTarget({ id: doc._id, title: doc.title })}
                                          className="text-slate-400 hover:text-red-600 hover:bg-red-50"
                                          title="Delete document"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </Button>
                                      </div>
                                    </div>
                                  );
                                })
                              )}

                              {/* Add Document dashed CTA */}
                              {canCreateContent && (
                                <button
                                  onClick={() => openNewDocument(category.id, section.id)}
                                  className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl border border-dashed border-slate-300 text-xs font-medium text-slate-500 hover:border-teal-500 hover:text-teal-700 hover:bg-teal-50/50 transition-colors"
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

                    {/* Inline Add Section form */}
                    {canCreateSection && (
                      addingSectionToCat === category.id ? (
                        <div className="ml-2 sm:ml-6 flex gap-2 pt-1">
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
                          className="ml-2 sm:ml-6 mt-1 flex items-center gap-1.5 text-xs font-medium text-teal-700 hover:text-teal-800 transition-colors"
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
      <AlertDialog
        open={!!deleteCatTarget}
        onOpenChange={(open) => !open && setDeleteCatTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete category &ldquo;{deleteCatTarget?.name}&rdquo;?
            </AlertDialogTitle>
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
      <AlertDialog
        open={!!deleteSecTarget}
        onOpenChange={(open) => !open && setDeleteSecTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete section &ldquo;{deleteSecTarget?.name}&rdquo;?
            </AlertDialogTitle>
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

      {/* ── Document Deletion Confirmation Modal ── */}
      <AlertDialog
        open={!!deleteDocTarget}
        onOpenChange={(open) => !open && setDeleteDocTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete document &ldquo;{deleteDocTarget?.title}&rdquo;?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this document. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                confirmDeleteDocument();
              }}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete Document
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
