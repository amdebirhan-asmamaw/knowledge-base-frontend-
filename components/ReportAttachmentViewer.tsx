"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  fetchAttachmentObjectUrl,
  type TaskReportAttachment,
} from "@/lib/api/reports.api";
import { getFileIcon } from "@/components/ReportAttachmentUploader";
import { FileViewerDialog } from "@/components/shared/file-viewer/file-viewer-dialog";
import { formatFileSize, getFileExtension } from "@/lib/utils/file.util";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Download, Eye, Paperclip, AlertCircle } from "lucide-react";

interface ReportAttachmentViewerProps {
  attachments?: TaskReportAttachment[];
  reportId: string;
  reportTitle?: string;
}

/** Stable key for an attachment — `_id` when persisted, else the Cloudinary id. */
const keyOf = (att: TaskReportAttachment) => att._id || att.publicId;

/** Best-effort label/type source: the stored format, else the filename extension. */
const typeHintOf = (att: TaskReportAttachment) =>
  att.format || getFileExtension(att.originalFilename);

export function ReportAttachmentViewer({
  attachments = [],
  reportId,
  reportTitle = "Report",
}: ReportAttachmentViewerProps) {
  const [preview, setPreview] = useState<{
    attachment: TaskReportAttachment;
    objectUrl: string;
  } | null>(null);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Object URLs are created per action and must be released to avoid leaking
  // the whole file into memory for the life of the page.
  const objectUrlsRef = useRef<string[]>([]);
  const trackObjectUrl = (url: string) => {
    objectUrlsRef.current.push(url);
    return url;
  };

  useEffect(
    () => () => {
      objectUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
      objectUrlsRef.current = [];
    },
    [],
  );

  const load = useCallback(
    async (att: TaskReportAttachment, download: boolean) => {
      setError(null);
      setBusyKey(keyOf(att));
      try {
        return trackObjectUrl(
          await fetchAttachmentObjectUrl(reportId, att, { download }),
        );
      } catch (err) {
        setError(
          err instanceof Error
            ? `Could not open "${att.originalFilename}": ${err.message}`
            : `Could not open "${att.originalFilename}".`,
        );
        return null;
      } finally {
        setBusyKey(null);
      }
    },
    [reportId],
  );

  const handlePreview = async (att: TaskReportAttachment) => {
    const objectUrl = await load(att, false);
    if (objectUrl) setPreview({ attachment: att, objectUrl });
  };

  const handleDownload = async (att: TaskReportAttachment) => {
    const objectUrl = await load(att, true);
    if (!objectUrl) return;
    const link = document.createElement("a");
    link.href = objectUrl;
    link.download = att.originalFilename || "download";
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  if (!attachments || attachments.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3 pt-2">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
          <Paperclip className="w-3.5 h-3.5 text-primary" />
          Attachments & Documents ({attachments.length})
        </h3>
      </div>

      {error && (
        <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1.5">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          {error}
        </p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {attachments.map((att) => {
          const hint = typeHintOf(att);
          const isBusy = busyKey === keyOf(att);

          return (
            <div
              key={keyOf(att)}
              className="group relative flex items-center justify-between gap-3 p-3 rounded-2xl border border-border bg-card hover:border-primary/40 hover:shadow-md transition-all duration-200"
            >
              <button
                type="button"
                disabled={isBusy}
                className="flex items-center gap-3 min-w-0 flex-1 text-left cursor-pointer disabled:cursor-wait"
                onClick={() => handlePreview(att)}
              >
                <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center shrink-0 overflow-hidden border border-border/60">
                  {isBusy ? (
                    <Spinner className="w-4 h-4 text-primary" />
                  ) : (
                    getFileIcon(hint)
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                    {att.originalFilename}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1.5">
                    <span>{formatFileSize(att.bytes)}</span>
                    {hint && (
                      <>
                        <span>·</span>
                        <span className="uppercase font-medium text-[10px]">
                          {hint}
                        </span>
                      </>
                    )}
                  </p>
                </div>
              </button>

              <div className="flex items-center gap-1 shrink-0">
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={isBusy}
                  onClick={() => handlePreview(att)}
                  className="h-8 w-8 p-0 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10"
                  title="Preview file"
                >
                  <Eye className="w-3.5 h-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={isBusy}
                  onClick={() => handleDownload(att)}
                  className="h-8 w-8 p-0 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
                  title="Download file"
                >
                  <Download className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      <FileViewerDialog
        open={!!preview}
        onOpenChange={(open) => !open && setPreview(null)}
        url={preview?.objectUrl}
        fileName={preview?.attachment.originalFilename}
        fileSize={preview?.attachment.bytes}
        mimeType={preview ? typeHintOf(preview.attachment) : undefined}
        description={reportTitle}
      />
    </div>
  );
}
