import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { SetupCode } from "./SetupCode";

export function GuidePage() {
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">BUILD WITH RESEARCH</span>
          <h1>Integration guide</h1>
          <p>From your first project to a connected application.</p>
        </div>
      </div>
      <div className="guide-steps">
        <section>
          <span>01</span>
          <h2>Create a project</h2>
          <p>
            Open Projects and create a workspace for your application. Each
            project keeps its tool database and keys separate.
          </p>
          <Link to="/projects">
            Go to projects <ArrowRight size={16} />
          </Link>
        </section>
        <section>
          <span>02</span>
          <h2>Generate a key</h2>
          <p>
            Open your project, generate an API key, and copy it into your server
            environment as PROJECT_API_KEY.
          </p>
        </section>
        <section>
          <span>03</span>
          <h2>Install the library</h2>
          <p>
            From the research folder, install the cloned developer package into
            your Python environment.
          </p>
          <code>pip install -e ./Reserch-Developer-Package</code>
        </section>
      </div>
      <SetupCode />
      <section className="panel guide-environment">
        <h2>Environment configuration</h2>
        <p>
          The project key authenticates your tool database requests. An
          OpenRouter key authenticates model requests; you supply it separately.
        </p>
        <pre>
          <code>{`PROJECT_API_KEY=your-generated-project-key
OPENROUTER_API_KEY=your-openrouter-key
TOOL_DB_BASE_URL=http://127.0.0.1:8000/api/v1`}</code>
        </pre>
        <p>
          Keep these values in your backend environment. Your frontend only
          needs the API base URL.
        </p>
      </section>
    </>
  );
}
