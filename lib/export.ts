// ─── Reusable Export Utilities ─────────────────────────────────────────────────
// Generic helpers for exporting content (HTML, PDF via print, plain text, Word-like).
// All functions are client-only — they rely on `window` / `document`.

import { appConfig } from "@/config/app.config";

/* ── Types ──────────────────────────────────────────────────── */

export interface ExportMetaItem {
  label: string;
  value: string;
}

export interface ExportBadge {
  text: string;
  /** CSS color string (e.g. "#1d4ed8") */
  color: string;
  /** CSS bg color string (e.g. "#eff6ff") */
  bg: string;
}

export interface ExportDocumentOptions {
  /** Document title — used as both the page title and visible heading */
  title: string;
  /** HTML string to render as the main body */
  content: string;
  /** Optional secondary HTML section (e.g. "Next Plan") */
  sections?: { label: string; html: string }[];
  /** Key-value metadata shown under the title (Author, Department, etc.) */
  meta?: ExportMetaItem[];
  /** Badges rendered next to the title */
  badges?: ExportBadge[];
  /** Footer text override. Defaults to "Generated on <timestamp>" */
  footer?: string;
  /** If true, auto-triggers print dialog (for PDF export) */
  autoPrint?: boolean;
  /** Document type shown in the brand bar (e.g. "Task Report"). */
  documentType?: string;
  /** Brand name shown in the header/footer. Defaults to appConfig.export.brandName. */
  brandName?: string;
  /** Accent color (CSS). Defaults to appConfig.export.accentColor. */
  accentColor?: string;
}

/* ── Shared print-ready stylesheet ──────────────────────────── */

const buildPrintStyles = (accent: string) => `
  :root { --accent: ${accent}; }
  * { margin: 0; padding: 0; box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  @page { size: A4; margin: 18mm 16mm; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    color: #1a1a2e;
    padding: 32px;
    max-width: 800px;
    margin: 0 auto;
    line-height: 1.7;
    overflow-wrap: anywhere;
    word-break: break-word;
  }
  .brandbar {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.5px;
    color: var(--accent);
    text-transform: uppercase;
    margin-bottom: 10px;
  }
  .brandbar .dot { width: 10px; height: 10px; border-radius: 3px; background: var(--accent); }
  .header {
    border-bottom: 2px solid var(--accent);
    padding-bottom: 20px;
    margin-bottom: 24px;
  }
  .title {
    font-size: 22px;
    font-weight: 700;
    margin-bottom: 8px;
    color: #0f172a;
  }
  .badges { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px; }
  .badge {
    display: inline-block;
    padding: 2px 10px;
    border-radius: 999px;
    font-size: 11px;
    font-weight: 600;
    text-transform: capitalize;
  }
  .meta { display: flex; flex-wrap: wrap; gap: 20px; font-size: 12px; color: #64748b; margin-top: 14px; }
  .meta-item { display: flex; align-items: center; gap: 4px; }
  .meta-value { color: #1a1a2e; font-weight: 600; margin-left: 4px; }
  .section { margin-top: 28px; }
  .section-label {
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 1px;
    font-weight: 700;
    color: #94a3b8;
    margin-bottom: 10px;
    padding-bottom: 6px;
    border-bottom: 1px solid #f1f5f9;
    break-after: avoid;
  }
  .content { font-size: 14px; }
  .content h1, .content h2, .content h3 { margin-top: 16px; margin-bottom: 8px; break-after: avoid; }
  .content p { margin-bottom: 8px; }
  .content ul, .content ol { margin-left: 20px; margin-bottom: 8px; }
  .content table { border-collapse: collapse; width: 100%; margin: 12px 0; table-layout: fixed; break-inside: avoid; }
  .content thead { display: table-header-group; }
  .content th, .content td { border: 1px solid #e2e8f0; padding: 6px 10px; font-size: 13px; text-align: left; overflow-wrap: anywhere; }
  .content th { background: #f8fafc; font-weight: 600; }
  .content img { max-width: 100%; max-height: 80vh; height: auto; object-fit: contain; border-radius: 6px; margin: 8px 0; break-inside: avoid; }
  .content blockquote { border-left: 3px solid var(--accent); padding: 8px 14px; background: #f8fafc; margin: 12px 0; font-style: italic; color: #475569; border-radius: 0 6px 6px 0; break-inside: avoid; }
  .content code { background: #f1f5f9; border-radius: 4px; padding: 1px 5px; font-size: 0.9em; }
  .content pre { background: #1e293b; border-radius: 8px; padding: 14px 18px; overflow-x: auto; margin: 12px 0; break-inside: avoid; }
  .content pre code { background: none; color: #e2e8f0; padding: 0; }
  .footer {
    margin-top: 40px;
    padding-top: 16px;
    border-top: 1px solid #e2e8f0;
    font-size: 11px;
    color: #94a3b8;
    text-align: center;
  }
  @media print {
    body { padding: 0; }
    .no-print { display: none !important; }
  }
`;

/* ── Build full HTML document ───────────────────────────────── */

function buildHtmlDocument(opts: ExportDocumentOptions): string {
  const timestamp = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const badgesHtml = opts.badges?.length
    ? `<div class="badges">${opts.badges
        .map((b) => `<span class="badge" style="background:${b.bg};color:${b.color}">${escapeHtml(b.text)}</span>`)
        .join("")}</div>`
    : "";

  const metaHtml = opts.meta?.length
    ? `<div class="meta">${opts.meta
        .map((m) => `<div class="meta-item">${escapeHtml(m.label)}:<span class="meta-value">${escapeHtml(m.value)}</span></div>`)
        .join("")}</div>`
    : "";

  const sectionsHtml = [
    `<div class="section">
      <div class="section-label">Content</div>
      <div class="content">${opts.content}</div>
    </div>`,
    ...(opts.sections || [])
      .filter((s) => s.html?.trim())
      .map(
        (s) => `<div class="section">
          <div class="section-label">${escapeHtml(s.label)}</div>
          <div class="content">${s.html}</div>
        </div>`
      ),
  ].join("\n");

  const brand = opts.brandName || appConfig.export.brandName;
  const accent = opts.accentColor || appConfig.export.accentColor;
  const footerText = opts.footer || `Generated on ${timestamp} · ${brand}`;

  const brandBarHtml = `<div class="brandbar"><span class="dot"></span>${escapeHtml(brand)}${
    opts.documentType ? ` · ${escapeHtml(opts.documentType)}` : ""
  }</div>`;

  const printScript = opts.autoPrint
    ? `<script>window.onload = function() { window.print(); }</script>`
    : "";

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(opts.title)}</title>
  <style>${buildPrintStyles(accent)}</style>
</head>
<body>
  <div class="header">
    ${brandBarHtml}
    <div class="title">${escapeHtml(opts.title)}</div>
    ${badgesHtml}
    ${metaHtml}
  </div>
  ${sectionsHtml}
  <div class="footer">${escapeHtml(footerText)}</div>
  ${printScript}
</body>
</html>`;
}

/* ── Public API ─────────────────────────────────────────────── */

/**
 * Opens a new window with a print-ready HTML document and triggers the print dialog.
 * The browser's "Save as PDF" option allows the user to save it as a PDF.
 */
export function exportToPdf(opts: ExportDocumentOptions): void {
  const w = window.open("", "_blank");
  if (!w) return;
  const html = buildHtmlDocument({ ...opts, autoPrint: true });
  w.document.write(html);
  w.document.close();
}

/**
 * Opens a preview of the document in a new tab without triggering print.
 * Useful for previewing before deciding to print/export.
 */
export function exportToHtml(opts: ExportDocumentOptions): void {
  const w = window.open("", "_blank");
  if (!w) return;
  const html = buildHtmlDocument({ ...opts, autoPrint: false });
  w.document.write(html);
  w.document.close();
}

/**
 * Exports content as a plain text file download.
 * Strips all HTML tags and returns clean text.
 */
export function exportToText(opts: { title: string; content: string; filename?: string }): void {
  const text = stripHtml(opts.content);
  const header = `${opts.title}\n${"=".repeat(opts.title.length)}\n\n`;
  downloadFile(header + text, opts.filename || `${slugify(opts.title)}.txt`, "text/plain");
}

/**
 * Exports HTML content as a standalone .html file download.
 */
export function exportToHtmlFile(opts: ExportDocumentOptions & { filename?: string }): void {
  const html = buildHtmlDocument({ ...opts, autoPrint: false });
  downloadFile(html, opts.filename || `${slugify(opts.title)}.html`, "text/html");
}

/**
 * Copies the plain-text version of the content to clipboard.
 * Returns true on success.
 */
export async function copyAsPlainText(content: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(stripHtml(content));
    return true;
  } catch {
    return false;
  }
}

/* ── Internal helpers ───────────────────────────────────────── */

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function stripHtml(html: string): string {
  const tmp = document.createElement("div");
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || "";
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 60);
}

function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: `${mimeType};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/* ── Format helpers (exported for consumer convenience) ─────── */

export function formatExportDate(d: string | Date): string {
  return new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/* ── Domain export: Task Report ─────────────────────────────── */

export interface ReportLike {
  title: string;
  content: string;
  nextPlan?: string | null;
  periodType: string;
  status: string;
  author?: { name?: string } | null;
  department?: { name?: string } | null;
  periodStart: string | Date;
  periodEnd: string | Date;
  createdAt: string | Date;
}

/** Centralized report → PDF export (browser print). Shared by admin + employee pages. */
export function exportReportToPdf(report: ReportLike, documentType = "Task Report"): void {
  exportToPdf({
    title: report.title,
    content: report.content,
    documentType,
    badges: [
      { text: report.periodType, color: "#1d4ed8", bg: "#eff6ff" },
      { text: report.status, color: "#047857", bg: "#ecfdf5" },
    ],
    meta: [
      { label: "Author", value: report.author?.name || "—" },
      { label: "Department", value: report.department?.name || "—" },
      { label: "Period", value: `${formatExportDate(report.periodStart)} — ${formatExportDate(report.periodEnd)}` },
      { label: "Created", value: formatExportDate(report.createdAt) },
    ],
    sections: report.nextPlan ? [{ label: "Next Plan", html: report.nextPlan }] : [],
  });
}
