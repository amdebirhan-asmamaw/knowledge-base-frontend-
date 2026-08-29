import { API_BASE_URL } from "@/config/app.config";

export function resolveFileUrl(url?: string | null): string {
  if (!url) return "";
  // Absolute, object and inline URLs are already resolvable as-is.
  if (
    url.startsWith("http://") ||
    url.startsWith("https://") ||
    url.startsWith("blob:") ||
    url.startsWith("data:")
  ) {
    return url;
  }
  const base = API_BASE_URL.replace(/\/api\/v1\/?$/, "");
  return `${base}${url.startsWith("/") ? "" : "/"}${url}`;
}

export function formatFileSize(bytes?: number | null): string {
  if (!bytes || bytes <= 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export type FileCategory = "pdf" | "image" | "word" | "excel" | "code" | "document";

export function getFileCategory(mimeOrNameOrUrl?: string | null): FileCategory {
  if (!mimeOrNameOrUrl) return "document";
  const str = mimeOrNameOrUrl.toLowerCase();

  if (str.includes("pdf") || str.endsWith(".pdf")) return "pdf";
  if (
    str.includes("image") ||
    str.endsWith(".jpg") ||
    str.endsWith(".jpeg") ||
    str.endsWith(".png") ||
    str.endsWith(".webp") ||
    str.endsWith(".gif") ||
    str.endsWith(".svg")
  ) {
    return "image";
  }
  if (
    str.includes("word") ||
    str.includes("doc") ||
    str.endsWith(".doc") ||
    str.endsWith(".docx")
  ) {
    return "word";
  }
  if (
    str.includes("excel") ||
    str.includes("sheet") ||
    str.includes("csv") ||
    str.endsWith(".xls") ||
    str.endsWith(".xlsx") ||
    str.endsWith(".csv")
  ) {
    return "excel";
  }
  if (
    str.includes("json") ||
    str.includes("text") ||
    str.endsWith(".txt") ||
    str.endsWith(".json") ||
    str.endsWith(".md")
  ) {
    return "code";
  }
  return "document";
}

export function getFileExtension(filename?: string | null): string {
  if (!filename) return "";
  const parts = filename.split("?")[0].split(".");
  return parts.length > 1 ? parts.pop()!.toLowerCase() : "";
}
