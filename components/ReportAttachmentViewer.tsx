"use client";

import { useState } from "react";
import { type TaskReportAttachment } from "@/lib/api/reports.api";
import {
  getFileIcon,
  formatFileSize,
} from "@/components/ReportAttachmentUploader";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Download,
  Eye,
  ExternalLink,
  Paperclip,
  X,
  FileText,
  Image as ImageIcon,
} from "lucide-react";

interface ReportAttachmentViewerProps {
  attachments?: TaskReportAttachment[];
  reportTitle?: string;
}

export function ReportAttachmentViewer({
  attachments = [],
  reportTitle = "Report",
}: ReportAttachmentViewerProps) {
  const [selectedPreview, setSelectedPreview] =
    useState<TaskReportAttachment | null>(null);

  if (!attachments || attachments.length === 0) {
    return null;
  }

  const isImage = (att: TaskReportAttachment) => {
    const ext = (att.format || att.originalFilename || "").toLowerCase();
    return ["png", "jpg", "jpeg", "webp", "gif", "svg"].includes(ext);
  };

  const isPdf = (att: TaskReportAttachment) => {
    const ext = (att.format || att.originalFilename || "").toLowerCase();
    return ext === "pdf";
  };

  const canPreview = (att: TaskReportAttachment) => isImage(att) || isPdf(att);

  return (
    <div className="space-y-3 pt-2">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
          <Paperclip className="w-3.5 h-3.5 text-primary" />
          Attachments & Documents ({attachments.length})
        </h3>
      </div>

      {/* Attachments Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {attachments.map((att, idx) => {
          const imageType = isImage(att);
          const pdfType = isPdf(att);
          const previewable = imageType || pdfType;

          return (
            <div
              key={att.publicId || idx}
              className="group relative flex items-center justify-between gap-3 p-3 rounded-2xl border border-border bg-card hover:border-primary/40 hover:shadow-md transition-all duration-200"
            >
              <div
                className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer"
                onClick={() => {
                  if (previewable) setSelectedPreview(att);
                  else window.open(att.url, "_blank");
                }}
              >
                {/* Thumbnail / Icon container */}
                <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center shrink-0 overflow-hidden border border-border/60">
                  {imageType ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={att.url}
                      alt={att.originalFilename}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  ) : (
                    getFileIcon(att.format || att.originalFilename)
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                    {att.originalFilename}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1.5">
                    <span>{formatFileSize(att.bytes)}</span>
                    <span>·</span>
                    <span className="uppercase font-medium text-[10px]">
                      {att.format}
                    </span>
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1 shrink-0">
                {previewable && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedPreview(att)}
                    className="h-8 w-8 p-0 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10"
                    title="Preview file"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </Button>
                )}
                <a
                  href={att.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  download={att.originalFilename}
                  className="inline-flex items-center justify-center h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  title="Download / Open file"
                >
                  <Download className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          );
        })}
      </div>

      {/* ─── Preview Modal (Image Lightbox / PDF Viewer) ──────────────────── */}
      {selectedPreview && (
        <Dialog
          open={!!selectedPreview}
          onOpenChange={(open) => !open && setSelectedPreview(null)}
        >
          <DialogContent className="max-w-4xl w-[92vw] max-h-[90vh] p-0 overflow-hidden rounded-3xl border-border bg-card flex flex-col">
            <DialogHeader className="px-6 py-4 border-b border-border flex flex-row items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                  {getFileIcon(
                    selectedPreview.format || selectedPreview.originalFilename,
                  )}
                </div>
                <div className="min-w-0">
                  <DialogTitle className="text-sm font-bold text-foreground truncate max-w-md">
                    {selectedPreview.originalFilename}
                  </DialogTitle>
                  <p className="text-[11px] text-muted-foreground">
                    {formatFileSize(selectedPreview.bytes)} · Stored on
                    Cloudinary
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 mr-6">
                <a
                  href={selectedPreview.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground bg-muted px-2.5 py-1 rounded-lg font-medium transition-colors"
                >
                  <ExternalLink className="w-3 h-3" /> Open in New Tab
                </a>
                <a
                  href={selectedPreview.url}
                  download={selectedPreview.originalFilename}
                  className="inline-flex items-center gap-1 text-xs text-primary-foreground bg-primary hover:bg-primary/90 px-3 py-1 rounded-lg font-medium shadow-sm transition-colors"
                >
                  <Download className="w-3 h-3" /> Download
                </a>
              </div>
            </DialogHeader>

            <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-muted/20 min-h-[400px]">
              {isImage(selectedPreview) ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={selectedPreview.url}
                  alt={selectedPreview.originalFilename}
                  className="max-h-[70vh] max-w-full object-contain rounded-xl shadow-lg border border-border"
                />
              ) : isPdf(selectedPreview) ? (
                <iframe
                  src={`${selectedPreview.url}#toolbar=1&navpanes=0`}
                  title={selectedPreview.originalFilename}
                  className="w-full h-[70vh] rounded-xl border border-border bg-background shadow-sm"
                />
              ) : (
                <div className="text-center py-12 space-y-3">
                  <FileText className="w-12 h-12 text-muted-foreground mx-auto" />
                  <p className="text-sm font-semibold text-foreground">
                    Preview not supported for this file type
                  </p>
                  <a
                    href={selectedPreview.url}
                    download={selectedPreview.originalFilename}
                    className="inline-flex items-center gap-1.5 text-xs text-primary font-medium hover:underline"
                  >
                    <Download className="w-3.5 h-3.5" /> Download file instead
                  </a>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
