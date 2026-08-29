"use client";

import { useState } from "react";
import Image from "next/image";
import {
  FileText,
  FileSpreadsheet,
  Download,
  ExternalLink,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  resolveFileUrl,
  getFileCategory,
  formatFileSize,
} from "@/lib/utils/file.util";
import { Spinner } from "@/components/ui/spinner";

export interface InlineFileViewerProps {
  url?: string | null;
  fileName?: string | null;
  fileSize?: number | null;
  mimeType?: string | null;
  className?: string;
  maxHeight?: string;
}

export function InlineFileViewer({
  url,
  fileName,
  fileSize,
  mimeType,
  className = "",
  maxHeight = "h-[65vh]",
}: InlineFileViewerProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [useGoogleDocs, setUseGoogleDocs] = useState(true);

  const fullUrl = resolveFileUrl(url);
  const category = getFileCategory(mimeType || fileName || url);
  const displayName = fileName || (url ? url.split("/").pop() : "Document");

  if (!fullUrl) {
    return (
      <div
        className={`flex flex-col items-center justify-center p-8 bg-muted/20 border border-dashed border-border rounded-xl text-center ${className}`}
      >
        <FileText className="w-10 h-10 text-muted-foreground mb-2" />
        <p className="text-sm font-medium text-foreground">No file attached</p>
        <p className="text-xs text-muted-foreground mt-1">
          Please provide or upload a valid document.
        </p>
      </div>
    );
  }

  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = fullUrl;
    link.download = displayName || "download";
    link.target = "_blank";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleOpenNewTab = () => {
    window.open(fullUrl, "_blank", "noopener,noreferrer");
  };

  const isRemote =
    fullUrl.startsWith("http://") || fullUrl.startsWith("https://");
  const googleViewerUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(fullUrl)}&embedded=true`;
  const activeUrl = useGoogleDocs && isRemote ? googleViewerUrl : fullUrl;

  // PDF Inline Viewer
  if (category === "pdf" || (isRemote && (category === "word" || category === "excel"))) {
    return (
      <div
        className={`relative flex flex-col w-full bg-background border border-border rounded-xl overflow-hidden ${className}`}
      >
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-xs z-10">
            <div className="flex flex-col items-center gap-2">
              <Spinner className="w-6 h-6 text-primary" />
              <p className="text-xs text-muted-foreground font-medium">
                Loading document preview...
              </p>
            </div>
          </div>
        )}

        <div className="absolute top-2 right-2 z-20 flex items-center gap-1.5 bg-background/90 p-1 rounded-lg border border-border/80 shadow-xs">
          {isRemote && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setIsLoading(true);
                setUseGoogleDocs(!useGoogleDocs);
              }}
              className="h-7 text-[11px] gap-1 px-2"
              title="Switch between Google Viewer and Direct View"
            >
              <RefreshCw className="w-3 h-3" />
              {useGoogleDocs ? "Direct" : "Google Viewer"}
            </Button>
          )}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleOpenNewTab}
            className="h-7 text-[11px] gap-1 px-2"
          >
            <ExternalLink className="w-3 h-3" /> Tab
          </Button>
        </div>

        <iframe
          key={`${fullUrl}-${useGoogleDocs}`}
          src={activeUrl}
          title={displayName || "Document Preview"}
          className={`w-full ${maxHeight} border-0 bg-background`}
          onLoad={() => setIsLoading(false)}
          onError={() => {
            setIsLoading(false);
            setHasError(true);
          }}
        />

        {hasError && (
          <div className="flex flex-col items-center justify-center p-8 bg-muted/30 text-center">
            <AlertCircle className="w-10 h-10 text-amber-500 mb-2" />
            <p className="text-sm font-medium text-foreground">
              Document preview could not be loaded
            </p>
            <p className="text-xs text-muted-foreground mt-1 mb-4">
              You can download or open the file directly in a new tab.
            </p>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleDownload} className="gap-1.5">
                <Download className="w-4 h-4" /> Download File
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleOpenNewTab}
                className="gap-1.5"
              >
                <ExternalLink className="w-4 h-4" /> Open in New Tab
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Image Inline Viewer
  if (category === "image") {
    return (
      <div
        className={`relative flex flex-col items-center justify-center p-4 bg-muted/10 border border-border rounded-xl overflow-hidden ${className}`}
      >
        <div
          className={`relative flex items-center justify-center w-full ${maxHeight} overflow-auto`}
        >
          <Image
            src={fullUrl}
            alt={displayName || "Attached Image"}
            width={1200}
            height={800}
            className="max-h-full max-w-full object-contain rounded-xl shadow-sm"
            unoptimized
          />
        </div>
      </div>
    );
  }

  // Office / Other Document Viewer fallback
  return (
    <div
      className={`flex flex-col items-center justify-center p-8 bg-card border border-border rounded-xl text-center ${className}`}
    >
      <div className="p-4 bg-primary/10 rounded-2xl mb-3 text-primary">
        {category === "word" ? (
          <FileText className="w-12 h-12 text-indigo-500" />
        ) : category === "excel" ? (
          <FileSpreadsheet className="w-12 h-12 text-emerald-500" />
        ) : (
          <FileText className="w-12 h-12 text-muted-foreground" />
        )}
      </div>

      <h4 className="text-base font-semibold text-foreground max-w-md truncate">
        {displayName}
      </h4>
      {fileSize && fileSize > 0 && (
        <p className="text-xs text-muted-foreground mt-1">
          {formatFileSize(fileSize)}
        </p>
      )}

      <p className="text-xs text-muted-foreground mt-2 max-w-sm">
        This file format cannot be rendered directly in the browser. You can
        download or open it in its native application.
      </p>

      <div className="flex items-center gap-3 mt-6">
        <Button onClick={handleDownload} className="gap-2 shadow-sm">
          <Download className="w-4 h-4" />
          Download File
        </Button>
        <Button variant="outline" onClick={handleOpenNewTab} className="gap-2">
          <ExternalLink className="w-4 h-4" />
          Open Link
        </Button>
      </div>
    </div>
  );
}
