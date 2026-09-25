"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import {
  usePolicyDetail,
  usePolicyAcceptances,
  usePolicyVersions,
  usePolicyVersion,
  usePolicyMutations,
} from "@/hooks/queries";
import {
  POLICY_TYPE_LABELS,
  type PolicyType,
} from "@/lib/api/policies.api";
import { RichTextEditor } from "@/components/RichTextEditor";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
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
import {
  ChevronLeft,
  Save,
  Loader2,
  History,
  Users,
  AlertTriangle,
  ArrowUpCircle,
  Eye,
  RotateCcw,
  Search,
  Download,
  Trash2,
  CheckCircle2,
  Clock,
  ShieldCheck,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

interface Props {
  params: Promise<{ id: string }>;
}

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800",
  active: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800",
  archived: "bg-muted text-muted-foreground border-border",
};

export default function PolicyDetailPage({ params }: Props) {
  const { id } = use(params);
  const router = useRouter();
  const { hasPermission } = useAuth();

  const canUpdate = hasPermission("policies:update");
  const canDelete = hasPermission("policies:delete");
  const canHardDelete = hasPermission("policies:delete:permanent");
  const canReadAcceptances = hasPermission("policies:acceptances:read");
  const canReadVersions = hasPermission("policies:versions:read");
  const canRestoreVersion = hasPermission("policies:versions:restore");

  const { data: policy, isLoading, refetch: refetchPolicy } = usePolicyDetail(id);

  // Acceptances tab query states
  const [acceptanceSearch, setAcceptanceSearch] = useState("");
  const [acceptanceVersionFilter, setAcceptanceVersionFilter] = useState<string>("current");
  const [acceptancePage, setAcceptancePage] = useState(1);

  const selectedAcceptanceVersion =
    acceptanceVersionFilter === "current"
      ? policy?.version
      : acceptanceVersionFilter === "all"
      ? "all"
      : Number(acceptanceVersionFilter);

  const { data: acceptancesData, isLoading: acceptancesLoading } =
    usePolicyAcceptances(id, {
      page: acceptancePage,
      limit: 20,
      version: selectedAcceptanceVersion,
      search: acceptanceSearch.trim() || undefined,
    });

  const { data: versions, isLoading: versionsLoading } = usePolicyVersions(
    canReadVersions ? id : null
  );

  const {
    updatePolicy,
    deletePolicy,
    hardDeletePolicy,
    restorePolicy,
    restoreVersion,
  } = usePolicyMutations();

  // Form states
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [isRequired, setIsRequired] = useState(true);
  const [status, setStatus] = useState<string>("draft");
  const [contentHtml, setContentHtml] = useState("");
  const [contentJson, setContentJson] = useState<object>({
    type: "doc",
    content: [],
  });
  const [contentVersion, setContentVersion] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saveError, setSaveError] = useState<string | null>(null);

  // Save dialog state
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [createVersionFlag, setCreateVersionFlag] = useState(false);
  const [versionLabel, setVersionLabel] = useState("");
  const [versionNote, setVersionNote] = useState("");
  const [bumpVersion, setBumpVersion] = useState(false);

  // Preview version dialog state
  const [previewVersionId, setPreviewVersionId] = useState<string | null>(null);
  const { data: previewVersion } = usePolicyVersion(id, previewVersionId);

  // Restore version confirmation
  const [versionToRestore, setVersionToRestore] = useState<{
    id: string;
    label: string;
  } | null>(null);
  const [restoreNote, setRestoreNote] = useState("");

  // Permanent Delete Modal
  const [showHardDeleteModal, setShowHardDeleteModal] = useState(false);

  useEffect(() => {
    if (!policy) return;
    setTitle(policy.title);
    setSlug(policy.slug);
    setIsRequired(policy.isRequired);
    setStatus(policy.status);
    setContentHtml(policy.contentHtml ?? "");
    if (policy.contentJson && Object.keys(policy.contentJson).length > 0) {
      setContentJson(policy.contentJson);
    }
    setContentVersion((v) => v + 1);
  }, [policy]);

  const extractText = (html: string) =>
    html
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();

  const validate = () => {
    const e: Record<string, string> = {};
    if (!title.trim()) e.title = "Title is required";
    if (title.length > 250) e.title = "Title cannot exceed 250 characters";
    if (!slug.trim()) e.slug = "Slug is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSaveClick = () => {
    if (!validate()) return;
    setCreateVersionFlag(false);
    setVersionLabel("");
    setVersionNote("");
    setBumpVersion(false);
    setSaveError(null);
    setShowSaveDialog(true);
  };

  const confirmSave = async () => {
    if (createVersionFlag && !versionLabel.trim()) return;
    setSaveError(null);
    try {
      await updatePolicy.mutateAsync({
        id,
        data: {
          title: title.trim(),
          slug: slug.trim(),
          contentHtml,
          contentJson,
          contentText: extractText(contentHtml),
          isRequired,
          status,
          createVersion: createVersionFlag,
          versionLabel: versionLabel.trim(),
          changeNote: versionNote.trim(),
          bumpVersion,
        },
      });
      setShowSaveDialog(false);
      toast.success(
        bumpVersion
          ? `Policy version bumped to v${policy!.version + 1}! Prior acceptances reset.`
          : "Policy saved successfully!"
      );
      refetchPolicy();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Save failed";
      setSaveError(msg);
      toast.error(msg);
    }
  };

  const handleRestoreVersionConfirm = async () => {
    if (!versionToRestore) return;
    try {
      await restoreVersion.mutateAsync({
        policyId: id,
        versionId: versionToRestore.id,
        changeNote: restoreNote.trim() || undefined,
      });
      toast.success(`Successfully restored ${versionToRestore.label}`);
      setVersionToRestore(null);
      setRestoreNote("");
      refetchPolicy();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to restore version");
    }
  };

  const handleArchivePolicy = async () => {
    if (!policy) return;
    if (!confirm(`Archive "${policy.title}"? It will no longer be enforced.`)) return;
    try {
      await deletePolicy.mutateAsync(id);
      toast.success("Policy archived");
      refetchPolicy();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to archive policy");
    }
  };

  const handleUnarchivePolicy = async () => {
    if (!policy) return;
    try {
      await restorePolicy.mutateAsync({ id, status: "draft" });
      toast.success("Policy restored to Draft status");
      refetchPolicy();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to restore policy");
    }
  };

  const handleHardDeleteConfirm = async () => {
    if (!policy) return;
    try {
      await hardDeletePolicy.mutateAsync(id);
      toast.success("Policy and all associated records permanently deleted");
      router.push("/admin/policies");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete policy");
    }
  };

  const exportAcceptancesToCsv = () => {
    const list = acceptancesData?.acceptances ?? [];
    if (list.length === 0) {
      toast.error("No acceptance records to export");
      return;
    }
    const headers = ["Employee Name", "Email", "Position", "Version", "Accepted At", "IP Address"];
    const rows = list.map((a) => [
      `"${a.user.name.replace(/"/g, '""')}"`,
      `"${a.user.email}"`,
      `"${a.user.position || ""}"`,
      a.policyVersion,
      `"${format(new Date(a.acceptedAt), "yyyy-MM-dd HH:mm:ss")}"`,
      `"${a.ipAddress}"`,
    ]);
    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${policy?.slug || "policy"}-acceptances.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Exported acceptances to CSV");
  };

  if (isLoading) {
    return (
      <div className="space-y-4 max-w-5xl">
        <div className="h-10 rounded-xl bg-muted animate-pulse" />
        <div className="h-44 rounded-xl bg-muted animate-pulse" />
        <div className="h-96 rounded-xl bg-muted animate-pulse" />
      </div>
    );
  }

  if (!policy) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">Policy not found.</p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => router.push("/admin/policies")}
        >
          Return to Policies List
        </Button>
      </div>
    );
  }

  const acceptances = acceptancesData?.acceptances ?? [];

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/admin/policies")}
            className="gap-1.5"
          >
            <ChevronLeft className="w-4 h-4" />
            Policies
          </Button>
          <h1 className="text-2xl font-bold text-foreground tracking-tight truncate max-w-md">
            {policy.title}
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className={`text-xs uppercase tracking-wider font-semibold ${
              STATUS_COLORS[policy.status] || ""
            }`}
          >
            {policy.status}
          </Badge>
          <Badge variant="secondary" className="text-xs">
            {POLICY_TYPE_LABELS[policy.policyType as PolicyType] ?? policy.policyType}
          </Badge>
          <Badge variant="secondary" className="text-xs font-mono">
            v{policy.version}
          </Badge>

          {policy.status === "archived" && canUpdate && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleUnarchivePolicy}
              className="gap-1.5 text-emerald-600 hover:text-emerald-700"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Un-archive
            </Button>
          )}

          {policy.status !== "archived" && canDelete && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleArchivePolicy}
              className="gap-1.5 text-muted-foreground hover:text-amber-600"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Archive
            </Button>
          )}
        </div>
      </div>

      <Tabs defaultValue="editor">
        <TabsList className="mb-4">
          <TabsTrigger value="editor">Editor</TabsTrigger>
          {canReadAcceptances && (
            <TabsTrigger value="acceptances" className="gap-1.5">
              <Users className="w-3.5 h-3.5" />
              Acceptances ({policy.acceptanceCount})
            </TabsTrigger>
          )}
          {canReadVersions && (
            <TabsTrigger value="history" className="gap-1.5">
              <History className="w-3.5 h-3.5" />
              Versions ({versions?.length || 0})
            </TabsTrigger>
          )}
        </TabsList>

        {/* ─── Editor Tab ─── */}
        <TabsContent value="editor" className="space-y-6">
          <Card className="p-6 space-y-5">
            <h2 className="text-base font-semibold text-foreground">
              Policy Details &amp; Settings
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">
                  Title <span className="text-red-500">*</span>
                </label>
                <Input
                  value={title}
                  disabled={!canUpdate}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    setErrors({ ...errors, title: "" });
                  }}
                  placeholder="Policy title"
                  className={errors.title ? "border-red-500" : ""}
                />
                {errors.title && (
                  <p className="text-xs text-red-600 mt-1">{errors.title}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">Status</label>
                <Select
                  value={status}
                  disabled={!canUpdate}
                  onValueChange={setStatus}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft (Unpublished)</SelectItem>
                    <SelectItem value="active">Active (Enforced)</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Slug</label>
                <Input
                  value={slug}
                  disabled={!canUpdate}
                  onChange={(e) => {
                    setSlug(e.target.value);
                    setErrors({ ...errors, slug: "" });
                  }}
                  className={`font-mono text-xs ${errors.slug ? "border-red-500" : ""}`}
                />
                {errors.slug && (
                  <p className="text-xs text-red-600 mt-1">{errors.slug}</p>
                )}
              </div>

              <div className="flex items-center gap-3 rounded-lg border border-border px-3.5 py-2.5 bg-muted/20">
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">
                    Required Policy
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Employees must accept this version to be compliant
                  </p>
                </div>
                <Switch
                  checked={isRequired}
                  disabled={!canUpdate}
                  onCheckedChange={setIsRequired}
                />
              </div>
            </div>

            {(policy.createdBy || policy.updatedBy) && (
              <div className="flex flex-wrap gap-4 pt-2 text-xs text-muted-foreground border-t border-border">
                {policy.createdBy && (
                  <span>
                    Created by <strong>{policy.createdBy.name}</strong>{" "}
                    {policy.createdAt && format(new Date(policy.createdAt), "PP")}
                  </span>
                )}
                {policy.updatedBy && policy.updatedAt && (
                  <span>
                    Last edited by <strong>{policy.updatedBy.name}</strong>{" "}
                    {formatDistanceToNow(new Date(policy.updatedAt), {
                      addSuffix: true,
                    })}
                  </span>
                )}
              </div>
            )}
          </Card>

          <Card className="p-4 2xl:p-6 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-foreground">
                Policy Document Body
              </h2>
              <span className="text-xs text-muted-foreground">
                Live editor with full formatting controls
              </span>
            </div>
            <RichTextEditor
              value={contentHtml}
              onChange={setContentHtml}
              onChangeJson={setContentJson}
              placeholder="Write your policy terms and text here..."
              externalContentVersion={contentVersion}
            />
          </Card>

          {saveError && (
            <div className="rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-600 dark:text-red-400">
              {saveError}
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            <div>
              {policy.status === "archived" && canHardDelete && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowHardDeleteModal(true)}
                  className="gap-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30"
                >
                  <Trash2 className="w-4 h-4" />
                  Permanently Delete
                </Button>
              )}
            </div>

            <div className="flex items-center gap-3">
              <Button
                onClick={() => router.push("/admin/policies")}
                variant="outline"
              >
                Cancel
              </Button>
              {canUpdate && (
                <Button
                  onClick={handleSaveClick}
                  disabled={updatePolicy.isPending}
                  className="gap-2"
                >
                  <Save className="w-4 h-4" />
                  Save Changes…
                </Button>
              )}
            </div>
          </div>
        </TabsContent>

        {/* ─── Acceptances Tab ─── */}
        {canReadAcceptances && (
          <TabsContent value="acceptances" className="space-y-4">
            <Card className="p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
                <div>
                  <h2 className="text-base font-semibold text-foreground">
                    Employee Acceptance Log
                  </h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Records of authenticated employee acknowledgments with timestamp and IP address.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={exportAcceptancesToCsv}
                    className="gap-1.5 h-8 text-xs"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Export CSV
                  </Button>
                </div>
              </div>

              {/* Filters for acceptances */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={acceptanceSearch}
                    onChange={(e) => {
                      setAcceptanceSearch(e.target.value);
                      setAcceptancePage(1);
                    }}
                    placeholder="Search by employee name or email…"
                    className="pl-9 h-8 text-xs"
                  />
                </div>

                <Select
                  value={acceptanceVersionFilter}
                  onValueChange={(v) => {
                    setAcceptanceVersionFilter(v);
                    setAcceptancePage(1);
                  }}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="current">
                      Current Version only (v{policy.version})
                    </SelectItem>
                    <SelectItem value="all">All Versions</SelectItem>
                    {versions?.map((v) => (
                      <SelectItem key={v._id} value={String(v.version)}>
                        Version {v.versionLabel || `v${v.version}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {acceptancesLoading ? (
                <div className="space-y-2 py-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-14 rounded-lg bg-muted animate-pulse" />
                  ))}
                </div>
              ) : acceptances.length === 0 ? (
                <div className="text-center py-12 border border-dashed rounded-xl">
                  <ShieldCheck className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
                  <p className="text-sm font-medium text-foreground">
                    No acceptance records found
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {acceptanceSearch
                      ? "No employees match your search query."
                      : `No employees have accepted version ${selectedAcceptanceVersion} yet.`}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {acceptances.map((a) => (
                    <div
                      key={a._id}
                      className="flex items-center justify-between px-3.5 py-3 rounded-lg border border-border bg-card hover:bg-muted/20 transition-colors"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-foreground truncate">
                            {a.user.name}
                          </p>
                          <Badge variant="outline" className="text-[10px] font-mono">
                            v{a.policyVersion}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">
                          {a.user.email}
                          {a.user.position && ` · ${a.user.position}`}
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <p className="text-xs font-medium text-foreground">
                          {format(new Date(a.acceptedAt), "PPp")}
                        </p>
                        <p className="text-[10px] text-muted-foreground/60 font-mono mt-0.5">
                          IP: {a.ipAddress || "Internal"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Acceptances Pagination */}
              {acceptancesData?.pagination &&
                acceptancesData.pagination.totalPages > 1 && (
                  <div className="flex items-center justify-between pt-4 mt-2 border-t border-border">
                    <p className="text-xs text-muted-foreground">
                      Page {acceptancesData.pagination.page} of{" "}
                      {acceptancesData.pagination.totalPages} (
                      {acceptancesData.pagination.total} records)
                    </p>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={acceptancePage <= 1}
                        onClick={() => setAcceptancePage((p) => Math.max(1, p - 1))}
                        className="h-7 px-2 text-xs"
                      >
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={
                          acceptancePage >= acceptancesData.pagination.totalPages
                        }
                        onClick={() => setAcceptancePage((p) => p + 1)}
                        className="h-7 px-2 text-xs"
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
            </Card>
          </TabsContent>
        )}

        {/* ─── Version History Tab ─── */}
        {canReadVersions && (
          <TabsContent value="history" className="space-y-4">
            <Card className="p-6">
              <h2 className="text-base font-semibold text-foreground mb-1">
                Version Snapshots
              </h2>
              <p className="text-xs text-muted-foreground mb-4">
                Immutable snapshots recorded when editing or bumping policy versions.
              </p>

              {versionsLoading ? (
                <div className="space-y-2 py-4">
                  {[1, 2].map((i) => (
                    <div key={i} className="h-14 rounded-lg bg-muted animate-pulse" />
                  ))}
                </div>
              ) : !versions || versions.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No snapshots recorded yet.
                </p>
              ) : (
                <div className="space-y-2">
                  {versions.map((v) => (
                    <div
                      key={v._id}
                      className="flex items-center justify-between px-3.5 py-3 rounded-lg border border-border bg-card hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <Badge
                          variant="secondary"
                          className="text-xs font-mono shrink-0"
                        >
                          {v.versionLabel || `v${v.version}`}
                        </Badge>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">
                            {v.title}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {v.changedBy?.name ?? "System"} ·{" "}
                            {formatDistanceToNow(new Date(v.changedAt), {
                              addSuffix: true,
                            })}
                            {v.changeNote && ` — ${v.changeNote}`}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setPreviewVersionId(v._id)}
                          title="Preview version content"
                          className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        {canRestoreVersion && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                              setVersionToRestore({
                                id: v._id,
                                label: v.versionLabel || `v${v.version}`,
                              })
                            }
                            title="Restore this version"
                            className="h-8 w-8 text-muted-foreground hover:text-primary"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Version Preview Modal */}
            <Dialog
              open={!!previewVersionId}
              onOpenChange={() => setPreviewVersionId(null)}
            >
              <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    Version Preview
                    {previewVersion && (
                      <Badge variant="secondary" className="text-xs font-mono">
                        {previewVersion.versionLabel || `v${previewVersion.version}`}
                      </Badge>
                    )}
                  </DialogTitle>
                  <DialogDescription>
                    {previewVersion?.title} — Recorded{" "}
                    {previewVersion &&
                      format(new Date(previewVersion.changedAt), "PPp")}
                  </DialogDescription>
                </DialogHeader>
                {previewVersion ? (
                  <div
                    className="prose prose-sm max-w-none py-2 text-foreground/90 leading-relaxed border-t border-border pt-4"
                    dangerouslySetInnerHTML={{ __html: previewVersion.contentHtml }}
                  />
                ) : (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  </div>
                )}
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setPreviewVersionId(null)}
                  >
                    Close Preview
                  </Button>
                  {canRestoreVersion && previewVersion && (
                    <Button
                      onClick={() => {
                        const targetId = previewVersion._id;
                        const label =
                          previewVersion.versionLabel || `v${previewVersion.version}`;
                        setPreviewVersionId(null);
                        setVersionToRestore({ id: targetId, label });
                      }}
                      className="gap-1.5"
                    >
                      <RotateCcw className="w-4 h-4" />
                      Restore This Version
                    </Button>
                  )}
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Restore Confirmation Dialog */}
            <Dialog
              open={!!versionToRestore}
              onOpenChange={(open) => !open && setVersionToRestore(null)}
            >
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Restore Version</DialogTitle>
                  <DialogDescription>
                    Restore policy content from{" "}
                    <strong className="text-foreground">{versionToRestore?.label}</strong>?
                    Current editor content will be updated to match this historical version.
                  </DialogDescription>
                </DialogHeader>
                <div className="py-2">
                  <label className="block text-xs font-medium mb-1">
                    Audit note (optional)
                  </label>
                  <Input
                    value={restoreNote}
                    onChange={(e) => setRestoreNote(e.target.value)}
                    placeholder='e.g., "Reverted unwanted clause changes"'
                    className="h-8 text-xs"
                  />
                </div>
                <DialogFooter className="gap-2 sm:gap-0">
                  <Button
                    variant="outline"
                    onClick={() => setVersionToRestore(null)}
                    disabled={restoreVersion.isPending}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleRestoreVersionConfirm}
                    disabled={restoreVersion.isPending}
                    className="gap-1.5"
                  >
                    {restoreVersion.isPending && (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    )}
                    Confirm Restore
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </TabsContent>
        )}
      </Tabs>

      {/* Save Changes Modal with Version Options */}
      <Dialog
        open={showSaveDialog}
        onOpenChange={(open) => !updatePolicy.isPending && setShowSaveDialog(open)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Save Policy Updates</DialogTitle>
            <DialogDescription>
              Configure version tracking and acceptance requirements for this update.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="flex items-center justify-between gap-3 rounded-lg border border-border p-3">
              <div>
                <p className="text-sm font-medium">Create Version Snapshot</p>
                <p className="text-xs text-muted-foreground">
                  Preserve this content in version history.
                </p>
              </div>
              <Switch
                checked={createVersionFlag}
                onCheckedChange={setCreateVersionFlag}
              />
            </div>

            {createVersionFlag && (
              <div className="space-y-3 pl-1 bg-muted/30 p-3 rounded-lg border border-border">
                <div>
                  <label className="block text-xs font-medium mb-1">
                    Version label <span className="text-red-500">*</span>
                  </label>
                  <Input
                    value={versionLabel}
                    onChange={(e) => setVersionLabel(e.target.value)}
                    placeholder='e.g., "2.0" or "Q3-2026-Revision"'
                    className="h-8 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Change note</label>
                  <Input
                    value={versionNote}
                    onChange={(e) => setVersionNote(e.target.value)}
                    placeholder="Brief description of updates"
                    className="h-8 text-xs"
                  />
                </div>
              </div>
            )}

            <div className="flex items-center justify-between gap-3 rounded-lg border border-amber-200 dark:border-amber-900 bg-amber-500/10 p-3">
              <div>
                <p className="text-sm font-medium text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                  <ArrowUpCircle className="w-4 h-4 text-amber-600" />
                  Bump Policy Version Number
                </p>
                <p className="text-xs text-amber-700 dark:text-amber-400">
                  Invalidates all prior acceptances. Forces all employees to re-accept.
                </p>
              </div>
              <Switch
                checked={bumpVersion}
                onCheckedChange={setBumpVersion}
              />
            </div>

            {bumpVersion && (
              <div className="flex items-start gap-2 rounded-lg bg-red-500/10 border border-red-500/20 p-3">
                <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                <p className="text-xs text-red-700 dark:text-red-400">
                  Version will increase from <strong>v{policy.version}</strong> to{" "}
                  <strong>v{policy.version + 1}</strong>. All employees will be prompted
                  to accept this newly published version upon next login.
                </p>
              </div>
            )}

            {saveError && <p className="text-xs text-red-600">{saveError}</p>}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setShowSaveDialog(false)}
              disabled={updatePolicy.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={confirmSave}
              disabled={
                updatePolicy.isPending || (createVersionFlag && !versionLabel.trim())
              }
              className="gap-1.5"
            >
              {updatePolicy.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {updatePolicy.isPending ? "Saving…" : "Confirm & Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Permanent Delete Modal */}
      <Dialog
        open={showHardDeleteModal}
        onOpenChange={(open) => !open && setShowHardDeleteModal(false)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2 text-destructive mb-1">
              <AlertTriangle className="w-5 h-5" />
              <DialogTitle>Permanently Delete Policy</DialogTitle>
            </div>
            <DialogDescription>
              Are you completely sure? This will permanently remove{" "}
              <strong className="text-foreground">{policy.title}</strong>, all of its
              version history snapshots, and all employee acceptance records.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setShowHardDeleteModal(false)}
              disabled={hardDeletePolicy.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleHardDeleteConfirm}
              disabled={hardDeletePolicy.isPending}
              className="gap-1.5"
            >
              {hardDeletePolicy.isPending && (
                <Loader2 className="w-4 h-4 animate-spin" />
              )}
              Permanently Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
