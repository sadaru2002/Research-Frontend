import { Navigate, Outlet, Route, Routes } from "react-router-dom";
import { useAuth } from "./features/auth/AuthProvider";
import { LoginPage } from "./features/auth/LoginPage";
import { ProjectsPage } from "./features/projects/ProjectsPage";
import { ProjectPage } from "./features/projects/ProjectPage";
import { GuidePage } from "./features/projects/GuidePage";
import { Layout } from "./components/Layout";
import { ErrorMessage, Loading } from "./components/Status";

function ProtectedRoute() {
  const { user } = useAuth();
  return user ? <Outlet /> : <Navigate to="/login" replace />;
}
export function App() {
  const { loading, error, restore } = useAuth();
  if (loading) return <Loading />;
  if (error)
    return (
      <div className="connection-error">
        <ErrorMessage message={error} />
        <button className="button primary" onClick={() => void restore()}>
          Reconnect
        </button>
      </div>
    );
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route path="/projects" element={<ProjectsPage />} />
          <Route path="/projects/:projectId" element={<ProjectPage />} />
          <Route path="/guide" element={<GuidePage />} />
        </Route>
      </Route>
      <Route path="/" element={<Navigate to="/projects" replace />} />
      <Route
        path="*"
        element={
          <div className="empty-state">
            <h1>Page not found</h1>
            <a href="/projects">Return to projects</a>
          </div>
        }
      />
    </Routes>
  );
}
