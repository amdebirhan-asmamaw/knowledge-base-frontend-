"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { appConfig } from "@/config/app.config";
import { openAiAssistant } from "@/components/FloatingAiAssistant";
import { Button } from "@/components/ui/button";
import {
  Sparkles,
  FileSpreadsheet,
  ShieldCheck,
  ClipboardList,
  CalendarCheck,
  ArrowRight,
  ShieldAlert,
  FileText,
  Building2,
  CheckCircle2,
} from "lucide-react";

export default function AskAiPage() {
  // Automatically trigger the floating modal on page entry
  useEffect(() => {
    const timer = setTimeout(() => {
      openAiAssistant();
    }, 200);
    return () => clearTimeout(timer);
  }, []);

  const capabilities = [
    {
      icon: FileSpreadsheet,
      title: "Report Attachments Content",
      desc: "Deep text parsing across PDF, DOCX, and CSV attachments linked to department and task reports.",
      prompt: "Summarize key updates from recent department reports and their attached files.",
    },
    {
      icon: ShieldCheck,
      title: "Active Company Policies",
      desc: "Instant compliance answers based strictly on current published policies and standard operating procedures.",
      prompt: "Which company policies are currently active and require employee review?",
    },
    {
      icon: ClipboardList,
      title: "Survey & Polling Trends",
      desc: "Aggregated participant metrics, question breakdowns, average ratings, and public vs internal response trends.",
      prompt: "What surveys are currently active, and what are the participant ratings and feedback trends?",
    },
    {
      icon: CalendarCheck,
      title: "Meeting Minutes & Notes",
      desc: "Visibility-scoped meeting records, decisions, action points, and logistical coordination history.",
      prompt: "What were the primary decisions and action items from recent meetings?",
    },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 sm:py-12">
      {/* Hero Section */}
      <div className="text-center max-w-2xl mx-auto mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-xs font-semibold mb-4">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Gemini 3.8 Flash • Scoped Organization Assistant</span>
        </div>
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-foreground tracking-tight">
          {appConfig.ai.assistantName}
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground mt-3 leading-relaxed">
          The AI assistant is available everywhere as a floating modal. It analyzes
          live database records and parses file attachments with strict zero data leakage.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
          <Button
            size="lg"
            onClick={() => openAiAssistant()}
            className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-900/15"
          >
            <Sparkles className="w-4 h-4" />
            <span>Launch Assistant</span>
            <kbd className="text-[10px] bg-black/20 text-white/90 px-1.5 py-0.5 rounded font-mono font-medium ml-1">
              Ctrl+J
            </kbd>
          </Button>

          <Button asChild variant="outline" size="lg">
            <Link href="/reports">
              <span>View Reports</span>
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </Link>
          </Button>
        </div>
      </div>

      {/* Capabilities & Quick Triggers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {capabilities.map((cap, i) => {
          const Icon = cap.icon;
          return (
            <div
              key={i}
              className="p-5 rounded-2xl border border-border/80 bg-card hover:border-emerald-500/40 hover:shadow-sm transition-all flex flex-col justify-between"
            >
              <div>
                <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-3">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-foreground">
                  {cap.title}
                </h3>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  {cap.desc}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-border/40">
                <button
                  onClick={() => openAiAssistant(cap.prompt)}
                  className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 flex items-center gap-1.5 group"
                >
                  <span>Ask this prompt</span>
                  <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Security & Scoping Badge */}
      <div className="mt-10 p-4 rounded-xl border border-border/60 bg-secondary/30 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-2.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
          <span>
            Every query is strictly bounded by your verified user role. Confidential
            notes, unreleased drafts, and cross-department data are never leaked.
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0 font-medium text-foreground">
          <span>Global Shortcut:</span>
          <kbd className="px-2 py-0.5 rounded border border-border bg-background font-mono text-[11px]">
            Ctrl + J
          </kbd>
        </div>
      </div>
    </div>
  );
}
