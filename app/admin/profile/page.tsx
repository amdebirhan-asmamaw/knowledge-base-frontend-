"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import {
  type MyProfile,
} from "@/lib/api/profile.api";
import { useProfile, useProfileMutations } from "@/hooks/queries";
import { PERMISSION_LABELS } from "@/lib/permissions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  User,
  Mail,
  Briefcase,
  Building2,
  Shield,
  ShieldCheck,
  KeyRound,
  Save,
  X,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Calendar,
  Users,
  Edit3,
  Eye,
  EyeOff,
  Lock,
} from "lucide-react";

// ─── Avatar Hero ──────────────────────────────────────────────────────────────

const AVATAR_COLORS = [
  "from-teal-500 to-emerald-600",
  "from-violet-500 to-purple-600",
  "from-blue-500 to-cyan-600",
  "from-amber-500 to-orange-600",
  "from-rose-500 to-pink-600",
];

function HeroAvatar({ name, email }: { name: string; email: string }) {
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
  const colorIdx = name.charCodeAt(0) % AVATAR_COLORS.length;

  return (
    <div
      className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${AVATAR_COLORS[colorIdx]} flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-teal-500/15 shrink-0`}
      style={{ animationDelay: "0.1s" }}
    >
      {initials}
    </div>
  );
}

// ─── Password Strength ────────────────────────────────────────────────────────

function PasswordStrength({ password }: { password: string }) {
  if (!password) return null;

  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  const labels = ["Very Weak", "Weak", "Fair", "Good", "Strong"];
  const colors = [
    "bg-red-500",
    "bg-orange-500",
    "bg-amber-500",
    "bg-teal-500",
    "bg-emerald-500",
  ];
  const level = Math.min(score, 4);

  return (
    <div className="space-y-1.5">
      <div className="flex gap-1">
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-all duration-300 ${
              i <= level ? colors[level] : "bg-gray-200"
            }`}
          />
        ))}
      </div>
      <p
        className={`text-xs font-medium ${
          level <= 1
            ? "text-red-600"
            : level <= 2
              ? "text-amber-600"
              : "text-emerald-600"
        }`}
      >
        {labels[level]}
      </p>
    </div>
  );
}

// ─── Profile Information Section ──────────────────────────────────────────────

function ProfileSection({
  profile,
  onRefresh,
}: {
  profile: MyProfile;
  onRefresh: () => void;
}) {
  const { updateMyProfile } = useProfileMutations();
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({ name: profile.name, position: profile.position });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSave = async () => {
    if (!form.name.trim()) return;
    setIsSaving(true);
    setError(null);
    try {
      await updateMyProfile.mutateAsync({
        name: form.name.trim(),
        position: form.position.trim(),
      });
      onRefresh();
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setIsEditing(false);
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setForm({ name: profile.name, position: profile.position });
    setIsEditing(false);
    setError(null);
  };

  return (
    <Card className="overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-secondary/30">
        <div className="flex items-center gap-2">
          <User className="w-4 h-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold">Profile Information</h2>
        </div>
        {!isEditing && (
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs gap-1.5 hover:bg-teal-50 hover:border-teal-300 hover:text-teal-700 transition-colors"
            onClick={() => setIsEditing(true)}
          >
            <Edit3 className="w-3 h-3" /> Edit
          </Button>
        )}
      </div>

      <div className="p-6 space-y-5">
        {/* Name */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Full Name
          </label>
          {isEditing ? (
            <Input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Your full name"
              autoFocus
              className="transition-all"
            />
          ) : (
            <p className="text-sm font-medium text-foreground">{profile.name}</p>
          )}
        </div>

        {/* Email — always read-only */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1">
            Email <Lock className="w-2.5 h-2.5" />
          </label>
          <div className="flex items-center gap-2 text-sm text-foreground">
            <Mail className="w-3.5 h-3.5 text-muted-foreground" />
            {profile.email}
          </div>
        </div>

        {/* Position */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Position
          </label>
          {isEditing ? (
            <Input
              value={form.position}
              onChange={(e) => setForm((f) => ({ ...f, position: e.target.value }))}
              placeholder="e.g. Senior Account Manager"
              className="transition-all"
            />
          ) : (
            <p className="text-sm text-foreground">
              {profile.position || (
                <span className="text-muted-foreground italic">Not set</span>
              )}
            </p>
          )}
        </div>

        {/* Department — read-only */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1">
            Department <Lock className="w-2.5 h-2.5" />
          </label>
          <div className="flex items-center gap-2 text-sm text-foreground">
            <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
            {profile.department?.name || (
              <span className="text-muted-foreground italic">Unassigned</span>
            )}
          </div>
        </div>

        {/* Error / Success */}
        {error && (
          <div className="flex items-center gap-1.5 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 animate-in fade-in duration-200">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            {error}
          </div>
        )}
        {success && (
          <div className="flex items-center gap-1.5 text-sm text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2 animate-in fade-in duration-200">
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
            Profile updated successfully
          </div>
        )}

        {/* Action buttons */}
        {isEditing && (
          <div className="flex gap-2 pt-1 animate-in fade-in slide-in-from-bottom-1 duration-200">
            <Button
              onClick={handleSave}
              disabled={!form.name.trim() || isSaving}
              className="gap-1.5"
              size="sm"
            >
              {isSaving ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Save className="w-3.5 h-3.5" />
              )}
              Save Changes
            </Button>
            <Button variant="outline" size="sm" onClick={handleCancel}>
              <X className="w-3.5 h-3.5 mr-1" /> Cancel
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}

// ─── Security Section ─────────────────────────────────────────────────────────

function SecuritySection() {
  const { changeMyPassword } = useProfileMutations();
  const [isChanging, setIsChanging] = useState(false);
  const [form, setForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const passwordsMatch = form.newPassword === form.confirmPassword;
  const canSubmit =
    form.currentPassword.length >= 1 &&
    form.newPassword.length >= 8 &&
    passwordsMatch &&
    !isSaving;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setIsSaving(true);
    setError(null);
    try {
      await changeMyPassword.mutateAsync({
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      });
      setSuccess(true);
      setForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setTimeout(() => {
        setSuccess(false);
        setIsChanging(false);
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to change password");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className="overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-500" style={{ animationDelay: "0.1s" }}>
      <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-secondary/30">
        <div className="flex items-center gap-2">
          <KeyRound className="w-4 h-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold">Security</h2>
        </div>
        {!isChanging && (
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs gap-1.5 hover:bg-amber-50 hover:border-amber-300 hover:text-amber-700 transition-colors"
            onClick={() => setIsChanging(true)}
          >
            <KeyRound className="w-3 h-3" /> Change Password
          </Button>
        )}
      </div>

      <div className="p-6">
        {!isChanging ? (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
              <Shield className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">Password Protected</p>
              <p className="text-xs text-muted-foreground">
                Your account is secured with a password. Click &quot;Change Password&quot; to update it.
              </p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
            {/* Current Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Current Password
              </label>
              <div className="relative">
                <Input
                  type={showCurrent ? "text" : "password"}
                  value={form.currentPassword}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, currentPassword: e.target.value }))
                  }
                  placeholder="Enter current password"
                  autoFocus
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent(!showCurrent)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showCurrent ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                New Password
              </label>
              <div className="relative">
                <Input
                  type={showNew ? "text" : "password"}
                  value={form.newPassword}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, newPassword: e.target.value }))
                  }
                  placeholder="Min 8 characters, 1 uppercase, 1 number"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showNew ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              <PasswordStrength password={form.newPassword} />
            </div>

            {/* Confirm Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Confirm New Password
              </label>
              <Input
                type="password"
                value={form.confirmPassword}
                onChange={(e) =>
                  setForm((f) => ({ ...f, confirmPassword: e.target.value }))
                }
                placeholder="Re-enter new password"
              />
              {form.confirmPassword && !passwordsMatch && (
                <p className="text-xs text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> Passwords do not match
                </p>
              )}
            </div>

            {/* Error / Success */}
            {error && (
              <div className="flex items-center gap-1.5 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 animate-in fade-in duration-200">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                {error}
              </div>
            )}
            {success && (
              <div className="flex items-center gap-1.5 text-sm text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2 animate-in fade-in duration-200">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                Password changed successfully!
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 pt-1">
              <Button type="submit" disabled={!canSubmit} className="gap-1.5" size="sm">
                {isSaving ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <KeyRound className="w-3.5 h-3.5" />
                )}
                Update Password
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsChanging(false);
                  setForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
                  setError(null);
                }}
              >
                Cancel
              </Button>
            </div>
          </form>
        )}
      </div>
    </Card>
  );
}

// ─── Account Overview Section ─────────────────────────────────────────────────

function AccountOverview({ profile }: { profile: MyProfile }) {
  const permissionEntries = profile.permissions
    .map((p) => {
      const meta = PERMISSION_LABELS[p as keyof typeof PERMISSION_LABELS];
      return meta ? { key: p, ...meta } : null;
    })
    .filter(Boolean) as { key: string; label: string; description: string }[];

  const joinedDate = new Date(profile.createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <Card className="overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-500" style={{ animationDelay: "0.2s" }}>
      <div className="flex items-center gap-2 px-6 py-4 border-b border-border bg-secondary/30">
        <Shield className="w-4 h-4 text-muted-foreground" />
        <h2 className="text-sm font-semibold">Account Overview</h2>
      </div>

      <div className="p-6 space-y-5">
        {/* Quick stats row */}
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center p-3 rounded-xl bg-teal-50/60 border border-teal-100">
            <div className="flex items-center justify-center mb-1.5">
              <Shield className="w-4 h-4 text-teal-600" />
            </div>
            <p className="text-xs text-muted-foreground">Role</p>
            <p className="text-sm font-semibold text-foreground capitalize">{profile.role}</p>
          </div>
          <div className="text-center p-3 rounded-xl bg-violet-50/60 border border-violet-100">
            <div className="flex items-center justify-center mb-1.5">
              <Users className="w-4 h-4 text-violet-600" />
            </div>
            <p className="text-xs text-muted-foreground">Clients</p>
            <p className="text-sm font-semibold text-foreground">{profile.assignedClientsCount}</p>
          </div>
          <div className="text-center p-3 rounded-xl bg-blue-50/60 border border-blue-100">
            <div className="flex items-center justify-center mb-1.5">
              <Calendar className="w-4 h-4 text-blue-600" />
            </div>
            <p className="text-xs text-muted-foreground">Joined</p>
            <p className="text-sm font-semibold text-foreground">
              {new Date(profile.createdAt).toLocaleDateString("en-US", {
                month: "short",
                year: "numeric",
              })}
            </p>
          </div>
        </div>

        <Separator />

        {/* Permissions */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Permissions
            </p>
            <span className="text-xs text-muted-foreground">
              {permissionEntries.length} granted
            </span>
          </div>

          {hasPermission("employees:update:all") ? (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-violet-50 border border-violet-200">
              <ShieldCheck className="w-4 h-4 text-violet-600" />
              <div>
                <p className="text-sm font-medium text-violet-800">Super Administrator</p>
                <p className="text-xs text-violet-600">
                  You have full access to all system features.
                </p>
              </div>
            </div>
          ) : permissionEntries.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {permissionEntries.map((p) => (
                <Badge
                  key={p.key}
                  variant="secondary"
                  className="text-xs py-1 px-2.5 hover:bg-secondary/80 transition-colors cursor-default"
                  title={p.description}
                >
                  {p.label}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground italic">
              No specific permissions assigned. Contact an administrator.
            </p>
          )}
        </div>

        <Separator />

        {/* Member since */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="w-3.5 h-3.5" />
          Member since {joinedDate}
        </div>
      </div>
    </Card>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AdminProfilePage() {
  const { user } = useAuth();

  const {
    profile,
    isLoading,
    error,
    invalidate: invalidateProfile,
  } = useProfile();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-36 rounded-2xl bg-muted animate-pulse" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-72 rounded-xl bg-muted animate-pulse" />
          <div className="space-y-6">
            <div className="h-32 rounded-xl bg-muted animate-pulse" />
            <div className="h-64 rounded-xl bg-muted animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
        <AlertCircle className="w-4 h-4 shrink-0" />
        {error ?? "Could not load profile."}
        <Button variant="outline" size="sm" className="ml-auto" onClick={invalidateProfile}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Hero Header ─────────────────────────────────────────────────── */}
      <Card className="overflow-hidden animate-in fade-in slide-in-from-bottom-3 duration-500">
        {/* Gradient accent bar */}
        <div className="h-1.5 bg-gradient-to-r from-teal-500 via-emerald-400 to-teal-600" />

        <div className="p-6 sm:p-8">
          <div className="flex items-start gap-5">
            <HeroAvatar name={profile.name} email={profile.email} />
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h1 className="text-xl font-bold text-foreground tracking-tight">
                    {profile.name}
                  </h1>
                  <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-0.5">
                    <Mail className="w-3.5 h-3.5" />
                    {profile.email}
                  </p>
                  {(profile.position || profile.department?.name) && (
                    <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-0.5">
                      <Briefcase className="w-3.5 h-3.5" />
                      {[profile.position, profile.department?.name]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {hasPermission("employees:update:all") && (
                    <Badge
                      variant="secondary"
                      className="bg-violet-50 text-violet-700 border-violet-200 gap-1"
                    >
                      <ShieldCheck className="w-3 h-3" />
                      Super Admin
                    </Badge>
                  )}
                  <Badge
                    variant="secondary"
                    className="bg-teal-50 text-teal-700 border-teal-200 capitalize"
                  >
                    {profile.role}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* ── Content Grid ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left column — Profile Info */}
        <ProfileSection
          profile={profile}
          onRefresh={invalidateProfile}
        />

        {/* Right column — Security + Account */}
        <div className="space-y-6">
          <SecuritySection />
          <AccountOverview profile={profile} />
        </div>
      </div>
    </div>
  );
}
