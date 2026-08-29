"use client";

import { SearchBar } from "@/components/SearchBar";
import { SectionCard } from "@/components/SectionCard";
import type { CategoryNode } from "@/lib/api/documents.api";
import type { Faq } from "@/lib/api/faq.api";
import {
  BookOpen,
  ChevronDown,
  HelpCircle,
  Sparkles,
  Layers,
} from "lucide-react";
import { appConfig } from "@/config/app.config";

interface SearchWrapperProps {
  categories: CategoryNode[];
  initialQuery?: string;
  faqs: Faq[];
}

export function SearchWrapper({
  categories,
  faqs,
}: SearchWrapperProps) {
  const totalDocs = categories.reduce((sum, cat) => sum + cat.count, 0);

  return (
    <>
      {/* ─── Hero ──────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden py-20 sm:py-28" style={{ background: "#1e3a8a" }}>

        <div className="relative mx-auto max-w-3xl px-4 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border mb-7 text-xs font-medium backdrop-blur-sm" style={{ background: "rgba(255,255,255,0.06)", borderColor: "rgba(147,197,253,0.25)", color: "#93c5fd" }}>
            <Sparkles className="w-3.5 h-3.5" />
            {totalDocs} document{totalDocs !== 1 ? "s" : ""} across {categories.length} categories
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-[3.5rem] font-bold tracking-tight leading-[1.1] mb-5 text-white">
            {appConfig.tagline}
          </h1>
          <p className="text-base sm:text-lg mb-10 max-w-lg mx-auto leading-relaxed" style={{ color: "rgba(191,219,254,0.75)" }}>
            {appConfig.heroSubtitle}
          </p>

          {/* Search */}
          <div className="max-w-xl mx-auto">
            <SearchBar categories={categories} large />
          </div>

          {/* Category pills */}
          {categories.length > 0 && (
            <div className="flex flex-wrap items-center justify-center gap-2 mt-7">
              {categories.slice(0, 5).map((cat) => (
                <span
                  key={cat.id}
                  className="px-3 py-1 rounded-full text-xs font-medium cursor-default select-none transition-colors"
                  style={{
                    background: "rgba(255,255,255,0.08)",
                    color: "#bfdbfe",
                    border: "1px solid rgba(255,255,255,0.1)",
                  }}
                >
                  {cat.name}
                  <span className="ml-1.5 opacity-60">{cat.count}</span>
                </span>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ─── Browse knowledge ──────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-14">
        {/* Section header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: "#eff6ff" }}>
              <Layers className="w-4 h-4" style={{ color: "#2563eb" }} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">Browse Knowledge</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Explore all content categories and documents</p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground">
            <BookOpen className="w-3.5 h-3.5" />
            {categories.length} categories
          </div>
        </div>

        {categories.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-16 text-center">
            <BookOpen className="w-8 h-8 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No content available yet.</p>
          </div>
        ) : (
          <>
            {/* Top 3-column grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-5">
              {categories.slice(0, 3).map((cat) => (
                <SectionCard key={cat.id} category={cat} />
              ))}
            </div>
            {/* Remaining categories full-width */}
            {categories.slice(3).map((cat) => (
              <div key={cat.id} className="mb-5">
                <SectionCard category={cat} fullWidth />
              </div>
            ))}
          </>
        )}
      </section>

      {/* ─── FAQ ───────────────────────────────────────────────────────── */}
      {faqs.length > 0 && (
        <section className="border-t border-border" style={{ background: "#f8faff" }}>
          <div className="mx-auto max-w-3xl px-4 sm:px-6 py-16">
            {/* Header */}
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: "#eff6ff" }}>
                <HelpCircle className="w-4 h-4" style={{ color: "#2563eb" }} />
              </div>
              <h2 className="text-lg font-semibold text-foreground">Frequently Asked Questions</h2>
            </div>
            <p className="text-sm text-muted-foreground mb-8 ml-11">
              Quick answers to common questions about our knowledge base.
            </p>

            {/* Accordion */}
            <div className="divide-y divide-border rounded-xl border border-border overflow-hidden shadow-sm bg-white">
              {faqs.map((faq) => (
                <details key={faq._id} className="group">
                  <summary className="flex items-center justify-between gap-4 px-5 py-4 cursor-pointer select-none list-none hover:bg-blue-50/50 transition-colors">
                    <span className="text-sm font-medium text-foreground">{faq.question}</span>
                    <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0 transition-transform duration-200 group-open:rotate-180" />
                  </summary>
                  <div className="px-5 pb-5 pt-1 text-sm text-muted-foreground leading-relaxed border-t border-border/50 bg-blue-50/20">
                    {faq.answer}
                  </div>
                </details>
              ))}
            </div>

          </div>
        </section>
      )}
    </>
  );
}
