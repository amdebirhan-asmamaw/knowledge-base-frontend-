"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { listExternalSurveys, type Survey, type SurveyCategory } from "@/lib/api/surveys.api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  ClipboardList,
  Search,
  Clock,
  ArrowRight,
  Loader2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Globe,
  Sparkles,
} from "lucide-react";

const CATEGORY_COLORS: Record<SurveyCategory, string> = {
  feedback: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-900/40",
  ideas: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-900/40",
  satisfaction: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/40",
  poll: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-900/40",
  other: "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800",
};

export default function PublicSurveyCatalogPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>("all");

  const { data, isLoading, error } = useQuery({
    queryKey: ["surveys", "external", { page, category: category !== "all" ? category : undefined, search: search.trim() || undefined }],
    queryFn: () =>
      listExternalSurveys({
        page,
        limit: 12,
        category: category !== "all" ? category : undefined,
        search: search.trim() || undefined,
      }),
  });

  const surveys = data?.surveys || [];
  const pagination = data?.pagination || { page: 1, limit: 12, total: 0, totalPages: 1 };

  return (
    <div className="min-h-screen bg-background text-foreground py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Hero Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 text-xs font-medium mb-1">
            <Globe className="w-3.5 h-3.5" /> Public Feedback & Surveys
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
            Share Your Voice & Feedback
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground max-w-xl mx-auto">
            Participate in open surveys, customer satisfaction questionnaires, and community polls. No login required.
          </p>
        </div>

        {/* Search & Filter Toolbar */}
        <Card className="p-4 shadow-sm border-border">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              <Input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Search surveys by title or topic..."
                className="pl-9 text-xs h-9"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              {["all", "feedback", "satisfaction", "ideas", "poll"].map((cat) => (
                <Button
                  key={cat}
                  variant={category === cat ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setCategory(cat);
                    setPage(1);
                  }}
                  className="h-8 text-xs capitalize shrink-0"
                >
                  {cat === "all" ? "All" : cat}
                </Button>
              ))}
            </div>
          </div>
        </Card>

        {/* Surveys Grid */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-xs text-muted-foreground">Loading public questionnaires...</p>
          </div>
        ) : error ? (
          <Card className="p-8 text-center border-destructive/20 bg-destructive/5 text-destructive">
            <AlertCircle className="w-8 h-8 mx-auto mb-2" />
            <p className="text-sm font-medium">Unable to load surveys at this time.</p>
          </Card>
        ) : surveys.length === 0 ? (
          <Card className="p-16 text-center border-dashed border-border">
            <ClipboardList className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <h3 className="font-semibold text-base mb-1">No Active Public Surveys</h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              There are no open surveys matching your criteria at the moment. Please check back later!
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {surveys.map((s) => (
              <Card
                key={s._id}
                className="p-5 flex flex-col justify-between hover:border-primary/40 hover:shadow-md transition-all group"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <Badge variant="outline" className={`text-[10px] font-normal ${CATEGORY_COLORS[s.category]}`}>
                      {s.category}
                    </Badge>
                    {s.settings?.allowAnonymous && (
                      <span className="text-[10px] text-muted-foreground font-medium">
                        Anonymous
                      </span>
                    )}
                  </div>

                  <div>
                    <h3 className="font-semibold text-base text-foreground group-hover:text-primary transition-colors line-clamp-1">
                      {s.title}
                    </h3>
                    {s.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                        {s.description}
                      </p>
                    )}
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t flex items-center justify-between gap-2">
                  <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                    <span>{s.fields.length} questions</span>
                    {s.settings?.closesAt && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Until {new Date(s.settings.closesAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>

                  <Link href={`/survey/${s._id}`}>
                    <Button size="sm" className="h-8 text-xs gap-1.5 shadow-sm">
                      Take Survey <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Pagination */}
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
    </div>
  );
}
