"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import type { ChatMessage, Source } from "@/lib/api/ai.api";
import { getFullTreeClient, type CategoryNode } from "@/lib/api/documents.api";
import { useAiChat } from "@/hooks/queries";
import { Button } from "@/components/ui/button";
import {
  Sparkles,
  Send,
  FileText,
  AlertCircle,
  RotateCcw,
  User,
  Bot,
  Copy,
  Check,
  BookOpen,
  Search,
  HelpCircle,
  MessageSquare,
} from "lucide-react";
import { appConfig } from "@/config/app.config";

// ─── Markdown-lite renderer ───────────────────────────────────────────────────

function renderMarkdown(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(
      /`([^`]+)`/g,
      '<code class="bg-primary/8 text-primary px-1 py-0.5 rounded text-[12px] font-mono">$1</code>'
    )
    .replace(
      /^[-•]\s+(.+)$/gm,
      '<li class="ml-4 list-disc text-[13px] leading-relaxed py-0.5">$1</li>'
    )
    .replace(
      /^\d+\.\s+(.+)$/gm,
      '<li class="ml-4 list-decimal text-[13px] leading-relaxed py-0.5">$1</li>'
    )
    .replace(
      /^#{1,3}\s+(.+)$/gm,
      '<p class="font-semibold text-foreground mt-3 mb-1 text-[13px]">$1</p>'
    )
    .replace(/\n/g, "<br/>");
}

// ─── Copy button ──────────────────────────────────────────────────────────────

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
      className="opacity-0 group-hover/msg:opacity-100 transition-all duration-200 p-1 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground"
      title="Copy message"
    >
      {copied ? (
        <Check className="w-3 h-3 text-emerald-500" />
      ) : (
        <Copy className="w-3 h-3" />
      )}
    </button>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function TypingIndicator() {
  return (
    <div className="flex items-start gap-2.5">
      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary/15 to-primary/5 flex items-center justify-center shrink-0 ring-1 ring-primary/10">
        <Bot className="w-3.5 h-3.5 text-primary" />
      </div>
      <div className="bg-white border border-border/50 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
        <div className="flex gap-1.5 items-center h-4">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="w-1.5 h-1.5 bg-primary/35 rounded-full animate-bounce"
              style={{
                animationDelay: `${i * 150}ms`,
                animationDuration: "0.8s",
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function SourceCards({
  sources,
  onAsk,
}: {
  sources: Source[];
  onAsk: (text: string) => void;
}) {
  if (!sources.length) return null;
  return (
    <div className="mt-2 flex flex-wrap gap-1.5">
      {sources.map((src) => (
        <button
          key={src.slug}
          onClick={() => onAsk(`Summarize the document "${src.title}"`)}
          className="inline-flex items-center gap-1.5 text-[11px] bg-white border border-border/60 rounded-lg px-2 py-1 text-muted-foreground hover:text-primary hover:border-primary/25 transition-all cursor-pointer"
          title={`Summarize "${src.title}"`}
        >
          <FileText className="w-2.5 h-2.5 text-primary/50" />
          <span className="max-w-[160px] truncate">{src.title}</span>
        </button>
      ))}
    </div>
  );
}

function MessageBubble({
  msg,
  sources,
  onAsk,
}: {
  msg: ChatMessage;
  sources?: Source[];
  onAsk: (text: string) => void;
}) {
  const isUser = msg.role === "user";
  return (
    <div
      className={`group/msg flex items-start gap-2.5 ${isUser ? "flex-row-reverse" : ""}`}
    >
      {/* Avatar */}
      <div
        className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
          isUser
            ? "bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-sm shadow-primary/15"
            : "bg-gradient-to-br from-primary/15 to-primary/5 ring-1 ring-primary/10"
        }`}
      >
        {isUser ? (
          <User className="w-3.5 h-3.5" />
        ) : (
          <Bot className="w-3.5 h-3.5 text-primary" />
        )}
      </div>

      {/* Bubble */}
      <div
        className={`max-w-[80%] ${isUser ? "items-end" : "items-start"} flex flex-col`}
      >
        <div
          className={`px-4 py-2.5 text-[13px] leading-relaxed ${
            isUser
              ? "bg-gradient-to-br from-primary to-primary/90 text-primary-foreground rounded-2xl rounded-tr-sm shadow-sm"
              : "bg-white border border-border/50 text-foreground rounded-2xl rounded-tl-sm shadow-sm"
          }`}
        >
          {isUser ? (
            <span className="whitespace-pre-wrap">{msg.content}</span>
          ) : (
            <>
              <div
                className="prose-chat [&_li]:py-0.5 [&_strong]:text-foreground [&_br+br]:hidden"
                dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }}
              />
              <div className="flex justify-end mt-1 -mb-1 -mr-1">
                <CopyButton text={msg.content} />
              </div>
            </>
          )}
        </div>
        {!isUser && sources && <SourceCards sources={sources} onAsk={onAsk} />}
      </div>
    </div>
  );
}

// ─── Dynamic suggestions from real content ────────────────────────────────────

const ICON_PALETTE = [
  { icon: BookOpen, color: "text-blue-500 bg-blue-50" },
  { icon: FileText, color: "text-violet-500 bg-violet-50" },
  { icon: Search, color: "text-emerald-500 bg-emerald-50" },
  { icon: HelpCircle, color: "text-amber-500 bg-amber-50" },
];

function EmptyState({
  onSuggestion,
}: {
  onSuggestion: (text: string) => void;
}) {
  const { data: tree, isLoading } = useQuery<CategoryNode[]>({
    queryKey: ["docs", "public-tree"],
    queryFn: () => getFullTreeClient(),
    staleTime: 5 * 60 * 1000,
  });

  const suggestions = useMemo(() => {
    if (!tree || tree.length === 0) return [];
    const items: string[] = [];
    const activeCategories = tree.filter((c) => c.sections?.length > 0);
    for (const cat of activeCategories.slice(0, 2)) {
      items.push(`What documents are available under "${cat.name}"?`);
    }
    const allDocs = tree.flatMap((c) =>
      c.sections.flatMap((s) => s.documents.map((d) => d.title))
    );
    const shuffled = allDocs.sort(() => 0.5 - Math.random());
    for (const title of shuffled.slice(0, Math.max(0, 4 - items.length))) {
      items.push(`Summarize "${title}"`);
    }
    return items.slice(0, 4);
  }, [tree]);

  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-4 pb-8">
      {/* Icon */}
      <div className="relative mb-5">
        <div className="absolute inset-0 w-14 h-14 rounded-2xl bg-primary/10 blur-xl animate-pulse" />
        <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/12 to-primary/4 border border-primary/10 flex items-center justify-center">
          <Sparkles className="w-7 h-7 text-primary" />
        </div>
      </div>

      <h2 className="text-lg font-bold text-foreground mb-1 tracking-tight">
        Ask anything
      </h2>
      <p className="text-xs text-muted-foreground mb-6 max-w-[280px] leading-relaxed">
        Get answers from your knowledge base — documents, policies, and
        procedures.
      </p>

      {/* Suggestions */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-md">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-14 rounded-xl border border-border/50 bg-secondary/20 animate-pulse"
            />
          ))}
        </div>
      ) : suggestions.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-md">
          {suggestions.map((text, i) => {
            const { icon: Icon, color } =
              ICON_PALETTE[i % ICON_PALETTE.length];
            return (
              <button
                key={text}
                onClick={() => onSuggestion(text)}
                className="group flex items-start gap-2.5 text-left px-3 py-2.5 rounded-xl border border-border/60 bg-white hover:border-primary/25 hover:shadow-sm transition-all"
              >
                <div className={`p-1 rounded-md ${color} shrink-0 mt-0.5`}>
                  <Icon className="w-3 h-3" />
                </div>
                <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors leading-relaxed line-clamp-2">
                  {text}
                </span>
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

// ─── Main chat interface ──────────────────────────────────────────────────────

export function ChatInterface() {
  const {
    messages,
    sourcesMap,
    isStreaming,
    error,
    send: sendMessage,
    reset: resetChat,
  } = useAiChat();
  const [input, setInput] = useState("");

  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isStreaming]);

  useEffect(() => {
    const handler = (e: Event) => {
      setInput((e as CustomEvent<string>).detail);
      textareaRef.current?.focus();
    };
    window.addEventListener("ai-suggestion", handler);
    return () => window.removeEventListener("ai-suggestion", handler);
  }, []);

  const send = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isStreaming) return;
      setInput("");
      if (textareaRef.current) textareaRef.current.style.height = "auto";
      void sendMessage(trimmed);
    },
    [isStreaming, sendMessage]
  );

  const handleSuggestion = useCallback(
    (text: string) => {
      send(text);
    },
    [send]
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send(input);
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = `${Math.min(e.target.scrollHeight, 160)}px`;
  };

  const reset = () => {
    resetChat();
    setInput("");
  };

  const messageCount = messages.filter((m) => m.role === "user").length;
  const lastMsg = messages[messages.length - 1];
  const awaitingFirstToken =
    isStreaming &&
    (!lastMsg || lastMsg.role !== "assistant" || lastMsg.content === "");

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border/50 shrink-0 bg-white/60 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-primary/8">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
          </div>
          <span className="text-sm font-semibold text-foreground">
            AI Assistant
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          {messageCount > 0 && (
            <span className="text-[10px] text-muted-foreground bg-secondary/80 px-2 py-0.5 rounded-full tabular-nums">
              {messageCount}
            </span>
          )}
          {messages.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={reset}
              className="gap-1 text-muted-foreground h-7 text-xs px-2 hover:text-foreground"
            >
              <RotateCcw className="w-3 h-3" />
              New
            </Button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto min-h-0">
        <div className="max-w-2xl mx-auto px-4 py-5 space-y-4">
          {messages.length === 0 ? (
            <EmptyState onSuggestion={handleSuggestion} />
          ) : (
            messages.map((msg, idx) => {
              if (
                msg.role === "assistant" &&
                msg.content === "" &&
                idx === messages.length - 1
              )
                return null;
              return (
                <MessageBubble
                  key={idx}
                  msg={msg}
                  sources={
                    msg.role === "assistant" ? sourcesMap[idx] : undefined
                  }
                  onAsk={handleSuggestion}
                />
              );
            })
          )}
          {awaitingFirstToken && <TypingIndicator />}
          {error && (
            <div className="flex items-start gap-2 text-red-600 bg-red-50/80 border border-red-200/50 rounded-xl px-3.5 py-2.5">
              <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <p className="text-xs leading-relaxed">{error}</p>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input */}
      <div className="px-4 pb-3 pt-2 border-t border-border/50 shrink-0 bg-white/60 backdrop-blur-sm">
        <div className="max-w-2xl mx-auto">
          <div className="flex gap-2 items-end bg-white rounded-xl border border-border/60 shadow-sm px-3 py-2 focus-within:border-primary/30 focus-within:ring-2 focus-within:ring-primary/8 transition-all">
            <textarea
              ref={textareaRef}
              rows={1}
              value={input}
              onChange={handleInput}
              onKeyDown={handleKeyDown}
              placeholder={appConfig.ai.placeholder}
              disabled={isStreaming}
              className="flex-1 bg-transparent text-sm resize-none outline-none text-foreground placeholder:text-muted-foreground/50 disabled:opacity-50 min-h-[28px] max-h-[160px] py-1.5 leading-relaxed"
            />
            <Button
              size="icon"
              className="w-8 h-8 shrink-0 rounded-lg bg-primary hover:bg-primary/90 shadow-sm shadow-primary/15 transition-all disabled:shadow-none"
              disabled={!input.trim() || isStreaming}
              onClick={() => send(input)}
            >
              <Send className="w-3.5 h-3.5" />
            </Button>
          </div>
          <p className="text-[10px] text-muted-foreground/40 text-center mt-2">
            ↵ Send · ⇧↵ New line
          </p>
        </div>
      </div>
    </div>
  );
}
