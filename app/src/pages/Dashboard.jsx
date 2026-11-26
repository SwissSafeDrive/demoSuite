import { useEffect, useState } from "react";
import { getCandidates } from "../api/client";
import { recordStateLabels } from "./recordStateLabels";

export default function Dashboard({ onOpenPass, opening }) {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stateFilter, setStateFilter] = useState("all");
  const [minimumSignal, setMinimumSignal] = useState(0);
  const [search, setSearch] = useState("");

  const loadCandidates = async () => {
    setLoading(true);
    setError(null);
    try {
      setCandidates(await getCandidates());
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCandidates();
  }, []);

  const visibleCandidates = candidates.filter(({ passId, state, signal }) =>
    (stateFilter === "all" || state === stateFilter) &&
    (minimumSignal === 0 || (signal && signal.percent >= minimumSignal)) &&
    passId.toLowerCase().includes(search.trim().toLowerCase())
  );

  return (
    <section className="dashboard">
      <header className="dashboard-header">
        <h2>Candidate list</h2>
        <p>A human operator reviews each case and makes the final decision.</p>
      </header>

      {loading ? (
        <p role="status">Loading Candidates…</p>
      ) : error ? (
        <div role="alert">
          <p>Candidate list unavailable. {error}</p>
          <button onClick={loadCandidates}>Retry</button>
        </div>
      ) : (
        <>
          <div className="statistics">
            <div className="stat-card">
              <h3>Total Candidates</h3>
              <p className="stat-num">{candidates.length}</p>
            </div>
            {["pending", "reviewed"].map((state) => (
              <div className="stat-card" key={state}>
                <h3>{recordStateLabels[state]}</h3>
                <p className="stat-num">
                  {candidates.filter((candidate) => candidate.state === state).length}
                </p>
              </div>
            ))}
          </div>

          <div className="filter-bar">
            <label>
              Review state
              <select value={stateFilter} onChange={(event) => setStateFilter(event.target.value)}>
                <option value="all">All</option>
                {Object.entries(recordStateLabels).map(([state, label]) => (
                  <option key={state} value={state}>{label}</option>
                ))}
              </select>
            </label>
            <label>
              Minimum simulated signal · {minimumSignal}%
              <input
                type="range"
                min="0"
                max="100"
                value={minimumSignal}
                onChange={(event) => setMinimumSignal(Number(event.target.value))}
              />
            </label>
            <label>
              Search by Pass ID
              <input type="search" value={search} onChange={(event) => setSearch(event.target.value)} />
            </label>
            <button onClick={loadCandidates} disabled={opening}>Refresh</button>
            <button onClick={() => {
              setStateFilter("all");
              setMinimumSignal(0);
              setSearch("");
            }}>
              Reset filters
            </button>
          </div>

          {visibleCandidates.length === 0 ? (
            <p>No Candidates match these filters.</p>
          ) : (
            <div className="candidate-grid">
              {visibleCandidates.map((candidate) => (
                <button
                  type="button"
                  key={candidate.passId}
                  className="candidate-card"
                  style={{ borderTopColor: candidate.signal?.color }}
                  onClick={() => onOpenPass(candidate)}
                  disabled={opening}
                >
                  <strong>{candidate.passId}</strong>
                  <span>{recordStateLabels[candidate.state]}</span>
                  {candidate.signal && (
                    <span className="confidence">
                      {candidate.signal.label} · {candidate.signal.percent}%
                    </span>
                  )}
                  {candidate.flagged_manually && <span>Flagged manually</span>}
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </section>
  );
}
