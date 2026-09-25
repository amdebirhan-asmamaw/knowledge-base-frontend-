import { apiAxios } from "./client";

// ─── Types ────────────────────────────────────────────────────────────────────

export type PeriodType = "daily" | "weekly" | "monthly" | "quarterly";
export type ReportStatus = "draft" | "submitted";
export type ReportVisibility =
  | "everyone"
  | "department_only"
  | "admins_only"
  | "private";

export interface TaskReportAuthor {
  _id: string;
  name: string;
  email: string;
  position?: string;
}

export interface TaskReportDepartment {
  _id: string;
  name: string;
}

export interface TaskReportAttachment {
  _id?: string;
  publicId: string;
  url: string;
  originalFilename: string;
  format?: string;
  bytes: number;
  /** Cloudinary resource type — "raw" for PDFs/Office docs, "image" for images. */
  resourceType?: "image" | "raw" | "video";
}

export interface AllowedViewer {
  _id: string;
  name: string;
  email: string;
}

export interface TaskReport {
  _id: string;
  title: string;
  content: string;
  periodType: PeriodType;
  periodStart: string;
  periodEnd: string;
  department: TaskReportDepartment;
  author: TaskReportAuthor;
  status: ReportStatus;
  visibility: ReportVisibility;
  allowedViewers: AllowedViewer[];
  nextPlan: string;
  attachments: TaskReportAttachment[];
  createdAt: string;
  updatedAt: string;
}

export interface TaskReportListResponse {
  reports: TaskReport[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface TaskReportFilters {
  page?: number;
  limit?: number;
  search?: string;
  periodType?: PeriodType;
  department?: string;
  author?: string;
  status?: ReportStatus;
  visibility?: ReportVisibility;
  sortBy?: "createdAt" | "periodStart" | "title";
  sortOrder?: "asc" | "desc";
  dateFrom?: string;
  dateTo?: string;
}

export interface CreateTaskReportData {
  title: string;
  content: string;
  periodType: PeriodType;
  periodStart: string;
  periodEnd: string;
  department: string;
  status?: ReportStatus;
  nextPlan?: string;
  visibility?: ReportVisibility;
  allowedViewers?: string[];
  files?: File[];
  deletedAttachmentPublicIds?: string[];
}

export interface UpdateTaskReportData {
  title?: string;
  content?: string;
  periodType?: PeriodType;
  periodStart?: string;
  periodEnd?: string;
  department?: string;
  status?: ReportStatus;
  nextPlan?: string;
  visibility?: ReportVisibility;
  allowedViewers?: string[];
  files?: File[];
  deletedAttachmentPublicIds?: string[];
}

// Helper to construct FormData for multipart requests
function buildReportFormData(
  data: CreateTaskReportData | UpdateTaskReportData,
): FormData {
  const fd = new FormData();
  if (data.title !== undefined) fd.append("title", data.title);
  if (data.content !== undefined) fd.append("content", data.content);
  if (data.periodType !== undefined) fd.append("periodType", data.periodType);
  if (data.periodStart !== undefined) fd.append("periodStart", data.periodStart);
  if (data.periodEnd !== undefined) fd.append("periodEnd", data.periodEnd);
  if (data.department !== undefined) fd.append("department", data.department);
  if (data.status !== undefined) fd.append("status", data.status);
  if (data.nextPlan !== undefined) fd.append("nextPlan", data.nextPlan);
  if (data.visibility !== undefined) fd.append("visibility", data.visibility);

  if (data.allowedViewers !== undefined) {
    if (data.allowedViewers.length > 0) {
      data.allowedViewers.forEach((v) => fd.append("allowedViewers", v));
    } else {
      fd.append("allowedViewers", "[]");
    }
  }

  if (data.files && data.files.length > 0) {
    data.files.forEach((file) => fd.append("files", file));
  }

  if ("deletedAttachmentPublicIds" in data && data.deletedAttachmentPublicIds !== undefined) {
    if (data.deletedAttachmentPublicIds.length > 0) {
      data.deletedAttachmentPublicIds.forEach((id) =>
        fd.append("deletedAttachmentPublicIds", id),
      );
    } else {
      fd.append("deletedAttachmentPublicIds", "[]");
    }
  }

  return fd;
}

// ─── API Functions ────────────────────────────────────────────────────────────

export const listTaskReports = (
  filters?: TaskReportFilters,
): Promise<TaskReportListResponse> =>
  apiAxios
    .get("/reports/task-reports", { params: filters })
    .then((r) => r.data.data);

export const getTaskReport = (id: string): Promise<TaskReport> =>
  apiAxios.get(`/reports/task-reports/${id}`).then((r) => r.data.data);

export const createTaskReport = (
  data: CreateTaskReportData,
): Promise<TaskReport> => {
  if (data.files && data.files.length > 0) {
    const formData = buildReportFormData(data);
    return apiAxios
      .post("/reports/task-reports", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      .then((r) => r.data.data);
  }
  return apiAxios.post("/reports/task-reports", data).then((r) => r.data.data);
};

export const updateTaskReport = (
  id: string,
  data: UpdateTaskReportData,
): Promise<TaskReport> => {
  if (
    (data.files && data.files.length > 0) ||
    (data.deletedAttachmentPublicIds &&
      data.deletedAttachmentPublicIds.length > 0)
  ) {
    const formData = buildReportFormData(data);
    return apiAxios
      .put(`/reports/task-reports/${id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      .then((r) => r.data.data);
  }
  return apiAxios
    .put(`/reports/task-reports/${id}`, data)
    .then((r) => r.data.data);
};

/**
 * Fetch an attachment through the authenticated API and return an object URL.
 *
 * Cloudinary delivery URLs are not usable directly: PDF/raw delivery is
 * restricted on the account (HTTP 401), and the cross-origin `download`
 * attribute is ignored by browsers. Streaming through the backend and wrapping
 * the result in a `blob:` URL makes both previewing and downloading work.
 *
 * The caller owns the returned URL and must `URL.revokeObjectURL` it.
 */
export const fetchAttachmentObjectUrl = async (
  reportId: string,
  attachment: TaskReportAttachment,
  options?: { download?: boolean },
): Promise<string> => {
  const attachmentId = attachment._id || attachment.publicId;
  const res = await apiAxios.get(
    `/reports/task-reports/${reportId}/attachments/${encodeURIComponent(attachmentId)}/stream`,
    {
      responseType: "blob",
      params: options?.download ? { download: "true" } : undefined,
    },
  );
  return URL.createObjectURL(res.data as Blob);
};

export const deleteReportAttachment = (
  reportId: string,
  attachmentId: string,
): Promise<TaskReport> =>
  apiAxios
    .delete(`/reports/task-reports/${reportId}/attachments/${attachmentId}`)
    .then((r) => r.data.data);

export const deleteTaskReport = (id: string): Promise<void> =>
  apiAxios.delete(`/reports/task-reports/${id}`).then(() => undefined);

// ─── Public (any authenticated user) ─────────────────────────────────────────

export const listPublicTaskReports = (
  filters?: Pick<
    TaskReportFilters,
    "page" | "limit" | "search" | "periodType" | "department" | "sortBy" | "sortOrder"
  >,
): Promise<TaskReportListResponse> =>
  apiAxios
    .get("/reports/task-reports/public", { params: filters })
    .then((r) => r.data.data);

