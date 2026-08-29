"use client";

import { useState, useCallback, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useActivePolicies, usePolicyMutations } from "@/hooks/queries";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ScrollText,
  CheckCircle2,
  Loader2,
  ChevronRight,
  Shield,
  AlertCircle,
  Clock,
  ArrowRight,
  ExternalLink,
} from "lucide-react";

function PolicyContentContainer({
  html,
  policyId,
  onRead,
}: {
  html: string;
  policyId: string;
  onRead: (id: string) => void;
}) {
  const contentRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (node) {
        // If content fits inside without scrolling or is very short, immediately mark as read
        if (node.scrollHeight <= node.clientHeight + 20) {
          onRead(policyId);
        }
      }
    },
    [policyId, onRead],
  );

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 25) {
      onRead(policyId);
    }
  };

  return (
    <div
      ref={contentRef}
      onScroll={handleScroll}
      className="px-6 py-5 max-h-[55vh] overflow-y-auto prose prose-sm max-w-none text-foreground/90 leading-relaxed policy-content select-text"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

function PolicyAcceptanceContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = searchParams.get("from") || "/";
  const { data: policies, isLoading, refetch } = useActivePolicies();
  const { acceptPolicy } = usePolicyMutations();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const [acceptingId, setAcceptingId] = useState<string | null>(null);

  const handleScrollToEnd = useCallback((id: string) => {
    setReadIds((prev) => {
      if (prev.has(id)) return prev;
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  }, []);

  const handleAccept = async (id: string) => {
    setAcceptingId(id);
    try {
      await acceptPolicy.mutateAsync(id);
      await refetch();
    } catch {
      // error handled by mutation
    } finally {
      setAcceptingId(null);
    }
  };

  const allPolicies = policies ?? [];
  const requiredPolicies = allPolicies.filter((p) => p.isRequired);
  const pendingPolicies = requiredPolicies.filter((p) => !p.isAccepted);
  const acceptedCount = requiredPolicies.length - pendingPolicies.length;
  const allAccepted =
    pendingPolicies.length === 0 && requiredPolicies.length > 0;

  // Auto-expand the first unaccepted policy if none selected
  useEffect(() => {
    if (!expandedId && pendingPolicies.length > 0) {
      setExpandedId(pendingPolicies[0]._id);
    }
  }, [expandedId, pendingPolicies]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-xs text-muted-foreground">
          Checking policy compliance status…
        </p>
      </div>
    );
  }

  if (allAccepted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background flex items-center justify-center p-6">
        <Card className="max-w-md w-full p-8 text-center shadow-xl border-border rounded-3xl animate-in zoom-in-95 duration-200">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mb-4 shadow-xs">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight mb-2">
            All Required Policies Accepted
          </h1>
          <p className="text-xs text-muted-foreground leading-relaxed mb-6">
            You have reviewed and acknowledged all compliance policies for
            Ahununu Express. You have full access to the platform.
          </p>
          <Button
            onClick={() => router.push(returnTo)}
            className="w-full gap-2 h-10 font-semibold shadow-sm"
          >
            Continue to Platform <ChevronRight className="w-4 h-4" />
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background py-12 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto space-y-7">
        {/* Header Ribbon */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 text-primary mb-1 shadow-xs">
            <Shield className="w-7 h-7" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
            Company Policy Acknowledgement
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-lg mx-auto leading-relaxed">
            Please review and accept the company policies below to ensure
            operational safety, regulatory compliance, and workplace standards.
          </p>

          {requiredPolicies.length > 0 && (
            <div className="pt-2 flex flex-col items-center justify-center gap-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                <span>
                  {acceptedCount} of {requiredPolicies.length} required policies
                  accepted
                </span>
              </div>
              <div className="w-48 h-2 bg-muted rounded-full overflow-hidden border border-border/40">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-300"
                  style={{
                    width: `${(acceptedCount / (requiredPolicies.length || 1)) * 100}%`,
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Policy List */}
        <div className="space-y-4">
          {allPolicies.map((policy) => {
            const isExpanded = expandedId === policy._id;
            const hasRead = readIds.has(policy._id);
            // Allow accept if marked as read, if already accepted, or if user is viewing it
            const canAccept = hasRead || policy.isAccepted;

            return (
              <Card
                key={policy._id}
                className={`overflow-hidden rounded-2xl border transition-all duration-200 shadow-sm ${
                  isExpanded
                    ? "border-primary/40 shadow-md ring-1 ring-primary/20"
                    : "border-border hover:border-border/80"
                }`}
              >
                {/* Header Toggle Button */}
                <button
                  onClick={() =>
                    setExpandedId(isExpanded ? null : policy._id)
                  }
                  className="w-full flex items-center justify-between gap-3.5 px-6 py-4.5 text-left hover:bg-muted/40 transition-colors"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div
                      className={`p-2.5 rounded-xl shrink-0 transition-colors ${
                        policy.isAccepted
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                          : "bg-primary/10 text-primary"
                      }`}
                    >
                      <ScrollText className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-sm text-foreground tracking-tight truncate">
                        {policy.title}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-2">
                        <span>Version {policy.version}</span>
                        {policy.isRequired && (
                          <span className="text-amber-600 dark:text-amber-400 font-medium">
                            · Required
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    {policy.isAccepted ? (
                      <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 gap-1.5 px-3 py-1 font-semibold text-xs">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Accepted
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 px-2.5 py-1 text-xs font-semibold"
                      >
                        Pending Review
                      </Badge>
                    )}
                    <ChevronRight
                      className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${
                        isExpanded ? "rotate-90 text-primary" : ""
                      }`}
                    />
                  </div>
                </button>

                {/* Expanded Policy Content & Actions */}
                {isExpanded && (
                  <div className="border-t border-border bg-card">
                    <PolicyContentContainer
                      html={policy.contentHtml}
                      policyId={policy._id}
                      onRead={handleScrollToEnd}
                    />

                    {!policy.isAccepted && (
                      <div className="px-6 py-4 bg-muted/40 border-t border-border flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={hasRead}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  handleScrollToEnd(policy._id);
                                }
                              }}
                              className="rounded text-primary focus:ring-primary"
                            />
                            <span>
                              I have read, understood, and agree to follow this
                              policy.
                            </span>
                          </label>
                        </div>

                        <Button
                          size="sm"
                          disabled={!canAccept || acceptingId === policy._id}
                          onClick={() => handleAccept(policy._id)}
                          className="gap-2 h-9 px-5 font-semibold shrink-0 shadow-sm bg-primary text-primary-foreground"
                        >
                          {acceptingId === policy._id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <CheckCircle2 className="w-4 h-4" />
                          )}
                          {acceptingId === policy._id
                            ? "Recording…"
                            : "I Accept Policy"}
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function PolicyAcceptancePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      }
    >
      <PolicyAcceptanceContent />
    </Suspense>
  );
}
