"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
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
  Bot,
  FileText,
  CalendarCheck,
  ShieldCheck,
  ArrowRight,
  CheckCircle2,
  Lock,
  Search,
  Zap,
  Activity,
  FileCheck2,
  Database,
  Building2,
  Send,
} from "lucide-react";
import { appConfig } from "@/config/app.config";

interface SearchWrapperProps {
  categories: CategoryNode[];
  initialQuery?: string;
  faqs: Faq[];
}

export function SearchWrapper({
  categories,
  initialQuery = "",
  faqs,
}: SearchWrapperProps) {
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>("all");
  const [faqSearchQuery, setFaqSearchQuery] = useState<string>("");
  const [simulatedStep, setSimulatedStep] = useState<number>(3);

  const totalDocs = categories.reduce((sum, cat) => sum + cat.count, 0);

  // Filtered categories
  const filteredCategories = useMemo(() => {
    if (activeCategoryFilter === "all") return categories;
    return categories.filter((cat) => cat.slug === activeCategoryFilter || cat.id === activeCategoryFilter);
  }, [categories, activeCategoryFilter]);

  // Filtered FAQs
  const filteredFaqs = useMemo(() => {
    if (!faqSearchQuery.trim()) return faqs;
    const q = faqSearchQuery.toLowerCase();
    return faqs.filter(
      (f) => f.question.toLowerCase().includes(q) || f.answer.toLowerCase().includes(q)
    );
  }, [faqs, faqSearchQuery]);

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      {/* ─── Hero Section (Emerald Forest Theme) ────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#022c22] via-[#064e3b] to-[#043327] text-white pt-20 pb-28 sm:pt-24 sm:pb-36 border-b border-emerald-800/40">
        {/* Technical Blueprint Grid Pattern Overlay */}
        <div className="absolute inset-0 bg-tech-grid-dark opacity-75 pointer-events-none" />

        {/* Ambient Emerald Glow Elements */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-emerald-500/20 blur-[130px] rounded-full pointer-events-none" />
        <div className="absolute -top-10 right-10 w-[300px] h-[300px] bg-teal-400/10 blur-[90px] rounded-full pointer-events-none" />

        <div className="relative mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center z-10">
          {/* Overline Technical Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-emerald-400/30 bg-emerald-950/70 text-emerald-300 text-xs font-mono mb-8 backdrop-blur-md shadow-lg shadow-black/20">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-semibold text-white">01 —— SYSTEM REPOSITORY</span>
            <span className="text-emerald-400/60">•</span>
            <span>
              {totalDocs} document{totalDocs !== 1 ? "s" : ""} across {categories.length} categories
            </span>
          </div>

          {/* Headline */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.12] mb-6 text-white text-balance drop-shadow-sm">
            {appConfig.tagline}
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-lg mb-10 max-w-2xl mx-auto leading-relaxed text-emerald-100/85 font-normal">
            {appConfig.heroSubtitle}
          </p>

          {/* Enhanced Search Bar */}
          <div className="max-w-2xl mx-auto mb-8">
            <SearchBar categories={categories} large />
          </div>

          {/* Quick Search Category Tags */}
          {categories.length > 0 && (
            <div className="flex flex-wrap items-center justify-center gap-2 max-w-2xl mx-auto">
              <span className="text-[11px] font-mono uppercase tracking-wider text-emerald-300/70 mr-1 select-none">
                Popular:
              </span>
              {categories.slice(0, 5).map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => {
                    setActiveCategoryFilter(cat.slug);
                    const el = document.getElementById("knowledge-domains");
                    el?.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium bg-emerald-900/40 hover:bg-emerald-800/60 border border-emerald-400/20 hover:border-emerald-400/40 text-emerald-200 hover:text-white transition-all cursor-pointer shadow-xs"
                >
                  <span>{cat.name}</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 bg-emerald-950/60 text-emerald-300 rounded">
                    {cat.count}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ─── Metric Highlights Bar ────────────────────────────────────────── */}
      <section className="relative -mt-12 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 z-20">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/90 dark:border-emerald-900/40 shadow-xl shadow-slate-900/5 flex items-center gap-3.5 hover:border-emerald-500/40 transition-colors">
            <div className="w-11 h-11 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-200/50 dark:border-emerald-800/40">
              <BookOpen className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-mono uppercase text-slate-500 dark:text-slate-400">Total Records</p>
              <p className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                {totalDocs} Verified SOPs
              </p>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/90 dark:border-emerald-900/40 shadow-xl shadow-slate-900/5 flex items-center gap-3.5 hover:border-emerald-500/40 transition-colors">
            <div className="w-11 h-11 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-200/50 dark:border-emerald-800/40">
              <Layers className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-mono uppercase text-slate-500 dark:text-slate-400">Structure</p>
              <p className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                {categories.length} Core Domains
              </p>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/90 dark:border-emerald-900/40 shadow-xl shadow-slate-900/5 flex items-center gap-3.5 hover:border-emerald-500/40 transition-colors">
            <div className="w-11 h-11 rounded-xl bg-teal-50 dark:bg-teal-950/50 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0 border border-teal-200/50 dark:border-teal-800/40">
              <Bot className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-mono uppercase text-slate-500 dark:text-slate-400">AI Assistant</p>
              <p className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                Instant Search
              </p>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/90 dark:border-emerald-900/40 shadow-xl shadow-slate-900/5 flex items-center gap-3.5 hover:border-emerald-500/40 transition-colors">
            <div className="w-11 h-11 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-200/50 dark:border-emerald-800/40">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-mono uppercase text-slate-500 dark:text-slate-400">Governance</p>
              <p className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                100% Audited
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 02: How It Works & Architecture ───────────────────────────── */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-20 sm:py-24 border-b border-slate-200/80 dark:border-slate-800">
        {/* Section Header */}
        <div className="flex items-center gap-3 mb-4">
          <span className="font-mono text-xs font-semibold text-emerald-600 dark:text-emerald-400 tracking-wider">
            02 —— HOW IT WORKS
          </span>
          <div className="h-px bg-slate-200 dark:bg-slate-800 flex-1" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start mt-8">
          {/* Left Column: Headline & Interactive Lifecycle Card */}
          <div className="lg:col-span-6 space-y-6">
            <div>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.15]">
                From knowledge indexing to audited compliance
              </h2>
              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 mt-4 leading-relaxed">
                The unified operational portal for policies, task reports, meeting records, and AI assistance across all Ahununu Express branches.
              </p>
            </div>

            {/* REQUEST LIFECYCLE CARD (Mirroring reference style) */}
            <div className="rounded-2xl border border-slate-200/90 dark:border-emerald-900/50 bg-white dark:bg-slate-900 p-6 shadow-xl shadow-slate-950/5 relative overflow-hidden bg-blueprint-pattern">
              <div className="flex items-center justify-between mb-5">
                <span className="font-mono text-[11px] uppercase tracking-widest text-slate-500 dark:text-slate-400 font-bold">
                  REQUEST & ACCESS LIFECYCLE
                </span>
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-mono text-[10px] font-semibold border border-emerald-200/60 dark:border-emerald-800/40">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  SCOPED & ENFORCED
                </span>
              </div>

              {/* Lifecycle Flow Boxes */}
              <div className="flex flex-wrap items-center gap-2 mb-6">
                {[
                  { label: "user query", code: "req" },
                  { label: "branch scope", code: "tenant" },
                  { label: "role access", code: "auth" },
                  { label: "policy check", code: "policy" },
                  { label: "scoped documents", code: "scope" },
                  { label: "audit log", code: "audit" },
                ].map((step, idx, arr) => (
                  <div key={step.code} className="flex items-center gap-2">
                    <span
                      onClick={() => setSimulatedStep(idx)}
                      className={`px-3 py-1.5 rounded-lg font-mono text-xs font-medium cursor-pointer transition-all border ${
                        simulatedStep === idx
                          ? "bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-600/20 scale-105"
                          : "bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-emerald-400"
                      }`}
                    >
                      {step.label}
                    </span>
                    {idx < arr.length - 1 && (
                      <span className="text-slate-400 font-mono text-xs font-bold">→</span>
                    )}
                  </div>
                ))}
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60">
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  A request that cannot verify its role permissions and active branch scope never reaches restricted documentation. Every view, policy acknowledgment, and report submission is permanently logged.
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: Step-by-Step Vertical Pipeline */}
          <div className="lg:col-span-6 relative pl-6 border-l-2 border-slate-200 dark:border-slate-800 space-y-10 ml-2">
            {/* Step 01 */}
            <div className="relative group">
              <div className="absolute -left-[31px] top-1 w-4 h-4 rounded-full bg-white dark:bg-slate-900 border-2 border-emerald-500 ring-4 ring-emerald-500/20 flex items-center justify-center" />
              <div className="flex items-center gap-2.5 mb-1.5">
                <span className="font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                  STEP 01
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                  Structured Index
                </span>
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                Centralize Operational Knowledge
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                Publish and organize standard operating procedures, transport guidelines, branch directories, and logistics manuals into structured categories and sections.
              </p>
            </div>

            {/* Step 02 */}
            <div className="relative group">
              <div className="absolute -left-[31px] top-1 w-4 h-4 rounded-full bg-emerald-500 ring-4 ring-emerald-500/20" />
              <div className="flex items-center gap-2.5 mb-1.5">
                <span className="font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                  STEP 02
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/40">
                  Role Governance
                </span>
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                Define Roles & Permission Boundaries
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                Configure department and employee access levels. Ensure sensitive executive minutes, compliance policies, and operational reports are only accessible to authorized roles.
              </p>
            </div>

            {/* Step 03 */}
            <div className="relative group">
              <div className="absolute -left-[31px] top-1 w-4 h-4 rounded-full bg-emerald-500 ring-4 ring-emerald-500/20" />
              <div className="flex items-center gap-2.5 mb-1.5">
                <span className="font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                  STEP 03
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200/60 dark:border-teal-800/40">
                  Continuous AI & Search
                </span>
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                Access Knowledge & File Reports
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                Team members quickly find operational guidelines using instant search or Ask AI, submit regular task reports, and review recent meeting decisions in real time.
              </p>
            </div>

            {/* Step 04 */}
            <div className="relative group">
              <div className="absolute -left-[31px] top-1 w-4 h-4 rounded-full bg-emerald-500 ring-4 ring-emerald-500/20" />
              <div className="flex items-center gap-2.5 mb-1.5">
                <span className="font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                  STEP 04
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                  Audit Retained
                </span>
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                Enforce Policy Compliance & Audits
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                Track employee policy acknowledgments with digital sign-offs, maintain version histories of all documents, and keep immutable audit logs for enterprise governance.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 03: Core Platform Bento Grid ─────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-16 border-b border-slate-200/80 dark:border-slate-800">
        <div className="flex items-center gap-3 mb-6">
          <span className="font-mono text-xs font-semibold text-emerald-600 dark:text-emerald-400 tracking-wider">
            03 —— CORE PLATFORM MODULES
          </span>
          <div className="h-px bg-slate-200 dark:bg-slate-800 flex-1" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Ask AI */}
          <Link
            href="/ask-ai"
            className="group relative bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/90 dark:border-emerald-950/60 shadow-md hover:shadow-xl hover:border-emerald-500/40 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4 border border-emerald-200/60 dark:border-emerald-800/40 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                <Bot className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1.5 group-hover:text-emerald-600 transition-colors">
                Ask Ahununu AI
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Query all company manuals, transport rules, and SOPs with semantic search.
              </p>
            </div>
            <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-medium text-emerald-600 dark:text-emerald-400">
              <span>Launch Assistant</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* Operational Reports */}
          <Link
            href="/reports"
            className="group relative bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/90 dark:border-emerald-950/60 shadow-md hover:shadow-xl hover:border-emerald-500/40 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4 border border-emerald-200/60 dark:border-emerald-800/40 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                <FileText className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1.5 group-hover:text-emerald-600 transition-colors">
                Operational Reports
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Submit and review daily cargo handling, fleet safety, and department summaries.
              </p>
            </div>
            <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-medium text-emerald-600 dark:text-emerald-400">
              <span>View Reports</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* Meeting Minutes */}
          <Link
            href="/minutes"
            className="group relative bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/90 dark:border-emerald-950/60 shadow-md hover:shadow-xl hover:border-emerald-500/40 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4 border border-emerald-200/60 dark:border-emerald-800/40 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                <CalendarCheck className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1.5 group-hover:text-emerald-600 transition-colors">
                Meeting Records
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Executive and team deliberations, action items, assigned owners, and dates.
              </p>
            </div>
            <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-medium text-emerald-600 dark:text-emerald-400">
              <span>Browse Minutes</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* Policy Acceptance */}
          <Link
            href="/policy-acceptance"
            className="group relative bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/90 dark:border-emerald-950/60 shadow-md hover:shadow-xl hover:border-emerald-500/40 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4 border border-emerald-200/60 dark:border-emerald-800/40 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1.5 group-hover:text-emerald-600 transition-colors">
                Policy Compliance
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Verify and acknowledge vital enterprise security, driver, and safety policies.
              </p>
            </div>
            <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-medium text-emerald-600 dark:text-emerald-400">
              <span>Check Compliance</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
        </div>
      </section>

      {/* ─── 04: Browse Knowledge Domains ─────────────────────────────────── */}
      <section id="knowledge-domains" className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-20">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="font-mono text-xs font-semibold text-emerald-600 dark:text-emerald-400 tracking-wider">
                04 —— KNOWLEDGE DOMAINS
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Explore All Categories & Documents
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Browse structured logistics standard operating procedures and documentation
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveCategoryFilter("all")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeCategoryFilter === "all"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50"
              }`}
            >
              All Categories ({categories.length})
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategoryFilter(cat.slug)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  activeCategoryFilter === cat.slug
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50"
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {filteredCategories.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 p-16 text-center bg-white dark:bg-slate-900">
            <BookOpen className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">No content available in this category.</p>
            <button
              type="button"
              onClick={() => setActiveCategoryFilter("all")}
              className="mt-3 text-xs text-emerald-600 dark:text-emerald-400 font-semibold hover:underline"
            >
              View all categories
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCategories.map((cat) => (
              <SectionCard key={cat.id} category={cat} />
            ))}
          </div>
        )}
      </section>

      {/* ─── 05: Frequently Asked Questions ───────────────────────────────── */}
      {faqs.length > 0 && (
        <section className="border-t border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/60 py-20">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            {/* Header */}
            <div className="text-center max-w-xl mx-auto mb-10">
              <span className="font-mono text-xs font-semibold text-emerald-600 dark:text-emerald-400 tracking-wider">
                05 —— FREQUENTLY ASKED QUESTIONS
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-2">
                Quick Answers & Operational Clarifications
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-2">
                Frequently referenced guidelines regarding freight booking, parcel handling, and system permissions.
              </p>

              {/* FAQ Search */}
              <div className="mt-5 relative max-w-md mx-auto">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search questions or keywords…"
                  value={faqSearchQuery}
                  onChange={(e) => setFaqSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Accordion List */}
            {filteredFaqs.length === 0 ? (
              <p className="text-center text-xs text-slate-400 py-8">No matching questions found.</p>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800 rounded-2xl border border-slate-200/90 dark:border-slate-800 overflow-hidden shadow-sm bg-white dark:bg-slate-900">
                {filteredFaqs.map((faq) => (
                  <details key={faq._id} className="group">
                    <summary className="flex items-center justify-between gap-4 px-6 py-4.5 cursor-pointer select-none list-none hover:bg-emerald-50/40 dark:hover:bg-emerald-950/20 transition-colors">
                      <span className="text-sm font-semibold text-slate-900 dark:text-white">
                        {faq.question}
                      </span>
                      <ChevronDown className="w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 group-open:rotate-180 group-open:text-emerald-600" />
                    </summary>
                    <div className="px-6 pb-5 pt-1 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-100/70 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/40">
                      {faq.answer}
                    </div>
                  </details>
                ))}
              </div>
            )}

            {/* Need More Assistance Support Card */}
            <div className="mt-12 p-6 rounded-2xl border border-emerald-200/70 dark:border-emerald-900/50 bg-emerald-50/60 dark:bg-emerald-950/30 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h4 className="text-sm font-bold text-emerald-950 dark:text-emerald-200">
                  Still have questions regarding transport or cargo?
                </h4>
                <p className="text-xs text-emerald-800/80 dark:text-emerald-400 mt-0.5">
                  Reach out to the central dispatch team or use the internal AI assistant.
                </p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <Link
                  href="/ask-ai"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition-colors"
                >
                  Ask AI Now
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
