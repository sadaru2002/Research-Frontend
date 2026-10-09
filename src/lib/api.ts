import type { ApiKey, Credentials, Project, User } from "./types";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

const base = (import.meta.env.VITE_API_BASE_URL || "/api/v1").replace(
  /\/$/,
  "",
);

export async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${base}${path}`, {
      ...options,
      credentials: "include",
      headers: { "Content-Type": "application/json", ...options.headers },
    });
  } catch {
    throw new ApiError(
      0,
      "Cannot reach the server. Check that the backend is running and try again.",
    );
  }
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    const detail = body?.detail;
    const message =
      typeof detail === "string"
        ? detail
        : Array.isArray(detail)
          ? detail.map((item: { msg: string }) => item.msg).join(". ")
          : "The request failed. Please try again.";
    throw new ApiError(response.status, message);
  }
  return response.status === 204 ? (undefined as T) : response.json();
}

export const api = {
  me: () => request<User>("/auth/me"),
  authenticate: (mode: "login" | "register", data: Credentials) =>
    request<User>(`/auth/${mode}`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  logout: () => request<void>("/auth/logout", { method: "POST" }),
  projects: () => request<Project[]>("/projects"),
  createProject: (name: string) =>
    request<Project>("/projects", {
      method: "POST",
      body: JSON.stringify({ name }),
    }),
  project: (id: number) => request<Project>(`/projects/${id}`),
  keys: (id: number) => request<ApiKey[]>(`/projects/${id}/api-keys`),
  generateKey: (id: number) =>
    request<ApiKey>(`/projects/${id}/api-keys`, { method: "POST" }),
  revokeKey: (projectId: number, keyId: number) =>
    request<void>(`/projects/${projectId}/api-keys/${keyId}`, {
      method: "DELETE",
    }),
};
