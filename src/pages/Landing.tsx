import { useLayoutEffect } from "react";
import { Link } from "react-router-dom";

export default function Landing() {
  useLayoutEffect(() => {
    document.body.style.overflow = "auto";
    document.documentElement.style.overflow = "auto";
    return () => {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
    };
  }, []);

  return (
    <>
      <style>{`
        :root {
          --swiss-red: #e30613;
          --text: #1a1a1a;
          --muted: #6b6b6b;
          --border: #e0e0e0;
          --bg: #fff;
          --bg2: #f5f5f5;
          --safe: #2e7d32;
        }
        .landing-header {
          display: flex; align-items: center; gap: 12px;
          padding: 0 48px; height: 60px;
          border-bottom: 1px solid var(--border);
        }
        .landing-logo { display: flex; align-items: center; gap: 10px; }
        .landing-logo svg { width: 28px; height: 28px; }
        .landing-logo-name { font-size: 13px; font-weight: 600; letter-spacing: 0.12em; }
        .landing-hero { max-width: 760px; margin: 80px auto 64px; padding: 0 48px; }
        .landing-eyebrow {
          font-size: 11px; font-weight: 600; letter-spacing: 0.14em;
          color: var(--swiss-red); text-transform: uppercase; margin-bottom: 16px;
        }
        .landing-hero h1 {
          font-size: 40px; font-weight: 700; line-height: 1.15;
          letter-spacing: -0.02em; margin-bottom: 20px;
        }
        .landing-hero p { font-size: 16px; color: var(--muted); line-height: 1.65; max-width: 560px; }
        .landing-demos {
          max-width: 960px; margin: 0 auto 80px; padding: 0 48px;
          display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px;
        }
        .demo-card {
          border: 1px solid var(--border); padding: 28px; border-radius: 4px;
          text-decoration: none; color: inherit; display: block;
          transition: border-color 0.15s, box-shadow 0.15s;
        }
        .demo-card--live:hover { border-color: var(--text); box-shadow: 0 2px 12px rgba(0,0,0,0.07); }
        .demo-number { font-size: 11px; font-weight: 600; letter-spacing: 0.1em; color: var(--muted); margin-bottom: 16px; }
        .demo-title { font-size: 18px; font-weight: 600; margin-bottom: 8px; }
        .demo-desc { font-size: 13px; color: var(--muted); line-height: 1.55; margin-bottom: 24px; }
        .demo-status {
          display: inline-flex; align-items: center; gap: 6px;
          font-size: 11px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase;
        }
        .demo-status--live { color: var(--safe); }
        .status-dot { width: 6px; height: 6px; border-radius: 50%; }
        .status-dot--live { background: var(--safe); animation: pulse 2s infinite; }
        @keyframes pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(46,125,50,0.4); }
          50% { box-shadow: 0 0 0 4px rgba(46,125,50,0); }
        }
        .demo-features { list-style: none; margin-bottom: 20px; }
        .demo-features li { font-size: 12px; color: var(--muted); padding: 3px 0 3px 14px; position: relative; }
        .demo-features li::before { content: '—'; position: absolute; left: 0; color: var(--border); }
        .landing-footer {
          border-top: 1px solid var(--border); padding: 24px 48px;
          font-size: 11px; color: var(--muted); display: flex; justify-content: space-between;
        }
        @media (max-width: 640px) {
          .landing-demos { grid-template-columns: 1fr; padding: 0 24px; }
          .landing-hero { padding: 0 24px; margin: 48px auto 40px; }
          .landing-hero h1 { font-size: 28px; }
          .landing-header { padding: 0 24px; }
          .landing-footer { padding: 24px; flex-direction: column; gap: 8px; }
        }
      `}</style>

      <header className="landing-header">
        <div className="landing-logo">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
            <rect width="32" height="32" fill="#e30613" rx="2" />
            <rect x="6" y="13" width="20" height="6" fill="white" />
            <rect x="13" y="6" width="6" height="20" fill="white" />
          </svg>
          <span className="landing-logo-name">SWISS SAFE DRIVE</span>
        </div>
      </header>

      <main>
        <div className="landing-hero">
          <div className="landing-eyebrow">AI Demo Suite — Agire Foundation Pitch</div>
          <h1>Making roads safer through artificial intelligence</h1>
          <p>
            A suite of AI-powered tools for real-time driver monitoring, hazard detection, and autonomous driving model training. Built to demonstrate
            how AI can meaningfully reduce road incidents.
          </p>
        </div>

        <div className="landing-demos">
          <Link to="/demo-02" className="demo-card demo-card--live">
            <div className="demo-number">DEMO 02</div>
            <div className="demo-title">Camera AI Analyzer</div>
            <div className="demo-desc">
              Real-time detection of distracted drivers using standard security camera footage. No specialized hardware required.
            </div>
            <ul className="demo-features">
              <li>Cell phone detection via COCO-SSD</li>
              <li>Driver–phone proximity analysis</li>
              <li>Live alert system with event log</li>
              <li>Runs entirely in browser (TensorFlow.js)</li>
            </ul>
            <div className="demo-status demo-status--live">
              <span className="status-dot status-dot--live" />
              Live Demo
            </div>
          </Link>

          <Link to="/demo-03" className="demo-card demo-card--live">
            <div className="demo-number">DEMO 03</div>
            <div className="demo-title">Eye Concentration Monitor</div>
            <div className="demo-desc">
              Detects driver drowsiness and distraction by tracking gaze direction and eye closure duration in real time.
            </div>
            <ul className="demo-features">
              <li>MediaPipe FaceLandmarker · 478 landmarks</li>
              <li>Blendshape-based gaze state analysis</li>
              <li>Drowsiness timer with escalating alerts</li>
              <li>Gaze compass direction indicator</li>
            </ul>
            <div className="demo-status demo-status--live">
              <span className="status-dot status-dot--live" />
              Live Demo
            </div>
          </Link>

          <Link to="/demo-04" className="demo-card demo-card--live">
            <div className="demo-number">DEMO 04</div>
            <div className="demo-title">In-Car Hazard Alert System</div>
            <div className="demo-desc">Dashcam-style AI that detects pedestrians, vehicles and cyclists and scores collision risk in real time.</div>
            <ul className="demo-features">
              <li>COCO-SSD object detection · 80 classes</li>
              <li>Proximity scoring by bounding box height</li>
              <li>Hazard level gauge (clear → danger)</li>
              <li>Simulated speed readout · audio alerts</li>
            </ul>
            <div className="demo-status demo-status--live">
              <span className="status-dot status-dot--live" />
              Live Demo
            </div>
          </Link>

          <Link to="/demo-05" className="demo-card demo-card--live">
            <div className="demo-number">DEMO 05</div>
            <div className="demo-title">AI Training Data Collector</div>
            <div className="demo-desc">
              Simulates a vehicle-mounted data collection device — auto-labeling scenes and streaming to a training dataset pipeline.
            </div>
            <ul className="demo-features">
              <li>COCO-SSD auto-labeling with annotation IDs</li>
              <li>Simulated GPS (Zurich) + IMU sensor fusion</li>
              <li>Dataset quality scoring per frame</li>
              <li>Batch sync to cloud every 100 frames</li>
            </ul>
            <div className="demo-status demo-status--live">
              <span className="status-dot status-dot--live" />
              Live Demo
            </div>
          </Link>
        </div>
      </main>

      <footer className="landing-footer">
        <span>Swiss Safe Drive — Confidential pitch materials for Agire Foundation</span>
        <span>Powered by TensorFlow.js · MediaPipe · Web Platform APIs</span>
      </footer>
    </>
  );
}
