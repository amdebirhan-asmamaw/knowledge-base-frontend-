"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UserChip } from "@/components/UserChip";
import { useDocument } from "@/hooks/use-document-tree";
import { useAuth } from "@/hooks/use-auth";
import {
  Edit2,
  Copy,
  Printer,
  Check,
  FileText,
  Calendar,
  ArrowRightLeft,
  X,
  ExternalLink,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import type { FlatDocument } from "./types";

interface DocumentDetailModalProps {
  activeDoc: FlatDocument | null;
  onClose: () => void;
  onOpenEdit: (id: string) => void;
  onOpenMove: (doc: FlatDocument) => void;
}

export function DocumentDetailModal({
  activeDoc,
  onClose,
  onOpenEdit,
  onOpenMove,
}: DocumentDetailModalProps) {
  const { hasPermission, hasScopePermission } = useAuth();
  const { data: fullDoc, isLoading } = useDocument(activeDoc?._id);
  const [copied, setCopied] = useState(false);

  const canEdit =
    hasPermission("content:update:all") ||
    hasScopePermission("content", "update", "own");
  const canExport =
    hasPermission("content:export") ||
    hasScopePermission("content", "read", "own");

  const handleCopy = () => {
    if (!fullDoc?.contentText && !fullDoc?.contentHtml) return;
    const text =
      fullDoc.contentText ||
      fullDoc.contentHtml?.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim() ||
      "";
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Document text copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  if (!activeDoc) return null;

  return (
    <Dialog open={!!activeDoc} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-3xl max-h-[85vh] flex flex-col p-0 bg-white border border-border shadow-2xl overflow-hidden">
        {/* Header Ribbon */}
        <div className="p-6 border-b border-border bg-slate-50/70">
          <div className="flex items-center justify-between gap-3 mb-2 pr-8">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-semibold text-teal-700 bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200">
                {activeDoc.categoryName} › {activeDoc.sectionName}
              </span>
              {activeDoc.docId && (
                <Badge variant="outline" className="font-mono text-[11px] bg-white border-slate-300">
                  {activeDoc.docId}
                </Badge>
              )}
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-1.5">
              {canExport && (
                <Button variant="ghost" size="icon-sm" onClick={handleCopy} title="Copy plain text">
                  {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-muted-foreground" />}
                </Button>
              )}
              {canExport && (
                <Button variant="ghost" size="icon-sm" onClick={handlePrint} title="Print document">
                  <Printer className="w-4 h-4 text-muted-foreground" />
                </Button>
              )}
              {canEdit && (
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => onOpenMove(activeDoc)}
                  title="Move to another location"
                >
                  <ArrowRightLeft className="w-4 h-4 text-muted-foreground" />
                </Button>
              )}
              {canEdit && (
                <Button
                  size="sm"
                  onClick={() => onOpenEdit(activeDoc._id)}
                  className="gap-1.5 bg-teal-600 hover:bg-teal-700 text-white text-xs h-8 ml-1 font-medium"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Edit</span>
                </Button>
              )}
            </div>
          </div>

          <DialogTitle className="text-xl font-bold text-foreground text-left leading-snug">
            {activeDoc.title}
          </DialogTitle>
          <DialogDescription className="sr-only">
            Document details and content for {activeDoc.title}
          </DialogDescription>

          {/* Metadata bar */}
          <div className="flex items-center gap-4 pt-3 flex-wrap text-xs text-muted-foreground">
            {activeDoc.owner && (
              <div className="flex items-center gap-1.5">
                <span className="text-muted-foreground/70">Owner:</span>
                <UserChip compact user={activeDoc.owner} />
              </div>
            )}
            {activeDoc.updatedAt && (
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                <span>Updated {format(new Date(activeDoc.updatedAt), "PP")}</span>
              </div>
            )}
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {isLoading ? (
            <div className="space-y-4 py-8">
              <div className="h-6 w-3/4 rounded bg-muted animate-pulse" />
              <div className="h-24 w-full rounded bg-muted animate-pulse" />
              <div className="h-40 w-full rounded bg-muted animate-pulse" />
            </div>
          ) : fullDoc?.contentHtml ? (
            <div
              className="prose prose-slate max-w-none text-sm leading-relaxed text-foreground [&_h1]:text-xl [&_h2]:text-lg [&_h3]:text-base [&_table]:border-collapse [&_th]:border [&_th]:border-border [&_th]:p-2 [&_td]:border [&_td]:border-border [&_td]:p-2 [&_pre]:bg-slate-900 [&_pre]:text-slate-100 [&_pre]:p-3 [&_pre]:rounded-lg"
              dangerouslySetInnerHTML={{ __html: fullDoc.contentHtml }}
            />
          ) : (
            <div className="py-12 text-center text-muted-foreground">
              <FileText className="w-10 h-10 text-muted-foreground/40 mx-auto mb-2" />
              <p className="text-sm">This document has no content yet.</p>
              {canEdit && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onOpenEdit(activeDoc._id)}
                  className="mt-3 gap-1.5"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  Add Content
                </Button>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="p-3 border-t border-border bg-slate-50/50 flex justify-end">
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
