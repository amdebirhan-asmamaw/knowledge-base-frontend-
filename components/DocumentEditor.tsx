"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { format, formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { useDocument, useDocumentTree } from "@/hooks/use-document-tree";
import { useAuth } from "@/hooks/use-auth";
import { useEmployees } from "@/hooks/queries";
import { queryKeys } from "@/lib/query-keys";
import type { FullDocument } from "@/lib/api/documents.api";
import type { Employee } from "@/lib/api/employees.api";
import { RichTextEditor } from "./RichTextEditor";
import { DocumentView } from "./DocumentView";
import { UserChip } from "@/components/UserChip";
import { VersionHistory } from "@/components/VersionHistory";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { ChevronLeft, Save, Trash2, Loader2, Plus, History, Lock, X, Eye, AlertCircle } from "lucide-react";
import { FileImportButton } from "./FileImportButton";

// Sentinel value used for the "Unassigned" owner option in the radix Select
const NO_OWNER = "__no_owner__";

// Sentinel value used to detect "Add new…" selection in radix Select
const ADD_NEW_CATEGORY = "__add_new_category__";
const ADD_NEW_SECTION = "__add_new_section__";

interface DocumentEditorProps {
  /** Pass _id when editing an existing document */
  documentId?: string;
  /** Pre-select category/section when creating from the structure view */
  defaultCategoryId?: string;
  defaultSectionId?: string;
  onClose: () => void;
}

export function DocumentEditor({
  documentId,
  defaultCategoryId,
  defaultSectionId,
  onClose,
}: DocumentEditorProps) {
  const router = useRouter();
  const { categories, createCategory, createSection, createDocument, updateDocument, deleteDocument } =
    useDocumentTree();
  const { user, hasPermission, hasScopePermission } = useAuth();
  const queryClient = useQueryClient();

  const [title, setTitle] = useState("");
  const [docId, setDocId] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(
    defaultCategoryId ?? "",
  );
  const [selectedSection, setSelectedSection] = useState(
    defaultSectionId ?? "",
  );
  const [contentHtml, setContentHtml] = useState("");
  const [contentJson, setContentJson] = useState<object>({
    type: "doc",
    content: [],
  });
  const [contentVersion, setContentVersion] = useState(0); // bumped on file import to sync editor
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // ── Save / version prompt state (existing docs only) ────────────────────────
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [createVersion, setCreateVersion] = useState(false);
  const [versionLabel, setVersionLabel] = useState("");
  const [versionNote, setVersionNote] = useState("");

  // ── Ownership state ────────────────────────────────────────────────────────
  const [owner, setOwner] = useState<string>(""); // user _id, or "" when unassigned
  const [contributors, setContributors] = useState<string[]>([]); // user _ids
  const [fullDoc, setFullDoc] = useState<FullDocument | null>(null);

  // ── "Add new" dialog state ─────────────────────────────────────────────────
  const [showNewCategoryDialog, setShowNewCategoryDialog] = useState(false);
  const [showNewSectionDialog, setShowNewSectionDialog] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newSectionName, setNewSectionName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // ── Fetch document detail via React Query ──────────────────────────────────
  const { data: fetchedDoc, isLoading: isLoadingDoc, error: docError } = useDocument(documentId);

  // Sync fetched document into local form state
  useEffect(() => {
    if (!fetchedDoc) return;
    setFullDoc(fetchedDoc);
    setTitle(fetchedDoc.title);
    setDocId(fetchedDoc.docId ?? "");
    setSelectedCategory(
      fetchedDoc.categoryId && typeof fetchedDoc.categoryId === "object"
        ? fetchedDoc.categoryId._id
        : (fetchedDoc.categoryId as unknown as string) ?? "",
    );
    setSelectedSection(
      fetchedDoc.sectionId && typeof fetchedDoc.sectionId === "object"
        ? fetchedDoc.sectionId._id
        : (fetchedDoc.sectionId as unknown as string) ?? "",
    );
    setOwner(fetchedDoc.owner?._id ?? "");
    setContributors((fetchedDoc.contributors ?? []).map((c) => c._id));
    setContentHtml(fetchedDoc.contentHtml ?? "");
    if (fetchedDoc.contentJson && Object.keys(fetchedDoc.contentJson).length > 0) {
      setContentJson(fetchedDoc.contentJson);
    }
    setContentVersion((v) => v + 1);
  }, [fetchedDoc]);

  // Reload document (for version restore)
  const loadDoc = () => {
    if (documentId) {
      queryClient.invalidateQueries({ queryKey: queryKeys.documents.detail(documentId) });
    }
  };

  // ── Fetch active users for owner dropdown ───────────────────────────────
  const { employees: users } = useEmployees({ isActive: true });

  const validate = () => {
    const e: Record<string, string> = {};
    if (!title.trim()) e.title = "Title is required";
    if (!selectedCategory) e.category = "Category is required";
    if (!selectedSection) e.section = "Section is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // Plain-text extraction from HTML for search indexing
  const extractText = (html: string) =>
    html
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();

  /** Called by FileImportButton after successful parse */
  const handleImport = (html: string, importedTitle?: string) => {
    setContentHtml(html);
    setContentVersion((v) => v + 1); // triggers RichTextEditor to sync
    // Auto-fill title only when it's currently empty
    if (importedTitle && !title.trim()) {
      setTitle(importedTitle);
    }
  };

  const doSave = async (versionOpts?: { createVersion: boolean; versionLabel: string; changeNote: string }) => {
    setIsSaving(true);
    setSaveError(null);
    try {
      const base = {
        title: title.trim(),
        docId: docId.trim(),
        categoryId: selectedCategory,
        sectionId: selectedSection,
        contentHtml,
        contentJson,
        contentText: extractText(contentHtml),
      };

      if (documentId) {
        // Only send ownership/contributor fields when allowed to manage them —
        // otherwise the backend would 403 a contributor's content-only edit.
        const data: Record<string, unknown> = canManage
          ? { ...base, owner: owner || null, contributors }
          : { ...base };
        // Versioning is opt-in: only snapshot when the editor asked to.
        data.createVersion = !!versionOpts?.createVersion;
        if (versionOpts?.createVersion) {
          data.versionLabel = versionOpts.versionLabel;
          data.changeNote = versionOpts.changeNote || undefined;
        }
        await updateDocument(documentId, data);
        toast.success("Document updated successfully");
      } else {
        await createDocument({ ...base, owner: owner || undefined, contributors });
        toast.success("Document created successfully");
      }
      setShowSaveDialog(false);
      onClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Save failed";
      setSaveError(msg);
      toast.error(msg);
    } finally {
      setIsSaving(false);
    }
  };

  // Main Save button: existing docs prompt about versioning first; new docs save directly.
  const handleSaveClick = () => {
    if (!validate()) return;
    if (documentId) {
      setCreateVersion(false);
      setVersionLabel("");
      setVersionNote("");
      setSaveError(null);
      setShowSaveDialog(true);
    } else {
      doSave();
    }
  };

  const confirmSave = () => {
    if (createVersion && !versionLabel.trim()) return;
    doSave({ createVersion, versionLabel: versionLabel.trim(), changeNote: versionNote.trim() });
  };

  const confirmDelete = async () => {
    if (!documentId) return;
    setIsDeleting(true);
    try {
      await deleteDocument(documentId);
      toast.success("Document deleted");
      setShowDeleteDialog(false);
      onClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Delete failed";
      setSaveError(msg);
      toast.error(msg);
    } finally {
      setIsDeleting(false);
    }
  };

  // ── Handle "Add new" sentinel values from the Select ────────────────────────

  const handleCategoryChange = (value: string) => {
    if (value === ADD_NEW_CATEGORY) {
      setShowNewCategoryDialog(true);
      return;
    }
    setSelectedCategory(value);
    setSelectedSection("");
    setErrors({ ...errors, category: "" });
  };

  const handleSectionChange = (value: string) => {
    if (value === ADD_NEW_SECTION) {
      setShowNewSectionDialog(true);
      return;
    }
    setSelectedSection(value);
    setErrors({ ...errors, section: "" });
  };

  // ── Create new category ────────────────────────────────────────────────────

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return;
    setIsCreating(true);
    setCreateError(null);
    try {
      await createCategory(newCategoryName.trim());
      // After reload, find the newly created category to auto-select it
      // The categories state will be updated via AdminContext reload
      setShowNewCategoryDialog(false);
      setNewCategoryName("");
      // We'll select it after a short delay to let the state update
      setTimeout(() => {
        // Find the newly created category by name match
        // AdminContext will have reloaded by now
      }, 100);
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : "Failed to create category");
    } finally {
      setIsCreating(false);
    }
  };

  // Auto-select newly created category after context reload
  useEffect(() => {
    if (!showNewCategoryDialog && newCategoryName === "" && categories.length > 0) {
      // Check if our selected category still exists, if not, try to find newest
      if (selectedCategory && !categories.find((c) => c.id === selectedCategory)) {
        // Category ID changed after reload — select last one
        const last = categories[categories.length - 1];
        if (last) {
          setSelectedCategory(last.id);
          setSelectedSection("");
        }
      }
    }
  }, [categories, showNewCategoryDialog, newCategoryName, selectedCategory]);

  // ── Create new section ─────────────────────────────────────────────────────

  const handleCreateSection = async () => {
    if (!newSectionName.trim() || !selectedCategory) return;
    setIsCreating(true);
    setCreateError(null);
    try {
      await createSection(selectedCategory, newSectionName.trim());
      setShowNewSectionDialog(false);
      setNewSectionName("");
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : "Failed to create section");
    } finally {
      setIsCreating(false);
    }
  };

  // Auto-select newly created section after context reload
  useEffect(() => {
    if (!showNewSectionDialog && newSectionName === "" && selectedCategory) {
      const currentCat = categories.find((c) => c.id === selectedCategory);
      if (currentCat && selectedSection && !currentCat.sections.find((s) => s.id === selectedSection)) {
        const last = currentCat.sections[currentCat.sections.length - 1];
        if (last) {
          setSelectedSection(last.id);
        }
      }
    }
  }, [categories, showNewSectionDialog, newSectionName, selectedCategory, selectedSection]);

  const currentSections =
    categories.find((c) => c.id === selectedCategory)?.sections ?? [];

  // ── Permission gating (mirrors the backend's two-tier rule) ──────────────────
  const canManageAll = hasPermission("content:update:all");
  // Document manager = canManageAll, or author/owner.
  const isOwner = !!fullDoc?.owner?._id && fullDoc.owner._id === user?.id;
  const isContributor =
    fullDoc?.contributors?.some((c) => c._id === user?.id) ?? false;
  // "Manage" = full administrative control (e.g. archiving, deletion, owner change)
  const canManage =
    !documentId ||
    hasPermission("content:update:all") ||
    (isOwner && hasScopePermission("content", "update", "own"));
  // "Edit content" = title/content edits + restore: managers plus listed contributors.
  const canEditContent = canManage || isContributor;
  const canCreate = !documentId ? hasPermission("content:create") : canEditContent;

  // Resolve a user's name/email from the loaded users list, falling back to the
  // populated owner/contributor refs (covers inactive users not in the dropdown).
  const userRef = (id: string) => {
    const emp = users.find((u) => u._id === id);
    if (emp) return { _id: emp._id, name: emp.name, email: emp.email };
    if (fullDoc?.owner?._id === id) return fullDoc.owner;
    return fullDoc?.contributors?.find((c) => c._id === id) ?? null;
  };

  const addContributor = (id: string) => {
    if (id && id !== owner && !contributors.includes(id)) {
      setContributors([...contributors, id]);
    }
  };
  const removeContributor = (id: string) =>
    setContributors(contributors.filter((c) => c !== id));

  // If document failed to load or does not exist
  if (documentId && docError) {
    return (
      <Card className="p-8 text-center max-w-xl mx-auto my-12 border-dashed">
        <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
        <h2 className="text-lg font-semibold text-foreground">Document Not Found</h2>
        <p className="text-sm text-muted-foreground mt-1 mb-6">
          {docError instanceof Error ? docError.message : "The requested document could not be loaded or access is restricted."}
        </p>
        <Button onClick={onClose} variant="outline" className="gap-2">
          <ChevronLeft className="w-4 h-4" />
          Back to Structure
        </Button>
      </Card>
    );
  }

  // If user only has view access (not edit access), gracefully show DocumentView!
  if (documentId && fetchedDoc && !canEditContent) {
    return <DocumentView documentId={documentId} onClose={onClose} />;
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onClose} className="gap-2 text-muted-foreground hover:text-foreground">
            <ChevronLeft className="w-4 h-4" />
            Back
          </Button>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">
            {documentId ? "Edit Document" : "New Document"}
          </h1>
          {isLoadingDoc && (
            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground ml-1" />
          )}
        </div>

        {documentId && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push(`/admin/structure/${documentId}`)}
              className="gap-1.5 text-xs text-muted-foreground hover:text-foreground"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>View Mode</span>
            </Button>
          </div>
        )}
      </div>

      {isLoadingDoc ? (
        <div className="space-y-4">
          <div className="h-48 rounded-xl bg-muted animate-pulse" />
          <div className="h-80 rounded-xl bg-muted animate-pulse" />
        </div>
      ) : (
        <Tabs defaultValue="editor">
          {documentId && (
            <TabsList className="mb-4">
              <TabsTrigger value="editor">Editor</TabsTrigger>
              <TabsTrigger value="history" className="gap-1.5">
                <History className="w-3.5 h-3.5" />
                Version history
              </TabsTrigger>
            </TabsList>
          )}
          <TabsContent value="editor" className="space-y-6">
          {!canEditContent && (
            <div className="flex items-start gap-2.5 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              <Lock className="w-4 h-4 mt-0.5 shrink-0" />
              <span>
                You can&rsquo;t edit this document. Only its owner, a contributor, or an
                administrator can make changes.
              </span>
            </div>
          )}
          {/* Info card */}
          <Card className="p-6">
            <h2 className="text-base font-semibold text-foreground mb-4">
              Document Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">
                  Title *
                </label>
                <Input
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    setErrors({ ...errors, title: "" });
                  }}
                  placeholder="Document title"
                  className={errors.title ? "border-red-500" : ""}
                />
                {errors.title && (
                  <p className="text-xs text-red-600 mt-1">{errors.title}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">
                  Document ID{" "}
                  <span className="text-muted-foreground text-xs">
                    (e.g. RM-TD-P-25-002)
                  </span>
                </label>
                <Input
                  value={docId}
                  onChange={(e) => setDocId(e.target.value)}
                  placeholder="Optional — leave blank to skip"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">
                  Category *
                </label>
                <Select
                  value={selectedCategory}
                  onValueChange={handleCategoryChange}
                >
                  <SelectTrigger
                    className={errors.category ? "border-red-500" : ""}
                  >
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                    <SelectItem
                      value={ADD_NEW_CATEGORY}
                      className="text-primary font-medium border-t border-border mt-1 pt-1"
                    >
                      <span className="flex items-center gap-1.5">
                        <Plus className="w-3.5 h-3.5" />
                        Add new category
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
                {errors.category && (
                  <p className="text-xs text-red-600 mt-1">{errors.category}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">
                  Section *
                </label>
                <Select
                  value={selectedSection}
                  onValueChange={handleSectionChange}
                  disabled={!selectedCategory}
                >
                  <SelectTrigger
                    className={errors.section ? "border-red-500" : ""}
                  >
                    <SelectValue placeholder="Select section" />
                  </SelectTrigger>
                  <SelectContent>
                    {currentSections.map((sec) => (
                      <SelectItem key={sec.id} value={sec.id}>
                        {sec.name}
                      </SelectItem>
                    ))}
                    <SelectItem
                      value={ADD_NEW_SECTION}
                      className="text-primary font-medium border-t border-border mt-1 pt-1"
                    >
                      <span className="flex items-center gap-1.5">
                        <Plus className="w-3.5 h-3.5" />
                        Add new section
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
                {errors.section && (
                  <p className="text-xs text-red-600 mt-1">{errors.section}</p>
                )}
              </div>
            </div>

            {/* Owner + audit metadata */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Owner</label>
                <Select
                  value={owner || NO_OWNER}
                  onValueChange={(v) => setOwner(v === NO_OWNER ? "" : v)}
                  disabled={!canManage}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Unassigned" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NO_OWNER}>
                      <span className="text-muted-foreground">Unassigned</span>
                    </SelectItem>
                    {users.map((u) => (
                      <SelectItem key={u._id} value={u._id}>
                        {u.name}
                        <span className="text-muted-foreground ml-1.5 text-xs">{u.email}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  Defaults to the creator. Changing it transfers ownership; the previous
                  owner becomes a contributor.
                </p>
              </div>

              {documentId && fullDoc && (fullDoc.createdBy || fullDoc.updatedBy) && (
                <div className="flex flex-col gap-2 justify-center">
                  {fullDoc.createdBy && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground w-20 shrink-0">Created by</span>
                      <UserChip
                        user={fullDoc.createdBy}
                        subtitle={fullDoc.createdAt ? format(new Date(fullDoc.createdAt), "PP") : undefined}
                      />
                    </div>
                  )}
                  {fullDoc.updatedBy && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground w-20 shrink-0">Last edited</span>
                      <UserChip
                        user={fullDoc.updatedBy}
                        subtitle={fullDoc.updatedAt ? formatDistanceToNow(new Date(fullDoc.updatedAt), { addSuffix: true }) : undefined}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Contributors */}
            <div className="mt-4">
              <label className="block text-sm font-medium mb-1.5">Contributors</label>
              {canManage && (
                <Select value="" onValueChange={addContributor}>
                  <SelectTrigger className="md:max-w-md">
                    <SelectValue placeholder="Add a contributor…" />
                  </SelectTrigger>
                  <SelectContent>
                    {users
                      .filter((u) => u._id !== owner && !contributors.includes(u._id))
                      .map((u) => (
                        <SelectItem key={u._id} value={u._id}>
                          {u.name}
                          <span className="text-muted-foreground ml-1.5 text-xs">{u.email}</span>
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              )}
              <div className="flex flex-wrap gap-2 mt-2">
                {contributors.length === 0 ? (
                  <span className="text-xs text-muted-foreground">No contributors yet.</span>
                ) : (
                  contributors.map((id) => {
                    const u = userRef(id);
                    return (
                      <span
                        key={id}
                        className="inline-flex items-center gap-1.5 rounded-full border border-border bg-secondary/60 pl-1 pr-2 py-0.5"
                      >
                        <UserChip compact user={u} />
                        <span className="text-xs text-foreground">{u?.name ?? "Unknown user"}</span>
                        {canManage && (
                          <button
                            type="button"
                            onClick={() => removeContributor(id)}
                            className="text-muted-foreground hover:text-red-600"
                            title="Remove contributor"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </span>
                    );
                  })
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Contributors can edit this document&rsquo;s content, but cannot delete it or change ownership.
              </p>
            </div>
          </Card>

          {/* Editor card */}
          <Card className="p-4 2xl:p-6 border bg-white shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-base font-semibold text-foreground">
                Content
              </h2>
              <FileImportButton
                onImport={handleImport}
                hasContent={contentHtml.trim().length > 0}
              />
            </div>
            <RichTextEditor
              value={contentHtml}
              onChange={setContentHtml}
              onChangeJson={setContentJson}
              placeholder="Write your document content here..."
              externalContentVersion={contentVersion}
              editable={canEditContent}
            />
          </Card>

          {/* Error banner */}
          {saveError && (
            <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              {saveError}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 flex-wrap">
            <Button
              onClick={handleSaveClick}
              disabled={isSaving || !canEditContent || (!documentId && !canCreate)}
              className="gap-2 bg-teal-600 hover:bg-teal-700 text-white shadow-xs"
            >
              <Save className="w-4 h-4" />
              {isSaving ? "Saving…" : "Save Document"}
            </Button>
            {documentId && canManage && (
              <Button
                onClick={() => setShowDeleteDialog(true)}
                variant="destructive"
                className="gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </Button>
            )}
            <Button onClick={onClose} variant="outline">
              Cancel
            </Button>
          </div>
          </TabsContent>
          {documentId && (
            <TabsContent value="history">
              <VersionHistory documentId={documentId} canRestore={canEditContent} onRestored={loadDoc} />
            </TabsContent>
          )}
        </Tabs>
      )}

      {/* ── Add New Category Dialog ──────────────────────────────────────────── */}
      <Dialog open={showNewCategoryDialog} onOpenChange={setShowNewCategoryDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Category</DialogTitle>
            <DialogDescription>
              Create a new document category. This will be available across all documents.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Input
              autoFocus
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder='e.g., "HR Policies" or "Procedures"'
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleCreateCategory();
                }
              }}
            />
            {createError && (
              <p className="text-xs text-red-600">{createError}</p>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowNewCategoryDialog(false);
                setNewCategoryName("");
                setCreateError(null);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateCategory}
              disabled={!newCategoryName.trim() || isCreating}
              className="gap-1.5"
            >
              {isCreating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              {isCreating ? "Creating…" : "Create Category"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Add New Section Dialog ───────────────────────────────────────────── */}
      <Dialog open={showNewSectionDialog} onOpenChange={setShowNewSectionDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Section</DialogTitle>
            <DialogDescription>
              Create a new section under{" "}
              <strong>
                {categories.find((c) => c.id === selectedCategory)?.name ?? "the selected category"}
              </strong>
              .
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Input
              autoFocus
              value={newSectionName}
              onChange={(e) => setNewSectionName(e.target.value)}
              placeholder='e.g., "Technology Dept" or "Finance Dept"'
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleCreateSection();
                }
              }}
            />
            {createError && (
              <p className="text-xs text-red-600">{createError}</p>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowNewSectionDialog(false);
                setNewSectionName("");
                setCreateError(null);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateSection}
              disabled={!newSectionName.trim() || isCreating}
              className="gap-1.5"
            >
              {isCreating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              {isCreating ? "Creating…" : "Create Section"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Save / version prompt (existing documents) ───────────────────────── */}
      <Dialog open={showSaveDialog} onOpenChange={(open) => !isSaving && setShowSaveDialog(open)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Save changes</DialogTitle>
            <DialogDescription>
              Choose whether this save should also be recorded as a new version of the document.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2.5">
              <div>
                <p className="text-sm font-medium">Create a new version</p>
                <p className="text-xs text-muted-foreground">
                  Snapshot this saved content so it can be viewed or restored later.
                </p>
              </div>
              <Switch
                checked={createVersion}
                onCheckedChange={setCreateVersion}
                className="data-[state=unchecked]:bg-zinc-300 data-[state=unchecked]:border-zinc-400 dark:data-[state=unchecked]:bg-zinc-600"
              />
            </div>

            {createVersion && (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-1.5">
                    Version number *
                  </label>
                  <Input
                    autoFocus
                    value={versionLabel}
                    onChange={(e) => setVersionLabel(e.target.value)}
                    placeholder='e.g. "2.0" or "Rev C"'
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && versionLabel.trim()) {
                        e.preventDefault();
                        confirmSave();
                      }
                    }}
                  />
                  {createVersion && !versionLabel.trim() && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Enter a version number to record this version.
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">
                    Change note{" "}
                    <span className="text-muted-foreground text-xs">(optional)</span>
                  </label>
                  <Input
                    value={versionNote}
                    onChange={(e) => setVersionNote(e.target.value)}
                    placeholder="What changed in this version?"
                  />
                </div>
              </div>
            )}

            {saveError && <p className="text-xs text-red-600">{saveError}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSaveDialog(false)} disabled={isSaving}>
              Cancel
            </Button>
            <Button
              onClick={confirmSave}
              disabled={isSaving || (createVersion && !versionLabel.trim())}
              className="gap-1.5"
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {isSaving
                ? "Saving…"
                : createVersion
                  ? "Save as new version"
                  : "Save without version"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirmation Dialog ── */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete document?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete &ldquo;{title}&rdquo; and all of its version history.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                confirmDelete();
              }}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
                  Deleting…
                </>
              ) : (
                "Delete Document"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
