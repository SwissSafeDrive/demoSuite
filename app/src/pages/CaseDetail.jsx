import { useEffect, useState } from "react";
import { submitDecision, fetchImageBlobUrl } from "../api/client";
import RecordedPlayer from "../media/RecordedPlayer";
import { recordStateLabels } from "./recordStateLabels";

export default function CaseDetail({ record, passId, clipId, seekTime, onOpenPass, onBack, opening }) {
  const hasImage = Boolean(record.image_path);
  return (
    <div className={passId ? "case-detail-container single-case-analysis" : "case-detail-container"}>
      <div className="case-detail-header">
        <button onClick={onBack} disabled={opening}>← Back to Candidate list</button>
        <h2>{passId ? "Single Case Analysis" : "Case detail"}</h2>
      </div>

      {passId ? (
        <RecordedPlayer passId={passId} initialClipId={clipId} seekTime={seekTime} onOpenPass={onOpenPass} />
      ) : record.origin === "simulated" && !hasImage ? (
        <RecordedPlayer onOpenPass={onOpenPass} />
      ) : null}

      <RecordReview key={record.id} record={record} passId={passId} />
    </div>
  );
}

function RecordReview({ record, passId }) {
  const [state, setState] = useState(record.state);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [imageUrl, setImageUrl] = useState(null);

  const hasImage = !!record.image_path;

  useEffect(() => {
    let activeUrl = null;
    let cancelled = false;

    if (hasImage) {
      fetchImageBlobUrl(record.id)
        .then((url) => {
          if (cancelled) {
            URL.revokeObjectURL(url);
          } else {
            activeUrl = url;
            setImageUrl(url);
          }
        })
        .catch(() => {
          if (!cancelled) {
            setImageUrl(null);
          }
        });
    }

    return () => {
      cancelled = true;
      if (activeUrl) {
        URL.revokeObjectURL(activeUrl);
      }
    };
  }, [record.id, hasImage]);

  const formatDate = (iso) => {
    const d = new Date(iso);
    return d.toLocaleString("en-CH", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const getBadgeClass = (confidence) => {
    if (confidence >= 0.85) return "badge-high";
    if (confidence >= 0.7) return "badge-medium";
    return "badge-low";
  };

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
      {!passId && !(record.origin === "simulated" && !hasImage) && (hasImage && imageUrl ? (
        <div className="case-detail-capture">
          <img src={imageUrl} alt="Captured image" />
        </div>
      ) : (
        <div className="case-detail-image">
          <div className="case-detail-image-placeholder">
            <p>Event image — demo</p>
            <p style={{ fontSize: "0.8rem", marginTop: "8px" }}>
              Privacy by Design — demonstration only
            </p>
          </div>
        </div>
      ))}

      {passId ? (
        <div className="case-detail-info">
          <p>Review state · {recordStateLabels[state]}</p>
        </div>
      ) : (
        <div className="case-detail-info">
          <h3>Record information</h3>
          <div className="case-detail-info-grid">
            <div className="case-detail-info-item">
              <strong>Record ID</strong>
              {record.event_id}
            </div>
            <div className="case-detail-info-item">
              <strong>Date and time</strong>
              {formatDate(record.timestamp)}
            </div>
            <div className="case-detail-info-item">
              <strong>Location</strong>
              {record.location}
            </div>
            <div className="case-detail-info-item">
              <strong>Source</strong>
              {record.origin === "camera" ? "📷 Camera" : "🧪 Simulated"}
            </div>
            <div className="case-detail-info-item">
              <strong>AI confidence</strong>
              <span
                className={`record-badge ${getBadgeClass(record.confidence)}`}
                style={{
                  position: "static",
                  display: "inline-block",
                  marginTop: "4px",
                }}
              >
                {record.origin === "simulated" && "SIMULATED SIGNAL · "}
                {(record.confidence * 100).toFixed(1)}%
              </span>
            </div>
            <div className="case-detail-info-item">
              <strong>Demo technical identifier</strong>
              {record.demo_id || record.event_id}
            </div>
            <div className="case-detail-info-item">
              <strong>Current state</strong>
              <span style={{ textTransform: "capitalize", fontWeight: 600 }}>
                {recordStateLabels[state]}
              </span>
            </div>
            {record.operator_id && (
              <div className="case-detail-info-item">
                <strong>Operator</strong>
                {record.operator_id}
              </div>
            )}
            {record.decision_at && (
              <div className="case-detail-info-item">
                <strong>Decision date</strong>
                {formatDate(record.decision_at)}
              </div>
            )}
          </div>
        </div>

      )}

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
