import { useState } from "react";
import { submitDecision } from "../api/client";
import RecordedPlayer from "../media/RecordedPlayer";
import { recordStateLabels } from "./recordStateLabels";

export default function CaseDetail({ record, passId, clipId, seekTime, onOpenPass, onBack, opening }) {
  return (
    <div className="case-detail-container single-case-analysis">
      <div className="case-detail-header">
        <button onClick={onBack} disabled={opening}>← Back to Candidate list</button>
        <h2>Single Case Analysis</h2>
      </div>

      <RecordedPlayer passId={passId} clipId={clipId} seekTime={seekTime} onOpenPass={onOpenPass} />

      <RecordReview key={record.id} record={record} />
    </div>
  );
}

function RecordReview({ record }) {
  const [state, setState] = useState(record.state);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const saveDecision = async (nextState) => {
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const updated = await submitDecision(record.id, nextState);
      setState(updated.state);
      setMessage(`Decision saved: ${recordStateLabels[nextState]}`);
    } catch (e) {
      setError(`Could not save the decision: ${e.message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="case-detail-info">
        <p>Review state · {recordStateLabels[state]}</p>
      </div>

      <div className="case-detail-info">
        <h3>Operator decision (human review required)</h3>
        <p style={{ fontSize: "0.85rem", color: "#475569", marginBottom: "12px" }}>
          The system provides preliminary technical assistance. The human operator makes the final decision.
        </p>

        {message && (
          <p style={{ color: "#059669", fontWeight: 600, marginBottom: "12px" }}>
            ✓ {message}
          </p>
        )}

        {error && (
          <p style={{ color: "#475569", fontWeight: 600, marginBottom: "12px" }}>
            {error}
          </p>
        )}

        <div className="case-detail-actions">
          <button
            className="btn-discard"
            onClick={() => saveDecision("discarded")}
            disabled={saving}
          >
            {saving ? "…" : "Discard"}
          </button>
          <button
            className="btn-mark-for-review"
            onClick={() => saveDecision("reviewed")}
            disabled={saving}
          >
            {saving ? "…" : "Mark for review"}
          </button>
          <button
            className="btn-confirm"
            onClick={() => saveDecision("confirmed")}
            disabled={saving}
          >
            {saving ? "…" : "Confirm infraction"}
          </button>
        </div>
      </div>

      <div className="case-detail-note">
        <strong>Information:</strong> {record.notice}
      </div>
    </>
  );
}
