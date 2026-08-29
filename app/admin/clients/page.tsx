"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  type Client,
  type ClientStatus,
  type ClientTier,
} from "@/lib/api/clients.api";
import { useClientMutations, useClients } from "@/hooks/queries";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Search,
  Trash2,
  ChevronRight,
  Loader2,
  Users,
  AlertCircle,
  X,
  Building2,
  Mail,
  Phone,
  Globe,
  UserCheck,
  LayoutGrid,
  List,
  Sparkles,
  ShieldAlert,
  TrendingUp,
  Briefcase,
  ExternalLink,
  CheckCircle2,
  Clock,
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

const STATUS_GRADIENTS: Record<ClientStatus, string> = {
  active: "from-emerald-500 to-teal-600",
  prospect: "from-sky-500 to-blue-600",
  "at-risk": "from-amber-500 to-orange-600",
  paused: "from-slate-400 to-slate-500",
  churned: "from-rose-500 to-red-600",
};

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
    lg: "w-14 h-14 text-base font-bold rounded-2xl",
  }[size];

  return (
    <div
      className={`${sizeClasses} bg-gradient-to-br ${AVATAR_PALETTE[colorIndex]} flex items-center justify-center shrink-0 shadow-sm`}
    >
      {initials || "CO"}
    </div>
  );
}

// ─── Create Client Modal ──────────────────────────────────────────────────────

function CreateClientModal({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (c: Client) => void;
}) {
  const { createClient } = useClientMutations();
  const [form, setForm] = useState({
    name: "",
    company: "",
    industry: "",
    website: "",
    email: "",
    phone: "",
    status: "active" as ClientStatus,
    tier: "" as ClientTier,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setIsSaving(true);
    setError(null);
    try {
      const created = await createClient.mutateAsync(form);
      onCreate(created);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create client");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-card text-card-foreground rounded-2xl border border-border shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-border flex items-center justify-between bg-muted/30">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-semibold">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-foreground">
                Add Client Account
              </h2>
              <p className="text-xs text-muted-foreground">
                Create a corporate profile in the portfolio
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          {error && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">
              Client / Organization Name *
            </label>
            <Input
              value={form.name}
              onChange={(e) =>
                setForm((f) => ({ ...f, name: e.target.value }))
              }
              placeholder="e.g. Ethiopian Airlines Cargo Logistics"
              required
              className="h-10"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                Industry Sector
              </label>
              <Input
                value={form.industry}
                onChange={(e) =>
                  setForm((f) => ({ ...f, industry: e.target.value }))
                }
                placeholder="e.g. Logistics & Freight"
                className="h-10"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                Account Tier
              </label>
              <select
                value={form.tier}
                onChange={(e) =>
                  setForm((f) => ({ ...f, tier: e.target.value as ClientTier }))
                }
                className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">— Standard / Unassigned —</option>
                {Object.entries(TIER_CONFIG).map(([val, cfg]) => (
                  <option key={val} value={val}>
                    {cfg.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                Lifecycle Status
              </label>
              <select
                value={form.status}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    status: e.target.value as ClientStatus,
                  }))
                }
                className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {Object.entries(STATUS_CONFIG).map(([val, cfg]) => (
                  <option key={val} value={val}>
                    {cfg.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                Primary Email
              </label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) =>
                  setForm((f) => ({ ...f, email: e.target.value }))
                }
                placeholder="ops@company.et"
                className="h-10"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                Direct Phone
              </label>
              <Input
                value={form.phone}
                onChange={(e) =>
                  setForm((f) => ({ ...f, phone: e.target.value }))
                }
                placeholder="+251 911 000000"
                className="h-10"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                Company Website
              </label>
              <Input
                type="url"
                value={form.website}
                onChange={(e) =>
                  setForm((f) => ({ ...f, website: e.target.value }))
                }
                placeholder="https://company.et"
                className="h-10"
              />
            </div>
          </div>

          <div className="pt-4 flex items-center justify-end gap-2.5 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="h-10 px-4"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!form.name.trim() || isSaving}
              className="h-10 px-5 gap-2 bg-primary text-primary-foreground font-medium shadow-sm hover:opacity-95"
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              Create Account
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Main Admin Clients Portfolio Page ───────────────────────────────────────

export default function AdminClientsPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ClientStatus | "">("");
  const [tierFilter, setTierFilter] = useState<string>("");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [showCreate, setShowCreate] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [mutationError, setMutationError] = useState<string | null>(null);

  const { deleteClient } = useClientMutations();

  const clientParams = {
    search: search || undefined,
    status: (statusFilter || undefined) as ClientStatus | undefined,
    limit: 100,
  };

  const {
    data,
    isLoading,
    error: queryError,
    invalidate: invalidateClients,
  } = useClients(clientParams);

  const error = mutationError ?? queryError;

  // Filter clients by tier client-side for smooth UX
  const filteredClients = useMemo(() => {
    if (!data?.clients) return [];
    if (!tierFilter) return data.clients;
    return data.clients.filter((c) => c.tier === tierFilter);
  }, [data?.clients, tierFilter]);

  // Executive Stats Calculation
  const stats = useMemo(() => {
    const clients = data?.clients || [];
    const total = data?.total || clients.length;
    const active = clients.filter((c) => c.status === "active").length;
    const enterprise = clients.filter((c) => c.tier === "enterprise").length;
    const atRisk = clients.filter((c) => c.status === "at-risk").length;
    const prospects = clients.filter((c) => c.status === "prospect").length;

    return { total, active, enterprise, atRisk, prospects };
  }, [data]);

  const handleDelete = async (id: string, name: string) => {
    if (
      !confirm(
        `Are you sure you want to delete "${name}" and all associated intelligence data? This action cannot be undone.`,
      )
    )
      return;
    setDeletingId(id);
    setMutationError(null);
    try {
      await deleteClient.mutateAsync(id);
      invalidateClients();
    } catch (err) {
      setMutationError(
        err instanceof Error ? err.message : "Failed to delete client account",
      );
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-7 pb-12">
      {/* ─── Executive Page Header ────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-border pb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shadow-sm">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground tracking-tight">
                Client Portfolio
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                Corporate accounts, enterprise stakeholders & behavioral intelligence
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="flex items-center bg-muted/60 p-1 rounded-xl border border-border">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${
                viewMode === "grid"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              title="Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`p-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${
                viewMode === "table"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              title="Structured Table View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          <Button
            onClick={() => setShowCreate(true)}
            className="gap-2 shadow-sm font-medium h-9"
          >
            <Plus className="w-4 h-4" /> Add Client
          </Button>
        </div>
      </div>

      {/* ─── KPI Metrics Ribbon ───────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-xl border border-border bg-card shadow-sm hover:border-border/80 transition-all">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
            <span className="font-medium">Total Accounts</span>
            <Users className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-bold text-foreground tracking-tight">
            {stats.total}
          </div>
          <div className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1">
            <span className="text-blue-500 font-semibold">{stats.prospects}</span> prospects in pipeline
          </div>
        </div>

        <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 shadow-sm">
          <div className="flex items-center justify-between text-xs text-emerald-600 dark:text-emerald-400 mb-1.5">
            <span className="font-medium">Active Accounts</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-foreground tracking-tight">
            {stats.active}
          </div>
          <div className="text-[11px] text-muted-foreground mt-1">
            Core ongoing relationships
          </div>
        </div>

        <div className="p-4 rounded-xl border border-purple-500/20 bg-purple-500/5 shadow-sm">
          <div className="flex items-center justify-between text-xs text-purple-600 dark:text-purple-400 mb-1.5">
            <span className="font-medium">Enterprise Tier</span>
            <Sparkles className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-2xl font-bold text-foreground tracking-tight">
            {stats.enterprise}
          </div>
          <div className="text-[11px] text-muted-foreground mt-1">
            High-value key clients
          </div>
        </div>

        <div className="p-4 rounded-xl border border-amber-500/20 bg-amber-500/5 shadow-sm">
          <div className="flex items-center justify-between text-xs text-amber-600 dark:text-amber-400 mb-1.5">
            <span className="font-medium">At Risk / Attention</span>
            <ShieldAlert className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-foreground tracking-tight">
            {stats.atRisk}
          </div>
          <div className="text-[11px] text-muted-foreground mt-1">
            Requires relationship follow-up
          </div>
        </div>
      </div>

      {/* ─── Search & Segmented Filtering Bar ─────────────────────────────── */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search clients by name, industry, or contacts…"
              className="pl-9 pr-8 h-10 rounded-xl bg-card"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Tier Dropdown */}
          <div className="w-full sm:w-48">
            <select
              value={tierFilter}
              onChange={(e) => setTierFilter(e.target.value)}
              className="w-full h-10 rounded-xl border border-input bg-card px-3 text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">All Account Tiers</option>
              {Object.entries(TIER_CONFIG).map(([val, cfg]) => (
                <option key={val} value={val}>
                  {cfg.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Status Segmented Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <button
            onClick={() => setStatusFilter("")}
            className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-all ${
              statusFilter === ""
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            All Accounts ({stats.total})
          </button>
          {Object.entries(STATUS_CONFIG).map(([val, cfg]) => {
            const isSelected = statusFilter === val;
            const Icon = cfg.icon;
            return (
              <button
                key={val}
                onClick={() => setStatusFilter(val as ClientStatus)}
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

      {/* ─── Error Alert ─────────────────────────────────────────────────── */}
      {error && (
        <div className="flex items-center gap-2.5 text-sm text-red-600 dark:text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* ─── Client Showcase ─────────────────────────────────────────────── */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="rounded-2xl border border-border bg-card p-5 space-y-4 animate-pulse"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-muted" />
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted/60 rounded w-1/2" />
                </div>
              </div>
              <div className="h-3 bg-muted/40 rounded w-full" />
              <div className="h-px bg-border/40" />
              <div className="flex justify-between items-center">
                <div className="h-4 bg-muted rounded w-16" />
                <div className="h-4 bg-muted rounded w-20" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredClients.length === 0 ? (
        <Card className="p-16 text-center border-dashed rounded-2xl">
          <div className="w-12 h-12 rounded-2xl bg-muted/60 flex items-center justify-center mx-auto mb-3 text-muted-foreground">
            <Building2 className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-foreground">
            No client accounts found
          </h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
            {search || statusFilter || tierFilter
              ? "No accounts match your current filter selection. Try adjusting or clearing your filters."
              : "Start by onboarding your first corporate account to organize intelligence and contacts."}
          </p>
          {(search || statusFilter || tierFilter) && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearch("");
                setStatusFilter("");
                setTierFilter("");
              }}
              className="mt-4 text-xs h-8"
            >
              Reset Filters
            </Button>
          )}
        </Card>
      ) : viewMode === "grid" ? (
        /* ─── Grid View ──────────────────────────────────────────────────── */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredClients.map((client) => {
            const statusCfg =
              STATUS_CONFIG[client.status] ?? STATUS_CONFIG.active;
            const tierCfg = client.tier ? TIER_CONFIG[client.tier] : null;
            const gradient =
              STATUS_GRADIENTS[client.status] ?? STATUS_GRADIENTS.active;
            const StatusIcon = statusCfg.icon;

            return (
              <div
                key={client._id}
                onClick={() => router.push(`/admin/clients/${client._id}`)}
                className="group relative rounded-2xl border border-border bg-card hover:border-primary/40 overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-xl hover:shadow-black/5 hover:-translate-y-0.5 flex flex-col justify-between"
              >
                {/* Top Accent Gradient Ribbon */}
                <div
                  className={`h-1.5 w-full bg-gradient-to-r ${gradient}`}
                />

                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  {/* Company Header */}
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <ClientMonogram name={client.name} size="md" />
                        <div className="min-w-0 flex-1">
                          <h3 className="font-semibold text-foreground text-sm truncate group-hover:text-primary transition-colors">
                            {client.name}
                          </h3>
                          {client.industry ? (
                            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5 truncate">
                              <Building2 className="w-3 h-3 shrink-0" />
                              {client.industry}
                            </p>
                          ) : (
                            <p className="text-xs text-muted-foreground/60 mt-0.5">
                              General Corporate Account
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Quick Delete */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(client._id, client.name);
                        }}
                        disabled={deletingId === client._id}
                        className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-all"
                        title="Delete Client"
                      >
                        {deletingId === client._id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>

                    {/* Status & Tier Badges */}
                    <div className="flex items-center gap-1.5 mt-3.5 flex-wrap">
                      <span
                        className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${statusCfg.bg} ${statusCfg.text} ${statusCfg.border}`}
                      >
                        <StatusIcon className="w-3 h-3" />
                        {statusCfg.label}
                      </span>

                      {tierCfg && (
                        <span
                          className={`inline-flex items-center text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${tierCfg.bg} ${tierCfg.text} ${tierCfg.border}`}
                        >
                          {tierCfg.label}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Contacts & Channels Strip */}
                  <div className="pt-3 border-t border-border/60 space-y-2 text-xs text-muted-foreground">
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center gap-1 font-medium text-foreground">
                        <UserCheck className="w-3.5 h-3.5 text-blue-500" />
                        {client.contactCount ?? 0} stakeholder
                        {(client.contactCount ?? 0) !== 1 ? "s" : ""}
                      </span>

                      <div className="flex items-center gap-2">
                        {client.email && (
                          <a
                            href={`mailto:${client.email}`}
                            onClick={(e) => e.stopPropagation()}
                            className="p-1 rounded hover:text-foreground hover:bg-muted transition-colors"
                            title={client.email}
                          >
                            <Mail className="w-3.5 h-3.5" />
                          </a>
                        )}
                        {client.phone && (
                          <a
                            href={`tel:${client.phone}`}
                            onClick={(e) => e.stopPropagation()}
                            className="p-1 rounded hover:text-foreground hover:bg-muted transition-colors"
                            title={client.phone}
                          >
                            <Phone className="w-3.5 h-3.5" />
                          </a>
                        )}
                        {client.website && (
                          <a
                            href={client.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="p-1 rounded hover:text-primary hover:bg-muted transition-colors"
                            title={client.website}
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                    </div>

                    {/* Tags */}
                    {client.tags && client.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {client.tags.slice(0, 3).map((t) => (
                          <span
                            key={t}
                            className="text-[10px] px-2 py-0.5 rounded-md bg-secondary text-secondary-foreground font-medium"
                          >
                            #{t}
                          </span>
                        ))}
                        {client.tags.length > 3 && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-muted text-muted-foreground font-medium">
                            +{client.tags.length - 3}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer Action Strip */}
                <div className="px-5 py-2.5 bg-muted/30 border-t border-border/50 flex items-center justify-between text-xs font-medium text-muted-foreground group-hover:text-primary transition-colors">
                  <span>View 360° Profile</span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* ─── Structured Table / Portfolio Ledger View ─────────────────────── */
        <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/50 border-b border-border text-muted-foreground font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-5 py-3.5">Company / Account</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5">Tier</th>
                  <th className="px-4 py-3.5">Stakeholders</th>
                  <th className="px-4 py-3.5">Direct Channels</th>
                  <th className="px-4 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filteredClients.map((client) => {
                  const statusCfg =
                    STATUS_CONFIG[client.status] ?? STATUS_CONFIG.active;
                  const tierCfg = client.tier ? TIER_CONFIG[client.tier] : null;
                  const StatusIcon = statusCfg.icon;

                  return (
                    <tr
                      key={client._id}
                      onClick={() =>
                        router.push(`/admin/clients/${client._id}`)
                      }
                      className="hover:bg-muted/40 cursor-pointer transition-colors group"
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <ClientMonogram name={client.name} size="sm" />
                          <div>
                            <p className="font-semibold text-foreground text-sm group-hover:text-primary transition-colors">
                              {client.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {client.industry || "General Industry"}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${statusCfg.bg} ${statusCfg.text} ${statusCfg.border}`}
                        >
                          <StatusIcon className="w-3 h-3" />
                          {statusCfg.label}
                        </span>
                      </td>

                      <td className="px-4 py-3.5">
                        {tierCfg ? (
                          <span
                            className={`inline-flex items-center text-[11px] font-semibold px-2 py-0.5 rounded-full border ${tierCfg.bg} ${tierCfg.text} ${tierCfg.border}`}
                          >
                            {tierCfg.label}
                          </span>
                        ) : (
                          <span className="text-muted-foreground/60">—</span>
                        )}
                      </td>

                      <td className="px-4 py-3.5">
                        <span className="inline-flex items-center gap-1 font-medium text-foreground">
                          <UserCheck className="w-3.5 h-3.5 text-blue-500" />
                          {client.contactCount ?? 0}
                        </span>
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          {client.email && (
                            <a
                              href={`mailto:${client.email}`}
                              onClick={(e) => e.stopPropagation()}
                              className="hover:text-foreground p-1 rounded hover:bg-muted"
                              title={client.email}
                            >
                              <Mail className="w-3.5 h-3.5" />
                            </a>
                          )}
                          {client.phone && (
                            <a
                              href={`tel:${client.phone}`}
                              onClick={(e) => e.stopPropagation()}
                              className="hover:text-foreground p-1 rounded hover:bg-muted"
                              title={client.phone}
                            >
                              <Phone className="w-3.5 h-3.5" />
                            </a>
                          )}
                          {client.website && (
                            <a
                              href={client.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="hover:text-primary p-1 rounded hover:bg-muted"
                              title={client.website}
                            >
                              <Globe className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </div>
                      </td>

                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/admin/clients/${client._id}`);
                            }}
                          >
                            Open Profile <ChevronRight className="w-3 h-3" />
                          </Button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(client._id, client.name);
                            }}
                            disabled={deletingId === client._id}
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 opacity-0 group-hover:opacity-100 transition-all"
                            title="Delete"
                          >
                            {deletingId === client._id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── Create Client Modal ─────────────────────────────────────────── */}
      {showCreate && (
        <CreateClientModal
          onClose={() => setShowCreate(false)}
          onCreate={(c) => {
            invalidateClients();
            setShowCreate(false);
            router.push(`/admin/clients/${c._id}`);
          }}
        />
      )}
    </div>
  );
}
