"use client";

import { Input } from "@/components/ui/input";
import { Search, FileText, FolderOpen, X, Command, CornerDownLeft } from "lucide-react";
import { useState, useRef, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import type { CategoryNode } from "@/lib/api/documents.api";

interface SearchBarProps {
  onSearch?: (query: string) => void;
  large?: boolean;
  categories?: CategoryNode[];
  placeholder?: string;
}

interface SuggestionItem {
  type: "document" | "section" | "category";
  title: string;
  breadcrumb: string;
  slug: string;
  href: string;
}

export function SearchBar({
  onSearch,
  large = false,
  categories = [],
  placeholder,
}: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Build a flat index of all searchable items
  const allItems = useMemo<SuggestionItem[]>(() => {
    const items: SuggestionItem[] = [];
    for (const cat of categories) {
      items.push({
        type: "category",
        title: cat.name,
        breadcrumb: "Category",
        slug: cat.slug,
        href: `/?q=${encodeURIComponent(cat.name)}`,
      });
      for (const sec of cat.sections) {
        items.push({
          type: "section",
          title: sec.name,
          breadcrumb: cat.name,
          slug: `${cat.slug}/${sec.slug}`,
          href: `/?q=${encodeURIComponent(sec.name)}`,
        });
        for (const doc of sec.documents) {
          items.push({
            type: "document",
            title: doc.title,
            breadcrumb: `${cat.name} › ${sec.name}`,
            slug: doc.slug,
            href: `/documents/${cat.slug}/${sec.slug}/${doc.slug}`,
          });
        }
      }
    }
    return items;
  }, [categories]);

  // Filter suggestions based on query
  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q || q.length < 2) return [];
    return allItems
      .filter(
        (item) =>
          item.title.toLowerCase().includes(q) ||
          item.breadcrumb.toLowerCase().includes(q)
      )
      .slice(0, 6);
  }, [query, allItems]);

  const showDropdown = isFocused && suggestions.length > 0;

  // Global hotkey '/' or 'Ctrl+K' to focus search
  useEffect(() => {
    const handleGlobalKey = (e: KeyboardEvent) => {
      const activeTag = document.activeElement?.tagName.toLowerCase();
      if (activeTag === "input" || activeTag === "textarea") return;

      if (e.key === "/" || ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k")) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleGlobalKey);
    return () => window.removeEventListener("keydown", handleGlobalKey);
  }, []);

  // Close on click outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(e.target as Node)
      ) {
        setIsFocused(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Reset selected index when suggestions change
  useEffect(() => {
    setSelectedIdx(-1);
  }, [suggestions]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    onSearch?.(value);
  };

  const handleClear = () => {
    setQuery("");
    onSearch?.("");
    inputRef.current?.focus();
  };

  const handleSelect = (item: SuggestionItem) => {
    setIsFocused(false);
    if (item.type === "document") {
      router.push(item.href);
    } else {
      setQuery(item.title);
      onSearch?.(item.title);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showDropdown) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIdx((prev) =>
        prev < suggestions.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIdx((prev) =>
        prev > 0 ? prev - 1 : suggestions.length - 1
      );
    } else if (e.key === "Enter" && selectedIdx >= 0) {
      e.preventDefault();
      handleSelect(suggestions[selectedIdx]);
    } else if (e.key === "Escape") {
      setIsFocused(false);
    }
  };

  const iconForType = (type: string) => {
    switch (type) {
      case "document":
        return (
          <div className="w-6 h-6 rounded-md bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <FileText className="w-3.5 h-3.5" />
          </div>
        );
      case "section":
        return (
          <div className="w-6 h-6 rounded-md bg-emerald-100/60 text-emerald-700 flex items-center justify-center shrink-0">
            <FolderOpen className="w-3.5 h-3.5" />
          </div>
        );
      case "category":
        return (
          <div className="w-6 h-6 rounded-md bg-teal-50 text-teal-700 flex items-center justify-center shrink-0">
            <FolderOpen className="w-3.5 h-3.5" />
          </div>
        );
      default:
        return (
          <div className="w-6 h-6 rounded-md bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
            <FileText className="w-3.5 h-3.5" />
          </div>
        );
    }
  };

  // Highlight matching text
  const highlightMatch = (text: string, q: string) => {
    if (!q.trim()) return text;
    const idx = text.toLowerCase().indexOf(q.toLowerCase());
    if (idx === -1) return text;
    return (
      <>
        {text.slice(0, idx)}
        <span className="text-emerald-600 font-semibold bg-emerald-50/80 px-0.5 rounded">
          {text.slice(idx, idx + q.length)}
        </span>
        {text.slice(idx + q.length)}
      </>
    );
  };

  if (large) {
    return (
      <div className="w-full max-w-2xl mx-auto" ref={wrapperRef}>
        <div className="relative group">
          {/* Subtle Glow behind search input */}
          <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500/20 via-teal-500/30 to-emerald-500/20 rounded-2xl blur-md opacity-40 group-focus-within:opacity-100 transition-opacity duration-300" />

          <div className="relative flex items-center bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-emerald-900/50 shadow-lg shadow-emerald-950/5 group-focus-within:border-emerald-500 group-focus-within:ring-4 group-focus-within:ring-emerald-500/15 transition-all">
            <Search className="ml-4 h-5 w-5 text-emerald-600 shrink-0" />
            
            <Input
              ref={inputRef}
              type="text"
              placeholder={placeholder || "Search policies, cargo procedures, branch directories, manuals…"}
              value={query}
              onChange={handleChange}
              onFocus={() => setIsFocused(true)}
              onKeyDown={handleKeyDown}
              className="pl-3 pr-20 py-6 bg-transparent border-0 text-slate-900 dark:text-white placeholder:text-slate-400 text-sm sm:text-base focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none font-normal"
            />

            <div className="absolute right-3 flex items-center gap-1.5">
              {query ? (
                <button
                  type="button"
                  onClick={handleClear}
                  className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 transition-colors"
                  aria-label="Clear search"
                >
                  <X className="w-4 h-4" />
                </button>
              ) : (
                <div className="hidden sm:flex items-center gap-1 px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 text-[11px] font-mono text-slate-500 select-none">
                  <span className="text-[10px]">Press</span>
                  <kbd className="font-semibold text-slate-700 dark:text-slate-300">/</kbd>
                </div>
              )}
            </div>
          </div>

          {/* Suggestions dropdown */}
          {showDropdown && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-emerald-900/60 rounded-xl shadow-xl shadow-slate-950/10 overflow-hidden z-50 animate-in fade-in-50 slide-in-from-top-1 duration-150">
              <div className="p-2 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/50">
                <span className="text-[11px] font-mono uppercase tracking-wider font-semibold text-slate-500">
                  Instant Results ({suggestions.length})
                </span>
                <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                  Navigate with ↑↓ <CornerDownLeft className="w-2.5 h-2.5 inline" />
                </span>
              </div>

              <div className="p-1.5 divide-y divide-slate-100/70 dark:divide-slate-800/50">
                {suggestions.map((item, i) => (
                  <button
                    key={`${item.type}-${item.slug}`}
                    onClick={() => handleSelect(item)}
                    onMouseEnter={() => setSelectedIdx(i)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 text-left rounded-lg transition-colors ${
                      i === selectedIdx
                        ? "bg-emerald-50/80 dark:bg-emerald-950/40 text-emerald-950 dark:text-emerald-200"
                        : "hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-200"
                    }`}
                  >
                    <div className="shrink-0">{iconForType(item.type)}</div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate text-slate-900 dark:text-white">
                        {highlightMatch(item.title, query)}
                      </p>
                      <p className="text-[11px] text-slate-400 truncate mt-0.5">
                        {item.breadcrumb}
                      </p>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full uppercase bg-slate-100 dark:bg-slate-800 text-slate-500 font-medium shrink-0">
                      {item.type}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="relative" ref={wrapperRef}>
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-emerald-600 z-10" />
      <Input
        ref={inputRef}
        type="text"
        placeholder={placeholder || "Search knowledge base…"}
        value={query}
        onChange={handleChange}
        onFocus={() => setIsFocused(true)}
        onKeyDown={handleKeyDown}
        className={`pl-9 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-lg text-xs focus-visible:ring-emerald-500/20 focus-visible:border-emerald-500 ${query ? "pr-8" : ""}`}
      />
      {query && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded hover:bg-slate-100 text-slate-400 z-10"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}

      {/* Suggestions dropdown */}
      {showDropdown && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-lg overflow-hidden z-50">
          <div className="py-1">
            {suggestions.map((item, i) => (
              <button
                key={`${item.type}-${item.slug}`}
                onClick={() => handleSelect(item)}
                onMouseEnter={() => setSelectedIdx(i)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors ${
                  i === selectedIdx
                    ? "bg-emerald-50 dark:bg-emerald-950/30"
                    : "hover:bg-slate-50 dark:hover:bg-slate-800"
                }`}
              >
                <div className="shrink-0">{iconForType(item.type)}</div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-slate-800 dark:text-slate-200 truncate font-medium">
                    {highlightMatch(item.title, query)}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
