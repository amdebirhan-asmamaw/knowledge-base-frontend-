"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import { getExternalSurvey, submitExternalResponse, type SurveyField } from "@/lib/api/surveys.api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2, Send, CheckCircle2, AlertCircle, ClipboardList, Clock, Star, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

export default function PublicSurveyPage() {
  const params = useParams();
  const surveyId = params?.id as string;

  const { data: survey, isLoading, error } = useQuery({
    queryKey: ["surveys", "external", surveyId],
    queryFn: () => getExternalSurvey(surveyId),
    enabled: !!surveyId,
    retry: false,
  });

  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const submit = useMutation({
    mutationFn: () => {
      const payload = Object.entries(answers).map(([fieldId, value]) => ({ fieldId, value }));
      return submitExternalResponse(surveyId, payload);
    },
    onSuccess: () => {
      setSubmitted(true);
      toast.success("Response recorded successfully!");
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

    // Validate required fields
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

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-xs text-muted-foreground">Loading survey...</p>
        </div>
      </div>
    );
  }

  if (error || !survey) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground px-4">
        <Card className="p-8 text-center max-w-md w-full border-border shadow-sm">
          <AlertCircle className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
          <h2 className="text-lg font-bold mb-2">Survey Unavailable</h2>
          <p className="text-xs text-muted-foreground mb-4">
            This survey is currently not accepting responses, has concluded, or does not exist.
          </p>
        </Card>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground px-4">
        <Card className="p-8 text-center max-w-md w-full border-border shadow-sm space-y-4">
          <div className="w-14 h-14 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold">Thank You!</h2>
          <p className="text-xs text-muted-foreground">
            Your response to <strong>"{survey.title}"</strong> has been recorded successfully.
          </p>
          <div className="pt-2">
            <Badge variant="outline" className="text-xs">
              Submission ID: #{surveyId.slice(-6).toUpperCase()}
            </Badge>
          </div>
        </Card>
      </div>
    );
  }

  const sorted = [...survey.fields].sort((a, b) => a.order - b.order);

  return (
    <div className="min-h-screen bg-background text-foreground py-10 px-4">
      <div className="max-w-2xl mx-auto space-y-5">
        {/* Survey Banner Header */}
        <Card className="overflow-hidden border-border shadow-sm">
          <div className="h-1.5 bg-gradient-to-r from-primary via-primary/80 to-primary/60" />
          <div className="p-6">
            <div className="flex items-center gap-2 mb-2">
              <ClipboardList className="w-5 h-5 text-primary" />
              <Badge variant="secondary" className="text-[10px] uppercase font-mono">
                {survey.category}
              </Badge>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">{survey.title}</h1>
            {survey.description && (
              <p className="text-sm text-muted-foreground mt-2 whitespace-pre-line">
                {survey.description}
              </p>
            )}
            {survey.settings?.closesAt && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-3 pt-3 border-t">
                <Clock className="w-3.5 h-3.5" />
                <span>Closes on {new Date(survey.settings.closesAt).toLocaleDateString()}</span>
              </div>
            )}
          </div>
        </Card>

        {/* Survey Questions Form */}
        {sorted.map((field, idx) => (
          <Card
            key={field.id}
            className={`p-5 shadow-sm transition-colors ${
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

        {submitError && (
          <Card className="p-4 border-destructive/30 bg-destructive/5 text-destructive text-xs flex items-center gap-2">
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

        <p className="text-center text-[11px] text-muted-foreground">
          {survey.settings?.allowAnonymous
            ? "Your response is anonymous. No identity credentials are saved."
            : "Protected submission. Thank you for your feedback."}
        </p>
      </div>
    </div>
  );
}

// ─── Field Renderer ──────────────────────────────────────────────────────────

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

