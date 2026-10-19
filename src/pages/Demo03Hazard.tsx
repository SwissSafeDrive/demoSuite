import { useEffect, useLayoutEffect } from "react";
import { Link } from "react-router-dom";
import { init } from "../demos/hazard/init";
import "../demos/hazard/style.css";

export default function Demo03Hazard() {
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
          <span className="demo-badge">In-Car Hazard Alert System — Demo 03</span>
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
              Initializing hazard detection...
            </span>
          </div>
          <div className="video-wrapper">
            <video id="video" autoPlay muted playsInline />
            <canvas id="overlay" />
            <div className="camera-permission" id="cameraPermission">
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <polygon points="23 7 16 12 23 17 23 7" />
                <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
              </svg>
              <div className="permission-title">Dashcam view required</div>
              <div className="permission-desc">Point your camera at the road ahead or a scene with traffic</div>
              <button className="permission-btn" id="permissionBtn">
                Start Camera
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
            <span className="video-info" id="simSpeed">
              Speed: — km/h
            </span>
            <span className="video-info">Model: COCO-SSD · 80 classes</span>
          </div>
        </section>

        <aside className="panel">
          <div className="panel-section">
            <div className="panel-label">HAZARD STATUS</div>
            <div className="status-indicator">
              <div className="indicator-dot indicator-dot--clear" id="indicatorDot" />
              <div className="indicator-text" id="indicatorText">
                Initializing
              </div>
            </div>
          </div>

          <div className="panel-section">
            <div className="panel-label">HAZARD SCORE</div>
            <div className="hazard-gauge">
              <div className="gauge-track">
                <div className="gauge-fill" id="gaugeFill" />
                <div className="gauge-zones">
                  <span className="gauge-zone-label" style={{ left: 0 }}>
                    0
                  </span>
                  <span className="gauge-zone-label" style={{ left: "33%" }}>
                    Low
                  </span>
                  <span className="gauge-zone-label" style={{ left: "60%" }}>
                    High
                  </span>
                  <span className="gauge-zone-label" style={{ right: 0 }}>
                    MAX
                  </span>
                </div>
              </div>
              <div className="gauge-value" id="gaugeValue">
                0%
              </div>
            </div>
          </div>

          <div className="panel-section">
            <div className="panel-label">DETECTED HAZARDS</div>
            <div className="hazards-list" id="hazardsList">
              <div className="no-detections">No hazards detected</div>
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
                <div className="stat-value stat-value--danger" id="statWarnings">
                  0
                </div>
                <div className="stat-label">Warnings issued</div>
              </div>
              <div className="stat">
                <div className="stat-value" id="statMaxScore">
                  0%
                </div>
                <div className="stat-label">Peak hazard score</div>
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
            <div className="panel-label">ALERT LOG</div>
            <div className="event-log" id="eventLog" />
          </div>

          <div className="panel-section panel-section--footer">
            <div className="model-info">
              <span>Hazard classes: person · vehicle · cyclist</span>
              <span>Proximity scored by bounding box height</span>
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
}
