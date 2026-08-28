"use client";

import { useState } from "react";
import { type Department } from "@/lib/api/departments.api";
import type { Employee } from "@/lib/api/employees.api";
import { useDepartmentMutations, useDepartments, useEmployees } from "@/hooks/queries";
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
  Building2,
  AlertCircle,
  Users,
  Crown,
  CheckCircle2,
  XCircle,
} from "lucide-react";

// —————————————————————————————————————————————————————————————————————————————
// ——— Create/Edit Department Modal ———————————————————————————————————————————

function DepartmentModal({
  department,
  allEmployees,
  onClose,
  onSaved,
}: {
  department?: Department;
  allEmployees: Employee[];
  onClose: () => void;
  onSaved: (d: Department) => void;
}) {
  const isEdit = !!department;
  const { createDepartment, updateDepartment } = useDepartmentMutations();
  const [form, setForm] = useState({
    name: department?.name ?? "",
    description: department?.description ?? "",
    head: department?.head?._id ?? "",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setIsSaving(true);
    setError(null);
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
        head: form.head || null,
      };
      const result = isEdit
        ? await updateDepartment.mutateAsync({ id: department._id, data: payload })
        : await createDepartment.mutateAsync(payload);
      onSaved(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save department");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-base font-semibold">
            {isEdit ? "Edit Department" : "Create Department"}
          </h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">
              Department Name *
            </label>
            <Input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="e.g. Engineering, Sales"
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
              placeholder="Brief description of the department"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">
              Department Head
            </label>
            <select
              value={form.head}
              onChange={(e) => setForm((f) => ({ ...f, head: e.target.value }))}
              className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="">No head assigned</option>
              {allEmployees
                .filter((e) => e.isActive)
                .map((emp) => (
                  <option key={emp._id} value={emp._id}>
                    {emp.name} — {emp.position || emp.role?.name || "User"}
                  </option>
                ))}
            </select>
          </div>

          {error && (
            <p className="text-sm text-red-600 flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5" />
              {error}
            </p>
          )}
          <div className="flex gap-2 pt-1">
            <Button
              type="submit"
              disabled={!form.name.trim() || isSaving}
              className="flex-1 gap-1.5"
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : isEdit ? (
                <Save className="w-4 h-4" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              {isEdit ? "Save Changes" : "Create Department"}
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// —————————————————————————————————————————————————————————————————————————————
// ——— Department Card —————————————————————————————————————————————————————————

function DepartmentCard({
  department,
  allEmployees,
  onRefresh,
}: {
  department: Department;
  allEmployees: Employee[];
  onRefresh: () => void;
}) {
  const { deleteDepartment } = useDepartmentMutations();
  const [showEdit, setShowEdit] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (
      !confirm(
        `Deactivate "${department.name}"? Employees in this department won't be removed.`
      )
    )
      return;
    setIsDeleting(true);
    try {
      await deleteDepartment.mutateAsync(department._id);
      onRefresh();
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <Card
        className={`p-5 transition-all hover:shadow-md ${
          !department.isActive ? "opacity-60" : ""
        }`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0">
              <Building2 className="w-5 h-5 text-indigo-600" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-semibold text-sm text-foreground">
                  {department.name}
                </h3>
                {department.isActive ? (
                  <span className="inline-flex items-center gap-0.5 text-xs text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-full px-1.5 py-0.5">
                    <CheckCircle2 className="w-2.5 h-2.5" /> Active
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-0.5 text-xs text-gray-500 bg-gray-50 border border-gray-200 rounded-full px-1.5 py-0.5">
                    <XCircle className="w-2.5 h-2.5" /> Inactive
                  </span>
                )}
              </div>
              {department.description && (
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                  {department.description}
                </p>
              )}
              <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  {department.employeeCount} employee
                  {department.employeeCount !== 1 ? "s" : ""}
                </span>
                {department.head && (
                  <span className="flex items-center gap-1">
                    <Crown className="w-3 h-3 text-amber-500" />
                    {department.head.name}
                  </span>
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
            {department.isActive && (
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
            )}
          </div>
        </div>
      </Card>

      {showEdit && (
        <DepartmentModal
          department={department}
          allEmployees={allEmployees}
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

export default function AdminDepartmentsPage() {
  const [search, setSearch] = useState("");
  const [showInactive, setShowInactive] = useState(false);
  const [showCreate, setShowCreate] = useState(false);

  // ── Queries ──────────────────────────────────────────────────────────────
  const {
    departments = [],
    isLoading,
    error: deptError,
    invalidate: invalidateDepts,
  } = useDepartments({ search: search || undefined });

  const { employees: allEmployees = [] } = useEmployees({});

  // ——— Derived state ——————————————————————————————————————————————————————————
  const visible = showInactive
    ? departments
    : departments.filter((d) => d.isActive);
  const active = departments.filter((d) => d.isActive).length;
  const error = deptError;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">
            Departments
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage organizational departments and team structure
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary">{active} active</Badge>
          <Button size="sm" onClick={() => setShowCreate(true)} className="gap-1.5">
            <Plus className="w-4 h-4" /> Add Department
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search departments…"
            className="pl-9"
          />
        </div>
        <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer px-2">
          <input
            type="checkbox"
            checked={showInactive}
            onChange={(e) => setShowInactive(e.target.checked)}
            className="rounded"
          />
          Show inactive
        </label>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : visible.length === 0 ? (
        <Card className="p-12 text-center border-dashed">
          <Building2 className="w-8 h-8 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">
            {search
              ? "No departments match your search."
              : "No departments yet. Create your first department."}
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {visible.map((dept) => (
            <DepartmentCard
              key={dept._id}
              department={dept}
              allEmployees={allEmployees}
              onRefresh={invalidateDepts}
            />
          ))}
        </div>
      )}

      {showCreate && (
        <DepartmentModal
          allEmployees={allEmployees}
          onClose={() => setShowCreate(false)}
          onSaved={() => {
            invalidateDepts();
            setShowCreate(false);
          }}
        />
      )}
    </div>
  );
}
