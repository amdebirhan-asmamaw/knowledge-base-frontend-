"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, ExternalLink, FileText } from "lucide-react";
import { InlineFileViewer } from "./inline-file-viewer";
import { resolveFileUrl, formatFileSize, getFileCategory } from "@/lib/utils/file.util";
import { Badge } from "@/components/ui/badge";

export interface FileViewerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  url?: string | null;
  fileName?: string | null;
  fileSize?: number | null;
  mimeType?: string | null;
  title?: string;
  description?: string;
}

export function FileViewerDialog({
  open,
  onOpenChange,
  url,
  fileName,
  fileSize,
  mimeType,
  title,
  description,
}: FileViewerDialogProps) {
  // `url` is expected to be directly loadable — callers that need auth
  // (e.g. report attachments) fetch the bytes themselves and pass a blob: URL.
  const fullUrl = resolveFileUrl(url);
  const displayName = fileName || (url ? url.split("/").pop() : "Attached Document");
  const category = getFileCategory(mimeType || fileName || url);

  const handleDownload = () => {
    if (!fullUrl) return;
    const link = document.createElement("a");
    link.href = fullUrl;
    link.download = displayName || "download";
    // `download` is honoured for same-origin blob: URLs; forcing a new tab
    // there would navigate away instead of saving the file.
    if (!fullUrl.startsWith("blob:")) link.target = "_blank";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleOpenNewTab = () => {
    if (!fullUrl) return;
    window.open(fullUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent aria-describedby={undefined} className="sm:max-w-[900px] max-h-[92vh] flex flex-col p-6 gap-4">
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 border-b border-border/60 pb-3 pr-6">
          <div className="space-y-1 overflow-hidden pr-2">
            <div className="flex items-center gap-2">
              <DialogTitle className="text-lg font-semibold truncate">
                {title || displayName}
              </DialogTitle>
              <Badge variant="outline" className="text-xs capitalize font-medium">
                {category}
              </Badge>
            </div>
            {(description || fileSize) && (
              <DialogDescription className="text-xs text-muted-foreground flex items-center gap-2 truncate">
                {description && <span>{description}</span>}
                {description && fileSize && <span>•</span>}
                {fileSize && <span>{formatFileSize(fileSize)}</span>}
              </DialogDescription>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {fullUrl && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleOpenNewTab}
                  className="gap-1.5 h-8 text-xs font-medium"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  New Tab
                </Button>
                <Button
                  size="sm"
                  onClick={handleDownload}
                  className="gap-1.5 h-8 text-xs font-medium"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download
                </Button>
              </>
            )}
          </div>
        </DialogHeader>

        <div className="flex-1 min-h-[400px] max-h-[72vh] overflow-y-auto">
          {fullUrl ? (
            <InlineFileViewer
              url={url}
              fileName={fileName}
              fileSize={fileSize}
              mimeType={mimeType}
              maxHeight="h-[68vh]"
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <FileText className="w-10 h-10 text-muted-foreground mb-2" />
              <p className="text-sm font-medium">No document available to view</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
