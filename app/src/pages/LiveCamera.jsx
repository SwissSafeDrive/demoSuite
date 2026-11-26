import { useEffect, useRef, useState } from "react";
import { uploadCapture } from "../api/client";

export default function LiveCamera({ onBack }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const intervalRef = useRef(null);

  const [active, setActive] = useState(false);
  const [demoMode, setDemoMode] = useState(false);
  const [checking, setChecking] = useState(true);
  const [autoCapture, setAutoCapture] = useState(false);
  const [captureCount, setCaptureCount] = useState(0);
  const [statusMessage, setStatusMessage] = useState(null);
  const [lastRecord, setLastRecord] = useState(null);
  const [intervalSeconds, setIntervalSeconds] = useState(5);

  const stopCamera = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setActive(false);
    setAutoCapture(false);
  };

  const startCamera = async () => {
    setChecking(true);
    setStatusMessage(null);
    try {
      if (
        !navigator.mediaDevices ||
        typeof navigator.mediaDevices.getUserMedia !== "function"
      ) {
        throw new Error("MediaDevices unavailable");
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
      setDemoMode(false);
      setActive(true);
    } catch (_err) {
      stopCamera();
      setDemoMode(true);
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, []);

  const captureFrame = async () => {
    if (!active || !videoRef.current || !canvasRef.current) return;
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
          const record = await uploadCapture(blob);
          setLastRecord(record);
          setCaptureCount((c) => c + 1);
          setStatusMessage("Frame saved locally.");
        } catch (_e) {
          setStatusMessage("Local service is busy. Try again.");
        }
      },
      "image/jpeg",
      0.85
    );
  };

  const toggleAutoCapture = () => {
    if (autoCapture) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      setAutoCapture(false);
    } else {
      intervalRef.current = setInterval(() => {
        captureFrame();
      }, intervalSeconds * 1000);
      setAutoCapture(true);
    }
  };

  return (
    <div className="case-detail-container">
      <div className="case-detail-header">
        <button onClick={onBack}>← Back to Candidate list</button>
        <h2>Live camera</h2>
      </div>

      {demoMode && !active && (
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
            DEMO MODE — NO CAMERA CONNECTED
          </div>
          <p style={{ fontSize: "0.9rem", color: "#475569", marginBottom: "14px" }}>
            A local camera is unavailable or permission was denied. You can review
            recorded footage and try the decision workflow from the Candidate list.
          </p>
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
            <button
              onClick={onBack}
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
              Open Candidate list
            </button>
            <button
              onClick={startCamera}
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
              Retry camera connection
            </button>
          </div>
        </div>
      )}

      {statusMessage && (
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
          {statusMessage}
        </div>
      )}

      <div
        style={{
          background: active ? "#000000" : "#0f172a",
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
            display: active ? "block" : "none",
          }}
          muted
          playsInline
        />

        {!active && (
          <div
            style={{
              textAlign: "center",
              color: "#cbd5e1",
              padding: "24px",
              maxWidth: "480px",
            }}
          >
            <p style={{ fontWeight: 700, fontSize: "1rem", marginBottom: "8px" }}>
              {checking
                ? "Checking camera availability…"
                : "DEMO MODE — NO CAMERA CONNECTED"}
            </p>
            <p style={{ fontSize: "0.85rem", color: "#94a3b8" }}>
              {checking
                ? "Requesting access to the local camera."
                : "Waiting for a live video feed."}
            </p>
          </div>
        )}
      </div>

      <canvas ref={canvasRef} style={{ display: "none" }} />

      <div className="case-detail-info">
        <h3>Controls</h3>
        <div
          style={{
            display: "flex",
            gap: "12px",
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          {!active ? (
            <>
              <button
                onClick={startCamera}
                disabled={checking}
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
                {checking ? "Checking…" : "Enable camera"}
              </button>
              <button
                onClick={onBack}
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
                Back to Candidate list
              </button>
            </>
          ) : (
            <>
              <button
                onClick={captureFrame}
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
                Capture frame
              </button>

              <button
                onClick={toggleAutoCapture}
                style={{
                  padding: "10px 20px",
                  background: autoCapture ? "#475569" : "#f59e0b",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontWeight: 600,
                }}
              >
                {autoCapture ? "Stop auto capture" : "Start auto capture"}
              </button>

              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  fontSize: "0.9rem",
                }}
              >
                Interval
                <input
                  type="number"
                  min="2"
                  max="60"
                  value={intervalSeconds}
                  onChange={(e) => setIntervalSeconds(parseInt(e.target.value) || 5)}
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
                  stopCamera();
                  setDemoMode(true);
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
                Disable camera
              </button>
            </>
          )}
        </div>
      </div>

      <div className="case-detail-info">
        <h3>Session statistics</h3>
        <div className="case-detail-info-grid">
          <div className="case-detail-info-item">
            <strong>Frames uploaded</strong>
            {captureCount}
          </div>
          <div className="case-detail-info-item">
            <strong>Camera status</strong>
            {active
              ? "Live camera active"
              : "DEMO MODE — NO CAMERA CONNECTED"}
          </div>
          <div className="case-detail-info-item">
            <strong>Automatic capture</strong>
            {autoCapture ? `Every ${intervalSeconds}s` : "Off"}
          </div>
          {lastRecord && (
            <div className="case-detail-info-item">
              <strong>Latest record ID</strong>
              {lastRecord.event_id}
            </div>
          )}
        </div>
      </div>

      <div className="case-detail-note">
        <strong>Privacy notice</strong> Privacy by Design · For demonstration only.
        The app removes temporary captures when the session ends.
      </div>
    </div>
  );
}
