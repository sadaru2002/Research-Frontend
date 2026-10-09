# Research developer portal

React and TypeScript frontend for the existing FastAPI support backend. Includes registration/login, session restoration, project creation/search, project-scoped API key generation, masked key viewing/copying/revocation, and a Python integration guide.

## Start locally

Use two PowerShell terminals from `C:\Users\TUF\Desktop\research`.

Backend:

```powershell
cd Reserch-Support-Backend
uv sync --group dev
# If .env does not already exist, copy .env.example and configure DATABASE_URL.
uv run uvicorn app.main:app --host 127.0.0.1 --port 8000
```

Frontend:

```powershell
cd Research-Frontend
npm ci
npm run dev
```

Open http://127.0.0.1:5173 and create an account. Create a project, open it and generate a key. The Vite development proxy sends `/api` to `http://127.0.0.1:8000`; cookies remain on the browser origin. Do not mix localhost and 127.0.0.1 between visits if you want to reuse the same browser session.

For a different backend development port, copy `.env.example` to `.env` and change `API_PROXY_TARGET`. Keep `VITE_API_BASE_URL=/api/v1`. Vite exposes every `VITE_` variable to the browser, so never put secrets there.

## Structure

```text
src/
  components/        Shared layout, modal, feedback and branding
  features/auth/     Authentication context and login/register page
  features/projects/ Dashboard, project detail, keys and setup guide
  lib/               Typed HTTP client, contracts and query cache
  test/              Behavior tests and browser API setup
```

React Router controls public and protected routes. TanStack Query owns remote state and invalidation. The shared HTTP client sends `credentials: include`, normalizes API errors and never stores credentials in browser storage. Authentication uses an HttpOnly session cookie; API keys remain in memory and are removed from the query cache on logout or session expiration.

The project creation dialog uses the native browser modal dialog for keyboard focus containment and Escape dismissal. Mutation buttons prevent repeated submissions. Key revocation requires an explicit confirmation inside the row.

## Verify

```powershell
npm test
npm run build
```

Frontend integration tests mock HTTP at the fetch boundary and cover login failures/success, project creation, key generation/reveal/revocation, session restoration/logout, session expiry and unavailable servers. They do not replace live backend verification.

Backend tests run with `uv run pytest -q` from the backend directory. They use production routes with an isolated SQLite database and never touch the configured Neon database.

## Deploy

Build with `npm run build` and serve `dist`. Configure the host to fall back to `index.html` for frontend routes and reverse-proxy `/api` to FastAPI on the same HTTPS origin. Set backend `SESSION_COOKIE_SECURE=true`, include the exact public origin in `ALLOWED_ORIGINS`, and leave `ENABLE_CLIENT_TEST_ROUTES=false` on public deployments. The Vite dev proxy is not part of production output.

Before wider public use, add login/register throttling, email verification/password reset, explicit database migrations and recoverable encryption for stored API keys. The existing schema stores keys as plaintext because owners need to view them again; protect database access and backups.

Implementation plan: [FRONTEND_PLAN.md](../FRONTEND_PLAN.md). Build setup follows [Vite documentation](https://vite.dev/guide/).
