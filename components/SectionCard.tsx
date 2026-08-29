"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronRight, FileText, Folder, BookOpen } from "lucide-react";
import type { CategoryNode } from "@/lib/api/documents.api";

interface SectionCardProps {
  category: CategoryNode;
  fullWidth?: boolean;
}

export function SectionCard({
  category,
  fullWidth = false,
}: SectionCardProps) {
  const [openSections, setOpenSections] = useState<Set<string>>(new Set());

  const toggle = (id: string) => {
    setOpenSections((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div
      className={`bg-card text-card-foreground border border-border rounded-2xl p-6 transition-all duration-300 hover:shadow-xl hover:shadow-black/5 hover:-translate-y-0.5 relative overflow-hidden flex flex-col justify-between ${
        fullWidth ? "w-full" : ""
      }`}
    >
      {/* Subtle Top Gradient Ribbon */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 via-indigo-500 to-blue-500" />

      <div>
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold shrink-0">
              <Folder className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-foreground tracking-tight truncate">
              {category.name}
            </h3>
          </div>
          <span className="inline-flex items-center justify-center h-6 px-2.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
            {category.count} doc{category.count !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Section List */}
        <div className="space-y-1">
          {category.sections.map((section) => {
            const isOpen = openSections.has(section.id);
            const hasDocs = section.documents.length > 0;

            return (
              <div key={section.id} className="rounded-xl overflow-hidden">
                <button
                  onClick={() => hasDocs && toggle(section.id)}
                  className={`w-full flex items-center gap-2.5 text-xs text-muted-foreground transition-all group text-left px-2.5 py-2 rounded-xl ${
                    hasDocs
                      ? "hover:text-foreground hover:bg-muted/60 cursor-pointer"
                      : "cursor-default"
                  } ${isOpen ? "text-foreground bg-muted/50 font-medium" : ""}`}
                  aria-expanded={isOpen}
                >
                  <ChevronRight
                    className={`h-3.5 w-3.5 shrink-0 transition-transform duration-200 ${
                      isOpen ? "rotate-90 text-primary" : "text-muted-foreground/60"
                    }`}
                  />
                  <span
                    className={`truncate text-xs ${
                      isOpen ? "font-semibold text-primary" : "text-foreground/90"
                    }`}
                  >
                    {section.name}
                  </span>
                  {hasDocs && (
                    <span className="ml-auto text-[10px] bg-muted px-1.5 py-0.5 rounded-md text-muted-foreground font-medium tabular-nums">
                      {section.documents.length}
                    </span>
                  )}
                </button>

                {isOpen && hasDocs && (
                  <div className="ml-6 pl-2 border-l border-border/80 my-1 space-y-1.5 py-1">
                    {section.documents.map((doc) => (
                      <Link
                        key={doc._id}
                        href={`/documents/${category.slug}/${section.slug}/${doc.slug}`}
                        className="flex items-center gap-2 text-xs py-1 px-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-muted/40 transition-colors group/item"
                      >
                        <FileText className="h-3.5 w-3.5 shrink-0 text-blue-500/70 group-hover/item:text-blue-600" />
                        <span className="truncate group-hover/item:underline underline-offset-2 font-medium">
                          {doc.title}
                        </span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
