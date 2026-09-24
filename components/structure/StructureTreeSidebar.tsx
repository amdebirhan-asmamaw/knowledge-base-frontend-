"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Search,
  Folder,
  FolderOpen,
  BookOpen,
  Files,
  FileUser,
  EyeOff,
  MoreVertical,
  Plus,
  Edit2,
  Trash2,
  ChevronDown,
  ChevronRight,
  FolderPlus,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useDocumentTree } from "@/hooks/use-document-tree";
import type { CategoryNode, SectionNode } from "@/lib/api/documents.api";
import type { ActiveSelection } from "./types";

interface StructureTreeSidebarProps {
  categories: CategoryNode[];
  activeSelection: ActiveSelection;
  onSelect: (selection: ActiveSelection) => void;
  onOpenCreateCategory: () => void;
  onOpenRenameCategory: (cat: CategoryNode) => void;
  onOpenCreateSection: (cat: CategoryNode) => void;
  onOpenRenameSection: (sec: SectionNode, cat: CategoryNode) => void;
  onDeleteCategory: (cat: CategoryNode) => void;
  onDeleteSection: (sec: SectionNode) => void;
  totalDocsCount: number;
}

export function StructureTreeSidebar({
  categories,
  activeSelection,
  onSelect,
  onOpenCreateCategory,
  onOpenRenameCategory,
  onOpenCreateSection,
  onOpenRenameSection,
  onDeleteCategory,
  onDeleteSection,
  totalDocsCount,
}: StructureTreeSidebarProps) {
  const { hasPermission } = useAuth();
  const { updateCategory, updateSection } = useDocumentTree();
  const [filterQuery, setFilterQuery] = useState("");
  const [expandedCats, setExpandedCats] = useState<Set<string>>(
    new Set(categories.map((c) => c.id))
  );

  const canCreateCat = hasPermission("structure:category:create");
  const canUpdateCat = hasPermission("structure:category:update");
  const canToggleCat = hasPermission("structure:category:toggle-visibility");
  const canDeleteCat = hasPermission("structure:category:delete");

  const canCreateSec = hasPermission("structure:section:create");
  const canUpdateSec = hasPermission("structure:section:update");
  const canToggleSec = hasPermission("structure:section:toggle-visibility");
  const canDeleteSec = hasPermission("structure:section:delete");

  const toggleExpand = (catId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedCats((prev) => {
      const next = new Set(prev);
      if (next.has(catId)) next.delete(catId);
      else next.add(catId);
      return next;
    });
  };

  const handleToggleCatVisibility = async (cat: CategoryNode, current: boolean) => {
    await updateCategory(cat.id, { isActive: !current });
  };

  const handleToggleSecVisibility = async (sec: SectionNode, current: boolean) => {
    await updateSection(sec.id, { isActive: !current });
  };

  // Filter categories and sections by query
  const query = filterQuery.trim().toLowerCase();
  const filteredCategories = categories.filter((cat) => {
    if (!query) return true;
    if (cat.name.toLowerCase().includes(query)) return true;
    return cat.sections.some(
      (s) =>
        s.name.toLowerCase().includes(query) ||
        s.documents.some((d) => d.title.toLowerCase().includes(query))
    );
  });

  return (
    <aside className="w-full lg:w-80 shrink-0 bg-white border border-border rounded-xl flex flex-col overflow-hidden shadow-2xs">
      {/* Search Header */}
      <div className="p-3 border-b border-border bg-slate-50/50">
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            placeholder="Filter tree..."
            className="pl-8 h-8 text-xs bg-white"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-4">
        {/* Quick Views */}
        <div>
          <p className="px-2 text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
            Quick Views
          </p>
          <div className="space-y-0.5">
            <button
              onClick={() => onSelect({ type: "all" })}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                activeSelection.type === "all"
                  ? "bg-teal-50 text-teal-800 font-semibold"
                  : "text-muted-foreground hover:bg-slate-100 hover:text-foreground"
              }`}
            >
              <div className="flex items-center gap-2">
                <Files className="w-3.5 h-3.5 text-teal-600" />
                <span>All Documents</span>
              </div>
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 font-normal">
                {totalDocsCount}
              </Badge>
            </button>

            <button
              onClick={() => onSelect({ type: "my_docs" })}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                activeSelection.type === "my_docs"
                  ? "bg-teal-50 text-teal-800 font-semibold"
                  : "text-muted-foreground hover:bg-slate-100 hover:text-foreground"
              }`}
            >
              <div className="flex items-center gap-2">
                <FileUser className="w-3.5 h-3.5 text-blue-600" />
                <span>My Documents</span>
              </div>
            </button>

            <button
              onClick={() => onSelect({ type: "hidden" })}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                activeSelection.type === "hidden"
                  ? "bg-teal-50 text-teal-800 font-semibold"
                  : "text-muted-foreground hover:bg-slate-100 hover:text-foreground"
              }`}
            >
              <div className="flex items-center gap-2">
                <EyeOff className="w-3.5 h-3.5 text-amber-600" />
                <span>Hidden Items</span>
              </div>
            </button>
          </div>
        </div>

        {/* Categories Tree */}
        <div>
          <div className="flex items-center justify-between px-2 mb-1">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              Categories & Sections
            </p>
            {canCreateCat && (
              <button
                onClick={onOpenCreateCategory}
                className="text-teal-700 hover:text-teal-800 p-0.5 rounded hover:bg-teal-50"
                title="Add Category"
              >
                <FolderPlus className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="space-y-1">
            {filteredCategories.length === 0 ? (
              <p className="text-xs text-muted-foreground px-2 py-3 text-center">
                No matching categories.
              </p>
            ) : (
              filteredCategories.map((category) => {
                const isExpanded = query ? true : expandedCats.has(category.id);
                const isCatSelected =
                  activeSelection.type === "category" &&
                  activeSelection.categoryId === category.id;

                return (
                  <div key={category.id} className="space-y-0.5">
                    {/* Category Item */}
                    <div
                      onClick={() => onSelect({ type: "category", categoryId: category.id })}
                      className={`group flex items-center justify-between px-2 py-1.5 rounded-lg text-xs cursor-pointer transition-colors ${
                        isCatSelected
                          ? "bg-teal-100/70 text-teal-900 font-semibold"
                          : "text-foreground hover:bg-slate-100/80"
                      }`}
                    >
                      <div className="flex items-center gap-1.5 min-w-0 flex-1">
                        <button
                          onClick={(e) => toggleExpand(category.id, e)}
                          className="p-0.5 hover:bg-slate-200 rounded text-muted-foreground"
                        >
                          {isExpanded ? (
                            <ChevronDown className="w-3.5 h-3.5" />
                          ) : (
                            <ChevronRight className="w-3.5 h-3.5" />
                          )}
                        </button>
                        {isExpanded ? (
                          <FolderOpen className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                        ) : (
                          <Folder className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                        )}
                        <span className="truncate">{category.name}</span>
                        {category.isActive === false && (
                          <Badge variant="outline" className="text-[9px] px-1 py-0 text-amber-700 border-amber-300">
                            Hidden
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0 font-normal">
                          {category.count}
                        </Badge>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon-sm" className="h-6 w-6 text-muted-foreground">
                              <MoreVertical className="w-3.5 h-3.5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-40 text-xs">
                            {canCreateSec && (
                              <DropdownMenuItem onClick={() => onOpenCreateSection(category)}>
                                <Plus className="w-3.5 h-3.5 mr-2" /> Add Section
                              </DropdownMenuItem>
                            )}
                            {canUpdateCat && (
                              <DropdownMenuItem onClick={() => onOpenRenameCategory(category)}>
                                <Edit2 className="w-3.5 h-3.5 mr-2" /> Rename
                              </DropdownMenuItem>
                            )}
                            {canToggleCat && (
                              <DropdownMenuItem
                                onClick={() => handleToggleCatVisibility(category, category.isActive !== false)}
                              >
                                <EyeOff className="w-3.5 h-3.5 mr-2" />
                                {category.isActive !== false ? "Hide Category" : "Show Category"}
                              </DropdownMenuItem>
                            )}
                            {canDeleteCat && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => onDeleteCategory(category)}
                                  className="text-red-600 focus:text-red-700"
                                >
                                  <Trash2 className="w-3.5 h-3.5 mr-2" /> Delete
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>

                    {/* Section Sub-Items */}
                    {isExpanded && (
                      <div className="ml-5 pl-2 border-l border-border/80 space-y-0.5">
                        {category.sections.map((section) => {
                          const isSecSelected =
                            activeSelection.type === "section" &&
                            activeSelection.sectionId === section.id;

                          return (
                            <div
                              key={section.id}
                              onClick={() =>
                                onSelect({
                                  type: "section",
                                  categoryId: category.id,
                                  sectionId: section.id,
                                })
                              }
                              className={`group flex items-center justify-between px-2 py-1 rounded-md text-xs cursor-pointer transition-colors ${
                                isSecSelected
                                  ? "bg-teal-50 text-teal-800 font-semibold"
                                  : "text-muted-foreground hover:bg-slate-100 hover:text-foreground"
                              }`}
                            >
                              <div className="flex items-center gap-1.5 min-w-0 flex-1">
                                <BookOpen className="w-3 h-3 text-slate-500 shrink-0" />
                                <span className="truncate">{section.name}</span>
                                {section.isActive === false && (
                                  <Badge variant="outline" className="text-[9px] px-1 py-0 text-amber-700 border-amber-300">
                                    Hidden
                                  </Badge>
                                )}
                              </div>

                              <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                                <span className="text-[10px] text-muted-foreground">
                                  {section.documents.length}
                                </span>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon-sm" className="h-5 w-5 text-muted-foreground">
                                      <MoreVertical className="w-3 h-3" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" className="w-36 text-xs">
                                    {canUpdateSec && (
                                      <DropdownMenuItem onClick={() => onOpenRenameSection(section, category)}>
                                        <Edit2 className="w-3.5 h-3.5 mr-2" /> Rename
                                      </DropdownMenuItem>
                                    )}
                                    {canToggleSec && (
                                      <DropdownMenuItem
                                        onClick={() => handleToggleSecVisibility(section, section.isActive !== false)}
                                      >
                                        <EyeOff className="w-3.5 h-3.5 mr-2" />
                                        {section.isActive !== false ? "Hide Section" : "Show Section"}
                                      </DropdownMenuItem>
                                    )}
                                    {canDeleteSec && (
                                      <>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem
                                          onClick={() => onDeleteSection(section)}
                                          className="text-red-600 focus:text-red-700"
                                        >
                                          <Trash2 className="w-3.5 h-3.5 mr-2" /> Delete
                                        </DropdownMenuItem>
                                      </>
                                    )}
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}
