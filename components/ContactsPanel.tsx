"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  type Contact,
  type ContactRole,
} from "@/lib/api/clients.api";
import { useClientMutations } from "@/hooks/queries";
import { useAuth } from "@/hooks/use-auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Plus,
  Edit2,
  Trash2,
  Save,
  X,
  Loader2,
  Mail,
  Phone,
  Star,
  User,
  AlertCircle,
  Copy,
  ExternalLink,
} from "lucide-react";

const ROLE_LABELS: Record<ContactRole, string> = {
  ceo: "CEO",
  cto: "CTO",
  cfo: "CFO",
  coo: "COO",
  manager: "Manager",
  director: "Director",
  vp: "VP",
  developer: "Developer",
  designer: "Designer",
  analyst: "Analyst",
  sales: "Sales",
  hr: "HR",
  legal: "Legal",
  finance: "Finance",
  other: "Other",
};

const ROLES = Object.keys(ROLE_LABELS) as ContactRole[];

const AVATAR_PALETTE = [
  "from-violet-600 to-indigo-600 text-white",
  "from-blue-600 to-cyan-600 text-white",
  "from-emerald-600 to-teal-600 text-white",
  "from-amber-500 to-orange-600 text-white",
  "from-rose-500 to-red-600 text-white",
  "from-sky-600 to-blue-700 text-white",
];

function Avatar({ name }: { name: string }) {
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");

  const colorIndex =
    name.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0) %
    AVATAR_PALETTE.length;

  return (
    <div
      className={`w-9 h-9 bg-gradient-to-br ${AVATAR_PALETTE[colorIndex]} rounded-xl flex items-center justify-center font-bold text-xs shrink-0 shadow-xs`}
    >
      {initials || "CO"}
    </div>
  );
}

type ContactForm = {
  name: string;
  role: ContactRole;
  department: string;
  email: string;
  phone: string;
  isPrimary: boolean;
  notes: string;
};

const EMPTY: ContactForm = {
  name: "",
  role: "other",
  department: "",
  email: "",
  phone: "",
  isPrimary: false,
  notes: "",
};

function ContactForm({
  initial,
  onSave,
  onCancel,
  isSaving,
  error,
}: {
  initial: ContactForm;
  onSave: (f: ContactForm) => void;
  onCancel: () => void;
  isSaving: boolean;
  error: string | null;
}) {
  const [f, setF] = useState(initial);
  const set = (k: keyof ContactForm, v: unknown) =>
    setF((prev) => ({ ...prev, [k]: v }));

  return (
    <div className="space-y-3 p-4 bg-primary/5 border border-primary/20 rounded-2xl shadow-xs">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="sm:col-span-2">
          <label className="text-xs font-semibold text-foreground">
            Full Name *
          </label>
          <Input
            value={f.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder="e.g. Dawit Haile"
            className="mt-1 h-9 text-xs"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground">
            Executive / Functional Role
          </label>
          <select
            value={f.role}
            onChange={(e) => set("role", e.target.value as ContactRole)}
            className="w-full mt-1 h-9 rounded-lg border border-input bg-background px-3 text-xs focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {ROLE_LABELS[r]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground">
            Department
          </label>
          <Input
            value={f.department}
            onChange={(e) => set("department", e.target.value)}
            placeholder="e.g. Operations / Logistics"
            className="mt-1 h-9 text-xs"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground">
            Direct Email
          </label>
          <Input
            type="email"
            value={f.email}
            onChange={(e) => set("email", e.target.value)}
            placeholder="dawit@company.et"
            className="mt-1 h-9 text-xs"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground">
            Direct Phone
          </label>
          <Input
            value={f.phone}
            onChange={(e) => set("phone", e.target.value)}
            placeholder="+251 911 000 000"
            className="mt-1 h-9 text-xs"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="text-xs font-medium text-muted-foreground">
            Stakeholder Notes
          </label>
          <Input
            value={f.notes}
            onChange={(e) => set("notes", e.target.value)}
            placeholder="Key decision maker, preferred contact hours, escalation notes..."
            className="mt-1 h-9 text-xs"
          />
        </div>
        <label className="sm:col-span-2 flex items-center gap-2 text-xs font-medium text-foreground cursor-pointer select-none pt-1">
          <input
            type="checkbox"
            checked={f.isPrimary}
            onChange={(e) => set("isPrimary", e.target.checked)}
            className="rounded border-input text-primary focus:ring-primary"
          />
          <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
          Mark as primary point of contact
        </label>
      </div>

      {error && (
        <p className="text-xs text-red-600 dark:text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg p-2 flex items-center gap-1.5">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          {error}
        </p>
      )}

      <div className="flex gap-2 justify-end pt-1">
        <Button
          size="sm"
          variant="outline"
          onClick={onCancel}
          className="h-8 text-xs"
        >
          <X className="w-3 h-3 mr-1" />
          Cancel
        </Button>
        <Button
          size="sm"
          onClick={() => onSave(f)}
          disabled={!f.name.trim() || isSaving}
          className="gap-1.5 h-8 text-xs"
        >
          {isSaving ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            <Save className="w-3 h-3" />
          )}
          Save Contact
        </Button>
      </div>
    </div>
  );
}

export function ContactsPanel({
  clientId,
  initialContacts,
}: {
  clientId: string;
  initialContacts: Contact[];
}) {
  const { user, hasPermission, isAdmin } = useAuth();
  const {
    createContact,
    updateContact,
    deleteContact,
  } = useClientMutations(clientId);

  const canEdit =
    isAdmin ||
    hasPermission("clients:update:all") ||
    hasPermission("clients:update:own");

  const [contacts, setContacts] = useState<Contact[]>(initialContacts);
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [contactToDelete, setContactToDelete] = useState<Contact | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async (f: ContactForm) => {
    setIsSaving(true);
    setError(null);
    try {
      const c = await createContact.mutateAsync({ data: f });
      setContacts((prev) => {
        const updated = f.isPrimary
          ? prev.map((p) => ({ ...p, isPrimary: false }))
          : [...prev];
        return [c, ...updated].sort(
          (a, b) => (b.isPrimary ? 1 : 0) - (a.isPrimary ? 1 : 0)
        );
      });
      toast.success(`Contact "${c.name}" added successfully`);
      setShowAdd(false);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to create contact";
      setError(msg);
      toast.error(msg);
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdate = async (contactId: string, f: ContactForm) => {
    setIsSaving(true);
    setError(null);
    try {
      const c = await updateContact.mutateAsync({ contactId, data: f });
      setContacts((prev) => {
        const updated = f.isPrimary
          ? prev.map((p) => ({ ...p, isPrimary: false }))
          : [...prev];
        return updated
          .map((p) => (p._id === contactId ? c : p))
          .sort((a, b) => (b.isPrimary ? 1 : 0) - (a.isPrimary ? 1 : 0));
      });
      toast.success(`Contact "${c.name}" updated successfully`);
      setEditingId(null);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to update contact";
      setError(msg);
      toast.error(msg);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!contactToDelete) return;
    setIsDeleting(true);
    try {
      await deleteContact.mutateAsync(contactToDelete._id);
      setContacts((prev) => prev.filter((c) => c._id !== contactToDelete._id));
      toast.success(`Contact "${contactToDelete.name}" removed`);
      setContactToDelete(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to delete contact");
    } finally {
      setIsDeleting(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <User className="w-4 h-4 text-primary" /> Stakeholder Directory
          {contacts.length > 0 && (
            <Badge variant="secondary" className="text-xs">
              {contacts.length}
            </Badge>
          )}
        </h3>
        {!showAdd && canEdit && (
          <Button
            size="sm"
            onClick={() => setShowAdd(true)}
            className="gap-1.5 h-8 text-xs"
          >
            <Plus className="w-3.5 h-3.5" /> Add Contact
          </Button>
        )}
      </div>

      {showAdd && (
        <ContactForm
          initial={EMPTY}
          onSave={handleCreate}
          onCancel={() => {
            setShowAdd(false);
            setError(null);
          }}
          isSaving={isSaving}
          error={error}
        />
      )}

      {contacts.length === 0 && !showAdd && (
        <Card className="text-center py-12 text-sm text-muted-foreground border-dashed rounded-2xl">
          <User className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
          <p className="font-semibold text-foreground">No contacts added yet</p>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
            Maintain high stakeholder visibility by registering executive leads, billing managers, and technical contacts.
          </p>
          {canEdit && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowAdd(true)}
              className="mt-4 text-xs h-8"
            >
              <Plus className="w-3.5 h-3.5 mr-1" /> Add First Contact
            </Button>
          )}
        </Card>
      )}

      <div className="space-y-2.5">
        {contacts.map((c) => (
          <div key={c._id}>
            {editingId === c._id ? (
              <ContactForm
                initial={{
                  name: c.name,
                  role: c.role,
                  department: c.department,
                  email: c.email,
                  phone: c.phone,
                  isPrimary: c.isPrimary,
                  notes: c.notes,
                }}
                onSave={(f) => handleUpdate(c._id, f)}
                onCancel={() => {
                  setEditingId(null);
                  setError(null);
                }}
                isSaving={isSaving}
                error={error}
              />
            ) : (
              <div className="group flex items-start gap-3 p-3.5 rounded-xl border border-border bg-card hover:border-border/80 hover:shadow-xs transition-all">
                <Avatar name={c.name} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-foreground">
                      {c.name}
                    </span>
                    {c.isPrimary && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-full px-2 py-0.5">
                        <Star className="w-3 h-3 fill-current" /> Primary Point of Contact
                      </span>
                    )}
                    <Badge variant="secondary" className="text-xs font-medium uppercase tracking-wider">
                      {ROLE_LABELS[c.role]}
                    </Badge>
                    {c.department && (
                      <span className="text-xs text-muted-foreground">
                        · {c.department}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                    {c.email && (
                      <div className="flex items-center gap-1 group/field">
                        <a
                          href={`mailto:${c.email}`}
                          className="hover:text-primary transition-colors flex items-center gap-1"
                        >
                          <Mail className="w-3.5 h-3.5 text-blue-500" />
                          {c.email}
                        </a>
                        <button
                          onClick={() => copyToClipboard(c.email, "Email")}
                          className="opacity-0 group-hover/field:opacity-100 p-0.5 rounded hover:text-foreground text-muted-foreground transition-opacity"
                          title="Copy email address"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                    {c.phone && (
                      <div className="flex items-center gap-1 group/field">
                        <a
                          href={`tel:${c.phone}`}
                          className="hover:text-primary transition-colors flex items-center gap-1"
                        >
                          <Phone className="w-3.5 h-3.5 text-emerald-500" />
                          {c.phone}
                        </a>
                        <button
                          onClick={() => copyToClipboard(c.phone, "Phone number")}
                          className="opacity-0 group-hover/field:opacity-100 p-0.5 rounded hover:text-foreground text-muted-foreground transition-opacity"
                          title="Copy phone number"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>

                  {c.notes && (
                    <p className="text-xs text-muted-foreground/80 mt-1.5 italic bg-muted/30 px-2 py-1 rounded-md border border-border/40 inline-block">
                      {c.notes}
                    </p>
                  )}
                </div>

                {canEdit && (
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingId(c._id)}
                      className="h-8 w-8 p-0 text-muted-foreground hover:text-primary hover:bg-primary/10"
                      title="Edit Contact"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setContactToDelete(c)}
                      className="h-8 w-8 p-0 text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40"
                      title="Delete Contact"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Delete Contact Confirmation Dialog */}
      <Dialog
        open={!!contactToDelete}
        onOpenChange={(open) => !open && setContactToDelete(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Remove Contact</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove <strong className="text-foreground">{contactToDelete?.name}</strong> from the client contacts directory?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setContactToDelete(null)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="gap-2"
            >
              {isDeleting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
              Confirm Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
