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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, BookPlus, Edit3 } from "lucide-react";
import { useDocumentTree } from "@/hooks/use-document-tree";
import { toast } from "sonner";

interface SectionModalProps {
  isOpen: boolean;
  mode: "create" | "rename";
  categoryId: string;
  categoryName: string;
  sectionId?: string;
  initialName?: string;
  onClose: () => void;
}

export function SectionModal({
  isOpen,
  mode,
  categoryId,
  categoryName,
  sectionId,
  initialName = "",
  onClose,
}: SectionModalProps) {
  const [name, setName] = useState(initialName);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { createSection, updateSection } = useDocumentTree();

  useEffect(() => {
    if (isOpen) setName(initialName);
  }, [isOpen, initialName]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
      if (mode === "create") {
        await createSection(categoryId, name.trim());
        toast.success(`Section "${name.trim()}" created in ${categoryName}`);
      } else if (sectionId) {
        await updateSection(sectionId, { name: name.trim() });
        toast.success(`Section renamed to "${name.trim()}"`);
      }
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save section");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-foreground">
              {mode === "create" ? (
                <>
                  <BookPlus className="w-5 h-5 text-teal-600" />
                  <span>Add Section</span>
                </>
              ) : (
                <>
                  <Edit3 className="w-5 h-5 text-teal-600" />
                  <span>Rename Section</span>
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {mode === "create" ? (
                <>
                  Create a new section within <strong>{categoryName}</strong>.
                </>
              ) : (
                "Enter a new name for this section."
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <Input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Procedures & Runbooks"
              disabled={isSubmitting}
              className="w-full"
            />
          </div>

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!name.trim() || isSubmitting}
              className="bg-teal-600 hover:bg-teal-700 text-white"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
              ) : null}
              {mode === "create" ? "Create Section" : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
