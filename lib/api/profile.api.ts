import { apiAxios } from "./client";

export interface MyProfileRole {
  _id?: string;
  name: string;
  description?: string;
  permissions: string[];
}

export interface MyProfile {
  id: string;
  name: string;
  email: string;
  role: MyProfileRole | null;
  position: string;
  department: { _id: string; name: string } | null;
  assignedClientsCount: number;
  createdAt: string;
}

export const getMyProfile = (): Promise<MyProfile> =>
  apiAxios.get("/auth/me").then((r) => r.data.data);

export const updateMyProfile = (data: {
  name?: string;
  position?: string;
}): Promise<MyProfile> =>
  apiAxios.put("/auth/me", data).then((r) => r.data.data);

export const changeMyPassword = (data: {
  currentPassword: string;
  newPassword: string;
}): Promise<void> =>
  apiAxios.put("/auth/me/password", data).then(() => undefined);
