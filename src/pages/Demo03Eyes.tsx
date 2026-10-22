import { useEffect, useLayoutEffect } from "react";
import { Link } from "react-router-dom";
import { init } from "../demos/eyes/init";
import "../demos/eyes/style.css";

export default function Demo03Eyes() {
  useLayoutEffect(() => {
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
    };
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    init(controller.signal).catch(console.error);
    return () => controller.abort();
  }, []);

  return (
    <div className="app">
      <div className="loading-screen" id="loadingScreen">
        <div className="loading-content">
          <div className="loading-logo">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" className="swiss-cross">
              <rect width="32" height="32" fill="#e30613" rx="2" />
              <rect x="6" y="13" width="20" height="6" fill="white" />
              <rect x="13" y="6" width="6" height="20" fill="white" />
            </svg>
            <span>SWISS SAFE DRIVE</span>
          </div>
          <div className="progress-bar">
            <div className="progress-fill" id="progressFill" />
          </div>
          <div className="loading-status" id="loadingStatus">
            Initializing...
          </div>
        </div>
      </div>

      <header className="header">
        <div className="header-brand">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" className="swiss-cross">
            <rect width="32" height="32" fill="#e30613" rx="2" />
            <rect x="6" y="13" width="20" height="6" fill="white" />
            <rect x="13" y="6" width="6" height="20" fill="white" />
          </svg>
          <span className="brand-name">SWISS SAFE DRIVE</span>
        </div>
        <div className="header-center">
          <span className="demo-badge">Eye Concentration Monitor — Demo 03</span>
        </div>
        <div className="header-status">
          <Link to="/" className="header-back">
            ← Demos
          </Link>
          <span className="system-status">
            <span className="status-dot" id="statusDot" />
            <span id="statusText">Offline</span>
          </span>
        </div>
      </header>

      <main className="main">
        <section className="video-section">
          <div className="alert-banner alert-banner--clear" id="alertBanner">
            <span className="alert-icon" id="alertIcon">
              ●
            </span>
            <span className="alert-text" id="alertText">
              Initializing face detection...
            </span>
          </div>
          <div className="video-wrapper">
            <video id="video" autoPlay muted playsInline />
            <canvas id="overlay" />
            <div className="camera-permission" id="cameraPermission">
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
              <div className="permission-title">Camera access required</div>
              <div className="permission-desc">Used locally — no data leaves your device</div>
              <button className="permission-btn" id="permissionBtn">
                Grant Camera Access
              </button>
            </div>
          </div>
          <div className="video-footer">
            <span className="video-info" id="videoResolution">
              —
            </span>
            <span className="video-info" id="videoFps">
              FPS: —
            </span>
            <span className="video-info">Model: MediaPipe FaceLandmarker</span>
            <span className="video-info">478 landmarks · Blendshapes</span>
          </div>
        </section>

        <aside className="panel">
          <div className="panel-section">
            <div className="panel-label">ATTENTION STATUS</div>
            <div className="status-indicator">
              <div className="indicator-dot indicator-dot--clear" id="indicatorDot" />
              <div className="indicator-text" id="indicatorText">
                Initializing
              </div>
            </div>
          </div>

          <div className="panel-section">
            <div className="panel-label">EYE METRICS</div>
            <div className="eye-meters">
              <div className="eye-row">
                <span className="eye-label">Left eye</span>
                <div className="eye-bar-wrap">
                  <div className="eye-bar eye-bar--left" id="eyeBarLeft" />
                </div>
                <span className="eye-pct" id="eyePctLeft">
                  —
                </span>
              </div>
              <div className="eye-row">
                <span className="eye-label">Right eye</span>
                <div className="eye-bar-wrap">
                  <div className="eye-bar eye-bar--right" id="eyeBarRight" />
                </div>
                <span className="eye-pct" id="eyePctRight">
                  —
                </span>
              </div>
            </div>
          </div>

          <div className="panel-section">
            <div className="panel-label">GAZE DIRECTION</div>
            <div className="gaze-compass" id="gazeCompass">
              <div className="compass-zone compass-zone--tl">↖</div>
              <div className="compass-zone compass-zone--tc">↑</div>
              <div className="compass-zone compass-zone--tr">↗</div>
              <div className="compass-zone compass-zone--ml">←</div>
              <div className="compass-zone compass-zone--mc active" id="gazeZone">
                ●
              </div>
              <div className="compass-zone compass-zone--mr">→</div>
              <div className="compass-zone compass-zone--bl">↙</div>
              <div className="compass-zone compass-zone--bc">↓</div>
              <div className="compass-zone compass-zone--br">↘</div>
            </div>
            <div className="gaze-state" id="gazeState">
              —
            </div>
          </div>

          <div className="panel-section">
            <div className="panel-label">SESSION STATISTICS</div>
            <div className="stats-grid">
              <div className="stat">
                <div className="stat-value" id="statDuration">
                  0:00
                </div>
                <div className="stat-label">Session duration</div>
              </div>
              <div className="stat">
                <div className="stat-value stat-value--danger" id="statIncidents">
                  0
                </div>
                <div className="stat-label">Alerts triggered</div>
              </div>
              <div className="stat">
                <div className="stat-value" id="statGazeOff">
                  0s
                </div>
                <div className="stat-label">Total gaze off-road</div>
              </div>
              <div className="stat">
                <div className="stat-value" id="statFps">
                  —
                </div>
                <div className="stat-label">Inference FPS</div>
              </div>
            </div>
          </div>

          <div className="panel-section panel-section--grow">
            <div className="panel-label">EVENT LOG</div>
            <div className="event-log" id="eventLog" />
          </div>

          <div className="panel-section panel-section--footer">
            <div className="model-info">
              <span>Blendshape analysis · Gaze estimation</span>
              <span>Alert thresholds: gaze 2s · closure 1.5s</span>
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
}
