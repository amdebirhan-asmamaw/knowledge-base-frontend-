"use client";

import { useState } from "react";
import { type Role } from "@/lib/api/roles.api";
import { useRoleMutations, useRoles } from "@/hooks/queries";
import { PERMISSIONS, PERMISSION_LABELS, type Permission } from "@/lib/permissions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Save,
  X,
  Loader2,
  ShieldCheck,
  AlertCircle,
} from "lucide-react";

// —————————————————————————————————————————————————————————————————————————————
// ——— Create/Edit Role Modal ———————————————————————————————————————————

function RoleModal({
  role,
  onClose,
  onSaved,
}: {
  role?: Role;
  onClose: () => void;
  onSaved: (r: Role) => void;
}) {
  const isEdit = !!role;
  const { createRole, updateRole } = useRoleMutations();
  const [form, setForm] = useState({
    name: role?.name ?? "",
    description: role?.description ?? "",
    permissions: role?.permissions ?? ([] as Permission[]),
  });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const togglePermission = (perm: Permission) => {
    setForm((f) => ({
      ...f,
      permissions: f.permissions.includes(perm)
        ? f.permissions.filter((p) => p !== perm)
        : [...f.permissions, perm],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setIsSaving(true);
    setError(null);
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
        permissions: form.permissions,
      };
      const result = isEdit
        ? await updateRole({ id: role._id, data: payload })
        : await createRole(payload);
      onSaved(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save role");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 overflow-y-auto pt-20 pb-20">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border sticky top-0 bg-white rounded-t-2xl z-10">
          <h2 className="text-base font-semibold">
            {isEdit ? "Edit Role" : "Create Role"}
          </h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                Role Name *
              </label>
              <Input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Content Editor"
                autoFocus
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                Description
              </label>
              <Input
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Brief description of the role"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-semibold text-foreground">
                Permissions Matrix
              </label>
              <span className="text-xs text-muted-foreground">
                {form.permissions.length} of {PERMISSIONS.length} selected
              </span>
            </div>

            {/* Grouped Permissions */}
            <div className="space-y-4 max-h-[420px] overflow-y-auto pr-1">
              {Array.from(new Set(Object.values(PERMISSION_LABELS).map((l) => l.group))).map((group) => {
                const groupPerms = PERMISSIONS.filter((p) => PERMISSION_LABELS[p]?.group === group);
                const allSelected = groupPerms.every((p) => form.permissions.includes(p));
                const toggleGroup = () => {
                  if (allSelected) {
                    setForm((f) => ({
                      ...f,
                      permissions: f.permissions.filter((p) => !groupPerms.includes(p)),
                    }));
                  } else {
                    setForm((f) => ({
                      ...f,
                      permissions: Array.from(new Set([...f.permissions, ...groupPerms])),
                    }));
                  }
                };

                return (
                  <div key={group} className="border border-border/80 rounded-xl p-3.5 bg-muted/20">
                    <div className="flex items-center justify-between pb-2 mb-2 border-b border-border/50">
                      <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        {group}
                      </span>
                      <button
                        type="button"
                        onClick={toggleGroup}
                        className="text-[11px] font-medium text-violet-600 hover:text-violet-800"
                      >
                        {allSelected ? "Deselect Group" : "Select Group"}
                      </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {groupPerms.map((perm) => {
                        const meta = PERMISSION_LABELS[perm];
                        const isChecked = form.permissions.includes(perm);
                        return (
                          <label
                            key={perm}
                            className={`flex items-start gap-2.5 p-2.5 rounded-lg border text-left transition-colors cursor-pointer ${
                              isChecked
                                ? "border-violet-500 bg-violet-50/70"
                                : "border-border/60 bg-white hover:bg-muted/40"
                            }`}
                          >
                            <input
                              type="checkbox"
                              className="mt-0.5 rounded text-violet-600 focus:ring-violet-500"
                              checked={isChecked}
                              onChange={() => togglePermission(perm)}
                            />
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className={`text-xs font-semibold ${isChecked ? "text-violet-950" : "text-foreground"}`}>
                                  {meta.label}
                                </span>
                                {meta.tier && (
                                  <Badge
                                    variant="outline"
                                    className={`text-[9px] px-1 py-0 uppercase font-bold tracking-wider ${
                                      meta.tier === "own"
                                        ? "bg-blue-50 text-blue-700 border-blue-200"
                                        : meta.tier === "dept"
                                        ? "bg-purple-50 text-purple-700 border-purple-200"
                                        : "bg-emerald-50 text-emerald-700 border-emerald-200"
                                    }`}
                                  >
                                    {meta.tier}
                                  </Badge>
                                )}
                              </div>
                              <p className={`text-[11px] mt-0.5 line-clamp-1 ${isChecked ? "text-violet-800" : "text-muted-foreground"}`}>
                                {meta.description}
                              </p>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-600 flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5" />
              {error}
            </p>
          )}
          <div className="flex justify-end gap-2 pt-4 border-t border-border">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!form.name.trim() || isSaving}
              className="gap-1.5 min-w-[120px]"
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : isEdit ? (
                <Save className="w-4 h-4" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              {isEdit ? "Save Changes" : "Create Role"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// —————————————————————————————————————————————————————————————————————————————
// ——— Role Card —————————————————————————————————————————————————————————

function RoleCard({
  role,
  onRefresh,
}: {
  role: Role;
  onRefresh: () => void;
}) {
  const { deleteRole } = useRoleMutations();
  const [showEdit, setShowEdit] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (
      !confirm(
        `Delete role "${role.name}"? You cannot delete a role if it is assigned to existing users.`
      )
    )
      return;
    setIsDeleting(true);
    try {
      await deleteRole(role._id);
      onRefresh();
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <Card className="p-5 transition-all hover:shadow-md">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <div className="w-10 h-10 rounded-lg bg-violet-50 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5 text-violet-600" />
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold text-sm text-foreground">
                {role.name}
              </h3>
              {role.description && (
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                  {role.description}
                </p>
              )}
              <div className="flex flex-wrap gap-1.5 mt-3">
                {role.permissions.slice(0, 3).map((perm) => (
                  <Badge key={perm} variant="secondary" className="text-[10px] py-0 font-medium">
                    {PERMISSION_LABELS[perm]?.label || perm}
                  </Badge>
                ))}
                {role.permissions.length > 3 && (
                  <Badge variant="outline" className="text-[10px] py-0 text-muted-foreground">
                    +{role.permissions.length - 3} more
                  </Badge>
                )}
                {role.permissions.length === 0 && (
                  <span className="text-xs text-muted-foreground italic">No permissions</span>
                )}
              </div>
            </div>
          </div>
          <div className="flex gap-1 shrink-0">
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs gap-1"
              onClick={() => setShowEdit(true)}
            >
              <Edit2 className="w-3 h-3" /> Edit
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDelete}
              disabled={isDeleting}
              className="h-7 text-xs text-muted-foreground hover:text-red-600 hover:bg-red-50"
            >
              {isDeleting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Trash2 className="w-3.5 h-3.5" />
              )}
            </Button>
          </div>
        </div>
      </Card>

      {showEdit && (
        <RoleModal
          role={role}
          onClose={() => setShowEdit(false)}
          onSaved={() => {
            onRefresh();
            setShowEdit(false);
          }}
        />
      )}
    </>
  );
}

// —————————————————————————————————————————————————————————————————————————————
// ——— Main Page ———————————————————————————————————————————————————————————————

export default function AdminRolesPage() {
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);

  // ── Queries ──────────────────────────────────────────────────────────────
  const {
    roles = [],
    isLoading,
    error: rolesError,
    invalidate: invalidateRoles,
  } = useRoles();

  // ——— Derived state ——————————————————————————————————————————————————————————
  const visible = search
    ? roles.filter((r) => r.name.toLowerCase().includes(search.toLowerCase()) || r.description.toLowerCase().includes(search.toLowerCase()))
    : roles;
    
  const error = rolesError;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">
            Roles & Permissions
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage roles and their access levels
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={() => setShowCreate(true)} className="gap-1.5">
            <Plus className="w-4 h-4" /> Add Role
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search roles…"
            className="pl-9"
          />
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : visible.length === 0 ? (
        <Card className="p-12 text-center border-dashed">
          <ShieldCheck className="w-8 h-8 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">
            {search
              ? "No roles match your search."
              : "No roles yet. Create your first role."}
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {visible.map((role) => (
            <RoleCard
              key={role._id}
              role={role}
              onRefresh={invalidateRoles}
            />
          ))}
        </div>
      )}

      {showCreate && (
        <RoleModal
          onClose={() => setShowCreate(false)}
          onSaved={() => {
            invalidateRoles();
            setShowCreate(false);
          }}
        />
      )}
    </div>
  );
}
