"use client";

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  listPublicSurveys, getPublicSurvey, submitSurveyResponse,
  type Survey, type SurveyField, type SurveyCategory,
} from "@/lib/api/surveys.api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/PageShell";
import {
  ClipboardList, ChevronLeft, ChevronRight, Loader2, AlertCircle,
  Send, CheckCircle2, Clock, Users,
} from "lucide-react";

const CATEGORY_COLORS: Record<SurveyCategory, string> = {
  feedback: "bg-blue-50 text-blue-700 border-blue-200",
  ideas: "bg-amber-50 text-amber-700 border-amber-200",
  satisfaction: "bg-emerald-50 text-emerald-700 border-emerald-200",
  poll: "bg-violet-50 text-violet-700 border-violet-200",
  other: "bg-gray-100 text-gray-700 border-gray-200",
};

export default function PublicSurveysPage() {
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ["surveys", "public", page],
    queryFn: () => listPublicSurveys(page),
  });

  const surveys = data?.surveys || [];
  const pagination = data?.pagination || { page: 1, limit: 20, total: 0, totalPages: 1 };

  if (selectedId) {
    return <SurveyFiller surveyId={selectedId} onBack={() => setSelectedId(null)} />;
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <PageHeader
        icon={<ClipboardList className="w-5 h-5" style={{ color: "#2563eb" }} />}
        title="Surveys"
        subtitle="Share your feedback and ideas"
      />

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
          <AlertCircle className="w-5 h-5 text-red-500 mx-auto mb-2" />
          <p className="text-sm text-red-700">Failed to load surveys.</p>
        </div>
      ) : surveys.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-16 text-center">
          <ClipboardList className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No surveys available right now.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {surveys.map((s) => (
            <Card
              key={s._id}
              className="p-5 cursor-pointer hover:border-primary/30 hover:shadow-md transition-all group"
              onClick={() => setSelectedId(s._id)}
            >
              <div className="flex items-center gap-2 mb-1.5">
                <h3 className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors">
                  {s.title}
                </h3>
                <Badge variant="outline" className={`text-[10px] ${CATEGORY_COLORS[s.category]}`}>
                  {s.category}
                </Badge>
              </div>
              {s.description && (
                <p className="text-sm text-muted-foreground mb-2 line-clamp-2">{s.description}</p>
              )}
              <div className="flex items-center flex-wrap gap-4 text-xs text-muted-foreground">
                <span>{s.fields.length} questions</span>
                {s.settings.closesAt && (
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Closes {new Date(s.settings.closesAt).toLocaleDateString()}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Users className="w-3 h-3" />{s.responsesCount} responses
                </span>
              </div>
            </Card>
          ))}

          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 pt-4">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="gap-1">
                <ChevronLeft className="w-3.5 h-3.5" /> Previous
              </Button>
              <span className="text-xs text-muted-foreground">Page {page} of {pagination.totalPages}</span>
              <Button variant="outline" size="sm" disabled={page >= pagination.totalPages} onClick={() => setPage((p) => p + 1)} className="gap-1">
                Next <ChevronRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Survey Filler ────────────────────────────────────────────────────────────

function SurveyFiller({ surveyId, onBack }: { surveyId: string; onBack: () => void }) {
  const { data: survey, isLoading } = useQuery({
    queryKey: ["surveys", "public", surveyId],
    queryFn: () => getPublicSurvey(surveyId),
  });
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const submit = useMutation({
    mutationFn: () => {
      const payload = Object.entries(answers).map(([fieldId, value]) => ({ fieldId, value }));
      return submitSurveyResponse(surveyId, payload);
    },
    onSuccess: () => setSubmitted(true),
    onError: (err: any) => {
      setSubmitError(err?.response?.data?.message || err?.message || "Failed to submit");
    },
  });

  if (isLoading || !survey) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <Card className="p-12 text-center">
          <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
          <h2 className="text-lg font-bold mb-2">Thank you!</h2>
          <p className="text-muted-foreground mb-6">Your response has been recorded.</p>
          <Button onClick={onBack}>Back to Surveys</Button>
        </Card>
      </div>
    );
  }

  const sorted = [...survey.fields].sort((a, b) => a.order - b.order);

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <Button variant="ghost" size="sm" className="-ml-2 mb-6 gap-1 text-muted-foreground" onClick={onBack}>
        <ChevronLeft className="w-4 h-4" /> Back to Surveys
      </Button>

      <Card className="overflow-hidden mb-5">
        <div className="h-0.5 bg-primary" />
        <div className="p-6">
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="outline" className={`text-[10px] ${CATEGORY_COLORS[survey.category]}`}>
              {survey.category}
            </Badge>
          </div>
          <h2 className="text-lg font-bold text-foreground">{survey.title}</h2>
          {survey.description && (
            <p className="text-sm text-muted-foreground mt-1">{survey.description}</p>
          )}
        </div>
      </Card>

      <div className="space-y-4">
        {sorted.map((field) => (
          <Card key={field.id} className="p-5">
            <label className="text-sm font-medium mb-2 block">
              {field.label}{" "}
              {field.required && <span className="text-red-500">*</span>}
            </label>
            <FieldInput
              field={field}
              value={answers[field.id]}
              onChange={(v) => setAnswers((a) => ({ ...a, [field.id]: v }))}
            />
          </Card>
        ))}
      </div>

      {submitError && (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />{submitError}
        </div>
      )}

      <Button
        className="w-full gap-2 mt-5"
        size="lg"
        onClick={() => { setSubmitError(null); submit.mutate(); }}
        disabled={submit.isPending}
      >
        {submit.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        Submit Response
      </Button>
    </div>
  );
}

// ─── Dynamic field renderer ───────────────────────────────────────────────────

function FieldInput({ field, value, onChange }: { field: SurveyField; value: unknown; onChange: (v: unknown) => void }) {
  switch (field.type) {
    case "text":
      return <Input placeholder={field.placeholder} value={(value as string) || ""} onChange={(e) => onChange(e.target.value)} />;
    case "textarea":
      return (
        <textarea
          className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background resize-none focus:outline-none focus:ring-1 focus:ring-ring"
          rows={4}
          placeholder={field.placeholder}
          value={(value as string) || ""}
          onChange={(e) => onChange(e.target.value)}
        />
      );
    case "number":
      return <Input type="number" placeholder={field.placeholder} value={(value as string) || ""} onChange={(e) => onChange(e.target.value)} min={field.validation.min} max={field.validation.max} />;
    case "date":
      return <Input type="date" value={(value as string) || ""} onChange={(e) => onChange(e.target.value)} />;
    case "select":
      return (
        <select className="w-full border border-input rounded-lg px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-ring" value={(value as string) || ""} onChange={(e) => onChange(e.target.value)}>
          <option value="">{field.placeholder || "Select..."}</option>
          {field.options.map((o) => <option key={o.id} value={o.value}>{o.label}</option>)}
        </select>
      );
    case "multi-select":
      return (
        <select multiple className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background min-h-[100px] focus:outline-none focus:ring-1 focus:ring-ring" value={(value as string[]) || []} onChange={(e) => onChange(Array.from(e.target.selectedOptions, (o) => o.value))}>
          {field.options.map((o) => <option key={o.id} value={o.value}>{o.label}</option>)}
        </select>
      );
    case "radio":
      return (
        <div className="space-y-2">
          {field.options.map((o) => (
            <label key={o.id} className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="radio" name={field.id} value={o.value} checked={value === o.value} onChange={() => onChange(o.value)} className="accent-primary" />
              {o.label}
            </label>
          ))}
        </div>
      );
    case "checkbox":
      return (
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input type="checkbox" checked={!!value} onChange={(e) => onChange(e.target.checked)} className="accent-primary" />
          {field.placeholder || "Yes"}
        </label>
      );
    case "rating":
      return (
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => onChange(n)}
              className={`w-10 h-10 rounded-lg border-2 text-sm font-bold transition-all ${
                value === n
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-border hover:border-primary/50"
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      );
    default:
      return <Input value={(value as string) || ""} onChange={(e) => onChange(e.target.value)} />;
  }
}
