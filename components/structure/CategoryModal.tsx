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
import { Loader2, FolderPlus, Edit3 } from "lucide-react";
import { useDocumentTree } from "@/hooks/use-document-tree";
import { toast } from "sonner";

interface CategoryModalProps {
  isOpen: boolean;
  mode: "create" | "rename";
  categoryId?: string;
  initialName?: string;
  onClose: () => void;
}

export function CategoryModal({
  isOpen,
  mode,
  categoryId,
  initialName = "",
  onClose,
}: CategoryModalProps) {
  const [name, setName] = useState(initialName);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { createCategory, updateCategory } = useDocumentTree();

  useEffect(() => {
    if (isOpen) setName(initialName);
  }, [isOpen, initialName]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
      if (mode === "create") {
        await createCategory(name.trim());
        toast.success(`Category "${name.trim()}" created`);
      } else if (categoryId) {
        await updateCategory(categoryId, { name: name.trim() });
        toast.success(`Category renamed to "${name.trim()}"`);
      }
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save category");
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
                  <FolderPlus className="w-5 h-5 text-teal-600" />
                  <span>Create Category</span>
                </>
              ) : (
                <>
                  <Edit3 className="w-5 h-5 text-teal-600" />
                  <span>Rename Category</span>
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {mode === "create"
                ? "Add a top-level category to organize sections and documents."
                : "Enter a new name for this category."}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <Input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Engineering & Technology"
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
              {mode === "create" ? "Create Category" : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
