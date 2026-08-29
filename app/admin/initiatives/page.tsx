"use client";

import { useState, useMemo } from "react";
import { useAuth } from "@/hooks/use-auth";
import {
  type Initiative,
  type InitiativeFilters,
  type InitiativeStatus,
  type CreateInitiativeData,
} from "@/lib/api/initiatives.api";
import type { Department } from "@/lib/api/departments.api";
import {
  useInitiatives,
  useInitiativeMutations,
  useDepartments,
} from "@/hooks/queries";
import { InitiativeInteractions } from "@/components/InitiativeInteractions";
import { InitiativeEvaluationPanel } from "@/components/InitiativeEvaluationPanel";
import { EvaluationBadge } from "@/components/EvaluationBadge";
import { EvaluationConfigForm } from "@/components/EvaluationConfigForm";
import { RichTextEditor } from "@/components/RichTextEditor";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Lightbulb,
  Plus,
  Loader2,
  AlertCircle,
  Building2,
  ChevronLeft,
  ChevronRight,
  Save,
  Send,
  Trash2,
  Edit3,
  Clock,
  User,
  Download,
  X,
  Filter,
  Users,
  SlidersHorizontal,
  Sparkles,
  CheckCircle2,
  Target,
  ArrowRight,
  Search,
} from "lucide-react";

// ─── Status Configurations ───────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  InitiativeStatus,
  { label: string; bg: string; text: string; border: string; icon: React.ElementType }
> = {
  submitted: {
    label: "Submitted",
    bg: "bg-emerald-500/10",
    text: "text-emerald-600 dark:text-emerald-400",
    border: "border-emerald-500/20",
    icon: CheckCircle2,
  },
  draft: {
    label: "Draft",
    bg: "bg-slate-500/10",
    text: "text-slate-600 dark:text-slate-400",
    border: "border-slate-500/20",
    icon: Clock,
  },
};

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// ─── PDF Export ───────────────────────────────────────────────────────────────

function exportInitiativePdf(i: Initiative) {
  const w = window.open("", "_blank");
  if (!w) return;
  const sec = (label: string, html: string) =>
    html
      ? `<div class="section"><div class="section-label">${label}</div><div class="content">${html}</div></div>`
      : "";
  const supportNames = i.supportNeeded?.map((d) => d.name).join(", ") || "—";
  const ev = i.evaluation;
  const evalHtml =
    ev && ev.state === "evaluated" && ev.finalScore !== null
      ? `<div class="section"><div class="section-label">Performance Evaluation</div><div class="content">` +
        `<p><strong>Score: ${ev.finalScore}/100</strong>${ev.tierLabel ? ` · ${ev.tierLabel}` : ""}</p>` +
        `<ul>${ev.criterionScores.map((c) => `<li>${c.label}: ${c.rawScore.toFixed(1)}/5 (weight ${c.weight})</li>`).join("")}</ul>` +
        (ev.note ? `<p><em>${ev.note}</em></p>` : "") +
        `</div></div>`
      : "";
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>${i.title}</title>
<style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#0f172a;padding:48px;max-width:800px;margin:0 auto;line-height:1.6}.header{border-bottom:2px solid #e2e8f0;padding-bottom:20px;margin-bottom:24px}.title{font-size:22px;font-weight:700;margin-bottom:8px;color:#1e3a8a}.meta{display:flex;flex-wrap:wrap;gap:20px;font-size:12px;color:#64748b;margin-top:12px}.section{margin-top:24px}.section-label{font-size:10px;text-transform:uppercase;letter-spacing:1px;font-weight:700;color:#2563eb;margin-bottom:8px}.content{font-size:14px;color:#334155}.content p{margin-bottom:8px}.content ul,.content ol{margin-left:20px;margin-bottom:8px}.footer{margin-top:40px;padding-top:16px;border-top:1px solid #e2e8f0;font-size:11px;color:#94a3b8;text-align:center}@media print{body{padding:0}}</style></head><body>
<div class="header"><div class="title">${i.title}</div><div class="meta">
<div>Author: <strong>${i.author?.name || "—"}</strong></div>
<div>Department: <strong>${i.department?.name || "—"}</strong></div>
<div>Status: <strong>${i.status}</strong></div>
<div>Support Needed: <strong>${supportNames}</strong></div>
<div>Created: ${formatDate(i.createdAt)}</div>
</div></div>
${sec("Problem Statement", i.problem)}${sec("Why It Matters (Impact)", i.whyItMatters)}${sec("Proposed Solution", i.proposedSolution)}${sec("Execution Plan", i.executionPlan)}${sec("Expected Outcome", i.expectedOutcome)}${evalHtml}
<div class="footer">Ahununu Express Internal Knowledge Base · Exported on ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" })}</div>
<script>window.onload=function(){window.print();}</script></body></html>`;
  w.document.write(html);
  w.document.close();
}

// ─── Initiative Card Component ────────────────────────────────────────────────

function InitiativeCard({
  item,
  onClick,
}: {
  item: Initiative;
  onClick: () => void;
}) {
  const snippet = item.problem
    ? item.problem.replace(/<[^>]*>/g, "").slice(0, 140)
    : "";

  const statusCfg =
    STATUS_CONFIG[item.status] ?? STATUS_CONFIG.submitted;
  const StatusIcon = statusCfg.icon;

  const authorInitials = item.author?.name
    ? item.author.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "IE";

  return (
    <div
      onClick={onClick}
      className="group relative rounded-2xl border border-border bg-card hover:border-amber-500/40 p-5 cursor-pointer transition-all duration-300 hover:shadow-xl hover:shadow-black/5 hover:-translate-y-0.5 flex flex-col justify-between space-y-4 overflow-hidden"
    >
      {/* Top Accent Strip */}
      <div
        className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${
          item.status === "submitted"
            ? "from-amber-500 to-orange-500"
            : "from-slate-400 to-slate-500"
        }`}
      />

      <div className="space-y-3">
        {/* Header Row */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1.5">
              <span
                className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${statusCfg.bg} ${statusCfg.text} ${statusCfg.border}`}
              >
                <StatusIcon className="w-3 h-3" />
                {statusCfg.label}
              </span>

              {item.department?.name && (
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                  <Building2 className="w-3 h-3 text-amber-500" />
                  {item.department.name}
                </span>
              )}

              <EvaluationBadge evaluation={item.evaluation} />
            </div>

            <h3 className="text-base font-semibold text-foreground group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors leading-snug">
              {item.title}
            </h3>
          </div>

          <div className="w-8 h-8 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-bold flex items-center justify-center shrink-0 border border-amber-500/20">
            {authorInitials}
          </div>
        </div>

        {/* Problem Snippet */}
        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
          {snippet || "No problem statement provided."}
        </p>

        {/* Supporting Teams */}
        {item.supportNeeded && item.supportNeeded.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap pt-1">
            <span className="text-[10px] text-muted-foreground font-medium flex items-center gap-1">
              <Users className="w-3 h-3 text-blue-500" /> Teams:
            </span>
            {item.supportNeeded.slice(0, 3).map((d) => (
              <span
                key={d._id}
                className="text-[10px] bg-secondary text-secondary-foreground px-2 py-0.5 rounded-md font-medium"
              >
                {d.name}
              </span>
            ))}
            {item.supportNeeded.length > 3 && (
              <span className="text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded-md font-medium">
                +{item.supportNeeded.length - 3}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Footer Info Strip */}
      <div className="pt-3 border-t border-border/60 flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <User className="w-3.5 h-3.5 text-muted-foreground/80" />
            <span className="text-foreground font-medium">
              {item.author?.name || "Author"}
            </span>
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-muted-foreground/80" />
            {formatDate(item.createdAt)}
          </span>
        </div>

        <div className="flex items-center gap-1 font-medium text-amber-600 dark:text-amber-400 group-hover:translate-x-0.5 transition-transform text-xs">
          <span>Manage</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </div>
      </div>
    </div>
  );
}

// ─── Detail View Component ────────────────────────────────────────────────────

function InitiativeDetail({
  item,
  onBack,
  onEdit,
  onDelete,
  canManage,
  userId,
}: {
  item: Initiative;
  onBack: () => void;
  onEdit: () => void;
  onDelete: () => void;
  canManage: boolean;
  userId?: string;
}) {
  const Section = ({
    label,
    icon: Icon,
    html,
  }: {
    label: string;
    icon: React.ElementType;
    html: string;
  }) =>
    html ? (
      <div className="space-y-2 p-5 rounded-xl border border-border bg-muted/20">
        <div className="flex items-center gap-2 text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
          <Icon className="w-4 h-4" />
          <span>{label}</span>
        </div>
        <div
          className="prose prose-sm max-w-none text-foreground leading-relaxed pt-1"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </div>
    ) : null;

  const statusCfg =
    STATUS_CONFIG[item.status] ?? STATUS_CONFIG.submitted;
  const StatusIcon = statusCfg.icon;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Action Bar */}
      <div className="flex items-center justify-between gap-4">
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5 text-xs text-muted-foreground hover:text-foreground -ml-2"
          onClick={onBack}
        >
          <ChevronLeft className="w-4 h-4" /> Back to Initiatives
        </Button>
        <div className="flex items-center gap-2">
          {canManage && (
            <>
              <Button
                variant="outline"
                size="sm"
                className="gap-1 text-xs h-8"
                onClick={onEdit}
              >
                <Edit3 className="w-3.5 h-3.5" /> Edit Proposal
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-1 text-xs h-8 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40"
                onClick={onDelete}
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete
              </Button>
            </>
          )}
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 text-xs h-8"
            onClick={() => exportInitiativePdf(item)}
          >
            <Download className="w-3.5 h-3.5" /> Export PDF
          </Button>
        </div>
      </div>

      {/* Main Initiative Sheet */}
      <Card className="rounded-2xl border border-border bg-card p-6 sm:p-8 space-y-6 shadow-sm overflow-hidden relative">
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-500 to-orange-500" />

        {/* Title & Metadata Header */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full border ${statusCfg.bg} ${statusCfg.text} ${statusCfg.border}`}
            >
              <StatusIcon className="w-3.5 h-3.5" />
              {statusCfg.label}
            </span>
            <EvaluationBadge evaluation={item.evaluation} />
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight leading-tight">
            {item.title}
          </h1>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-xl bg-muted/40 border border-border text-xs">
            <div>
              <span className="text-muted-foreground block text-[10px] uppercase font-semibold">
                Author
              </span>
              <span className="font-semibold text-foreground flex items-center gap-1 mt-0.5">
                <User className="w-3.5 h-3.5 text-blue-500" />
                {item.author?.name || "—"}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground block text-[10px] uppercase font-semibold">
                Lead Department
              </span>
              <span className="font-semibold text-foreground flex items-center gap-1 mt-0.5">
                <Building2 className="w-3.5 h-3.5 text-amber-500" />
                {item.department?.name || "—"}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground block text-[10px] uppercase font-semibold">
                Submitted Date
              </span>
              <span className="font-semibold text-foreground flex items-center gap-1 mt-0.5">
                <Clock className="w-3.5 h-3.5 text-emerald-500" />
                {formatDate(item.createdAt)}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground block text-[10px] uppercase font-semibold">
                Required Support
              </span>
              <span className="font-semibold text-foreground flex items-center gap-1 mt-0.5">
                <Users className="w-3.5 h-3.5 text-purple-500" />
                {item.supportNeeded?.map((d) => d.name).join(", ") || "None"}
              </span>
            </div>
          </div>
        </div>

        <Separator />

        {/* Structured Sections */}
        <div className="space-y-4">
          <Section
            label="Problem Statement"
            icon={AlertCircle}
            html={item.problem}
          />
          <Section
            label="Why It Matters (Impact)"
            icon={Target}
            html={item.whyItMatters}
          />
          <Section
            label="Proposed Solution"
            icon={Lightbulb}
            html={item.proposedSolution}
          />
          <Section
            label="Execution Plan & Milestones"
            icon={CheckCircle2}
            html={item.executionPlan}
          />
          <Section
            label="Expected Outcome & Success Metrics"
            icon={Sparkles}
            html={item.expectedOutcome}
          />
        </div>
      </Card>

      {/* Admin Evaluation Panel */}
      {canManage && <InitiativeEvaluationPanel initiative={item} />}

      {/* Community / Stakeholder Feedback & Reactions */}
      <InitiativeInteractions
        initiative={item}
        userId={userId}
        isAdmin={canManage}
      />
    </div>
  );
}

// ─── Department Multi-Select Component ────────────────────────────────────────

function DepartmentMultiSelect({
  departments,
  selected,
  onChange,
}: {
  departments: Department[];
  selected: string[];
  onChange: (ids: string[]) => void;
}) {
  const toggle = (id: string) => {
    onChange(
      selected.includes(id)
        ? selected.filter((s) => s !== id)
        : [...selected, id],
    );
  };

  const selectedDepts = departments.filter((d) => selected.includes(d._id));

  return (
    <div className="space-y-2">
      {selectedDepts.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selectedDepts.map((d) => (
            <Badge
              key={d._id}
              variant="secondary"
              className="gap-1 text-xs pr-1"
            >
              {d.name}
              <button
                type="button"
                onClick={() => toggle(d._id)}
                className="ml-0.5 rounded-full p-0.5 hover:bg-muted-foreground/20 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
      <select
        value=""
        onChange={(e) => {
          if (e.target.value) toggle(e.target.value);
        }}
        className="w-full h-10 rounded-xl border border-input bg-card px-3 text-xs focus:outline-none focus:ring-2 focus:ring-ring"
      >
        <option value="">+ Add supporting department or team…</option>
        {departments
          .filter((d) => !selected.includes(d._id))
          .map((d) => (
            <option key={d._id} value={d._id}>
              {d.name}
            </option>
          ))}
      </select>
    </div>
  );
}

// ─── Create/Edit Initiative Form Component ───────────────────────────────────

function InitiativeForm({
  item,
  departments,
  userDeptId,
  onSave,
  onCancel,
}: {
  item?: Initiative | null;
  departments: Department[];
  userDeptId?: string;
  onSave: (data: CreateInitiativeData) => Promise<void>;
  onCancel: () => void;
}) {
  const isEdit = !!item;
  const [form, setForm] = useState({
    title: item?.title || "",
    problem: item?.problem || "",
    whyItMatters: item?.whyItMatters || "",
    proposedSolution: item?.proposedSolution || "",
    executionPlan: item?.executionPlan || "",
    expectedOutcome: item?.expectedOutcome || "",
    supportNeeded:
      item?.supportNeeded?.map((d) => d._id) || ([] as string[]),
    department:
      item?.department?._id || userDeptId || departments[0]?._id || "",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (status: InitiativeStatus) => {
    if (
      !form.title.trim() ||
      !form.problem.trim() ||
      !form.proposedSolution.trim() ||
      !form.department
    )
      return;
    setIsSaving(true);
    setError(null);
    try {
      await onSave({ ...form, status });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save initiative");
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      <Button
        variant="ghost"
        size="sm"
        className="gap-1.5 text-xs text-muted-foreground hover:text-foreground -ml-2"
        onClick={onCancel}
      >
        <ChevronLeft className="w-4 h-4" /> Cancel & Return
      </Button>

      <Card className="rounded-2xl border border-border bg-card p-6 sm:p-8 space-y-6 shadow-sm overflow-hidden relative">
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-500 to-orange-500" />

        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold">
            <Lightbulb className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground">
              {isEdit ? "Edit Initiative Proposal" : "Submit New Initiative"}
            </h2>
            <p className="text-xs text-muted-foreground">
              Propose operational improvements, technological solutions, or cost savings
            </p>
          </div>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1.5">
              Initiative Title *
            </label>
            <Input
              value={form.title}
              onChange={(e) =>
                setForm((f) => ({ ...f, title: e.target.value }))
              }
              placeholder="e.g. Real-Time Cargo Dispatch Tracking System"
              autoFocus
              className="h-10 text-sm font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1.5">
              Primary Department *
            </label>
            <select
              value={form.department}
              onChange={(e) =>
                setForm((f) => ({ ...f, department: e.target.value }))
              }
              className="w-full h-10 rounded-xl border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">Select department</option>
              {departments.map((d) => (
                <option key={d._id} value={d._id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1.5">
              Problem Statement *
            </label>
            <div className="border border-input rounded-xl overflow-hidden shadow-xs">
              <RichTextEditor
                value={form.problem}
                onChange={(html) =>
                  setForm((f) => ({ ...f, problem: html }))
                }
                placeholder="What operational inefficiency or challenge are we addressing?"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1.5">
              Why It Matters (Business Impact)
            </label>
            <div className="border border-input rounded-xl overflow-hidden shadow-xs">
              <RichTextEditor
                value={form.whyItMatters}
                onChange={(html) =>
                  setForm((f) => ({ ...f, whyItMatters: html }))
                }
                placeholder="Impact on delivery speed, cost reduction, customer satisfaction, or reliability…"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1.5">
              Proposed Solution *
            </label>
            <div className="border border-input rounded-xl overflow-hidden shadow-xs">
              <RichTextEditor
                value={form.proposedSolution}
                onChange={(html) =>
                  setForm((f) => ({ ...f, proposedSolution: html }))
                }
                placeholder="Detailed proposal and recommendations…"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1.5">
              Execution Plan & Steps
            </label>
            <div className="border border-input rounded-xl overflow-hidden shadow-xs">
              <RichTextEditor
                value={form.executionPlan}
                onChange={(html) =>
                  setForm((f) => ({ ...f, executionPlan: html }))
                }
                placeholder="Phase 1, Phase 2, Pilot launch steps…"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1.5">
              Expected Outcome & Key Metrics
            </label>
            <div className="border border-input rounded-xl overflow-hidden shadow-xs">
              <RichTextEditor
                value={form.expectedOutcome}
                onChange={(html) =>
                  setForm((f) => ({ ...f, expectedOutcome: html }))
                }
                placeholder="Expected KPIs, timeline, and deliverables…"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1.5">
              Cross-Functional Team Collaboration
            </label>
            <DepartmentMultiSelect
              departments={departments}
              selected={form.supportNeeded}
              onChange={(ids) =>
                setForm((f) => ({ ...f, supportNeeded: ids }))
              }
            />
          </div>
        </div>

        <div className="pt-4 border-t border-border flex items-center justify-end gap-2.5">
          <Button
            type="button"
            variant="outline"
            disabled={isSaving}
            onClick={() => submit("draft")}
            className="h-10 px-4 text-xs font-medium gap-1.5"
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
            disabled={
              isSaving ||
              !form.title.trim() ||
              !form.problem.trim() ||
              !form.proposedSolution.trim() ||
              !form.department
            }
            onClick={() => submit("submitted")}
            className="h-10 px-5 text-xs font-semibold gap-2 bg-amber-600 hover:bg-amber-700 text-white shadow-sm"
          >
            {isSaving ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Send className="w-3.5 h-3.5" />
            )}
            Submit Initiative
          </Button>
        </div>
      </Card>
    </div>
  );
}

// ─── Main Admin Initiatives Portfolio Page ───────────────────────────────────

export default function AdminInitiativesPage() {
  const { user, hasScopePermission } = useAuth();
  const canManage =
    hasScopePermission("initiatives", "update", "dept") ||
    hasScopePermission("initiatives", "delete", "all");

  const [view, setView] = useState<"list" | "detail" | "form" | "config">(
    "list",
  );
  const [selected, setSelected] = useState<Initiative | null>(null);
  const [editing, setEditing] = useState<Initiative | null>(null);
  const [filterStatus, setFilterStatus] = useState<InitiativeStatus | "">("");
  const [filterDept, setFilterDept] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);

  const filters: InitiativeFilters = { page, limit: 18 };
  if (filterStatus) filters.status = filterStatus;
  if (filterDept) filters.department = filterDept;

  const { initiatives, totalPages, total, isLoading, error } =
    useInitiatives(filters);
  const { departments = [] } = useDepartments({}) as {
    departments: Department[];
  };
  const {
    createInitiative: createMut,
    updateInitiative: updateMut,
    deleteInitiative: deleteMut,
  } = useInitiativeMutations();

  // Search filter client-side
  const filteredInitiatives = useMemo(() => {
    if (!searchQuery.trim()) return initiatives;
    const q = searchQuery.toLowerCase();
    return initiatives.filter(
      (i) =>
        i.title.toLowerCase().includes(q) ||
        i.department?.name?.toLowerCase().includes(q) ||
        i.author?.name?.toLowerCase().includes(q),
    );
  }, [initiatives, searchQuery]);

  const handleSave = async (data: CreateInitiativeData) => {
    if (editing) {
      await updateMut.mutateAsync({ id: editing._id, data });
    } else {
      await createMut.mutateAsync(data);
    }
    setEditing(null);
    setView("list");
  };

  const handleDelete = async () => {
    if (!selected || !confirm("Are you sure you want to delete this initiative proposal?"))
      return;
    await deleteMut.mutateAsync(selected._id);
    setSelected(null);
    setView("list");
  };

  if (view === "detail" && selected) {
    return (
      <InitiativeDetail
        item={selected}
        onBack={() => {
          setSelected(null);
          setView("list");
        }}
        onEdit={() => {
          setEditing(selected);
          setView("form");
        }}
        onDelete={handleDelete}
        canManage={canManage || selected.author?._id === user?.id}
        userId={user?.id}
      />
    );
  }

  if (view === "form") {
    return (
      <InitiativeForm
        item={editing}
        departments={departments}
        onSave={handleSave}
        onCancel={() => {
          setEditing(null);
          setView("list");
        }}
      />
    );
  }

  if (view === "config") {
    return <EvaluationConfigForm onBack={() => setView("list")} />;
  }

  return (
    <div className="space-y-7 pb-16">
      {/* ─── Executive Management Header ──────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shadow-sm">
              <Lightbulb className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground tracking-tight">
                Initiatives Management
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                Review employee proposals, score performance metrics, and configure evaluation rubrics
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {canManage && (
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-xs h-9"
              onClick={() => setView("config")}
            >
              <SlidersHorizontal className="w-4 h-4" /> Scoring Rubrics
            </Button>
          )}
          <Button
            size="sm"
            className="gap-2 bg-amber-600 hover:bg-amber-700 text-white font-medium h-9 shadow-sm"
            onClick={() => {
              setEditing(null);
              setView("form");
            }}
          >
            <Plus className="w-4 h-4" /> New Initiative
          </Button>
        </div>
      </div>

      {/* ─── Search & Department Filtering Bar ────────────────────────────── */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search initiatives by title, team, or author…"
              className="pl-9 pr-8 h-10 rounded-xl bg-card"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="w-full sm:w-56">
            <select
              value={filterDept}
              onChange={(e) => {
                setFilterDept(e.target.value);
                setPage(1);
              }}
              className="w-full h-10 rounded-xl border border-input bg-card px-3 text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">All Departments</option>
              {departments.map((d) => (
                <option key={d._id} value={d._id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Status Segmented Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <button
            onClick={() => {
              setFilterStatus("");
              setPage(1);
            }}
            className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-all ${
              filterStatus === ""
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            All Initiatives ({total || 0})
          </button>
          {Object.entries(STATUS_CONFIG).map(([val, cfg]) => {
            const isSelected = filterStatus === val;
            const Icon = cfg.icon;
            return (
              <button
                key={val}
                onClick={() => {
                  setFilterStatus(val as InitiativeStatus);
                  setPage(1);
                }}
                className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap flex items-center gap-1.5 transition-all ${
                  isSelected
                    ? `${cfg.bg} ${cfg.text} border ${cfg.border} shadow-sm font-semibold`
                    : "bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {cfg.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ─── Initiatives List ─────────────────────────────────────────────── */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="rounded-2xl border border-border bg-card p-5 space-y-3 animate-pulse"
            >
              <div className="h-4 bg-muted rounded w-3/4" />
              <div className="h-3 bg-muted/60 rounded w-1/2" />
              <div className="h-16 bg-muted/30 rounded" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-6 text-center">
          <AlertCircle className="w-6 h-6 text-red-500 mx-auto mb-2" />
          <p className="text-sm font-semibold text-red-600 dark:text-red-400">
            {error}
          </p>
        </div>
      ) : filteredInitiatives.length === 0 ? (
        <Card className="p-16 text-center border-dashed rounded-2xl">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center mx-auto mb-3">
            <Lightbulb className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-foreground">
            No initiatives found
          </h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
            {filterStatus || filterDept || searchQuery
              ? "No initiatives match your filters. Try resetting your search parameters."
              : "No proposals submitted yet in this category."}
          </p>
          {(filterStatus || filterDept || searchQuery) && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setFilterStatus("");
                setFilterDept("");
                setSearchQuery("");
                setPage(1);
              }}
              className="mt-4 text-xs h-8"
            >
              Reset Filters
            </Button>
          )}
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredInitiatives.map((item) => (
            <InitiativeCard
              key={item._id}
              item={item}
              onClick={() => {
                setSelected(item);
                setView("detail");
              }}
            />
          ))}
        </div>
      )}

      {/* ─── Pagination ───────────────────────────────────────────────────── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 pt-4">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="gap-1 text-xs h-8"
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
            className="gap-1 text-xs h-8"
          >
            Next <ChevronRight className="w-3.5 h-3.5" />
          </Button>
        </div>
      )}
    </div>
  );
}
