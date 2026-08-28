import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
      isDepartmentHead: boolean;
      permissions: string[];
    } & DefaultSession["user"];
    accessToken?: string;
    error?: "RefreshAccessTokenError";
  }

  interface User {
    id: string;
    name?: string | null;
    email?: string | null;
    role: string;
    isDepartmentHead: boolean;
    permissions: string[];
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
    role: string;
    isDepartmentHead: boolean;
    permissions: string[];
    accessToken: string;
    refreshToken: string;
    accessTokenExpiresAt: number;
    error?: "RefreshAccessTokenError";
  }
}
