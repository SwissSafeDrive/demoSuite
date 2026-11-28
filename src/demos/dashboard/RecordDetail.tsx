import { useState } from "react";
import type { DashboardRecord, RecordState } from "./types";
import { stateLabel } from "./stateMeta";

interface Props {
  record: DashboardRecord;
  onDecide: (state: RecordState) => void;
  onBack: () => void;
}

export default function RecordDetail({ record, onDecide, onBack }: Props) {
  const [selected, setSelected] = useState<"confirmed" | "discarded" | "reviewed" | "">("");
  const isDecided = record.state !== "pending";

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (selected) onDecide(selected);
  }

  return (
    <div className="db-det-root">
      <style>{`
        .db-det-root { font-family: inherit; color: #1a1a1a; max-width: 860px; margin: 0 auto; padding: 24px; }
        .db-det-back { background: none; border: none; cursor: pointer; font-size: 13px; color: #6b6b6b; padding: 0; margin-bottom: 20px; display: flex; align-items: center; gap: 4px; }
        .db-det-back:hover { color: #1a1a1a; }
        .db-det-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
        @media (max-width: 640px) { .db-det-grid { grid-template-columns: 1fr; } }
        .db-det-img { width: 100%; aspect-ratio: 16/9; object-fit: cover; border-radius: 4px; background: #111; border: 1px solid #333; }
        .db-det-placeholder { width: 100%; aspect-ratio: 16/9; background: #111; border-radius: 4px; display: flex; align-items: center; justify-content: center; color: #555; font-size: 13px; border: 1px solid #333; }
        .db-det-meta { display: flex; flex-direction: column; gap: 12px; }
        .db-det-field { display: flex; flex-direction: column; gap: 2px; }
        .db-det-label { font-size: 10px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; color: #6b6b6b; }
        .db-det-value { font-size: 14px; }
        .db-det-notice { font-size: 12px; color: #555; font-style: italic; }
        .db-det-divider { border: none; border-top: 1px solid #e0e0e0; margin: 24px 0; }
        .db-det-decision-form { display: flex; flex-direction: column; gap: 16px; }
        .db-det-options { display: flex; gap: 12px; flex-wrap: wrap; }
        .db-det-option { display: flex; align-items: center; gap: 8px; cursor: pointer; padding: 10px 16px; border: 1px solid #e0e0e0; border-radius: 4px; font-size: 13px; transition: border-color 0.15s; }
        .db-det-option:has(input:checked) { border-color: #1a1a1a; font-weight: 600; }
        .db-det-option--confirmed:has(input:checked) { border-color: #2e7d32; background: #e8f5e9; }
        .db-det-option--discarded:has(input:checked) { border-color: #c62828; background: #fce4ec; }
        .db-det-option--reviewed:has(input:checked) { border-color: #1565c0; background: #e3f2fd; }
        .db-det-submit { padding: 10px 24px; background: #1a1a1a; color: #fff; border: none; border-radius: 4px; font-size: 13px; font-weight: 600; cursor: pointer; align-self: flex-start; }
        .db-det-submit:disabled { background: #ccc; cursor: not-allowed; }
        .db-det-decided { padding: 16px; background: #f5f5f5; border-radius: 4px; font-size: 13px; }
        .db-det-decided strong { display: block; margin-bottom: 4px; }
        .db-det-badge { display: inline-block; padding: 2px 10px; border-radius: 10px; font-size: 12px; font-weight: 600; }
        .db-det-badge--confirmed { background: #e8f5e9; color: #1b5e20; }
        .db-det-badge--discarded { background: #fce4ec; color: #7f0000; }
        .db-det-badge--reviewed { background: #e3f2fd; color: #0d47a1; }
        .db-det-badge--pending { background: #fff8e1; color: #795600; }
      `}</style>

      <button className="db-det-back" onClick={onBack}>
        ← Back to records
      </button>

      <div className="db-det-grid">
        <div>
          {record.image_path ? (
            <img className="db-det-img" src={record.image_path} alt="Camera image" />
          ) : (
            <div className="db-det-placeholder">No image available</div>
          )}
        </div>

        <div className="db-det-meta">
          <div className="db-det-field">
            <span className="db-det-label">Record ID</span>
            <span className="db-det-value">{record.demo_id}</span>
          </div>
          <div className="db-det-field">
            <span className="db-det-label">Date and time</span>
            <span className="db-det-value">{record.timestamp.toLocaleString("en-CH")}</span>
          </div>
          <div className="db-det-field">
            <span className="db-det-label">Location</span>
            <span className="db-det-value">{record.location}</span>
          </div>
          <div className="db-det-field">
            <span className="db-det-label">AI confidence</span>
            <span className="db-det-value">{Math.round(record.confidence * 100)}%</span>
          </div>
          <div className="db-det-field">
            <span className="db-det-label">Origin</span>
            <span className="db-det-value">{record.origin === "simulated" ? "Simulated" : "Camera"}</span>
          </div>
          <div className="db-det-field">
            <span className="db-det-label">Legal notice</span>
            <span className="db-det-notice">{record.notice}</span>
          </div>
        </div>
      </div>

      <hr className="db-det-divider" />

      {isDecided ? (
        <div className="db-det-decided">
          <strong>Decision recorded</strong>
          <span className={`db-det-badge db-det-badge--${record.state}`}>{stateLabel(record.state)}</span>
          {record.decision_at && <span style={{ marginLeft: 12, color: "#6b6b6b", fontSize: 12 }}>{record.decision_at.toLocaleString("en-CH")}</span>}
          {record.operator_id && <span style={{ marginLeft: 12, color: "#6b6b6b", fontSize: 12 }}>Operator: {record.operator_id}</span>}
        </div>
      ) : (
        <form className="db-det-decision-form" onSubmit={handleSubmit}>
          <div className="db-det-label">Record decision</div>
          <div className="db-det-options">
            <label className="db-det-option db-det-option--confirmed">
              <input type="radio" name="decision" value="confirmed" onChange={() => setSelected("confirmed")} />
              Confirm infraction
            </label>
            <label className="db-det-option db-det-option--discarded">
              <input type="radio" name="decision" value="discarded" onChange={() => setSelected("discarded")} />
              Discard
            </label>
            <label className="db-det-option db-det-option--reviewed">
              <input type="radio" name="decision" value="reviewed" onChange={() => setSelected("reviewed")} />
              Mark for review
            </label>
          </div>
          <button className="db-det-submit" type="submit" disabled={!selected}>
            Submit decision
          </button>
        </form>
      )}
    </div>
  );
}
