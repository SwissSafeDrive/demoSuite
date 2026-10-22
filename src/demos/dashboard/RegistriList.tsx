import type { Registro, Estado } from './types';
import { estadoLabel, estadoBadgeClass } from './estadoMeta';

interface Props {
  registros: Registro[];
  onOpenRegistro: (r: Registro) => void;
}

function relativeTime(date: Date): string {
  const diff = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diff < 60) return `${diff} secondi fa`;
  const minutes = Math.floor(diff / 60);
  if (minutes < 60) return `${minutes} minut${minutes === 1 ? 'o' : 'i'} fa`;
  const hours = Math.floor(minutes / 60);
  return `${hours} or${hours === 1 ? 'a' : 'e'} fa`;
}

const ESTADOS: Estado[] = ['pendiente', 'revisado', 'confirmato', 'descartato'];

export default function RegistriList({ registros, onOpenRegistro }: Props) {
  const counts = Object.fromEntries(
    ESTADOS.map((e) => [e, registros.filter((r) => r.estado === e).length]),
  ) as Record<Estado, number>;

  const sorted = [...registros].sort(
    (a, b) => b.timestamp.getTime() - a.timestamp.getTime(),
  );

  return (
    <div className="db-list-root">
      <style>{`
        .db-list-root { font-family: system-ui, sans-serif; color: #1a1a1a; }
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
        .db-stat-pill--pendiente { background: #fff8e1; border-color: #ffc107; color: #795600; }
        .db-stat-pill--revisado { background: #e3f2fd; border-color: #42a5f5; color: #0d47a1; }
        .db-stat-pill--confirmato { background: #e8f5e9; border-color: #66bb6a; color: #1b5e20; }
        .db-stat-pill--descartato { background: #fce4ec; border-color: #ef5350; color: #7f0000; }
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
        .db-badge--pendiente { background: #fff8e1; color: #795600; }
        .db-badge--revisado { background: #e3f2fd; color: #0d47a1; }
        .db-badge--confirmato { background: #e8f5e9; color: #1b5e20; }
        .db-badge--descartato { background: #fce4ec; color: #7f0000; }
        .db-empty { text-align: center; padding: 48px; color: #6b6b6b; font-size: 14px; }
        .db-confidence { font-variant-numeric: tabular-nums; }
        .db-time { color: #6b6b6b; }
      `}</style>

      <div className="db-stats-bar">
        {ESTADOS.map((e) => (
          <div key={e} className={`db-stat-pill db-stat-pill--${e}`}>
            <span className="db-stat-count">{counts[e]}</span>
            {estadoLabel(e)}
          </div>
        ))}
      </div>

      {sorted.length === 0 ? (
        <div className="db-empty">Nessun registro presente.</div>
      ) : (
        <table className="db-table">
          <thead>
            <tr>
              <th>ID Registro</th>
              <th>Ubicazione</th>
              <th>Rilevato</th>
              <th>Confidenza</th>
              <th>Stato</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((r) => (
              <tr key={r.id} className="db-row" onClick={() => onOpenRegistro(r)}>
                <td>{r.identificatore_demo}</td>
                <td>{r.ubicacion}</td>
                <td className="db-time">{relativeTime(r.timestamp)}</td>
                <td className="db-confidence">{Math.round(r.confianza * 100)}%</td>
                <td>
                  <span className={estadoBadgeClass(r.estado)}>
                    {estadoLabel(r.estado)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
