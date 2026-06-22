"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import {
  type Initiative,
  type InitiativeFilters,
  type InitiativeStatus,
  type CreateInitiativeData,
} from "@/lib/api/initiatives.api";
import type { Department } from "@/lib/api/departments.api";
import { useInitiatives, useInitiativeMutations, useDepartments } from "@/hooks/queries";
import { InitiativeInteractions } from "@/components/InitiativeInteractions";
import { EvaluationBadge } from "@/components/EvaluationBadge";
import { RichTextEditor } from "@/components/RichTextEditor";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { PageHeader } from "@/components/PageShell";
import {
  Lightbulb, Plus, Loader2, AlertCircle, Building2, ChevronLeft, ChevronRight,
  Save, Send, Clock, User, Download, X, Filter, Users,
} from "lucide-react";

const STATUSES: { value: InitiativeStatus | ""; label: string }[] = [
  { value: "", label: "All" },
  { value: "draft", label: "Draft" },
  { value: "submitted", label: "Submitted" },
];

const STATUS_COLORS: Record<InitiativeStatus, string> = {
  draft: "bg-gray-100 text-gray-700 border-gray-200",
  submitted: "bg-emerald-50 text-emerald-700 border-emerald-200",
};

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

// ─── PDF Export ───────────────────────────────────────────────────────────────

function exportInitiativePdf(i: Initiative) {
  const w = window.open("", "_blank");
  if (!w) return;
  const sec = (label: string, html: string) =>
    html ? `<div class="section"><div class="section-label">${label}</div><div class="content">${html}</div></div>` : "";
  const supportNames = i.supportNeeded?.map((d) => d.name).join(", ") || "—";
  const ev = i.evaluation;
  const evalHtml = ev && ev.state === "evaluated" && ev.finalScore !== null
    ? `<div class="section"><div class="section-label">Performance Evaluation</div><div class="content">`
      + `<p><strong>Score: ${ev.finalScore}/100</strong>${ev.tierLabel ? ` · ${ev.tierLabel}` : ""}</p>`
      + `<ul>${ev.criterionScores.map((c) => `<li>${c.label}: ${c.rawScore.toFixed(1)}/5 (weight ${c.weight})</li>`).join("")}</ul>`
      + (ev.note ? `<p><em>${ev.note}</em></p>` : "")
      + `</div></div>`
    : "";
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>${i.title}</title>
<style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#1a1a2e;padding:48px;max-width:800px;margin:0 auto;line-height:1.6}.header{border-bottom:2px solid #e2e8f0;padding-bottom:20px;margin-bottom:24px}.title{font-size:22px;font-weight:700;margin-bottom:8px}.meta{display:flex;flex-wrap:wrap;gap:20px;font-size:12px;color:#64748b;margin-top:12px}.section{margin-top:24px}.section-label{font-size:10px;text-transform:uppercase;letter-spacing:1px;font-weight:700;color:#94a3b8;margin-bottom:8px}.content{font-size:14px}.content p{margin-bottom:8px}.content ul,.content ol{margin-left:20px;margin-bottom:8px}.footer{margin-top:40px;padding-top:16px;border-top:1px solid #e2e8f0;font-size:11px;color:#94a3b8;text-align:center}@media print{body{padding:0}}</style></head><body>
<div class="header"><div class="title">${i.title}</div><div class="meta">
<div>Author: <strong>${i.author?.name || "—"}</strong></div>
<div>Department: <strong>${i.department?.name || "—"}</strong></div>
<div>Status: <strong>${i.status}</strong></div>
<div>Support: <strong>${supportNames}</strong></div>
<div>Created: ${formatDate(i.createdAt)}</div>
</div></div>
${sec("Problem", i.problem)}${sec("Why It Matters", i.whyItMatters)}${sec("Proposed Solution", i.proposedSolution)}${sec("Execution Plan", i.executionPlan)}${sec("Expected Outcome", i.expectedOutcome)}${evalHtml}
<div class="footer">Generated on ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" })}</div>
<script>window.onload=function(){window.print();}</script></body></html>`;
  w.document.write(html);
  w.document.close();
}

// ─── Initiative Card ──────────────────────────────────────────────────────────

function InitiativeCard({ item, onClick }: { item: Initiative; onClick: () => void }) {
  const snippet = item.problem.replace(/<[^>]*>/g, "").slice(0, 120);
  return (
    <Card className="p-5 border cursor-pointer hover:shadow-md hover:border-amber-200 transition-all group" onClick={onClick}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-foreground group-hover:text-amber-700 transition-colors truncate">{item.title}</h3>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <Badge variant="outline" className={`text-[10px] py-0 ${STATUS_COLORS[item.status]}`}>{item.status.replace("_", " ")}</Badge>
            <span className="text-[11px] text-muted-foreground flex items-center gap-1"><Building2 className="w-3 h-3" />{item.department?.name}</span>
          </div>
          <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{snippet || "No content"}</p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-[11px] text-muted-foreground flex items-center gap-1"><User className="w-3 h-3" />{item.author?.name}</p>
          <p className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1 justify-end"><Clock className="w-3 h-3" />{formatDate(item.createdAt)}</p>
        </div>
      </div>
    </Card>
  );
}

// ─── Detail View ──────────────────────────────────────────────────────────────

function InitiativeDetail({ item, onBack, onEdit, isOwner, userId }: {
  item: Initiative; onBack: () => void; onEdit: () => void; isOwner: boolean; userId?: string;
}) {
  const Section = ({ label, html }: { label: string; html: string }) =>
    html ? (<div><h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">{label}</h3><div className="prose prose-sm max-w-none text-foreground" dangerouslySetInnerHTML={{ __html: html }} /></div>) : null;

  const canEdit = isOwner && item.status === "draft";

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" className="gap-1 -ml-2 text-muted-foreground" onClick={onBack}><ChevronLeft className="w-4 h-4" /> Back</Button>
        <div className="flex items-center gap-2">
          {canEdit && (
            <Button variant="outline" size="sm" className="gap-1 text-xs" onClick={onEdit}>Edit Draft</Button>
          )}
          <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => exportInitiativePdf(item)}><Download className="w-3.5 h-3.5" /> Export PDF</Button>
        </div>
      </div>
      <Card className="overflow-hidden">
        <div className="h-0.5 bg-amber-500" />
        <div className="p-6 space-y-5">
          <div>
            <h1 className="text-lg font-bold">{item.title}</h1>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <Badge variant="outline" className={STATUS_COLORS[item.status]}>{item.status.replace("_", " ")}</Badge>
              <EvaluationBadge evaluation={item.evaluation} />
            </div>
          </div>
          <Separator />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="flex items-center gap-1.5 text-muted-foreground"><User className="w-3.5 h-3.5" /><span className="font-medium text-foreground">{item.author?.name}</span></div>
            <div className="flex items-center gap-1.5 text-muted-foreground"><Building2 className="w-3.5 h-3.5" /><span className="font-medium text-foreground">{item.department?.name}</span></div>
            <div className="flex items-center gap-1.5 text-muted-foreground"><Clock className="w-3.5 h-3.5" />Created {formatDate(item.createdAt)}</div>
            {item.supportNeeded?.length > 0 && (
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Users className="w-3.5 h-3.5" />
                <span className="font-medium text-foreground">{item.supportNeeded.map((d) => d.name).join(", ")}</span>
              </div>
            )}
          </div>
          <Separator />
          <Section label="Problem" html={item.problem} />
          <Section label="Why It Matters" html={item.whyItMatters} />
          <Section label="Proposed Solution" html={item.proposedSolution} />
          <Section label="Execution Plan" html={item.executionPlan} />
          <Section label="Expected Outcome" html={item.expectedOutcome} />
        </div>
      </Card>
      <InitiativeInteractions initiative={item} userId={userId} />
    </div>
  );
}

// ─── Multi-Select Department Picker ───────────────────────────────────────────

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
        : [...selected, id]
    );
  };

  const selectedDepts = departments.filter((d) => selected.includes(d._id));

  return (
    <div className="space-y-2">
      {selectedDepts.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selectedDepts.map((d) => (
            <Badge key={d._id} variant="secondary" className="gap-1 text-xs pr-1">
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
        onChange={(e) => { if (e.target.value) toggle(e.target.value); }}
        className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
      >
        <option value="">Add a team...</option>
        {departments
          .filter((d) => !selected.includes(d._id))
          .map((d) => (
            <option key={d._id} value={d._id}>{d.name}</option>
          ))}
      </select>
    </div>
  );
}

// ─── Initiative Form ──────────────────────────────────────────────────────────

function InitiativeForm({ item, departments, userDeptId, onSave, onCancel }: {
  item?: Initiative | null; departments: Department[]; userDeptId?: string;
  onSave: (data: CreateInitiativeData) => Promise<void>; onCancel: () => void;
}) {
  const isEdit = !!item;
  const [form, setForm] = useState({
    title: item?.title || "",
    problem: item?.problem || "",
    whyItMatters: item?.whyItMatters || "",
    proposedSolution: item?.proposedSolution || "",
    executionPlan: item?.executionPlan || "",
    expectedOutcome: item?.expectedOutcome || "",
    supportNeeded: item?.supportNeeded?.map((d) => d._id) || [] as string[],
    department: item?.department?._id || userDeptId || departments[0]?._id || "",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (status: InitiativeStatus) => {
    if (!form.title.trim() || !form.problem.trim() || !form.proposedSolution.trim() || !form.department) return;
    setIsSaving(true);
    setError(null);
    try {
      await onSave({ ...form, status });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      <Button variant="ghost" size="sm" className="gap-1 -ml-2 text-muted-foreground" onClick={onCancel}><ChevronLeft className="w-4 h-4" /> Cancel</Button>
      <Card className="overflow-hidden">
        <div className="h-0.5 bg-amber-500" />
        <div className="px-6 py-4 border-b bg-secondary/30 flex items-center gap-2">
          <Lightbulb className="w-4 h-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold">{isEdit ? "Edit Initiative" : "New Initiative"}</h2>
        </div>
        <div className="p-6 space-y-5">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Title *</label>
            <Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="Initiative title" autoFocus />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Department *</label>
            <select value={form.department} onChange={(e) => setForm((f) => ({ ...f, department: e.target.value }))}
              className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring">
              <option value="">Select department</option>
              {departments.map((d) => <option key={d._id} value={d._id}>{d.name}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Problem *</label>
            <div className="border border-input rounded-lg overflow-hidden">
              <RichTextEditor value={form.problem} onChange={(html) => setForm((f) => ({ ...f, problem: html }))} placeholder="What's happening..." />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Why It Matters</label>
            <div className="border border-input rounded-lg overflow-hidden">
              <RichTextEditor value={form.whyItMatters} onChange={(html) => setForm((f) => ({ ...f, whyItMatters: html }))} placeholder="Impact on business..." />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Proposed Solution *</label>
            <div className="border border-input rounded-lg overflow-hidden">
              <RichTextEditor value={form.proposedSolution} onChange={(html) => setForm((f) => ({ ...f, proposedSolution: html }))} placeholder="Your idea..." />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Execution Plan</label>
            <div className="border border-input rounded-lg overflow-hidden">
              <RichTextEditor value={form.executionPlan} onChange={(html) => setForm((f) => ({ ...f, executionPlan: html }))} placeholder="Step 1, Step 2..." />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Expected Outcome</label>
            <div className="border border-input rounded-lg overflow-hidden">
              <RichTextEditor value={form.expectedOutcome} onChange={(html) => setForm((f) => ({ ...f, expectedOutcome: html }))} placeholder="Metrics / result..." />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Support Needed (Teams)</label>
            <DepartmentMultiSelect
              departments={departments}
              selected={form.supportNeeded}
              onChange={(ids) => setForm((f) => ({ ...f, supportNeeded: ids }))}
            />
          </div>
          {error && <div className="flex items-center gap-1.5 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2"><AlertCircle className="w-3.5 h-3.5 shrink-0" /> {error}</div>}
          <div className="flex items-center gap-2 pt-1">
            <Button size="sm" variant="outline" className="gap-1.5" disabled={isSaving} onClick={() => submit("draft")}>
              {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />} Save as Draft
            </Button>
            <Button size="sm" className="gap-1.5" disabled={isSaving || !form.title.trim() || !form.problem.trim() || !form.proposedSolution.trim()} onClick={() => submit("submitted")}>
              {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />} Submit
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function EmployeeInitiativesPage() {
  const { user } = useAuth();
  const [view, setView] = useState<"list" | "detail" | "form">("list");
  const [selected, setSelected] = useState<Initiative | null>(null);
  const [editing, setEditing] = useState<Initiative | null>(null);
  const [filterStatus, setFilterStatus] = useState<InitiativeStatus | "">("");
  const [page, setPage] = useState(1);

  const filters: InitiativeFilters = { page, limit: 15 };
  if (filterStatus) filters.status = filterStatus;

  const { initiatives, totalPages, total, isLoading, error } = useInitiatives(filters);
  const { departments = [] } = useDepartments({}) as { departments: Department[] };
  const { createInitiative: createMut, updateInitiative: updateMut } = useInitiativeMutations();

  const handleSave = async (data: CreateInitiativeData) => {
    if (editing) {
      await updateMut.mutateAsync({ id: editing._id, data });
    } else {
      await createMut.mutateAsync(data);
    }
    setEditing(null);
    setView("list");
  };

  if (view === "detail" && selected) {
    const isOwner = selected.author?._id === user?.id;
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <InitiativeDetail
          item={selected}
          onBack={() => { setSelected(null); setView("list"); }}
          onEdit={() => { setEditing(selected); setView("form"); }}
          isOwner={isOwner}
          userId={user?.id}
        />
      </div>
    );
  }

  if (view === "form") {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <InitiativeForm
          item={editing}
          departments={departments}
          onSave={handleSave}
          onCancel={() => { setEditing(null); setView("list"); }}
        />
      </div>
    );
  }

  const hasFilters = !!filterStatus;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <PageHeader
        icon={<Lightbulb className="w-5 h-5 text-amber-600" />}
        iconStyle={{ background: "#fef3c7" }}
        title="Initiatives"
        subtitle="Share your ideas to improve the company"
        action={
          <Button size="sm" className="gap-1.5" onClick={() => { setEditing(null); setView("form"); }}>
            <Plus className="w-4 h-4" /> New Initiative
          </Button>
        }
      />

      <Card className="overflow-hidden">
        <div className="h-0.5 bg-amber-500" />
        <div className="px-4 py-3 flex items-center gap-3 flex-wrap">
          <Filter className="w-3.5 h-3.5 text-muted-foreground" />
          <select value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value as InitiativeStatus | ""); setPage(1); }}
            className="h-8 rounded-md border border-input bg-background px-2.5 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-ring">
            {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
          {hasFilters && <Button variant="ghost" size="sm" className="h-8 text-xs gap-1" onClick={() => { setFilterStatus(""); setPage(1); }}><X className="w-3 h-3" /> Clear</Button>}
        </div>
      </Card>

      {isLoading && <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-amber-600" /></div>}
      {error && <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center"><AlertCircle className="w-6 h-6 text-red-500 mx-auto mb-2" /><p className="text-sm text-red-700">{error}</p></div>}
      {!isLoading && !error && initiatives.length === 0 && (
        <Card className="p-12 text-center">
          <Lightbulb className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground">{hasFilters ? "No initiatives match your filter." : "No initiatives yet. Be the first to submit one!"}</p>
        </Card>
      )}
      {!isLoading && initiatives.length > 0 && (
        <div className="space-y-3">
          {initiatives.map(i => <InitiativeCard key={i._id} item={i} onClick={() => { setSelected(i); setView("detail"); }} />)}
        </div>
      )}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="gap-1">
            <ChevronLeft className="w-3.5 h-3.5" /> Previous
          </Button>
          <span className="text-xs text-muted-foreground">Page {page} of {totalPages}</span>
          <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="gap-1">
            Next <ChevronRight className="w-3.5 h-3.5" />
          </Button>
        </div>
      )}
    </div>
  );
}
