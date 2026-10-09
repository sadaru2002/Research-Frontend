import { useState, type FormEvent } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { ArrowRight, Check, Eye, EyeOff, Network } from "lucide-react";
import { useAuth } from "./AuthProvider";
import { api } from "../../lib/api";
import { Brand } from "../../components/Brand";
import { ErrorMessage } from "../../components/Status";

export function LoginPage() {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  if (user) return <Navigate to="/projects" replace />;
  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      setUser(await api.authenticate(mode, { email: email.trim(), password }));
      navigate("/projects", { replace: true });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="auth-page">
      <section className="auth-story">
        <Brand />
        <div className="auth-story-content">
          <span className="eyebrow">THE RESEARCH DEVELOPER PLATFORM</span>
          <h1>
            Build workflows.
            <br />
            Discover tools.
            <br />
            <em>Keep evolving.</em>
          </h1>
          <p>
            Your workspace for a new generation of adaptive, multi-agent
            applications.
          </p>
          <div className="network-art" aria-hidden="true">
            <Network size={120} strokeWidth={0.8} />
            <span className="node-tag">discover</span>
            <span className="node-tag">orchestrate</span>
            <span className="node-tag">recover</span>
          </div>
          <div className="auth-benefits">
            {[
              "Projects that keep your tools organized",
              "API keys scoped to your applications",
              "One library for adaptive workflows",
            ].map((text) => (
              <div key={text}>
                <Check size={16} />
                {text}
              </div>
            ))}
          </div>
        </div>
        <small>Designed for research. Built for what comes next.</small>
      </section>
      <section className="auth-form-section">
        <div className="auth-form-wrap">
          <span className="small-tag">DEVELOPER CONSOLE</span>
          <h2>
            {mode === "login" ? "Welcome back." : "Start your workspace."}
          </h2>
          <p>
            {mode === "login"
              ? "Sign in to manage your projects and API keys."
              : "Create an account to connect your first project."}
          </p>
          <form onSubmit={submit}>
            <label htmlFor="email">Email address</label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              maxLength={254}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
            <label htmlFor="password">Password</label>
            <div className="password-input">
              <input
                id="password"
                type={show ? "text" : "password"}
                autoComplete={
                  mode === "login" ? "current-password" : "new-password"
                }
                minLength={12}
                maxLength={128}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
              />
              <button
                type="button"
                className="icon-button"
                aria-label={show ? "Hide password" : "Show password"}
                onClick={() => setShow(!show)}
              >
                {show ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {mode === "register" && (
              <small className="field-hint">Use at least 12 characters.</small>
            )}
            <ErrorMessage message={error} />
            <button className="button primary auth-submit" disabled={busy}>
              {busy
                ? "Please wait…"
                : mode === "login"
                  ? "Sign in"
                  : "Create account"}
              <ArrowRight size={18} />
            </button>
          </form>
          <div className="auth-switch">
            {mode === "login" ? "New to Research?" : "Already have an account?"}{" "}
            <button
              disabled={busy}
              onClick={() => {
                setMode(mode === "login" ? "register" : "login");
                setError("");
                setPassword("");
              }}
            >
              {mode === "login" ? "Create an account" : "Sign in"}
            </button>
          </div>
          <div className="auth-footnote">
            Your projects. Your tools. Your next idea.
          </div>
        </div>
      </section>
    </div>
  );
}
