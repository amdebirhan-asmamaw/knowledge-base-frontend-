"use client";

import { useState } from "react";
import {
  type Department,
  type DepartmentDetail,
  type DepartmentMember,
} from "@/lib/api/departments.api";
import type { Employee } from "@/lib/api/employees.api";
import {
  useDepartmentMutations,
  useDepartments,
  useDepartmentDetail,
  useEmployees,
} from "@/hooks/queries";
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
  ArrowRightLeft,
  UserPlus,
  UserMinus,
  Mail,
  RotateCcw,
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
  onSaved: () => void;
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
      if (isEdit) {
        await updateDepartment.mutateAsync({ id: department._id, data: payload });
      } else {
        await createDepartment.mutateAsync(payload);
      }
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save department");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-slate-50/50">
          <h2 className="text-base font-semibold text-foreground">
            {isEdit ? "Edit Department" : "Create Department"}
          </h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground p-1 rounded-md transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
              Department Name *
            </label>
            <Input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="e.g. Logistics & Fleet Operations"
              autoFocus
              className="h-10"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
              Description
            </label>
            <Input
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Brief summary of responsibilities & function"
              className="h-10"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
              Department Head
            </label>
            <select
              value={form.head}
              onChange={(e) => setForm((f) => ({ ...f, head: e.target.value }))}
              className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            >
              <option value="">No head assigned</option>
              {allEmployees
                .filter((e) => e.isActive)
                .map((emp) => (
                  <option key={emp._id} value={emp._id}>
                    {emp.name} — {emp.position || emp.role?.name || "Member"}
                  </option>
                ))}
            </select>
            <p className="text-[11px] text-muted-foreground mt-1">
              Assigning a head automatically aligns their department affiliation.
            </p>
          </div>

          {error && (
            <div className="p-3 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <Button
              type="submit"
              disabled={!form.name.trim() || isSaving}
              className="flex-1 gap-1.5 h-10"
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
            <Button type="button" variant="outline" onClick={onClose} className="h-10">
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// —————————————————————————————————————————————————————————————————————————————
// ——— Add / Assign Members Modal ——————————————————————————————————————————————

function AssignMembersModal({
  department,
  allEmployees,
  onClose,
  onAssigned,
}: {
  department: DepartmentDetail;
  allEmployees: Employee[];
  onClose: () => void;
  onAssigned: () => void;
}) {
  const { assignDepartmentMembers } = useDepartmentMutations();
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const existingMemberIds = new Set(department.members.map((m: DepartmentMember) => m._id));
  const availableEmployees = allEmployees
    .filter((e) => e.isActive && !existingMemberIds.has(e._id))
    .filter(
      (e) =>
        e.name.toLowerCase().includes(search.toLowerCase()) ||
        e.email.toLowerCase().includes(search.toLowerCase()) ||
        (e.position && e.position.toLowerCase().includes(search.toLowerCase()))
    );

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleAssign = async () => {
    if (selectedIds.length === 0) return;
    setIsSubmitting(true);
    setError(null);
    try {
      await assignDepartmentMembers.mutateAsync({
        deptId: department._id,
        userIds: selectedIds,
      });
      onAssigned();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to assign members");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-slate-50/50">
          <div>
            <h2 className="text-base font-semibold text-foreground">
              Add Members to {department.name}
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Select employees to assign to this department
            </p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search available employees…"
              className="pl-9 h-9"
            />
          </div>

          <div className="border border-border rounded-xl max-h-64 overflow-y-auto divide-y divide-border">
            {availableEmployees.length === 0 ? (
              <div className="p-8 text-center text-xs text-muted-foreground">
                No matching available employees found.
              </div>
            ) : (
              availableEmployees.map((emp) => {
                const isSelected = selectedIds.includes(emp._id);
                return (
                  <div
                    key={emp._id}
                    onClick={() => toggleSelect(emp._id)}
                    className={`flex items-center justify-between p-3 cursor-pointer transition-colors ${
                      isSelected ? "bg-primary/5" : "hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}}
                        className="rounded border-slate-300 text-primary focus:ring-primary"
                      />
                      <div>
                        <div className="text-xs font-medium text-foreground">{emp.name}</div>
                        <div className="text-[11px] text-muted-foreground">{emp.email}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[11px] font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
                        {emp.position || emp.role?.name || "Member"}
                      </span>
                      {emp.department && (
                        <div className="text-[10px] text-amber-600 mt-0.5">
                          Currently in {emp.department.name}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {error && (
            <div className="p-3 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            <span className="text-xs text-muted-foreground">
              {selectedIds.length} employee{selectedIds.length !== 1 ? "s" : ""} selected
            </span>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose} size="sm">
                Cancel
              </Button>
              <Button
                onClick={handleAssign}
                disabled={selectedIds.length === 0 || isSubmitting}
                size="sm"
                className="gap-1.5"
              >
                {isSubmitting ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <UserPlus className="w-3.5 h-3.5" />
                )}
                Assign Members
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// —————————————————————————————————————————————————————————————————————————————
// ——— Transfer Members Modal ——————————————————————————————————————————————————

function TransferMembersModal({
  sourceDepartment,
  allDepartments,
  initialMemberId,
  onClose,
  onTransferred,
}: {
  sourceDepartment: DepartmentDetail;
  allDepartments: Department[];
  initialMemberId?: string;
  onClose: () => void;
  onTransferred: () => void;
}) {
  const { transferDepartmentMembers } = useDepartmentMutations();
  const otherDepartments = allDepartments.filter(
    (d) => d._id !== sourceDepartment._id && d.isActive
  );
  const [targetDeptId, setTargetDeptId] = useState(otherDepartments[0]?._id ?? "");
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>(
    initialMemberId ? [initialMemberId] : []
  );
  const [transferAll, setTransferAll] = useState(!initialMemberId);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleSelect = (id: string) => {
    setSelectedUserIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleTransfer = async () => {
    if (!targetDeptId) return;
    setIsSubmitting(true);
    setError(null);
    try {
      await transferDepartmentMembers.mutateAsync({
        deptId: sourceDepartment._id,
        data: {
          targetDepartmentId: targetDeptId,
          userIds: transferAll ? undefined : selectedUserIds,
        },
      });
      onTransferred();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to transfer members");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-slate-50/50">
          <div>
            <h2 className="text-base font-semibold text-foreground">Transfer Department Members</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              From {sourceDepartment.name} to another department
            </p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
              Target Department *
            </label>
            <select
              value={targetDeptId}
              onChange={(e) => setTargetDeptId(e.target.value)}
              className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            >
              {otherDepartments.map((d) => (
                <option key={d._id} value={d._id}>
                  {d.name} ({d.employeeCount} members)
                </option>
              ))}
            </select>
          </div>

          {!initialMemberId && (
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="transferAll"
                checked={transferAll}
                onChange={(e) => setTransferAll(e.target.checked)}
                className="rounded border-slate-300 text-primary focus:ring-primary"
              />
              <label htmlFor="transferAll" className="text-xs font-medium text-foreground cursor-pointer">
                Transfer all {sourceDepartment.members.length} members
              </label>
            </div>
          )}

          {!transferAll && (
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                Select Members to Transfer
              </label>
              <div className="border border-border rounded-xl max-h-48 overflow-y-auto divide-y divide-border">
                {sourceDepartment.members.map((m: DepartmentMember) => {
                  const isSelected = selectedUserIds.includes(m._id);
                  return (
                    <div
                      key={m._id}
                      onClick={() => toggleSelect(m._id)}
                      className={`flex items-center justify-between p-2.5 cursor-pointer text-xs ${
                        isSelected ? "bg-primary/5" : "hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}}
                          className="rounded border-slate-300 text-primary"
                        />
                        <span className="font-medium text-foreground">{m.name}</span>
                      </div>
                      <span className="text-muted-foreground">{m.position || "Member"}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {error && (
            <div className="p-3 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <Button
              onClick={handleTransfer}
              disabled={!targetDeptId || (!transferAll && selectedUserIds.length === 0) || isSubmitting}
              className="flex-1 gap-1.5 h-10"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <ArrowRightLeft className="w-4 h-4" />
              )}
              Confirm Transfer
            </Button>
            <Button variant="outline" onClick={onClose} className="h-10">
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// —————————————————————————————————————————————————————————————————————————————
// ——— Safe Deactivate / Delete Dialog —————————————————————————————————————————

function DeleteDepartmentDialog({
  department,
  allDepartments,
  onClose,
  onDeleted,
}: {
  department: Department;
  allDepartments: Department[];
  onClose: () => void;
  onDeleted: () => void;
}) {
  const { deleteDepartment } = useDepartmentMutations();
  const otherDepartments = allDepartments.filter(
    (d) => d._id !== department._id && d.isActive
  );
  const [reassignOption, setReassignOption] = useState<"reassign" | "unassign">(
    otherDepartments.length > 0 && department.employeeCount > 0 ? "reassign" : "unassign"
  );
  const [targetDeptId, setTargetDeptId] = useState(otherDepartments[0]?._id ?? "");
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    setIsDeleting(true);
    setError(null);
    try {
      const reassignTo = reassignOption === "reassign" ? targetDeptId : undefined;
      await deleteDepartment.mutateAsync({ id: department._id, reassignTo });
      onDeleted();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to deactivate department");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="p-6 space-y-4">
          <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto text-red-600">
            <Trash2 className="w-6 h-6" />
          </div>

          <div className="text-center space-y-1">
            <h3 className="text-base font-bold text-foreground">
              Deactivate &quot;{department.name}&quot;?
            </h3>
            <p className="text-xs text-muted-foreground">
              This will mark the department as inactive and remove active leadership roles.
            </p>
          </div>

          {department.employeeCount > 0 && (
            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl space-y-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-amber-800">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{department.employeeCount} active members currently assigned</span>
              </div>

              {otherDepartments.length > 0 ? (
                <div className="space-y-2 text-xs">
                  <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-800">
                    <input
                      type="radio"
                      name="reassignOption"
                      checked={reassignOption === "reassign"}
                      onChange={() => setReassignOption("reassign")}
                    />
                    Transfer all members to another department:
                  </label>
                  {reassignOption === "reassign" && (
                    <select
                      value={targetDeptId}
                      onChange={(e) => setTargetDeptId(e.target.value)}
                      className="w-full h-8 rounded border border-input bg-background px-2 text-xs"
                    >
                      {otherDepartments.map((d) => (
                        <option key={d._id} value={d._id}>
                          {d.name}
                        </option>
                      ))}
                    </select>
                  )}
                  <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-800">
                    <input
                      type="radio"
                      name="reassignOption"
                      checked={reassignOption === "unassign"}
                      onChange={() => setReassignOption("unassign")}
                    />
                    Unassign members (leave with no department)
                  </label>
                </div>
              ) : (
                <p className="text-xs text-amber-700">
                  Members will be cleanly unassigned and can be reassigned later.
                </p>
              )}
            </div>
          )}

          {error && (
            <div className="p-3 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
              className="flex-1 gap-1.5 h-10"
            >
              {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              Confirm Deactivation
            </Button>
            <Button variant="outline" onClick={onClose} className="h-10">
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// —————————————————————————————————————————————————————————————————————————————
// ——— Department Management Slide-Over Drawer —————————————————————————————————

function DepartmentDetailDrawer({
  deptId,
  allDepartments,
  allEmployees,
  onClose,
  onRefreshAll,
}: {
  deptId: string;
  allDepartments: Department[];
  allEmployees: Employee[];
  onClose: () => void;
  onRefreshAll: () => void;
}) {
  const { department, isLoading, invalidate } = useDepartmentDetail(deptId);
  const { setDepartmentHead, removeDepartmentMember, reactivateDepartment } = useDepartmentMutations();
  const [memberSearch, setMemberSearch] = useState("");
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [transferMemberId, setTransferMemberId] = useState<string | null>(null);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);

  if (isLoading || !department) {
    return (
      <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-sm">
        <div className="bg-white w-full max-w-2xl h-full p-8 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  const filteredMembers = department.members.filter(
    (m: DepartmentMember) =>
      m.name.toLowerCase().includes(memberSearch.toLowerCase()) ||
      m.email.toLowerCase().includes(memberSearch.toLowerCase()) ||
      (m.position && m.position.toLowerCase().includes(memberSearch.toLowerCase()))
  );

  const handleMakeHead = async (userId: string) => {
    setIsActionLoading(true);
    try {
      await setDepartmentHead.mutateAsync({ deptId: department._id, headId: userId });
      invalidate();
      onRefreshAll();
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleRemoveHead = async () => {
    setIsActionLoading(true);
    try {
      await setDepartmentHead.mutateAsync({ deptId: department._id, headId: null });
      invalidate();
      onRefreshAll();
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleRemoveMember = async (userId: string, name: string) => {
    if (!confirm(`Remove ${name} from ${department.name}?`)) return;
    setIsActionLoading(true);
    try {
      await removeDepartmentMember.mutateAsync({ deptId: department._id, userId });
      invalidate();
      onRefreshAll();
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleReactivate = async () => {
    setIsActionLoading(true);
    try {
      await reactivateDepartment.mutateAsync(department._id);
      invalidate();
      onRefreshAll();
    } finally {
      setIsActionLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-2xl h-full shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-300">
        {/* Drawer Header */}
        <div className="p-6 border-b border-border bg-slate-50/70 flex items-start justify-between gap-4 shrink-0">
          <div className="flex items-start gap-3 min-w-0">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Building2 className="w-6 h-6 text-primary" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-bold text-foreground">{department.name}</h2>
                {department.isActive ? (
                  <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Active
                  </Badge>
                ) : (
                  <Badge variant="outline" className="bg-slate-100 text-slate-600 border-slate-300 gap-1">
                    <XCircle className="w-3 h-3" /> Inactive
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                {department.description || "No description provided."}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground p-1.5 rounded-lg hover:bg-slate-200/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-slate-50 border border-border">
              <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                <Users className="w-4 h-4 text-primary" /> Total Members
              </div>
              <div className="text-2xl font-bold text-foreground mt-1">
                {department.members.length}
              </div>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-border">
              <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                <Crown className="w-4 h-4 text-amber-500" /> Department Head
              </div>
              <div className="text-sm font-semibold text-foreground mt-1 truncate">
                {department.head ? department.head.name : "Not Assigned"}
              </div>
            </div>
          </div>

          {/* Department Head Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Crown className="w-4 h-4 text-amber-500" /> Department Leadership
              </h3>
              {department.head && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRemoveHead}
                  disabled={isActionLoading}
                  className="h-7 text-xs text-muted-foreground hover:text-red-600"
                >
                  Unassign Head
                </Button>
              )}
            </div>

            {department.head ? (
              <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/40 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-amber-500/10 text-amber-700 font-bold flex items-center justify-center text-sm shrink-0">
                    {department.head.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                      {department.head.name}
                      <Crown className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    </div>
                    <div className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
                      <span className="flex items-center gap-1 truncate">
                        <Mail className="w-3 h-3" /> {department.head.email}
                      </span>
                    </div>
                  </div>
                </div>
                <Badge variant="secondary" className="bg-amber-100 text-amber-800 border-amber-300 shrink-0">
                  Department Head
                </Badge>
              </div>
            ) : (
              <div className="p-4 rounded-xl border border-dashed border-border bg-slate-50/50 text-center text-xs text-muted-foreground">
                No head assigned. You can assign a head from the member roster below.
              </div>
            )}
          </div>

          {/* Members Roster Section */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-primary" /> Member Roster ({department.members.length})
                </h3>
              </div>
              <div className="flex gap-2">
                {department.members.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setTransferMemberId(null);
                      setShowTransferModal(true);
                    }}
                    className="h-8 text-xs gap-1.5"
                  >
                    <ArrowRightLeft className="w-3.5 h-3.5" /> Transfer Members
                  </Button>
                )}
                <Button
                  size="sm"
                  onClick={() => setShowAssignModal(true)}
                  className="h-8 text-xs gap-1.5"
                >
                  <UserPlus className="w-3.5 h-3.5" /> Add Members
                </Button>
              </div>
            </div>

            {/* Filter */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <Input
                value={memberSearch}
                onChange={(e) => setMemberSearch(e.target.value)}
                placeholder="Search department members…"
                className="pl-9 h-9 text-xs"
              />
            </div>

            {/* Member List */}
            <div className="border border-border rounded-xl overflow-hidden divide-y divide-border">
              {filteredMembers.length === 0 ? (
                <div className="p-8 text-center text-xs text-muted-foreground">
                  {memberSearch
                    ? "No members match your search."
                    : "No members assigned yet. Click 'Add Members' above."}
                </div>
              ) : (
                filteredMembers.map((member: DepartmentMember) => {
                  const isHead = department.head?._id === member._id;
                  return (
                    <div
                      key={member._id}
                      className="p-3.5 flex items-center justify-between gap-3 hover:bg-slate-50/70 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 font-medium text-xs flex items-center justify-center shrink-0">
                          {member.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-semibold text-foreground truncate">
                              {member.name}
                            </span>
                            {isHead && (
                              <Crown className="w-3 h-3 text-amber-500 shrink-0" />
                            )}
                          </div>
                          <div className="text-[11px] text-muted-foreground truncate">
                            {member.email}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[11px] font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
                          {member.position || member.role?.name || "Member"}
                        </span>

                        <div className="flex items-center gap-1">
                          {!isHead && (
                            <Button
                              variant="ghost"
                              size="sm"
                              title="Make Department Head"
                              onClick={() => handleMakeHead(member._id)}
                              disabled={isActionLoading}
                              className="h-7 w-7 p-0 text-muted-foreground hover:text-amber-600 hover:bg-amber-50"
                            >
                              <Crown className="w-3.5 h-3.5" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            title="Transfer to another department"
                            onClick={() => {
                              setTransferMemberId(member._id);
                              setShowTransferModal(true);
                            }}
                            className="h-7 w-7 p-0 text-muted-foreground hover:text-primary hover:bg-primary/5"
                          >
                            <ArrowRightLeft className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            title="Remove from department"
                            onClick={() => handleRemoveMember(member._id, member.name)}
                            disabled={isActionLoading}
                            className="h-7 w-7 p-0 text-muted-foreground hover:text-red-600 hover:bg-red-50"
                          >
                            <UserMinus className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Drawer Footer */}
        <div className="p-4 border-t border-border bg-slate-50 flex items-center justify-between shrink-0">
          {!department.isActive ? (
            <Button
              variant="outline"
              size="sm"
              onClick={handleReactivate}
              disabled={isActionLoading}
              className="gap-1.5 text-emerald-600 border-emerald-300 hover:bg-emerald-50"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Reactivate Department
            </Button>
          ) : (
            <span className="text-xs text-muted-foreground">
              Department is active and accepting assignments.
            </span>
          )}
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>

        {/* Sub-modals inside Drawer */}
        {showAssignModal && (
          <AssignMembersModal
            department={department}
            allEmployees={allEmployees}
            onClose={() => setShowAssignModal(false)}
            onAssigned={() => {
              setShowAssignModal(false);
              invalidate();
              onRefreshAll();
            }}
          />
        )}

        {showTransferModal && (
          <TransferMembersModal
            sourceDepartment={department}
            allDepartments={allDepartments}
            initialMemberId={transferMemberId || undefined}
            onClose={() => {
              setShowTransferModal(false);
              setTransferMemberId(null);
            }}
            onTransferred={() => {
              setShowTransferModal(false);
              setTransferMemberId(null);
              invalidate();
              onRefreshAll();
            }}
          />
        )}
      </div>
    </div>
  );
}

// —————————————————————————————————————————————————————————————————————————————
// ——— Department Card —————————————————————————————————————————————————————————

function DepartmentCard({
  department,
  allDepartments,
  allEmployees,
  onManage,
  onRefresh,
}: {
  department: Department;
  allDepartments: Department[];
  allEmployees: Employee[];
  onManage: () => void;
  onRefresh: () => void;
}) {
  const [showEdit, setShowEdit] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  return (
    <>
      <Card
        className={`p-5 transition-all hover:shadow-lg border border-border/80 flex flex-col justify-between ${
          !department.isActive ? "opacity-60 bg-slate-50/50" : "bg-white"
        }`}
      >
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Building2 className="w-5 h-5 text-primary" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-bold text-sm text-foreground truncate">
                    {department.name}
                  </h3>
                  {department.isActive ? (
                    <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-2 py-0.5 font-medium">
                      <CheckCircle2 className="w-2.5 h-2.5" /> Active
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] text-slate-500 bg-slate-100 border border-slate-200 rounded-full px-2 py-0.5 font-medium">
                      <XCircle className="w-2.5 h-2.5" /> Inactive
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                  {department.description || "No description provided."}
                </p>
              </div>
            </div>
            <div className="flex gap-1 shrink-0">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                onClick={() => setShowEdit(true)}
              >
                <Edit2 className="w-3.5 h-3.5" />
              </Button>
              {department.isActive && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowDeleteDialog(true)}
                  className="h-8 w-8 p-0 text-muted-foreground hover:text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/60 text-xs">
            <div className="flex items-center gap-1.5 text-muted-foreground truncate">
              <Users className="w-3.5 h-3.5 text-primary shrink-0" />
              <span className="font-medium text-foreground">{department.employeeCount}</span> members
            </div>
            <div className="flex items-center gap-1.5 text-muted-foreground truncate">
              <Crown className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span className="truncate">
                {department.head ? department.head.name : "No Head"}
              </span>
            </div>
          </div>
        </div>

        <div className="pt-4 mt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onManage}
            className="w-full h-8 text-xs font-semibold gap-1.5 bg-slate-50 hover:bg-primary hover:text-white transition-all"
          >
            <Users className="w-3.5 h-3.5" /> Manage Members &amp; Head
          </Button>
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

      {showDeleteDialog && (
        <DeleteDepartmentDialog
          department={department}
          allDepartments={allDepartments}
          onClose={() => setShowDeleteDialog(false)}
          onDeleted={() => {
            onRefresh();
            setShowDeleteDialog(false);
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
  const [managingDeptId, setManagingDeptId] = useState<string | null>(null);

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
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2">
            <Building2 className="w-6 h-6 text-primary" /> Departments
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Complete lifecycle management, member assignments, and leadership structure
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="px-3 py-1 text-xs">
            {active} Active Departments
          </Badge>
          <Button size="sm" onClick={() => setShowCreate(true)} className="gap-1.5 shadow-sm">
            <Plus className="w-4 h-4" /> Add Department
          </Button>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[260px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search departments by name or keywords…"
            className="pl-9 h-10"
          />
        </div>
        <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer px-2 select-none">
          <input
            type="checkbox"
            checked={showInactive}
            onChange={(e) => setShowInactive(e.target.checked)}
            className="rounded border-slate-300 text-primary focus:ring-primary"
          />
          Show inactive departments
        </label>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Department Cards Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-44 rounded-2xl bg-muted/60 animate-pulse" />
          ))}
        </div>
      ) : visible.length === 0 ? (
        <Card className="p-12 text-center border-dashed rounded-2xl">
          <Building2 className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-foreground">No departments found</h3>
          <p className="text-xs text-muted-foreground mt-1">
            {search
              ? "No departments match your search query."
              : "Get started by creating your first organizational department."}
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {visible.map((dept) => (
            <DepartmentCard
              key={dept._id}
              department={dept}
              allDepartments={departments}
              allEmployees={allEmployees}
              onManage={() => setManagingDeptId(dept._id)}
              onRefresh={invalidateDepts}
            />
          ))}
        </div>
      )}

      {/* Create Modal */}
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

      {/* Management Drawer */}
      {managingDeptId && (
        <DepartmentDetailDrawer
          deptId={managingDeptId}
          allDepartments={departments}
          allEmployees={allEmployees}
          onClose={() => setManagingDeptId(null)}
          onRefreshAll={invalidateDepts}
        />
      )}
    </div>
  );
}
