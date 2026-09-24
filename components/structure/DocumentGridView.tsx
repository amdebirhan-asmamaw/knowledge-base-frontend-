"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { UserChip } from "@/components/UserChip";
import { useAuth } from "@/hooks/use-auth";
import {
  FileText,
  Eye,
  Edit2,
} from "lucide-react";
import type { FlatDocument } from "./types";

interface DocumentGridViewProps {
  documents: FlatDocument[];
  onPreview: (doc: FlatDocument) => void;
  onEdit: (id: string) => void;
  onMove: (doc: FlatDocument) => void;
  onDelete: (doc: FlatDocument) => void;
}

export function DocumentGridView({
  documents,
  onPreview,
  onEdit,
}: DocumentGridViewProps) {
  const { user, hasPermission, hasScopePermission } = useAuth();
  const canUpdateAll = hasPermission("content:update:all");

  const canEditDoc = (ownerId?: string) =>
    canUpdateAll || (!!ownerId && ownerId === user?.id && hasScopePermission("content", "update", "own"));

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
      {documents.map((doc) => {
        const userCanEdit = canEditDoc(doc.owner?._id);

        return (
          <Card
            key={doc._id}
            onClick={() => onPreview(doc)}
            className="p-4 bg-white border border-border/80 hover:border-teal-400 hover:shadow-xs transition-all flex flex-col justify-between cursor-pointer group"
          >
            <div>
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="p-2 rounded-lg bg-teal-50 text-teal-700 shrink-0 group-hover:bg-teal-100 transition-colors">
                  <FileText className="w-4 h-4" />
                </div>
                {doc.docId && (
                  <Badge variant="outline" className="font-mono text-[10px] bg-slate-50 border-slate-200">
                    {doc.docId}
                  </Badge>
                )}
              </div>

              <h3 className="font-semibold text-sm text-foreground line-clamp-2 mb-1 group-hover:text-teal-700 transition-colors">
                {doc.title}
              </h3>
              <p className="text-xs text-muted-foreground truncate mb-3">
                {doc.categoryName} › {doc.sectionName}
              </p>
            </div>

            <div className="pt-3 border-t border-border/60 flex items-center justify-between gap-2">
              <div className="min-w-0">
                {doc.owner ? (
                  <UserChip compact user={doc.owner} />
                ) : (
                  <span className="text-[11px] text-muted-foreground">Unassigned</span>
                )}
              </div>

              <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => onPreview(doc)}
                  className="text-muted-foreground hover:text-teal-700 hover:bg-teal-50"
                  title="Preview"
                >
                  <Eye className="w-3.5 h-3.5" />
                </Button>
                {userCanEdit && (
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => onEdit(doc._id)}
                    className="text-muted-foreground hover:text-teal-700 hover:bg-teal-50"
                    title="Edit"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </Button>
                )}
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
