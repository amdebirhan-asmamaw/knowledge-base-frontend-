export interface AppConfig {
  /** Main application name (e.g. "Ahununu Express") */
  name: string;
  /** Short brand/acronym (e.g. "Ahununu") */
  shortName: string;
  /** Full browser page title default */
  title: string;
  /** Primary application tagline / hero title */
  tagline: string;
  /** High-level app description used for SEO and metadata */
  description: string;
  /** Subtitle displayed in hero and landing sections */
  heroSubtitle: string;

  /** Company & organization details */
  company: {
    name: string;
    fullName: string;
    website: string;
    supportEmail: string;
    phone: string;
    address: string;
    workingHours: string;
    coverage: string;
    copyrightText: string;
    footerDescription: string;
  };

  /** Admin portal branding & settings */
  admin: {
    title: string;
    subtitle: string;
    managementText: string;
    emailPlaceholder: string;
  };

  /** AI Assistant settings */
  ai: {
    assistantName: string;
    title: string;
    adminTitle: string;
    description: string;
    placeholder: string;
  };

  /** Export document branding defaults */
  export: {
    brandName: string;
    accentColor: string;
  };

  /** Brand logo configuration */
  logo: {
    icon: "brain" | "book" | "sparkles" | "truck" | "package" | "custom";
    imageSrc?: string;
    alt: string;
  };

  /** Main navigation links */
  navLinks: {
    header: Array<{ label: string; href: string }>;
    footerKnowledge: Array<{ label: string; href: string; icon: string }>;
    footerSupport: Array<{ label: string; href: string; icon: string }>;
  };
}

export const appConfig: AppConfig = {
  name: process.env.NEXT_PUBLIC_APP_NAME || "Ahununu Express",
  shortName: process.env.NEXT_PUBLIC_APP_SHORT_NAME || "Ahununu",
  title:
    process.env.NEXT_PUBLIC_APP_TITLE ||
    `${process.env.NEXT_PUBLIC_APP_NAME || "Ahununu Express"} - Knowledge Base`,
  tagline:
    process.env.NEXT_PUBLIC_APP_TAGLINE ||
    "Delivering Packages and Freight Across Ethiopia",
  description:
    process.env.NEXT_PUBLIC_APP_DESCRIPTION ||
    "Ahununu Express Knowledge Base & Internal Documentation Portal",
  heroSubtitle:
    process.env.NEXT_PUBLIC_APP_HERO_SUBTITLE ||
    "Operational procedures, transport policies, branch directories, meeting minutes, and logistics standards across Ahununu Express.",

  company: {
    name: process.env.NEXT_PUBLIC_COMPANY_NAME || "Ahununu Express",
    fullName:
      process.env.NEXT_PUBLIC_COMPANY_FULL_NAME || "Ahununu Trading PLC",
    website: process.env.NEXT_PUBLIC_COMPANY_WEBSITE || "https://ahununu.com",
    supportEmail:
      process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "info@ahununu.com",
    phone: process.env.NEXT_PUBLIC_COMPANY_PHONE || "Call 8414 or 0970025656",
    address:
      process.env.NEXT_PUBLIC_COMPANY_ADDRESS ||
      "Togo Street, near 22 and Veronika Hotel, Addis Ababa, Ethiopia",
    workingHours:
      process.env.NEXT_PUBLIC_WORKING_HOURS ||
      "Mon–Sat: 8:30 AM – 7:00 PM | Sun: 8:30 AM – 12:30 PM",
    coverage:
      process.env.NEXT_PUBLIC_COVERAGE ||
      "Connecting over 25 cities and destinations across Ethiopia",
    copyrightText:
      process.env.NEXT_PUBLIC_COPYRIGHT_TEXT ||
      "Internal knowledge base. All rights reserved.",
    footerDescription:
      process.env.NEXT_PUBLIC_FOOTER_DESC ||
      "Private logistics, courier, and cargo transport delivering packages and freight across Ethiopia with express mail and road cargo.",
  },

  admin: {
    title: process.env.NEXT_PUBLIC_ADMIN_TITLE || "Ahununu Express",
    subtitle: process.env.NEXT_PUBLIC_ADMIN_SUBTITLE || "Admin Portal",
    managementText:
      process.env.NEXT_PUBLIC_ADMIN_MGMT_TEXT ||
      "Ahununu Express Knowledge Base Management",
    emailPlaceholder:
      process.env.NEXT_PUBLIC_ADMIN_EMAIL_PLACEHOLDER || "admin@ahununu.com",
  },

  ai: {
    assistantName:
      process.env.NEXT_PUBLIC_AI_NAME || "Ahununu AI",
    title:
      process.env.NEXT_PUBLIC_AI_PAGE_TITLE ||
      `Ask AI — ${process.env.NEXT_PUBLIC_APP_NAME || "Ahununu Express"}`,
    adminTitle:
      process.env.NEXT_PUBLIC_AI_ADMIN_PAGE_TITLE ||
      "Internal AI Assistant — Ahununu Admin",
    description:
      process.env.NEXT_PUBLIC_AI_DESCRIPTION ||
      `AI assistant powered by the ${process.env.NEXT_PUBLIC_APP_NAME || "Ahununu Express"} knowledge base. Ask anything.`,
    placeholder:
      process.env.NEXT_PUBLIC_AI_PLACEHOLDER ||
      "Ask anything about Ahununu Express procedures, delivery policies, branches…",
  },

  export: {
    brandName: process.env.NEXT_PUBLIC_EXPORT_BRAND || "Ahununu Express",
    accentColor: process.env.NEXT_PUBLIC_EXPORT_ACCENT || "#2563eb",
  },

  logo: {
    icon:
      (process.env.NEXT_PUBLIC_LOGO_ICON as AppConfig["logo"]["icon"]) ||
      "truck",
    imageSrc: process.env.NEXT_PUBLIC_LOGO_IMAGE_SRC || "",
    alt: process.env.NEXT_PUBLIC_APP_NAME || "Ahununu Express",
  },

  navLinks: {
    header: [
      { label: "Home", href: "/" },
      { label: "Reports", href: "/reports" },
      { label: "Minutes", href: "/minutes" },
      { label: "Surveys", href: "/surveys" },
      { label: "Initiatives", href: "/initiatives" },
      { label: "Ask AI", href: "/ask-ai" },
    ],
    footerKnowledge: [
      { label: "Reports", href: "/reports", icon: "BarChart2" },
      { label: "Minutes", href: "/minutes", icon: "ClipboardList" },
      { label: "Surveys", href: "/surveys", icon: "FileText" },
      { label: "Initiatives", href: "/initiatives", icon: "Lightbulb" },
    ],
    footerSupport: [
      { label: "Ask AI", href: "/ask-ai", icon: "MessageCircle" },
      { label: "Policies", href: "/policy-acceptance", icon: "ShieldCheck" },
    ],
  },
};

export default appConfig;
