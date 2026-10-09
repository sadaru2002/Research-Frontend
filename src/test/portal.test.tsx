import { QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { App } from "../App";
import { AuthProvider } from "../features/auth/AuthProvider";
import { createQueryClient } from "../lib/query-client";

const account = { id: 1, email: "researcher@example.com" };
const project = {
  id: 7,
  name: "Adaptive workflow",
  created_at: "2026-10-09T00:00:00Z",
};
const apiKey = {
  id: 11,
  project_id: 7,
  key_value: "rk_test-secret-for-project-seven",
  created_at: project.created_at,
};

function response(body: unknown, status = 200) {
  return new Response(status === 204 ? null : JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function mount(path = "/projects") {
  const client = createQueryClient();
  render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[path]}>
        <AuthProvider>
          <App />
        </AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
  return client;
}

afterEach(() => vi.unstubAllGlobals());

describe("developer portal integration", () => {
  it("redirects anonymous users and handles failed then successful login", async () => {
    let attempt = 0;
    const fetchMock = vi.fn(async (url: string, options?: RequestInit) => {
      if (url.endsWith("/auth/me")) return response({ detail: "Sign in" }, 401);
      if (url.endsWith("/auth/login")) {
        expect(options?.credentials).toBe("include");
        expect(JSON.parse(options?.body as string)).toEqual({
          email: account.email,
          password: "a-long-enough-password",
        });
        return ++attempt === 1
          ? response({ detail: "Email or password is incorrect" }, 401)
          : response(account);
      }
      if (url.endsWith("/projects")) return response([project]);
      throw new Error(`Unexpected request ${url}`);
    });
    vi.stubGlobal("fetch", fetchMock);
    mount();
    const user = userEvent.setup();
    await screen.findByRole("heading", { name: "Welcome back." });
    await user.type(screen.getByLabelText("Email address"), account.email);
    await user.type(
      screen.getByLabelText("Password"),
      "a-long-enough-password",
    );
    await user.click(screen.getByRole("button", { name: "Sign in" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Email or password is incorrect",
    );
    await user.click(screen.getByRole("button", { name: "Sign in" }));
    expect(
      await screen.findByRole("heading", { name: project.name }),
    ).toBeVisible();
    expect(window.localStorage.length).toBe(0);
  });

  it("creates a project, generates and reveals a key, then revokes it", async () => {
    let created = false;
    let generated = false;
    let revoked = false;
    const fetchMock = vi.fn(async (url: string, options?: RequestInit) => {
      const method = options?.method || "GET";
      if (url.endsWith("/auth/me")) return response(account);
      if (url.endsWith("/projects") && method === "GET")
        return response(created ? [project] : []);
      if (url.endsWith("/projects") && method === "POST") {
        expect(JSON.parse(options?.body as string)).toEqual({
          name: project.name,
        });
        created = true;
        return response(project, 201);
      }
      if (url.endsWith("/projects/7")) return response(project);
      if (url.endsWith("/api-keys") && method === "POST") {
        generated = true;
        return response(apiKey, 201);
      }
      if (url.endsWith("/api-keys") && method === "GET")
        return response(generated && !revoked ? [apiKey] : []);
      if (url.endsWith("/api-keys/11") && method === "DELETE") {
        revoked = true;
        return response(null, 204);
      }
      throw new Error(`Unexpected request ${method} ${url}`);
    });
    vi.stubGlobal("fetch", fetchMock);
    mount();
    const user = userEvent.setup();
    await user.click(
      await screen.findByRole("button", { name: "New project" }),
    );
    expect(screen.getByRole("dialog")).toBeVisible();
    await user.type(
      screen.getByLabelText("Project name"),
      `  ${project.name}  `,
    );
    await user.click(screen.getByRole("button", { name: "Create project" }));
    await screen.findByRole("heading", { name: project.name });
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Generate API key" }),
      ).toBeEnabled(),
    );
    await user.click(screen.getByRole("button", { name: "Generate API key" }));
    await screen.findByText("Project key #11");
    expect(screen.queryByText(apiKey.key_value)).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Reveal key 11" }));
    expect(screen.getByText(apiKey.key_value)).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Hide key 11" }));
    await user.click(screen.getByRole("button", { name: "Revoke key 11" }));
    await user.click(screen.getByRole("button", { name: "Revoke key" }));
    expect(
      await screen.findByRole("heading", { name: "No API keys yet" }),
    ).toBeVisible();
    expect(revoked).toBe(true);
  });

  it("restores sessions on page load and clears cached secrets when signing out", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) => {
        if (url.endsWith("/auth/me")) return response(account);
        if (url.endsWith("/auth/logout")) return response(null, 204);
        if (url.endsWith("/projects/7")) return response(project);
        if (url.endsWith("/api-keys")) return response([apiKey]);
        throw new Error(`Unexpected request ${url}`);
      }),
    );
    const client = mount("/projects/7");
    const user = userEvent.setup();
    await screen.findByText("Project key #11");
    await user.click(screen.getByRole("button", { name: "Reveal key 11" }));
    await user.click(screen.getByRole("button", { name: "Sign out" }));
    expect(
      await screen.findByRole("heading", { name: "Welcome back." }),
    ).toBeVisible();
    expect(screen.queryByText(apiKey.key_value)).not.toBeInTheDocument();
    expect(client.getQueryCache().getAll()).toHaveLength(0);
  });

  it("returns to login when a protected request reports an expired session", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) =>
        url.endsWith("/auth/me")
          ? response(account)
          : response({ detail: "Your session has expired." }, 401),
      ),
    );
    const client = mount();
    expect(
      await screen.findByRole("heading", { name: "Welcome back." }),
    ).toBeVisible();
    expect(client.getQueryCache().getAll()).toHaveLength(0);
  });

  it("shows connection failures and allows recovery", async () => {
    let connected = false;
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        if (!connected) throw new TypeError("Network error");
        return response({ detail: "Sign in" }, 401);
      }),
    );
    mount();
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Cannot reach the server",
    );
    connected = true;
    fireEvent.click(screen.getByRole("button", { name: "Reconnect" }));
    expect(
      await screen.findByRole("heading", { name: "Welcome back." }),
    ).toBeVisible();
  });
});
