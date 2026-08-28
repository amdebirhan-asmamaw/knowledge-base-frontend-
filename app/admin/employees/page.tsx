"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import {
  type Employee,
} from "@/lib/api/employees.api";
import type { Client } from "@/lib/api/clients.api";
import type { Department } from "@/lib/api/departments.api";
import type { Role } from "@/lib/api/roles.api";
import { useClients, useEmployees, useEmployeeMutations, useRoles } from "@/hooks/queries";
import { useDepartments } from "@/hooks/queries";
import { useAuth } from "@/hooks/use-auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Plus, Search, Edit2, Trash2, Save, X, Loader2,
  Users, AlertCircle, Building2, CheckCircle2,
  XCircle, UserCheck,
  KeyRound, ShieldCheck, ShieldOff, Lock,
} from "lucide-react";

// ─── Avatar ───────────────────────────────────────────────────────────────────

const COLORS = [
  "bg-violet-100 text-violet-700", "bg-blue-100 text-blue-700",
  "bg-emerald-100 text-emerald-700", "bg-amber-100 text-amber-700",
  "bg-rose-100 text-rose-700",
];
function Avatar({ name }: { name: string }) {
  const initials = name.split(" ").slice(0, 2).map((w) => w[0]?.toUpperCase()).join("");
  const color = COLORS[name.charCodeAt(0) % COLORS.length];
  return (
    <div className={`w-10 h-10 ${color} rounded-full flex items-center justify-center font-semibold text-sm shrink-0`}>
      {initials}
    </div>
  );
}

// ─── Create Employee Modal ────────────────────────────────────────────────────

function CreateEmployeeModal({
  allClients, allDepartments, allRoles, onClose, onCreate,
}: {
  allClients: Client[];
  allDepartments: Department[];
  allRoles: Role[];
  onClose: () => void;
  onCreate: (e: Employee) => void;
}) {
  const { createEmployee } = useEmployeeMutations();
  const [form, setForm] = useState({
    name: "", email: "", password: "", department: "", position: "", role: "",
  });
  const [selectedClients, setSelectedClients] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleClient = (id: string) =>
    setSelectedClients((prev) => prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.password.trim()) return;
    setIsSaving(true); setError(null);
    try {
      onCreate(await createEmployee.mutateAsync({
        ...form,
        department: form.department || undefined,
        role: form.role || undefined,
        assignedClients: selectedClients,
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create employee");
    } finally { setIsSaving(false); }
  };

  const field = (key: keyof typeof form, label: string, placeholder: string, type = "text", required = false) => (
    <div>
      <label className="block text-xs font-medium text-muted-foreground mb-1">{label}{required && " *"}</label>
      <Input type={type} value={form[key]} onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))} placeholder={placeholder} />
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border sticky top-0 bg-white">
          <h2 className="text-base font-semibold">Add Employee</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">{field("name", "Full Name", "e.g. Amanuel Tadesse", "text", true)}</div>
            <div className="col-span-2">{field("email", "Work Email", "amanuel@company.com", "email", true)}</div>
            <div className="col-span-2">{field("password", "Temporary Password", "Min 8 characters", "password", true)}</div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Department</label>
              <select
                value={form.department}
                onChange={(e) => setForm((f) => ({ ...f, department: e.target.value }))}
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="">No department</option>
                {allDepartments.filter((d) => d.isActive).map((d) => (
                  <option key={d._id} value={d._id}>{d.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Role</label>
              <select
                value={form.role}
                onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="">Default (User)</option>
                {allRoles.map((r) => (
                  <option key={r._id} value={r._id}>{r.name}</option>
                ))}
              </select>
            </div>
            <div>{field("position", "Position", "e.g. Account Manager")}</div>
          </div>

          {/* Assign clients */}
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-2">
              Assign Clients ({selectedClients.length} selected)
            </label>
            <div className="border border-border rounded-lg max-h-40 overflow-y-auto divide-y divide-border">
              {allClients.length === 0 && (
                <p className="text-xs text-muted-foreground p-3">No clients available</p>
              )}
              {allClients.map((c) => (
                <label key={c._id} className="flex items-center gap-2 px-3 py-2 hover:bg-secondary/50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedClients.includes(c._id)}
                    onChange={() => toggleClient(c._id)}
                    className="rounded"
                  />
                  <span className="text-sm font-medium truncate">{c.name}</span>
                  {c.industry && <span className="text-xs text-muted-foreground ml-auto shrink-0">{c.industry}</span>}
                </label>
              ))}
            </div>
          </div>

          {error && <p className="text-sm text-red-600 flex items-center gap-1.5"><AlertCircle className="w-3.5 h-3.5" />{error}</p>}
          <div className="flex gap-2 pt-1">
            <Button type="submit" disabled={!form.name.trim() || !form.email.trim() || !form.password.trim() || isSaving} className="flex-1 gap-1.5">
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Create Employee
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Assign Clients Modal ─────────────────────────────────────────────────────

function AssignClientsModal({
  employee, allClients, onClose, onSaved,
}: {
  employee: Employee;
  allClients: Client[];
  onClose: () => void;
  onSaved: (e: Employee) => void;
}) {
  const { assignClients } = useEmployeeMutations();
  const [selected, setSelected] = useState<string[]>(employee.assignedClients.map((c) => c._id));
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggle = (id: string) =>
    setSelected((prev) => prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]);

  const handleSave = async () => {
    setIsSaving(true); setError(null);
    try { onSaved(await assignClients.mutateAsync({ id: employee._id, clientIds: selected })); }
    catch (err) { setError(err instanceof Error ? err.message : "Failed to save"); }
    finally { setIsSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div>
            <h2 className="text-base font-semibold">Assign Clients</h2>
            <p className="text-xs text-muted-foreground">{employee.name}</p>
          </div>
          <button onClick={onClose}><X className="w-4 h-4 text-muted-foreground" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div className="border border-border rounded-lg max-h-64 overflow-y-auto divide-y divide-border">
            {allClients.map((c) => (
              <label key={c._id} className="flex items-center gap-3 px-3 py-2.5 hover:bg-secondary/50 cursor-pointer">
                <input type="checkbox" checked={selected.includes(c._id)} onChange={() => toggle(c._id)} className="rounded" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{c.name}</p>
                  {c.industry && <p className="text-xs text-muted-foreground">{c.industry}</p>}
                </div>
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${c.status === "active" ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-600"}`}>
                  {c.status}
                </span>
              </label>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">{selected.length} client{selected.length !== 1 ? "s" : ""} selected</p>
          {error && <p className="text-xs text-red-600">{error}</p>}
          <div className="flex gap-2">
            <Button onClick={handleSave} disabled={isSaving} className="flex-1 gap-1.5">
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save Assignments
            </Button>
            <Button variant="outline" onClick={onClose}>Cancel</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Edit Employee Modal ──────────────────────────────────────────────────────

function EditEmployeeModal({
  employee, allDepartments, allRoles, onClose, onSaved,
}: {
  employee: Employee;
  allDepartments: Department[];
  allRoles: Role[];
  onClose: () => void;
  onSaved: (e: Employee) => void;
}) {
  const { hasPermission } = useAuth();
  const { updateEmployee, setEmployeeRole } = useEmployeeMutations();
  const [form, setForm] = useState({
    name: employee.name,
    email: employee.email,
    department: employee.department?._id ?? "",
    position: employee.position ?? "",
    isActive: employee.isActive,
    role: employee.role?._id ?? "",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setIsSaving(true); setError(null);
    try {
      // Update profile fields
      let updated = await updateEmployee.mutateAsync({
        id: employee._id,
        data: {
          name: form.name.trim(),
          department: form.department || undefined,
          position: form.position.trim(),
          isActive: form.isActive,
        },
      });
      // Update role if current user is super admin
      if (hasPermission("roles:update") && form.role && form.role !== employee.role?._id) {
        updated = await setEmployeeRole.mutateAsync({ id: employee._id, role: form.role });
      }
      onSaved(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update employee");
    } finally { setIsSaving(false); }
  };

  const field = (key: "name" | "department" | "position", label: string, placeholder: string) => (
    <div>
      <label className="block text-xs font-medium text-muted-foreground mb-1">{label}</label>
      <Input
        value={form[key]}
        onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
        placeholder={placeholder}
      />
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border sticky top-0 bg-white">
          <div>
            <h2 className="text-base font-semibold">Edit Employee</h2>
            <p className="text-xs text-muted-foreground">{employee.email}</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Profile fields */}
          {field("name", "Full Name *", "e.g. Amanuel Tadesse")}

          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Work Email</label>
            <Input value={form.email} readOnly disabled className="opacity-60 cursor-not-allowed" />
            <p className="text-xs text-muted-foreground mt-0.5">Email cannot be changed here.</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Department</label>
              <select
                value={form.department}
                onChange={(e) => setForm((f) => ({ ...f, department: e.target.value }))}
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="">No department</option>
                {allDepartments.filter((d) => d.isActive).map((d) => (
                  <option key={d._id} value={d._id}>{d.name}</option>
                ))}
              </select>
            </div>
            {field("position", "Position", "e.g. Account Manager")}
          </div>

          {/* Active toggle */}
          <div className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
            <div>
              <p className="text-sm font-medium">Account Active</p>
              <p className="text-xs text-muted-foreground">Inactive employees cannot log in.</p>
            </div>
            <button
              type="button"
              onClick={() => setForm((f) => ({ ...f, isActive: !f.isActive }))}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                form.isActive ? "bg-emerald-500" : "bg-gray-300"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                  form.isActive ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>

          {/* Role selector — only shown to super admins */}
          {hasPermission("roles:update") && (
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Role</label>
              <select
                value={form.role}
                onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
              >
                {allRoles.map((r) => (
                  <option key={r._id} value={r._id}>{r.name}</option>
                ))}
              </select>
            </div>
          )}

          {error && (
            <p className="text-sm text-red-600 flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5" />{error}
            </p>
          )}

          <div className="flex gap-2 pt-1">
            <Button type="submit" disabled={!form.name.trim() || isSaving} className="flex-1 gap-1.5">
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Changes
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          </div>
        </form>
      </div>
    </div>
  );
}


// ─── Reset Password Modal ─────────────────────────────────────────────────────

function ResetPasswordModal({
  employee, onClose,
}: {
  employee: Employee;
  onClose: () => void;
}) {
  const { resetPassword } = useEmployeeMutations();
  const [newPassword, setNewPassword] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) return;
    setIsSaving(true); setError(null);
    try {
      await resetPassword.mutateAsync({ id: employee._id, newPassword });
      setSuccess(true);
      setTimeout(onClose, 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reset password");
    } finally { setIsSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div>
            <h2 className="text-base font-semibold">Reset Password</h2>
            <p className="text-xs text-muted-foreground">{employee.name}</p>
          </div>
          <button onClick={onClose}><X className="w-4 h-4 text-muted-foreground" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">New Password (min 8 characters)</label>
            <Input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password"
              autoFocus
            />
          </div>
          {error && <p className="text-xs text-red-600 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{error}</p>}
          {success && <p className="text-xs text-emerald-600 font-medium">✓ Password reset successfully!</p>}
          <div className="flex gap-2">
            <Button type="submit" disabled={newPassword.length < 8 || isSaving || success} className="flex-1 gap-1.5">
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
              Reset Password
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Employee Table Row ───────────────────────────────────────────────────────

function EmployeeRow({
  employee, allClients, allDepartments, allRoles,
  onRefresh,
}: {
  employee: Employee;
  allClients: Client[];
  allDepartments: Department[];
  allRoles: Role[];
  onRefresh: () => void;
}) {
  const { deactivateEmployee } = useEmployeeMutations();
  const [showAssign, setShowAssign] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showResetPw, setShowResetPw] = useState(false);
  const [isDeactivating, setIsDeactivating] = useState(false);

  const handleDeactivate = async () => {
    if (!confirm(`Deactivate ${employee.name}? They will lose access.`)) return;
    setIsDeactivating(true);
    try { await deactivateEmployee.mutateAsync(employee._id); onRefresh(); }
    finally { setIsDeactivating(false); }
  };

  return (
    <>
      <tr className={`border-b border-border hover:bg-secondary/30 transition-colors ${!employee.isActive ? "opacity-50" : ""}`}>
        {/* Name & Email */}
        <td className="px-4 py-3">
          <div className="flex items-center gap-3">
            <Avatar name={employee.name} />
            <div className="min-w-0">
              <p className="font-medium text-sm text-foreground truncate">{employee.name}</p>
              <p className="text-xs text-muted-foreground truncate">{employee.email}</p>
            </div>
          </div>
        </td>

        {/* Department & Position */}
        <td className="px-4 py-3">
          <div className="min-w-0">
            {employee.department?.name ? (
              <p className="text-sm text-foreground truncate">{employee.department.name}</p>
            ) : (
              <p className="text-sm text-muted-foreground italic">—</p>
            )}
            {employee.position && (
              <p className="text-xs text-muted-foreground truncate">{employee.position}</p>
            )}
          </div>
        </td>

        {/* Assigned Clients */}
        <td className="px-4 py-3">
          <div className="flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            <span className="text-sm text-muted-foreground">
              {employee.assignedClients.length}
            </span>
          </div>
        </td>

        {/* Role */}
        <td className="px-4 py-3">
          {employee.role?.name ? (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-teal-700 bg-teal-50 border border-teal-200 rounded-full px-2 py-0.5">
              <ShieldCheck className="w-3 h-3" /> {employee.role.name}
            </span>
          ) : (
            <span className="text-xs font-medium text-muted-foreground bg-secondary rounded-full px-2 py-0.5">
              No Role
            </span>
          )}
        </td>

        {/* Status */}
        <td className="px-4 py-3">
          {employee.isActive ? (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-2 py-0.5">
              <CheckCircle2 className="w-3 h-3" /> Active
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-500 bg-gray-100 border border-gray-200 rounded-full px-2 py-0.5">
              <XCircle className="w-3 h-3" /> Inactive
            </span>
          )}
        </td>

        {/* Actions */}
        <td className="px-4 py-3">
          <div className="flex items-center gap-1">
            <Button
              variant="outline" size="sm"
              className="h-7 text-xs gap-1"
              onClick={() => setShowEdit(true)}
              title="Edit employee"
            >
              <Edit2 className="w-3 h-3" /> Edit
            </Button>
            <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={() => setShowAssign(true)} title="Assign clients">
              <UserCheck className="w-3 h-3" />
            </Button>
            <Button
              variant="outline" size="sm"
              className="h-7 text-xs gap-1"
              onClick={() => setShowResetPw(true)}
              title="Reset password"
            >
              <KeyRound className="w-3 h-3" />
            </Button>
            {employee.isActive && (
              <Button variant="ghost" size="icon-sm" onClick={handleDeactivate} disabled={isDeactivating}
                className="text-muted-foreground hover:text-red-600 hover:bg-red-50">
                {isDeactivating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
              </Button>
            )}
          </div>
        </td>
      </tr>

      {showEdit && createPortal(
        <EditEmployeeModal
          employee={employee}
          allDepartments={allDepartments}
          allRoles={allRoles}
          onClose={() => setShowEdit(false)}
          onSaved={() => { onRefresh(); setShowEdit(false); }}
        />,
        document.body,
      )}
      {showAssign && createPortal(
        <AssignClientsModal
          employee={employee}
          allClients={allClients}
          onClose={() => setShowAssign(false)}
          onSaved={() => { onRefresh(); setShowAssign(false); }}
        />,
        document.body,
      )}
      {showResetPw && createPortal(
        <ResetPasswordModal
          employee={employee}
          onClose={() => setShowResetPw(false)}
        />,
        document.body,
      )}
    </>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AdminEmployeesPage() {
  const [search, setSearch] = useState("");
  const [filterDept, setFilterDept] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "inactive">("active");
  const [filterRole, setFilterRole] = useState<string>("all");
  const [showCreate, setShowCreate] = useState(false);

  // ── Build query params from filter state ─────────────────────────────────
  const empFilters: { search?: string; department?: string; isActive?: boolean; role?: string } = {};
  if (search.trim()) empFilters.search = search.trim();
  if (filterDept) empFilters.department = filterDept;
  if (filterStatus !== "all") empFilters.isActive = filterStatus === "active";
  if (filterRole !== "all") empFilters.role = filterRole;

  const { employees, isLoading, error, invalidate: invalidateEmployees } = useEmployees(empFilters);
  const { clients: allClients } = useClients({ limit: 100 });
  const { departments: allDepartments } = useDepartments({ isActive: true });
  const { roles: allRoles } = useRoles();
  const hasActiveFilters = filterDept !== "" || filterStatus !== "active" || filterRole !== "all";

  const selectClass = "h-9 rounded-md border border-input bg-background px-3 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring cursor-pointer";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Employees</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage team members, roles, and client assignments
          </p>
        </div>
        <Button size="sm" onClick={() => setShowCreate(true)} className="gap-1.5">
          <Plus className="w-4 h-4" /> Add Employee
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, or position…"
            className="pl-9"
          />
        </div>

        {/* Department filter */}
        <select
          value={filterDept}
          onChange={(e) => setFilterDept(e.target.value)}
          className={selectClass}
        >
          <option value="">All Departments</option>
          {allDepartments.filter((d) => d.isActive).map((d) => (
            <option key={d._id} value={d._id}>{d.name}</option>
          ))}
        </select>

        {/* Status filter */}
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as "all" | "active" | "inactive")}
          className={selectClass}
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>

        {/* Role filter */}
        <select
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value)}
          className={selectClass}
        >
          <option value="all">All Roles</option>
          {allRoles.map((r) => (
            <option key={r._id} value={r._id}>{r.name}</option>
          ))}
        </select>

        {/* Clear filters */}
        {hasActiveFilters && (
          <Button
            variant="ghost" size="sm"
            className="h-9 text-xs gap-1 text-muted-foreground hover:text-foreground"
            onClick={() => { setFilterDept(""); setFilterStatus("active"); setFilterRole("all"); }}
          >
            <X className="w-3.5 h-3.5" /> Clear filters
          </Button>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
          <AlertCircle className="w-4 h-4 shrink-0" />{error}
        </div>
      )}

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-14 rounded-lg bg-muted animate-pulse" />)}
        </div>
      ) : employees.length === 0 ? (
        <Card className="p-12 text-center border-dashed">
          <Users className="w-8 h-8 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">
            {search || hasActiveFilters ? "No employees match your filters." : "No employees yet. Add your first team member."}
          </p>
        </Card>
      ) : (
        <Card className="overflow-hidden border border-border">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-border bg-secondary/40">
                  <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Employee</th>
                  <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Department</th>
                  <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Clients</th>
                  <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Role</th>
                  <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {employees.map((emp) => (
                  <EmployeeRow
                    key={emp._id}
                    employee={emp}
                    allClients={allClients}
                    allDepartments={allDepartments}
                    allRoles={allRoles}
                    onRefresh={invalidateEmployees}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {showCreate && (
        <CreateEmployeeModal
          allClients={allClients}
          allDepartments={allDepartments}
          allRoles={allRoles}
          onClose={() => setShowCreate(false)}
          onCreate={() => {
            invalidateEmployees();
            setShowCreate(false);
          }}
        />
      )}
    </div>
  );
}
