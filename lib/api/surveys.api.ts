import { apiAxios } from "./client";
import axios from "axios";
import { API_BASE_URL } from "@/config/app.config";

// ─── Types ────────────────────────────────────────────────────────────────────

export type SurveyFieldType = 'text' | 'textarea' | 'number' | 'select' | 'multi-select' | 'radio' | 'checkbox' | 'date' | 'rating';
export type SurveyStatus = 'draft' | 'published' | 'closed';
export type SurveyCategory = 'feedback' | 'ideas' | 'satisfaction' | 'poll' | 'other';
export type SurveyScope = 'internal' | 'external';

export interface FieldOption { id: string; label: string; value: string; }

export interface SurveyField {
  id: string; type: SurveyFieldType; label: string; placeholder: string;
  required: boolean; options: FieldOption[];
  validation: { min?: number; max?: number; pattern?: string }; order: number;
}

export interface Survey {
  _id: string; title: string; description: string;
  category: SurveyCategory; scope: SurveyScope;
  version: number; fields: SurveyField[];
  author: { _id: string; name: string; email: string };
  status: SurveyStatus;
  audience: {
    type: 'all' | 'departments' | 'employees';
    departments: { _id: string; name: string }[];
    employees: { _id: string; name: string; email: string }[];
  };
  settings: {
    allowAnonymous: boolean; oneResponsePerUser: boolean;
    startsAt: string | null; closesAt: string | null;
    showResultsToRespondents: boolean;
  };
  publishedAt: string | null; responsesCount: number;
  hasResponded?: boolean;
  createdAt: string; updatedAt: string;
}

export interface SurveyStats {
  total: number;
  byStatus: {
    draft: number;
    published: number;
    closed: number;
  };
  byCategory: Record<SurveyCategory, number>;
  byScope: Record<SurveyScope, number>;
  totalResponses: number;
  avgResponsesPerSurvey: number;
}

export interface SurveyListResponse {
  surveys: Survey[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

export interface SurveyResponse {
  _id: string; survey: string; surveyVersion: number;
  respondent: { _id: string; name: string; email: string } | null;
  answers: { fieldId: string; value: unknown }[];
  submittedAt: string;
}

export interface SurveyResponseListResponse {
  responses: SurveyResponse[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

export interface FieldSummary {
  fieldId: string; label: string; type: SurveyFieldType; totalAnswers: number;
  distribution?: Record<string, number>;
  average?: number; min?: number; max?: number;
  sample?: unknown[];
}

export interface SurveySummary { surveyId: string; totalResponses: number; fields: FieldSummary[]; }

export interface SurveyFilters {
  page?: number; limit?: number;
  search?: string;
  status?: SurveyStatus; category?: SurveyCategory;
  scope?: SurveyScope; sortBy?: string; sortOrder?: string;
}

export interface ExportData {
  headers: string[];
  rows: Record<string, string>[];
  total: number;
}

// ─── API (Admin) ──────────────────────────────────────────────────────────────

const unwrap = (res: any) => res.data.data;

export const listSurveys = (f: SurveyFilters = {}): Promise<SurveyListResponse> => apiAxios.get("/surveys", { params: f }).then(unwrap);
export const getSurveyStats = (): Promise<SurveyStats> => apiAxios.get("/surveys/stats").then(unwrap);
export const getSurvey = (id: string): Promise<Survey> => apiAxios.get(`/surveys/${id}`).then(unwrap);
export const createSurvey = (data: object): Promise<Survey> => apiAxios.post("/surveys", data).then(unwrap);
export const cloneSurvey = (id: string): Promise<Survey> => apiAxios.post(`/surveys/${id}/clone`).then(unwrap);
export const updateSurveyStatus = (id: string, status: SurveyStatus): Promise<Survey> => apiAxios.patch(`/surveys/${id}/status`, { status }).then(unwrap);
export const updateSurvey = (id: string, data: object): Promise<Survey> => apiAxios.put(`/surveys/${id}`, data).then(unwrap);
export const deleteSurvey = (id: string): Promise<void> => apiAxios.delete(`/surveys/${id}`).then(() => undefined);
export const getSurveyResponses = (id: string, page = 1, limit = 20): Promise<SurveyResponseListResponse> => apiAxios.get(`/surveys/${id}/responses`, { params: { page, limit } }).then(unwrap);
export const getSurveySummary = (id: string): Promise<SurveySummary> => apiAxios.get(`/surveys/${id}/summary`).then(unwrap);
export const exportSurveyResponses = (id: string): Promise<ExportData> => apiAxios.get(`/surveys/${id}/export`).then(unwrap);

// ─── API (Internal/Authenticated) ────────────────────────────────────────────

export const listPublicSurveys = (page = 1, limit = 20): Promise<SurveyListResponse> => apiAxios.get("/surveys/public", { params: { page, limit } }).then(unwrap);
export const getPublicSurvey = (id: string): Promise<Survey> => apiAxios.get(`/surveys/public/${id}`).then(unwrap);
export const getMySurveyResponses = (page = 1, limit = 20): Promise<{ responses: any[]; pagination: { page: number; limit: number; total: number; totalPages: number } }> =>
  apiAxios.get("/surveys/my-responses", { params: { page, limit } }).then(unwrap);
export const getMyResponseForSurvey = (surveyId: string): Promise<any> =>
  apiAxios.get(`/surveys/public/${surveyId}/my-response`).then(unwrap);
export const submitSurveyResponse = (id: string, answers: { fieldId: string; value: unknown }[]): Promise<SurveyResponse> => apiAxios.post(`/surveys/public/${id}/respond`, { answers }).then(unwrap);

// ─── API (External/Public — no auth) ─────────────────────────────────────────

const API_BASE = API_BASE_URL;

export const listExternalSurveys = (params?: { page?: number; limit?: number; category?: string; search?: string }): Promise<SurveyListResponse> =>
  axios.get(`${API_BASE}/surveys/external`, { params }).then((r) => r.data.data);
export const getExternalSurvey = (id: string): Promise<Survey> => axios.get(`${API_BASE}/surveys/external/${id}`).then((r) => r.data.data);
export const submitExternalResponse = (id: string, answers: { fieldId: string; value: unknown }[]): Promise<SurveyResponse> => axios.post(`${API_BASE}/surveys/external/${id}/respond`, { answers }).then((r) => r.data.data);


