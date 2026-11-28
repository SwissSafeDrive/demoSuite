import { useEffect, useState } from "react";
import { getCandidates } from "./api";
import { formatCandidateRow, minimumSignalLabel, reviewStateLabels } from "./candidate-display";
import type { Candidate } from "./types";
import "./candidates.css";

export type PassSelection = Pick<Candidate, "passId" | "clipId" | "seekTime">;

type CandidateLoad = { kind: "loading" } | { kind: "error" } | { kind: "ready"; candidates: Candidate[] };

export default function CandidateList({ onOpenPass }: { onOpenPass: (selection: PassSelection) => void }) {
  const [load, setLoad] = useState<CandidateLoad>({ kind: "loading" });
  const [attempt, setAttempt] = useState(0);
  const [stateFilter, setStateFilter] = useState("all");
  const [minimum, setMinimum] = useState(0);
  const [search, setSearch] = useState("");

  useEffect(() => {
    let active = true;
    void getCandidates().then(
      (candidates) => {
        if (active) setLoad({ kind: "ready", candidates });
      },
      () => {
        if (active) setLoad({ kind: "error" });
      },
    );
    return () => {
      active = false;
    };
  }, [attempt]);

  function retry() {
    setLoad({ kind: "loading" });
    setAttempt((previous) => previous + 1);
  }

  const minimumLabel = minimumSignalLabel(minimum);
  const query = search.trim().toLowerCase();
  const visibleCandidates =
    load.kind === "ready"
      ? load.candidates.filter(
          ({ passId, state, signal }) =>
            (stateFilter === "all" || state === stateFilter) &&
            (minimumLabel === null || minimum === 0 || (signal !== null && signal.percent >= minimum)) &&
            passId.toLowerCase().includes(query),
        )
      : [];

  return (
    <>
      <h2 className="police-candidate-heading">Candidate list</h2>
      {load.kind === "loading" && <p role="status">Loading Candidates…</p>}
      {load.kind === "error" && (
        <>
          <p role="alert">Candidate list unavailable.</p>
          <button type="button" onClick={retry}>
            Retry
          </button>
        </>
      )}
      {load.kind === "ready" && (
        <>
          <dl className="police-candidate-counts">
            <div>
              <dt>Total Candidates</dt>
              <dd>{load.candidates.length}</dd>
            </div>
            <div>
              <dt>Pending</dt>
              <dd>{load.candidates.filter(({ state }) => state === "pending").length}</dd>
            </div>
            <div>
              <dt>Reviewed</dt>
              <dd>{load.candidates.filter(({ state }) => state === "reviewed").length}</dd>
            </div>
          </dl>
          <div className="police-candidate-filters">
            <label>
              Review state
              <select value={stateFilter} onChange={(event) => setStateFilter(event.target.value)}>
                <option value="all">All</option>
                {Object.entries(reviewStateLabels).map(([state, label]) => (
                  <option key={state} value={state}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Search by Pass ID
              <input type="search" value={search} onChange={(event) => setSearch(event.target.value)} />
            </label>
            {minimumLabel !== null && (
              <label>
                {minimumLabel}
                <input type="range" min={0} max={100} value={minimum} onChange={(event) => setMinimum(Number(event.target.value))} />
              </label>
            )}
          </div>
          {visibleCandidates.length === 0 ? (
            <p>{load.candidates.length ? "No Candidates match these filters." : "No Candidates yet."}</p>
          ) : (
            <div className="police-candidate-table-wrap">
              <table className="police-candidate-table" aria-label="Candidates">
                <thead>
                  <tr>
                    <th scope="col">Pass ID</th>
                    <th scope="col">Clip</th>
                    <th scope="col">Seek time (s)</th>
                    <th scope="col">Review state</th>
                    <th scope="col">Signal</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleCandidates.map((candidate) => {
                    const { passId, clipId, seekTime } = candidate;
                    const { stateLabel, signalText, signalTag } = formatCandidateRow(candidate);
                    return (
                      <tr key={passId}>
                        <th scope="row">
                          <button className="police-candidate-open" type="button" onClick={() => onOpenPass({ passId, clipId, seekTime })}>
                            {passId}
                          </button>
                          {candidate.flagged_manually && <span className="police-candidate-tag">Flagged manually</span>}
                        </th>
                        <td>{clipId}</td>
                        <td>{seekTime.toFixed(2)}</td>
                        <td>{stateLabel}</td>
                        <td>
                          {signalText ?? "—"}
                          {signalTag && <span className="police-candidate-tag">{signalTag}</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </>
  );
}
