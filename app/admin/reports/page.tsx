"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { canUserPerformAction } from "@/lib/permissions";
import {
  type TaskReport,
  type TaskReportFilters,
  type PeriodType,
  type ReportStatus,
  type ReportVisibility,
  type CreateTaskReportData,
} from "@/lib/api/reports.api";
import { listEmployees, type Employee } from "@/lib/api/employees.api";
import type { Department } from "@/lib/api/departments.api";
import { useReportMutations, useReports } from "@/hooks/queries";
import { useDepartments } from "@/hooks/queries";
import { RichTextEditor } from "@/components/RichTextEditor";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ReportAttachmentUploader } from "@/components/ReportAttachmentUploader";
import { ReportAttachmentViewer } from "@/components/ReportAttachmentViewer";
import {
  BarChart3,
  Plus,
  Loader2,
  AlertCircle,
  Calendar,
  Building2,
  ChevronLeft,
  Save,
  Send,
  Trash2,
  Edit3,
  Clock,
  User,
  FileText,
  Filter,
  X,
  Download,
  Globe,
  Lock,
  ShieldCheck,
  Search,
  Eye,
  Users2,
  Paperclip,
} from "lucide-react";

// ─── Constants ────────────────────────────────────────────────────────────────

const PERIOD_TYPES: { value: PeriodType | ""; label: string }[] = [
  { value: "", label: "All Periods" },
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "quarterly", label: "Quarterly" },
];

const STATUS_OPTIONS: { value: ReportStatus | ""; label: string }[] = [
  { value: "", label: "All Status" },
  { value: "draft", label: "Drafts" },
  { value: "submitted", label: "Submitted" },
];

const VISIBILITY_OPTIONS: { value: ReportVisibility | ""; label: string }[] = [
  { value: "", label: "All Visibility" },
  { value: "everyone", label: "Everyone" },
  { value: "department_only", label: "Department Only" },
  { value: "admins_only", label: "Admins Only" },
  { value: "private", label: "Private" },
];

const VISIBILITY_BADGE: Record<ReportVisibility, { cls: string; label: string; icon: React.ElementType }> = {
  everyone: { cls: "bg-green-50 text-green-700 border-green-200", label: "Everyone", icon: Globe },
  department_only: { cls: "bg-blue-50 text-blue-700 border-blue-200", label: "Dept Only", icon: Building2 },
  admins_only: { cls: "bg-amber-50 text-amber-700 border-amber-200", label: "Admins Only", icon: ShieldCheck },
  private: { cls: "bg-red-50 text-red-700 border-red-200", label: "Private", icon: Lock },
};

const PERIOD_BADGE_COLORS: Record<PeriodType, string> = {
  daily: "bg-cyan-50 text-cyan-700 border-cyan-200",
  weekly: "bg-blue-50 text-blue-700 border-blue-200",
  monthly: "bg-violet-50 text-violet-700 border-violet-200",
  quarterly: "bg-amber-50 text-amber-700 border-amber-200",
};

function getDatePreset(key: string): { from: string; to: string } {
  const now = new Date();
  const to = now.toISOString().slice(0, 10);
  const from = new Date(now);
  const daysMap: Record<string, number> = {
    today: 0,
    last3: 3,
    last5: 5,
    last7: 7,
    last14: 14,
    last30: 30,
    last60: 60,
    last90: 90,
    last180: 180,
    last365: 365,
  };
  if (key in daysMap) {
    from.setDate(from.getDate() - daysMap[key]);
    return { from: from.toISOString().slice(0, 10), to };
  }
  // "thisWeek" / "thisMonth" / "thisQuarter"
  if (key === "thisWeek") {
    const day = now.getDay();
    from.setDate(from.getDate() - (day === 0 ? 6 : day - 1)); // Monday
    return { from: from.toISOString().slice(0, 10), to };
  }
  if (key === "thisMonth") {
    from.setDate(1);
    return { from: from.toISOString().slice(0, 10), to };
  }
  if (key === "thisQuarter") {
    const qMonth = Math.floor(now.getMonth() / 3) * 3;
    from.setMonth(qMonth, 1);
    return { from: from.toISOString().slice(0, 10), to };
  }
  return { from: "", to: "" };
}

type DatePresetItem = { key: string; label: string };

function getDatePresetsForPeriod(period: PeriodType | ""): DatePresetItem[] {
  const base: DatePresetItem = { key: "", label: "All Time" };
  switch (period) {
    case "daily":
      return [
        base,
        { key: "today", label: "Today" },
        { key: "last3", label: "Last 3 Days" },
        { key: "last5", label: "Last 5 Days" },
        { key: "last7", label: "Last 7 Days" },
      ];
    case "weekly":
      return [
        base,
        { key: "thisWeek", label: "This Week" },
        { key: "last7", label: "Last 7 Days" },
        { key: "last14", label: "Last 2 Weeks" },
        { key: "last30", label: "Last 4 Weeks" },
      ];
    case "monthly":
      return [
        base,
        { key: "thisMonth", label: "This Month" },
        { key: "last30", label: "Last 30 Days" },
        { key: "last60", label: "Last 2 Months" },
        { key: "last90", label: "Last 3 Months" },
        { key: "last180", label: "Last 6 Months" },
      ];
    case "quarterly":
      return [
        base,
        { key: "thisQuarter", label: "This Quarter" },
        { key: "last90", label: "Last 90 Days" },
        { key: "last180", label: "Last 6 Months" },
        { key: "last365", label: "Last Year" },
      ];
    default:
      // No period selected — show a generic mix
      return [
        base,
        { key: "today", label: "Today" },
        { key: "last7", label: "Last 7 Days" },
        { key: "last30", label: "Last 30 Days" },
        { key: "last90", label: "Last 3 Months" },
      ];
  }
}

const STATUS_BADGE: Record<ReportStatus, { cls: string; label: string }> = {
  draft: { cls: "bg-gray-100 text-gray-600 border-gray-200", label: "Draft" },
  submitted: {
    cls: "bg-emerald-50 text-emerald-700 border-emerald-200",
    label: "Submitted",
  },
};

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getDefaultDates(periodType: PeriodType): {
  start: string;
  end: string;
} {
  const now = new Date();
  const end = now.toISOString().slice(0, 10);
  const start = new Date(now);
  if (periodType === "daily") { /* same day */ }
  else if (periodType === "weekly") start.setDate(start.getDate() - 7);
  else if (periodType === "monthly") start.setMonth(start.getMonth() - 1);
  else start.setMonth(start.getMonth() - 3);
  return { start: start.toISOString().slice(0, 10), end };
}

function isContentEmpty(html: string): boolean {
  if (!html) return true;
  return html.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim().length === 0;
}

// ─── PDF Export (shared utility) ──────────────────────────────────────────────

import { exportReportToPdf } from "@/lib/export";

// ─── Report Card ──────────────────────────────────────────────────────────────

function ReportCard({
  report,
  onClick,
  onPublish,
  isPublishing,
  canModify,
}: {
  report: TaskReport;
  onClick: () => void;
  onPublish?: (report: TaskReport) => void;
  isPublishing?: boolean;
  canModify?: boolean;
}) {
  const snippet = report.content.replace(/<[^>]*>/g, "").slice(0, 120);
  return (
    <Card
      className="p-5 border cursor-pointer hover:shadow-md hover:border-emerald-500/30 transition-all group"
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-foreground group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors truncate">
            {report.title}
          </h3>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <Badge
              variant="outline"
              className={`text-[10px] py-0 ${PERIOD_BADGE_COLORS[report.periodType]}`}
            >
              {report.periodType}
            </Badge>
            <Badge
              variant="outline"
              className={`text-[10px] py-0 ${STATUS_BADGE[report.status].cls}`}
            >
              {STATUS_BADGE[report.status].label}
            </Badge>
            {report.visibility && report.visibility !== "everyone" && (() => {
              const vb = VISIBILITY_BADGE[report.visibility];
              const VIcon = vb.icon;
              return (
                <Badge variant="outline" className={`text-[10px] py-0 ${vb.cls} flex items-center gap-0.5`}>
                  <VIcon className="w-2.5 h-2.5" /> {vb.label}
                </Badge>
              );
            })()}
            {report.attachments && report.attachments.length > 0 && (
              <Badge variant="outline" className="text-[10px] py-0 bg-primary/5 text-primary border-primary/20 flex items-center gap-1">
                <Paperclip className="w-2.5 h-2.5" /> {report.attachments.length} {report.attachments.length === 1 ? 'attachment' : 'attachments'}
              </Badge>
            )}
            <span className="text-[11px] text-muted-foreground flex items-center gap-1">
              <Building2 className="w-3 h-3" /> {report.department?.name}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
            {snippet || "No content"}
          </p>
        </div>
        <div className="text-right shrink-0 flex flex-col items-end justify-between self-stretch">
          <div>
            <p className="text-[11px] text-muted-foreground flex items-center gap-1 justify-end">
              <Calendar className="w-3 h-3" />
              {formatDate(report.periodStart)} — {formatDate(report.periodEnd)}
            </p>
            <p className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1 justify-end">
              <User className="w-3 h-3" /> {report.author?.name}
            </p>
          </div>
          {report.status === "draft" && canModify && onPublish && (
            <div className="mt-2">
              <Button
                size="sm"
                className="h-7 px-2.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm gap-1 transition-all"
                disabled={isPublishing}
                onClick={(e) => {
                  e.stopPropagation();
                  onPublish(report);
                }}
              >
                {isPublishing ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Send className="w-3 h-3" />
                )}
                Publish
              </Button>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

// ─── Report Detail ────────────────────────────────────────────────────────────

function ReportDetail({
  report,
  onBack,
  onEdit,
  onDelete,
  onPublish,
  onUnpublish,
  isPublishing,
  canModify,
  canDelete,
}: {
  report: TaskReport;
  onBack: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onPublish?: () => void;
  onUnpublish?: () => void;
  isPublishing?: boolean;
  canModify: boolean;
  canDelete: boolean;
}) {
  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          className="gap-1 -ml-2 text-muted-foreground"
          onClick={onBack}
        >
          <ChevronLeft className="w-4 h-4" /> Back to reports
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 text-xs"
          onClick={() => exportReportToPdf(report)}
        >
          <Download className="w-3.5 h-3.5" /> Export PDF
        </Button>
      </div>

      <Card className="overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-400" />
        <div className="p-6 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="text-lg font-bold text-foreground">
                {report.title}
              </h1>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <Badge
                  variant="outline"
                  className={PERIOD_BADGE_COLORS[report.periodType]}
                >
                  {report.periodType}
                </Badge>
                <Badge
                  variant="outline"
                  className={STATUS_BADGE[report.status].cls}
                >
                  {STATUS_BADGE[report.status].label}
                </Badge>
                {(() => {
                  const vb = VISIBILITY_BADGE[report.visibility || "everyone"];
                  const VIcon = vb.icon;
                  return (
                    <Badge variant="outline" className={`${vb.cls} flex items-center gap-1`}>
                      <VIcon className="w-3 h-3" /> {vb.label}
                    </Badge>
                  );
                })()}
              </div>
            </div>
            {canModify && (
              <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
                {report.status === "draft" && onPublish && (
                  <Button
                    size="sm"
                    className="gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-sm"
                    disabled={isPublishing}
                    onClick={onPublish}
                  >
                    {isPublishing ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Send className="w-3.5 h-3.5" />
                    )}
                    Publish Report
                  </Button>
                )}
                {report.status === "submitted" && onUnpublish && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                    disabled={isPublishing}
                    onClick={onUnpublish}
                  >
                    {isPublishing ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Save className="w-3.5 h-3.5" />
                    )}
                    Revert to Draft
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1 text-xs"
                  onClick={onEdit}
                >
                  <Edit3 className="w-3 h-3" /> Edit
                </Button>
                {canDelete && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1 text-xs text-red-600 hover:bg-red-50 hover:border-red-300 dark:hover:bg-red-950/40"
                    onClick={onDelete}
                  >
                    <Trash2 className="w-3 h-3" /> Delete
                  </Button>
                )}
              </div>
            )}
          </div>

          <Separator />

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <User className="w-3.5 h-3.5" />{" "}
              <span className="font-medium text-foreground">
                {report.author?.name}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Building2 className="w-3.5 h-3.5" />{" "}
              <span className="font-medium text-foreground">
                {report.department?.name}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Calendar className="w-3.5 h-3.5" />{" "}
              {formatDate(report.periodStart)} — {formatDate(report.periodEnd)}
            </div>
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Clock className="w-3.5 h-3.5" /> Created{" "}
              {formatDate(report.createdAt)}
            </div>
          </div>

          <Separator />

          <div
            className="prose prose-sm max-w-none text-foreground"
            dangerouslySetInnerHTML={{ __html: report.content }}
          />

          {report.nextPlan && (
            <>
              <Separator />
              <div>
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  Next Plan
                </h3>
                <div
                  className="prose prose-sm max-w-none text-foreground"
                  dangerouslySetInnerHTML={{ __html: report.nextPlan }}
                />
              </div>
            </>
          )}

          {/* Allowed viewers for secret reports */}
          {report.visibility === "private" && report.allowedViewers?.length > 0 && canModify && (
            <>
              <Separator />
              <div>
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1">
                  <Eye className="w-3 h-3" /> Allowed Viewers
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {report.allowedViewers.map((v) => (
                    <Badge key={v._id} variant="outline" className="text-xs py-0.5 bg-secondary/50">
                      {v.name}
                    </Badge>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Cloudinary Attachments Viewer */}
          {report.attachments && report.attachments.length > 0 && (
            <>
              <Separator />
              <ReportAttachmentViewer
                attachments={report.attachments}
                reportId={report._id}
                reportTitle={report.title}
              />
            </>
          )}
        </div>
      </Card>
    </div>
  );
}

// ─── Create / Edit Form ───────────────────────────────────────────────────────

function ReportForm({
  report,
  departments,
  userDeptId,
  onSave,
  onCancel,
}: {
  report?: TaskReport | null;
  departments: Department[];
  userDeptId?: string;
  onSave: (data: CreateTaskReportData) => Promise<void>;
  onCancel: () => void;
}) {
  const isEdit = !!report;
  const defaults = report
    ? {
        title: report.title,
        content: report.content,
        nextPlan: report.nextPlan || "",
        periodType: report.periodType,
        periodStart: report.periodStart.slice(0, 10),
        periodEnd: report.periodEnd.slice(0, 10),
        department: report.department._id,
        visibility: (report.visibility || "everyone") as ReportVisibility,
        allowedViewers: (report.allowedViewers || []).map((v) => v._id),
      }
    : {
        title: "",
        content: "",
        nextPlan: "",
        periodType: "weekly" as PeriodType,
        periodStart: getDefaultDates("weekly").start,
        periodEnd: getDefaultDates("weekly").end,
        department: userDeptId || departments[0]?._id || "",
        visibility: "everyone" as ReportVisibility,
        allowedViewers: [] as string[],
      };

  const [form, setForm] = useState(defaults);
  const [stagedFiles, setStagedFiles] = useState<File[]>([]);
  const [deletedAttachmentIds, setDeletedAttachmentIds] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewerSearch, setViewerSearch] = useState("");

  // Sync default department when departments load asynchronously
  useEffect(() => {
    if (!form.department && departments.length > 0) {
      const match = userDeptId && departments.some((d) => d._id === userDeptId);
      const targetId = match ? userDeptId! : departments[0]._id;
      setForm((f) => ({ ...f, department: targetId }));
    }
  }, [departments, userDeptId, form.department]);

  // Fetch employees for the viewer picker
  const { data: allEmployees = [] } = useQuery<Employee[]>({
    queryKey: ["employees", "list-for-viewers"],
    queryFn: () => listEmployees({ isActive: true }),
    enabled: form.visibility === "private",
  });

  const handlePeriodTypeChange = (pt: PeriodType) => {
    const dates = getDefaultDates(pt);
    setForm((f) => ({
      ...f,
      periodType: pt,
      periodStart: dates.start,
      periodEnd: dates.end,
    }));
  };

  const submit = async (status: ReportStatus) => {
    setError(null);
    if (!form.title.trim()) {
      setError("Please provide a report title.");
      return;
    }
    if (isContentEmpty(form.content)) {
      setError("Please write report content.");
      return;
    }
    if (!form.department) {
      setError("Please select a department for this report.");
      return;
    }
    if (!form.periodStart || !form.periodEnd) {
      setError("Please provide both period start and end dates.");
      return;
    }
    if (new Date(form.periodEnd) < new Date(form.periodStart)) {
      setError("Period end date cannot be earlier than period start date.");
      return;
    }

    setIsSaving(true);
    try {
      await onSave({
        ...form,
        status,
        files: stagedFiles,
        deletedAttachmentPublicIds: deletedAttachmentIds,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save report");
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      <Button
        variant="ghost"
        size="sm"
        className="gap-1 -ml-2 text-muted-foreground"
        onClick={onCancel}
      >
        <ChevronLeft className="w-4 h-4" /> Cancel
      </Button>

      <Card className="overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-teal-500 via-emerald-400 to-teal-600" />
        <div className="px-6 py-4 border-b bg-secondary/30 flex items-center gap-2">
          <FileText className="w-4 h-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold">
            {isEdit ? "Edit Report" : "New Task Report"}
          </h2>
        </div>

        <div className="p-6 space-y-5">
          {/* Title */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Title
            </label>
            <Input
              value={form.title}
              onChange={(e) =>
                setForm((f) => ({ ...f, title: e.target.value }))
              }
              placeholder="e.g. Marketing Weekly Report — Week 22"
              autoFocus
            />
          </div>

          {/* Period Type + Dates */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Period Type
              </label>
              <select
                value={form.periodType}
                onChange={(e) =>
                  handlePeriodTypeChange(e.target.value as PeriodType)
                }
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Start Date
              </label>
              <Input
                type="date"
                value={form.periodStart}
                onChange={(e) =>
                  setForm((f) => ({ ...f, periodStart: e.target.value }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                End Date
              </label>
              <Input
                type="date"
                value={form.periodEnd}
                onChange={(e) =>
                  setForm((f) => ({ ...f, periodEnd: e.target.value }))
                }
              />
            </div>
          </div>

          {/* Department */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Department
            </label>
            <select
              value={form.department}
              onChange={(e) =>
                setForm((f) => ({ ...f, department: e.target.value }))
              }
              className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="">Select department</option>
              {departments.map((d) => (
                <option key={d._id} value={d._id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          {/* Content */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Report Content
            </label>
            <div className="border border-input rounded-lg overflow-hidden">
              <RichTextEditor
                value={form.content}
                onChange={(html) => setForm((f) => ({ ...f, content: html }))}
                placeholder="Write your task report here..."
              />
            </div>
          </div>

          {/* Next Plan */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Next Plan
            </label>
            <div className="border border-input rounded-lg overflow-hidden">
              <RichTextEditor
                value={form.nextPlan}
                onChange={(html) => setForm((f) => ({ ...f, nextPlan: html }))}
                placeholder="Outline upcoming tasks and goals..."
              />
            </div>
          </div>

          {/* Visibility */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Visibility
            </label>
            <div className="flex items-center gap-2">
              {(["everyone", "department_only", "admins_only", "private"] as ReportVisibility[]).map((v) => {
                const vb = VISIBILITY_BADGE[v];
                const VIcon = vb.icon;
                const isActive = form.visibility === v;
                return (
                  <button
                    key={v}
                    type="button"
                    onClick={() =>
                      setForm((f) => ({
                        ...f,
                        visibility: v,
                        allowedViewers: v !== "private" ? [] : f.allowedViewers,
                      }))
                    }
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-medium transition-all ${
                      isActive
                        ? `${vb.cls} border-current shadow-sm ring-1 ring-current/20`
                        : "border-input text-muted-foreground hover:text-foreground hover:bg-secondary/60"
                    }`}
                  >
                    <VIcon className="w-3.5 h-3.5" />
                    {vb.label}
                  </button>
                );
              })}
            </div>
            <p className="text-[11px] text-muted-foreground">
              {form.visibility === "everyone" && "Visible to all authenticated users."}
              {form.visibility === "department_only" && "Only visible to members of the report's department."}
              {form.visibility === "admins_only" && "Only visible to admins and superadmins."}
              {form.visibility === "private" && "Only visible to superadmins, the author, and selected viewers below."}
            </p>
          </div>

          {/* Allowed Viewers (private only) */}
          {form.visibility === "private" && (
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                <Users2 className="w-3.5 h-3.5" /> Allowed Viewers
              </label>

              {/* Selected viewers */}
              {form.allowedViewers.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {form.allowedViewers.map((id) => {
                    const emp = allEmployees.find((e) => e._id === id);
                    return (
                      <Badge
                        key={id}
                        variant="outline"
                        className="text-xs py-0.5 pr-1 bg-secondary/50 flex items-center gap-1 cursor-pointer hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-colors"
                        onClick={() =>
                          setForm((f) => ({
                            ...f,
                            allowedViewers: f.allowedViewers.filter((v) => v !== id),
                          }))
                        }
                      >
                        {emp?.name || id}
                        <X className="w-3 h-3" />
                      </Badge>
                    );
                  })}
                </div>
              )}

              {/* Search & pick employees */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-2.5 top-1/2 -translate-y-1/2" />
                <Input
                  value={viewerSearch}
                  onChange={(e) => setViewerSearch(e.target.value)}
                  placeholder="Search employees to add..."
                  className="pl-8 h-8 text-xs"
                />
              </div>
              {viewerSearch.trim() && (
                <div className="border rounded-lg max-h-40 overflow-y-auto">
                  {allEmployees
                    .filter(
                      (e) =>
                        !form.allowedViewers.includes(e._id) &&
                        (e.name.toLowerCase().includes(viewerSearch.toLowerCase()) ||
                          e.email.toLowerCase().includes(viewerSearch.toLowerCase()))
                    )
                    .slice(0, 10)
                    .map((emp) => (
                      <button
                        key={emp._id}
                        type="button"
                        onClick={() => {
                          setForm((f) => ({
                            ...f,
                            allowedViewers: [...f.allowedViewers, emp._id],
                          }));
                          setViewerSearch("");
                        }}
                        className="w-full text-left px-3 py-2 text-xs hover:bg-secondary/60 transition-colors flex items-center justify-between"
                      >
                        <span className="font-medium">{emp.name}</span>
                        <span className="text-muted-foreground">{emp.email}</span>
                      </button>
                    ))}
                  {allEmployees.filter(
                    (e) =>
                      !form.allowedViewers.includes(e._id) &&
                      (e.name.toLowerCase().includes(viewerSearch.toLowerCase()) ||
                        e.email.toLowerCase().includes(viewerSearch.toLowerCase()))
                  ).length === 0 && (
                    <div className="px-3 py-2 text-xs text-muted-foreground">No matching employees</div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Cloudinary File Uploads */}
          <div className="pt-2 border-t">
            <ReportAttachmentUploader
              existingAttachments={report?.attachments || []}
              onFilesChange={setStagedFiles}
              onDeletedAttachmentIdsChange={setDeletedAttachmentIds}
              maxFiles={5}
              maxSizeMb={10}
            />
          </div>

          {error && (
            <div className="flex items-center gap-1.5 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2 pt-1">
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="gap-1.5"
              disabled={isSaving}
              onClick={() => submit("draft")}
            >
              {isSaving ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Save className="w-3.5 h-3.5" />
              )}
              Save as Draft
            </Button>
            <Button
              type="button"
              size="sm"
              className="gap-1.5"
              disabled={isSaving}
              onClick={() => submit("submitted")}
            >
              {isSaving ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Send className="w-3.5 h-3.5" />
              )}
              Submit Report
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

type View = "list" | "detail" | "create" | "edit";

export default function AdminReportsPage() {
  const { user, permissions = [] } = useAuth();
  const [view, setView] = useState<View>("list");
  const [selectedReport, setSelectedReport] = useState<TaskReport | null>(null);
  const { createTaskReport, updateTaskReport, deleteTaskReport } =
    useReportMutations();

  // Filters
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filterPeriod, setFilterPeriod] = useState<PeriodType | "">("");
  const [filterDept, setFilterDept] = useState("");
  const [filterStatus, setFilterStatus] = useState<ReportStatus | "">("");
  const [filterVisibility, setFilterVisibility] = useState<ReportVisibility | "">("");
  const [myReportsOnly, setMyReportsOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [datePreset, setDatePreset] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  // Debounce search input by 300ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const applyDatePreset = (key: string) => {
    setDatePreset(key);
    const { from, to } = getDatePreset(key);
    setDateFrom(from);
    setDateTo(to);
    setPage(1);
  };

  // ── Build filters ───────────────────────────────────────────────────────
  const reportFilters: TaskReportFilters = { page, limit: 15 };
  if (debouncedSearch.trim()) reportFilters.search = debouncedSearch.trim();
  if (filterPeriod) reportFilters.periodType = filterPeriod;
  if (filterDept) reportFilters.department = filterDept;
  if (filterStatus) reportFilters.status = filterStatus;
  if (filterVisibility) reportFilters.visibility = filterVisibility;
  if (myReportsOnly && user?.id) reportFilters.author = user.id;
  if (dateFrom) reportFilters.dateFrom = dateFrom;
  if (dateTo) reportFilters.dateTo = dateTo;

  // ── Queries ────────────────────────────────────────────────────────────
  const {
    reports,
    total,
    totalPages,
    isLoading,
    error,
    invalidate: invalidateReports,
  } = useReports(reportFilters);

  const { departments } = useDepartments({ isActive: true });

  const handleCreate = async (data: CreateTaskReportData) => {
    try {
      await createTaskReport.mutateAsync(data);
      toast.success(data.status === "draft" ? "Draft saved successfully" : "Report submitted successfully");
      setView("list");
      setPage(1);
      invalidateReports();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create report");
      throw err;
    }
  };

  const handleUpdate = async (data: CreateTaskReportData) => {
    if (!selectedReport) return;
    try {
      const updated = await updateTaskReport.mutateAsync({
        id: selectedReport._id,
        data,
      });
      setSelectedReport(updated);
      toast.success(data.status === "draft" ? "Draft updated" : "Report updated successfully");
      setView("detail");
      invalidateReports();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update report");
      throw err;
    }
  };

  const handleDelete = async () => {
    if (!selectedReport) return;
    if (!confirm("Delete this report? This cannot be undone.")) return;
    try {
      await deleteTaskReport.mutateAsync(selectedReport._id);
      toast.success("Report deleted successfully");
      setSelectedReport(null);
      setView("list");
      invalidateReports();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete report");
    }
  };

  const canModify = (report: TaskReport) =>
    canUserPerformAction({
      userId: user?.id,
      userDepartmentId: (user as any)?.departmentId,
      userPermissions: permissions,
      entityAuthorId: report.author?._id,
      entityDepartmentId: report.department?._id,
      domain: "reports",
      action: "update",
    });

  const canDelete = (report: TaskReport) =>
    canUserPerformAction({
      userId: user?.id,
      userDepartmentId: (user as any)?.departmentId,
      userPermissions: permissions,
      entityAuthorId: report.author?._id,
      entityDepartmentId: report.department?._id,
      domain: "reports",
      action: "delete",
    });

  const [publishingId, setPublishingId] = useState<string | null>(null);

  const handlePublish = async (report: TaskReport) => {
    setPublishingId(report._id);
    try {
      const updated = await updateTaskReport.mutateAsync({
        id: report._id,
        data: { status: "submitted" },
      });
      if (selectedReport?._id === report._id) {
        setSelectedReport(updated);
      }
      toast.success(`Published "${report.title}"`);
      invalidateReports();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to publish report");
    } finally {
      setPublishingId(null);
    }
  };

  const handleUnpublish = async (report: TaskReport) => {
    setPublishingId(report._id);
    try {
      const updated = await updateTaskReport.mutateAsync({
        id: report._id,
        data: { status: "draft" },
      });
      if (selectedReport?._id === report._id) {
        setSelectedReport(updated);
      }
      toast.success(`Reverted "${report.title}" to draft`);
      invalidateReports();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to revert report");
    } finally {
      setPublishingId(null);
    }
  };

  const hasFilters =
    !!debouncedSearch.trim() ||
    !!filterPeriod ||
    !!filterDept ||
    !!filterStatus ||
    !!filterVisibility ||
    myReportsOnly ||
    !!dateFrom ||
    !!dateTo;

  // ── Detail View ──
  if (view === "detail" && selectedReport) {
    return (
      <ReportDetail
        report={selectedReport}
        onBack={() => {
          setSelectedReport(null);
          setView("list");
        }}
        onEdit={() => setView("edit")}
        onDelete={handleDelete}
        onPublish={() => handlePublish(selectedReport)}
        onUnpublish={() => handleUnpublish(selectedReport)}
        isPublishing={publishingId === selectedReport._id}
        canModify={canModify(selectedReport)}
        canDelete={canDelete(selectedReport)}
      />
    );
  }

  // ── Create / Edit View ──
  if (view === "create" || (view === "edit" && selectedReport)) {
    return (
      <ReportForm
        report={view === "edit" ? selectedReport : null}
        departments={departments}
        userDeptId={(user as any)?.departmentId}
        onSave={view === "edit" ? handleUpdate : handleCreate}
        onCancel={() => {
          setView(selectedReport ? "detail" : "list");
        }}
      />
    );
  }

  // ── List View ──

  const draftCount = reports.filter((r) => r.status === "draft").length;
  const submittedCount = reports.filter((r) => r.status === "submitted").length;

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-teal-50">
              <BarChart3 className="w-5 h-5 text-teal-600" />
            </div>
            Reports
          </h1>
          <p className="text-sm text-muted-foreground">
            Department reports — weekly, monthly, and quarterly
          </p>
        </div>
        <Button
          className="gap-1.5 shadow-sm"
          onClick={() => {
            setSelectedReport(null);
            setView("create");
          }}
        >
          <Plus className="w-4 h-4" /> New Report
        </Button>
      </div>

      {/* ── View tabs ── */}
      <div className="flex items-center gap-1 p-1 bg-secondary rounded-lg w-fit">
        <button
          onClick={() => {
            setMyReportsOnly(false);
            setPage(1);
          }}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
            !myReportsOnly
              ? "bg-white text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          All Reports
        </button>
        <button
          onClick={() => {
            setMyReportsOnly(true);
            setPage(1);
          }}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-1.5 ${
            myReportsOnly
              ? "bg-white text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <User className="w-3.5 h-3.5" /> My Reports
        </button>
      </div>

      {/* ── Summary strip ── */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="px-4 py-3 border flex flex-row items-center gap-3">
          <div className="p-2 rounded-lg bg-secondary shrink-0">
            <FileText className="w-4 h-4 text-muted-foreground" />
          </div>
          <div>
            <p className="text-lg font-bold text-foreground leading-none">
              {total}
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Total Reports
            </p>
          </div>
        </Card>
        <Card className="px-4 py-3 border flex flex-row items-center gap-3">
          <div className="p-2 rounded-lg bg-gray-100 shrink-0">
            <Edit3 className="w-4 h-4 text-gray-500" />
          </div>
          <div>
            <p className="text-lg font-bold text-foreground leading-none">
              {draftCount}
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">Drafts</p>
          </div>
        </Card>
        <Card className="px-4 py-3 border flex flex-row items-center gap-3">
          <div className="p-2 rounded-lg bg-emerald-50 shrink-0">
            <Send className="w-4 h-4 text-emerald-600" />
          </div>
          <div>
            <p className="text-lg font-bold text-foreground leading-none">
              {submittedCount}
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Submitted
            </p>
          </div>
        </Card>
      </div>

      {/* ── Filters ── */}
      <Card className="border shadow-sm overflow-hidden">
        {/* Row 1: Search + Period type + dropdowns */}
        <div className="px-4 py-2.5 flex items-center gap-3 flex-wrap">
          {/* Live Search */}
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search reports by title or content..."
              className="h-8 pl-8 pr-7 text-xs bg-background"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Period tabs */}
          <div className="flex items-center gap-0.5 p-0.5 bg-secondary rounded-lg">
            {PERIOD_TYPES.map((p) => (
              <button
                key={p.value}
                onClick={() => {
                  setFilterPeriod(p.value as PeriodType | "");
                  setDatePreset("");
                  setDateFrom("");
                  setDateTo("");
                  setPage(1);
                }}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  filterPeriod === p.value
                    ? "bg-white text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Right side: dropdowns + clear */}
          <div className="ml-auto flex items-center gap-2">
            <div className="relative">
              <Building2 className="w-3.5 h-3.5 text-muted-foreground absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <select
                value={filterDept}
                onChange={(e) => {
                  setFilterDept(e.target.value);
                  setPage(1);
                }}
                className="h-8 rounded-lg border border-input bg-background pl-8 pr-6 text-xs shadow-sm focus:outline-none focus:ring-2 focus:ring-ring/30 cursor-pointer appearance-none"
              >
                <option value="">All Departments</option>
                {departments.map((d) => (
                  <option key={d._id} value={d._id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="relative">
              <Clock className="w-3.5 h-3.5 text-muted-foreground absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <select
                value={filterStatus}
                onChange={(e) => {
                  setFilterStatus(e.target.value as ReportStatus | "");
                  setPage(1);
                }}
                className="h-8 rounded-lg border border-input bg-background pl-8 pr-6 text-xs shadow-sm focus:outline-none focus:ring-2 focus:ring-ring/30 cursor-pointer appearance-none"
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="relative">
              <Eye className="w-3.5 h-3.5 text-muted-foreground absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <select
                value={filterVisibility}
                onChange={(e) => {
                  setFilterVisibility(e.target.value as ReportVisibility | "");
                  setPage(1);
                }}
                className="h-8 rounded-lg border border-input bg-background pl-8 pr-6 text-xs shadow-sm focus:outline-none focus:ring-2 focus:ring-ring/30 cursor-pointer appearance-none"
              >
                {VISIBILITY_OPTIONS.map((v) => (
                  <option key={v.value} value={v.value}>
                    {v.label}
                  </option>
                ))}
              </select>
            </div>
            {hasFilters && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-xs gap-1 text-muted-foreground hover:text-red-600 hover:bg-red-50"
                onClick={() => {
                  setSearch("");
                  setDebouncedSearch("");
                  setFilterPeriod("");
                  setFilterDept("");
                  setFilterStatus("");
                  setFilterVisibility("");
                  setMyReportsOnly(false);
                  setDatePreset("");
                  setDateFrom("");
                  setDateTo("");
                  setPage(1);
                }}
              >
                <X className="w-3 h-3" /> Clear
              </Button>
            )}
          </div>
        </div>

        {/* Row 2: Contextual date presets + custom range */}
        <div className="px-4 py-2 border-t border-border/40 bg-secondary/20 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            <div className="flex items-center gap-1">
              {getDatePresetsForPeriod(filterPeriod).map((d) => (
                <button
                  key={d.key}
                  onClick={() => applyDatePreset(d.key)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                    datePreset === d.key
                      ? "bg-white text-foreground shadow-sm border border-border/60"
                      : "text-muted-foreground hover:text-foreground hover:bg-white/60"
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          {/* Custom from/to */}
          <div className="flex items-center gap-1.5 text-xs">
            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => {
                setDateFrom(e.target.value);
                setDatePreset("custom");
                setPage(1);
              }}
              className="h-7 w-[145px] text-[11px] bg-white"
            />
            <span className="text-muted-foreground">—</span>
            <Input
              type="date"
              value={dateTo}
              onChange={(e) => {
                setDateTo(e.target.value);
                setDatePreset("custom");
                setPage(1);
              }}
              className="h-7 w-[145px] text-[11px] bg-white"
            />
          </div>
        </div>
      </Card>

      {/* ── Error ── */}
      {error && (
        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
          <AlertCircle className="w-4 h-4 shrink-0" /> {error}
          <Button
            variant="outline"
            size="sm"
            className="ml-auto"
            onClick={() => invalidateReports()}
          >
            Retry
          </Button>
        </div>
      )}

      {/* ── Content ── */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-[88px] rounded-xl bg-muted/60 animate-pulse"
            />
          ))}
        </div>
      ) : reports.length === 0 ? (
        <Card className="py-16 text-center border">
          <div className="mx-auto w-12 h-12 rounded-full bg-secondary flex items-center justify-center mb-4">
            <FileText className="w-6 h-6 text-muted-foreground/50" />
          </div>
          <p className="text-sm font-semibold text-foreground">
            No reports found
          </p>
          <p className="text-xs text-muted-foreground mt-1 max-w-[240px] mx-auto">
            {hasFilters
              ? "Try adjusting your filters to find reports."
              : "Create your first  report to get started."}
          </p>
          {!hasFilters && (
            <Button
              size="sm"
              className="mt-5 gap-1.5"
              onClick={() => setView("create")}
            >
              <Plus className="w-4 h-4" /> Create Report
            </Button>
          )}
        </Card>
      ) : (
        <>
          {/* Report list */}
          <div className="space-y-2.5">
            {reports.map((r) => (
              <ReportCard
                key={r._id}
                report={r}
                canModify={canModify(r)}
                onPublish={handlePublish}
                isPublishing={publishingId === r._id}
                onClick={() => {
                  setSelectedReport(r);
                  setView("detail");
                }}
              />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 pt-2">
              <Button
                variant="outline"
                size="sm"
                className="text-xs"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                ← Previous
              </Button>
              <span className="text-xs text-muted-foreground tabular-nums">
                Page <span className="font-medium text-foreground">{page}</span>{" "}
                of{" "}
                <span className="font-medium text-foreground">
                  {totalPages}
                </span>
              </span>
              <Button
                variant="outline"
                size="sm"
                className="text-xs"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next →
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
