import { useEffect, useLayoutEffect } from "react";
import { Link } from "react-router-dom";
import { init } from "../demos/data/init";
import "../demos/data/style.css";

export default function Demo05Data() {
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
          <span className="demo-badge">AI Training Data Collector — Demo 05</span>
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
          <div className="alert-banner alert-banner--collecting" id="alertBanner">
            <span className="alert-icon" id="alertIcon">
              ◉
            </span>
            <span className="alert-text" id="alertText">
              Initializing data collection pipeline...
            </span>
          </div>
          <div className="video-wrapper">
            <video id="video" autoPlay muted playsInline />
            <canvas id="overlay" />
            <div className="camera-permission" id="cameraPermission">
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
              </svg>
              <div className="permission-title">Camera access required</div>
              <div className="permission-desc">Simulates a vehicle-mounted data collection device</div>
              <button className="permission-btn" id="permissionBtn">
                Activate Collector
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
            <span className="video-info" id="gpsDisplay">
              GPS: —
            </span>
            <span className="video-info" id="syncStatus">
              Sync: Idle
            </span>
          </div>
        </section>

        <aside className="panel">
          <div className="panel-section">
            <div className="panel-label">COLLECTION STATUS</div>
            <div className="status-indicator">
              <div className="indicator-dot indicator-dot--collecting" id="indicatorDot" />
              <div className="indicator-text" id="indicatorText">
                Initializing
              </div>
            </div>
          </div>

          <div className="panel-section">
            <div className="panel-label">SENSOR DATA</div>
            <div className="sensor-grid">
              <div className="sensor-row">
                <span className="sensor-label">Latitude</span>
                <span className="sensor-value" id="sLat">
                  —
                </span>
              </div>
              <div className="sensor-row">
                <span className="sensor-label">Longitude</span>
                <span className="sensor-value" id="sLon">
                  —
                </span>
              </div>
              <div className="sensor-row">
                <span className="sensor-label">Accel X</span>
                <span className="sensor-value" id="sAccX">
                  —
                </span>
              </div>
              <div className="sensor-row">
                <span className="sensor-label">Accel Y</span>
                <span className="sensor-value" id="sAccY">
                  —
                </span>
              </div>
              <div className="sensor-row">
                <span className="sensor-label">Accel Z</span>
                <span className="sensor-value" id="sAccZ">
                  —
                </span>
              </div>
              <div className="sensor-row">
                <span className="sensor-label">Quality</span>
                <span className="sensor-value" id="sQuality">
                  —
                </span>
              </div>
            </div>
          </div>

          <div className="panel-section">
            <div className="panel-label">DATASET STATISTICS</div>
            <div className="stats-grid">
              <div className="stat">
                <div className="stat-value" id="statFrames">
                  0
                </div>
                <div className="stat-label">Frames captured</div>
              </div>
              <div className="stat">
                <div className="stat-value" id="statLabels">
                  0
                </div>
                <div className="stat-label">Labels generated</div>
              </div>
              <div className="stat">
                <div className="stat-value" id="statClasses">
                  0
                </div>
                <div className="stat-label">Unique classes</div>
              </div>
              <div className="stat">
                <div className="stat-value" id="statSize">
                  0 MB
                </div>
                <div className="stat-label">Dataset size</div>
              </div>
            </div>
          </div>

          <div className="panel-section">
            <div className="panel-label">CLASS DISTRIBUTION</div>
            <div className="class-bars" id="classBars">
              <div className="no-detections">Waiting for detections...</div>
            </div>
          </div>

          <div className="panel-section panel-section--grow">
            <div className="panel-label">UPLOAD QUEUE</div>
            <div className="event-log" id="eventLog" />
          </div>

          <div className="panel-section panel-section--footer">
            <div className="model-info">
              <span>Auto-labeling: COCO-SSD · GPS: simulated (Zurich)</span>
              <span>IMU: simulated · Sync: batch every 100 frames</span>
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
}
