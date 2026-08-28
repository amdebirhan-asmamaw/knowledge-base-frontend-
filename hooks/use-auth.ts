"use client";

import { useSession } from "next-auth/react";
import { type Permission, type Scope, hasScopePermission as checkScopePermission } from "@/lib/permissions";

export function useAuth() {
  const { data: session, status } = useSession();
  const user = session?.user ?? null;
  const isDepartmentHead = user?.isDepartmentHead === true;

  const role = user?.role ?? null;
  const roleName = role?.name ?? "";
  const rolePermissions: string[] = role?.permissions ?? [];

  const hasPermission = (permission: string) => {
    return rolePermissions.includes(permission);
  };

  const hasScopePermission = (domain: string, action: string, scope: Scope = "own") => {
    return checkScopePermission(rolePermissions, domain, action, scope);
  };

  /** Whether the user can access the admin dashboard — all authenticated users */
  const canAccessAdmin = status === "authenticated";

  return {
    user,
    isAuthenticated: status === "authenticated",
    isLoading: status === "loading",
    isAdmin: rolePermissions.length > 0,
    roleName,
    role,
    isDepartmentHead,
    canAccessAdmin,
    permissions: rolePermissions,
    hasPermission,
    hasScopePermission,
  };
}
