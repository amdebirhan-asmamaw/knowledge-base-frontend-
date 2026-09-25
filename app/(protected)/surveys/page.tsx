"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  listPublicSurveys,
  getPublicSurvey,
  submitSurveyResponse,
  getMyResponseForSurvey,
  getSurveySummary,
  type Survey,
  type SurveyField,
  type SurveyCategory,
} from "@/lib/api/surveys.api";
import { useMyResponseForSurvey, useSurveySummary } from "@/hooks/queries";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/PageShell";
import {
  ClipboardList,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertCircle,
  Send,
  CheckCircle2,
  Clock,
  Users,
  Search,
  Star,
  Check,
  Filter,
  Eye,
  BarChart3,
  Calendar,
  FileCheck2,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";

const CATEGORY_COLORS: Record<SurveyCategory, string> = {
  feedback: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-900/40",
  ideas: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-900/40",
  satisfaction: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/40",
  poll: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-900/40",
  other: "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800",
};

export default function ProtectedSurveysPage() {
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [viewingResponseId, setViewingResponseId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [statusTab, setStatusTab] = useState<"all" | "pending" | "completed">("all");

  const { data, isLoading, error } = useQuery({
    queryKey: ["surveys", "public", page],
    queryFn: () => listPublicSurveys(page),
  });

  const surveys = data?.surveys || [];
  const pagination = data?.pagination || { page: 1, limit: 20, total: 0, totalPages: 1 };

  // Participation counts
  const totalCount = surveys.length;
  const completedCount = surveys.filter((s) => s.hasResponded).length;
  const pendingCount = totalCount - completedCount;

  // Filter client-side by search query, category, and participation status
  const filteredSurveys = surveys.filter((s) => {
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchTitle = s.title.toLowerCase().includes(q);
      const matchDesc = s.description?.toLowerCase().includes(q);
      if (!matchTitle && !matchDesc) return false;
    }
    if (categoryFilter !== "all" && s.category !== categoryFilter) {
      return false;
    }
    if (statusTab === "pending" && s.hasResponded) {
      return false;
    }
    if (statusTab === "completed" && !s.hasResponded) {
      return false;
    }
    return true;
  });

  // Sub-view: Survey Response / Submission Receipt Viewer
  if (viewingResponseId) {
    return (
      <SurveyResponseViewer
        surveyId={viewingResponseId}
        onBack={() => setViewingResponseId(null)}
      />
    );
  }

  // Sub-view: Survey Questionnaire Filler
  if (selectedId) {
    return (
      <SurveyFiller
        surveyId={selectedId}
        onBack={() => setSelectedId(null)}
        onViewSubmitted={() => {
          const id = selectedId;
          setSelectedId(null);
          setViewingResponseId(id);
        }}
      />
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      <PageHeader
        icon={<ClipboardList className="w-5 h-5 text-primary" />}
        title="Surveys & Feedback"
        subtitle="Share your insights, participate in company polls, and review your submissions"
      />

      {/* Filter and Search Bar */}
      <Card className="p-3.5 space-y-3 shadow-sm border-border">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search surveys by title or description..."
            className="pl-9 text-xs h-9"
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t">
          {/* Status Tabs */}
          <div className="flex items-center gap-1">
            <Button
              variant={statusTab === "all" ? "default" : "ghost"}
              size="sm"
              onClick={() => setStatusTab("all")}
              className="h-7 text-xs px-2.5 gap-1.5"
            >
              All
              <span className="text-[10px] opacity-75 font-mono">({totalCount})</span>
            </Button>
            <Button
              variant={statusTab === "pending" ? "default" : "ghost"}
              size="sm"
              onClick={() => setStatusTab("pending")}
              className="h-7 text-xs px-2.5 gap-1.5"
            >
              Action Required
              {pendingCount > 0 && (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-400 font-semibold font-mono">
                  {pendingCount}
                </span>
              )}
            </Button>
            <Button
              variant={statusTab === "completed" ? "default" : "ghost"}
              size="sm"
              onClick={() => setStatusTab("completed")}
              className="h-7 text-xs px-2.5 gap-1.5"
            >
              Completed
              {completedCount > 0 && (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 font-semibold font-mono">
                  {completedCount}
                </span>
              )}
            </Button>
          </div>

          {/* Category Dropdown */}
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Filter className="w-3.5 h-3.5" />
            <select
              className="border border-input rounded-md px-2 py-1 text-xs bg-background text-foreground h-7"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="all">All Categories</option>
              <option value="feedback">Feedback</option>
              <option value="ideas">Ideas</option>
              <option value="satisfaction">Satisfaction</option>
              <option value="poll">Poll</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Main Surveys Listing */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-xs text-muted-foreground">Loading available questionnaires...</p>
        </div>
      ) : error ? (
        <Card className="p-6 text-center border-destructive/20 bg-destructive/5 text-destructive">
          <AlertCircle className="w-6 h-6 mx-auto mb-2" />
          <p className="text-sm font-medium">Failed to load surveys.</p>
        </Card>
      ) : filteredSurveys.length === 0 ? (
        <Card className="p-16 text-center border-dashed border-border">
          <ClipboardList className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
          <h3 className="font-semibold text-sm mb-1">
            {statusTab === "completed"
              ? "No completed surveys yet"
              : statusTab === "pending"
              ? "All caught up! No pending surveys"
              : "No surveys found"}
          </h3>
          <p className="text-xs text-muted-foreground">
            {statusTab === "completed"
              ? "Once you participate in a survey, your submission history and receipts will be listed here."
              : "Check back later for newly published questionnaires."}
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredSurveys.map((s) => (
            <Card
              key={s._id}
              className="p-5 hover:border-primary/40 hover:shadow-sm transition-all group"
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors">
                    {s.title}
                  </h3>
                  <Badge variant="outline" className={`text-[10px] ${CATEGORY_COLORS[s.category]}`}>
                    {s.category}
                  </Badge>
                </div>
                {s.hasResponded ? (
                  <Badge
                    variant="outline"
                    className="text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/40 gap-1 shrink-0 font-medium"
                  >
                    <Check className="w-3 h-3" /> Completed
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="text-[10px] shrink-0 font-normal">
                    Open
                  </Badge>
                )}
              </div>

              {s.description && (
                <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                  {s.description}
                </p>
              )}

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-border/50">
                <div className="flex items-center flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  <span>{s.fields.length} questions</span>
                  {s.settings?.closesAt && (
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      Closes {new Date(s.settings.closesAt).toLocaleDateString()}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5" /> {s.responsesCount} responses
                  </span>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {s.hasResponded ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setViewingResponseId(s._id)}
                      className="h-8 text-xs gap-1.5 text-primary border-primary/30 hover:bg-primary/5"
                    >
                      <FileCheck2 className="w-3.5 h-3.5" /> View My Answers
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => setSelectedId(s._id)}
                      className="h-8 text-xs gap-1.5 shadow-sm"
                    >
                      <Send className="w-3 h-3" /> Fill Survey
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}

          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 pt-4">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="gap-1 text-xs h-8"
              >
                <ChevronLeft className="w-3.5 h-3.5" /> Previous
              </Button>
              <span className="text-xs text-muted-foreground">
                Page {page} of {pagination.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= pagination.totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="gap-1 text-xs h-8"
              >
                Next <ChevronRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Survey Response / Submission Viewer ──────────────────────────────────────

function SurveyResponseViewer({
  surveyId,
  onBack,
}: {
  surveyId: string;
  onBack: () => void;
}) {
  const [activeTab, setActiveTab] = useState<"answers" | "results">("answers");
  const { data: myResponse, isLoading, error } = useMyResponseForSurvey(surveyId);
  const { data: summary } = useSurveySummary(surveyId);

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex flex-col items-center justify-center py-24 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-xs text-muted-foreground">Loading your submission record...</p>
      </div>
    );
  }

  if (error || !myResponse) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-4">
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-1 text-xs">
          <ChevronLeft className="w-4 h-4" /> Back to Surveys
        </Button>
        <Card className="p-8 text-center border-destructive/20 bg-destructive/5 text-destructive">
          <AlertCircle className="w-8 h-8 mx-auto mb-2" />
          <h3 className="font-semibold text-sm">Submission Not Found</h3>
          <p className="text-xs text-muted-foreground mt-1">
            Could not retrieve your response for this survey.
          </p>
        </Card>
      </div>
    );
  }

  const survey: Survey = myResponse.survey;
  const answersMap = new Map((myResponse.answers || []).map((a: any) => [a.fieldId, a.value]));
  const canViewResults = Boolean(survey?.settings?.showResultsToRespondents);
  const sortedFields = [...(survey?.fields || [])].sort((a, b) => a.order - b.order);

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-1 text-xs">
          <ChevronLeft className="w-4 h-4" /> Back to Surveys
        </Button>
        <Badge variant="outline" className="text-xs gap-1.5 bg-emerald-500/10 text-emerald-600 border-emerald-200">
          <Check className="w-3.5 h-3.5" /> Completed Submission
        </Badge>
      </div>

      {/* Submission Receipt Banner */}
      <Card className="overflow-hidden border-border shadow-sm">
        <div className="h-1.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-primary" />
        <div className="p-6 space-y-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600">
              <FileCheck2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={`text-[10px] ${CATEGORY_COLORS[survey.category]}`}>
                  {survey.category}
                </Badge>
                <span className="text-[11px] text-muted-foreground font-mono">v{myResponse.surveyVersion}</span>
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-foreground mt-1">{survey.title}</h2>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t">
            <Calendar className="w-3.5 h-3.5" />
            <span>
              Submitted on {new Date(myResponse.submittedAt).toLocaleDateString()} at{" "}
              {new Date(myResponse.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        </div>
      </Card>

      {/* Tabs if results are open to respondents */}
      {canViewResults && (
        <div className="flex items-center gap-2 border-b pb-2">
          <Button
            variant={activeTab === "answers" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("answers")}
            className="text-xs gap-1.5"
          >
            <FileCheck2 className="w-3.5 h-3.5" /> My Submitted Answers
          </Button>
          <Button
            variant={activeTab === "results" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("results")}
            className="text-xs gap-1.5"
          >
            <BarChart3 className="w-3.5 h-3.5" /> Community Poll Results
          </Button>
        </div>
      )}

      {/* Tab 1: My Submitted Answers */}
      {activeTab === "answers" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
            <span>Your Submitted Responses ({sortedFields.length} questions)</span>
            <span className="italic">Read-only record</span>
          </div>

          {sortedFields.map((field, idx) => {
            const rawVal = answersMap.get(field.id);
            return (
              <Card key={field.id} className="p-5 shadow-sm space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <label className="text-sm font-medium text-foreground">
                    <span className="text-muted-foreground font-mono mr-1.5">{idx + 1}.</span>
                    {field.label}
                  </label>
                  <Badge variant="outline" className="text-[10px] uppercase font-mono shrink-0">
                    {field.type}
                  </Badge>
                </div>

                <div className="pt-1">
                  <AnswerDisplay field={field} value={rawVal} />
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Tab 2: Community Results (if enabled) */}
      {activeTab === "results" && canViewResults && summary && (
        <div className="space-y-4">
          <Card className="p-4 bg-muted/20 border flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">Participation Overview</p>
              <h3 className="text-xl font-bold text-foreground">
                {summary.totalResponses} Total Submissions
              </h3>
            </div>
            <Badge variant="outline" className="text-xs">
              Live Aggregate
            </Badge>
          </Card>

          {summary.fields.map((f) => (
            <Card key={f.fieldId} className="p-5 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <h4 className="text-sm font-semibold text-foreground">{f.label}</h4>
                <span className="text-xs text-muted-foreground font-mono">{f.totalAnswers} answered</span>
              </div>

              {/* Distribution */}
              {f.distribution && Object.keys(f.distribution).length > 0 && (
                <div className="space-y-2 pt-1">
                  {Object.entries(f.distribution)
                    .sort((a, b) => b[1] - a[1])
                    .map(([val, count]) => {
                      const pct = f.totalAnswers > 0 ? Math.round((count / f.totalAnswers) * 100) : 0;
                      return (
                        <div key={val} className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-medium text-foreground/90">{val}</span>
                            <span className="text-muted-foreground font-mono">
                              {count} ({pct}%)
                            </span>
                          </div>
                          <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary rounded-full transition-all"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}

              {/* Numerical or Rating average */}
              {(f.type === "rating" || f.type === "number") && f.average !== undefined && (
                <div className="flex items-center gap-4 text-xs pt-1">
                  <span className="font-semibold text-primary flex items-center gap-1">
                    {f.type === "rating" && <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />}
                    Average: {f.average.toFixed(1)} / 5
                  </span>
                  <span className="text-muted-foreground">Min: {f.min}</span>
                  <span className="text-muted-foreground">Max: {f.max}</span>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Answer Formatter Component ───────────────────────────────────────────────

function AnswerDisplay({ field, value }: { field: SurveyField; value: unknown }) {
  if (value === undefined || value === null || value === "") {
    return <span className="text-xs text-muted-foreground italic">(No answer provided)</span>;
  }

  switch (field.type) {
    case "rating": {
      const score = Number(value);
      return (
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <Star
                key={n}
                className={`w-5 h-5 ${
                  score >= n ? "text-amber-400 fill-amber-400" : "text-muted-foreground/30"
                }`}
              />
            ))}
          </div>
          <span className="text-xs font-bold text-foreground ml-1">{score} / 5</span>
        </div>
      );
    }

    case "checkbox":
      return (
        <Badge variant={value ? "default" : "outline"} className="text-xs">
          {value ? "Yes / Agreed" : "No / Disagreed"}
        </Badge>
      );

    case "radio":
    case "select": {
      const matchingOpt = field.options.find((o) => o.value === value || o.label === value);
      return (
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20 text-xs font-medium text-primary">
          <Check className="w-3.5 h-3.5" />
          {matchingOpt?.label || String(value)}
        </div>
      );
    }

    case "multi-select": {
      const arr = Array.isArray(value) ? value : [value];
      return (
        <div className="flex flex-wrap gap-1.5">
          {arr.map((item, i) => {
            const matchingOpt = field.options.find((o) => o.value === item || o.label === item);
            return (
              <Badge key={i} variant="secondary" className="text-xs py-1">
                {matchingOpt?.label || String(item)}
              </Badge>
            );
          })}
        </div>
      );
    }

    case "textarea":
      return (
        <div className="p-3 rounded-lg bg-muted/40 border border-border text-xs text-foreground whitespace-pre-line leading-relaxed">
          {String(value)}
        </div>
      );

    default:
      return <div className="text-xs font-medium text-foreground">{String(value)}</div>;
  }
}

// ─── Survey Filler ────────────────────────────────────────────────────────────

function SurveyFiller({
  surveyId,
  onBack,
  onViewSubmitted,
}: {
  surveyId: string;
  onBack: () => void;
  onViewSubmitted: () => void;
}) {
  const queryClient = useQueryClient();
  const { data: survey, isLoading } = useQuery({
    queryKey: ["surveys", "public", surveyId],
    queryFn: () => getPublicSurvey(surveyId),
  });

  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const submit = useMutation({
    mutationFn: () => {
      const payload = Object.entries(answers).map(([fieldId, value]) => ({ fieldId, value }));
      return submitSurveyResponse(surveyId, payload);
    },
    onSuccess: () => {
      setSubmitted(true);
      queryClient.invalidateQueries({ queryKey: ["surveys", "public"] });
      queryClient.invalidateQueries({ queryKey: ["surveys", "my-responses"] });
      toast.success("Response recorded! Thank you for participating.");
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || err?.message || "Failed to submit survey";
      setSubmitError(msg);
      toast.error(msg);
    },
  });

  const handleSubmit = () => {
    setSubmitError(null);
    if (!survey) return;

    const errors: Record<string, string> = {};
    for (const field of survey.fields) {
      if (field.required) {
        const val = answers[field.id];
        if (val === undefined || val === null || val === "" || (Array.isArray(val) && val.length === 0)) {
          errors[field.id] = "This question is required";
        }
      }
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      setSubmitError("Please fill in all required questions marked with *");
      return;
    }

    setValidationErrors({});
    submit.mutate();
  };

  if (isLoading || !survey) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-xs text-muted-foreground">Loading survey...</p>
        </div>
      </div>
    );
  }

  // Submitted completion screen
  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <Card className="p-10 text-center space-y-4 shadow-sm border-border">
          <div className="w-14 h-14 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-foreground">Thank you!</h2>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            Your response to <strong>"{survey.title}"</strong> has been recorded successfully.
          </p>
          <div className="flex items-center justify-center gap-3 pt-3">
            <Button variant="outline" onClick={onBack} size="sm">
              Back to Surveys
            </Button>
            <Button onClick={onViewSubmitted} size="sm" className="gap-1.5">
              <FileCheck2 className="w-4 h-4" /> View My Answers
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // Check if previously responded and only 1 response allowed
  const alreadyResponded = Boolean(survey.hasResponded);
  const isOneResponseOnly = Boolean(survey.settings?.oneResponsePerUser);

  if (alreadyResponded && isOneResponseOnly) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-1 text-xs">
          <ChevronLeft className="w-4 h-4" /> Back to Surveys
        </Button>

        <Card className="p-8 text-center space-y-4 shadow-sm border-border">
          <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
            <Check className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-foreground">Already Completed</h2>
          <p className="text-xs text-muted-foreground max-w-md mx-auto">
            You have already submitted your response to <strong>"{survey.title}"</strong>. This survey is configured to accept one response per employee.
          </p>
          <div className="flex items-center justify-center gap-3 pt-2">
            <Button variant="outline" size="sm" onClick={onBack}>
              Return to Surveys
            </Button>
            <Button size="sm" onClick={onViewSubmitted} className="gap-1.5">
              <FileCheck2 className="w-4 h-4" /> View My Answers
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const sorted = [...survey.fields].sort((a, b) => a.order - b.order);

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      <Button variant="ghost" size="sm" className="gap-1 text-xs" onClick={onBack}>
        <ChevronLeft className="w-4 h-4" /> Back to Surveys
      </Button>

      {/* Survey Info Card */}
      <Card className="overflow-hidden shadow-sm border-border">
        <div className="h-1.5 bg-gradient-to-r from-primary via-primary/80 to-primary/60" />
        <div className="p-6">
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="outline" className={`text-[10px] ${CATEGORY_COLORS[survey.category]}`}>
              {survey.category}
            </Badge>
            {survey.settings?.allowAnonymous && (
              <Badge variant="secondary" className="text-[10px]">
                Anonymous Submission
              </Badge>
            )}
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-foreground">{survey.title}</h2>
          {survey.description && (
            <p className="text-xs text-muted-foreground mt-2 whitespace-pre-line">
              {survey.description}
            </p>
          )}
        </div>
      </Card>

      {/* Questionnaire Form */}
      <div className="space-y-4">
        {sorted.map((field, idx) => (
          <Card
            key={field.id}
            className={`p-5 transition-colors shadow-sm ${
              validationErrors[field.id] ? "border-destructive/60 bg-destructive/[0.01]" : ""
            }`}
          >
            <label className="text-sm font-medium mb-2.5 block text-foreground">
              <span className="text-muted-foreground font-mono mr-1.5">{idx + 1}.</span>
              {field.label} {field.required && <span className="text-destructive">*</span>}
            </label>
            <FieldInput
              field={field}
              value={answers[field.id]}
              onChange={(v) => {
                setAnswers((a) => ({ ...a, [field.id]: v }));
                if (validationErrors[field.id]) {
                  setValidationErrors((prev) => {
                    const next = { ...prev };
                    delete next[field.id];
                    return next;
                  });
                }
              }}
            />
            {validationErrors[field.id] && (
              <p className="text-xs text-destructive mt-1.5 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> {validationErrors[field.id]}
              </p>
            )}
          </Card>
        ))}
      </div>

      {submitError && (
        <Card className="p-3.5 border-destructive/30 bg-destructive/5 text-destructive text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{submitError}</span>
        </Card>
      )}

      <Button
        className="w-full gap-2 shadow-sm"
        size="lg"
        onClick={handleSubmit}
        disabled={submit.isPending}
      >
        {submit.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        Submit Response
      </Button>
    </div>
  );
}

// ─── Dynamic Field Renderer ───────────────────────────────────────────────────

function FieldInput({
  field,
  value,
  onChange,
}: {
  field: SurveyField;
  value: unknown;
  onChange: (v: unknown) => void;
}) {
  switch (field.type) {
    case "text":
      return (
        <Input
          placeholder={field.placeholder || "Your answer..."}
          value={(value as string) || ""}
          onChange={(e) => onChange(e.target.value)}
        />
      );
    case "textarea":
      return (
        <textarea
          className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background text-foreground resize-none focus:outline-none focus:ring-1 focus:ring-ring"
          rows={4}
          placeholder={field.placeholder || "Please share your detailed thoughts..."}
          value={(value as string) || ""}
          onChange={(e) => onChange(e.target.value)}
        />
      );
    case "number":
      return (
        <Input
          type="number"
          placeholder={field.placeholder || "Enter number..."}
          value={(value as string) || ""}
          onChange={(e) => onChange(e.target.value)}
          min={field.validation?.min}
          max={field.validation?.max}
        />
      );
    case "date":
      return (
        <Input
          type="date"
          value={(value as string) || ""}
          onChange={(e) => onChange(e.target.value)}
        />
      );
    case "select":
      return (
        <select
          className="w-full border border-input rounded-lg px-3 py-2.5 text-sm bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          value={(value as string) || ""}
          onChange={(e) => onChange(e.target.value)}
        >
          <option value="">{field.placeholder || "Select an option..."}</option>
          {field.options.map((o) => (
            <option key={o.id} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      );
    case "multi-select":
      return (
        <select
          multiple
          className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background text-foreground min-h-[100px] focus:outline-none focus:ring-1 focus:ring-ring"
          value={(value as string[]) || []}
          onChange={(e) =>
            onChange(Array.from(e.target.selectedOptions, (o) => o.value))
          }
        >
          {field.options.map((o) => (
            <option key={o.id} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      );
    case "radio":
      return (
        <div className="space-y-2">
          {field.options.map((o) => (
            <label
              key={o.id}
              className={`flex items-center gap-3 text-sm cursor-pointer p-2.5 rounded-lg border transition-all ${
                value === o.value
                  ? "border-primary bg-primary/5 text-foreground font-medium"
                  : "border-border hover:bg-muted/40 text-foreground/90"
              }`}
            >
              <input
                type="radio"
                name={field.id}
                value={o.value}
                checked={value === o.value}
                onChange={() => onChange(o.value)}
                className="accent-primary w-4 h-4"
              />
              <span>{o.label}</span>
            </label>
          ))}
        </div>
      );
    case "checkbox":
      return (
        <label className="flex items-center gap-3 text-sm cursor-pointer p-2.5 rounded-lg border border-border hover:bg-muted/40 transition-colors">
          <input
            type="checkbox"
            checked={Boolean(value)}
            onChange={(e) => onChange(e.target.checked)}
            className="accent-primary w-4 h-4 rounded"
          />
          <span>{field.placeholder || "I agree / Yes"}</span>
        </label>
      );
    case "rating":
      return (
        <div className="flex items-center gap-2">
          {[1, 2, 3, 4, 5].map((n) => {
            const isSelected = typeof value === "number" && value >= n;
            return (
              <button
                key={n}
                type="button"
                onClick={() => onChange(n)}
                className={`w-11 h-11 rounded-lg border-2 text-sm font-bold transition-all flex items-center justify-center ${
                  isSelected
                    ? "bg-primary text-primary-foreground border-primary scale-105"
                    : "border-border hover:border-primary/50 hover:scale-105 text-foreground"
                }`}
              >
                <Star className={`w-4 h-4 ${isSelected ? "fill-current" : ""}`} />
              </button>
            );
          })}
          {typeof value === "number" && value > 0 && (
            <span className="text-xs font-medium text-muted-foreground ml-2">
              {value} / 5
            </span>
          )}
        </div>
      );
    default:
      return (
        <Input
          value={(value as string) || ""}
          onChange={(e) => onChange(e.target.value)}
        />
      );
  }
}
