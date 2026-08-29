"use client";

import { useState } from "react";
import Image from "next/image";
import {
  FileText,
  Image as FileImageIcon,
  FileSpreadsheet,
  Download,
  ExternalLink,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { resolveFileUrl, getFileCategory, formatFileSize } from "@/lib/utils/file.util";
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

  const fullUrl = resolveFileUrl(url);
  const category = getFileCategory(mimeType || fileName || url);
  const displayName = fileName || (url ? url.split("/").pop() : "Document");

  if (!fullUrl) {
    return (
      <div className={`flex flex-col items-center justify-center p-8 bg-muted/20 border border-dashed border-border rounded-xl text-center ${className}`}>
        <FileText className="w-10 h-10 text-muted-foreground mb-2" />
        <p className="text-sm font-medium text-foreground">No file attached</p>
        <p className="text-xs text-muted-foreground mt-1">Please provide or upload a valid document.</p>
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

  // PDF Inline Viewer
  if (category === "pdf") {
    return (
      <div className={`relative flex flex-col w-full bg-background border border-border rounded-xl overflow-hidden ${className}`}>
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
            <div className="flex flex-col items-center gap-2">
              <Spinner className="w-6 h-6 text-primary" />
              <p className="text-xs text-muted-foreground font-medium">Loading PDF document...</p>
            </div>
          </div>
        )}

        <object
          data={fullUrl}
          type="application/pdf"
          className={`w-full ${maxHeight} border-0`}
          onLoad={() => setIsLoading(false)}
          onError={() => {
            setIsLoading(false);
            setHasError(true);
          }}
        >
          <iframe
            src={`${fullUrl}#toolbar=1&navpanes=0&scrollbar=1`}
            title={displayName || "PDF Document"}
            className={`w-full ${maxHeight} border-0`}
            onLoad={() => setIsLoading(false)}
          />
        </object>

        {hasError && (
          <div className="flex flex-col items-center justify-center p-8 bg-muted/30 text-center">
            <AlertCircle className="w-10 h-10 text-amber-500 mb-2" />
            <p className="text-sm font-medium text-foreground">PDF preview not supported by this browser</p>
            <p className="text-xs text-muted-foreground mt-1 mb-4">You can download or open the file directly in a new tab.</p>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleDownload} className="gap-1.5">
                <Download className="w-4 h-4" /> Download PDF
              </Button>
              <Button size="sm" variant="outline" onClick={handleOpenNewTab} className="gap-1.5">
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
      <div className={`relative flex flex-col items-center justify-center p-4 bg-muted/10 border border-border rounded-xl overflow-hidden ${className}`}>
        <div className={`relative flex items-center justify-center w-full ${maxHeight} overflow-auto`}>
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
    <div className={`flex flex-col items-center justify-center p-8 bg-card border border-border rounded-xl text-center ${className}`}>
      <div className="p-4 bg-primary/10 rounded-2xl mb-3 text-primary">
        {category === "word" ? (
          <FileText className="w-12 h-12 text-indigo-500" />
        ) : category === "excel" ? (
          <FileSpreadsheet className="w-12 h-12 text-emerald-500" />
        ) : (
          <FileText className="w-12 h-12 text-muted-foreground" />
        )}
      </div>

      <h4 className="text-base font-semibold text-foreground max-w-md truncate">{displayName}</h4>
      {fileSize && fileSize > 0 && (
        <p className="text-xs text-muted-foreground mt-1">{formatFileSize(fileSize)}</p>
      )}

      <p className="text-xs text-muted-foreground mt-2 max-w-sm">
        This file format cannot be rendered directly in the browser. You can download or open it in its native application.
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
