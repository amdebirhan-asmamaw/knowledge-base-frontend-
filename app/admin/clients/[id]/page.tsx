"use client";

import { useState, use, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import {
  type Client,
  type Observation,
  type ObservationType,
  type SentimentType,
  type ClientStatus,
  type ClientTier,
  type AssignedEmployee,
  type ObservationContact,
  type ObservationAuthor,
} from "@/lib/api/clients.api";
import {
  useClientDetail,
  useClientMutations,
  useEmployees,
} from "@/hooks/queries";
import { useAuth } from "@/hooks/use-auth";
import { useAdminAI } from "@/lib/admin-ai-context";
import { ContactsPanel } from "@/components/ContactsPanel";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  ThumbsUp,
  ThumbsDown,
  Star,
  Activity,
  MessageSquare,
  FileText,
  ArrowLeft,
  Plus,
  Edit2,
  Trash2,
  Save,
  X,
  Lock,
  Loader2,
  AlertCircle,
  Sparkles,
  Globe,
  Heart,
  Building2,
  Mail,
  Phone,
  UserCheck,
  CheckCircle2,
  TrendingUp,
  ShieldAlert,
  Clock,
  ExternalLink,
  Users,
  UserPlus,
  History,
  Check,
  Search,
  Filter,
} from "lucide-react";

// ─── Status & Tier Configurations ────────────────────────────────────────────

const STATUS_CONFIG: Record<
  ClientStatus,
  { label: string; bg: string; text: string; border: string; icon: React.ElementType }
> = {
  active: {
    label: "Active",
    bg: "bg-emerald-500/10",
    text: "text-emerald-600 dark:text-emerald-400",
    border: "border-emerald-500/20",
    icon: CheckCircle2,
  },
  prospect: {
    label: "Prospect",
    bg: "bg-sky-500/10",
    text: "text-sky-600 dark:text-sky-400",
    border: "border-sky-500/20",
    icon: TrendingUp,
  },
  "at-risk": {
    label: "At Risk",
    bg: "bg-amber-500/10",
    text: "text-amber-600 dark:text-amber-400",
    border: "border-amber-500/20",
    icon: ShieldAlert,
  },
  paused: {
    label: "Paused",
    bg: "bg-slate-500/10",
    text: "text-slate-600 dark:text-slate-400",
    border: "border-slate-500/20",
    icon: Clock,
  },
  churned: {
    label: "Churned",
    bg: "bg-rose-500/10",
    text: "text-rose-600 dark:text-rose-400",
    border: "border-rose-500/20",
    icon: AlertCircle,
  },
};

const TIER_CONFIG: Record<
  string,
  { label: string; bg: string; text: string; border: string }
> = {
  enterprise: {
    label: "Enterprise",
    bg: "bg-purple-500/10",
    text: "text-purple-600 dark:text-purple-400",
    border: "border-purple-500/20",
  },
  "mid-market": {
    label: "Mid-Market",
    bg: "bg-blue-500/10",
    text: "text-blue-600 dark:text-blue-400",
    border: "border-blue-500/20",
  },
  smb: {
    label: "SMB",
    bg: "bg-teal-500/10",
    text: "text-teal-600 dark:text-teal-400",
    border: "border-teal-500/20",
  },
  startup: {
    label: "Startup",
    bg: "bg-orange-500/10",
    text: "text-orange-600 dark:text-orange-400",
    border: "border-orange-500/20",
  },
};

const TYPE_CONFIG: Record<
  ObservationType,
  { label: string; bg: string; text: string; border: string; icon: React.ReactNode }
> = {
  like: {
    label: "Like",
    bg: "bg-emerald-500/10",
    text: "text-emerald-600 dark:text-emerald-400",
    border: "border-emerald-500/20",
    icon: <ThumbsUp className="w-3.5 h-3.5" />,
  },
  dislike: {
    label: "Dislike",
    bg: "bg-red-500/10",
    text: "text-red-600 dark:text-red-400",
    border: "border-red-500/20",
    icon: <ThumbsDown className="w-3.5 h-3.5" />,
  },
  preference: {
    label: "Preference",
    bg: "bg-blue-500/10",
    text: "text-blue-600 dark:text-blue-400",
    border: "border-blue-500/20",
    icon: <Star className="w-3.5 h-3.5" />,
  },
  behavior: {
    label: "Behavior",
    bg: "bg-purple-500/10",
    text: "text-purple-600 dark:text-purple-400",
    border: "border-purple-500/20",
    icon: <Activity className="w-3.5 h-3.5" />,
  },
  communication: {
    label: "Communication",
    bg: "bg-amber-500/10",
    text: "text-amber-600 dark:text-amber-400",
    border: "border-amber-500/20",
    icon: <MessageSquare className="w-3.5 h-3.5" />,
  },
  general: {
    label: "General",
    bg: "bg-slate-500/10",
    text: "text-slate-600 dark:text-slate-400",
    border: "border-slate-500/20",
    icon: <FileText className="w-3.5 h-3.5" />,
  },
};

const SENTIMENTS: { value: SentimentType; label: string; color: string }[] = [
  {
    value: "positive",
    label: "Positive",
    color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30",
  },
  {
    value: "neutral",
    label: "Neutral",
    color: "bg-slate-500/10 text-slate-600 border-slate-500/30",
  },
  {
    value: "negative",
    label: "Negative",
    color: "bg-red-500/10 text-red-600 border-red-500/30",
  },
];

const AVATAR_PALETTE = [
  "from-blue-600 to-indigo-700 text-white",
  "from-emerald-600 to-teal-700 text-white",
  "from-purple-600 to-pink-700 text-white",
  "from-amber-500 to-orange-600 text-white",
  "from-cyan-600 to-blue-700 text-white",
  "from-rose-500 to-rose-700 text-white",
];

function ClientMonogram({
  name,
  size = "md",
}: {
  name: string;
  size?: "sm" | "md" | "lg";
}) {
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");

  const colorIndex =
    name.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0) %
    AVATAR_PALETTE.length;

  const sizeClasses = {
    sm: "w-8 h-8 text-xs font-bold rounded-lg",
    md: "w-11 h-11 text-sm font-bold rounded-xl",
    lg: "w-16 h-16 text-lg font-bold rounded-2xl",
  }[size];

  return (
    <div
      className={`${sizeClasses} bg-gradient-to-br ${AVATAR_PALETTE[colorIndex]} flex items-center justify-center shrink-0 shadow-sm font-semibold select-none`}
    >
      {initials || "CO"}
    </div>
  );
}

// ─── Add Observation Form Component ──────────────────────────────────────────

function AddObservationForm({
  clientId,
  contacts,
  onAdded,
}: {
  clientId: string;
  contacts: import("@/lib/api/clients.api").Contact[];
  onAdded: (o: Observation) => void;
}) {
  const { createObservation } = useClientMutations(clientId);
  const [type, setType] = useState<ObservationType>("general");
  const [content, setContent] = useState("");
  const [sentiment, setSentiment] = useState<SentimentType>("neutral");
  const [isPrivate, setIsPrivate] = useState(false);
  const [tags, setTags] = useState("");
  const [contactId, setContactId] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    setIsSaving(true);
    setError(null);
    try {
      const obs = await createObservation.mutateAsync({
        data: {
          type,
          content: content.trim(),
          sentiment,
          isPrivate,
          contactId: contactId || null,
          tags: tags
            ? tags
                .split(",")
                .map((t) => t.trim())
                .filter(Boolean)
            : [],
        },
      });
      toast.success("Intelligence observation recorded");
      onAdded(obs);
      setContent("");
      setTags("");
      setContactId("");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to record observation";
      setError(msg);
      toast.error(msg);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className="p-5 border border-primary/20 bg-primary/5 rounded-2xl shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
            <Plus className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-semibold text-foreground">
            Log Intelligence / Observation
          </h3>
        </div>
        <span className="text-[11px] text-muted-foreground">
          Saves directly to client knowledge graph
        </span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3.5">
        {error && (
          <div className="text-xs text-red-600 dark:text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg p-2.5 flex items-center gap-2">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Observation Type Selector Pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {(Object.keys(TYPE_CONFIG) as ObservationType[]).map((t) => {
            const cfg = TYPE_CONFIG[t];
            const isSelected = type === t;
            return (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                className={`px-3 py-1 rounded-lg text-xs font-medium flex items-center gap-1.5 border transition-all ${
                  isSelected
                    ? `${cfg.bg} ${cfg.text} ${cfg.border} shadow-xs font-semibold ring-1 ring-current/30`
                    : "bg-background border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                {cfg.icon}
                {cfg.label}
              </button>
            );
          })}
        </div>

        {/* Note Content Textarea */}
        <textarea
          required
          rows={3}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="E.g., Prefers direct WhatsApp updates over email threads; flagged concerns regarding Q3 shipment timelines..."
          className="w-full px-3.5 py-2.5 rounded-xl border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground resize-y focus:outline-none focus:ring-2 focus:ring-ring"
        />

        {/* Target Stakeholder & Sentiment Selector */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
              Associate with Stakeholder
            </label>
            <select
              value={contactId}
              onChange={(e) => setContactId(e.target.value)}
              className="w-full h-9 rounded-lg border border-input bg-background px-3 text-xs focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">🏢 Company Level (No specific person)</option>
              {contacts.map((c) => (
                <option key={c._id} value={c._id}>
                  👤 {c.name} {c.role ? `(${c.role.toUpperCase()})` : ""}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
              Stakeholder Sentiment
            </label>
            <div className="flex gap-1.5">
              {SENTIMENTS.map((s) => (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => setSentiment(s.value)}
                  className={`flex-1 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                    sentiment === s.value
                      ? `${s.color} font-semibold shadow-xs`
                      : "bg-background border-border text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Tags & Private Flag */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
          <div className="flex-1">
            <Input
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="Tags (e.g. logistics, communication, priority)"
              className="h-9 text-xs"
            />
          </div>

          <label className="flex items-center gap-2 text-xs font-medium text-muted-foreground cursor-pointer select-none">
            <input
              type="checkbox"
              checked={isPrivate}
              onChange={(e) => setIsPrivate(e.target.checked)}
              className="rounded border-input text-primary focus:ring-primary"
            />
            <Lock className="w-3.5 h-3.5" />
            Private note (Management only)
          </label>
        </div>

        <div className="flex justify-end pt-1">
          <Button
            type="submit"
            disabled={!content.trim() || isSaving}
            className="gap-2 h-9 text-xs font-medium bg-primary text-primary-foreground shadow-sm hover:opacity-95"
          >
            {isSaving ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Plus className="w-3.5 h-3.5" />
            )}
            Log Intelligence
          </Button>
        </div>
      </form>
    </Card>
  );
}

// ─── Observation Card Component ──────────────────────────────────────────────

function ObservationCard({
  obs,
  clientId,
  contacts,
  onRefresh,
  canUpdate,
  canDelete,
}: {
  obs: Observation;
  clientId: string;
  contacts: import("@/lib/api/clients.api").Contact[];
  onRefresh: () => void;
  canUpdate: boolean;
  canDelete: boolean;
}) {
  const { updateObservation, deleteObservation } = useClientMutations(clientId);
  const [isEditing, setIsEditing] = useState(false);
  const [content, setContent] = useState(obs.content);
  const [isBusy, setIsBusy] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const typeCfg = TYPE_CONFIG[obs.type] ?? TYPE_CONFIG.general;

  // Resolve contact details
  const contactName = useMemo(() => {
    if (!obs.contactId) return null;
    if (typeof obs.contactId === "object" && obs.contactId !== null) {
      return obs.contactId.name;
    }
    const found = contacts.find((c) => c._id === obs.contactId);
    return found ? found.name : "Stakeholder";
  }, [obs.contactId, contacts]);

  const authorName = useMemo(() => {
    if (obs.authorName) return obs.authorName;
    if (typeof obs.authorId === "object" && obs.authorId !== null) {
      return obs.authorId.name;
    }
    return "Team Member";
  }, [obs]);

  const handleUpdate = async () => {
    if (!content.trim()) return;
    setIsBusy(true);
    try {
      await updateObservation.mutateAsync({
        observationId: obs._id,
        data: { content: content.trim() },
      });
      toast.success("Observation updated");
      setIsEditing(false);
      onRefresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update observation");
    } finally {
      setIsBusy(false);
    }
  };

  const handleDelete = async () => {
    setIsBusy(true);
    try {
      await deleteObservation.mutateAsync(obs._id);
      toast.success("Observation deleted");
      setShowDeleteConfirm(false);
      onRefresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete observation");
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <>
      <div className="p-4 rounded-xl border border-border bg-card shadow-xs hover:border-border/80 transition-all group">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-2 flex-1 min-w-0">
            {/* Meta Header */}
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md border ${typeCfg.bg} ${typeCfg.text} ${typeCfg.border}`}
              >
                {typeCfg.icon}
                {typeCfg.label}
              </span>

              <span
                className={`text-[11px] font-semibold px-2 py-0.5 rounded-full capitalize ${
                  obs.sentiment === "positive"
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                    : obs.sentiment === "negative"
                    ? "bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20"
                    : "bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20"
                }`}
              >
                {obs.sentiment}
              </span>

              {contactName ? (
                <span className="text-[11px] bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 rounded-full px-2 py-0.5 font-medium">
                  👤 {contactName}
                </span>
              ) : (
                <span className="text-[11px] bg-muted text-muted-foreground border border-border rounded-full px-2 py-0.5 font-medium">
                  🏢 Company Level
                </span>
              )}

              {obs.isPrivate && (
                <span className="text-[11px] text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-full px-2 py-0.5 flex items-center gap-1 font-medium">
                  <Lock className="w-3 h-3" /> Private
                </span>
              )}

              <span className="text-[11px] text-muted-foreground ml-auto">
                {authorName} · {new Date(obs.createdAt).toLocaleDateString()}
              </span>
            </div>

            {isEditing ? (
              <div className="space-y-2.5 pt-1">
                <textarea
                  autoFocus
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 rounded-xl border border-input bg-background text-sm resize-y focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={handleUpdate}
                    disabled={isBusy}
                    className="gap-1 h-8 text-xs"
                  >
                    {isBusy ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Save className="w-3 h-3" />
                    )}
                    Save
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setIsEditing(false);
                      setContent(obs.content);
                    }}
                    className="h-8 text-xs"
                  >
                    <X className="w-3 h-3 mr-1" /> Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                {obs.content}
              </p>
            )}

            {obs.tags && obs.tags.length > 0 && !isEditing && (
              <div className="flex flex-wrap gap-1 mt-2.5">
                {obs.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-[10px] px-2 py-0.5 rounded-md bg-secondary text-secondary-foreground font-medium"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {!isEditing && (
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
              {canUpdate && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-muted transition-colors"
                  title="Edit Note"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              )}
              {canDelete && (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  disabled={isBusy}
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                  title="Delete Note"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Delete Observation Dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Observation</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove this intelligence record? This note will be removed from the account portfolio timeline.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setShowDeleteConfirm(false)}
              disabled={isBusy}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isBusy}
              className="gap-2"
            >
              {isBusy ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
              Confirm Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ─── Assign Employees Dialog ──────────────────────────────────────────────────

function AssignEmployeesDialog({
  clientId,
  assigned,
  isOpen,
  onClose,
  onSaved,
}: {
  clientId: string;
  assigned: AssignedEmployee[];
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { assignEmployees } = useClientMutations();
  const { employees, isLoading } = useEmployees({ isActive: true });
  const [selectedIds, setSelectedIds] = useState<string[]>(
    assigned.map((a) => a._id)
  );
  const [search, setSearch] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const toggleEmployee = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const filteredEmployees = useMemo(() => {
    if (!employees) return [];
    if (!search.trim()) return employees;
    const q = search.toLowerCase();
    return employees.filter(
      (e) =>
        e.name.toLowerCase().includes(q) ||
        e.email.toLowerCase().includes(q) ||
        (e.position && e.position.toLowerCase().includes(q))
    );
  }, [employees, search]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await assignEmployees.mutateAsync({ id: clientId, employeeIds: selectedIds });
      toast.success("Assigned account team updated successfully");
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to assign team members");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md max-h-[85vh] flex flex-col">
        <DialogHeader>
          <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-1">
            <Users className="w-5 h-5" />
          </div>
          <DialogTitle>Assign Account Managers & Team</DialogTitle>
          <DialogDescription>
            Select internal staff and relationship managers assigned to this client.
          </DialogDescription>
        </DialogHeader>

        <div className="relative my-2">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search employees by name or position..."
            className="pl-9 h-9 text-xs"
          />
        </div>

        <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-[220px] max-h-[320px]">
          {isLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : filteredEmployees.length === 0 ? (
            <p className="text-center text-xs text-muted-foreground py-8">
              No matching employees found.
            </p>
          ) : (
            filteredEmployees.map((emp) => {
              const isChecked = selectedIds.includes(emp._id);
              return (
                <div
                  key={emp._id}
                  onClick={() => toggleEmployee(emp._id)}
                  className={`flex items-center justify-between p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                    isChecked
                      ? "bg-primary/10 border-primary text-foreground"
                      : "bg-card border-border hover:bg-muted/50 text-muted-foreground"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                        isChecked ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
                      }`}
                    >
                      {emp.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-foreground truncate">{emp.name}</p>
                      <p className="text-[11px] text-muted-foreground truncate">
                        {emp.position || "Team Member"} {emp.department?.name ? `· ${emp.department.name}` : ""}
                      </p>
                    </div>
                  </div>
                  <div
                    className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
                      isChecked
                        ? "bg-primary border-primary text-primary-foreground"
                        : "border-input bg-background"
                    }`}
                  >
                    {isChecked && <Check className="w-3.5 h-3.5" />}
                  </div>
                </div>
              );
            })
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0 pt-3 border-t border-border">
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving} className="gap-2">
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Assignment ({selectedIds.length})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Edit Client Profile Dialog ───────────────────────────────────────────────

function EditProfileDialog({
  client,
  isOpen,
  onClose,
  onUpdated,
}: {
  client: Client;
  isOpen: boolean;
  onClose: () => void;
  onUpdated: () => void;
}) {
  const { updateClient } = useClientMutations();
  const [form, setForm] = useState({
    name: client.name || "",
    company: client.company || "",
    industry: client.industry || "",
    website: client.website || "",
    email: client.email || "",
    phone: client.phone || "",
    status: client.status || ("active" as ClientStatus),
    tier: client.tier || ("" as ClientTier),
    summary: client.summary || "",
    tags: client.tags ? client.tags.join(", ") : "",
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setIsSaving(true);
    try {
      await updateClient.mutateAsync({
        id: client._id,
        data: {
          name: form.name.trim(),
          company: form.company.trim(),
          industry: form.industry.trim(),
          website: form.website.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          status: form.status,
          tier: form.tier,
          summary: form.summary.trim(),
          tags: form.tags
            ? form.tags.split(",").map((t) => t.trim()).filter(Boolean)
            : [],
        },
      });
      toast.success("Client profile updated successfully");
      onUpdated();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Edit Corporate Profile</DialogTitle>
          <DialogDescription>
            Update key client information, communication channels, and account status.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3.5 overflow-y-auto pr-1 py-1">
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">
              Account / Organization Name *
            </label>
            <Input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              required
              className="h-9"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                Industry Sector
              </label>
              <Input
                value={form.industry}
                onChange={(e) => setForm((f) => ({ ...f, industry: e.target.value }))}
                className="h-9"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                Account Tier
              </label>
              <select
                value={form.tier}
                onChange={(e) => setForm((f) => ({ ...f, tier: e.target.value as ClientTier }))}
                className="w-full h-9 rounded-lg border border-input bg-background px-3 text-xs focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">— Standard —</option>
                {Object.entries(TIER_CONFIG).map(([val, cfg]) => (
                  <option key={val} value={val}>
                    {cfg.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                Lifecycle Status
              </label>
              <select
                value={form.status}
                onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as ClientStatus }))}
                className="w-full h-9 rounded-lg border border-input bg-background px-3 text-xs focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {Object.entries(STATUS_CONFIG).map(([val, cfg]) => (
                  <option key={val} value={val}>
                    {cfg.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                Primary Email
              </label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                className="h-9"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                Direct Phone
              </label>
              <Input
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                className="h-9"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                Website URL
              </label>
              <Input
                type="url"
                value={form.website}
                onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))}
                className="h-9"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">
              Account Summary / Goals
            </label>
            <textarea
              rows={2}
              value={form.summary}
              onChange={(e) => setForm((f) => ({ ...f, summary: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg border border-input bg-background text-xs resize-none focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">
              Tags (comma separated)
            </label>
            <Input
              value={form.tags}
              onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))}
              className="h-9"
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-3 border-t border-border">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving || !form.name.trim()} className="gap-2">
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Profile
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Client 360 Profile Page Component ──────────────────────────────────

export default function ClientProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { user, hasPermission, isAdmin } = useAuth();
  const { open: openAI } = useAdminAI();

  const [filterType, setFilterType] = useState<ObservationType | "all">("all");
  const [sentimentFilter, setSentimentFilter] = useState<SentimentType | "all">("all");
  const [contactFilter, setContactFilter] = useState<string | null>(null);
  const [searchNotes, setSearchNotes] = useState("");
  const [activeTab, setActiveTab] = useState<"observations" | "contacts" | "team">(
    "observations"
  );

  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [showDeleteClientConfirm, setShowDeleteClientConfirm] = useState(false);
  const [isDeletingClient, setIsDeletingClient] = useState(false);
  const [isRecordingTouch, setIsRecordingTouch] = useState(false);

  const {
    client,
    assignedEmployees,
    typeCounts,
    contacts,
    healthScore,
    observations,
    isLoading,
    error: detailError,
    invalidate: invalidateDetail,
  } = useClientDetail(id);

  const { deleteClient, touchClient } = useClientMutations(id);

  // Permission Checks
  const canUpdate = isAdmin || hasPermission("clients:update:all") || hasPermission("clients:update:own");
  const canDelete = isAdmin || hasPermission("clients:delete:all") || hasPermission("clients:delete:own");
  const canAssignTeam = isAdmin || hasPermission("employees:clients:assign") || canUpdate;
  const canAddObservation = isAdmin || hasPermission("observations:create");

  // Filtering observations
  const filtered = useMemo(() => {
    let result = observations;
    if (filterType !== "all") {
      result = result.filter((o) => o.type === filterType);
    }
    if (sentimentFilter !== "all") {
      result = result.filter((o) => o.sentiment === sentimentFilter);
    }
    if (contactFilter === "") {
      result = result.filter((o) => !o.contactId);
    } else if (contactFilter !== null) {
      result = result.filter((o) => {
        if (!o.contactId) return false;
        if (typeof o.contactId === "object") return o.contactId._id === contactFilter;
        return o.contactId === contactFilter;
      });
    }
    if (searchNotes.trim()) {
      const q = searchNotes.toLowerCase();
      result = result.filter(
        (o) =>
          o.content.toLowerCase().includes(q) ||
          (o.tags && o.tags.some((t) => t.toLowerCase().includes(q)))
      );
    }
    return result;
  }, [observations, filterType, sentimentFilter, contactFilter, searchNotes]);

  const handleRecordTouch = async () => {
    setIsRecordingTouch(true);
    try {
      await touchClient.mutateAsync(id);
      toast.success("Touchpoint recorded: last contacted timestamp updated to now");
      invalidateDetail();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to record touchpoint");
    } finally {
      setIsRecordingTouch(false);
    }
  };

  const handleDeleteClient = async () => {
    if (!client) return;
    setIsDeletingClient(true);
    try {
      await deleteClient.mutateAsync(id);
      toast.success(`Account "${client.name}" successfully deleted`);
      router.push("/admin/clients");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete account");
      setIsDeletingClient(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-5 animate-pulse pb-12">
        <div className="h-5 w-32 bg-muted rounded" />
        <div className="h-44 bg-muted rounded-2xl" />
        <div className="h-64 bg-muted rounded-2xl" />
      </div>
    );
  }

  if (detailError || !client) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <AlertCircle className="w-10 h-10 text-red-500 mb-3" />
        <h2 className="text-base font-semibold text-foreground">
          Client Account Unavailable
        </h2>
        <p className="text-xs text-muted-foreground mt-1 max-w-sm">
          {detailError || "This corporate account does not exist or has been removed."}
        </p>
        <Button
          variant="outline"
          size="sm"
          className="mt-4 text-xs"
          onClick={() => router.push("/admin/clients")}
        >
          <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Back to Client Portfolio
        </Button>
      </div>
    );
  }

  const statusCfg = STATUS_CONFIG[client.status] ?? STATUS_CONFIG.active;
  const tierCfg = client.tier ? TIER_CONFIG[client.tier] : null;
  const StatusIcon = statusCfg.icon;

  return (
    <div className="space-y-6 pb-12">
      {/* ─── Breadcrumb Navigation ────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <Link
          href="/admin/clients"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors group"
        >
          <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
          Back to Client Portfolio
        </Link>

        {canDelete && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowDeleteClientConfirm(true)}
            className="text-xs text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 gap-1.5 h-8"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Delete Account
          </Button>
        )}
      </div>

      {/* ─── Client Hero 360 Header ───────────────────────────────────────── */}
      <Card className="p-6 sm:p-7 rounded-2xl border border-border bg-card shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-5">
          <div className="flex items-start gap-4">
            <ClientMonogram name={client.name} size="lg" />
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">
                  {client.name}
                </h1>
                <span
                  className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full border ${statusCfg.bg} ${statusCfg.text} ${statusCfg.border}`}
                >
                  <StatusIcon className="w-3.5 h-3.5" />
                  {statusCfg.label}
                </span>
                {tierCfg && (
                  <span
                    className={`inline-flex items-center text-xs font-semibold px-2.5 py-0.5 rounded-full border ${tierCfg.bg} ${tierCfg.text} ${tierCfg.border}`}
                  >
                    {tierCfg.label} Tier
                  </span>
                )}
              </div>

              {client.industry && (
                <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-1">
                  <Building2 className="w-3.5 h-3.5" />
                  {client.industry}
                  {client.company && client.company !== client.name ? ` · (${client.company})` : ""}
                </p>
              )}

              {/* Direct Channels */}
              <div className="flex flex-wrap items-center gap-3 mt-3 text-xs text-muted-foreground">
                {client.email && (
                  <a
                    href={`mailto:${client.email}`}
                    className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
                  >
                    <Mail className="w-3.5 h-3.5 text-blue-500" />
                    {client.email}
                  </a>
                )}
                {client.phone && (
                  <a
                    href={`tel:${client.phone}`}
                    className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
                  >
                    <Phone className="w-3.5 h-3.5 text-emerald-500" />
                    {client.phone}
                  </a>
                )}
                {client.website && (
                  <a
                    href={client.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 hover:text-primary transition-colors"
                  >
                    <Globe className="w-3.5 h-3.5 text-indigo-500" />
                    {client.website.replace(/^https?:\/\//, "")}
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Quick Actions (Touchpoint, Edit, AI) */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRecordTouch}
              disabled={isRecordingTouch}
              className="gap-1.5 text-xs h-9"
              title="Record that you or your team contacted this client today"
            >
              {isRecordingTouch ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <History className="w-3.5 h-3.5 text-primary" />
              )}
              Log Touchpoint
            </Button>

            {canUpdate && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowEditProfile(true)}
                className="gap-1.5 text-xs h-9"
              >
                <Edit2 className="w-3.5 h-3.5" />
                Edit Profile
              </Button>
            )}

            <Button
              onClick={() =>
                openAI(
                  `Summarize the relationship, key stakeholders, sentiment, and recent observations for ${client.name}.`
                )
              }
              className="gap-2 text-xs h-9 bg-primary text-primary-foreground font-medium shadow-sm"
            >
              <Sparkles className="w-3.5 h-3.5" /> Ask AI Intelligence
            </Button>
          </div>
        </div>

        {client.summary && (
          <p className="text-xs text-muted-foreground leading-relaxed pt-2 border-t border-border/60">
            {client.summary}
          </p>
        )}

        {/* ─── Health Score & Categorized Stats Ribbon ──────────────────────── */}
        <div className="pt-5 border-t border-border/80 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-muted/40 p-4 rounded-xl border border-border">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-500 flex items-center justify-center">
                <Heart className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-semibold text-foreground">
                  Relationship Health Index
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {client.lastContactedAt
                    ? `Last touchpoint: ${new Date(client.lastContactedAt).toLocaleDateString()}`
                    : "No logged touchpoints yet"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 sm:w-64">
              <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden border border-border/40">
                <div
                  className={`h-full rounded-full transition-all ${
                    healthScore >= 70
                      ? "bg-emerald-500"
                      : healthScore >= 40
                      ? "bg-amber-400"
                      : "bg-rose-500"
                  }`}
                  style={{ width: `${healthScore}%` }}
                />
              </div>
              <span className="text-sm font-bold text-foreground">
                {healthScore}/100
              </span>
            </div>
          </div>

          {/* Type Distribution Mini-Dashboard */}
          <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
            {(Object.keys(TYPE_CONFIG) as ObservationType[]).map((t) => {
              const c = TYPE_CONFIG[t];
              const count = typeCounts[t] ?? 0;
              const isFiltered = filterType === t;

              return (
                <button
                  key={t}
                  onClick={() => {
                    setFilterType(isFiltered ? "all" : t);
                    setActiveTab("observations");
                  }}
                  className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                    isFiltered
                      ? `${c.bg} ${c.text} ${c.border} ring-2 ring-current/40 shadow-xs font-semibold`
                      : "bg-card border-border hover:border-primary/40 text-muted-foreground"
                  }`}
                >
                  <div className="text-lg font-bold text-foreground">
                    {count}
                  </div>
                  <div className="text-[10px] font-medium uppercase tracking-wider mt-0.5">
                    {c.label}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </Card>

      {/* ─── Profile Segmented Tabs ───────────────────────────────────────── */}
      <div className="flex gap-2 border-b border-border text-sm">
        <button
          onClick={() => setActiveTab("observations")}
          className={`px-4 py-2.5 font-semibold text-xs transition-all border-b-2 -mb-px flex items-center gap-1.5 cursor-pointer ${
            activeTab === "observations"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          Intelligence & Observations ({observations.length})
        </button>

        <button
          onClick={() => setActiveTab("contacts")}
          className={`px-4 py-2.5 font-semibold text-xs transition-all border-b-2 -mb-px flex items-center gap-1.5 cursor-pointer ${
            activeTab === "contacts"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <UserCheck className="w-3.5 h-3.5" />
          Stakeholders & Contacts ({contacts.length})
        </button>

        <button
          onClick={() => setActiveTab("team")}
          className={`px-4 py-2.5 font-semibold text-xs transition-all border-b-2 -mb-px flex items-center gap-1.5 cursor-pointer ${
            activeTab === "team"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          Assigned Account Team ({assignedEmployees.length})
        </button>
      </div>

      {/* ─── Contacts Panel Tab ───────────────────────────────────────────── */}
      {activeTab === "contacts" && (
        <ContactsPanel clientId={id} initialContacts={contacts} />
      )}

      {/* ─── Assigned Team Tab ────────────────────────────────────────────── */}
      {activeTab === "team" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-foreground">
                Assigned Account Team
              </h3>
              <p className="text-xs text-muted-foreground">
                Staff members responsible for client relationship management & delivery
              </p>
            </div>
            {canAssignTeam && (
              <Button
                size="sm"
                onClick={() => setShowAssignDialog(true)}
                className="gap-1.5 text-xs h-8"
              >
                <UserPlus className="w-3.5 h-3.5" />
                Manage Team
              </Button>
            )}
          </div>

          {assignedEmployees.length === 0 ? (
            <Card className="p-12 text-center border-dashed rounded-2xl">
              <Users className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
              <p className="text-sm font-semibold text-foreground">
                No staff members currently assigned
              </p>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                Assign account managers to keep stakeholders informed of key updates and delivery items.
              </p>
              {canAssignTeam && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowAssignDialog(true)}
                  className="mt-4 text-xs h-8"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" /> Assign Team Members
                </Button>
              )}
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {assignedEmployees.map((emp) => (
                <div
                  key={emp._id}
                  className="p-4 rounded-xl border border-border bg-card flex items-center gap-3 shadow-xs"
                >
                  <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary font-bold flex items-center justify-center shrink-0">
                    {emp.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-foreground truncate">
                      {emp.name}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {emp.position || "Account Lead"}
                      {typeof emp.department === "object" && emp.department?.name
                        ? ` · ${emp.department.name}`
                        : ""}
                    </p>
                    {emp.email && (
                      <a
                        href={`mailto:${emp.email}`}
                        className="text-[11px] text-primary hover:underline flex items-center gap-1 mt-0.5 truncate"
                      >
                        <Mail className="w-3 h-3 shrink-0" />
                        {emp.email}
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─── Observations Feed Tab ────────────────────────────────────────── */}
      {activeTab === "observations" && (
        <div className="space-y-4">
          {canAddObservation && (
            <AddObservationForm
              clientId={id}
              contacts={contacts}
              onAdded={() => invalidateDetail()}
            />
          )}

          {/* Filtering Ribbon */}
          <div className="space-y-2.5 pt-2">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
              {/* Note search input */}
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={searchNotes}
                  onChange={(e) => setSearchNotes(e.target.value)}
                  placeholder="Filter notes by keyword or #tag..."
                  className="pl-8 h-8 text-xs bg-card"
                />
                {searchNotes && (
                  <button
                    onClick={() => setSearchNotes("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>

              {/* Sentiment tabs */}
              <div className="flex items-center gap-1 bg-muted/60 p-0.5 rounded-lg border border-border text-xs">
                <button
                  onClick={() => setSentimentFilter("all")}
                  className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                    sentimentFilter === "all"
                      ? "bg-card text-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  All Sentiments
                </button>
                <button
                  onClick={() => setSentimentFilter("positive")}
                  className={`px-2 py-1 rounded-md font-medium transition-all ${
                    sentimentFilter === "positive"
                      ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-semibold"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Positive 😊
                </button>
                <button
                  onClick={() => setSentimentFilter("neutral")}
                  className={`px-2 py-1 rounded-md font-medium transition-all ${
                    sentimentFilter === "neutral"
                      ? "bg-slate-500/15 text-slate-700 dark:text-slate-300 font-semibold"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Neutral 😐
                </button>
                <button
                  onClick={() => setSentimentFilter("negative")}
                  className={`px-2 py-1 rounded-md font-medium transition-all ${
                    sentimentFilter === "negative"
                      ? "bg-rose-500/15 text-rose-600 dark:text-rose-400 font-semibold"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Negative ⚠️
                </button>
              </div>
            </div>

            {/* Stakeholder Filtering Chips */}
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-1.5 flex-wrap text-xs">
                <span className="text-muted-foreground font-medium">
                  Stakeholder:
                </span>
                <button
                  onClick={() => setContactFilter(null)}
                  className={`px-2.5 py-1 rounded-lg border font-medium transition-all ${
                    contactFilter === null
                      ? "bg-primary text-primary-foreground border-primary shadow-xs"
                      : "bg-card text-muted-foreground border-border hover:text-foreground"
                  }`}
                >
                  All ({observations.length})
                </button>
                <button
                  onClick={() => setContactFilter("")}
                  className={`px-2.5 py-1 rounded-lg border font-medium transition-all ${
                    contactFilter === ""
                      ? "bg-primary text-primary-foreground border-primary shadow-xs"
                      : "bg-card text-muted-foreground border-border hover:text-foreground"
                  }`}
                >
                  🏢 Company General
                </button>
                {contacts.map((c) => (
                  <button
                    key={c._id}
                    onClick={() =>
                      setContactFilter(contactFilter === c._id ? null : c._id)
                    }
                    className={`px-2.5 py-1 rounded-lg border font-medium transition-all ${
                      contactFilter === c._id
                        ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                        : "bg-card text-muted-foreground border-border hover:text-foreground"
                    }`}
                  >
                    👤 {c.name}
                  </button>
                ))}
              </div>

              {(filterType !== "all" || sentimentFilter !== "all" || contactFilter !== null || searchNotes) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setFilterType("all");
                    setSentimentFilter("all");
                    setContactFilter(null);
                    setSearchNotes("");
                  }}
                  className="h-7 text-xs text-primary"
                >
                  Reset Note Filters
                </Button>
              )}
            </div>
          </div>

          {/* Observations List */}
          {filtered.length === 0 ? (
            <Card className="p-12 text-center border-dashed rounded-2xl">
              <Activity className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
              <p className="text-sm font-semibold text-foreground">
                No matching intelligence observations
              </p>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                {searchNotes || filterType !== "all" || sentimentFilter !== "all"
                  ? "Try clearing your note filters to view all entries."
                  : "Use the form above to record strategic observations, meeting notes, or stakeholder behavior."}
              </p>
            </Card>
          ) : (
            <div className="space-y-3">
              {filtered.map((obs) => (
                <ObservationCard
                  key={obs._id}
                  obs={obs}
                  clientId={id}
                  contacts={contacts}
                  onRefresh={invalidateDetail}
                  canUpdate={canUpdate}
                  canDelete={canUpdate || isAdmin}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─── Edit Profile Modal ───────────────────────────────────────────── */}
      {showEditProfile && (
        <EditProfileDialog
          client={client}
          isOpen={showEditProfile}
          onClose={() => setShowEditProfile(false)}
          onUpdated={invalidateDetail}
        />
      )}

      {/* ─── Assign Employees Dialog ──────────────────────────────────────── */}
      {showAssignDialog && (
        <AssignEmployeesDialog
          clientId={id}
          assigned={assignedEmployees}
          isOpen={showAssignDialog}
          onClose={() => setShowAssignDialog(false)}
          onSaved={invalidateDetail}
        />
      )}

      {/* ─── Delete Client Confirmation Dialog ────────────────────────────── */}
      <Dialog
        open={showDeleteClientConfirm}
        onOpenChange={setShowDeleteClientConfirm}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="w-10 h-10 rounded-xl bg-red-500/10 text-red-600 dark:text-red-400 flex items-center justify-center mb-2">
              <Trash2 className="w-5 h-5" />
            </div>
            <DialogTitle>Delete Client Account</DialogTitle>
            <DialogDescription>
              Are you sure you want to permanently delete <strong className="text-foreground">{client.name}</strong>? This action removes all contacts, observations, and assigned relationships.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setShowDeleteClientConfirm(false)}
              disabled={isDeletingClient}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteClient}
              disabled={isDeletingClient}
              className="gap-2"
            >
              {isDeletingClient ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
              Confirm Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
