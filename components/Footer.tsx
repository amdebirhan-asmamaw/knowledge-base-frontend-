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
    <footer className="print:hidden border-t border-emerald-950/40" style={{ background: "#051610", color: "#94a3b8" }}>
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-12 md:grid-cols-[1.5fr_1fr_1fr]">
          {/* Brand */}
          <div>
            <div className="mb-5">
              <AppLogo variant="footer" />
            </div>
            <p className="text-sm leading-6 max-w-xs mb-4" style={{ color: "#64748b" }}>
              {appConfig.company.footerDescription}
            </p>

            <div className="space-y-2 text-xs" style={{ color: "#94a3b8" }}>
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>{appConfig.company.phone}</span>
              </div>
              <div className="flex items-start gap-2">
                <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <span className="leading-snug">{appConfig.company.address}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>{appConfig.company.workingHours}</span>
              </div>
            </div>

            <div className="mt-6 pt-5 border-t" style={{ borderColor: "#133527" }}>
              <p className="text-xs flex items-center gap-2" style={{ color: "#64748b" }}>
                <BookOpen className="w-3.5 h-3.5 shrink-0" style={{ color: "#10b981" }} />
                Keep information accurate and up to date.
              </p>
            </div>
          </div>

          {/* Knowledge links */}
          <div>
            <h3 className="text-sm font-semibold text-white mb-5 tracking-wide uppercase" style={{ letterSpacing: "0.06em", fontSize: "0.7rem" }}>
              Knowledge
            </h3>
            <ul className="space-y-3.5">
              {appConfig.navLinks.footerKnowledge.map(({ label, href, icon }) => {
                const Icon = ICON_MAP[icon] || FileText;
                return (
                  <li key={href}>
                    <Link
                      href={href}
                      className="inline-flex items-center gap-2.5 text-sm transition-colors hover:text-emerald-300 group"
                      style={{ color: "#94a3b8" }}
                    >
                      <Icon className="w-3.5 h-3.5 shrink-0 transition-colors group-hover:text-emerald-400" style={{ color: "#10b981" }} />
                      {label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Help links */}
          <div>
            <h3 className="text-sm font-semibold text-white mb-5 uppercase" style={{ letterSpacing: "0.06em", fontSize: "0.7rem" }}>
              Help & Support
            </h3>
            <ul className="space-y-3.5">
              {appConfig.navLinks.footerSupport.map(({ label, href, icon }) => {
                const Icon = ICON_MAP[icon] || MessageCircle;
                return (
                  <li key={href}>
                    <Link
                      href={href}
                      className="inline-flex items-center gap-2.5 text-sm transition-colors hover:text-emerald-300 group"
                      style={{ color: "#94a3b8" }}
                    >
                      <Icon className="w-3.5 h-3.5 shrink-0 transition-colors group-hover:text-emerald-400" style={{ color: "#10b981" }} />
                      {label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div
          className="mt-12 pt-6 border-t flex flex-col sm:flex-row items-center justify-between gap-3 text-xs"
          style={{ borderColor: "#133527", color: "#64748b" }}
        >
          <span>© {new Date().getFullYear()} {appConfig.company.name}. {appConfig.company.copyrightText}</span>
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-emerald-400/90 font-medium">All systems operational</span>
          </span>
        </div>
      </div>
    </footer>
  );
}

