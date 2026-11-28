import type { DashboardRecord, RecordState } from "./types";
import { stateLabel, stateBadgeClass } from "./stateMeta";

interface Props {
  records: DashboardRecord[];
  onOpenRecord: (r: DashboardRecord) => void;
}

function relativeTime(date: Date): string {
  const diff = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diff < 60) return `${diff} second${diff === 1 ? "" : "s"} ago`;
  const minutes = Math.floor(diff / 60);
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours} hour${hours === 1 ? "" : "s"} ago`;
}

const STATES: RecordState[] = ["pending", "reviewed", "confirmed", "discarded"];

export default function RecordsList({ records, onOpenRecord }: Props) {
  const counts = Object.fromEntries(STATES.map((e) => [e, records.filter((r) => r.state === e).length])) as Record<RecordState, number>;

  const sorted = [...records].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

  return (
    <div className="db-list-root">
      <style>{`
        .db-list-root { font-family: inherit; color: #1a1a1a; }
        .db-stats-bar {
          display: flex; gap: 12px; padding: 16px 24px;
          border-bottom: 1px solid #e0e0e0; background: #f5f5f5;
          flex-wrap: wrap;
        }
        .db-stat-pill {
          display: flex; align-items: center; gap: 8px;
          padding: 6px 14px; border-radius: 20px; font-size: 12px;
          font-weight: 600; border: 1px solid transparent;
        }
        .db-stat-pill--pending { background: #fff8e1; border-color: #ffc107; color: #795600; }
        .db-stat-pill--reviewed { background: #e3f2fd; border-color: #42a5f5; color: #0d47a1; }
        .db-stat-pill--confirmed { background: #e8f5e9; border-color: #66bb6a; color: #1b5e20; }
        .db-stat-pill--discarded { background: #fce4ec; border-color: #ef5350; color: #7f0000; }
        .db-stat-count { font-size: 16px; font-weight: 700; }
        .db-table { width: 100%; border-collapse: collapse; }
        .db-table th {
          text-align: left; padding: 10px 16px; font-size: 11px;
          font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase;
          color: #6b6b6b; border-bottom: 2px solid #e0e0e0; background: #fafafa;
        }
        .db-table td { padding: 12px 16px; border-bottom: 1px solid #f0f0f0; font-size: 13px; }
        .db-row { cursor: pointer; transition: background 0.1s; }
        .db-row:hover { background: #f5f5f5; }
        .db-row:hover td:first-child { text-decoration: underline; }
        .db-badge {
          display: inline-block; padding: 2px 8px; border-radius: 10px;
          font-size: 11px; font-weight: 600;
        }
        .db-badge--pending { background: #fff8e1; color: #795600; }
        .db-badge--reviewed { background: #e3f2fd; color: #0d47a1; }
        .db-badge--confirmed { background: #e8f5e9; color: #1b5e20; }
        .db-badge--discarded { background: #fce4ec; color: #7f0000; }
        .db-empty { text-align: center; padding: 48px; color: #6b6b6b; font-size: 14px; }
        .db-confidence { font-variant-numeric: tabular-nums; }
        .db-time { color: #6b6b6b; }
      `}</style>

      <div className="db-stats-bar">
        {STATES.map((e) => (
          <div key={e} className={`db-stat-pill db-stat-pill--${e}`}>
            <span className="db-stat-count">{counts[e]}</span>
            {stateLabel(e)}
          </div>
        ))}
      </div>

      {sorted.length === 0 ? (
        <div className="db-empty">No records to display.</div>
      ) : (
        <table className="db-table">
          <thead>
            <tr>
              <th>Record ID</th>
              <th>Location</th>
              <th>Detected</th>
              <th>Confidence</th>
              <th>State</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((r) => (
              <tr key={r.id} className="db-row" onClick={() => onOpenRecord(r)}>
                <td>{r.demo_id}</td>
                <td>{r.location}</td>
                <td className="db-time">{relativeTime(r.timestamp)}</td>
                <td className="db-confidence">{Math.round(r.confidence * 100)}%</td>
                <td>
                  <span className={stateBadgeClass(r.state)}>{stateLabel(r.state)}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
