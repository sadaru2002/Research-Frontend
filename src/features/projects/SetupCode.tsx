import { Terminal } from "lucide-react";

export function SetupCode() {
  return (
    <section className="panel setup-panel">
      <div className="panel-heading">
        <div>
          <h2>
            <Terminal size={20} />
            Connect the Research library
          </h2>
          <p>Set your credentials in your Python application’s environment.</p>
        </div>
        <span className="language-tag">PYTHON</span>
      </div>
      <pre>
        <code>{`import os
from research import Research

researcher = Research()
researcher.configure(
    openRouterAPIKey=os.environ["OPENROUTER_API_KEY"],
    projectApiKey=os.environ["PROJECT_API_KEY"],
    toolDbBaseUrl=os.environ["TOOL_DB_BASE_URL"]
)`}</code>
      </pre>
      <p className="code-caption">
        For local development, set TOOL_DB_BASE_URL to
        http://127.0.0.1:8000/api/v1.
      </p>
    </section>
  );
}
