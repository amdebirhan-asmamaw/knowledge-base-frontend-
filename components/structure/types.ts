import type { DocSummary, UserRef } from "@/lib/api/documents.api";

export type ActiveSelection =
  | { type: "all" }
  | { type: "my_docs" }
  | { type: "hidden" }
  | { type: "category"; categoryId: string }
  | { type: "section"; categoryId: string; sectionId: string };

export type ViewMode = "list" | "grid";

export type SortField = "title" | "updatedAt" | "docId";
export type SortOrder = "asc" | "desc";

export interface FlatDocument extends DocSummary {
  categoryId: string;
  categoryName: string;
  categoryIsActive?: boolean;
  sectionId: string;
  sectionName: string;
  sectionIsActive?: boolean;
  contributors?: UserRef[];
}
