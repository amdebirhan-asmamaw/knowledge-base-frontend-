"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { signOut } from "next-auth/react";
import { useAuth } from "@/hooks/use-auth";

import { AdminAIProvider, useAdminAI } from "@/lib/admin-ai-context";
import { AdminChatInterface } from "@/components/AdminChatInterface";
import { PolicyGuard } from "@/components/PolicyGuard";
import { AppLogo } from "@/components/AppLogo";
import type { Permission } from "@/lib/permissions";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import {
  LayoutDashboard,
  FileText,
  Folder,
  LogOut,
  ExternalLink,
  Loader2,
  HelpCircle,
  Users,
  ShieldCheck,
  X,
  MessageSquare,
  UserCheck,
  Building2,
  BarChart3,
  CalendarCheck,
  ClipboardList,
  UserCircle,
  ScrollText,
  BookOpen,
  ChevronRight,
  Lightbulb,
} from "lucide-react";

// ─── Nav config (permission-gated, grouped) ─────────────────────────────────

interface NavSubItem {
  href: string;
  label: string;
  icon?: React.ElementType;
  permission?: Permission;
  scopePermission?: { domain: string; action: string };
}

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  permission?: Permission;
  scopePermission?: { domain: string; action: string };
  children?: NavSubItem[];
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    label: "Overview",
    items: [
      { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
    ],
  },
  {
    label: "Content",
    items: [
      {
        href: "/admin/structure",
        label: "Knowledge Base",
        icon: BookOpen,
        permission: "structure:read",
        children: [
          {
            href: "/admin/structure",
            label: "Categories & Sections",
            icon: Folder,
            permission: "structure:read",
          },
          {
            href: "/admin/content",
            label: "Documents",
            icon: FileText,
            scopePermission: { domain: "documents", action: "read" },
          },
        ],
      },
      {
        href: "/admin/faq",
        label: "FAQs",
        icon: HelpCircle,
        permission: "faq:read",
      },
      {
        href: "/admin/policies",
        label: "Policies",
        icon: ScrollText,
        permission: "policies:read",
      },
    ],
  },
  {
    label: "Organization",
    items: [
      {
        href: "/admin/employees",
        label: "Employees",
        icon: UserCheck,
        scopePermission: { domain: "employees", action: "read" },
      },
      {
        href: "/admin/roles",
        label: "Roles",
        icon: ShieldCheck,
        permission: "roles:read",
      },
      {
        href: "/admin/departments",
        label: "Departments",
        icon: Building2,
        permission: "departments:read",
      },
      {
        href: "/admin/clients",
        label: "Clients",
        icon: Users,
        scopePermission: { domain: "clients", action: "read" },
      },
    ],
  },
  {
    label: "Operations",
    items: [
      {
        href: "/admin/reports",
        label: "Reports",
        icon: BarChart3,
        scopePermission: { domain: "reports", action: "read" },
      },
      {
        href: "/admin/meetings",
        label: "Meeting Minutes",
        icon: CalendarCheck,
        scopePermission: { domain: "meetings", action: "read" },
      },
      {
        href: "/admin/surveys",
        label: "Surveys",
        icon: ClipboardList,
        scopePermission: { domain: "surveys", action: "read" },
      },
      {
        href: "/admin/initiatives",
        label: "Initiatives",
        icon: Lightbulb,
        scopePermission: { domain: "initiatives", action: "read" },
      },
    ],
  },
];

// ─── Admin Sidebar ────────────────────────────────────────────────────────────

function AdminSidebar() {
  const pathname = usePathname();
  const { open } = useAdminAI();
  const { hasPermission, hasScopePermission } = useAuth();

  const isItemVisible = (item: {
    permission?: Permission;
    scopePermission?: { domain: string; action: string };
  }) => {
    if (item.permission && !hasPermission(item.permission)) return false;
    if (
      item.scopePermission &&
      !hasScopePermission(item.scopePermission.domain, item.scopePermission.action, "own")
    )
      return false;
    return true;
  };

  // Auto-expand collapsible if any child is active
  const isKBActive =
    pathname.startsWith("/admin/structure") ||
    pathname.startsWith("/admin/content");
  const [kbOpen, setKbOpen] = useState(isKBActive);

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <AppLogo variant="sidebar" href="/admin/dashboard" />
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {navGroups.map((group) => {
          const visibleItems = group.items.filter(isItemVisible);
          if (visibleItems.length === 0) return null;
          return (
            <SidebarGroup key={group.label}>
              <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
              <SidebarMenu>
                {visibleItems.map((item) => {
                  const { href, label, icon: Icon, children } = item;

                  // ── Collapsible nested item ──
                  if (children && children.length > 0) {
                    const visibleChildren = children.filter(isItemVisible);
                    if (visibleChildren.length === 0) return null;

                    return (
                      <Collapsible
                        key={href}
                        asChild
                        open={kbOpen}
                        onOpenChange={setKbOpen}
                        className="group/collapsible"
                      >
                        <SidebarMenuItem>
                          <CollapsibleTrigger asChild>
                            <SidebarMenuButton
                              tooltip={label}
                              isActive={isKBActive}
                            >
                              <Icon className="size-4" />
                              <span>{label}</span>
                              <ChevronRight className="ml-auto size-4 shrink-0 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                            </SidebarMenuButton>
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <SidebarMenuSub>
                              {visibleChildren.map((child) => {
                                const childActive =
                                  pathname === child.href ||
                                  pathname.startsWith(child.href + "/");
                                return (
                                  <SidebarMenuSubItem key={child.href}>
                                    <SidebarMenuSubButton
                                      asChild
                                      isActive={childActive}
                                    >
                                      <Link href={child.href}>
                                        {child.icon && (
                                          <child.icon className="size-4" />
                                        )}
                                        <span>{child.label}</span>
                                      </Link>
                                    </SidebarMenuSubButton>
                                  </SidebarMenuSubItem>
                                );
                              })}
                            </SidebarMenuSub>
                          </CollapsibleContent>
                        </SidebarMenuItem>
                      </Collapsible>
                    );
                  }

                  // ── Regular flat item ──
                  const isActive =
                    pathname === href || pathname.startsWith(href + "/");
                  return (
                    <SidebarMenuItem key={href}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive}
                        tooltip={label}
                      >
                        <Link href={href}>
                          <Icon className="size-4" />
                          <span>{label}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroup>
          );
        })}

        {/* AI Assistant */}
        {hasPermission("ai:admin") && (
          <SidebarGroup>
            <SidebarGroupLabel>Tools</SidebarGroupLabel>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  tooltip="AI Assistant"
                  onClick={() => open()}
                >
                  <ShieldCheck className="size-4 text-violet-600" />
                  <span className="text-violet-700 font-medium">
                    AI Assistant
                  </span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="View public site">
              <Link href="/" target="_blank">
                <ExternalLink className="size-4" />
                <span>View Site</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Sign out"
              onClick={() => signOut({ callbackUrl: "/auth/login" })}
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <LogOut className="size-4" />
              <span>Sign Out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}

// ─── AI Chat Modal ────────────────────────────────────────────────────────────

function AIChatModal() {
  const { isOpen, prefill, close } = useAdminAI();

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isOpen, close]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm animate-in fade-in duration-150"
        onClick={close}
      />

      {/* Modal panel */}
      <div className="fixed bottom-6 right-6 z-50 w-[420px] max-w-[calc(100vw-1.5rem)] h-[600px] max-h-[calc(100vh-5rem)] flex flex-col rounded-2xl shadow-2xl border border-border bg-background overflow-hidden animate-in slide-in-from-bottom-4 fade-in duration-200">
        {/* Close button */}
        <button
          onClick={close}
          className="absolute top-3 right-3 z-10 w-7 h-7 flex items-center justify-center rounded-full bg-muted hover:bg-muted/80 transition-colors"
          aria-label="Close chat"
        >
          <X className="w-3.5 h-3.5 text-muted-foreground" />
        </button>

        <AdminChatInterface key={prefill} initialMessage={prefill} />
      </div>
    </>
  );
}

// ─── Floating action button ───────────────────────────────────────────────────

function AIFloatingButton() {
  const { isOpen, open } = useAdminAI();

  if (isOpen) return null;

  return (
    <button
      onClick={() => open()}
      aria-label="Open AI Assistant"
      className="fixed bottom-6 right-6 z-30 group flex items-center gap-2.5 pl-4 pr-5 py-3 rounded-full shadow-lg bg-violet-600 hover:bg-violet-700 text-white shadow-violet-500/25 hover:scale-105 hover:shadow-xl hover:shadow-violet-500/30 transition-all duration-200 select-none"
    >
      <div className="relative w-5 h-5 transition-transform duration-200 group-hover:rotate-12">
        <MessageSquare className="w-5 h-5" />
      </div>
      <span className="text-sm font-semibold tracking-wide">AI Assistant</span>
      <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full border-2 border-white animate-pulse" />
    </button>
  );
}

// ─── Access Denied UI ─────────────────────────────────────────────────────────

function AccessDenied() {
  return (
    <div className="flex flex-col items-center justify-center py-24 px-6 animate-in fade-in duration-300">
      <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mb-5">
        <ShieldCheck className="w-8 h-8 text-red-400" />
      </div>
      <h2 className="text-xl font-bold text-foreground">Access Denied</h2>
      <p className="text-sm text-muted-foreground mt-2 text-center max-w-sm">
        You don&apos;t have permission to access this page. Contact your
        administrator if you believe this is a mistake.
      </p>
      <Link
        href="/admin/dashboard"
        className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
      >
        <LayoutDashboard className="w-4 h-4" />
        Go to Dashboard
      </Link>
    </div>
  );
}

// ─── Route → Permission resolver ──────────────────────────────────────────────

function getRequiredPermission(pathname: string): Permission | null {
  for (const group of navGroups) {
    for (const item of group.items) {
      // Check children first (more specific matches)
      if (item.children) {
        for (const child of item.children) {
          if (
            pathname === child.href ||
            pathname.startsWith(child.href + "/")
          ) {
            return child.permission ?? null;
          }
        }
      }
      if (pathname === item.href || pathname.startsWith(item.href + "/")) {
        return item.permission ?? null;
      }
    }
  }
  return null; // no match = no restriction (dashboard, profile, etc.)
}

// ─── Guard + shell ────────────────────────────────────────────────────────────

function AdminShell({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, canAccessAdmin, isLoading, hasPermission } =
    useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) {
      router.replace("/auth/login");
    } else if (!canAccessAdmin) {
      // Logged in but not admin/superAdmin/deptHead → send to knowledge base
      router.replace("/");
    }
  }, [isLoading, isAuthenticated, canAccessAdmin, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex bg-background">
        {/* Sidebar skeleton */}
        <div className="hidden md:flex w-[260px] flex-col border-r border-border bg-background p-4 gap-6">
          {/* Logo */}
          <div className="flex items-center gap-3 px-2">
            <div className="w-8 h-8 rounded-lg bg-primary/15 skeleton-shimmer" />
            <div className="space-y-1.5 flex-1">
              <div className="h-3.5 w-24 rounded-md bg-muted skeleton-shimmer" />
              <div className="h-2.5 w-16 rounded-md bg-muted/60 skeleton-shimmer" />
            </div>
          </div>
          {/* Nav items */}
          <div className="space-y-1.5 mt-2">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg"
              >
                <div className="w-4 h-4 rounded bg-muted skeleton-shimmer" />
                <div
                  className="h-3 rounded-md bg-muted skeleton-shimmer"
                  style={{ width: `${50 + ((i * 12) % 40)}%` }}
                />
              </div>
            ))}
          </div>
          {/* Footer items */}
          <div className="mt-auto space-y-1.5">
            <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg">
              <div className="w-4 h-4 rounded bg-muted skeleton-shimmer" />
              <div className="h-3 w-20 rounded-md bg-muted skeleton-shimmer" />
            </div>
            <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg">
              <div className="w-4 h-4 rounded bg-muted skeleton-shimmer" />
              <div className="h-3 w-16 rounded-md bg-muted/60 skeleton-shimmer" />
            </div>
          </div>
        </div>

        {/* Main area */}
        <div className="flex-1 flex flex-col">
          {/* Header skeleton */}
          <div className="h-14 border-b border-border flex items-center px-4 gap-3">
            <div className="w-6 h-6 rounded bg-muted skeleton-shimmer" />
            <div className="w-px h-4 bg-border" />
            <div className="h-3 w-12 rounded-md bg-muted skeleton-shimmer" />
            <div className="ml-auto flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-muted skeleton-shimmer" />
              <div className="h-3 w-16 rounded-md bg-muted skeleton-shimmer hidden sm:block" />
            </div>
          </div>

          {/* Content skeleton */}
          <div className="flex-1 flex flex-col items-center justify-center gap-5 p-6">
            <div className="relative">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
              <div className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-emerald-400 rounded-full border-2 border-background animate-pulse" />
            </div>
            <div className="text-center space-y-1.5">
              <p className="text-sm font-medium text-foreground">
                Loading dashboard
              </p>
              <p className="text-xs text-muted-foreground">
                Verifying your credentials…
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !canAccessAdmin) return null;

  // Check if user has permission for the current page
  const requiredPermission = getRequiredPermission(pathname);
  const hasAccess = !requiredPermission || hasPermission(requiredPermission);

  return (
    <SidebarProvider>
      <AdminSidebar />
      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border px-4 sticky top-0 bg-background z-10">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="h-4 mx-2" />
          <span className="text-sm font-medium text-muted-foreground">
            Admin
          </span>
          <div className="ml-auto">
            <Link
              href="/admin/profile"
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors"
              title="My Profile"
            >
              <UserCircle className="w-5 h-5" />
              <span className="hidden sm:inline font-medium">
                {user?.name?.split(" ")[0] ?? "Profile"}
              </span>
            </Link>
          </div>
        </header>
        <main className="flex-1 overflow-auto p-4 sm:p-6">
          <div className="w-full max-w-[1750px] mx-auto">
            {hasAccess ? (
              <PolicyGuard>{children}</PolicyGuard>
            ) : (
              <AccessDenied />
            )}
          </div>
        </main>
      </SidebarInset>

      <AIFloatingButton />
      <AIChatModal />
    </SidebarProvider>
  );
}

// ─── Layout export ────────────────────────────────────────────────────────────

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminAIProvider>
      <AdminShell>{children}</AdminShell>
    </AdminAIProvider>
  );
}
