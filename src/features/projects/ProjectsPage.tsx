import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowRight,
  ArrowUpRight,
  Folder,
  Plus,
  Search,
  Terminal,
} from "lucide-react";
import { api } from "../../lib/api";
import { date, ErrorMessage, Loading } from "../../components/Status";
import { Modal } from "../../components/Modal";

export function ProjectsPage() {
  const query = useQuery({ queryKey: ["projects"], queryFn: api.projects });
  const [search, setSearch] = useState("");
  const [creating, setCreating] = useState(false);
  const projects = (query.data || []).filter((project) =>
    project.name.toLowerCase().includes(search.toLowerCase()),
  );
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">YOUR WORKSPACE</span>
          <h1>Projects</h1>
          <p>A home for your tools, workflows, and next big idea.</p>
        </div>
        <button className="button primary" onClick={() => setCreating(true)}>
          <Plus size={18} />
          New project
        </button>
      </div>
      <section className="welcome-banner">
        <div>
          <span className="small-tag">FROM IDEA TO EXECUTION</span>
          <h2>Give your agents a place to grow.</h2>
          <p>
            Create a project, generate an API key, and connect the Research
            library.
          </p>
          <Link to="/guide">
            Explore the integration guide <ArrowRight size={16} />
          </Link>
        </div>
        <div className="banner-code" aria-hidden="true">
          <span>
            <i /> <i /> <i />
          </span>
          <code>
            <b>from</b> research <b>import</b> Research
            <br />
            <br />
            researcher = Research()
            <br />
            researcher.<em>configure</em>(<br />
            &nbsp; projectApiKey=<strong>"rk_…"</strong>
            <br />)
          </code>
        </div>
      </section>
      <div className="section-toolbar">
        <h2>
          All projects <span className="count">{query.data?.length || 0}</span>
        </h2>
        <div className="search-input">
          <Search size={17} />
          <input
            aria-label="Search projects"
            placeholder="Search projects…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>
      {query.isPending ? (
        <Loading />
      ) : query.isError ? (
        <>
          <ErrorMessage message={query.error.message} />
          <button
            className="button secondary"
            onClick={() => void query.refetch()}
          >
            Try again
          </button>
        </>
      ) : projects.length ? (
        <div className="project-grid">
          {projects.map((project) => (
            <Link
              key={project.id}
              to={`/projects/${project.id}`}
              className="project-card"
            >
              <div className="project-card-top">
                <span className="project-icon">
                  <Folder size={22} />
                </span>
                <ArrowUpRight size={18} />
              </div>
              <h3>{project.name}</h3>
              <p>Project #{project.id}</p>
              <div className="project-card-footer">
                <span>Created {date(project.created_at)}</span>
                <span>
                  Open project <ArrowRight size={14} />
                </span>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <span className="project-icon">
            <Folder size={28} />
          </span>
          <h3>
            {search ? "No matching projects" : "Your first project starts here"}
          </h3>
          <p>
            {search
              ? "Try a different project name."
              : "Keep your API keys and discovered tools together in a dedicated workspace."}
          </p>
          {!search && (
            <button
              className="button primary"
              onClick={() => setCreating(true)}
            >
              <Plus size={17} />
              Create a project
            </button>
          )}
        </div>
      )}
      <div className="help-strip">
        <Terminal size={20} />
        <div>
          <strong>Already building with Python?</strong>
          <p>
            Connect your project key to the Research library in a few lines.
          </p>
        </div>
        <Link to="/guide">
          View setup guide <ArrowUpRight size={16} />
        </Link>
      </div>
      {creating && <CreateProject onClose={() => setCreating(false)} />}
    </>
  );
}

function CreateProject({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState("");
  const cache = useQueryClient();
  const navigate = useNavigate();
  const mutation = useMutation({
    mutationFn: api.createProject,
    onSuccess: async (project) => {
      await cache.invalidateQueries({ queryKey: ["projects"] });
      onClose();
      navigate(`/projects/${project.id}`);
    },
  });
  function submit(event: FormEvent) {
    event.preventDefault();
    if (name.trim()) mutation.mutate(name.trim());
  }
  return (
    <Modal titleId="create-title" busy={mutation.isPending} onClose={onClose}>
      <span className="project-icon">
        <Folder size={23} />
      </span>
      <h2 id="create-title">Create a project</h2>
      <p>Choose a name for your application or research workspace.</p>
      <form onSubmit={submit}>
        <label htmlFor="project-name">Project name</label>
        <input
          id="project-name"
          autoFocus
          required
          maxLength={100}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Adaptive research agent"
        />
        <small className="field-hint">
          You can generate a project API key after creating it.
        </small>
        <ErrorMessage message={mutation.error?.message} />
        <div className="modal-actions">
          <button
            type="button"
            className="button secondary"
            disabled={mutation.isPending}
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="button primary"
            disabled={!name.trim() || mutation.isPending}
          >
            {mutation.isPending ? "Creating…" : "Create project"}
            <ArrowRight size={16} />
          </button>
        </div>
      </form>
    </Modal>
  );
}
