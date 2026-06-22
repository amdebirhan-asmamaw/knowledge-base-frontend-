import type { ReactNode, CSSProperties } from "react";

// Consistent page section header: icon tile + title + optional subtitle/badge/action.

interface PageHeaderProps {
  icon: ReactNode;
  title: string;
  subtitle?: string;
  badge?: ReactNode;
  action?: ReactNode;
  iconStyle?: CSSProperties;
}

export function PageHeader({ icon, title, subtitle, badge, action, iconStyle }: PageHeaderProps) {
  return (
    <div className="flex items-start justify-between mb-8">
      <div className="flex items-center gap-3">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
          style={iconStyle ?? { background: "#eff6ff" }}
        >
          {icon}
        </div>
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-bold text-foreground">{title}</h1>
            {badge}
          </div>
          {subtitle && (
            <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>
          )}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
