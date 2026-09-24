"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UserChip } from "@/components/UserChip";
import { useAuth } from "@/hooks/use-auth";
import {
  FileText,
  Eye,
  Edit2,
  ArrowRightLeft,
  Trash2,
  Clock,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { FlatDocument } from "./types";

interface DocumentListViewProps {
  documents: FlatDocument[];
  onPreview: (doc: FlatDocument) => void;
  onEdit: (id: string) => void;
  onMove: (doc: FlatDocument) => void;
  onDelete: (doc: FlatDocument) => void;
}

export function DocumentListView({
  documents,
  onPreview,
  onEdit,
  onMove,
  onDelete,
}: DocumentListViewProps) {
  const { user, hasPermission, hasScopePermission } = useAuth();
  const canUpdateAll = hasPermission("content:update:all");
  const canDeleteAll = hasPermission("content:delete:all");

  const canEditDoc = (ownerId?: string) =>
    canUpdateAll || (!!ownerId && ownerId === user?.id && hasScopePermission("content", "update", "own"));

  const canDeleteDoc = (ownerId?: string) =>
    canDeleteAll || (!!ownerId && ownerId === user?.id && hasScopePermission("content", "delete", "own"));

  return (
    <div className="space-y-1.5">
      {documents.map((doc) => {
        const userCanEdit = canEditDoc(doc.owner?._id);
        const userCanDelete = canDeleteDoc(doc.owner?._id);

        return (
          <div
            key={doc._id}
            onClick={() => onPreview(doc)}
            className="w-full flex items-center justify-between gap-3 px-4 py-3 rounded-lg bg-white border border-border/80 hover:border-teal-400 hover:shadow-2xs transition-all group cursor-pointer select-none"
          >
            {/* Title & Metadata */}
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="p-2 rounded-md bg-teal-50 text-teal-700 shrink-0 group-hover:bg-teal-100 transition-colors">
                <FileText className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-semibold text-foreground truncate group-hover:text-teal-700 transition-colors">
                    {doc.title}
                  </span>
                  {doc.docId && (
                    <Badge variant="outline" className="font-mono text-[10px] bg-slate-50 border-slate-200 shrink-0">
                      {doc.docId}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                  <span>
                    {doc.categoryName} › {doc.sectionName}
                  </span>
                  {doc.updatedAt && (
                    <>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDistanceToNow(new Date(doc.updatedAt), { addSuffix: true })}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Owner & Action Buttons */}
            <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
              {doc.owner && <UserChip compact user={doc.owner} />}

              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => onPreview(doc)}
                className="text-muted-foreground hover:text-teal-700 hover:bg-teal-50"
                title="Preview document"
              >
                <Eye className="w-3.5 h-3.5" />
              </Button>

              {userCanEdit && (
                <>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => onMove(doc)}
                    className="text-muted-foreground hover:text-teal-700 hover:bg-teal-50"
                    title="Move to another category/section"
                  >
                    <ArrowRightLeft className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => onEdit(doc._id)}
                    className="text-muted-foreground hover:text-teal-700 hover:bg-teal-50"
                    title="Edit document"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </Button>
                </>
              )}

              {userCanDelete && (
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => onDelete(doc)}
                  className="text-muted-foreground hover:text-red-600 hover:bg-red-50"
                  title="Delete document"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
