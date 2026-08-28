import { apiAxios } from "./client";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DepartmentHead {
  _id: string;
  name: string;
  email: string;
  position?: string;
}

export interface DepartmentMember {
  _id: string;
  name: string;
  email: string;
  position?: string;
  phone?: string;
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

// ─── CRUD & Lifecycle APIs ───────────────────────────────────────────────────

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

export const setDepartmentHead = (
  deptId: string,
  headId: string | null
): Promise<Department> =>
  apiAxios.patch(`/departments/${deptId}/head`, { headId }).then((r) => r.data.data);

export const assignDepartmentMembers = (
  deptId: string,
  userIds: string[]
): Promise<DepartmentDetail> =>
  apiAxios.post(`/departments/${deptId}/members`, { userIds }).then((r) => r.data.data);

export const removeDepartmentMember = (
  deptId: string,
  userId: string
): Promise<DepartmentDetail> =>
  apiAxios.delete(`/departments/${deptId}/members/${userId}`).then((r) => r.data.data);

export const transferDepartmentMembers = (
  deptId: string,
  data: { targetDepartmentId: string; userIds?: string[] }
): Promise<{ source: DepartmentDetail; target: DepartmentDetail }> =>
  apiAxios.post(`/departments/${deptId}/transfer-members`, data).then((r) => r.data.data);

export const reactivateDepartment = (deptId: string): Promise<Department> =>
  apiAxios.post(`/departments/${deptId}/activate`).then((r) => r.data.data);

export const deleteDepartment = (
  id: string,
  reassignTo?: string
): Promise<void> =>
  apiAxios
    .delete(`/departments/${id}`, { params: reassignTo ? { reassignTo } : undefined })
    .then(() => undefined);
