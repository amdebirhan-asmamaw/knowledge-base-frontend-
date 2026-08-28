import { apiAxios } from "./client";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DepartmentHead {
  _id: string;
  name: string;
  email: string;
}

export interface DepartmentMember {
  _id: string;
  name: string;
  email: string;
  position: string;
  role: { _id: string; name: string; description?: string; permissions?: string[] } | null;
  isActive: boolean;
}

export interface Department {
  _id: string;
  name: string;
  description: string;
  head: DepartmentHead | null;
  isActive: boolean;
  employeeCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface DepartmentDetail extends Department {
  members: DepartmentMember[];
}

// ─── CRUD ─────────────────────────────────────────────────────────────────────

export const listDepartments = (params?: {
  search?: string;
  isActive?: boolean;
}): Promise<Department[]> =>
  apiAxios.get("/departments", { params }).then((r) => r.data.data);

export const getDepartment = (id: string): Promise<DepartmentDetail> =>
  apiAxios.get(`/departments/${id}`).then((r) => r.data.data);

export const createDepartment = (data: {
  name: string;
  description?: string;
  head?: string | null;
}): Promise<Department> =>
  apiAxios.post("/departments", data).then((r) => r.data.data);

export const updateDepartment = (
  id: string,
  data: {
    name?: string;
    description?: string;
    head?: string | null;
    isActive?: boolean;
  }
): Promise<Department> =>
  apiAxios.put(`/departments/${id}`, data).then((r) => r.data.data);

export const deleteDepartment = (id: string): Promise<void> =>
  apiAxios.delete(`/departments/${id}`).then(() => undefined);
