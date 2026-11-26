import { useEffect, useState } from "react";
import { submitDecision, fetchImageBlobUrl } from "../api/client";
import RecordedPlayer from "../media/RecordedPlayer";
import { recordStateLabels } from "./recordStateLabels";

export default function CaseDetail({ record, passId, clipId, seekTime, onBack }) {
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
    return d.toLocaleString("it-CH", {
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
      setMessage(`Decisione registrata: ${recordStateLabels[nextState]}`);
    } catch (e) {
      setError(`Impossibile aggiornare la decisione: ${e.message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="case-detail-container">
      <div className="case-detail-header">
        <button onClick={onBack}>← Back to Candidate list</button>
        <h2>{passId ? "Single Case Analysis" : "Case detail"}</h2>
      </div>

      {passId ? (
        <RecordedPlayer passId={passId} initialClipId={clipId} seekTime={seekTime} />
      ) : record.origin === "simulated" && !hasImage ? (
        <RecordedPlayer />
      ) : hasImage && imageUrl ? (
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
      )}

      {passId ? (
        <div className="case-detail-info">
          <p>Review state · {recordStateLabels[state]}</p>
        </div>
      ) : (
        <div className="case-detail-info">
          <h3>Informazioni sul registro</h3>
          <div className="case-detail-info-grid">
            <div className="case-detail-info-item">
              <strong>ID registro</strong>
              {record.event_id}
            </div>
            <div className="case-detail-info-item">
              <strong>Data e ora</strong>
              {formatDate(record.timestamp)}
            </div>
            <div className="case-detail-info-item">
              <strong>Luogo</strong>
              {record.location}
            </div>
            <div className="case-detail-info-item">
              <strong>Origine</strong>
              {record.origin === "camera" ? "📷 Camera" : "🧪 Simulato"}
            </div>
            <div className="case-detail-info-item">
              <strong>Confidenza IA</strong>
              <span
                className={`record-badge ${getBadgeClass(record.confidence)}`}
                style={{
                  position: "static",
                  display: "inline-block",
                  marginTop: "4px",
                }}
              >
                {(record.confidence * 100).toFixed(1)}%
              </span>
            </div>
            <div className="case-detail-info-item">
              <strong>Identificatore tecnico demo</strong>
              {record.demo_id || record.event_id}
            </div>
            <div className="case-detail-info-item">
              <strong>Stato attuale</strong>
              <span style={{ textTransform: "capitalize", fontWeight: 600 }}>
                {recordStateLabels[state]}
              </span>
            </div>
            {record.operator_id && (
              <div className="case-detail-info-item">
                <strong>Agente</strong>
                {record.operator_id}
              </div>
            )}
            {record.decision_at && (
              <div className="case-detail-info-item">
                <strong>Data decisione</strong>
                {formatDate(record.decision_at)}
              </div>
            )}
          </div>
        </div>

      )}

      <div className="case-detail-info">
        <h3>Decisione dell'agente (validazione umana obbligatoria)</h3>
        <p style={{ fontSize: "0.85rem", color: "#475569", marginBottom: "12px" }}>
          Il sistema fornisce esclusivamente un supporto tecnico preliminare. La
          decisione finale spetta sempre all'operatore umano.
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
            className="btn-descartar"
            onClick={() => saveDecision("discarded")}
            disabled={saving}
          >
            {saving ? "…" : "Scarta"}
          </button>
          <button
            className="btn-revisar"
            onClick={() => saveDecision("reviewed")}
            disabled={saving}
          >
            {saving ? "…" : "Marca per revisione"}
          </button>
          <button
            className="btn-confirmar"
            onClick={() => saveDecision("confirmed")}
            disabled={saving}
          >
            {saving ? "…" : "Conferma infrazione"}
          </button>
        </div>
      </div>

      <div className="case-detail-note">
        <strong>Nota informativa:</strong> {record.notice}
      </div>
    </div>
  );
}
