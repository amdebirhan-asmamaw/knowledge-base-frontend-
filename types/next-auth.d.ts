import type { DefaultSession } from "next-auth";

export interface SessionRole {
  _id?: string;
  name: string;
  description?: string;
  permissions: string[];
}

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: SessionRole | null;
      isDepartmentHead: boolean;
    } & DefaultSession["user"];
    accessToken?: string;
    error?: "RefreshAccessTokenError";
  }

  interface User {
    id: string;
    name?: string | null;
    email?: string | null;
    role: SessionRole | null;
    isDepartmentHead: boolean;
    accessToken: string;
    refreshToken: string;
    accessTokenExpiresAt: number;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    name: string;
    email: string;
    role: SessionRole | null;
    isDepartmentHead: boolean;
    accessToken: string;
    refreshToken: string;
    accessTokenExpiresAt: number;
    error?: "RefreshAccessTokenError";
  }
}
