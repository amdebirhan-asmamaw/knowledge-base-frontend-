import axios, { AxiosError, type AxiosInstance } from "axios";
import { API_BASE_URL } from "@/config/app.config";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public data?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export const backendAxios: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
});

export const apiAxios: AxiosInstance = axios.create({
  baseURL: "/api/proxy",
  headers: { "Content-Type": "application/json" },
});

apiAxios.interceptors.response.use(
  (response) => {
    const body = response.data;
    if (body && typeof body === "object" && "data" in body) {
      return { ...response, data: (body as { data: unknown }).data };
    }
    return response;
  },
  (error: AxiosError) => {
    if (error.response) {
      const status = error.response.status;
      const body = error.response.data as { message?: string } | undefined;
      throw new ApiError(
        status,
        body?.message ?? error.message ?? "Request failed",
        error.response.data,
      );
    }
    throw new ApiError(0, error.message ?? "Network error");
  },
);
