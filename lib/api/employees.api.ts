import { apiAxios } from "./client";

export interface AssignedClient {
  _id: string;
  name: string;
  company: string;
  industry: string;
  status: string;
  tier: string;
}

export interface Employee {
  _id: string;
  name: string;
  email: string;
  role: { _id: string; name: string } | null;
  permissions?: string[];
  department: { _id: string; name: string } | null;
  position: string;
  isActive: boolean;
  assignedClients: AssignedClient[];
  createdAt: string;
  updatedAt: string;
}

export const listEmployees = (params?: { search?: string; department?: string; isActive?: boolean; role?: string }): Promise<Employee[]> =>
  apiAxios.get("/users", { params }).then((r) => r.data.data);

export const getEmployee = (id: string): Promise<Employee> =>
  apiAxios.get(`/users/${id}`).then((r) => r.data.data);

export const createEmployee = (data: {
  name: string;
  email: string;
  password: string;
  department?: string;
  position?: string;
  assignedClients?: string[];
  role?: string;
}): Promise<Employee> =>
  apiAxios.post("/users", data).then((r) => r.data.data);

export const updateEmployee = (
  id: string,
  data: { name?: string; department?: string; position?: string; isActive?: boolean; assignedClients?: string[] }
): Promise<Employee> =>
  apiAxios.put(`/users/${id}`, data).then((r) => r.data.data);

export const assignClients = (id: string, clientIds: string[]): Promise<Employee> =>
  apiAxios.put(`/users/${id}/assign-clients`, { clientIds }).then((r) => r.data.data);

export const deactivateEmployee = (id: string): Promise<void> =>
  apiAxios.delete(`/users/${id}`).then(() => undefined);

export const resetPassword = (id: string, newPassword: string): Promise<void> =>
  apiAxios.put(`/users/${id}/reset-password`, { newPassword }).then(() => undefined);

export const setEmployeeRole = (id: string, role: string): Promise<Employee> =>
  apiAxios.put(`/users/${id}/role`, { role }).then((r) => r.data.data);

