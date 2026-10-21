import type { Registro, Estado } from './types';

interface Props {
  registros: Registro[];
  onOpenRegistro: (r: Registro) => void;
}

function estadoBadgeStyle(estado: Estado): string {
  const base = 'db-badge';
  switch (estado) {
    case 'pendiente': return `${base} ${base}--pendiente`;
    case 'revisado': return `${base} ${base}--revisado`;
    case 'confirmato': return `${base} ${base}--confirmato`;
    case 'descartato': return `${base} ${base}--descartato`;
  }
}

function estadoLabel(estado: Estado): string {
  switch (estado) {
    case 'pendiente': return 'In attesa';
    case 'revisado': return 'Revisionato';
    case 'confirmato': return 'Confermato';
    case 'descartato': return 'Scartato';
  }
}

function relativeTime(date: Date): string {
  const diff = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diff < 60) return `${diff} secondi fa`;
  const minutes = Math.floor(diff / 60);
  if (minutes < 60) return `${minutes} minut${minutes === 1 ? 'o' : 'i'} fa`;
  const hours = Math.floor(minutes / 60);
  return `${hours} or${hours === 1 ? 'a' : 'e'} fa`;
}

export default function RegistriList({ registros, onOpenRegistro }: Props) {
  const counts: Record<Estado, number> = {
    pendiente: 0,
    revisado: 0,
    confirmato: 0,
    descartato: 0,
  };
  for (const r of registros) counts[r.estado]++;

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
        <div className="db-stat-pill db-stat-pill--pendiente">
          <span className="db-stat-count">{counts.pendiente}</span>
          In attesa
        </div>
        <div className="db-stat-pill db-stat-pill--revisado">
          <span className="db-stat-count">{counts.revisado}</span>
          Revisionati
        </div>
        <div className="db-stat-pill db-stat-pill--confirmato">
          <span className="db-stat-count">{counts.confirmato}</span>
          Confermati
        </div>
        <div className="db-stat-pill db-stat-pill--descartato">
          <span className="db-stat-count">{counts.descartato}</span>
          Scartati
        </div>
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
                  <span className={estadoBadgeStyle(r.estado)}>
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
