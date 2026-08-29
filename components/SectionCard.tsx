"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronRight, FileText, Folder, FolderOpen, ArrowRight } from "lucide-react";
import type { CategoryNode } from "@/lib/api/documents.api";

interface SectionCardProps {
  category: CategoryNode;
  fullWidth?: boolean;
}

export function SectionCard({
  category,
  fullWidth = false,
}: SectionCardProps) {
  const [openSections, setOpenSections] = useState<Set<string>>(
    // Open first section by default for instant preview
    new Set(category.sections.slice(0, 1).map((s) => s.id))
  );

  const toggle = (id: string) => {
    setOpenSections((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const expandAll = () => {
    setOpenSections(new Set(category.sections.map((s) => s.id)));
  };

  const collapseAll = () => {
    setOpenSections(new Set());
  };

  const allOpen = category.sections.length > 0 && openSections.size === category.sections.length;

  return (
    <div
      className={`group/card bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-emerald-950/60 rounded-2xl p-5 sm:p-6 transition-all duration-300 hover:shadow-xl hover:shadow-emerald-950/5 hover:border-emerald-500/30 hover:-translate-y-0.5 relative overflow-hidden flex flex-col justify-between ${
        fullWidth ? "w-full" : ""
      }`}
    >
      {/* Subtle Top Gradient Ribbon */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-400 opacity-80 group-hover/card:opacity-100 transition-opacity" />

      <div>
        {/* Header */}
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/40 flex items-center justify-center font-bold shrink-0 shadow-xs">
              <Folder className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight truncate group-hover/card:text-emerald-700 dark:group-hover/card:text-emerald-300 transition-colors">
                {category.name}
              </h3>
              <p className="text-[11px] font-mono text-slate-400 dark:text-slate-500">
                {category.sections.length} section{category.sections.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
          <span className="inline-flex items-center justify-center h-6 px-2.5 rounded-full text-xs font-mono font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/70 dark:border-emerald-800/60 shrink-0">
            {category.count} doc{category.count !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Section List */}
        <div className="space-y-1.5">
          {category.sections.length === 0 ? (
            <p className="text-xs text-slate-400 py-3 text-center italic">No sections created yet.</p>
          ) : (
            category.sections.map((section) => {
              const isOpen = openSections.has(section.id);
              const hasDocs = section.documents.length > 0;

              return (
                <div key={section.id} className="rounded-xl overflow-hidden border border-transparent hover:border-slate-200/60 dark:hover:border-slate-800/60 transition-colors">
                  <button
                    onClick={() => hasDocs && toggle(section.id)}
                    className={`w-full flex items-center gap-2.5 text-xs text-slate-600 dark:text-slate-400 transition-all group/btn text-left px-3 py-2 rounded-xl ${
                      hasDocs
                        ? "hover:text-emerald-800 dark:hover:text-emerald-200 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20 cursor-pointer"
                        : "cursor-default opacity-60"
                    } ${isOpen ? "text-emerald-900 dark:text-emerald-200 bg-emerald-50/40 dark:bg-emerald-950/20 font-medium" : ""}`}
                    aria-expanded={isOpen}
                  >
                    <ChevronRight
                      className={`h-3.5 w-3.5 shrink-0 transition-transform duration-200 ${
                        isOpen ? "rotate-90 text-emerald-600 dark:text-emerald-400" : "text-slate-400"
                      }`}
                    />
                    <span
                      className={`truncate text-xs ${
                        isOpen ? "font-semibold text-emerald-900 dark:text-emerald-200" : "text-slate-700 dark:text-slate-300"
                      }`}
                    >
                      {section.name}
                    </span>
                    {hasDocs && (
                      <span className="ml-auto text-[10px] font-mono bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md text-slate-500 font-medium tabular-nums">
                        {section.documents.length}
                      </span>
                    )}
                  </button>

                  {isOpen && hasDocs && (
                    <div className="ml-6 pl-3 border-l-2 border-emerald-500/20 my-1.5 space-y-1 py-1">
                      {section.documents.map((doc) => (
                        <Link
                          key={doc._id}
                          href={`/documents/${category.slug}/${section.slug}/${doc.slug}`}
                          className="flex items-center gap-2 text-xs py-1.5 px-2.5 rounded-lg text-slate-600 dark:text-slate-400 hover:text-emerald-700 dark:hover:text-emerald-300 hover:bg-emerald-50/80 dark:hover:bg-emerald-950/40 transition-colors group/item"
                        >
                          <FileText className="h-3.5 w-3.5 shrink-0 text-emerald-500 group-hover/item:text-emerald-600" />
                          <span className="truncate group-hover/item:underline underline-offset-2 font-medium">
                            {doc.title}
                          </span>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Footer link to toggle collapse/expand if many sections */}
      {category.sections.length > 2 && (
        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px]">
          <button
            type="button"
            onClick={allOpen ? collapseAll : expandAll}
            className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 font-medium hover:underline cursor-pointer"
          >
            {allOpen ? "Collapse all" : "Expand all sections"}
          </button>
          <span className="font-mono text-slate-400">
            {category.count} total
          </span>
        </div>
      )}
    </div>
  );
}
