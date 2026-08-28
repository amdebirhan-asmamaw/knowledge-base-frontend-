import type { NextAuthOptions, User } from "next-auth";
import type { JWT } from "next-auth/jwt";
import Credentials from "next-auth/providers/credentials";
import { AxiosError } from "axios";
import { backendAxios } from "@/lib/api/axios";

interface BackendLoginResponse {
  data: {
    user: {
      id: string;
      name: string;
      email: string;
      role: string;
      isDepartmentHead: boolean;
      permissions: string[];
    };
    tokens: {
      accessToken: string;
      refreshToken: string;
      accessTokenExpiresIn?: number;
      accessTokenExpiresAt?: number;
    };
  };
}

interface BackendRefreshResponse {
  data: {
    accessToken: string;
    refreshToken: string;
    accessTokenExpiresIn?: number;
    accessTokenExpiresAt?: number;
  };
}

interface BackendMeResponse {
  data: {
    role: string;
    isDepartmentHead: boolean;
    permissions: string[];
    name: string;
    email: string;
  };
}

function resolveExpiresAt(tokens: {
  accessTokenExpiresAt?: number;
  accessTokenExpiresIn?: number;
}): number {
  if (typeof tokens.accessTokenExpiresAt === "number") {
    return tokens.accessTokenExpiresAt;
  }
  if (typeof tokens.accessTokenExpiresIn === "number") {
    return Date.now() + tokens.accessTokenExpiresIn * 1000;
  }
  return Date.now() + 15 * 60 * 1000;
}

async function refreshAccessToken(refreshToken: string) {
  const res = await backendAxios.post<BackendRefreshResponse>(
    "/auth/refresh-token",
    { refreshToken },
  );
  const tokens = res.data.data;
  return {
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    accessTokenExpiresAt: resolveExpiresAt(tokens),
  };
}

/** Call /auth/me with a valid access token to get fresh user data from DB. */
async function fetchFreshUserData(accessToken: string) {
  try {
    const res = await backendAxios.get<BackendMeResponse>("/auth/me", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return res.data.data;
  } catch {
    return null; // silently fail — stale data is better than crashing
  }
}

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  pages: { signIn: "/auth/login" },
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        try {
          const res = await backendAxios.post<BackendLoginResponse>(
            "/auth/login",
            { email: credentials.email, password: credentials.password },
          );
          const { user, tokens } = res.data.data;

          const authUser: User = {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            isDepartmentHead: user.isDepartmentHead ?? false,
            permissions: user.permissions ?? [],
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
            accessTokenExpiresAt: resolveExpiresAt(tokens),
          };
          return authUser;
        } catch (err) {
          if (err instanceof AxiosError) {
            const message =
              err.response?.data?.message ??
              err.response?.data?.error ??
              "Invalid email or password.";
            throw new Error(message);
          }
          throw err;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      const t = token as JWT;

      if (user) {
        t.id = user.id;
        t.name = user.name ?? "";
        t.email = user.email ?? "";
        t.role = user.role;
        t.isDepartmentHead = user.isDepartmentHead ?? false;
        t.permissions = user.permissions ?? [];
        t.accessToken = user.accessToken;
        t.refreshToken = user.refreshToken;
        t.accessTokenExpiresAt = user.accessTokenExpiresAt;
        return t;
      }

      if (
        typeof t.accessTokenExpiresAt === "number" &&
        Date.now() < t.accessTokenExpiresAt - 60_000
      ) {
        return t;
      }

      try {
        const refreshed = await refreshAccessToken(t.refreshToken);
        t.accessToken = refreshed.accessToken;
        t.refreshToken = refreshed.refreshToken;
        t.accessTokenExpiresAt = refreshed.accessTokenExpiresAt;
        t.error = undefined;

        // Sync fresh user data (role, permissions) from DB
        const fresh = await fetchFreshUserData(refreshed.accessToken);
        if (fresh) {
          t.role = fresh.role;
          t.isDepartmentHead = fresh.isDepartmentHead ?? t.isDepartmentHead;
          t.permissions = fresh.permissions ?? [];
        }

        return t;
      } catch {
        t.error = "RefreshAccessTokenError";
        return t;
      }
    },
    async session({ session, token }) {
      const t = token as JWT;
      if (session.user) {
        session.user.id = t.id;
        session.user.name = t.name;
        session.user.email = t.email;
        session.user.role = t.role;
        session.user.isDepartmentHead = t.isDepartmentHead ?? false;
        session.user.permissions = t.permissions ?? [];
      }
      session.accessToken = t.accessToken;
      session.error = t.error;
      return session;
    },
  },
};
