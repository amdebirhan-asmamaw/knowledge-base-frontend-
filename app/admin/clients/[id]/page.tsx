"use client";

import { useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  type Client,
  type Observation,
  type ObservationType,
  type SentimentType,
  type ClientStatus,
} from "@/lib/api/clients.api";
import { useClientDetail, useClientMutations } from "@/hooks/queries";
import { useAdminAI } from "@/lib/admin-ai-context";
import { ContactsPanel } from "@/components/ContactsPanel";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
      className={`${sizeClasses} bg-gradient-to-br ${AVATAR_PALETTE[colorIndex]} flex items-center justify-center shrink-0 shadow-sm`}
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
      onAdded(obs);
      setContent("");
      setTags("");
      setContactId("");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to record observation",
      );
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
        {/* Attribution & Type Selection */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">
              Associated Stakeholder
            </label>
            <select
              value={contactId}
              onChange={(e) => setContactId(e.target.value)}
              className="w-full h-9 rounded-xl border border-input bg-card px-3 text-xs focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">🏢 General Account / Whole Organization</option>
              {contacts.map((c) => (
                <option key={c._id} value={c._id}>
                  👤 {c.name} ({c.role || "Contact"}){c.isPrimary ? " ★" : ""}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">
              Observation Category
            </label>
            <div className="flex flex-wrap gap-1">
              {(Object.keys(TYPE_CONFIG) as ObservationType[]).map((t) => {
                const cfg = TYPE_CONFIG[t];
                const isSelected = type === t;
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setType(t)}
                    className={`inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-lg border font-medium transition-all ${
                      isSelected
                        ? `${cfg.bg} ${cfg.text} ${cfg.border} ring-1 ring-current/40 shadow-xs font-semibold`
                        : "bg-card text-muted-foreground border-border hover:text-foreground"
                    }`}
                  >
                    {cfg.icon}
                    {cfg.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Content Note */}
        <div>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Record actionable client intelligence, meeting takeaways, operational preference, or negotiation notes…"
            rows={3}
            className="w-full px-3.5 py-2.5 rounded-xl border border-input bg-card text-sm resize-y focus:outline-none focus:ring-2 focus:ring-ring shadow-xs placeholder:text-muted-foreground/60"
          />
        </div>

        {/* Sentiment, Tags, Privacy */}
        <div className="flex items-center justify-between gap-3 flex-wrap pt-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-muted-foreground font-medium">
              Sentiment:
            </span>
            <div className="flex items-center gap-1">
              {SENTIMENTS.map((s) => (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => setSentiment(s.value)}
                  className={`text-[11px] px-2.5 py-0.5 rounded-full border transition-all ${
                    sentiment === s.value
                      ? `${s.color} font-semibold shadow-xs`
                      : "bg-card text-muted-foreground border-border hover:text-foreground"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 flex-1 min-w-[200px]">
            <span className="text-xs text-muted-foreground font-medium shrink-0">
              Tags:
            </span>
            <Input
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="delivery, billing, priority"
              className="h-8 text-xs rounded-lg"
            />
          </div>

          <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer select-none">
            <input
              type="checkbox"
              checked={isPrivate}
              onChange={(e) => setIsPrivate(e.target.checked)}
              className="rounded text-primary focus:ring-primary"
            />
            <Lock className="w-3.5 h-3.5 text-muted-foreground" />
            <span>Admin-only private</span>
          </label>
        </div>

        {error && (
          <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5" />
            {error}
          </p>
        )}

        <div className="pt-2 flex justify-end">
          <Button
            type="submit"
            size="sm"
            disabled={!content.trim() || isSaving}
            className="gap-1.5 h-9 px-4 font-medium"
          >
            {isSaving ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Save className="w-3.5 h-3.5" />
            )}
            Save Intelligence Note
          </Button>
        </div>
      </form>
    </Card>
  );
}

// ─── Observation Card Component ───────────────────────────────────────────────

function ObservationCard({
  obs,
  clientId,
  contacts,
  onRefresh,
}: {
  obs: Observation;
  clientId: string;
  contacts: import("@/lib/api/clients.api").Contact[];
  onRefresh: () => void;
}) {
  const { updateObservation, deleteObservation } = useClientMutations(clientId);
  const [isEditing, setIsEditing] = useState(false);
  const [content, setContent] = useState(obs.content);
  const [isBusy, setIsBusy] = useState(false);

  const contactName = obs.contactId
    ? contacts.find((c) => c._id === obs.contactId)?.name ?? "a stakeholder"
    : null;

  const cfg = TYPE_CONFIG[obs.type] ?? TYPE_CONFIG.general;

  const handleUpdate = async () => {
    setIsBusy(true);
    try {
      await updateObservation.mutateAsync({
        observationId: obs._id,
        data: { content },
      });
      onRefresh();
      setIsEditing(false);
    } finally {
      setIsBusy(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this observation?")) return;
    setIsBusy(true);
    try {
      await deleteObservation.mutateAsync(obs._id);
      onRefresh();
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <div className="group bg-card rounded-2xl border border-border p-4.5 shadow-sm hover:border-primary/30 transition-all">
      <div className="flex items-start gap-3">
        <ClientMonogram name={obs.authorName || "Admin"} size="sm" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-2">
            <span
              className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${cfg.bg} ${cfg.text} ${cfg.border}`}
            >
              {cfg.icon} {cfg.label}
            </span>

            <span
              className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${
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
              {obs.authorName} · {new Date(obs.createdAt).toLocaleDateString()}
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
            <p className="text-sm text-foreground leading-relaxed">
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
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => setIsEditing(true)}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-muted transition-colors"
              title="Edit Note"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleDelete}
              disabled={isBusy}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
              title="Delete Note"
            >
              {isBusy ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Trash2 className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        )}
      </div>
    </div>
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
  const { open: openAI } = useAdminAI();
  const [filterType, setFilterType] = useState<ObservationType | "all">("all");
  const [contactFilter, setContactFilter] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"observations" | "contacts">(
    "observations",
  );

  const {
    client,
    typeCounts,
    contacts,
    healthScore,
    observations,
    isLoading,
    error: detailError,
    invalidate: invalidateDetail,
  } = useClientDetail(id);

  const filtered = (() => {
    let result =
      filterType === "all"
        ? observations
        : observations.filter((o) => o.type === filterType);
    if (contactFilter === "") result = result.filter((o) => !o.contactId);
    else if (contactFilter !== null)
      result = result.filter((o) => o.contactId === contactFilter);
    return result;
  })();

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
      <Link
        href="/admin/clients"
        className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors group"
      >
        <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
        Back to Client Portfolio
      </Link>

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
                  {client.size ? ` · ${client.size} personnel` : ""}
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

          {/* Quick AI Action Button */}
          <div className="flex items-center gap-2">
            <Button
              onClick={() =>
                openAI(
                  `Summarize the relationship, key stakeholders, and observations for ${client.name}.`,
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
                  Calculated from stakeholder sentiment & recent activity
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
                  className={`p-3 rounded-xl border text-center transition-all ${
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
          className={`px-4 py-2.5 font-semibold text-xs transition-all border-b-2 -mb-px flex items-center gap-1.5 ${
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
          className={`px-4 py-2.5 font-semibold text-xs transition-all border-b-2 -mb-px flex items-center gap-1.5 ${
            activeTab === "contacts"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <UserCheck className="w-3.5 h-3.5" />
          Stakeholders & Contacts ({contacts.length})
        </button>
      </div>

      {/* ─── Contacts Panel Tab ───────────────────────────────────────────── */}
      {activeTab === "contacts" && (
        <ContactsPanel clientId={id} initialContacts={contacts} />
      )}

      {/* ─── Observations Feed Tab ────────────────────────────────────────── */}
      {activeTab === "observations" && (
        <div className="space-y-4">
          <AddObservationForm
            clientId={id}
            contacts={contacts}
            onAdded={() => invalidateDetail()}
          />

          {/* Filtering Chips */}
          <div className="flex items-center justify-between gap-3 flex-wrap pt-2">
            <div className="flex items-center gap-1.5 flex-wrap text-xs">
              <span className="text-muted-foreground font-medium">
                Filter stakeholder:
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

            {filterType !== "all" && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setFilterType("all")}
                className="h-7 text-xs text-primary"
              >
                Clear Category Filter ({filterType})
              </Button>
            )}
          </div>

          {/* Observations List */}
          {filtered.length === 0 ? (
            <Card className="p-12 text-center border-dashed rounded-2xl">
              <Activity className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
              <p className="text-sm font-semibold text-foreground">
                No intelligence observations logged yet
              </p>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                Use the form above to record strategic observations, meeting notes, or stakeholder behavior.
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
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
