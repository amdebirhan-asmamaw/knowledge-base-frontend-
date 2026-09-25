"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { usePolicies, usePolicyMutations } from "@/hooks/queries";
import {
  POLICY_TYPES,
  POLICY_TYPE_LABELS,
  type PolicyType,
  type PolicySummary,
} from "@/lib/api/policies.api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Plus,
  Loader2,
  ScrollText,
  Trash2,
  BarChart3,
  Edit2,
  Users,
  Search,
  RotateCcw,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  FilterX,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800",
  active: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800",
  archived: "bg-muted text-muted-foreground border-border",
};

export default function AdminPoliciesPage() {
  const router = useRouter();
  const { hasPermission } = useAuth();

  const canCreate = hasPermission("policies:create");
  const canUpdate = hasPermission("policies:update");
  const canDelete = hasPermission("policies:delete");
  const canHardDelete = hasPermission("policies:delete:permanent");

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [requiredFilter, setRequiredFilter] = useState<string>("all");

  const isRequiredBool =
    requiredFilter === "required"
      ? true
      : requiredFilter === "optional"
      ? false
      : undefined;

  const { policies, pagination, isLoading, invalidate } = usePolicies({
    page,
    limit: 15,
    search: search.trim() || undefined,
    status: statusFilter !== "all" ? statusFilter : undefined,
    policyType: typeFilter !== "all" ? typeFilter : undefined,
    isRequired: isRequiredBool,
    sortBy: "createdAt",
    sortOrder: "desc",
  });

  const { deletePolicy, restorePolicy, hardDeletePolicy } = usePolicyMutations();

  // Action dialog states
  const [archiveTarget, setArchiveTarget] = useState<PolicySummary | null>(null);
  const [restoreTarget, setRestoreTarget] = useState<PolicySummary | null>(null);
  const [hardDeleteTarget, setHardDeleteTarget] = useState<PolicySummary | null>(null);

  const handleArchiveConfirm = async () => {
    if (!archiveTarget) return;
    try {
      await deletePolicy.mutateAsync(archiveTarget._id);
      toast.success(`Archived "${archiveTarget.title}"`);
      setArchiveTarget(null);
      invalidate();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to archive policy");
    }
  };

  const handleRestoreConfirm = async () => {
    if (!restoreTarget) return;
    try {
      await restorePolicy.mutateAsync({ id: restoreTarget._id, status: "draft" });
      toast.success(`Restored "${restoreTarget.title}" as draft`);
      setRestoreTarget(null);
      invalidate();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to restore policy");
    }
  };

  const handleHardDeleteConfirm = async () => {
    if (!hardDeleteTarget) return;
    try {
      await hardDeletePolicy.mutateAsync(hardDeleteTarget._id);
      toast.success(`Permanently deleted "${hardDeleteTarget.title}"`);
      setHardDeleteTarget(null);
      invalidate();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to permanently delete policy"
      );
    }
  };

  const hasActiveFilters =
    search.trim() !== "" ||
    statusFilter !== "all" ||
    typeFilter !== "all" ||
    requiredFilter !== "all";

  const resetFilters = () => {
    setSearch("");
    setStatusFilter("all");
    setTypeFilter("all");
    setRequiredFilter("all");
    setPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">
            Employment Policies
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Create, publish, and audit company governance, compliance, and legal policies.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/admin/policies/compliance")}
            className="gap-1.5"
          >
            <BarChart3 className="w-4 h-4" />
            Compliance Audit
          </Button>
          {canCreate && (
            <Button
              onClick={() => router.push("/admin/policies/new")}
              size="sm"
              className="gap-1.5"
            >
              <Plus className="w-4 h-4" />
              New Policy
            </Button>
          )}
        </div>
      </div>

      {/* Search & Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 items-center">
        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search title, slug, content…"
            className="pl-9 h-9 text-sm"
          />
        </div>

        {/* Status Filter */}
        <Select
          value={statusFilter}
          onValueChange={(v) => {
            setStatusFilter(v);
            setPage(1);
          }}
        >
          <SelectTrigger className="h-9 text-sm">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
          </SelectContent>
        </Select>

        {/* Type Filter */}
        <Select
          value={typeFilter}
          onValueChange={(v) => {
            setTypeFilter(v);
            setPage(1);
          }}
        >
          <SelectTrigger className="h-9 text-sm">
            <SelectValue placeholder="Policy Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Policy Types</SelectItem>
            {POLICY_TYPES.map((t) => (
              <SelectItem key={t} value={t}>
                {POLICY_TYPE_LABELS[t]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Requirement Filter */}
        <div className="flex items-center gap-2">
          <Select
            value={requiredFilter}
            onValueChange={(v) => {
              setRequiredFilter(v);
              setPage(1);
            }}
          >
            <SelectTrigger className="h-9 text-sm flex-1">
              <SelectValue placeholder="Requirement" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Requirements</SelectItem>
              <SelectItem value="required">Mandatory (Required)</SelectItem>
              <SelectItem value="optional">Optional</SelectItem>
            </SelectContent>
          </Select>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="icon"
              onClick={resetFilters}
              title="Reset filters"
              className="h-9 w-9 shrink-0 text-muted-foreground hover:text-foreground"
            >
              <FilterX className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Policy list */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : policies.length === 0 ? (
        <Card className="p-12 text-center border-dashed">
          <ScrollText className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
          <h3 className="font-semibold text-foreground text-sm">
            {hasActiveFilters ? "No matching policies found" : "No policies created yet"}
          </h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
            {hasActiveFilters
              ? "Try adjusting your search terms or filters to find what you're looking for."
              : "Create your organization's first policy such as Terms & Conditions or Code of Conduct."}
          </p>
          {hasActiveFilters ? (
            <Button
              variant="outline"
              size="sm"
              onClick={resetFilters}
              className="mt-4 gap-1.5"
            >
              <FilterX className="w-3.5 h-3.5" /> Reset Filters
            </Button>
          ) : canCreate ? (
            <Button
              size="sm"
              onClick={() => router.push("/admin/policies/new")}
              className="mt-4 gap-1.5"
            >
              <Plus className="w-4 h-4" /> New Policy
            </Button>
          ) : null}
        </Card>
      ) : (
        <div className="space-y-2.5">
          {policies.map((policy) => (
            <Card
              key={policy._id}
              className="p-4 hover:bg-muted/40 transition-colors cursor-pointer group rounded-xl border-border"
              onClick={() => router.push(`/admin/policies/${policy._id}`)}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
                  <div className="p-2.5 rounded-lg bg-primary/10 text-primary shrink-0 mt-0.5 sm:mt-0">
                    <ScrollText className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h3 className="font-semibold text-sm text-foreground truncate max-w-md">
                        {policy.title}
                      </h3>
                      <Badge
                        variant="outline"
                        className={`text-[11px] font-medium shrink-0 uppercase tracking-wider ${
                          STATUS_COLORS[policy.status] || ""
                        }`}
                      >
                        {policy.status}
                      </Badge>
                      {policy.isRequired && (
                        <Badge
                          variant="outline"
                          className="text-[11px] font-medium shrink-0 bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20"
                        >
                          Required
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground flex flex-wrap items-center gap-1.5">
                      <span className="font-medium text-foreground/80">
                        {POLICY_TYPE_LABELS[policy.policyType] ?? policy.policyType}
                      </span>
                      <span>·</span>
                      <span className="font-mono">v{policy.version}</span>
                      {policy.createdBy && (
                        <>
                          <span>·</span>
                          <span>by {policy.createdBy.name}</span>
                        </>
                      )}
                      {policy.publishedAt && (
                        <>
                          <span>·</span>
                          <span>
                            Published {format(new Date(policy.publishedAt), "PP")}
                          </span>
                        </>
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-center">
                  {/* Acceptance count */}
                  <div
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-secondary text-xs text-muted-foreground"
                    title={`Accepted by ${policy.acceptanceCount} employees at current version`}
                  >
                    <Users className="w-3.5 h-3.5 text-primary" />
                    <span className="font-medium text-foreground">
                      {policy.acceptanceCount}
                    </span>
                    <span className="hidden sm:inline">accepted</span>
                  </div>

                  {canUpdate && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/admin/policies/${policy._id}`);
                      }}
                      className="h-8 w-8 text-muted-foreground hover:text-primary"
                      title="Edit policy"
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                  )}

                  {/* Restore button if archived */}
                  {policy.status === "archived" && canUpdate && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        setRestoreTarget(policy);
                      }}
                      className="h-8 w-8 text-muted-foreground hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                      title="Restore as draft"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </Button>
                  )}

                  {/* Soft delete (archive) button if active or draft */}
                  {policy.status !== "archived" && canDelete && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        setArchiveTarget(policy);
                      }}
                      className="h-8 w-8 text-muted-foreground hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/30"
                      title="Archive policy"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}

                  {/* Hard delete button if archived and has permanent delete perm */}
                  {policy.status === "archived" && canHardDelete && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        setHardDeleteTarget(policy);
                      }}
                      className="h-8 w-8 text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                      title="Permanently delete policy"
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-xs text-muted-foreground">
            Showing Page {pagination.page} of {pagination.totalPages} ({pagination.total}{" "}
            policies)
          </p>
          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="h-8 px-2.5 gap-1 text-xs"
            >
              <ChevronLeft className="w-3.5 h-3.5" /> Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= pagination.totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="h-8 px-2.5 gap-1 text-xs"
            >
              Next <ChevronRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      )}

      {/* Archive Modal */}
      <Dialog open={!!archiveTarget} onOpenChange={(open) => !open && setArchiveTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Archive Policy</DialogTitle>
            <DialogDescription>
              Are you sure you want to archive{" "}
              <strong className="text-foreground">{archiveTarget?.title}</strong>? It will no
              longer be displayed as active or enforced for mandatory employee acceptance.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setArchiveTarget(null)}
              disabled={deletePolicy.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleArchiveConfirm}
              disabled={deletePolicy.isPending}
              className="gap-1.5"
            >
              {deletePolicy.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              Archive Policy
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Restore Modal */}
      <Dialog open={!!restoreTarget} onOpenChange={(open) => !open && setRestoreTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Restore Policy</DialogTitle>
            <DialogDescription>
              Restore <strong className="text-foreground">{restoreTarget?.title}</strong> back
              to Draft status? You can then review and publish it again.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setRestoreTarget(null)}
              disabled={restorePolicy.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleRestoreConfirm}
              disabled={restorePolicy.isPending}
              className="gap-1.5"
            >
              {restorePolicy.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              Restore Policy
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Permanent Delete Modal */}
      <Dialog
        open={!!hardDeleteTarget}
        onOpenChange={(open) => !open && setHardDeleteTarget(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2 text-destructive mb-1">
              <AlertTriangle className="w-5 h-5" />
              <DialogTitle>Permanently Delete Policy</DialogTitle>
            </div>
            <DialogDescription>
              This action <strong className="text-destructive">cannot be undone</strong>. This
              will permanently delete{" "}
              <strong className="text-foreground">{hardDeleteTarget?.title}</strong>, all of
              its version snapshots, and all employee acceptance audit trails.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setHardDeleteTarget(null)}
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
              {hardDeletePolicy.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              Delete Permanently
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
