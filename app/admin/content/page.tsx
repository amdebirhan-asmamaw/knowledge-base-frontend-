"use client";

import { useState, useMemo } from "react";
import { useDocumentTree } from "@/hooks/use-document-tree";
import { DocumentEditor } from "@/components/DocumentEditor";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Edit2, FileText, X } from "lucide-react";

export default function ContentManagementPage() {
  const { categories, isLoading } = useDocumentTree();
  const [searchQuery, setSearchQuery] = useState("");
  const [editingDocId, setEditingDocId] = useState<string | null>(null);
  const [showNewForm, setShowNewForm] = useState(false);

  // Flatten all documents across categories and sections
  const allDocuments = useMemo(() => {
    return categories.flatMap((cat) =>
      cat.sections.flatMap((sec) =>
        sec.documents.map((doc) => ({
          ...doc,
          categoryId: cat.id,
          categoryName: cat.name,
          sectionId: sec.id,
          sectionName: sec.name,
        }))
      )
    );
  }, [categories]);

  // Filter documents by search query
  const filteredDocs = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return allDocuments;
    return allDocuments.filter(
      (doc) =>
        doc.title.toLowerCase().includes(q) ||
        (doc.docId && doc.docId.toLowerCase().includes(q)) ||
        doc.categoryName.toLowerCase().includes(q) ||
        doc.sectionName.toLowerCase().includes(q)
    );
  }, [allDocuments, searchQuery]);

  // If editing or creating, display the full DocumentEditor
  if (editingDocId || showNewForm) {
    return (
      <DocumentEditor
        documentId={editingDocId ?? undefined}
        onClose={() => {
          setEditingDocId(null);
          setShowNewForm(false);
        }}
      />
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* ── Top Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
            Manage Content
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Create, edit, and delete documents
          </p>
        </div>

        <Button
          onClick={() => setShowNewForm(true)}
          className="gap-2 bg-primary hover:bg-brand-700 text-primary-foreground px-5 h-10 font-medium rounded-xl shadow-xs self-start sm:self-auto transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>New Document</span>
        </Button>
      </div>

      {/* ── Full-Width Search Bar ── */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        <Input
          type="text"
          placeholder="Search documents by title, category, or section..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 pr-9 h-11 text-sm bg-white border-slate-200/90 rounded-xl shadow-2xs focus-visible:ring-2 focus-visible:ring-ring/20"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded-full transition-colors"
            title="Clear search"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* ── Documents List ── */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-20 rounded-2xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : filteredDocs.length === 0 ? (
        <Card className="p-12 text-center border-dashed rounded-2xl bg-slate-50/50">
          <FileText className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-foreground">No documents found</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
            {searchQuery
              ? `No documents match "${searchQuery}".`
              : "No documents available yet. Click above to create your first document."}
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredDocs.map((doc) => (
            <div
              key={doc._id}
              onClick={() => setEditingDocId(doc._id)}
              className="w-full bg-white border border-slate-200/90 rounded-2xl px-5 py-4 sm:px-6 sm:py-4.5 shadow-2xs hover:bg-slate-50/80 hover:border-slate-300 transition-all cursor-pointer flex flex-row items-center justify-between gap-4 text-left select-none group"
            >
              <div className="flex-1 min-w-0 text-left">
                <h2 className="text-sm sm:text-base font-semibold text-slate-900 truncate text-left mb-1">
                  {doc.title}
                </h2>
                <div className="text-xs text-slate-500 font-normal flex items-center flex-wrap gap-2 text-left">
                  <span>
                    {doc.categoryName} › {doc.sectionName}
                  </span>
                  {doc.docId && (
                    <span className="font-mono text-xs text-slate-400 font-normal">
                      {doc.docId}
                    </span>
                  )}
                </div>
              </div>

              <div
                className="flex items-center shrink-0 ml-4"
                onClick={(e) => {
                  e.stopPropagation();
                  setEditingDocId(doc._id);
                }}
              >
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="text-slate-400 hover:text-slate-700 hover:bg-slate-100 group-hover:text-slate-600 rounded-lg"
                  title="Edit document"
                >
                  <Edit2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
