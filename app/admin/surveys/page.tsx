"use client";

import { useState } from "react";
import {
  useSurveys,
  useSurveyMutations,
  useSurveyResponses,
  useSurveySummary,
  useSurveyStats,
  useDepartments,
  useEmployees,
} from "@/hooks/queries";
import { useAuth } from "@/hooks/use-auth";
import type {
  Survey,
  SurveyField,
  SurveyFieldType,
  FieldOption,
  SurveyFilters,
  SurveyStatus,
  SurveyCategory,
  SurveyScope,
} from "@/lib/api/surveys.api";
import { exportSurveyResponses } from "@/lib/api/surveys.api";
import { ShareLinkCard } from "@/components/ShareLinkCard";
import { submissionLabel, submissionBadgeClass } from "@/lib/survey-status";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ClipboardList,
  Plus,
  Loader2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Save,
  Send,
  Trash2,
  Edit3,
  Filter,
  X,
  BarChart3,
  Users,
  Eye,
  Settings,
  Globe,
  Lock,
  Download,
  ArrowUp,
  ArrowDown,
  Copy,
  Check,
  ExternalLink,
  Sparkles,
  CheckCircle2,
  Star,
  Layers,
  Search,
  RotateCcw,
  Calendar,
  ShieldAlert,
} from "lucide-react";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";

type View = "list" | "builder" | "detail" | "responses" | "preview";

const CATEGORIES: { value: SurveyCategory; label: string }[] = [
  { value: "feedback", label: "Feedback" },
  { value: "ideas", label: "Ideas" },
  { value: "satisfaction", label: "Satisfaction" },
  { value: "poll", label: "Poll" },
  { value: "other", label: "Other" },
];

const CATEGORY_COLORS: Record<SurveyCategory, string> = {
  feedback: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-900/40",
  ideas: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-900/40",
  satisfaction: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/40",
  poll: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-900/40",
  other: "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800",
};

const FIELD_TYPES: { type: SurveyFieldType; label: string; icon: string }[] = [
  { type: "text", label: "Short Text", icon: "Aa" },
  { type: "textarea", label: "Long Text", icon: "¶" },
  { type: "number", label: "Number", icon: "#" },
  { type: "rating", label: "Rating (1-5)", icon: "★" },
  { type: "select", label: "Dropdown", icon: "▼" },
  { type: "multi-select", label: "Multi Select", icon: "☑" },
  { type: "radio", label: "Single Choice", icon: "○" },
  { type: "checkbox", label: "Checkbox", icon: "✓" },
  { type: "date", label: "Date", icon: "📅" },
];

const STATUS_BADGES: Record<SurveyStatus, { label: string; className: string; dot: string }> = {
  published: {
    label: "Published",
    className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/50",
    dot: "bg-emerald-500",
  },
  draft: {
    label: "Draft",
    className: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-900/50",
    dot: "bg-amber-500",
  },
  closed: {
    label: "Closed",
    className: "bg-muted text-muted-foreground border-border",
    dot: "bg-muted-foreground",
  },
};

export default function AdminSurveysPage() {
  const [view, setView] = useState<View>("list");
  const [selected, setSelected] = useState<Survey | null>(null);
  const [filters, setFilters] = useState<SurveyFilters>({ page: 1, limit: 15, search: "" });
  const [deleteTarget, setDeleteTarget] = useState<Survey | null>(null);
  const [cloningId, setCloningId] = useState<string | null>(null);
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);

  const { surveys, pagination, isLoading, error } = useSurveys(filters);
  const { data: stats, isLoading: isStatsLoading } = useSurveyStats();
  const { createSurvey, updateSurvey, updateStatus, cloneSurvey, deleteSurvey } = useSurveyMutations();
  const { hasPermission, isAdmin } = useAuth();
  const canManage = isAdmin || hasPermission("surveys:write") || hasPermission("surveys:manage");

  const goList = () => {
    setSelected(null);
    setView("list");
  };

  const handleSave = async (data: Record<string, unknown>, status: SurveyStatus) => {
    try {
      const payload = { ...data, status };
      if (selected) {
        await updateSurvey.mutateAsync({ id: selected._id, data: payload });
        toast.success(`Survey "${(data.title as string) || "Survey"}" updated successfully`);
      } else {
        await createSurvey.mutateAsync(payload);
        toast.success(`Survey "${(data.title as string) || "Survey"}" created successfully`);
      }
      goList();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save survey";
      toast.error(msg);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      await deleteSurvey.mutateAsync(deleteTarget._id);
      toast.success(`Survey "${deleteTarget.title}" deleted`);
      setDeleteTarget(null);
      if (selected?._id === deleteTarget._id) {
        goList();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to delete survey";
      toast.error(msg);
    }
  };

  const handleQuickStatusChange = async (s: Survey, newStatus: SurveyStatus) => {
    try {
      setUpdatingStatusId(s._id);
      await updateStatus.mutateAsync({ id: s._id, status: newStatus });
      toast.success(`Survey status changed to ${newStatus}`);
      if (selected?._id === s._id) {
        setSelected((prev) => (prev ? { ...prev, status: newStatus } : null));
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update survey status";
      toast.error(msg);
    } finally {
      setUpdatingStatusId(null);
    }
  };

  const handleClone = async (s: Survey) => {
    try {
      setCloningId(s._id);
      const cloned = await cloneSurvey.mutateAsync(s._id);
      toast.success(`Survey "${s.title}" cloned as draft!`);
      setSelected(cloned);
      setView("builder");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to clone survey";
      toast.error(msg);
    } finally {
      setCloningId(null);
    }
  };

  const handleCopyLink = async (s: Survey) => {
    const url = typeof window !== "undefined" ? `${window.location.origin}/survey/${s._id}` : "";
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Public survey link copied to clipboard!");
    } catch {
      toast.error("Failed to copy link");
    }
  };

  const handleExportCSV = async (s: Survey) => {
    try {
      const data = await exportSurveyResponses(s._id);
      if (!data || !data.headers || data.headers.length === 0) {
        toast.info("No responses to export yet");
        return;
      }
      const csv = [
        data.headers.join(","),
        ...data.rows.map((r) =>
          data.headers.map((h) => `"${(r[h] || "").replace(/"/g, '""')}"`).join(",")
        ),
      ].join("\n");
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${s.title.toLowerCase().replace(/[^a-z0-9]/g, "_")}_responses.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success(`Exported ${data.total} response(s) to CSV`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to export responses";
      toast.error(msg);
    }
  };

  const resetFilters = () => {
    setFilters({ page: 1, limit: 15, search: "" });
  };

  const hasActiveFilters = Boolean(
    filters.search || filters.status || (filters as any).category || (filters as any).scope
  );

  // Sub-views
  if (view === "builder") {
    return (
      <SurveyBuilder
        initial={selected}
        onSave={handleSave}
        onCancel={goList}
        isSaving={createSurvey.isPending || updateSurvey.isPending}
      />
    );
  }

  if (view === "preview" && selected) {
    return <PreviewView survey={selected} onBack={() => setView("detail")} />;
  }

  if (view === "responses" && selected) {
    return (
      <ResponsesView
        survey={selected}
        onBack={goList}
        onExport={() => handleExportCSV(selected)}
      />
    );
  }

  if (view === "detail" && selected) {
    return (
      <SurveyDetail
        survey={selected}
        onBack={goList}
        onEdit={() => setView("builder")}
        onResponses={() => setView("responses")}
        onPreview={() => setView("preview")}
        onClone={() => handleClone(selected)}
        onStatusChange={(status) => handleQuickStatusChange(selected, status)}
        onDelete={() => setDeleteTarget(selected)}
        onExport={() => handleExportCSV(selected)}
        canManage={canManage}
        isCloning={cloningId === selected._id}
        isUpdatingStatus={updatingStatusId === selected._id}
      />
    );
  }

  // ─── List View ─────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20 text-primary">
            <ClipboardList className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Surveys & Feedback</h1>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Design questionnaires, engage employees or external clients, and inspect real-time responses.
            </p>
          </div>
        </div>
        {canManage && (
          <Button
            onClick={() => {
              setSelected(null);
              setView("builder");
            }}
            className="gap-2 shadow-sm"
          >
            <Plus className="w-4 h-4" /> New Survey
          </Button>
        )}
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
        <Card
          onClick={() => setFilters((f) => ({ ...f, status: undefined, page: 1 }))}
          className={`p-4 cursor-pointer transition-all hover:border-primary/40 ${
            !filters.status ? "border-primary/60 bg-primary/[0.03]" : ""
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-muted-foreground">Total Surveys</span>
            <Layers className="w-4 h-4 text-muted-foreground" />
          </div>
          <div className="text-2xl font-bold">
            {isStatsLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : stats?.total ?? 0}
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">
            {stats ? `${stats.byScope.internal || 0} internal · ${stats.byScope.external || 0} external` : "All scopes"}
          </p>
        </Card>

        <Card
          onClick={() =>
            setFilters((f) => ({
              ...f,
              status: f.status === "published" ? undefined : "published",
              page: 1,
            }))
          }
          className={`p-4 cursor-pointer transition-all hover:border-emerald-500/50 ${
            filters.status === "published" ? "border-emerald-500 bg-emerald-500/[0.04]" : ""
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Published
            </span>
            <Globe className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            {isStatsLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : stats?.byStatus.published ?? 0}
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">Active & accepting</p>
        </Card>

        <Card
          onClick={() =>
            setFilters((f) => ({
              ...f,
              status: f.status === "draft" ? undefined : "draft",
              page: 1,
            }))
          }
          className={`p-4 cursor-pointer transition-all hover:border-amber-500/50 ${
            filters.status === "draft" ? "border-amber-500 bg-amber-500/[0.04]" : ""
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              Drafts
            </span>
            <Edit3 className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
            {isStatsLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : stats?.byStatus.draft ?? 0}
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">In preparation</p>
        </Card>

        <Card
          onClick={() =>
            setFilters((f) => ({
              ...f,
              status: f.status === "closed" ? undefined : "closed",
              page: 1,
            }))
          }
          className={`p-4 cursor-pointer transition-all hover:border-border ${
            filters.status === "closed" ? "border-foreground/30 bg-muted/40" : ""
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-muted-foreground" />
              Closed
            </span>
            <Lock className="w-4 h-4 text-muted-foreground" />
          </div>
          <div className="text-2xl font-bold">
            {isStatsLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : stats?.byStatus.closed ?? 0}
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">Archived results</p>
        </Card>

        <Card className="p-4 col-span-2 lg:col-span-1 bg-gradient-to-br from-primary/5 via-primary/[0.02] to-transparent">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-primary">Total Responses</span>
            <BarChart3 className="w-4 h-4 text-primary" />
          </div>
          <div className="text-2xl font-bold text-primary">
            {isStatsLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : stats?.totalResponses ?? 0}
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">
            ~{stats?.avgResponsesPerSurvey ?? 0} avg / survey
          </p>
        </Card>
      </div>

      {/* Filter and Search Toolbar */}
      <Card className="p-3.5">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <Input
              value={filters.search || ""}
              onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value, page: 1 }))}
              placeholder="Search surveys by title or description..."
              className="pl-9 pr-8 text-sm h-9"
            />
            {filters.search && (
              <button
                type="button"
                onClick={() => setFilters((f) => ({ ...f, search: "", page: 1 }))}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground shrink-0 mr-1">
              <Filter className="w-3.5 h-3.5" /> Filters:
            </div>

            <select
              className="border border-input rounded-lg px-2.5 py-1.5 text-xs bg-background text-foreground h-9"
              value={filters.status || ""}
              onChange={(e) =>
                setFilters((f) => ({
                  ...f,
                  status: (e.target.value || undefined) as SurveyStatus | undefined,
                  page: 1,
                }))
              }
            >
              <option value="">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="closed">Closed</option>
            </select>

            <select
              className="border border-input rounded-lg px-2.5 py-1.5 text-xs bg-background text-foreground h-9"
              value={(filters as any).category || ""}
              onChange={(e) =>
                setFilters((f) => ({
                  ...f,
                  category: (e.target.value || undefined) as any,
                  page: 1,
                }))
              }
            >
              <option value="">All Categories</option>
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>

            <select
              className="border border-input rounded-lg px-2.5 py-1.5 text-xs bg-background text-foreground h-9"
              value={(filters as any).scope || ""}
              onChange={(e) =>
                setFilters((f) => ({
                  ...f,
                  scope: (e.target.value || undefined) as any,
                  page: 1,
                }))
              }
            >
              <option value="">All Scopes</option>
              <option value="internal">Internal Only</option>
              <option value="external">External / Public</option>
            </select>

            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={resetFilters}
                className="h-9 px-2 text-xs text-muted-foreground hover:text-foreground"
              >
                <RotateCcw className="w-3.5 h-3.5 mr-1" /> Reset
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Main Content Area */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-xs text-muted-foreground">Loading surveys...</p>
        </div>
      ) : error ? (
        <Card className="p-8 text-center border-destructive/20 bg-destructive/5 text-destructive">
          <AlertCircle className="w-8 h-8 mx-auto mb-2" />
          <h3 className="font-semibold text-sm">Failed to load surveys</h3>
          <p className="text-xs text-muted-foreground mt-1">{error}</p>
        </Card>
      ) : surveys.length === 0 ? (
        <Card className="p-16 text-center border-dashed">
          <ClipboardList className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
          <h3 className="font-semibold text-base mb-1">No surveys found</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto mb-4">
            {hasActiveFilters
              ? "No surveys matched the selected filters. Try broadening your search or resetting filters."
              : "Get started by building your first survey to collect structured feedback from teams or clients."}
          </p>
          {hasActiveFilters ? (
            <Button variant="outline" size="sm" onClick={resetFilters}>
              Reset Filters
            </Button>
          ) : canManage ? (
            <Button
              onClick={() => {
                setSelected(null);
                setView("builder");
              }}
              size="sm"
              className="gap-1.5"
            >
              <Plus className="w-4 h-4" /> Create Survey
            </Button>
          ) : null}
        </Card>
      ) : (
        <div className="space-y-3">
          {surveys.map((s) => {
            const statusConfig = STATUS_BADGES[s.status] || STATUS_BADGES.draft;
            const isExternal = s.scope === "external";
            return (
              <Card
                key={s._id}
                className="p-4 transition-all hover:border-primary/40 hover:shadow-sm"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  {/* Info block */}
                  <div
                    className="min-w-0 flex-1 cursor-pointer"
                    onClick={() => {
                      setSelected(s);
                      setView("detail");
                    }}
                  >
                    <div className="flex items-center gap-2 flex-wrap mb-1.5">
                      <h3 className="font-semibold text-sm sm:text-base text-foreground hover:text-primary transition-colors">
                        {s.title}
                      </h3>
                      <Badge
                        variant="outline"
                        className={`text-[10px] px-2 py-0.5 gap-1.5 font-medium ${statusConfig.className}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dot}`} />
                        {statusConfig.label}
                      </Badge>
                      <Badge
                        variant="outline"
                        className={`text-[10px] font-normal ${CATEGORY_COLORS[s.category]}`}
                      >
                        {s.category}
                      </Badge>
                      <Badge
                        variant="secondary"
                        className="text-[10px] text-muted-foreground font-normal gap-1"
                      >
                        {isExternal ? (
                          <>
                            <Globe className="w-3 h-3 text-blue-500" /> External
                          </>
                        ) : (
                          <>
                            <Lock className="w-3 h-3 text-slate-500" /> Internal
                          </>
                        )}
                      </Badge>
                      <span className="text-[11px] text-muted-foreground font-mono">v{s.version}</span>
                    </div>

                    {s.description && (
                      <p className="text-xs text-muted-foreground line-clamp-1 mb-2">
                        {s.description}
                      </p>
                    )}

                    <div className="flex items-center flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      <span className="font-medium text-foreground/80">
                        {s.fields.length} {s.fields.length === 1 ? "question" : "questions"}
                      </span>
                      <span className="flex items-center gap-1 font-medium text-primary">
                        <Users className="w-3.5 h-3.5" />
                        {s.responsesCount} {s.responsesCount === 1 ? "response" : "responses"}
                      </span>
                      {isExternal && (
                        <span className={`text-[10px] font-medium ${submissionBadgeClass(s)}`}>
                          {submissionLabel(s)}
                        </span>
                      )}
                      <span>
                        Audience:{" "}
                        {s.audience.type === "all"
                          ? "All Employees"
                          : s.audience.type === "departments"
                          ? `${s.audience.departments?.length || 0} dept(s)`
                          : `${s.audience.employees?.length || 0} user(s)`}
                      </span>
                      {s.settings?.closesAt && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          Closes: {new Date(s.settings.closesAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Quick Action buttons */}
                  <div className="flex items-center gap-1.5 shrink-0 border-t md:border-t-0 pt-2 md:pt-0">
                    {/* Share / Copy Link for external surveys */}
                    {isExternal && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCopyLink(s)}
                        title="Copy public link"
                        className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground"
                      >
                        <Copy className="w-3.5 h-3.5 mr-1" /> Link
                      </Button>
                    )}

                    {/* Responses Analytics button */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelected(s);
                        setView("responses");
                      }}
                      className="h-8 px-2.5 text-xs gap-1"
                    >
                      <BarChart3 className="w-3.5 h-3.5 text-primary" />
                      Responses ({s.responsesCount})
                    </Button>

                    {/* Quick status transition */}
                    {canManage && (
                      <>
                        {s.status === "draft" && (
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={updatingStatusId === s._id}
                            onClick={() => handleQuickStatusChange(s, "published")}
                            className="h-8 px-2.5 text-xs text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 border-emerald-200 dark:border-emerald-900/50"
                          >
                            {updatingStatusId === s._id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <>
                                <Send className="w-3.5 h-3.5 mr-1" /> Publish
                              </>
                            )}
                          </Button>
                        )}
                        {s.status === "published" && (
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={updatingStatusId === s._id}
                            onClick={() => handleQuickStatusChange(s, "closed")}
                            className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground"
                            title="Close survey"
                          >
                            {updatingStatusId === s._id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <>
                                <Lock className="w-3.5 h-3.5 mr-1" /> Close
                              </>
                            )}
                          </Button>
                        )}
                        {s.status === "closed" && (
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={updatingStatusId === s._id}
                            onClick={() => handleQuickStatusChange(s, "published")}
                            className="h-8 px-2 text-xs text-emerald-600 dark:text-emerald-400"
                            title="Re-open survey"
                          >
                            {updatingStatusId === s._id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <>
                                <RotateCcw className="w-3.5 h-3.5 mr-1" /> Reopen
                              </>
                            )}
                          </Button>
                        )}

                        {/* Clone Button */}
                        <Button
                          variant="ghost"
                          size="icon"
                          disabled={cloningId === s._id}
                          onClick={() => handleClone(s)}
                          title="Duplicate / Clone"
                          className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        >
                          {cloningId === s._id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Sparkles className="w-3.5 h-3.5" />
                          )}
                        </Button>

                        {/* Edit Button */}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setSelected(s);
                            setView("builder");
                          }}
                          title="Edit Survey"
                          className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </Button>

                        {/* Delete Button */}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteTarget(s)}
                          title="Delete Survey"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t">
              <span className="text-xs text-muted-foreground">
                Showing {((pagination.page - 1) * pagination.limit) + 1} to{" "}
                {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} surveys
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page <= 1}
                  onClick={() => setFilters((f) => ({ ...f, page: (f.page || 1) - 1 }))}
                  className="h-8 text-xs gap-1"
                >
                  <ChevronLeft className="w-3.5 h-3.5" /> Previous
                </Button>
                <span className="text-xs font-medium px-2">
                  Page {pagination.page} of {pagination.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => setFilters((f) => ({ ...f, page: (f.page || 1) + 1 }))}
                  className="h-8 text-xs gap-1"
                >
                  Next <ChevronRight className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <ShieldAlert className="w-5 h-5" /> Delete Survey
            </DialogTitle>
            <DialogDescription className="pt-2 text-sm text-foreground/80">
              Are you sure you want to delete{" "}
              <strong className="text-foreground">"{deleteTarget?.title}"</strong>?
              <br />
              <span className="text-destructive text-xs block mt-2 font-medium">
                This will permanently delete the survey and all {deleteTarget?.responsesCount || 0} response(s) collected. This action cannot be undone.
              </span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0 mt-4">
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={deleteSurvey.isPending}
              className="gap-1.5"
            >
              {deleteSurvey.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              Delete Permanently
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Survey Detail View ────────────────────────────────────────────────────────

function SurveyDetail({
  survey: s,
  onBack,
  onEdit,
  onResponses,
  onPreview,
  onClone,
  onStatusChange,
  onDelete,
  onExport,
  canManage,
  isCloning,
  isUpdatingStatus,
}: {
  survey: Survey;
  onBack: () => void;
  onEdit: () => void;
  onResponses: () => void;
  onPreview: () => void;
  onClone: () => void;
  onStatusChange: (status: SurveyStatus) => void;
  onDelete: () => void;
  onExport: () => void;
  canManage: boolean;
  isCloning: boolean;
  isUpdatingStatus: boolean;
}) {
  const publicUrl = typeof window !== "undefined" && s.scope === "external"
    ? `${window.location.origin}/survey/${s._id}`
    : null;

  const statusConfig = STATUS_BADGES[s.status] || STATUS_BADGES.draft;

  return (
    <div className="space-y-6">
      {/* Detail Top Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <Button variant="ghost" size="sm" onClick={onBack} className="w-fit gap-1 text-xs">
          <ChevronLeft className="w-4 h-4" /> Back to Surveys
        </Button>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={onPreview} className="gap-1.5 text-xs">
            <Eye className="w-3.5 h-3.5" /> Preview Form
          </Button>
          <Button variant="outline" size="sm" onClick={onResponses} className="gap-1.5 text-xs">
            <BarChart3 className="w-3.5 h-3.5 text-primary" /> Responses ({s.responsesCount})
          </Button>
          <Button variant="outline" size="sm" onClick={onExport} className="gap-1.5 text-xs">
            <Download className="w-3.5 h-3.5" /> Export CSV
          </Button>
          {canManage && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={onClone}
                disabled={isCloning}
                className="gap-1.5 text-xs"
              >
                {isCloning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                Clone
              </Button>
              <Button variant="outline" size="sm" onClick={onEdit} className="gap-1.5 text-xs">
                <Edit3 className="w-3.5 h-3.5" /> Edit
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={onDelete}
                className="gap-1.5 text-xs text-destructive hover:bg-destructive/10 border-destructive/30"
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Primary Survey Details Card */}
      <Card className="p-6 space-y-6">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 pb-4 border-b">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl font-bold tracking-tight text-foreground">{s.title}</h2>
              <Badge
                variant="outline"
                className={`text-xs px-2.5 py-0.5 gap-1.5 font-medium ${statusConfig.className}`}
              >
                <span className={`w-2 h-2 rounded-full ${statusConfig.dot}`} />
                {statusConfig.label}
              </Badge>
              <Badge variant="outline" className={`text-xs ${CATEGORY_COLORS[s.category]}`}>
                {s.category}
              </Badge>
              <Badge variant="secondary" className="text-xs">
                {s.scope === "external" ? "External (Public link)" : "Internal (Employees)"}
              </Badge>
            </div>
            {s.description && (
              <p className="text-sm text-muted-foreground whitespace-pre-line pt-1">
                {s.description}
              </p>
            )}
          </div>

          {canManage && (
            <div className="flex items-center gap-2 shrink-0">
              {s.status === "draft" && (
                <Button
                  size="sm"
                  disabled={isUpdatingStatus}
                  onClick={() => onStatusChange("published")}
                  className="gap-1.5"
                >
                  {isUpdatingStatus ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  Publish Now
                </Button>
              )}
              {s.status === "published" && (
                <Button
                  variant="outline"
                  size="sm"
                  disabled={isUpdatingStatus}
                  onClick={() => onStatusChange("closed")}
                  className="gap-1.5"
                >
                  {isUpdatingStatus ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Lock className="w-3.5 h-3.5" />}
                  Close Survey
                </Button>
              )}
              {s.status === "closed" && (
                <Button
                  variant="outline"
                  size="sm"
                  disabled={isUpdatingStatus}
                  onClick={() => onStatusChange("published")}
                  className="gap-1.5 text-emerald-600 dark:text-emerald-400"
                >
                  {isUpdatingStatus ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RotateCcw className="w-3.5 h-3.5" />}
                  Reopen Survey
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Detailed Metadata Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 text-xs">
          <div className="p-3 rounded-lg bg-muted/40 border">
            <span className="text-muted-foreground block mb-1">Target Audience</span>
            <span className="font-semibold text-foreground">
              {s.audience.type === "all"
                ? "All Employees"
                : s.audience.type === "departments"
                ? `${s.audience.departments?.map((d) => d.name).join(", ") || "Selected depts"}`
                : `${s.audience.employees?.length || 0} specific employee(s)`}
            </span>
          </div>

          <div className="p-3 rounded-lg bg-muted/40 border">
            <span className="text-muted-foreground block mb-1">Anonymity</span>
            <span className="font-semibold text-foreground">
              {s.settings.allowAnonymous ? "Anonymous Responses Allowed" : "Identity Tracked"}
            </span>
          </div>

          <div className="p-3 rounded-lg bg-muted/40 border">
            <span className="text-muted-foreground block mb-1">Submission Limit</span>
            <span className="font-semibold text-foreground">
              {s.settings.oneResponsePerUser ? "1 response per user" : "Multiple responses allowed"}
            </span>
          </div>

          <div className="p-3 rounded-lg bg-muted/40 border">
            <span className="text-muted-foreground block mb-1">Results Visibility</span>
            <span className="font-semibold text-foreground">
              {s.settings.showResultsToRespondents ? "Visible to Respondents" : "Admins Only"}
            </span>
          </div>

          <div className="p-3 rounded-lg bg-muted/40 border">
            <span className="text-muted-foreground block mb-1">Start Date</span>
            <span className="font-semibold text-foreground">
              {s.settings.startsAt ? new Date(s.settings.startsAt).toLocaleDateString() : "Immediate"}
            </span>
          </div>

          <div className="p-3 rounded-lg bg-muted/40 border">
            <span className="text-muted-foreground block mb-1">Close Date</span>
            <span className="font-semibold text-foreground">
              {s.settings.closesAt ? new Date(s.settings.closesAt).toLocaleDateString() : "Never / Manual"}
            </span>
          </div>

          <div className="p-3 rounded-lg bg-muted/40 border">
            <span className="text-muted-foreground block mb-1">Total Submissions</span>
            <span className="font-semibold text-primary text-sm">{s.responsesCount} responses</span>
          </div>

          <div className="p-3 rounded-lg bg-muted/40 border">
            <span className="text-muted-foreground block mb-1">Author / Version</span>
            <span className="font-semibold text-foreground">
              {s.author?.name || "Admin"} · v{s.version}
            </span>
          </div>
        </div>

        {/* Share Link Card for external surveys */}
        {publicUrl && (
          <ShareLinkCard
            url={publicUrl}
            title={s.title}
            description="Share this public link with customers or external clients to record their feedback without authentication."
          />
        )}

        {/* Questions Preview List */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-primary" /> Questions ({s.fields.length})
            </h3>
            <span className="text-xs text-muted-foreground">Order as shown to respondents</span>
          </div>
          <div className="space-y-2">
            {s.fields
              .slice()
              .sort((a, b) => a.order - b.order)
              .map((f, i) => (
                <div
                  key={f.id}
                  className="flex items-center gap-3 p-3.5 border rounded-lg bg-card hover:bg-muted/30 transition-colors"
                >
                  <span className="text-xs font-mono text-muted-foreground w-6 text-center shrink-0">
                    #{i + 1}
                  </span>
                  <Badge variant="outline" className="text-[10px] uppercase font-mono shrink-0">
                    {f.type}
                  </Badge>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground">{f.label}</p>
                    {f.placeholder && (
                      <p className="text-xs text-muted-foreground truncate italic">
                        Placeholder: "{f.placeholder}"
                      </p>
                    )}
                  </div>
                  {f.required && (
                    <Badge variant="destructive" className="text-[10px] shrink-0">
                      Required
                    </Badge>
                  )}
                  {f.options && f.options.length > 0 && (
                    <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full shrink-0">
                      {f.options.length} options
                    </span>
                  )}
                </div>
              ))}
          </div>
        </div>
      </Card>
    </div>
  );
}

// ─── Responses & Analytics View ───────────────────────────────────────────────

function ResponsesView({
  survey,
  onBack,
  onExport,
}: {
  survey: Survey;
  onBack: () => void;
  onExport: () => void;
}) {
  const [page, setPage] = useState(1);
  const [tab, setTab] = useState<"summary" | "list">("summary");
  const { data: respData, isLoading: isRespLoading } = useSurveyResponses(survey._id, page);
  const { data: summary, isLoading: isSummaryLoading } = useSurveySummary(survey._id);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onBack} className="text-xs gap-1">
            <ChevronLeft className="w-4 h-4" /> Back
          </Button>
          <div>
            <h1 className="text-lg sm:text-xl font-bold tracking-tight">
              Survey Analytics & Submissions
            </h1>
            <p className="text-xs text-muted-foreground line-clamp-1">{survey.title}</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={onExport} className="gap-1.5 text-xs">
          <Download className="w-3.5 h-3.5" /> Export All to CSV
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b pb-2">
        <Button
          variant={tab === "summary" ? "default" : "ghost"}
          size="sm"
          onClick={() => setTab("summary")}
          className="text-xs gap-1.5"
        >
          <BarChart3 className="w-3.5 h-3.5" /> Summary Analytics
        </Button>
        <Button
          variant={tab === "list" ? "default" : "ghost"}
          size="sm"
          onClick={() => setTab("list")}
          className="text-xs gap-1.5"
        >
          <Users className="w-3.5 h-3.5" /> Individual Responses ({survey.responsesCount})
        </Button>
      </div>

      {/* Tab 1: Summary Analytics */}
      {tab === "summary" && (
        <div className="space-y-4">
          <Card className="p-4 bg-muted/20 border flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">Overall Participation</p>
              <h2 className="text-2xl font-bold text-foreground">
                {summary?.totalResponses ?? survey.responsesCount} Total Submissions
              </h2>
            </div>
            <Badge variant="outline" className="text-xs px-3 py-1">
              v{survey.version}
            </Badge>
          </Card>

          {isSummaryLoading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : !summary || summary.fields.length === 0 ? (
            <Card className="p-12 text-center border-dashed">
              <BarChart3 className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No response data collected yet.</p>
            </Card>
          ) : (
            summary.fields.map((f) => (
              <Card key={f.fieldId} className="p-5 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="text-[10px] font-mono uppercase">
                        {f.type}
                      </Badge>
                      <h3 className="text-sm font-semibold text-foreground">{f.label}</h3>
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground font-medium shrink-0">
                    {f.totalAnswers} answered
                  </span>
                </div>

                {/* Distribution chart for choices */}
                {f.distribution && Object.keys(f.distribution).length > 0 && (
                  <div className="space-y-2 pt-1">
                    {Object.entries(f.distribution)
                      .sort((a, b) => b[1] - a[1])
                      .map(([val, count]) => {
                        const pct = f.totalAnswers > 0 ? Math.round((count / f.totalAnswers) * 100) : 0;
                        return (
                          <div key={val} className="space-y-1">
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-medium text-foreground/90 truncate max-w-xs">{val}</span>
                              <span className="text-muted-foreground font-mono">
                                {count} ({pct}%)
                              </span>
                            </div>
                            <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                              <div
                                className="h-full bg-primary rounded-full transition-all duration-500"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}

                {/* Rating or numerical summary */}
                {(f.type === "rating" || f.type === "number") && f.average !== undefined && (
                  <div className="grid grid-cols-3 gap-3 p-3 bg-muted/40 rounded-lg text-center mt-2">
                    <div>
                      <span className="text-[10px] text-muted-foreground block uppercase font-mono">
                        Average
                      </span>
                      <span className="text-base font-bold text-primary flex items-center justify-center gap-1">
                        {f.type === "rating" && <Star className="w-4 h-4 fill-amber-400 text-amber-400" />}
                        {f.average.toFixed(1)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground block uppercase font-mono">
                        Minimum
                      </span>
                      <span className="text-base font-bold text-foreground">{f.min ?? "-"}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground block uppercase font-mono">
                        Maximum
                      </span>
                      <span className="text-base font-bold text-foreground">{f.max ?? "-"}</span>
                    </div>
                  </div>
                )}

                {/* Samples for text answers */}
                {f.sample && f.sample.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    <span className="text-xs font-medium text-muted-foreground block">
                      Recent Text Samples:
                    </span>
                    <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
                      {f.sample.map((s, idx) => (
                        <div
                          key={idx}
                          className="text-xs text-foreground bg-muted/30 p-2.5 rounded border border-border/50 italic"
                        >
                          "{String(s)}"
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </Card>
            ))
          )}
        </div>
      )}

      {/* Tab 2: Individual Submissions */}
      {tab === "list" && (
        <div className="space-y-3">
          {isRespLoading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : !respData || respData.responses.length === 0 ? (
            <Card className="p-12 text-center border-dashed">
              <Users className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No individual submissions yet.</p>
            </Card>
          ) : (
            <>
              {respData.responses.map((r, idx) => (
                <Card key={r._id} className="p-4 space-y-3">
                  <div className="flex items-center justify-between border-b pb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-muted-foreground">
                        #{(page - 1) * 20 + idx + 1}
                      </span>
                      <span className="text-sm font-semibold text-foreground">
                        {r.respondent ? r.respondent.name : "Anonymous Respondent"}
                      </span>
                      {r.respondent?.email && (
                        <span className="text-xs text-muted-foreground">({r.respondent.email})</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{new Date(r.submittedAt).toLocaleString()}</span>
                      <Badge variant="outline" className="text-[10px]">
                        v{r.surveyVersion}
                      </Badge>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    {r.answers.map((ans) => {
                      const field = survey.fields.find((f) => f.id === ans.fieldId);
                      const displayVal = Array.isArray(ans.value)
                        ? ans.value.join(", ")
                        : ans.value !== null && ans.value !== undefined
                        ? String(ans.value)
                        : "(empty)";
                      return (
                        <div key={ans.fieldId} className="p-2.5 rounded bg-muted/30 border">
                          <span className="text-muted-foreground block text-[11px] font-medium mb-1">
                            {field?.label || ans.fieldId}
                          </span>
                          <span className="font-medium text-foreground">{displayVal}</span>
                        </div>
                      );
                    })}
                  </div>
                </Card>
              ))}

              {/* Responses Pagination */}
              {respData.pagination.totalPages > 1 && (
                <div className="flex items-center justify-between pt-3">
                  <span className="text-xs text-muted-foreground">
                    Page {respData.pagination.page} of {respData.pagination.totalPages}
                  </span>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page <= 1}
                      onClick={() => setPage((p) => p - 1)}
                      className="h-8 text-xs"
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page >= respData.pagination.totalPages}
                      onClick={() => setPage((p) => p + 1)}
                      className="h-8 text-xs"
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Survey Builder ───────────────────────────────────────────────────────────

function SurveyBuilder({
  initial,
  onSave,
  onCancel,
  isSaving,
}: {
  initial: Survey | null;
  onSave: (data: Record<string, unknown>, status: SurveyStatus) => Promise<void>;
  onCancel: () => void;
  isSaving: boolean;
}) {
  const { departments } = useDepartments();
  const { employees = [] } = useEmployees({}) as any;

  const [title, setTitle] = useState(initial?.title || "");
  const [description, setDescription] = useState(initial?.description || "");
  const [category, setCategory] = useState<SurveyCategory>(initial?.category || "feedback");
  const [scope, setScope] = useState<SurveyScope>(initial?.scope || "internal");
  const [fields, setFields] = useState<SurveyField[]>(initial?.fields || []);
  const [audienceType, setAudienceType] = useState<"all" | "departments" | "employees">(
    initial?.audience?.type || "all"
  );
  const [audienceDepts, setAudienceDepts] = useState<string[]>(
    initial?.audience?.departments?.map((d) => d._id) || []
  );
  const [audienceEmployees, setAudienceEmployees] = useState<string[]>(
    initial?.audience?.employees?.map((e) => e._id) || []
  );
  const [allowAnonymous, setAllowAnonymous] = useState(initial?.settings?.allowAnonymous ?? false);
  const [oneResponse, setOneResponse] = useState(initial?.settings?.oneResponsePerUser ?? true);
  const [showResults, setShowResults] = useState(initial?.settings?.showResultsToRespondents ?? false);
  const [startsAt, setStartsAt] = useState(initial?.settings?.startsAt?.slice(0, 10) || "");
  const [closesAt, setClosesAt] = useState(initial?.settings?.closesAt?.slice(0, 10) || "");
  const [editingFieldId, setEditingFieldId] = useState<string | null>(
    initial?.fields?.[0]?.id || null
  );
  const [showPreview, setShowPreview] = useState(false);

  const moveField = (index: number, direction: -1 | 1) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= fields.length) return;
    setFields((prev) => {
      const arr = [...prev];
      [arr[index], arr[newIndex]] = [arr[newIndex], arr[index]];
      return arr.map((f, i) => ({ ...f, order: i }));
    });
  };

  const addField = (type: SurveyFieldType) => {
    const defaultOptions = ["select", "multi-select", "radio"].includes(type)
      ? [
          { id: uuidv4(), label: "Option 1", value: "option_1" },
          { id: uuidv4(), label: "Option 2", value: "option_2" },
        ]
      : [];

    const newField: SurveyField = {
      id: uuidv4(),
      type,
      label: `Question ${fields.length + 1}`,
      placeholder: type === "rating" ? "5" : "",
      required: false,
      options: defaultOptions,
      validation: type === "number" ? { min: 0, max: 100 } : {},
      order: fields.length,
    };
    setFields((f) => [...f, newField]);
    setEditingFieldId(newField.id);
  };

  const duplicateField = (field: SurveyField) => {
    const cloned: SurveyField = {
      ...field,
      id: uuidv4(),
      label: `${field.label} (Copy)`,
      options: field.options.map((o) => ({ ...o, id: uuidv4() })),
      order: fields.length,
    };
    setFields((prev) => [...prev, cloned]);
    setEditingFieldId(cloned.id);
  };

  const updateField = (id: string, updates: Partial<SurveyField>) => {
    setFields((f) => f.map((field) => (field.id === id ? { ...field, ...updates } : field)));
  };

  const removeField = (id: string) => {
    setFields((f) => f.filter((field) => field.id !== id));
    if (editingFieldId === id) setEditingFieldId(null);
  };

  const addOption = (fieldId: string) => {
    const field = fields.find((f) => f.id === fieldId);
    if (!field) return;
    const num = field.options.length + 1;
    const opt: FieldOption = { id: uuidv4(), label: `Option ${num}`, value: `option_${num}` };
    updateField(fieldId, { options: [...field.options, opt] });
  };

  const updateOption = (fieldId: string, optId: string, updates: Partial<FieldOption>) => {
    const field = fields.find((f) => f.id === fieldId);
    if (!field) return;
    updateField(fieldId, {
      options: field.options.map((o) => (o.id === optId ? { ...o, ...updates } : o)),
    });
  };

  const removeOption = (fieldId: string, optId: string) => {
    const field = fields.find((f) => f.id === fieldId);
    if (!field) return;
    updateField(fieldId, { options: field.options.filter((o) => o.id !== optId) });
  };

  const buildPayload = () => ({
    title: title.trim(),
    description: description.trim(),
    category,
    scope,
    fields: fields.map((f, i) => ({ ...f, order: i })),
    audience: {
      type: audienceType,
      departments: audienceType === "departments" ? audienceDepts : [],
      employees: audienceType === "employees" ? audienceEmployees : [],
    },
    settings: {
      allowAnonymous,
      oneResponsePerUser: oneResponse,
      showResultsToRespondents: showResults,
      startsAt: startsAt || null,
      closesAt: closesAt || null,
    },
  });

  const activeField = fields.find((f) => f.id === editingFieldId);

  return (
    <div className="space-y-6">
      {/* Builder Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onCancel} className="text-xs gap-1">
            <ChevronLeft className="w-4 h-4" /> Back
          </Button>
          <div>
            <h1 className="text-lg font-bold tracking-tight">
              {initial ? "Edit Survey" : "Create New Survey"}
            </h1>
            <p className="text-xs text-muted-foreground">
              {title ? title : "Configure settings and build questions"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant={showPreview ? "default" : "outline"}
            size="sm"
            onClick={() => setShowPreview(!showPreview)}
            className="text-xs gap-1.5"
          >
            <Eye className="w-3.5 h-3.5" />
            {showPreview ? "Back to Editor" : "Live Preview"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onSave(buildPayload(), "draft")}
            disabled={isSaving || !title.trim() || fields.length === 0}
            className="text-xs gap-1.5"
          >
            {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            Save Draft
          </Button>
          <Button
            size="sm"
            onClick={() => onSave(buildPayload(), "published")}
            disabled={isSaving || !title.trim() || fields.length === 0}
            className="text-xs gap-1.5"
          >
            {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            Publish Survey
          </Button>
        </div>
      </div>

      {showPreview ? (
        /* ── Live Preview Mode ── */
        <div className="max-w-2xl mx-auto space-y-5 py-4">
          <div className="p-3 bg-primary/10 rounded-lg border border-primary/20 text-xs text-primary flex items-center justify-between">
            <span>You are currently in interactive preview mode.</span>
            <Button size="sm" variant="ghost" className="h-6 text-xs" onClick={() => setShowPreview(false)}>
              Return to editor
            </Button>
          </div>
          <Card className="overflow-hidden shadow-sm">
            <div className="h-1.5 bg-gradient-to-r from-primary via-primary/80 to-primary/60" />
            <div className="p-6">
              <div className="flex items-center gap-2 mb-2">
                <ClipboardList className="w-5 h-5 text-primary" />
                <Badge variant="outline" className={`text-[10px] ${CATEGORY_COLORS[category]}`}>
                  {category}
                </Badge>
                <Badge variant="secondary" className="text-[10px]">
                  {scope === "external" ? "External" : "Internal"}
                </Badge>
              </div>
              <h1 className="text-xl font-bold text-foreground">{title || "Untitled Survey"}</h1>
              {description && (
                <p className="text-sm text-muted-foreground mt-2 whitespace-pre-line">
                  {description}
                </p>
              )}
            </div>
          </Card>

          {fields.length === 0 ? (
            <Card className="p-12 text-center text-muted-foreground text-sm border-dashed">
              No questions added yet. Switch back to the editor to add questions.
            </Card>
          ) : (
            fields.map((field, idx) => (
              <Card key={field.id} className="p-5 shadow-sm">
                <label className="text-sm font-medium mb-2.5 block text-foreground">
                  <span className="text-muted-foreground font-mono mr-1.5">{idx + 1}.</span>
                  {field.label} {field.required && <span className="text-destructive">*</span>}
                </label>
                <InteractivePreviewField field={field} />
              </Card>
            ))
          )}

          <Button className="w-full gap-2 mt-4" size="lg" disabled>
            <Send className="w-4 h-4" /> Submit Response (Preview Only)
          </Button>
        </div>
      ) : (
        /* ── Builder Mode ── */
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
          {/* Main Column */}
          <div className="space-y-5">
            {/* Survey General Information Card */}
            <Card className="p-5 space-y-4">
              <h2 className="text-sm font-semibold tracking-tight text-foreground flex items-center gap-2">
                <ClipboardList className="w-4 h-4 text-primary" /> General Information
              </h2>
              <div>
                <label className="text-xs font-medium mb-1 block">Survey Title *</label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Q3 Customer Satisfaction & Support Feedback"
                  className="text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-medium mb-1 block">Description & Instructions</label>
                <textarea
                  className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background resize-none focus:outline-none focus:ring-1 focus:ring-ring"
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Explain the purpose of this survey to respondents..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium mb-1 block">Category</label>
                  <select
                    className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background text-foreground"
                    value={category}
                    onChange={(e) => setCategory(e.target.value as SurveyCategory)}
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium mb-1 block">Target Scope</label>
                  <select
                    className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background text-foreground"
                    value={scope}
                    onChange={(e) => setScope(e.target.value as SurveyScope)}
                  >
                    <option value="internal">Internal (Authenticated Employees)</option>
                    <option value="external">External (Public Share Link)</option>
                  </select>
                </div>
              </div>
            </Card>

            {/* Field Types Palette */}
            <Card className="p-4 space-y-2.5">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold tracking-tight text-foreground flex items-center gap-1.5">
                  <Plus className="w-3.5 h-3.5 text-primary" /> Add Questions
                </h3>
                <span className="text-[11px] text-muted-foreground">Click a type to insert</span>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                {FIELD_TYPES.map((ft) => (
                  <Button
                    key={ft.type}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => addField(ft.type)}
                    className="text-xs h-9 justify-start gap-2 hover:border-primary/50 hover:bg-primary/[0.04]"
                  >
                    <span className="font-mono text-xs text-primary font-bold">{ft.icon}</span>
                    <span className="truncate">{ft.label}</span>
                  </Button>
                ))}
              </div>
            </Card>

            {/* Questions List */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-xs font-semibold tracking-tight text-foreground">
                  Questions List ({fields.length})
                </h3>
                {fields.length === 0 && (
                  <span className="text-xs text-destructive">At least 1 question is required</span>
                )}
              </div>

              {fields.length === 0 ? (
                <Card className="p-10 text-center border-dashed">
                  <p className="text-sm font-medium text-muted-foreground">
                    No questions created yet.
                  </p>
                  <p className="text-xs text-muted-foreground/80 mt-1">
                    Select a question type from the palette above to build your survey questionnaire.
                  </p>
                </Card>
              ) : (
                fields.map((f, idx) => (
                  <Card
                    key={f.id}
                    className={`p-3.5 cursor-pointer transition-all ${
                      editingFieldId === f.id
                        ? "border-primary shadow-sm bg-primary/[0.02]"
                        : "hover:border-primary/30"
                    }`}
                    onClick={() => setEditingFieldId(f.id)}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="flex flex-col shrink-0">
                        <button
                          type="button"
                          className="p-1 rounded hover:bg-secondary disabled:opacity-20 text-muted-foreground"
                          disabled={idx === 0}
                          onClick={(e) => {
                            e.stopPropagation();
                            moveField(idx, -1);
                          }}
                          title="Move up"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          className="p-1 rounded hover:bg-secondary disabled:opacity-20 text-muted-foreground"
                          disabled={idx === fields.length - 1}
                          onClick={(e) => {
                            e.stopPropagation();
                            moveField(idx, 1);
                          }}
                          title="Move down"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <span className="text-xs font-mono text-muted-foreground w-5 text-center shrink-0">
                        #{idx + 1}
                      </span>

                      <Badge variant="outline" className="text-[10px] uppercase font-mono shrink-0">
                        {f.type}
                      </Badge>

                      <div className="min-w-0 flex-1">
                        <span className="text-sm font-medium text-foreground block truncate">
                          {f.label}
                        </span>
                        {f.options && f.options.length > 0 && (
                          <span className="text-[11px] text-muted-foreground">
                            {f.options.length} options
                          </span>
                        )}
                      </div>

                      {f.required && (
                        <Badge variant="destructive" className="text-[10px] shrink-0">
                          Required
                        </Badge>
                      )}

                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-foreground"
                          onClick={(e) => {
                            e.stopPropagation();
                            duplicateField(f);
                          }}
                          title="Duplicate question"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeField(f.id);
                          }}
                          title="Delete question"
                        >
                          <X className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </div>

          {/* Right Column: Active Question Properties & Survey Settings */}
          <div className="space-y-4">
            {/* Active Question Editor */}
            {activeField ? (
              <Card className="p-4 space-y-3.5 border-primary/40 sticky top-4">
                <div className="flex items-center justify-between border-b pb-2">
                  <h3 className="text-xs font-semibold flex items-center gap-1.5 text-primary">
                    <Edit3 className="w-3.5 h-3.5" /> Edit Question
                  </h3>
                  <Badge variant="outline" className="text-[10px] uppercase font-mono">
                    {activeField.type}
                  </Badge>
                </div>

                <div>
                  <label className="text-xs font-medium mb-1 block">Question Label *</label>
                  <Input
                    value={activeField.label}
                    onChange={(e) => updateField(activeField.id, { label: e.target.value })}
                    className="text-xs h-8"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium mb-1 block">Placeholder Hint</label>
                  <Input
                    value={activeField.placeholder}
                    onChange={(e) => updateField(activeField.id, { placeholder: e.target.value })}
                    className="text-xs h-8"
                  />
                </div>

                <label className="flex items-center gap-2 text-xs font-medium cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={activeField.required}
                    onChange={(e) => updateField(activeField.id, { required: e.target.checked })}
                    className="accent-primary rounded"
                  />
                  <span>Mandatory / Required question</span>
                </label>

                {/* Number validation */}
                {activeField.type === "number" && (
                  <div className="grid grid-cols-2 gap-2 pt-1 border-t">
                    <div>
                      <label className="text-[11px] text-muted-foreground block mb-0.5">Min</label>
                      <Input
                        type="number"
                        value={activeField.validation?.min ?? ""}
                        onChange={(e) =>
                          updateField(activeField.id, {
                            validation: {
                              ...activeField.validation,
                              min: e.target.value ? Number(e.target.value) : undefined,
                            },
                          })
                        }
                        className="text-xs h-8"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-muted-foreground block mb-0.5">Max</label>
                      <Input
                        type="number"
                        value={activeField.validation?.max ?? ""}
                        onChange={(e) =>
                          updateField(activeField.id, {
                            validation: {
                              ...activeField.validation,
                              max: e.target.value ? Number(e.target.value) : undefined,
                            },
                          })
                        }
                        className="text-xs h-8"
                      />
                    </div>
                  </div>
                )}

                {/* Choice Options Manager */}
                {["select", "multi-select", "radio"].includes(activeField.type) && (
                  <div className="pt-2 border-t space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-medium">Choices / Options</label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-6 text-[11px] px-2 gap-1"
                        onClick={() => addOption(activeField.id)}
                      >
                        <Plus className="w-3 h-3" /> Add
                      </Button>
                    </div>

                    <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                      {activeField.options.map((opt, optIdx) => (
                        <div key={opt.id} className="flex items-center gap-1.5">
                          <Input
                            className="h-7 text-xs"
                            value={opt.label}
                            onChange={(e) =>
                              updateOption(activeField.id, opt.id, {
                                label: e.target.value,
                                value: e.target.value.toLowerCase().trim().replace(/\s+/g, "_"),
                              })
                            }
                            placeholder={`Option ${optIdx + 1}`}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
                            onClick={() => removeOption(activeField.id, opt.id)}
                            disabled={activeField.options.length <= 1}
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </Card>
            ) : (
              <Card className="p-4 text-center text-xs text-muted-foreground border-dashed">
                Select a question from the list to configure its properties.
              </Card>
            )}

            {/* Audience & Scheduling Settings Card */}
            <Card className="p-4 space-y-3.5">
              <h3 className="text-xs font-semibold flex items-center gap-1.5 text-foreground border-b pb-2">
                <Settings className="w-3.5 h-3.5 text-primary" /> Delivery & Audience
              </h3>

              {scope === "internal" ? (
                <div className="space-y-2">
                  <label className="text-xs font-medium block">Audience Targeting</label>
                  <select
                    className="w-full border border-input rounded-lg px-2.5 py-1.5 text-xs bg-background text-foreground"
                    value={audienceType}
                    onChange={(e) =>
                      setAudienceType(e.target.value as "all" | "departments" | "employees")
                    }
                  >
                    <option value="all">All Employees</option>
                    <option value="departments">Specific Departments</option>
                    <option value="employees">Specific Employees</option>
                  </select>

                  {audienceType === "departments" && (
                    <select
                      multiple
                      className="w-full border border-input rounded-lg p-2 text-xs bg-background min-h-[90px]"
                      value={audienceDepts}
                      onChange={(e) =>
                        setAudienceDepts(Array.from(e.target.selectedOptions, (o) => o.value))
                      }
                    >
                      {departments.map((d) => (
                        <option key={d._id} value={d._id}>
                          {d.name}
                        </option>
                      ))}
                    </select>
                  )}

                  {audienceType === "employees" && (
                    <select
                      multiple
                      className="w-full border border-input rounded-lg p-2 text-xs bg-background min-h-[90px]"
                      value={audienceEmployees}
                      onChange={(e) =>
                        setAudienceEmployees(Array.from(e.target.selectedOptions, (o) => o.value))
                      }
                    >
                      {employees.map((emp: any) => (
                        <option key={emp._id} value={emp._id}>
                          {emp.name} ({emp.email})
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              ) : (
                <div className="p-2.5 bg-blue-500/10 rounded-lg border border-blue-500/20 text-xs text-blue-600 dark:text-blue-400">
                  <Globe className="w-3.5 h-3.5 inline mr-1" />
                  Public survey link accessible by anyone with the URL.
                </div>
              )}

              <div className="space-y-2 pt-1 border-t">
                <label className="flex items-center gap-2 text-xs cursor-pointer">
                  <input
                    type="checkbox"
                    checked={allowAnonymous}
                    onChange={(e) => setAllowAnonymous(e.target.checked)}
                    className="accent-primary rounded"
                  />
                  <span>Allow anonymous submissions</span>
                </label>

                <label className="flex items-center gap-2 text-xs cursor-pointer">
                  <input
                    type="checkbox"
                    checked={oneResponse}
                    onChange={(e) => setOneResponse(e.target.checked)}
                    className="accent-primary rounded"
                  />
                  <span>Limit to one response per person</span>
                </label>

                <label className="flex items-center gap-2 text-xs cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showResults}
                    onChange={(e) => setShowResults(e.target.checked)}
                    className="accent-primary rounded"
                  />
                  <span>Show live results to respondents</span>
                </label>
              </div>

              <div className="space-y-2 pt-1 border-t">
                <div>
                  <label className="text-[11px] text-muted-foreground block mb-1">
                    Opens / Starts At
                  </label>
                  <Input
                    type="date"
                    value={startsAt}
                    onChange={(e) => setStartsAt(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-muted-foreground block mb-1">
                    Auto-closes At
                  </label>
                  <Input
                    type="date"
                    value={closesAt}
                    onChange={(e) => setClosesAt(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Preview View & Component ─────────────────────────────────────────────────

function PreviewView({ survey, onBack }: { survey: Survey; onBack: () => void }) {
  const sorted = [...survey.fields].sort((a, b) => a.order - b.order);
  return (
    <div className="max-w-2xl mx-auto space-y-5 py-4">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={onBack} className="text-xs gap-1">
          <ChevronLeft className="w-4 h-4" /> Back to Survey Detail
        </Button>
        <Badge variant="outline" className="text-xs gap-1">
          <Eye className="w-3 h-3 text-primary" /> Live Form Preview
        </Badge>
      </div>

      <Card className="overflow-hidden shadow-sm">
        <div className="h-1.5 bg-gradient-to-r from-primary via-primary/80 to-primary/60" />
        <div className="p-6">
          <div className="flex items-center gap-2 mb-2">
            <ClipboardList className="w-5 h-5 text-primary" />
            <Badge variant="outline" className={`text-[10px] ${CATEGORY_COLORS[survey.category]}`}>
              {survey.category}
            </Badge>
            <Badge variant="secondary" className="text-[10px]">
              {survey.scope === "external" ? "External" : "Internal"}
            </Badge>
          </div>
          <h1 className="text-xl font-bold text-foreground">{survey.title}</h1>
          {survey.description && (
            <p className="text-sm text-muted-foreground mt-2 whitespace-pre-line">
              {survey.description}
            </p>
          )}
        </div>
      </Card>

      {sorted.map((field, idx) => (
        <Card key={field.id} className="p-5 shadow-sm">
          <label className="text-sm font-medium mb-2.5 block text-foreground">
            <span className="text-muted-foreground font-mono mr-1.5">{idx + 1}.</span>
            {field.label} {field.required && <span className="text-destructive">*</span>}
          </label>
          <InteractivePreviewField field={field} />
        </Card>
      ))}

      <Button className="w-full gap-2 mt-4" size="lg" disabled>
        <Send className="w-4 h-4" /> Submit Response (Preview Only)
      </Button>
    </div>
  );
}

function InteractivePreviewField({ field }: { field: SurveyField }) {
  const [val, setVal] = useState<any>(field.type === "multi-select" ? [] : "");

  switch (field.type) {
    case "text":
      return (
        <Input
          placeholder={field.placeholder || "Your answer..."}
          value={val}
          onChange={(e) => setVal(e.target.value)}
        />
      );
    case "textarea":
      return (
        <textarea
          className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background resize-none focus:outline-none focus:ring-1 focus:ring-ring"
          rows={3}
          placeholder={field.placeholder || "Type your thoughts here..."}
          value={val}
          onChange={(e) => setVal(e.target.value)}
        />
      );
    case "number":
      return (
        <Input
          type="number"
          placeholder={field.placeholder || "Enter number..."}
          value={val}
          min={field.validation?.min}
          max={field.validation?.max}
          onChange={(e) => setVal(e.target.value)}
        />
      );
    case "date":
      return (
        <Input type="date" value={val} onChange={(e) => setVal(e.target.value)} />
      );
    case "select":
      return (
        <select
          className="w-full border border-input rounded-lg px-3 py-2.5 text-sm bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          value={val}
          onChange={(e) => setVal(e.target.value)}
        >
          <option value="">{field.placeholder || "Choose an option..."}</option>
          {field.options.map((o) => (
            <option key={o.id} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      );
    case "multi-select":
      return (
        <select
          multiple
          className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background text-foreground min-h-[90px] focus:outline-none focus:ring-1 focus:ring-ring"
          value={val}
          onChange={(e) =>
            setVal(Array.from(e.target.selectedOptions, (o) => o.value))
          }
        >
          {field.options.map((o) => (
            <option key={o.id} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      );
    case "radio":
      return (
        <div className="space-y-2">
          {field.options.map((o) => (
            <label
              key={o.id}
              className="flex items-center gap-2 text-sm cursor-pointer select-none"
            >
              <input
                type="radio"
                name={`prev_${field.id}`}
                value={o.value}
                checked={val === o.value}
                onChange={() => setVal(o.value)}
                className="accent-primary"
              />
              <span>{o.label}</span>
            </label>
          ))}
        </div>
      );
    case "checkbox":
      return (
        <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
          <input
            type="checkbox"
            checked={Boolean(val)}
            onChange={(e) => setVal(e.target.checked)}
            className="accent-primary rounded"
          />
          <span>{field.placeholder || "I agree / Yes"}</span>
        </label>
      );
    case "rating":
      return (
        <div className="flex items-center gap-2">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setVal(n)}
              className={`w-10 h-10 rounded-lg border-2 text-sm font-bold transition-all flex items-center justify-center ${
                val >= n
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-input hover:border-primary/50 text-foreground"
              }`}
            >
              <Star className={`w-4 h-4 ${val >= n ? "fill-current" : ""}`} />
            </button>
          ))}
          {val > 0 && (
            <span className="text-xs text-muted-foreground ml-2 font-medium">
              {val} / 5
            </span>
          )}
        </div>
      );
    default:
      return <Input value={val} onChange={(e) => setVal(e.target.value)} />;
  }
}
