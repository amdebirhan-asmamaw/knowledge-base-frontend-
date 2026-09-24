"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ArrowRightLeft, Loader2, Folder, BookOpen } from "lucide-react";
import { useDocumentTree } from "@/hooks/use-document-tree";
import { toast } from "sonner";

interface MoveDocumentDialogProps {
  isOpen: boolean;
  documentId: string;
  documentTitle: string;
  currentCategoryId: string;
  currentSectionId: string;
  onClose: () => void;
}

export function MoveDocumentDialog({
  isOpen,
  documentId,
  documentTitle,
  currentCategoryId,
  currentSectionId,
  onClose,
}: MoveDocumentDialogProps) {
  const { categories, updateDocument } = useDocumentTree();
  const [selectedCatId, setSelectedCatId] = useState(String(currentCategoryId || ""));
  const [selectedSecId, setSelectedSecId] = useState(String(currentSectionId || ""));
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const catId = String(currentCategoryId || (categories[0]?.id ?? ""));
      setSelectedCatId(catId);
      const cat = categories.find((c) => String(c.id) === catId);
      const secId = String(currentSectionId || (cat?.sections[0]?.id ?? ""));
      setSelectedSecId(secId);
    }
  }, [isOpen, currentCategoryId, currentSectionId, categories]);

  const targetCategory = categories.find((c) => String(c.id) === String(selectedCatId));
  const targetSections = targetCategory?.sections ?? [];

  const handleCategoryChange = (catId: string) => {
    setSelectedCatId(catId);
    const newCategory = categories.find((c) => String(c.id) === String(catId));
    if (newCategory?.sections && newCategory.sections.length > 0) {
      setSelectedSecId(String(newCategory.sections[0].id));
    } else {
      setSelectedSecId("");
    }
  };

  const handleMove = async () => {
    if (!selectedCatId || !selectedSecId) {
      toast.error("Please select a destination category and section");
      return;
    }
    if (String(selectedCatId) === String(currentCategoryId) && String(selectedSecId) === String(currentSectionId)) {
      onClose();
      return;
    }

    setIsSubmitting(true);
    try {
      await updateDocument(documentId, {
        categoryId: selectedCatId,
        sectionId: selectedSecId,
      });
      toast.success(`Document moved successfully`);
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to move document");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md bg-white border border-border shadow-2xl p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground text-lg font-bold">
            <div className="p-2 rounded-lg bg-teal-50 text-teal-700">
              <ArrowRightLeft className="w-5 h-5" />
            </div>
            <span>Move Document</span>
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground mt-1">
            Reassign <span className="font-semibold text-foreground line-clamp-1 inline break-all">&ldquo;{documentTitle}&rdquo;</span> to a different category or section.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-3">
          <div>
            <label className="flex items-center gap-1.5 text-xs font-semibold text-foreground uppercase tracking-wider mb-1.5">
              <Folder className="w-3.5 h-3.5 text-teal-600" />
              <span>Destination Category</span>
            </label>
            <Select value={selectedCatId || undefined} onValueChange={handleCategoryChange} disabled={isSubmitting}>
              <SelectTrigger className="w-full bg-slate-50/70 border-border">
                <SelectValue placeholder="Select Category" />
              </SelectTrigger>
              <SelectContent className="bg-white border border-border shadow-lg z-50">
                {categories.map((c) => (
                  <SelectItem key={String(c.id)} value={String(c.id)}>
                    {c.name} ({c.sections.length} {c.sections.length === 1 ? "section" : "sections"})
                    {String(c.id) === String(currentCategoryId) ? " • Current" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="flex items-center gap-1.5 text-xs font-semibold text-foreground uppercase tracking-wider mb-1.5">
              <BookOpen className="w-3.5 h-3.5 text-slate-600" />
              <span>Destination Section</span>
            </label>
            <Select
              value={selectedSecId || undefined}
              onValueChange={setSelectedSecId}
              disabled={isSubmitting || targetSections.length === 0}
            >
              <SelectTrigger className="w-full bg-slate-50/70 border-border">
                <SelectValue placeholder={targetSections.length === 0 ? "No sections available" : "Select Section"} />
              </SelectTrigger>
              <SelectContent className="bg-white border border-border shadow-lg z-50">
                {targetSections.map((s) => (
                  <SelectItem key={String(s.id)} value={String(s.id)}>
                    {s.name}
                    {String(s.id) === String(currentSectionId) ? " • Current" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {targetSections.length === 0 && (
              <p className="text-xs text-amber-600 mt-1.5">
                This category has no sections. Create a section first to move documents here.
              </p>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0 pt-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleMove}
            disabled={
              !selectedSecId ||
              isSubmitting ||
              (String(selectedCatId) === String(currentCategoryId) &&
                String(selectedSecId) === String(currentSectionId))
            }
            className="bg-teal-600 hover:bg-teal-700 text-white font-medium"
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : null}
            {String(selectedCatId) === String(currentCategoryId) &&
            String(selectedSecId) === String(currentSectionId)
              ? "Current Location"
              : "Confirm Move"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
