import { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import {
  ArrowUpRight,
  FolderKanban,
  LogOut,
  Terminal,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { Brand } from "./Brand";
import { ErrorMessage } from "./Status";
import { useAuth } from "../features/auth/AuthProvider";

export function Layout() {
  const { user, logout } = useAuth();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);
  async function signOut() {
    setBusy(true);
    setError("");
    try {
      await logout();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="app-shell">
      <aside className={`sidebar ${open ? "is-open" : ""}`}>
        <Brand />
        <div className="workspace-label">DEVELOPER WORKSPACE</div>
        <nav aria-label="Main navigation">
          <NavLink to="/projects" onClick={() => setOpen(false)}>
            <FolderKanban size={19} />
            Projects
          </NavLink>
          <NavLink to="/guide" onClick={() => setOpen(false)}>
            <Terminal size={19} />
            Integration guide
          </NavLink>
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-note">
            <span className="small-tag">BUILT FOR DEVELOPERS</span>
            <h3>Let your agents evolve.</h3>
            <p>
              Connect the library to your project and start building adaptive
              workflows.
            </p>
            <NavLink to="/guide">
              Get started <ArrowUpRight size={16} />
            </NavLink>
          </div>
          <div className="account">
            <div className="avatar">{user?.email[0].toUpperCase()}</div>
            <div>
              <strong>Personal workspace</strong>
              <span title={user?.email}>{user?.email}</span>
            </div>
            <button
              className="icon-button"
              aria-label="Sign out"
              disabled={busy}
              onClick={() => void signOut()}
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <div>
            <button
              className="mobile-toggle icon-button"
              aria-label="Toggle navigation"
              onClick={() => setOpen(!open)}
            >
              {open ? <PanelLeftClose /> : <PanelLeftOpen />}
            </button>
            <span>Workspace</span>
            <span className="crumb">/</span>
            <strong>Developer console</strong>
          </div>
          <span className="console-badge">
            <span /> Research platform
          </span>
        </header>
        <main>
          <ErrorMessage message={error} />
          <Outlet />
        </main>
        <footer>
          Research developer platform
          <span>Self-evolving workflows. One project at a time.</span>
        </footer>
      </div>
    </div>
  );
}
