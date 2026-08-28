import { backendAxios } from "./axios";
import type { Permission } from "@/lib/permissions";

export interface Role {
  _id: string;
  name: string;
  description: string;
  permissions: Permission[];
  createdAt: string;
  updatedAt: string;
}

export const rolesApi = {
  getAll: async () => {
    const res = await backendAxios.get<{ data: Role[] }>("/roles");
    return res.data.data;
  },

  getById: async (id: string) => {
    const res = await backendAxios.get<{ data: Role }>(`/roles/${id}`);
    return res.data.data;
  },

  create: async (data: { name: string; description?: string; permissions?: Permission[] }) => {
    const res = await backendAxios.post<{ data: Role }>("/roles", data);
    return res.data.data;
  },

  update: async (
    id: string,
    data: { name?: string; description?: string; permissions?: Permission[] }
  ) => {
    const res = await backendAxios.put<{ data: Role }>(`/roles/${id}`, data);
    return res.data.data;
  },

  delete: async (id: string) => {
    await backendAxios.delete(`/roles/${id}`);
  },
};
