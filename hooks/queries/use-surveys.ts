"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import {
  listSurveys, getSurvey, createSurvey, updateSurvey, deleteSurvey,
  getSurveyResponses, getSurveySummary, getSurveyStats, cloneSurvey, updateSurveyStatus,
  getMySurveyResponses, getMyResponseForSurvey,
  type SurveyFilters,
} from "@/lib/api/surveys.api";

export function useSurveys(filters: SurveyFilters = {}) {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: queryKeys.surveys.list(filters as unknown as Record<string, unknown>),
    queryFn: () => listSurveys(filters),
  });
  const data = query.data ?? { surveys: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 1 } };
  return {
    surveys: data.surveys, pagination: data.pagination,
    isLoading: query.isLoading,
    error: query.error instanceof Error ? query.error.message : query.error ? String(query.error) : null,
    invalidate: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.surveys.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.surveys.stats });
    },
  };
}

export function useSurveyStats() {
  return useQuery({
    queryKey: queryKeys.surveys.stats,
    queryFn: getSurveyStats,
    staleTime: 30_000,
  });
}

export function useSurveyDetail(id: string | null) {
  return useQuery({
    queryKey: queryKeys.surveys.detail(id || ''),
    queryFn: () => getSurvey(id!),
    enabled: !!id,
  });
}

export function useSurveyResponses(id: string | null, page = 1) {
  return useQuery({
    queryKey: [...queryKeys.surveys.detail(id || ''), 'responses', page],
    queryFn: () => getSurveyResponses(id!, page),
    enabled: !!id,
  });
}

export function useSurveySummary(id: string | null) {
  return useQuery({
    queryKey: [...queryKeys.surveys.detail(id || ''), 'summary'],
    queryFn: () => getSurveySummary(id!),
    enabled: !!id,
  });
}

export function useMySurveyResponses(page = 1) {
  return useQuery({
    queryKey: queryKeys.surveys.myResponses(page),
    queryFn: () => getMySurveyResponses(page),
  });
}

export function useMyResponseForSurvey(surveyId: string | null) {
  return useQuery({
    queryKey: queryKeys.surveys.myDetail(surveyId || ''),
    queryFn: () => getMyResponseForSurvey(surveyId!),
    enabled: !!surveyId,
  });
}

export function useSurveyMutations() {
  const queryClient = useQueryClient();
  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.surveys.all });
    queryClient.invalidateQueries({ queryKey: queryKeys.surveys.stats });
  };

  return {
    createSurvey: useMutation({ mutationFn: createSurvey, onSuccess: invalidate }),
    updateSurvey: useMutation({
      mutationFn: ({ id, data }: { id: string; data: object }) => updateSurvey(id, data),
      onSuccess: invalidate,
    }),
    updateStatus: useMutation({
      mutationFn: ({ id, status }: { id: string; status: "draft" | "published" | "closed" }) =>
        updateSurveyStatus(id, status),
      onSuccess: invalidate,
    }),
    cloneSurvey: useMutation({
      mutationFn: (id: string) => cloneSurvey(id),
      onSuccess: invalidate,
    }),
    deleteSurvey: useMutation({ mutationFn: deleteSurvey, onSuccess: invalidate }),
  };
}

