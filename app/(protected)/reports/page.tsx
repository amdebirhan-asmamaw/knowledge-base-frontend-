"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  listPublicTaskReports,
  type TaskReport,
  type PeriodType,
  type TaskReportFilters,
} from "@/lib/api/reports.api";
import { listDepartments, type Department } from "@/lib/api/departments.api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/PageShell";
import { ReportAttachmentViewer } from "@/components/ReportAttachmentViewer";
import Link from "next/link";
import {
  FileText,
  Calendar,
  Building2,
  User,
  ChevronLeft,
  ChevronRight,
  Filter,
  Loader2,
  AlertCircle,
  Clock,
  Download,
  Paperclip,
  Plus,
  Search,
  X,
} from "lucide-react";

// ─── Constants ────────────────────────────────────────────────────────────────

const PERIOD_TYPES: { value: PeriodType | ""; label: string }[] = [
  { value: "", label: "All Periods" },
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "quarterly", label: "Quarterly" },
];


const PERIOD_BADGE_COLORS: Record<PeriodType, string> = {
  daily: "bg-emerald-50 text-emerald-700 border-emerald-200",
  weekly: "bg-blue-50 text-blue-700 border-blue-200",
  monthly: "bg-violet-50 text-violet-700 border-violet-200",
  quarterly: "bg-amber-50 text-amber-700 border-amber-200",
};

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatRelative(d: string) {
  const diff = Date.now() - new Date(d).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return formatDate(d);
}

// ─── Report Card ──────────────────────────────────────────────────────────────

function ReportCard({
  report,
  onClick,
}: {
  report: TaskReport;
  onClick: () => void;
}) {
  const snippet = report.content.replace(/<[^>]*>/g, "").slice(0, 140);
  return (
    <Card
      className="p-5 border cursor-pointer hover:shadow-md hover:border-primary/30 transition-all group"
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors truncate">
            {report.title}
          </h3>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <Badge
              variant="outline"
              className={`text-[10px] py-0 ${PERIOD_BADGE_COLORS[report.periodType]}`}
            >
              {report.periodType}
            </Badge>
            {report.attachments && report.attachments.length > 0 && (
              <Badge
                variant="outline"
                className="text-[10px] py-0 bg-primary/5 text-primary border-primary/20 flex items-center gap-1"
              >
                <Paperclip className="w-2.5 h-2.5" /> {report.attachments.length} {report.attachments.length === 1 ? 'file' : 'files'}
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
        <div className="text-right shrink-0">
          <p className="text-[11px] text-muted-foreground flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {formatDate(report.periodStart)} — {formatDate(report.periodEnd)}
          </p>
          <p className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1 justify-end">
            <User className="w-3 h-3" /> {report.author?.name}
          </p>
        </div>
      </div>
    </Card>
  );
}

// ─── PDF Export (shared utility) ──────────────────────────────────────────────

import { exportReportToPdf } from "@/lib/export";

// ─── Report Detail View ───────────────────────────────────────────────────────

function ReportDetailView({
  report,
  onBack,
}: {
  report: TaskReport;
  onBack: () => void;
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
        <div className="h-0.5 bg-primary" />
        <div className="p-6 space-y-4">
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
                className="bg-emerald-50 text-emerald-700 border-emerald-200"
              >
                Submitted
              </Badge>
            </div>
          </div>

          {/* Meta row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-secondary/40 rounded-xl text-xs">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <User className="w-3.5 h-3.5" />
              <div>
                <p className="font-medium text-foreground">
                  {report.author?.name}
                </p>
                <p>{report.author?.position || "—"}</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Building2 className="w-3.5 h-3.5" />
              <span className="text-foreground">
                {report.department?.name}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Calendar className="w-3.5 h-3.5" />
              <span>
                {formatDate(report.periodStart)} —{" "}
                {formatDate(report.periodEnd)}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Clock className="w-3.5 h-3.5" />
              <span>{formatRelative(report.createdAt)}</span>
            </div>
          </div>

          {/* Content */}
          <div
            className="prose prose-sm max-w-none text-foreground"
            dangerouslySetInnerHTML={{ __html: report.content }}
          />

          {/* Next Plan */}
          {report.nextPlan && (
            <>
              <div className="border-t pt-4">
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

          {/* Cloudinary Attachments Viewer */}
          {report.attachments && report.attachments.length > 0 && (
            <div className="border-t pt-4">
              <ReportAttachmentViewer
                attachments={report.attachments}
                reportId={report._id}
                reportTitle={report.title}
              />
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function PublicReportsPage() {
  const [selectedReport, setSelectedReport] = useState<TaskReport | null>(null);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filterPeriod, setFilterPeriod] = useState<PeriodType | "">("");
  const [filterDept, setFilterDept] = useState("");
  const [page, setPage] = useState(1);

  // Debounce search input by 300ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const filters: Pick<
    TaskReportFilters,
    "page" | "limit" | "search" | "periodType" | "department"
  > = {
    page,
    limit: 12,
  };
  if (debouncedSearch.trim()) filters.search = debouncedSearch.trim();
  if (filterPeriod) filters.periodType = filterPeriod;
  if (filterDept) filters.department = filterDept;

  const {
    data,
    isLoading,
    error: queryError,
  } = useQuery({
    queryKey: ["public-reports", "list", filters],
    queryFn: () => listPublicTaskReports(filters),
  });

  const { data: departments = [] } = useQuery<Department[]>({
    queryKey: ["departments", "list", { isActive: true }],
    queryFn: () => listDepartments({ isActive: true }),
  });

  const reports = data?.reports ?? [];
  const total = data?.pagination?.total ?? 0;
  const totalPages = data?.pagination?.totalPages ?? 1;
  const error =
    queryError instanceof Error ? queryError.message : queryError ? String(queryError) : null;

  const hasFilters = !!debouncedSearch.trim() || !!filterPeriod || !!filterDept;

  // ─── Detail view ──────────────────────────────────────────────────────────
  if (selectedReport) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <ReportDetailView
          report={selectedReport}
          onBack={() => setSelectedReport(null)}
        />
      </div>
    );
  }

  // ─── List view ────────────────────────────────────────────────────────────
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex items-center justify-between gap-4 mb-2 flex-wrap">
        <PageHeader
          icon={<FileText className="w-5 h-5 text-emerald-600" />}
          title="Reports"
          subtitle="Published reports from your organization."
          badge={total > 0 ? <Badge variant="secondary" className="text-xs">{total}</Badge> : undefined}
        />
        <Link href="/admin/reports">
          <Button size="sm" className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm text-xs">
            <Plus className="w-3.5 h-3.5" /> Submit & Manage Reports
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search reports by title..."
            className="h-8 pl-8 pr-7 text-xs bg-background"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Filter className="w-3.5 h-3.5" />
          <span>Filter:</span>
        </div>
        <select
          value={filterPeriod}
          onChange={(e) => {
            setFilterPeriod(e.target.value as PeriodType | "");
            setPage(1);
          }}
          className="h-8 rounded-md border border-input bg-background px-2.5 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
        >
          {PERIOD_TYPES.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </select>
        <select
          value={filterDept}
          onChange={(e) => {
            setFilterDept(e.target.value);
            setPage(1);
          }}
          className="h-8 rounded-md border border-input bg-background px-2.5 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
        >
          <option value="">All Departments</option>
          {departments.map((d) => (
            <option key={d._id} value={d._id}>
              {d.name}
            </option>
          ))}
        </select>
        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            className="text-xs h-8 gap-1 text-muted-foreground hover:text-red-600 hover:bg-red-50"
            onClick={() => {
              setSearch("");
              setDebouncedSearch("");
              setFilterPeriod("");
              setFilterDept("");
              setPage(1);
            }}
          >
            Clear
          </Button>
        )}
      </div>


        {/* Loading */}
        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
            <AlertCircle className="w-6 h-6 text-red-500 mx-auto mb-2" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Empty */}
        {!isLoading && !error && reports.length === 0 && (
          <div className="rounded-xl border border-dashed border-border p-12 text-center">
            <FileText className="w-8 h-8 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              {hasFilters
                ? "No reports match your filters."
                : "No published reports yet. Check back soon."}
            </p>
          </div>
        )}

        {/* Report Cards */}
        {!isLoading && reports.length > 0 && (
          <div className="space-y-3">
            {reports.map((r) => (
              <ReportCard
                key={r._id}
                report={r}
                onClick={() => setSelectedReport(r)}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 mt-8">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="gap-1"
            >
              <ChevronLeft className="w-3.5 h-3.5" /> Previous
            </Button>
            <span className="text-xs text-muted-foreground">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="gap-1"
            >
              Next <ChevronRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        )}
    </div>
  );
}
