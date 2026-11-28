import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { pasteSas, retryAssets } from "../demos/police/api";
import { deriveAssetState } from "../demos/police/asset-state";
import CandidateList, { type PassSelection } from "../demos/police/CandidateList";
import { useAssetStatus } from "../demos/police/use-asset-status";
import "../demos/police/style.css";

function formatBytes(bytes: number) {
  return bytes >= 1_000_000_000 ? `${(bytes / 1_000_000_000).toFixed(2)} GB` : `${(bytes / 1_000_000).toFixed(1)} MB`;
}

function RunLocally() {
  return (
    <>
      <h2>Run locally</h2>
      <ol>
        <li>
          Copy the local settings template with <code>cp .env.example .env.local</code>.
        </li>
        <li>
          Set the same random token in <code>SSD_SESSION_TOKEN</code> and <code>VITE_SSD_SESSION_TOKEN</code>.
        </li>
        <li>
          Set <code>DEMO_ASSETS_READ_SAS_URL</code> to your read SAS URL or paste it here when prompted.
        </li>
        <li>
          Start the backend with <code>python backend/backend_runner.py</code>.
        </li>
        <li>
          Start Vite with <code>npm run dev</code>, then open <code>/#/demo-06</code> on the local Vite server.
        </li>
      </ol>
    </>
  );
}

function CasePlaceholder({ passId, onBack }: { passId: string; onBack: () => void }) {
  return (
    <>
      <h2>{passId}</h2>
      <button type="button" onClick={onBack}>
        Back to Candidate list
      </button>
    </>
  );
}

export default function Demo06Police() {
  const { status, statusFailed, refresh } = useAssetStatus();
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState("");
  const [selection, setSelection] = useState<PassSelection | null>(null);
  const view = deriveAssetState(status);

  async function runAction(action: () => Promise<{ ok: true }>, failureMessage: string) {
    setBusy(true);
    setActionError("");
    try {
      await action();
      refresh();
    } catch {
      setActionError(failureMessage);
    } finally {
      setBusy(false);
    }
  }

  function submitSas(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const url = String(new FormData(form).get("readSas") ?? "").trim();
    form.reset();
    if (url) void runAction(() => pasteSas(url), "Could not accept the read SAS. Check the URL and try again.");
  }

  return (
    <div className="police-page">
      <header className="police-header">
        <div className="police-brand">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="24" height="24" aria-hidden="true">
            <rect width="32" height="32" fill="#e30613" rx="2" />
            <rect x="6" y="13" width="20" height="6" fill="white" />
            <rect x="13" y="6" width="6" height="20" fill="white" />
          </svg>
          SWISS SAFE DRIVE
          <span className="police-demo-badge">DEMO 06</span>
        </div>
        <Link to="/" className="header-back">
          ← Demos
        </Link>
      </header>

      <main className="police-content">
        <h1>Police Candidate Review</h1>
        <section
          className="police-panel"
          aria-label={view.kind === "ready" && !statusFailed ? (selection ? "Selected Pass" : "Candidate list") : "Demo assets"}
        >
          {view.kind === "run-locally" ? (
            <RunLocally />
          ) : statusFailed ? (
            <>
              <h2>Asset status unavailable</h2>
              <p>
                Check that the backend is running and the session tokens in <code>.env.local</code> match.
              </p>
              <button type="button" onClick={refresh}>
                Refresh status
              </button>
            </>
          ) : view.kind === "loading" ? (
            <p role="status">Connecting to the demo API…</p>
          ) : null}

          {!statusFailed && (view.kind === "missing_sas" || view.kind === "sas_rejected") && (
            <>
              <h2>Connect demo assets</h2>
              {view.kind === "sas_rejected" && <p>The read SAS has expired or was revoked. Paste a new one.</p>}
              {view.kind === "sas_rejected" && status?.sas_source === "env" && (
                <p>
                  Clear <code>DEMO_ASSETS_READ_SAS_URL</code> and restart the backend before pasting a replacement.
                </p>
              )}
              <form className="police-sas-form" onSubmit={submitSas}>
                <label htmlFor="police-read-sas">Read SAS URL</label>
                <div>
                  <input id="police-read-sas" type="password" name="readSas" required autoComplete="off" spellCheck={false} disabled={busy} />
                  <button type="submit" disabled={busy}>
                    Connect
                  </button>
                </div>
              </form>
            </>
          )}

          {!statusFailed && view.kind === "progress" && status && (
            <>
              <h2 id="police-progress-title">{status.state === "downloading" ? "Downloading assets" : "Checking assets"}</h2>
              <progress aria-labelledby="police-progress-title" max={100} value={view.percent ?? undefined} />
              <p>
                {formatBytes(status.bytes_done)} / {formatBytes(status.bytes_total)}
                {view.percent !== null && ` (${view.percent}%)`}
                {" · "}
                {status.files_done} / {status.files_total} files
              </p>
              {status.current_file && <p className="police-current-file">{status.current_file}</p>}
            </>
          )}

          {!statusFailed && view.kind === "error" && (
            <>
              <h2>Asset download failed</h2>
              <p>{status?.error?.message ?? "Could not synchronize demo assets."}</p>
              <button type="button" disabled={busy} onClick={() => void runAction(retryAssets, "Could not retry the download.")}>
                Retry
              </button>
            </>
          )}

          {!statusFailed &&
            view.kind === "ready" &&
            (selection ? (
              <CasePlaceholder passId={selection.passId} onBack={() => setSelection(null)} />
            ) : (
              <CandidateList onOpenPass={setSelection} />
            ))}
          {actionError && <p role="alert">{actionError}</p>}
        </section>
      </main>
    </div>
  );
}
