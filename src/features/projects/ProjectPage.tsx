import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Check,
  Copy,
  Eye,
  EyeOff,
  KeyRound,
  Plus,
  Trash2,
} from "lucide-react";
import { api } from "../../lib/api";
import type { ApiKey } from "../../lib/types";
import { date, ErrorMessage, Loading } from "../../components/Status";
import { SetupCode } from "./SetupCode";

export function ProjectPage() {
  const { projectId } = useParams();
  const id = Number(projectId);
  const valid = Number.isSafeInteger(id) && id > 0;
  const cache = useQueryClient();
  const project = useQuery({
    queryKey: ["project", id],
    queryFn: () => api.project(id),
    enabled: valid,
  });
  const keys = useQuery({
    queryKey: ["keys", id],
    queryFn: () => api.keys(id),
    enabled: valid && project.isSuccess,
  });
  const [notice, setNotice] = useState("");
  const generate = useMutation({
    mutationFn: () => api.generateKey(id),
    onSuccess: async () => {
      await cache.invalidateQueries({ queryKey: ["keys", id] });
      setNotice("API key generated. Reveal or copy it below.");
    },
  });
  if (!valid) return <ErrorMessage message="Invalid project address." />;
  if (project.isPending) return <Loading />;
  if (project.isError)
    return (
      <>
        <Link className="back-link" to="/projects">
          <ArrowLeft size={16} />
          All projects
        </Link>
        <ErrorMessage message={project.error.message} />
        <button
          className="button secondary"
          onClick={() => void project.refetch()}
        >
          Try again
        </button>
      </>
    );
  return (
    <>
      <Link className="back-link" to="/projects">
        <ArrowLeft size={16} />
        All projects
      </Link>
      <div className="page-heading">
        <div>
          <span className="eyebrow">PROJECT WORKSPACE</span>
          <h1>{project.data.name}</h1>
          <p>
            Project #{id} <span className="dot-divider">·</span> Created{" "}
            {date(project.data.created_at)}
          </p>
        </div>
        <span className="project-type">Personal project</span>
      </div>
      <section className="panel">
        <div className="panel-heading">
          <div>
            <h2>
              <KeyRound size={20} />
              API keys
            </h2>
            <p>Connect your application to this project’s tool database.</p>
          </div>
          <button
            className="button primary"
            disabled={generate.isPending || !keys.isSuccess}
            onClick={() => {
              setNotice("");
              generate.mutate();
            }}
          >
            <Plus size={17} />
            {generate.isPending ? "Generating…" : "Generate API key"}
          </button>
        </div>
        <ErrorMessage message={generate.error?.message} />
        {notice && (
          <div className="success" role="status">
            <Check size={17} />
            {notice}
          </div>
        )}
        <div className="key-notice">
          Treat API keys like passwords. Use them in server-side code and
          environment variables.
        </div>
        {keys.isPending ? (
          <Loading label="Loading API keys…" />
        ) : keys.isError ? (
          <>
            <ErrorMessage message={keys.error.message} />
            <button
              className="button secondary"
              onClick={() => void keys.refetch()}
            >
              Try again
            </button>
          </>
        ) : !keys.data.length ? (
          <div className="empty-state compact">
            <KeyRound size={30} />
            <h3>No API keys yet</h3>
            <p>Generate a key to connect your first workflow.</p>
          </div>
        ) : (
          <div className="key-list">
            {keys.data.map((key) => (
              <KeyRow key={key.id} apiKey={key} />
            ))}
          </div>
        )}
      </section>
      <SetupCode />
      <div className="detail-note">
        <KeyRound size={18} />
        <p>
          Each key grants access to this project only. Revoking a key
          immediately stops new requests using it.
        </p>
      </div>
    </>
  );
}

function KeyRow({ apiKey }: { apiKey: ApiKey }) {
  const [visible, setVisible] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");
  const [confirm, setConfirm] = useState(false);
  const cache = useQueryClient();
  const revoke = useMutation({
    mutationFn: () => api.revokeKey(apiKey.project_id, apiKey.id),
    onSuccess: () =>
      cache.invalidateQueries({ queryKey: ["keys", apiKey.project_id] }),
  });
  async function copy() {
    setError("");
    try {
      await navigator.clipboard.writeText(apiKey.key_value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setError(
        "Clipboard access is unavailable. Reveal the key and copy it manually.",
      );
    }
  }
  return (
    <div className="key-row">
      <div className="key-meta">
        <strong>Project key #{apiKey.id}</strong>
        <span>Created {date(apiKey.created_at)}</span>
      </div>
      <code className="key-value">
        {visible
          ? apiKey.key_value
          : `${apiKey.key_value.slice(0, 7)}${"•".repeat(24)}`}
      </code>
      <div className="key-actions">
        <button
          className="icon-button"
          aria-label={`${visible ? "Hide" : "Reveal"} key ${apiKey.id}`}
          aria-pressed={visible}
          onClick={() => setVisible(!visible)}
        >
          {visible ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
        <button
          className="icon-button"
          aria-label={`Copy key ${apiKey.id}`}
          onClick={() => void copy()}
        >
          {copied ? <Check size={18} /> : <Copy size={18} />}
        </button>
        <button
          className="icon-button danger"
          aria-label={`Revoke key ${apiKey.id}`}
          onClick={() => setConfirm(true)}
        >
          <Trash2 size={18} />
        </button>
      </div>
      {copied && <small role="status">Key copied</small>}
      <ErrorMessage message={error || revoke.error?.message} />
      {confirm && (
        <div className="revoke-confirm">
          <span>Revoke this key? Applications using it will lose access.</span>
          <button
            className="button secondary"
            disabled={revoke.isPending}
            onClick={() => setConfirm(false)}
          >
            Cancel
          </button>
          <button
            className="button destructive"
            disabled={revoke.isPending}
            onClick={() => revoke.mutate()}
          >
            {revoke.isPending ? "Revoking…" : "Revoke key"}
          </button>
        </div>
      )}
    </div>
  );
}
