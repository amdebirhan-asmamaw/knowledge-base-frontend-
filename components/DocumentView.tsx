"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format, formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { useDocument } from "@/hooks/use-document-tree";
import { useAuth } from "@/hooks/use-auth";
import { DocumentViewer } from "@/components/DocumentViewer";
import { UserChip } from "@/components/UserChip";
import { VersionHistory } from "@/components/VersionHistory";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ChevronLeft,
  Edit2,
  Copy,
  Printer,
  History,
  Folder,
  BookOpen,
  Calendar,
  AlertCircle,
  Loader2,
  Check,
  Eye,
  ShieldAlert,
} from "lucide-react";

interface DocumentViewProps {
  documentId: string;
  onClose?: () => void;
}

export function DocumentView({ documentId, onClose }: DocumentViewProps) {
  const router = useRouter();
  const { data: doc, isLoading, error } = useDocument(documentId);
  const { user, hasPermission, hasScopePermission } = useAuth();

  const [copied, setCopied] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const handleBack = () => {
    if (onClose) {
      onClose();
    } else {
      router.push("/admin/structure");
    }
  };

  const handleEdit = () => {
    router.push(`/admin/structure/${documentId}/edit`);
  };

  // Determine permissions
  const canManageAll = hasPermission("content:update:all");
  const isOwner = !!doc?.owner?._id && doc.owner._id === user?.id;
  const isContributor = doc?.contributors?.some((c) => c._id === user?.id) ?? false;
  const canEditContent =
    canManageAll ||
    isContributor ||
    (isOwner && hasScopePermission("content", "update", "own"));

  // Copy plain text content
  const handleCopyContent = () => {
    if (!doc?.contentHtml) return;
    const plainText = doc.contentText || doc.contentHtml.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    navigator.clipboard.writeText(plainText).then(() => {
      setCopied(true);
      toast.success("Document content copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {
      toast.error("Failed to copy content");
    });
  };

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="h-8 w-24 bg-muted animate-pulse rounded-md" />
          <div className="h-8 w-48 bg-muted animate-pulse rounded-md" />
        </div>
        <div className="h-32 rounded-xl bg-muted animate-pulse" />
        <div className="h-96 rounded-xl bg-muted animate-pulse" />
      </div>
    );
  }

  if (error || !doc) {
    return (
      <Card className="p-8 text-center max-w-xl mx-auto my-12 border-dashed">
        <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
        <h2 className="text-lg font-semibold text-foreground">Document Not Found</h2>
        <p className="text-sm text-muted-foreground mt-1 mb-6">
          {error instanceof Error ? error.message : "The requested document could not be loaded or access is restricted."}
        </p>
        <Button onClick={handleBack} variant="outline" className="gap-2">
          <ChevronLeft className="w-4 h-4" />
          Back to Structure
        </Button>
      </Card>
    );
  }

  const categoryName = typeof doc.categoryId === "object" && doc.categoryId ? doc.categoryId.name : "Category";
  const sectionName = typeof doc.sectionId === "object" && doc.sectionId ? doc.sectionId.name : "Section";

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* ── Top Navigation & Actions Bar ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={handleBack} className="gap-1.5 text-muted-foreground hover:text-foreground">
            <ChevronLeft className="w-4 h-4" />
            <span>Structure</span>
          </Button>
          <span className="text-muted-foreground/40">/</span>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="truncate max-w-[140px] font-medium">{categoryName}</span>
            <span>&rsaquo;</span>
            <span className="truncate max-w-[140px] font-medium">{sectionName}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Version history trigger */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowHistory(true)}
            className="gap-1.5 text-xs"
            title="View revision history"
          >
            <History className="w-3.5 h-3.5 text-muted-foreground" />
            <span>Versions</span>
          </Button>

          {/* Copy content */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyContent}
            className="gap-1.5 text-xs"
            title="Copy plain text"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-green-600" />
                <span className="text-green-600">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-muted-foreground" />
                <span>Copy</span>
              </>
            )}
          </Button>

          {/* Print */}
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrint}
            className="gap-1.5 text-xs"
            title="Print document"
          >
            <Printer className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="hidden sm:inline">Print</span>
          </Button>

          {/* Edit Document CTA (if permitted) */}
          {canEditContent ? (
            <Button
              onClick={handleEdit}
              size="sm"
              className="gap-1.5 bg-teal-600 hover:bg-teal-700 text-white shadow-xs"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>Edit Document</span>
            </Button>
          ) : (
            <Badge variant="outline" className="gap-1 py-1 px-2.5 bg-amber-50 text-amber-700 border-amber-300 font-normal">
              <Eye className="w-3.5 h-3.5" />
              <span>View Access Only</span>
            </Badge>
          )}
        </div>
      </div>

      {/* ── View-only notice banner if user has no edit rights ── */}
      {!canEditContent && (
        <div className="flex items-start gap-2.5 rounded-lg border border-amber-200 bg-amber-50/80 px-4 py-3 text-sm text-amber-800">
          <ShieldAlert className="w-4 h-4 mt-0.5 shrink-0 text-amber-600" />
          <div className="flex-1 text-xs sm:text-sm">
            <span>You have <strong>view-only access</strong> to this document. Only the owner, authorized contributors, or administrators can make edits.</span>
          </div>
        </div>
      )}

      {/* ── Document Metadata Card ── */}
      <Card className="p-6 border bg-white shadow-xs">
        <div className="flex flex-col gap-4">
          {/* Title and Doc ID */}
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <Badge variant="secondary" className="gap-1 bg-teal-50 text-teal-800 border-teal-200 text-xs">
                <Folder className="w-3 h-3 text-teal-600" />
                {categoryName}
              </Badge>
              <Badge variant="secondary" className="gap-1 bg-slate-100 text-slate-700 text-xs">
                <BookOpen className="w-3 h-3 text-slate-500" />
                {sectionName}
              </Badge>
              {doc.docId && (
                <Badge variant="outline" className="font-mono text-xs text-muted-foreground border-border">
                  {doc.docId}
                </Badge>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
              {doc.title}
            </h1>
          </div>

          {/* People & Timestamps Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-border/60 text-xs">
            {/* Owner */}
            <div>
              <span className="text-muted-foreground block mb-1.5 font-medium">Owner</span>
              {doc.owner ? (
                <UserChip user={doc.owner} />
              ) : (
                <span className="text-muted-foreground italic">Unassigned</span>
              )}
            </div>

            {/* Contributors */}
            <div>
              <span className="text-muted-foreground block mb-1.5 font-medium">
                Contributors ({doc.contributors?.length ?? 0})
              </span>
              {doc.contributors && doc.contributors.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {doc.contributors.map((c) => (
                    <UserChip key={c._id} compact user={c} />
                  ))}
                </div>
              ) : (
                <span className="text-muted-foreground">None</span>
              )}
            </div>

            {/* Created */}
            <div>
              <span className="text-muted-foreground block mb-1.5 font-medium">Created</span>
              {doc.createdAt ? (
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Calendar className="w-3.5 h-3.5 shrink-0" />
                  <span>{format(new Date(doc.createdAt), "MMM d, yyyy")}</span>
                </div>
              ) : (
                <span className="text-muted-foreground">—</span>
              )}
            </div>

            {/* Last Updated */}
            <div>
              <span className="text-muted-foreground block mb-1.5 font-medium">Last Modified</span>
              {doc.updatedAt ? (
                <span className="text-foreground font-medium" title={format(new Date(doc.updatedAt), "PPpp")}>
                  {formatDistanceToNow(new Date(doc.updatedAt), { addSuffix: true })}
                </span>
              ) : (
                <span className="text-muted-foreground">—</span>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* ── Document Content Card (Clean Reading Layout) ── */}
      <Card className="p-6 sm:p-10 border bg-white shadow-xs">
        <DocumentViewer contentHtml={doc.contentHtml} />
      </Card>

      {/* ── Version History Dialog ── */}
      <Dialog open={showHistory} onOpenChange={setShowHistory}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="w-5 h-5 text-teal-600" />
              <span>Version History: {doc.title}</span>
            </DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <VersionHistory
              documentId={documentId}
              canRestore={canEditContent}
              onRestored={() => {
                setShowHistory(false);
                router.refresh();
              }}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
