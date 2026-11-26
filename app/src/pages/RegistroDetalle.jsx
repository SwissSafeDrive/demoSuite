import { useEffect, useState } from "react";
import { submitDecision, fetchImageBlobUrl } from "../api/client";
import { recordStateLabels } from "./recordStateLabels";

export default function RegistroDetalle({ registro, onVolver }) {
  const [estado, setEstado] = useState(registro.state);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState(null);
  const [error, setError] = useState(null);
  const [imagenUrl, setImagenUrl] = useState(null);

  const tieneImagen = !!registro.image_path;

  useEffect(() => {
    let activeUrl = null;
    let cancelado = false;

    if (tieneImagen) {
      fetchImageBlobUrl(registro.id)
        .then((url) => {
          if (cancelado) {
            URL.revokeObjectURL(url);
          } else {
            activeUrl = url;
            setImagenUrl(url);
          }
        })
        .catch(() => {
          if (!cancelado) {
            setImagenUrl(null);
          }
        });
    }

    return () => {
      cancelado = true;
      if (activeUrl) {
        URL.revokeObjectURL(activeUrl);
      }
    };
  }, [registro.id, tieneImagen]);

  const formatFecha = (iso) => {
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

  const getBadgeClass = (confianza) => {
    if (confianza >= 0.85) return "badge-alta";
    if (confianza >= 0.7) return "badge-media";
    return "badge-baja";
  };

  const enviarDecision = async (nuevoEstado) => {
    setGuardando(true);
    setError(null);
    setMensaje(null);
    try {
      const actualizado = await submitDecision(registro.id, nuevoEstado);
      setEstado(actualizado.state);
      setMensaje(`Decisione registrata: ${recordStateLabels[nuevoEstado]}`);
    } catch (e) {
      setError(`Impossibile aggiornare la decisione: ${e.message}`);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="detalle-container">
      <div className="detalle-header">
        <button onClick={onVolver}>← Torna all'elenco</button>
        <h2>Dettaglio registro</h2>
      </div>

      {tieneImagen && imagenUrl ? (
        <div className="detalle-imagen-real">
          <img src={imagenUrl} alt="Immagine catturata" />
        </div>
      ) : (
        <div className="detalle-imagen">
          <div className="detalle-imagen-placeholder">
            <p>Immagine evento — demo</p>
            <p style={{ fontSize: "0.8rem", marginTop: "8px" }}>
              Privacy by Design — demo non destinata a uso operativo
            </p>
          </div>
        </div>
      )}

      <div className="detalle-info">
        <h3>Informazioni sul registro</h3>
        <div className="detalle-info-grid">
          <div className="detalle-info-item">
            <strong>ID registro</strong>
            {registro.event_id}
          </div>
          <div className="detalle-info-item">
            <strong>Data e ora</strong>
            {formatFecha(registro.timestamp)}
          </div>
          <div className="detalle-info-item">
            <strong>Luogo</strong>
            {registro.location}
          </div>
          <div className="detalle-info-item">
            <strong>Origine</strong>
            {registro.origin === "camera" ? "📷 Camera" : "🧪 Simulato"}
          </div>
          <div className="detalle-info-item">
            <strong>Confidenza IA</strong>
            <span
              className={`registro-card-badge ${getBadgeClass(registro.confidence)}`}
              style={{
                position: "static",
                display: "inline-block",
                marginTop: "4px",
              }}
            >
              {(registro.confidence * 100).toFixed(1)}%
            </span>
          </div>
          <div className="detalle-info-item">
            <strong>Identificatore tecnico demo</strong>
            {registro.demo_id || registro.event_id}
          </div>
          <div className="detalle-info-item">
            <strong>Stato attuale</strong>
            <span style={{ textTransform: "capitalize", fontWeight: 600 }}>
              {recordStateLabels[estado]}
            </span>
          </div>
          {registro.operator_id && (
            <div className="detalle-info-item">
              <strong>Agente</strong>
              {registro.operator_id}
            </div>
          )}
          {registro.decision_at && (
            <div className="detalle-info-item">
              <strong>Data decisione</strong>
              {formatFecha(registro.decision_at)}
            </div>
          )}
        </div>
      </div>

      <div className="detalle-info">
        <h3>Decisione dell'agente (validazione umana obbligatoria)</h3>
        <p style={{ fontSize: "0.85rem", color: "#475569", marginBottom: "12px" }}>
          Il sistema fornisce esclusivamente un supporto tecnico preliminare. La
          decisione finale spetta sempre all'operatore umano.
        </p>

        {mensaje && (
          <p style={{ color: "#059669", fontWeight: 600, marginBottom: "12px" }}>
            ✓ {mensaje}
          </p>
        )}

        {error && (
          <p style={{ color: "#475569", fontWeight: 600, marginBottom: "12px" }}>
            {error}
          </p>
        )}

        <div className="detalle-acciones">
          <button
            className="btn-descartar"
            onClick={() => enviarDecision("discarded")}
            disabled={guardando}
          >
            {guardando ? "…" : "Scarta"}
          </button>
          <button
            className="btn-revisar"
            onClick={() => enviarDecision("reviewed")}
            disabled={guardando}
          >
            {guardando ? "…" : "Marca per revisione"}
          </button>
          <button
            className="btn-confirmar"
            onClick={() => enviarDecision("confirmed")}
            disabled={guardando}
          >
            {guardando ? "…" : "Conferma infrazione"}
          </button>
        </div>
      </div>

      <div className="detalle-nota">
        <strong>Nota informativa:</strong> {registro.notice}
      </div>
    </div>
  );
}
