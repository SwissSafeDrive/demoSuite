import { useEffect, useRef, useState } from "react";
import { subirCaptura } from "../api/client";

export default function CamaraEnVivo({ onVolver }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const intervalRef = useRef(null);

  const [activa, setActiva] = useState(false);
  const [modoDemo, setModoDemo] = useState(false);
  const [verificando, setVerificando] = useState(true);
  const [autoCaptura, setAutoCaptura] = useState(false);
  const [contador, setContador] = useState(0);
  const [avvisoStato, setAvvisoStato] = useState(null);
  const [ultimoRegistro, setUltimoRegistro] = useState(null);
  const [intervaloSeg, setIntervaloSeg] = useState(5);

  const detenerCamara = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setActiva(false);
    setAutoCaptura(false);
  };

  const iniciarCamara = async () => {
    setVerificando(true);
    setAvvisoStato(null);
    try {
      if (
        !navigator.mediaDevices ||
        typeof navigator.mediaDevices.getUserMedia !== "function"
      ) {
        throw new Error("MediaDevices non disponibile");
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720 },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setModoDemo(false);
      setActiva(true);
    } catch (_err) {
      detenerCamara();
      setModoDemo(true);
    } finally {
      setVerificando(false);
    }
  };

  useEffect(() => {
    iniciarCamara();
    return () => {
      detenerCamara();
    };
  }, []);

  const capturarFrame = async () => {
    if (!activa || !videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(
      async (blob) => {
        if (!blob) return;
        try {
          const reg = await subirCaptura(blob, "Camera locale", 0.75);
          setUltimoRegistro(reg);
          setContador((c) => c + 1);
          setAvvisoStato("Frame registrato in locale.");
        } catch (_e) {
          setAvvisoStato("Servizio locale temporaneamente occupato. Riprovare.");
        }
      },
      "image/jpeg",
      0.85
    );
  };

  const toggleAutoCaptura = () => {
    if (autoCaptura) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      setAutoCaptura(false);
    } else {
      intervalRef.current = setInterval(() => {
        capturarFrame();
      }, intervaloSeg * 1000);
      setAutoCaptura(true);
    }
  };

  return (
    <div className="detalle-container">
      <div className="detalle-header">
        <button onClick={onVolver}>← Torna all'elenco</button>
        <h2>Camera in diretta</h2>
      </div>

      {modoDemo && !activa && (
        <div
          style={{
            background: "#f8fafc",
            border: "1px solid #cbd5e1",
            borderLeft: "4px solid #1e3a8a",
            padding: "20px",
            borderRadius: "6px",
            marginBottom: "16px",
            color: "#1e293b",
          }}
        >
          <div
            style={{
              fontWeight: 700,
              fontSize: "0.95rem",
              letterSpacing: "0.02em",
              color: "#1e3a8a",
              marginBottom: "8px",
            }}
          >
            MODALITÀ DEMO — NESSUNA CAMERA COLLEGATA
          </div>
          <p style={{ fontSize: "0.9rem", color: "#475569", marginBottom: "14px" }}>
            Nessuna videocamera fisica rilevata o autorizzata su questa postazione.
            L'applicazione è attiva in modalità dimostrativa locale e non simula
            alcun flusso video reale. È possibile esaminare i registri dimostrativi
            e testare il flusso decisionale nella sezione Registri.
          </p>
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
            <button
              onClick={onVolver}
              style={{
                padding: "9px 18px",
                background: "#1e3a8a",
                color: "white",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                fontWeight: 600,
              }}
            >
              Vai a Registri
            </button>
            <button
              onClick={iniciarCamara}
              style={{
                padding: "9px 18px",
                background: "#e2e8f0",
                color: "#1e293b",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                fontWeight: 600,
              }}
            >
              Riprova collegamento camera
            </button>
          </div>
        </div>
      )}

      {avvisoStato && (
        <div
          style={{
            background: "#f1f5f9",
            borderLeft: "4px solid #475569",
            padding: "10px 12px",
            borderRadius: "4px",
            marginBottom: "16px",
            fontSize: "0.85rem",
            color: "#334155",
          }}
        >
          {avvisoStato}
        </div>
      )}

      <div
        style={{
          background: activa ? "#000000" : "#0f172a",
          borderRadius: "8px",
          overflow: "hidden",
          marginBottom: "16px",
          aspectRatio: "16 / 9",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
        }}
      >
        <video
          ref={videoRef}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            display: activa ? "block" : "none",
          }}
          muted
          playsInline
        />

        {!activa && (
          <div
            style={{
              textAlign: "center",
              color: "#cbd5e1",
              padding: "24px",
              maxWidth: "480px",
            }}
          >
            <p style={{ fontWeight: 700, fontSize: "1rem", marginBottom: "8px" }}>
              {verificando
                ? "Verifica disponibilità videocamera…"
                : "MODALITÀ DEMO — NESSUNA CAMERA COLLEGATA"}
            </p>
            <p style={{ fontSize: "0.85rem", color: "#94a3b8" }}>
              {verificando
                ? "Richiesta accesso al dispositivo video locale in corso."
                : "Nessun flusso video attivo. L'applicazione non mostra video simulati al posto di una videocamera reale."}
            </p>
          </div>
        )}
      </div>

      <canvas ref={canvasRef} style={{ display: "none" }} />

      <div className="detalle-info">
        <h3>Controlli</h3>
        <div
          style={{
            display: "flex",
            gap: "12px",
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          {!activa ? (
            <>
              <button
                onClick={iniciarCamara}
                disabled={verificando}
                style={{
                  padding: "10px 20px",
                  background: "#1e3a8a",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontWeight: 600,
                }}
              >
                {verificando ? "Verifica in corso…" : "Attiva camera reale"}
              </button>
              <button
                onClick={onVolver}
                style={{
                  padding: "10px 20px",
                  background: "#475569",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontWeight: 600,
                }}
              >
                Torna a Registri
              </button>
            </>
          ) : (
            <>
              <button
                onClick={capturarFrame}
                style={{
                  padding: "10px 20px",
                  background: "#059669",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontWeight: 600,
                }}
              >
                Cattura frame
              </button>

              <button
                onClick={toggleAutoCaptura}
                style={{
                  padding: "10px 20px",
                  background: autoCaptura ? "#475569" : "#f59e0b",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontWeight: 600,
                }}
              >
                {autoCaptura ? "Ferma cattura auto" : "Avvia cattura auto"}
              </button>

              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  fontSize: "0.9rem",
                }}
              >
                Intervallo:
                <input
                  type="number"
                  min="2"
                  max="60"
                  value={intervaloSeg}
                  onChange={(e) => setIntervaloSeg(parseInt(e.target.value) || 5)}
                  style={{
                    width: "60px",
                    padding: "6px",
                    border: "1px solid #d1d5db",
                    borderRadius: "4px",
                  }}
                />
                sec
              </label>

              <button
                onClick={() => {
                  detenerCamara();
                  setModoDemo(true);
                }}
                style={{
                  padding: "10px 20px",
                  background: "#6b7280",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontWeight: 600,
                }}
              >
                Disattiva camera
              </button>
            </>
          )}
        </div>
      </div>

      <div className="detalle-info">
        <h3>Statistiche sessione</h3>
        <div className="detalle-info-grid">
          <div className="detalle-info-item">
            <strong>Frame inviati</strong>
            {contador}
          </div>
          <div className="detalle-info-item">
            <strong>Stato camera</strong>
            {activa
              ? "Camera reale attiva"
              : "MODALITÀ DEMO — NESSUNA CAMERA COLLEGATA"}
          </div>
          <div className="detalle-info-item">
            <strong>Cattura automatica</strong>
            {autoCaptura ? `Ogni ${intervaloSeg}s` : "Disattivata"}
          </div>
          {ultimoRegistro && (
            <div className="detalle-info-item">
              <strong>Ultimo ID</strong>
              {ultimoRegistro.inf_id}
            </div>
          )}
        </div>
      </div>

      <div className="detalle-nota">
        <strong>Nota informativa:</strong> Privacy by Design — demo non destinata
        a uso operativo · Dati minimizzati nel contesto della dimostrazione. Le
        acquisizioni temporanee della sessione vengono rimosse alla chiusura.
      </div>
    </div>
  );
}
