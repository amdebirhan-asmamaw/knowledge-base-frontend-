"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { usePolicyMutations } from "@/hooks/queries";
import {
  POLICY_TYPES,
  POLICY_TYPE_LABELS,
  type PolicyType,
} from "@/lib/api/policies.api";
import { RichTextEditor } from "@/components/RichTextEditor";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronLeft, Save, Loader2, ShieldAlert } from "lucide-react";
import { toast } from "sonner";

function toSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export default function NewPolicyPage() {
  const router = useRouter();
  const { hasPermission } = useAuth();
  const canCreate = hasPermission("policies:create");

  const { createPolicy } = usePolicyMutations();

  const [policyType, setPolicyType] = useState<PolicyType | "">("");
  const [title, setTitle] = useState("");
  const [customSlug, setCustomSlug] = useState("");
  const [isSlugManual, setIsSlugManual] = useState(false);
  const [status, setStatus] = useState<"draft" | "active">("draft");
  const [isRequired, setIsRequired] = useState(true);
  const [contentHtml, setContentHtml] = useState("");
  const [contentJson, setContentJson] = useState<object>({
    type: "doc",
    content: [],
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saveError, setSaveError] = useState<string | null>(null);

  const autoSlug = toSlug(title);
  const currentSlug = isSlugManual ? customSlug : autoSlug;

  const extractText = (html: string) =>
    html
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();

  const handleTypeChange = (v: PolicyType) => {
    setPolicyType(v);
    setErrors((prev) => ({ ...prev, policyType: "" }));
    // If title is currently blank or was matching another type's default label, prefill
    if (!title.trim() || Object.values(POLICY_TYPE_LABELS).includes(title)) {
      setTitle(POLICY_TYPE_LABELS[v] || "");
    }
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!policyType) e.policyType = "Policy type is required";
    if (!title.trim()) e.title = "Title is required";
    if (title.length > 250) e.title = "Title cannot exceed 250 characters";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaveError(null);
    try {
      await createPolicy.mutateAsync({
        policyType,
        title: title.trim(),
        slug: currentSlug || undefined,
        status,
        contentHtml,
        contentJson,
        contentText: extractText(contentHtml),
        isRequired,
      });
      toast.success(`Policy "${title.trim()}" created successfully!`);
      router.push("/admin/policies");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to create policy";
      setSaveError(msg);
      toast.error(msg);
    }
  };

  if (!canCreate) {
    return (
      <div className="py-16 text-center max-w-md mx-auto space-y-4">
        <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-foreground">Access Restricted</h2>
        <p className="text-sm text-muted-foreground">
          You do not have permission (`policies:create`) to author new employment policies.
        </p>
        <Button variant="outline" onClick={() => router.push("/admin/policies")}>
          Return to Policies List
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/admin/policies")}
            className="gap-1.5"
          >
            <ChevronLeft className="w-4 h-4" />
            Policies
          </Button>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">
            Create Policy
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/admin/policies")}
          >
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={createPolicy.isPending}
            className="gap-1.5"
          >
            {createPolicy.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {createPolicy.isPending ? "Creating…" : "Create Policy"}
          </Button>
        </div>
      </div>

      {/* Info card */}
      <Card className="p-6 space-y-5">
        <h2 className="text-base font-semibold text-foreground">
          Policy Metadata &amp; Configuration
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">
              Policy Type <span className="text-red-500">*</span>
            </label>
            <Select value={policyType} onValueChange={handleTypeChange}>
              <SelectTrigger className={errors.policyType ? "border-red-500" : ""}>
                <SelectValue placeholder="Select policy classification" />
              </SelectTrigger>
              <SelectContent>
                {POLICY_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {POLICY_TYPE_LABELS[t]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.policyType && (
              <p className="text-xs text-red-600 mt-1">{errors.policyType}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">
              Title <span className="text-red-500">*</span>
            </label>
            <Input
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                setErrors({ ...errors, title: "" });
              }}
              placeholder='e.g., "Terms and Conditions" or "Information Security"'
              className={errors.title ? "border-red-500" : ""}
            />
            {errors.title && (
              <p className="text-xs text-red-600 mt-1">{errors.title}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-sm font-medium">Slug</label>
              <button
                type="button"
                onClick={() => setIsSlugManual(!isSlugManual)}
                className="text-xs text-primary hover:underline"
              >
                {isSlugManual ? "Auto-generate" : "Customize"}
              </button>
            </div>
            <Input
              value={currentSlug}
              disabled={!isSlugManual}
              onChange={(e) => setCustomSlug(toSlug(e.target.value))}
              placeholder="policy-slug"
              className="font-mono text-xs"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Initial Status</label>
            <Select
              value={status}
              onValueChange={(v) => setStatus(v as "draft" | "active")}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Draft (Private until published)</SelectItem>
                <SelectItem value="active">Active (Published immediately)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-lg border border-border p-3.5 bg-muted/30">
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">
              Mandatory Acceptance (Required)
            </p>
            <p className="text-xs text-muted-foreground">
              When enabled, all employees must review and accept this policy to maintain compliant access.
            </p>
          </div>
          <Switch checked={isRequired} onCheckedChange={setIsRequired} />
        </div>
      </Card>

      {/* Editor card */}
      <Card className="p-4 2xl:p-6 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-foreground">
            Policy Legal Content &amp; Terms
          </h2>
          <span className="text-xs text-muted-foreground">
            Supports rich formatting, headings, lists, tables, and links
          </span>
        </div>
        <RichTextEditor
          value={contentHtml}
          onChange={setContentHtml}
          onChangeJson={setContentJson}
          placeholder="Enter the official text of this policy here..."
        />
      </Card>

      {/* Error banner */}
      {saveError && (
        <div className="rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-600 dark:text-red-400">
          {saveError}
        </div>
      )}

      {/* Bottom Actions */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <Button
          onClick={() => router.push("/admin/policies")}
          variant="outline"
          disabled={createPolicy.isPending}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          disabled={createPolicy.isPending}
          className="gap-2"
        >
          {createPolicy.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          {createPolicy.isPending ? "Creating Policy…" : "Create & Save Policy"}
        </Button>
      </div>
    </div>
  );
}
