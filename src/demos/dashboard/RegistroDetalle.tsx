import { useState } from 'react';
import type { Registro, Estado } from './types';

interface Props {
  registro: Registro;
  onDecide: (estado: Estado) => void;
  onBack: () => void;
}

function estadoLabel(estado: Estado): string {
  switch (estado) {
    case 'pendiente': return 'In attesa';
    case 'revisado': return 'Revisionato';
    case 'confirmato': return 'Confermato';
    case 'descartato': return 'Scartato';
  }
}

export default function RegistroDetalle({ registro, onDecide, onBack }: Props) {
  const [selected, setSelected] = useState<'confirmato' | 'descartato' | 'revisado' | ''>('');
  const isDecided = registro.estado !== 'pendiente';

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (selected) onDecide(selected);
  }

  return (
    <div className="db-det-root">
      <style>{`
        .db-det-root { font-family: system-ui, sans-serif; color: #1a1a1a; max-width: 860px; margin: 0 auto; padding: 24px; }
        .db-det-back { background: none; border: none; cursor: pointer; font-size: 13px; color: #6b6b6b; padding: 0; margin-bottom: 20px; display: flex; align-items: center; gap: 4px; }
        .db-det-back:hover { color: #1a1a1a; }
        .db-det-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
        @media (max-width: 640px) { .db-det-grid { grid-template-columns: 1fr; } }
        .db-det-img { width: 100%; aspect-ratio: 16/9; object-fit: cover; border-radius: 4px; background: #111; border: 1px solid #333; }
        .db-det-placeholder { width: 100%; aspect-ratio: 16/9; background: #111; border-radius: 4px; display: flex; align-items: center; justify-content: center; color: #555; font-size: 13px; border: 1px solid #333; }
        .db-det-meta { display: flex; flex-direction: column; gap: 12px; }
        .db-det-field { display: flex; flex-direction: column; gap: 2px; }
        .db-det-label { font-size: 10px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; color: #6b6b6b; }
        .db-det-value { font-size: 14px; }
        .db-det-nota { font-size: 12px; color: #555; font-style: italic; }
        .db-det-divider { border: none; border-top: 1px solid #e0e0e0; margin: 24px 0; }
        .db-det-decision-form { display: flex; flex-direction: column; gap: 16px; }
        .db-det-options { display: flex; gap: 12px; flex-wrap: wrap; }
        .db-det-option { display: flex; align-items: center; gap: 8px; cursor: pointer; padding: 10px 16px; border: 1px solid #e0e0e0; border-radius: 4px; font-size: 13px; transition: border-color 0.15s; }
        .db-det-option:has(input:checked) { border-color: #1a1a1a; font-weight: 600; }
        .db-det-option--confirmato:has(input:checked) { border-color: #2e7d32; background: #e8f5e9; }
        .db-det-option--descartato:has(input:checked) { border-color: #c62828; background: #fce4ec; }
        .db-det-option--revisado:has(input:checked) { border-color: #1565c0; background: #e3f2fd; }
        .db-det-submit { padding: 10px 24px; background: #1a1a1a; color: #fff; border: none; border-radius: 4px; font-size: 13px; font-weight: 600; cursor: pointer; align-self: flex-start; }
        .db-det-submit:disabled { background: #ccc; cursor: not-allowed; }
        .db-det-decided { padding: 16px; background: #f5f5f5; border-radius: 4px; font-size: 13px; }
        .db-det-decided strong { display: block; margin-bottom: 4px; }
        .db-det-badge { display: inline-block; padding: 2px 10px; border-radius: 10px; font-size: 12px; font-weight: 600; }
        .db-det-badge--confirmato { background: #e8f5e9; color: #1b5e20; }
        .db-det-badge--descartato { background: #fce4ec; color: #7f0000; }
        .db-det-badge--revisado { background: #e3f2fd; color: #0d47a1; }
        .db-det-badge--pendiente { background: #fff8e1; color: #795600; }
      `}</style>

      <button className="db-det-back" onClick={onBack}>← Torna alla lista</button>

      <div className="db-det-grid">
        <div>
          {registro.imagen_path ? (
            <img className="db-det-img" src={registro.imagen_path} alt="Immagine telecamera" />
          ) : (
            <div className="db-det-placeholder">Nessuna immagine disponibile</div>
          )}
        </div>

        <div className="db-det-meta">
          <div className="db-det-field">
            <span className="db-det-label">ID Registro</span>
            <span className="db-det-value">{registro.identificatore_demo}</span>
          </div>
          <div className="db-det-field">
            <span className="db-det-label">Data e ora</span>
            <span className="db-det-value">{registro.timestamp.toLocaleString('it-CH')}</span>
          </div>
          <div className="db-det-field">
            <span className="db-det-label">Ubicazione</span>
            <span className="db-det-value">{registro.ubicacion}</span>
          </div>
          <div className="db-det-field">
            <span className="db-det-label">Confidenza AI</span>
            <span className="db-det-value">{Math.round(registro.confianza * 100)}%</span>
          </div>
          <div className="db-det-field">
            <span className="db-det-label">Origine</span>
            <span className="db-det-value">{registro.origen === 'simulato' ? 'Simulato' : 'Telecamera'}</span>
          </div>
          <div className="db-det-field">
            <span className="db-det-label">Nota legale</span>
            <span className="db-det-nota">{registro.nota_legal}</span>
          </div>
        </div>
      </div>

      <hr className="db-det-divider" />

      {isDecided ? (
        <div className="db-det-decided">
          <strong>Decisione registrata</strong>
          <span className={`db-det-badge db-det-badge--${registro.estado}`}>
            {estadoLabel(registro.estado)}
          </span>
          {registro.fecha_decision && (
            <span style={{ marginLeft: 12, color: '#6b6b6b', fontSize: 12 }}>
              {registro.fecha_decision.toLocaleString('it-CH')}
            </span>
          )}
          {registro.agente_id && (
            <span style={{ marginLeft: 12, color: '#6b6b6b', fontSize: 12 }}>
              Agente: {registro.agente_id}
            </span>
          )}
        </div>
      ) : (
        <form className="db-det-decision-form" onSubmit={handleSubmit}>
          <div className="db-det-label">Registra decisione</div>
          <div className="db-det-options">
            <label className="db-det-option db-det-option--confirmato">
              <input type="radio" name="decision" value="confirmato" onChange={() => setSelected('confirmato')} />
              Confermato
            </label>
            <label className="db-det-option db-det-option--descartato">
              <input type="radio" name="decision" value="descartato" onChange={() => setSelected('descartato')} />
              Scartato
            </label>
            <label className="db-det-option db-det-option--revisado">
              <input type="radio" name="decision" value="revisado" onChange={() => setSelected('revisado')} />
              In revisione
            </label>
          </div>
          <button className="db-det-submit" type="submit" disabled={!selected}>
            Conferma decisione
          </button>
        </form>
      )}
    </div>
  );
}
