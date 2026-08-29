"use client";

import { useState, useRef, useCallback } from "react";
import { type TaskReportAttachment } from "@/lib/api/reports.api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  UploadCloud,
  FileText,
  Image as ImageIcon,
  FileSpreadsheet,
  FileCode,
  Paperclip,
  X,
  AlertCircle,
  File,
  CheckCircle2,
  Trash2,
} from "lucide-react";

interface ReportAttachmentUploaderProps {
  existingAttachments?: TaskReportAttachment[];
  onFilesChange: (files: File[]) => void;
  onDeletedAttachmentIdsChange?: (ids: string[]) => void;
  maxFiles?: number;
  maxSizeMb?: number;
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function getFileIcon(formatOrExt?: string | null) {
  const ext = (formatOrExt ?? "").toLowerCase().split(".").pop() ?? "";
  if (["pdf"].includes(ext)) {
    return <FileText className="w-4 h-4 text-red-500" />;
  }
  if (["png", "jpg", "jpeg", "webp", "gif", "svg"].includes(ext)) {
    return <ImageIcon className="w-4 h-4 text-blue-500" />;
  }
  if (["xls", "xlsx", "csv"].includes(ext)) {
    return <FileSpreadsheet className="w-4 h-4 text-emerald-500" />;
  }
  if (["doc", "docx"].includes(ext)) {
    return <FileText className="w-4 h-4 text-indigo-500" />;
  }
  if (["json", "txt", "md"].includes(ext)) {
    return <FileCode className="w-4 h-4 text-amber-500" />;
  }
  return <File className="w-4 h-4 text-muted-foreground" />;
}

export function ReportAttachmentUploader({
  existingAttachments = [],
  onFilesChange,
  onDeletedAttachmentIdsChange,
  maxFiles = 5,
  maxSizeMb = 10,
}: ReportAttachmentUploaderProps) {
  const [stagedFiles, setStagedFiles] = useState<File[]>([]);
  const [deletedIds, setDeletedIds] = useState<string[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const remainingExisting = existingAttachments.filter(
    (a) => !deletedIds.includes(a.publicId) && !deletedIds.includes(a._id || ""),
  );
  const currentTotal = remainingExisting.length + stagedFiles.length;

  const handleAddFiles = useCallback(
    (newFilesList: FileList | File[]) => {
      setError(null);
      const incoming = Array.from(newFilesList);

      if (currentTotal + incoming.length > maxFiles) {
        setError(`You can only upload up to ${maxFiles} attachments in total.`);
        return;
      }

      const validFiles: File[] = [];
      for (const file of incoming) {
        if (file.size > maxSizeMb * 1024 * 1024) {
          setError(
            `File "${file.name}" exceeds the maximum limit of ${maxSizeMb} MB.`,
          );
          return;
        }
        validFiles.push(file);
      }

      const updated = [...stagedFiles, ...validFiles];
      setStagedFiles(updated);
      onFilesChange(updated);
    },
    [currentTotal, maxFiles, maxSizeMb, onFilesChange, stagedFiles],
  );

  const handleRemoveStaged = (index: number) => {
    const updated = stagedFiles.filter((_, i) => i !== index);
    setStagedFiles(updated);
    onFilesChange(updated);
  };

  const handleRemoveExisting = (attachment: TaskReportAttachment) => {
    const idToDelete = attachment.publicId || attachment._id || "";
    const updated = [...deletedIds, idToDelete];
    setDeletedIds(updated);
    onDeletedAttachmentIdsChange?.(updated);
  };

  const handleRestoreExisting = (attachment: TaskReportAttachment) => {
    const idToDelete = attachment.publicId || attachment._id || "";
    const updated = deletedIds.filter((id) => id !== idToDelete);
    setDeletedIds(updated);
    onDeletedAttachmentIdsChange?.(updated);
  };

  return (
    <div className="space-y-3.5">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-foreground uppercase tracking-wider flex items-center gap-1.5">
          <Paperclip className="w-3.5 h-3.5 text-primary" />
          Supporting Attachments & Documents
        </label>
        <span className="text-[11px] text-muted-foreground">
          {currentTotal} / {maxFiles} files (max {maxSizeMb}MB each)
        </span>
      </div>

      {/* Drag & Drop Zone */}
      {currentTotal < maxFiles && (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            if (e.dataTransfer.files) {
              handleAddFiles(e.dataTransfer.files);
            }
          }}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-5 text-center cursor-pointer transition-all duration-200 ${
            dragOver
              ? "border-primary bg-primary/5 scale-[0.99]"
              : "border-border hover:border-primary/50 hover:bg-muted/30"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            accept=".pdf,.png,.jpg,.jpeg,.webp,.gif,.svg,.doc,.docx,.xls,.xlsx,.csv,.txt"
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                handleAddFiles(e.target.files);
                e.target.value = "";
              }
            }}
          />
          <div className="flex flex-col items-center justify-center gap-1.5">
            <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-1">
              <UploadCloud className="w-5 h-5" />
            </div>
            <p className="text-xs font-medium text-foreground">
              <span className="text-primary font-semibold">Click to upload</span>{" "}
              or drag and drop
            </p>
            <p className="text-[11px] text-muted-foreground">
              PDF, Word, Excel, Images, CSV (stored securely in Cloudinary)
            </p>
          </div>
        </div>
      )}

      {error && (
        <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1.5">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          {error}
        </p>
      )}

      {/* Files List */}
      {(existingAttachments.length > 0 || stagedFiles.length > 0) && (
        <div className="space-y-2 pt-1">
          {/* Existing Attachments */}
          {existingAttachments.map((att) => {
            const isMarkedDeleted =
              deletedIds.includes(att.publicId) ||
              deletedIds.includes(att._id || "");

            return (
              <div
                key={att.publicId || att._id}
                className={`flex items-center justify-between gap-3 p-2.5 rounded-xl border text-xs transition-all ${
                  isMarkedDeleted
                    ? "bg-red-500/5 border-red-500/20 text-muted-foreground opacity-60 line-through"
                    : "bg-card border-border"
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="p-1.5 rounded-lg bg-muted shrink-0">
                    {getFileIcon(att.format || att.originalFilename)}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-foreground truncate max-w-[220px] sm:max-w-xs">
                      {att.originalFilename}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      Cloudinary · {formatFileSize(att.bytes)}
                      {att.format ? ` · ${att.format.toUpperCase()}` : ""}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {isMarkedDeleted ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRestoreExisting(att)}
                      className="h-7 text-[11px] text-primary hover:text-primary no-underline"
                    >
                      Undo
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveExisting(att)}
                      className="h-7 w-7 p-0 text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg"
                      title="Remove attachment"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  )}
                </div>
              </div>
            );
          })}

          {/* Staged New Files */}
          {stagedFiles.map((file, idx) => (
            <div
              key={`${file.name}-${idx}`}
              className="flex items-center justify-between gap-3 p-2.5 rounded-xl border border-primary/20 bg-primary/5 text-xs animate-in fade-in duration-200"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="p-1.5 rounded-lg bg-primary/10 shrink-0">
                  {getFileIcon(file.name)}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-foreground truncate max-w-[200px] sm:max-w-xs">
                      {file.name}
                    </p>
                    <span className="inline-flex items-center text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                      <CheckCircle2 className="w-3 h-3 mr-0.5" /> Ready
                    </span>
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    {formatFileSize(file.size)}
                  </p>
                </div>
              </div>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => handleRemoveStaged(idx)}
                className="h-7 w-7 p-0 text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg shrink-0"
                title="Remove file"
              >
                <X className="w-3.5 h-3.5" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
