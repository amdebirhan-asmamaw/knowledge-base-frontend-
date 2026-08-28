"use client";

import { useSession } from "next-auth/react";
import { type Permission, type Scope, hasScopePermission as checkScopePermission } from "@/lib/permissions";

export function useAuth() {
  const { data: session, status } = useSession();
  const user = session?.user ?? null;
  const isDepartmentHead = user?.isDepartmentHead === true;

  const hasPermission = (permission: string) => {
    return user?.permissions?.includes(permission) || false;
  };

  const hasScopePermission = (domain: string, action: string, scope: Scope = "own") => {
    return checkScopePermission(user?.permissions, domain, action, scope);
  };

  /** Whether the user can access the admin dashboard */
  const canAccessAdmin =
    user?.role !== "user" || isDepartmentHead || (user?.permissions?.length ?? 0) > 0;

  return {
    user,
    isAuthenticated: status === "authenticated",
    isLoading: status === "loading",
    isAdmin: user?.role === "admin",
    isDepartmentHead,
    canAccessAdmin,
    permissions: user?.permissions ?? [],
    hasPermission,
    hasScopePermission,
  };
}
