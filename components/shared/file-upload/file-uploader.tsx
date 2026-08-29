"use client";

import { useState, useRef, useCallback } from "react";
import {
  UploadCloud,
  FileText,
  Image as FileImageIcon,
  FileSpreadsheet,
  Trash2,
  ExternalLink,
  CheckCircle2,
  Eye,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { apiAxios } from "@/lib/api/client";
import { cn } from "@/lib/utils";
import { FileViewerDialog } from "@/components/shared/file-viewer";
import { formatFileSize } from "@/lib/utils/file.util";

export interface UploadedFile {
  fileUrl: string;
  fileName: string;
  storedName?: string;
  folder?: string;
  fileSize: number;
  mimeType: string;
}

export interface FileUploaderProps {
  value?: string | null;
  fileName?: string | null;
  fileSize?: number | null;
  mimeType?: string | null;
  folder?: string;
  onUploadComplete?: (file: UploadedFile) => void;
  onRemove?: () => void;
  accept?: string;
  maxSizeMb?: number;
  disabled?: boolean;
  className?: string;
  description?: string;
}

function getFileTypeIcon(mimeOrName?: string | null) {
  if (!mimeOrName) return <FileText className="w-6 h-6 text-muted-foreground" />;
  const str = mimeOrName.toLowerCase();
  if (str.includes("pdf")) return <FileText className="w-6 h-6 text-destructive" />;
  if (
    str.includes("image") ||
    str.endsWith(".jpg") ||
    str.endsWith(".jpeg") ||
    str.endsWith(".png") ||
    str.endsWith(".webp") ||
    str.endsWith(".gif") ||
    str.endsWith(".svg")
  ) {
    return <FileImageIcon className="w-6 h-6 text-primary" />;
  }
  if (
    str.includes("word") ||
    str.includes("doc") ||
    str.endsWith(".doc") ||
    str.endsWith(".docx")
  ) {
    return <FileText className="w-6 h-6 text-indigo-500" />;
  }
  if (
    str.includes("excel") ||
    str.includes("sheet") ||
    str.endsWith(".xls") ||
    str.endsWith(".xlsx") ||
    str.endsWith(".csv")
  ) {
    return <FileSpreadsheet className="w-6 h-6 text-emerald-500" />;
  }
  return <FileText className="w-6 h-6 text-muted-foreground" />;
}

export function FileUploader({
  value,
  fileName,
  fileSize,
  mimeType,
  folder = "general",
  onUploadComplete,
  onRemove,
  accept = ".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx,.xls,.xlsx,.csv,.txt",
  maxSizeMb = 25,
  disabled = false,
  className,
  description = "PDF, Images, or Documents up to 25MB",
}: FileUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [localUploaded, setLocalUploaded] = useState<UploadedFile | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentUrl = value || localUploaded?.fileUrl;
  const currentName =
    fileName ||
    localUploaded?.fileName ||
    (currentUrl ? currentUrl.split("/").pop() : "");
  const currentSize = fileSize ?? localUploaded?.fileSize;
  const currentMime = mimeType || localUploaded?.mimeType;

  const handleUpload = useCallback(
    async (file: File) => {
      if (file.size > maxSizeMb * 1024 * 1024) {
        setUploadError(`File size exceeds maximum allowed limit (${maxSizeMb}MB)`);
        return;
      }

      setUploadError(null);
      setIsUploading(true);

      try {
        const formData = new FormData();
        formData.append("file", file);
        if (folder) {
          formData.append("folder", folder);
        }

        const response = await apiAxios.post<{ data: UploadedFile }>(
          `/uploads/${folder}`,
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          },
        );

        const uploadedData = response.data?.data;
        if (uploadedData) {
          setLocalUploaded(uploadedData);
          onUploadComplete?.(uploadedData);
        }
      } catch (err: any) {
        const message =
          err?.response?.data?.message ||
          err?.message ||
          "Failed to upload file. Please try again.";
        setUploadError(message);
      } finally {
        setIsUploading(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    },
    [folder, maxSizeMb, onUploadComplete],
  );

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled && !isUploading) {
      setIsDragging(true);
    }
  };

  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (disabled || isUploading) return;

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleUpload(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleUpload(file);
    }
  };

  const handleRemove = () => {
    setLocalUploaded(null);
    setUploadError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    onRemove?.();
  };

  // If a file is uploaded or provided via value, render file card preview
  if (currentUrl) {
    return (
      <div className={cn("space-y-1.5", className)}>
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-card p-3 shadow-xs">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex w-10 h-10 shrink-0 items-center justify-center rounded-xl bg-muted/60">
              {getFileTypeIcon(currentMime || currentName)}
            </div>
            <div className="min-w-0 space-y-0.5">
              <div className="flex items-center gap-1.5">
                <p
                  className="truncate text-xs font-semibold text-foreground"
                  title={currentName || ""}
                >
                  {currentName || "Attached file"}
                </p>
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-500" />
              </div>
              <p className="text-[11px] text-muted-foreground">
                {currentSize ? formatFileSize(currentSize) : "Uploaded file"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="w-8 h-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50"
              onClick={() => setIsPreviewOpen(true)}
              title="Preview document"
            >
              <Eye className="w-4 h-4" />
              <span className="sr-only">Preview document</span>
            </Button>

            {!disabled && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="w-8 h-8 rounded-lg text-destructive hover:bg-destructive/10"
                onClick={handleRemove}
                title="Remove file"
              >
                <Trash2 className="w-4 h-4" />
                <span className="sr-only">Remove file</span>
              </Button>
            )}
          </div>
        </div>

        {uploadError && (
          <p className="text-xs font-medium text-destructive flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5" />
            {uploadError}
          </p>
        )}

        <FileViewerDialog
          open={isPreviewOpen}
          onOpenChange={setIsPreviewOpen}
          url={currentUrl}
          fileName={currentName}
          fileSize={currentSize}
          mimeType={currentMime}
          title={currentName || "Uploaded File"}
        />
      </div>
    );
  }

  return (
    <div className={cn("space-y-1.5", className)}>
      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={() => !disabled && !isUploading && fileInputRef.current?.click()}
        className={cn(
          "relative flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed p-6 text-center transition-all cursor-pointer",
          isDragging
            ? "border-primary bg-primary/5 scale-[1.005]"
            : "border-border/80 bg-muted/20 hover:border-primary/60 hover:bg-muted/40",
          disabled && "opacity-50 cursor-not-allowed",
          isUploading && "cursor-wait bg-muted/30",
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          disabled={disabled || isUploading}
          onChange={handleFileChange}
          className="sr-only"
        />

        {isUploading ? (
          <div className="flex flex-col items-center gap-2 py-1">
            <Spinner className="w-6 h-6 text-primary" />
            <p className="text-xs font-medium text-foreground">
              Uploading document...
            </p>
            <p className="text-[11px] text-muted-foreground">
              Please wait while the file is processed.
            </p>
          </div>
        ) : (
          <>
            <div className="flex w-10 h-10 items-center justify-center rounded-xl bg-primary/10 text-primary shadow-xs">
              <UploadCloud className="w-5 h-5" />
            </div>

            <div className="space-y-0.5">
              <p className="text-xs font-medium text-foreground">
                <span className="text-primary hover:underline font-semibold">
                  Click to upload
                </span>{" "}
                or drag and drop
              </p>
              <p className="text-[11px] text-muted-foreground">{description}</p>
            </div>
          </>
        )}
      </div>

      {uploadError && (
        <p className="text-xs font-medium text-destructive flex items-center gap-1">
          <AlertCircle className="w-3.5 h-3.5" />
          {uploadError}
        </p>
      )}
    </div>
  );
}
