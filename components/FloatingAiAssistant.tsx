"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useAiChat } from "@/hooks/queries";
import type { ChatMessage, Source } from "@/lib/api/ai.api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Sparkles,
  Send,
  Square,
  RotateCcw,
  FileText,
  FileSpreadsheet,
  ShieldCheck,
  ClipboardList,
  CalendarCheck,
  Building2,
  Copy,
  Check,
  Bot,
  User,
  ExternalLink,
  AlertCircle,
  Paperclip,
  CheckCircle2,
} from "lucide-react";
import { appConfig } from "@/config/app.config";

// ─── Custom Global Event Helper ───────────────────────────────────────────────

/**
 * Dispatch event to open the AI Assistant from anywhere in the app
 * (e.g. Navigation bar, quick links, error screens).
 */
export function openAiAssistant(initialPrompt?: string) {
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("open-ai-assistant", {
        detail: { prompt: initialPrompt },
      })
    );
  }
}

// ─── Markdown Renderer ────────────────────────────────────────────────────────

function renderMarkdown(text: string): string {
  if (!text) return "";
  const codeBlocks: string[] = [];

  // 1. Isolate fenced code blocks
  let processed = text.replace(/```([\s\S]*?)```/g, (_, code) => {
    const id = `___CODE_BLOCK_${codeBlocks.length}___`;
    const cleanCode = code
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
    codeBlocks.push(
      `<pre class="my-2.5 p-3 rounded-xl bg-zinc-900 text-zinc-100 font-mono text-[12px] leading-relaxed overflow-x-auto shadow-inner border border-zinc-800"><code>${cleanCode}</code></pre>`
    );
    return id;
  });

  // 2. Escape HTML on text outside code blocks
  processed = processed
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // 3. Inline formatting
  processed = processed
    .replace(
      /`([^`]+)`/g,
      '<code class="bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-mono text-[12px] px-1.5 py-0.5 rounded-md border border-emerald-200/80 dark:border-emerald-800/80">$1</code>'
    )
    .replace(
      /\*\*(.+?)\*\*/g,
      '<strong class="font-semibold text-foreground">$1</strong>'
    )
    .replace(/\*(.+?)\*/g, '<em class="italic">$1</em>')
    .replace(
      /^### (.*$)/gim,
      '<h4 class="font-semibold text-foreground text-sm mt-3.5 mb-1.5">$1</h4>'
    )
    .replace(
      /^## (.*$)/gim,
      '<h3 class="font-bold text-foreground text-base mt-4 mb-2 pb-1 border-b border-border/40">$1</h3>'
    )
    .replace(
      /^# (.*$)/gim,
      '<h2 class="font-bold text-foreground text-lg mt-4 mb-2.5">$1</h2>'
    )
    .replace(
      /^[-*•]\s+(.*)$/gim,
      '<li class="ml-4 list-disc text-[13px] leading-relaxed py-0.5">$1</li>'
    )
    .replace(
      /^\d+\.\s+(.*)$/gim,
      '<li class="ml-4 list-decimal text-[13px] leading-relaxed py-0.5">$1</li>'
    )
    .replace(/\n/g, "<br/>");

  // 4. Restore code blocks
  codeBlocks.forEach((block, i) => {
    processed = processed.replace(`___CODE_BLOCK_${i}___`, block);
  });

  return processed;
}

// ─── Source Pill Helper ───────────────────────────────────────────────────────

function resolveSourceUrl(slug: string): string {
  if (!slug) return "#";
  if (
    slug.startsWith("http://") ||
    slug.startsWith("https://") ||
    slug.startsWith("/")
  ) {
    return slug;
  }
  if (
    slug.startsWith("admin/") ||
    slug.startsWith("policies/") ||
    slug.startsWith("surveys") ||
    slug.startsWith("survey/") ||
    slug.startsWith("minutes") ||
    slug.startsWith("reports")
  ) {
    return `/${slug}`;
  }
  return `/documents/${slug}`;
}

function getSourceMeta(src: Source) {
  const s = (src.slug || "").toLowerCase();
  const t = (src.title || "").toLowerCase();

  if (s.includes("report") || t.startsWith("report:")) {
    return {
      icon: FileSpreadsheet,
      label: "Report",
      color:
        "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800",
    };
  }
  if (s.includes("polic") || t.startsWith("policy:")) {
    return {
      icon: ShieldCheck,
      label: "Policy",
      color:
        "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800",
    };
  }
  if (s.includes("survey") || t.startsWith("survey:")) {
    return {
      icon: ClipboardList,
      label: "Survey",
      color:
        "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800",
    };
  }
  if (s.includes("meeting") || t.startsWith("meeting:")) {
    return {
      icon: CalendarCheck,
      label: "Minutes",
      color:
        "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800",
    };
  }
  if (s.includes("client") || t.startsWith("client:")) {
    return {
      icon: Building2,
      label: "Client",
      color:
        "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800",
    };
  }
  return {
    icon: FileText,
    label: "Knowledge",
    color:
      "bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-900/40 dark:text-slate-300 dark:border-slate-800",
  };
}

function SourcePills({ sources }: { sources: Source[] }) {
  if (!sources || sources.length === 0) return null;

  return (
    <div className="mt-3 pt-2.5 border-t border-border/40">
      <div className="text-[11px] font-medium text-muted-foreground mb-1.5 flex items-center gap-1.5">
        <Paperclip className="w-3 h-3 text-emerald-500" />
        <span>Verified Citations & Context:</span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {sources.map((src, i) => {
          const meta = getSourceMeta(src);
          const Icon = meta.icon;
          const url = resolveSourceUrl(src.slug);

          return (
            <Link
              key={i}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className={`inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-lg border shadow-xs transition-all hover:scale-[1.02] hover:shadow-sm ${meta.color}`}
              title={src.title}
            >
              <Icon className="w-3 h-3 shrink-0" />
              <span className="max-w-[170px] truncate">{src.title}</span>
              <ExternalLink className="w-2.5 h-2.5 opacity-60 ml-0.5 shrink-0" />
            </Link>
          );
        })}
      </div>
    </div>
  );
}

// ─── Copy Button ──────────────────────────────────────────────────────────────

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={copy}
      className="p-1 rounded-md text-muted-foreground/60 hover:text-foreground hover:bg-muted/80 transition-colors"
      title="Copy response"
      aria-label="Copy response"
    >
      {copied ? (
        <Check className="w-3.5 h-3.5 text-emerald-500" />
      ) : (
        <Copy className="w-3.5 h-3.5" />
      )}
    </button>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function FloatingAiAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const { data: session } = useSession();

  const {
    messages,
    sourcesMap,
    isStreaming,
    error,
    send,
    cancel,
    reset,
  } = useAiChat();

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll on new messages or streaming chunks
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isStreaming, isOpen]);

  // Global Keyboard Shortcut: Ctrl+J / Cmd+J toggles modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "j") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Listen for open-ai-assistant custom event
  useEffect(() => {
    const handleOpenEvent = (e: Event) => {
      const customEvent = e as CustomEvent<{ prompt?: string }>;
      setIsOpen(true);
      if (customEvent.detail?.prompt) {
        setInput(customEvent.detail.prompt);
        setTimeout(() => {
          if (textareaRef.current) {
            textareaRef.current.focus();
          }
        }, 100);
      }
    };
    window.addEventListener("open-ai-assistant", handleOpenEvent);
    return () => window.removeEventListener("open-ai-assistant", handleOpenEvent);
  }, []);

  // Focus textarea when modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 150);
    }
  }, [isOpen]);

  const handleSend = useCallback(
    (textToSend?: string) => {
      const text = (textToSend ?? input).trim();
      if (!text || isStreaming) return;
      setInput("");
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
      void send(text);
    },
    [input, isStreaming, send]
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = `${Math.min(e.target.scrollHeight, 140)}px`;
  };

  const handleReset = () => {
    reset();
    setInput("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.focus();
    }
  };

  const userRole = session?.user?.role?.name || "Staff";
  const userInitial = session?.user?.name?.[0]?.toUpperCase() || "U";

  // Preset starter suggestions
  const starters = [
    {
      title: "Latest Reports & Files",
      prompt: "Summarize the key updates in recent reports, including any findings in the attached files.",
      icon: FileSpreadsheet,
    },
    {
      title: "Active Company Policies",
      prompt: "What policies are currently active and require employee review or compliance?",
      icon: ShieldCheck,
    },
    {
      title: "Survey Feedback & Ratings",
      prompt: "What surveys are currently open, and what are the average ratings and feedback trends?",
      icon: ClipboardList,
    },
    {
      title: "Meetings & Action Items",
      prompt: "Summarize the major decisions and next action items from recent meeting minutes.",
      icon: CalendarCheck,
    },
  ];

  return (
    <>
      {/* ─── Floating Trigger Button (Bottom-Right) ───────────────────── */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          aria-label="Open AI Assistant (Ctrl+J)"
          title="Open AI Assistant (Ctrl+J)"
          className="fixed bottom-6 right-6 z-40 group flex items-center gap-2.5 px-4 py-3 rounded-full shadow-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-950/20 hover:shadow-emerald-950/30 hover:scale-[1.03] active:scale-[0.98] transition-all duration-200 border border-emerald-400/30"
        >
          <div className="relative">
            <Sparkles className="w-5 h-5 transition-transform duration-200 group-hover:rotate-12" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-300 rounded-full border-2 border-emerald-800 animate-pulse" />
          </div>
          <span className="text-sm font-semibold tracking-wide">Ask AI</span>
          <kbd className="hidden sm:inline-flex items-center text-[10px] bg-black/20 text-white/90 px-1.5 py-0.5 rounded font-mono font-medium">
            Ctrl+J
          </kbd>
        </button>
      )}

      {/* ─── Modal Dialog (Explicitly Dialog, Not Drawer/Sheet) ────────── */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent
          showCloseButton={true}
          className="sm:max-w-3xl md:max-w-4xl w-[96vw] h-[680px] max-h-[88vh] p-0 flex flex-col gap-0 rounded-2xl overflow-hidden border border-border/80 shadow-2xl bg-background"
        >
          {/* ─── Header ────────────────────────────────────────────── */}
          <DialogHeader className="px-5 py-3.5 border-b border-border/70 bg-secondary/30 shrink-0 flex flex-row items-center justify-between text-left">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white shadow-md shadow-emerald-900/20">
                <Sparkles className="w-4.5 h-4.5" />
              </div>
              <div>
                <DialogTitle className="text-sm sm:text-base font-bold flex items-center gap-2 text-foreground">
                  <span>{appConfig.ai.assistantName}</span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-mono font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    gemini-3.8-flash
                  </span>
                </DialogTitle>
                <DialogDescription className="text-[11px] text-muted-foreground mt-0.5">
                  Scoped intelligence • Role:{" "}
                  <strong className="text-foreground capitalize">{userRole}</strong> •
                  Includes file attachments, policies & surveys
                </DialogDescription>
              </div>
            </div>

            <div className="flex items-center gap-1.5 pr-8">
              {messages.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleReset}
                  className="h-8 px-2.5 text-xs text-muted-foreground hover:text-foreground hover:bg-secondary gap-1.5"
                  title="Start a new conversation"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">New Chat</span>
                </Button>
              )}
            </div>
          </DialogHeader>

          {/* ─── Scrollable Message Area ───────────────────────────── */}
          <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-5 space-y-5 bg-background/50">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col justify-center items-center text-center max-w-xl mx-auto py-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500/15 to-teal-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 mb-4 shadow-inner">
                  <Sparkles className="w-7 h-7" />
                </div>
                <h3 className="text-base sm:text-lg font-bold text-foreground">
                  How can I assist your work today?
                </h3>
                <p className="text-xs text-muted-foreground mt-1.5 mb-6 max-w-md leading-relaxed">
                  I analyze live database records, parse full text within report
                  attachments (PDF, DOCX, CSV), check active policies, and summarize
                  survey results according to your verified permissions.
                </p>

                {/* Capability starter chips */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full text-left">
                  {starters.map((st, i) => {
                    const Icon = st.icon;
                    return (
                      <button
                        key={i}
                        onClick={() => handleSend(st.prompt)}
                        className="group flex flex-col p-3 rounded-xl border border-border/70 bg-card hover:bg-secondary/50 hover:border-emerald-500/40 transition-all text-left shadow-xs hover:shadow-sm"
                      >
                        <div className="flex items-center gap-2 text-xs font-semibold text-foreground group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
                          <Icon className="w-3.5 h-3.5 text-emerald-500" />
                          <span>{st.title}</span>
                        </div>
                        <p className="text-[11px] text-muted-foreground line-clamp-2 mt-1 leading-snug">
                          {st.prompt}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              messages.map((msg: ChatMessage, idx: number) => {
                const isUser = msg.role === "user";
                const isAssistant = msg.role === "assistant";
                const sources = isAssistant ? sourcesMap[idx] : undefined;
                const isLatestStreaming =
                  isStreaming &&
                  isAssistant &&
                  idx === messages.length - 1;

                if (isAssistant && !msg.content && !isLatestStreaming) {
                  return null;
                }

                return (
                  <div
                    key={idx}
                    className={`flex items-start gap-3 ${
                      isUser ? "flex-row-reverse" : "flex-row"
                    }`}
                  >
                    {/* Avatar */}
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold ${
                        isUser
                          ? "bg-primary text-primary-foreground shadow-xs"
                          : "bg-emerald-600 text-white shadow-xs"
                      }`}
                    >
                      {isUser ? userInitial : <Bot className="w-4 h-4" />}
                    </div>

                    {/* Bubble */}
                    <div
                      className={`max-w-[85%] sm:max-w-[80%] flex flex-col ${
                        isUser ? "items-end" : "items-start"
                      }`}
                    >
                      <div
                        className={`rounded-2xl px-4 py-3 text-[13px] leading-relaxed shadow-xs relative group ${
                          isUser
                            ? "bg-primary text-primary-foreground rounded-tr-xs"
                            : "bg-card border border-border/70 text-card-foreground rounded-tl-xs"
                        }`}
                      >
                        {isUser ? (
                          <div className="whitespace-pre-wrap">{msg.content}</div>
                        ) : (
                          <>
                            <div
                              className="prose-chat [&_li]:py-0.5 [&_strong]:text-foreground [&_br+br]:hidden"
                              dangerouslySetInnerHTML={{
                                __html: renderMarkdown(msg.content),
                              }}
                            />
                            {/* Blinking cursor while streaming token */}
                            {isLatestStreaming && (
                              <span className="inline-block w-1.5 h-3.5 ml-1 bg-emerald-500 animate-pulse align-middle" />
                            )}
                            {/* Action row */}
                            {msg.content && !isStreaming && (
                              <div className="flex justify-end mt-1.5 -mb-1 -mr-1">
                                <CopyButton text={msg.content} />
                              </div>
                            )}
                          </>
                        )}
                      </div>

                      {/* Source Citations */}
                      {isAssistant && sources && sources.length > 0 && (
                        <SourcePills sources={sources} />
                      )}
                    </div>
                  </div>
                );
              })
            )}

            {/* Awaiting initial stream token */}
            {isStreaming &&
              messages.length > 0 &&
              messages[messages.length - 1].role === "user" && (
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div className="bg-card border border-border/70 rounded-2xl rounded-tl-xs px-4 py-3 shadow-xs">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="inline-flex gap-1">
                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce" />
                      </span>
                      <span>Retrieving scoped context & parsing files…</span>
                    </div>
                  </div>
                </div>
              )}

            {/* Error display */}
            {error && (
              <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold">Unable to process request</p>
                  <p className="mt-0.5 text-muted-foreground">{error}</p>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* ─── Footer / Input Bar ─────────────────────────────────── */}
          <div className="p-3 sm:p-4 border-t border-border/70 bg-secondary/20 shrink-0">
            <div className="flex gap-2 items-end bg-background rounded-xl border border-border/80 shadow-xs px-3 py-2 focus-within:border-emerald-500/50 focus-within:ring-2 focus-within:ring-emerald-500/10 transition-all">
              <textarea
                ref={textareaRef}
                rows={1}
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder={appConfig.ai.placeholder}
                disabled={isStreaming}
                className="flex-1 bg-transparent text-sm resize-none outline-none text-foreground placeholder:text-muted-foreground/60 disabled:opacity-50 min-h-[26px] max-h-[140px] py-1 leading-relaxed"
              />

              {isStreaming ? (
                <Button
                  size="icon"
                  variant="destructive"
                  onClick={cancel}
                  className="w-8 h-8 shrink-0 rounded-lg shadow-xs"
                  title="Stop generating"
                >
                  <Square className="w-3.5 h-3.5" />
                </Button>
              ) : (
                <Button
                  size="icon"
                  disabled={!input.trim()}
                  onClick={() => handleSend()}
                  className="w-8 h-8 shrink-0 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs disabled:opacity-40 transition-all"
                  title="Send message (Enter)"
                >
                  <Send className="w-3.5 h-3.5" />
                </Button>
              )}
            </div>

            <div className="flex items-center justify-between mt-2 px-1 text-[10px] text-muted-foreground/70">
              <span className="hidden sm:inline">
                Press <kbd className="font-mono">Enter</kbd> to send,{" "}
                <kbd className="font-mono">Shift+Enter</kbd> for line break
              </span>
              <span className="ml-auto inline-flex items-center gap-1 text-emerald-600/90 dark:text-emerald-400">
                <CheckCircle2 className="w-3 h-3" />
                Zero data leakage • Strictly scoped by user role
              </span>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
