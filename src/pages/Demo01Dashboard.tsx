import { useReducer, useState } from "react";
import { Link } from "react-router-dom";
import type { RecordState, DashboardRecord } from "../demos/dashboard/types";
import { seedDataset, applyDecision, addSimulatedRecord } from "../demos/dashboard/state";
import { cameraImages } from "../demos/dashboard/assets/index";
import RecordsList from "../demos/dashboard/RecordsList";
import RecordDetail from "../demos/dashboard/RecordDetail";
import LiveCamera from "../demos/dashboard/LiveCamera";

type View = "list" | "detail" | "camera";

type Action = { type: "DECIDE"; id: number; state: RecordState; operatorId: string } | { type: "ADD_RECORD"; imageUrl: string };

function reducer(state: DashboardRecord[], action: Action): DashboardRecord[] {
  switch (action.type) {
    case "DECIDE":
      return applyDecision(state, action.id, action.state, action.operatorId);
    case "ADD_RECORD":
      return addSimulatedRecord(state, action.imageUrl);
    default:
      return state;
  }
}

export default function Demo01Dashboard() {
  const [records, dispatch] = useReducer(reducer, undefined, () => seedDataset(cameraImages));
  const [view, setView] = useState<View>("list");
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const selected = selectedId !== null ? (records.find((r) => r.id === selectedId) ?? null) : null;

  function openRecord(r: DashboardRecord) {
    setSelectedId(r.id);
    setView("detail");
  }

  function handleDecide(state: RecordState) {
    if (selectedId === null) return;
    dispatch({ type: "DECIDE", id: selectedId, state, operatorId: "operator-demo" });
    setView("list");
    setSelectedId(null);
  }

  function handleCapture(imageUrl: string) {
    dispatch({ type: "ADD_RECORD", imageUrl });
    setView("list");
  }

  return (
    <div style={{ minHeight: "100vh", fontFamily: "inherit", color: "#1a1a1a" }}>
      <style>{`
        .db-header {
          display: flex; align-items: center; justify-content: space-between;
          padding: 0 24px; height: 56px; border-bottom: 1px solid #e0e0e0;
          background: #fff; position: sticky; top: 0; z-index: 10;
        }
        .db-brand { display: flex; align-items: center; gap: 10px; font-size: 13px; font-weight: 600; letter-spacing: 0.08em; }
        .db-demo-badge { font-size: 11px; font-weight: 600; letter-spacing: 0.08em; background: #e30613; color: #fff; padding: 3px 10px; border-radius: 2px; }
        .db-header-right { display: flex; align-items: center; gap: 16px; }
        .db-back-link { font-size: 12px; color: #6b6b6b; text-decoration: none; }
        .db-back-link:hover { color: #1a1a1a; }
        .db-nav { display: flex; gap: 0; border-bottom: 1px solid #e0e0e0; background: #fff; padding: 0 24px; }
        .db-nav-btn { background: none; border: none; border-bottom: 2px solid transparent; padding: 10px 16px; font-size: 13px; cursor: pointer; color: #6b6b6b; margin-bottom: -1px; }
        .db-nav-btn--active { color: #e30613; border-bottom-color: #e30613; font-weight: 600; }
        .db-nav-btn:hover:not(.db-nav-btn--active) { color: #1a1a1a; }
        .db-content { max-width: 1100px; margin: 0 auto; }
        .db-section-title { font-size: 20px; font-weight: 700; padding: 20px 24px 4px; }
        .db-section-sub { font-size: 12px; color: #6b6b6b; padding: 0 24px 16px; }
      `}</style>

      <header className="db-header">
        <div className="db-brand">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="24" height="24">
            <rect width="32" height="32" fill="#e30613" rx="2" />
            <rect x="6" y="13" width="20" height="6" fill="white" />
            <rect x="13" y="6" width="6" height="20" fill="white" />
          </svg>
          SWISS SAFE DRIVE
          <span className="db-demo-badge">DEMO 01</span>
        </div>
        <div className="db-header-right">
          <span style={{ fontSize: 13, fontWeight: 600 }}>Police review dashboard</span>
          <Link to="/" className="db-back-link">
            ← Demo
          </Link>
        </div>
      </header>

      <div className="db-nav">
        <button
          className={`db-nav-btn${view === "list" ? " db-nav-btn--active" : ""}`}
          onClick={() => {
            setView("list");
            setSelectedId(null);
          }}
        >
          Records
        </button>
        <button className={`db-nav-btn${view === "camera" ? " db-nav-btn--active" : ""}`} onClick={() => setView("camera")}>
          Live camera
        </button>
      </div>

      <div className="db-content">
        {view === "list" && (
          <>
            <div className="db-section-title">Infraction records</div>
            <div className="db-section-sub">AI-flagged infractions using simulated demo data</div>
            <RecordsList records={records} onOpenRecord={openRecord} />
          </>
        )}

        {view === "detail" && selected && (
          <RecordDetail
            record={selected}
            onDecide={handleDecide}
            onBack={() => {
              setView("list");
              setSelectedId(null);
            }}
          />
        )}

        {view === "camera" && <LiveCamera onCapture={handleCapture} onBack={() => setView("list")} />}
      </div>
    </div>
  );
}
