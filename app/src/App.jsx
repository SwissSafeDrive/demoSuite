import { useState } from "react";
import { openPassRecord } from "./api/client";
import Dashboard from "./pages/Dashboard";
import CaseDetail from "./pages/CaseDetail";
import LiveCamera from "./pages/LiveCamera";

export default function App() {
  const [view, setView] = useState("candidate-list");
  const [selection, setSelection] = useState(null);
  const [opening, setOpening] = useState(false);
  const [error, setError] = useState(null);

  const navigate = (nextView) => {
    setSelection(null);
    setError(null);
    setView(nextView);
  };

  const openPass = async ({ passId, clipId, seekTime }) => {
    setOpening(true);
    setError(null);
    try {
      const record = await openPassRecord(passId);
      setSelection({ record, passId, clipId, seekTime });
      setView("case-detail");
    } catch (error) {
      setError(`Could not open ${passId}. ${error.message}`);
    } finally {
      setOpening(false);
    }
  };

  const showCandidates = () => navigate("candidate-list");

  return (
    <div className="app">
      <header className="app-header">
        <h1>SwissSafeDrive — Review console</h1>
        <nav className="app-nav">
          <button
            className={view !== "live-camera" ? "nav-btn active" : "nav-btn"}
            onClick={showCandidates}
            disabled={opening}
          >
            Candidate list
          </button>
          <button
            className={view === "live-camera" ? "nav-btn active" : "nav-btn"}
            onClick={() => navigate("live-camera")}
            disabled={opening}
          >
            Live camera
          </button>
        </nav>
        <span className="app-header-info">SwissSafeDrive — Institutional demo</span>
      </header>

      <main className="app-main">
        {error && <p role="alert">{error}</p>}
        {view === "candidate-list" && <Dashboard onOpenPass={openPass} opening={opening} />}
        {view === "case-detail" && <CaseDetail {...selection} onBack={showCandidates} />}
        {view === "live-camera" && <LiveCamera onBack={showCandidates} />}
      </main>

      <footer className="app-footer">
        <span>SwissSafeDrive v0.2.2 — For demonstration only</span>
        <span className="legal-notice">
          Privacy by Design · This demo uses only the data it needs
        </span>
      </footer>
    </div>
  );
}
