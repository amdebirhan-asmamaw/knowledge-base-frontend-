'use client';

import { useState } from 'react';
import Link from 'next/link';
import { signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Menu, X, LogOut, LayoutDashboard, FileText, Folder } from 'lucide-react';
import { AppLogo } from '@/components/AppLogo';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const handleLogout = () => {
    signOut({ callbackUrl: '/admin' });
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside
        className={`${
          isSidebarOpen ? 'w-64' : 'w-0'
        } fixed lg:relative lg:w-64 h-screen bg-white border-r border-border overflow-y-auto transition-all duration-300 z-30`}
      >
        <div className="p-6">
          <div className="mb-8">
            <AppLogo variant="sidebar" href="/admin/dashboard" />
          </div>

          <nav className="space-y-2">
            <NavLink
              href="/admin/dashboard"
              icon={<LayoutDashboard className="w-5 h-5" />}
              label="Dashboard"
              onClick={() => setIsSidebarOpen(false)}
            />
            <NavLink
              href="/admin/content"
              icon={<FileText className="w-5 h-5" />}
              label="Manage Content"
              onClick={() => setIsSidebarOpen(false)}
            />
            <NavLink
              href="/admin/structure"
              icon={<Folder className="w-5 h-5" />}
              label="Manage Structure"
              onClick={() => setIsSidebarOpen(false)}
            />
          </nav>
        </div>

        {/* Logout Button */}
        <div className="absolute bottom-6 left-6 right-6">
          <Button onClick={handleLogout} variant="outline" className="w-full justify-start gap-2">
            <LogOut className="w-4 h-4" />
            Logout
          </Button>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 lg:hidden z-20"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Header */}
        <header className="sticky top-0 z-10 bg-white border-b border-border px-4 sm:px-6 py-4 flex items-center justify-between">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="lg:hidden p-2 hover:bg-secondary rounded-lg transition-colors"
          >
            {isSidebarOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>

          <h2 className="text-lg font-semibold text-foreground flex-1 ml-4 lg:ml-0">Admin Dashboard</h2>

          <Link href="/" target="_blank" className="text-sm text-primary hover:underline">
            View Site
          </Link>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-4 sm:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

interface NavLinkProps {
  href: string;
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
}

function NavLink({ href, icon, label, onClick }: NavLinkProps) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="flex items-center gap-3 px-4 py-2 rounded-lg text-foreground hover:bg-secondary transition-colors group"
    >
      <span className="text-muted-foreground group-hover:text-primary transition-colors">{icon}</span>
      <span className="text-sm">{label}</span>
    </Link>
  );
}
