import axios from "axios";
import { getSession } from "next-auth/react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";
import { API_BASE_URL } from "@/config/app.config";

const API_BASE = API_BASE_URL;

// ─── Server-side client (for Server Components / Route Handlers) ───────────────

export async function serverFetch<T>(endpoint: string): Promise<T> {
  const session = await getServerSession(authOptions);
  const headers: Record<string, string> = {};
  if (session?.accessToken) {
    headers["Authorization"] = `Bearer ${session.accessToken}`;
  }
  const res = await fetch(`${API_BASE}${endpoint}`, { headers, cache: "no-store" });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message ?? "Request failed");
  return json.data as T;
}

// ─── Client-side axios instance ───────────────────────────────────────────────

export const apiAxios = axios.create({ baseURL: API_BASE });

apiAxios.interceptors.request.use(async (config) => {
  const session = await getSession();
  if (session?.accessToken) {
    config.headers["Authorization"] = `Bearer ${session.accessToken}`;
  }
  return config;
});

apiAxios.interceptors.response.use(
  (res) => res,
  (err) => {
    const message = err.response?.data?.message ?? err.message ?? "Request failed";
    return Promise.reject(new Error(message));
  }
);
