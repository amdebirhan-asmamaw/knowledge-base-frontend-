import { apiAxios } from "./client";
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
  getAll: async (): Promise<Role[]> => {
    const res = await apiAxios.get<{ data: Role[] }>("/roles");
    return res.data.data;
  },

  getById: async (id: string): Promise<Role> => {
    const res = await apiAxios.get<{ data: Role }>(`/roles/${id}`);
    return res.data.data;
  },

  create: async (data: {
    name: string;
    description?: string;
    permissions?: Permission[];
  }): Promise<Role> => {
    const res = await apiAxios.post<{ data: Role }>("/roles", data);
    return res.data.data;
  },

  update: async (
    id: string,
    data: { name?: string; description?: string; permissions?: Permission[] }
  ): Promise<Role> => {
    const res = await apiAxios.put<{ data: Role }>(`/roles/${id}`, data);
    return res.data.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiAxios.delete(`/roles/${id}`);
  },
};
