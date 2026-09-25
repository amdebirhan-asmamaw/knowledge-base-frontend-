import Link from "next/link";
import {
  FileText,
  MessageCircle,
  ShieldCheck,
  BarChart2,
  ClipboardList,
  Lightbulb,
  BookOpen,
  Phone,
  MapPin,
  Clock,
} from "lucide-react";
import { AppLogo } from "@/components/AppLogo";
import { appConfig } from "@/config/app.config";

const ICON_MAP: Record<string, React.ElementType> = {
  BarChart2,
  ClipboardList,
  FileText,
  Lightbulb,
  MessageCircle,
  ShieldCheck,
  BookOpen,
};

export function Footer() {
  return (
    <footer className="print:hidden border-t border-brand-800/80 bg-brand-950 text-brand-100/70">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-12 md:grid-cols-[1.5fr_1fr_1fr]">
          {/* Brand */}
          <div>
            <div className="mb-5">
              <AppLogo variant="footer" />
            </div>
            <p className="text-sm leading-6 max-w-xs mb-4 text-brand-200/60">
              {appConfig.company.footerDescription}
            </p>

            <div className="space-y-2 text-xs text-brand-200/70">
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-brand-accent shrink-0" />
                <span>{appConfig.company.phone}</span>
              </div>
              <div className="flex items-start gap-2">
                <MapPin className="w-3.5 h-3.5 text-brand-accent shrink-0 mt-0.5" />
                <span className="leading-snug">{appConfig.company.address}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-brand-accent shrink-0" />
                <span>{appConfig.company.workingHours}</span>
              </div>
            </div>

            <div className="mt-6 pt-5 border-t border-brand-800/80">
              <p className="text-xs flex items-center gap-2 text-brand-200/60">
                <BookOpen className="w-3.5 h-3.5 shrink-0 text-brand-accent" />
                Keep information accurate and up to date.
              </p>
            </div>
          </div>

          {/* Knowledge links */}
          <div>
            <h3 className="text-sm font-semibold text-brand-50 mb-5 tracking-wide uppercase text-[0.7rem] tracking-[0.06em]">
              Knowledge
            </h3>
            <ul className="space-y-3.5">
              {appConfig.navLinks.footerKnowledge.map(({ label, href, icon }) => {
                const Icon = ICON_MAP[icon] || FileText;
                return (
                  <li key={href}>
                    <Link
                      href={href}
                      className="inline-flex items-center gap-2.5 text-sm transition-colors text-brand-200/70 hover:text-brand-accent group"
                    >
                      <Icon className="w-3.5 h-3.5 shrink-0 transition-colors text-brand-400 group-hover:text-brand-accent" />
                      {label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Help links */}
          <div>
            <h3 className="text-sm font-semibold text-brand-50 mb-5 uppercase text-[0.7rem] tracking-[0.06em]">
              Help & Support
            </h3>
            <ul className="space-y-3.5">
              {appConfig.navLinks.footerSupport.map(({ label, href, icon }) => {
                const Icon = ICON_MAP[icon] || MessageCircle;
                return (
                  <li key={href}>
                    <Link
                      href={href}
                      className="inline-flex items-center gap-2.5 text-sm transition-colors text-brand-200/70 hover:text-brand-accent group"
                    >
                      <Icon className="w-3.5 h-3.5 shrink-0 transition-colors text-brand-400 group-hover:text-brand-accent" />
                      {label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-6 border-t border-brand-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-brand-200/60">
          <span>© {new Date().getFullYear()} {appConfig.company.name}. {appConfig.company.copyrightText}</span>
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-brand-accent animate-pulse" />
            <span className="text-brand-accent font-medium">All systems operational</span>
          </span>
        </div>
      </div>
    </footer>
  );
}

