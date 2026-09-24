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
import { ArrowRightLeft, Loader2 } from "lucide-react";
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
  const [selectedCatId, setSelectedCatId] = useState(currentCategoryId);
  const [selectedSecId, setSelectedSecId] = useState(currentSectionId);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSelectedCatId(currentCategoryId);
      setSelectedSecId(currentSectionId);
    }
  }, [isOpen, currentCategoryId, currentSectionId]);

  const targetCategory = categories.find((c) => c.id === selectedCatId);
  const targetSections = targetCategory?.sections ?? [];

  const handleCategoryChange = (catId: string) => {
    setSelectedCatId(catId);
    const newCategory = categories.find((c) => c.id === catId);
    // Auto-select first section in the newly selected category if available
    setSelectedSecId(newCategory?.sections[0]?.id ?? "");
  };

  const handleMove = async () => {
    if (!selectedCatId || !selectedSecId) return;
    if (selectedCatId === currentCategoryId && selectedSecId === currentSectionId) {
      onClose();
      return;
    }

    setIsSubmitting(true);
    try {
      await updateDocument(documentId, {
        categoryId: selectedCatId,
        sectionId: selectedSecId,
      });
      toast.success(`Moved "${documentTitle}" successfully`);
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to move document");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <ArrowRightLeft className="w-5 h-5 text-teal-600" />
            <span>Move Document</span>
          </DialogTitle>
          <DialogDescription className="truncate">
            Reassign <strong>&ldquo;{documentTitle}&rdquo;</strong> to a different category or section.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-3">
          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
              Destination Category
            </label>
            <Select value={selectedCatId} onValueChange={handleCategoryChange} disabled={isSubmitting}>
              <SelectTrigger>
                <SelectValue placeholder="Select Category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name} ({c.sections.length} sections)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
              Destination Section
            </label>
            <Select
              value={selectedSecId}
              onValueChange={setSelectedSecId}
              disabled={isSubmitting || targetSections.length === 0}
            >
              <SelectTrigger>
                <SelectValue placeholder={targetSections.length === 0 ? "No sections available" : "Select Section"} />
              </SelectTrigger>
              <SelectContent>
                {targetSections.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {targetSections.length === 0 && (
              <p className="text-xs text-amber-600 mt-1">
                This category has no sections. Create a section first to move documents here.
              </p>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleMove}
            disabled={!selectedSecId || isSubmitting}
            className="bg-teal-600 hover:bg-teal-700 text-white"
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : null}
            Confirm Move
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
