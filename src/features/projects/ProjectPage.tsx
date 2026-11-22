import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Check, Copy, KeyRound, Plus, Trash2 } from "lucide-react";
import { api } from "../../lib/api";
import type { ApiKey, ApiKeyCreated } from "../../lib/types";
import { date, ErrorMessage, Loading } from "../../components/Status";
import { SetupCode } from "./SetupCode";

export function ProjectPage() {
  const { projectId } = useParams();
  const id = Number(projectId);
  const valid = Number.isSafeInteger(id) && id > 0;
  if (!valid) return <ErrorMessage message="Invalid project address." />;
  // A different project gets fresh component state, including pending mutations.
  return <ProjectWorkspace key={id} id={id} />;
}

function ProjectWorkspace({ id }: { id: number }) {
  const cache = useQueryClient();
  const project = useQuery({
    queryKey: ["project", id],
    queryFn: () => api.project(id),
  });
  const keys = useQuery({
    queryKey: ["keys", id],
    queryFn: () => api.keys(id),
    enabled: project.isSuccess,
  });
  const [notice, setNotice] = useState("");
  const [createdKey, setCreatedKey] = useState<ApiKeyCreated | null>(null);
  const generate = useMutation({
    // Keep the creation secret in component memory, not the shared mutation cache.
    mutationFn: async () => {
      const key = await api.generateKey(id);
      setCreatedKey(key);
    },
    gcTime: 0,
    onSuccess: async () => {
      await cache.invalidateQueries({ queryKey: ["keys", id] });
      setNotice("API key generated. Copy it now; it cannot be shown again.");
    },
  });
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
        {createdKey?.project_id === id && (
          <NewKeyNotice
            key={createdKey.id}
            value={createdKey.key_value}
            onDismiss={() => setCreatedKey(null)}
          />
        )}
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
              <KeyRow
                key={key.id}
                apiKey={key}
                onRevoked={() => {
                  if (createdKey?.id === key.id) setCreatedKey(null);
                }}
              />
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

function NewKeyNotice({
  value,
  onDismiss,
}: {
  value: string;
  onDismiss: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");
  async function copy() {
    setError("");
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setError(
        "Clipboard access is unavailable. Select the key and copy it manually.",
      );
    }
  }
  return (
    <div className="key-notice" role="region" aria-label="New API key">
      <p>
        Copy this key now. After you dismiss this message or leave this page, it
        cannot be recovered.
      </p>
      <code className="key-value">{value}</code>
      <div className="key-actions">
        <button className="button secondary" onClick={() => void copy()}>
          {copied ? <Check size={18} /> : <Copy size={18} />}
          {copied ? "Key copied" : "Copy new API key"}
        </button>
        <button className="button secondary" onClick={onDismiss}>
          I've saved this key
        </button>
      </div>
      <ErrorMessage message={error} />
    </div>
  );
}

function KeyRow({
  apiKey,
  onRevoked,
}: {
  apiKey: ApiKey;
  onRevoked: () => void;
}) {
  const [confirm, setConfirm] = useState(false);
  const cache = useQueryClient();
  const revoke = useMutation({
    mutationFn: () => api.revokeKey(apiKey.project_id, apiKey.id),
    onSuccess: async () => {
      onRevoked();
      await cache.invalidateQueries({ queryKey: ["keys", apiKey.project_id] });
    },
  });
  return (
    <div className="key-row">
      <div className="key-meta">
        <strong>Project key #{apiKey.id}</strong>
        <span>Created {date(apiKey.created_at)}</span>
      </div>
      <code className="key-value">{apiKey.key_prefix}…</code>
      <div className="key-actions">
        <button
          className="icon-button danger"
          aria-label={`Revoke key ${apiKey.id}`}
          onClick={() => setConfirm(true)}
        >
          <Trash2 size={18} />
        </button>
      </div>
      <ErrorMessage message={revoke.error?.message} />
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
