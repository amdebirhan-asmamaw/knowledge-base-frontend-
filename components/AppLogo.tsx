"use client";

import Link from "next/link";
import Image from "next/image";
import { Brain, BookOpen, Sparkles, Shield, Lock, Layers, Truck, Package } from "lucide-react";
import { appConfig } from "@/config/app.config";
import { cn } from "@/lib/utils";

export type LogoVariant =
  | "header"
  | "sidebar"
  | "footer"
  | "auth"
  | "admin"
  | "icon-only"
  | "text-only";

export type LogoSize = "sm" | "md" | "lg" | "xl";

export interface AppLogoProps {
  /** Logo display variant */
  variant?: LogoVariant;
  /** Size modifier */
  size?: LogoSize;
  /** Custom destination href. Pass empty string or null to render without Link */
  href?: string | null;
  /** Override the displayed title */
  title?: string;
  /** Override the displayed subtitle */
  subtitle?: string;
  /** Custom CSS classes for the container */
  className?: string;
  /** Custom CSS classes for the icon container / element */
  iconClassName?: string;
  /** Custom CSS classes for the text label */
  textClassName?: string;
  /** Invert colors for dark backgrounds (e.g. footer) */
  inverted?: boolean;
  /** Custom icon override */
  icon?: "brain" | "book" | "sparkles" | "shield" | "lock" | "layers" | "truck" | "package";
}

const ICON_MAP = {
  brain: Brain,
  book: BookOpen,
  sparkles: Sparkles,
  shield: Shield,
  lock: Lock,
  layers: Layers,
  truck: Truck,
  package: Package,
};

const ICON_SIZES: Record<LogoSize, string> = {
  sm: "w-4 h-4",
  md: "w-6 h-6",
  lg: "w-8 h-8",
  xl: "w-10 h-10",
};

const CONTAINER_SIZES: Record<LogoSize, string> = {
  sm: "w-7 h-7 rounded-lg",
  md: "w-9 h-9 rounded-xl",
  lg: "w-12 h-12 rounded-2xl",
  xl: "w-16 h-16 rounded-2xl",
};

export function AppLogo({
  variant = "header",
  size = "md",
  href,
  title,
  subtitle,
  className,
  iconClassName,
  textClassName,
  inverted = false,
  icon,
}: AppLogoProps) {
  const displayTitle = title || (variant === "admin" ? appConfig.admin.title : appConfig.name);
  const displaySubtitle =
    subtitle ||
    (variant === "admin"
      ? appConfig.admin.managementText
      : variant === "sidebar"
      ? appConfig.admin.subtitle
      : variant === "auth"
      ? "Sign in to your account"
      : undefined);

  // Determine default target link based on variant
  const defaultHref =
    href !== undefined
      ? href
      : variant === "sidebar" || variant === "admin"
      ? "/admin/dashboard"
      : variant === "auth"
      ? null
      : "/";

  // Select appropriate icon
  const iconKey = (icon || appConfig.logo.icon || "brain") as keyof typeof ICON_MAP;
  const IconComponent = ICON_MAP[iconKey] || Brain;

  const renderIcon = (customSize?: string, customBoxSize?: string) => {
    if (appConfig.logo.imageSrc) {
      return (
        <div
          className={cn(
            "relative shrink-0 overflow-hidden flex items-center justify-center",
            customBoxSize || CONTAINER_SIZES[size],
            iconClassName
          )}
        >
          <Image
            src={appConfig.logo.imageSrc}
            alt={appConfig.logo.alt || displayTitle}
            fill
            className="object-contain"
          />
        </div>
      );
    }

    if (variant === "header") {
      return (
        <IconComponent
          className={cn(customSize || ICON_SIZES[size], "text-primary shrink-0", iconClassName)}
        />
      );
    }

    if (variant === "footer") {
      return (
        <div
          className={cn(
            "w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors shadow-sm",
            iconClassName
          )}
          style={{ background: "#2563eb" }}
        >
          <IconComponent className="h-5 w-5 text-white" />
        </div>
      );
    }

    if (variant === "sidebar") {
      return (
        <div
          className={cn(
            "flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shrink-0 shadow-xs",
            iconClassName
          )}
        >
          <IconComponent className="size-4" />
        </div>
      );
    }

    if (variant === "auth") {
      return (
        <div
          className={cn(
            "inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-primary/10 mb-4 shadow-sm",
            iconClassName
          )}
        >
          <IconComponent className="w-6 h-6 text-primary" />
        </div>
      );
    }

    if (variant === "admin") {
      return (
        <div
          className={cn(
            "w-12 h-12 rounded-xl bg-primary flex items-center justify-center shadow-lg mb-4",
            iconClassName
          )}
        >
          <Lock className="w-6 h-6 text-primary-foreground" />
        </div>
      );
    }

    // Default icon container
    return (
      <div
        className={cn(
          "flex items-center justify-center shrink-0 bg-primary/10 text-primary",
          customBoxSize || CONTAINER_SIZES[size],
          iconClassName
        )}
      >
        <IconComponent className={cn(customSize || ICON_SIZES[size])} />
      </div>
    );
  };

  const content = (() => {
    switch (variant) {
      case "icon-only":
        return renderIcon();

      case "text-only":
        return (
          <span
            className={cn(
              "font-semibold tracking-tight text-foreground",
              inverted && "text-white",
              textClassName
            )}
          >
            {displayTitle}
          </span>
        );

      case "header":
        return (
          <div className={cn("flex items-center gap-2 shrink-0 group select-none", className)}>
            {renderIcon()}
            <span
              className={cn(
                "text-xl font-semibold text-foreground tracking-tight transition-colors group-hover:text-primary",
                textClassName
              )}
            >
              {displayTitle}
            </span>
          </div>
        );

      case "footer":
        return (
          <div className={cn("inline-flex items-center gap-2.5 group select-none", className)}>
            {renderIcon()}
            <span
              className={cn(
                "text-lg font-semibold text-white tracking-tight transition-colors group-hover:text-blue-400",
                textClassName
              )}
            >
              {displayTitle}
            </span>
          </div>
        );

      case "sidebar":
        return (
          <div className={cn("flex items-center gap-2.5 w-full text-left", className)}>
            {renderIcon()}
            <div className="flex flex-col gap-0.5 leading-none min-w-0">
              <span className={cn("font-semibold text-sm truncate", textClassName)}>
                {displayTitle}
              </span>
              {displaySubtitle && (
                <span className="text-xs text-muted-foreground truncate">
                  {displaySubtitle}
                </span>
              )}
            </div>
          </div>
        );

      case "auth":
        return (
          <div className={cn("text-center mb-8", className)}>
            {renderIcon()}
            <h1 className={cn("text-2xl font-bold text-foreground tracking-tight", textClassName)}>
              {displayTitle}
            </h1>
            {displaySubtitle && (
              <p className="text-sm text-muted-foreground mt-1">{displaySubtitle}</p>
            )}
          </div>
        );

      case "admin":
        return (
          <div className={cn("mb-8 text-center", className)}>
            <div className="flex items-center justify-center">{renderIcon()}</div>
            <h1 className={cn("text-3xl font-bold text-foreground mb-1", textClassName)}>
              {displayTitle}
            </h1>
            {displaySubtitle && (
              <p className="text-muted-foreground text-sm">{displaySubtitle}</p>
            )}
          </div>
        );

      default:
        return (
          <div className={cn("flex items-center gap-2", className)}>
            {renderIcon()}
            <span className={cn("font-semibold text-foreground", textClassName)}>
              {displayTitle}
            </span>
          </div>
        );
    }
  })();

  if (defaultHref) {
    return (
      <Link href={defaultHref} className="inline-block transition-opacity hover:opacity-95">
        {content}
      </Link>
    );
  }

  return content;
}

export default AppLogo;
