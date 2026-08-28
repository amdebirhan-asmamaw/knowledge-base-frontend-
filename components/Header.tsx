'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Brain, LayoutDashboard, LogOut, ChevronDown, User } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

const NAV_LINKS = [
  { label: 'Home', href: '/' },
  { label: 'Reports', href: '/reports' },
  { label: 'Minutes', href: '/minutes' },
  { label: 'Surveys', href: '/surveys' },
  { label: 'Initiatives', href: '/initiatives' },
  { label: 'Ask AI', href: '/ask-ai' },
];

interface HeaderProps {
  showNav?: boolean;
}

function UserMenu({ name, role }: { name: string; role: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const initials = name.split(' ').slice(0, 2).map((w) => w[0]?.toUpperCase()).join('');

  return (
    <div ref={ref} className="relative ml-4">
      <button
        onClick={() => setOpen((s) => !s)}
        className="flex items-center gap-2 h-9 pl-2 pr-3 rounded-full border border-border bg-secondary/60 hover:bg-secondary transition-colors text-sm font-medium"
        aria-label="User menu"
      >
        {/* Avatar */}
        <span className="w-6 h-6 rounded-full bg-primary/20 text-primary text-xs font-semibold flex items-center justify-center shrink-0">
          {initials || <User className="w-3.5 h-3.5" />}
        </span>
        <span className="hidden sm:block max-w-[140px] truncate text-foreground">{name}</span>
        <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-52 rounded-xl border border-border bg-white shadow-lg py-1.5 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
          {/* User info */}
          <div className="px-3 py-2 border-b border-border mb-1">
            <p className="text-xs font-semibold text-foreground truncate">{name}</p>
            <p className="text-xs text-muted-foreground capitalize">{role || 'Employee'}</p>
          </div>

          {/* Dashboard link */}
          <Link
            href="/admin/dashboard"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-foreground hover:bg-secondary/70 transition-colors"
          >
            <LayoutDashboard className="w-4 h-4 text-primary shrink-0" />
            Dashboard
          </Link>

          {/* Sign out */}
          <button
            onClick={() => signOut({ callbackUrl: '/auth/login' })}
            className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
}

export function Header({ showNav = true }: HeaderProps) {
  const pathname = usePathname();
  const { data: session, status } = useSession();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 w-full bg-white/80 backdrop-blur-md border-b border-border shadow-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <Brain className="h-6 w-6 text-primary" />
            <span className="text-xl font-semibold text-foreground tracking-tight">
              Blih Brain
            </span>
          </Link>

          {/* Nav links */}
          {showNav && (
            <nav className="hidden md:flex items-center gap-1">
              {NAV_LINKS.map(({ label, href }) => {
                const isActive = href === '/' ? pathname === '/' : pathname.startsWith(href);
                return (
                  <Link
                    key={href}
                    href={href}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                      isActive
                        ? 'text-primary bg-primary/8'
                        : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                    }`}
                  >
                    {label}
                  </Link>
                );
              })}
            </nav>
          )}

          {/* Auth area */}
          {status === 'loading' ? (
            // Prevents layout shift while session resolves
            <div className="ml-4 w-24 h-9 rounded-full bg-secondary animate-pulse" />
          ) : session ? (
            <UserMenu name={session.user?.name ?? session.user?.email ?? 'User'} role={session.user?.role?.name ?? 'user'} />
          ) : (
            <Button asChild size="sm" className="ml-4 shrink-0">
              <Link href="/auth/login">Login</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
