import { useState, useEffect, useMemo } from "react";
import { getRegistros, getEstadisticas } from "../api/client";

export default function Dashboard({ onAbrirRegistro }) {
  const [registros, setRegistros] = useState([]);
  const [estadisticas, setEstadisticas] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  const [filtroEstado, setFiltroEstado] = useState("todos");
  const [filtroConfianza, setFiltroConfianza] = useState(0);
  const [filtroBusqueda, setFiltroBusqueda] = useState("");

  const cargarDatos = async () => {
    setCargando(true);
    setError(null);
    try {
      const [regs, stats] = await Promise.all([
        getRegistros(),
        getEstadisticas(),
      ]);
      setRegistros(regs);
      setEstadisticas(stats);
    } catch (e) {
      setError(e.message);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const registrosFiltrados = useMemo(() => {
    return registros.filter((r) => {
      if (filtroEstado !== "todos" && r.estado !== filtroEstado) return false;
      if (r.confianza < filtroConfianza) return false;
      if (
        filtroBusqueda &&
        !r.ubicacion.toLowerCase().includes(filtroBusqueda.toLowerCase()) &&
        !r.inf_id.toLowerCase().includes(filtroBusqueda.toLowerCase())
      )
        return false;
      return true;
    });
  }, [registros, filtroEstado, filtroConfianza, filtroBusqueda]);

  const getBadgeClass = (confianza) => {
    if (confianza >= 0.85) return "badge-alta";
    if (confianza >= 0.7) return "badge-media";
    return "badge-baja";
  };

  const formatFecha = (iso) => {
    const d = new Date(iso);
    return d.toLocaleString("it-CH", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (cargando) {
    return (
      <div style={{ padding: "60px", textAlign: "center", color: "#6b7280" }}>
        <p>Caricamento registri…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: "40px", textAlign: "center" }}>
        <p style={{ color: "#1e3a8a", fontWeight: 600, marginBottom: "12px" }}>
          Servizio locale in fase di avvio o non raggiungibile
        </p>
        <p style={{ color: "#6b7280", fontSize: "0.85rem", marginBottom: "16px" }}>
          {error}
        </p>
        <button
          onClick={cargarDatos}
          style={{
            padding: "8px 16px",
            background: "#1e3a8a",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
          }}
        >
          Riprova
        </button>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h2>Registri indiciari</h2>
        <p>
          Elenco dei registri rilevati dal sistema. Privacy by Design — demo non
          destinata a uso operativo · Dati minimizzati nel contesto della
          dimostrazione. La decisione sanzionatoria spetta sempre ed
          esclusivamente all'operatore umano.
        </p>
      </div>

      {estadisticas && (
        <div className="estadisticas">
          <div className="stat-card">
            <h3>Totale</h3>
            <p className="stat-num">{estadisticas.total}</p>
          </div>
          <div className="stat-card">
            <h3>Pendenti</h3>
            <p className="stat-num">{estadisticas.pendientes}</p>
          </div>
          <div className="stat-card">
            <h3>Revisati</h3>
            <p className="stat-num">{estadisticas.revisados}</p>
          </div>
          <div className="stat-card">
            <h3>Confidenza media</h3>
            <p className="stat-num">
              {(estadisticas.confianza_media * 100).toFixed(1)}%
            </p>
          </div>
        </div>
      )}

      <div className="filtro-bar">
        <label>
          Stato
          <select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
          >
            <option value="todos">Tutti</option>
            <option value="pendiente">Pendente</option>
            <option value="revisado">Revisato</option>
            <option value="confirmado">Confermato</option>
            <option value="descartado">Scartato</option>
          </select>
        </label>

        <label>
          Confidenza minima: {(filtroConfianza * 100).toFixed(0)}%
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={filtroConfianza}
            onChange={(e) => setFiltroConfianza(parseFloat(e.target.value))}
          />
        </label>

        <label>
          Cerca
          <input
            type="text"
            placeholder="Luogo o ID…"
            value={filtroBusqueda}
            onChange={(e) => setFiltroBusqueda(e.target.value)}
          />
        </label>

        <button onClick={cargarDatos}>Aggiorna</button>

        <button
          onClick={() => {
            setFiltroEstado("todos");
            setFiltroConfianza(0);
            setFiltroBusqueda("");
          }}
        >
          Azzera filtri
        </button>
      </div>

      {registrosFiltrados.length === 0 ? (
        <p style={{ padding: "40px", textAlign: "center", color: "#6b7280" }}>
          Nessun registro corrisponde ai filtri selezionati.
        </p>
      ) : (
        <div className="registros-grid">
          {registrosFiltrados.map((r) => (
            <div
              key={r.id}
              className="registro-card"
              onClick={() => onAbrirRegistro(r)}
            >
              <div className="registro-card-imagen">
                <span>Immagine evento — demo</span>
                <span className={`registro-card-badge ${getBadgeClass(r.confianza)}`}>
                  {(r.confianza * 100).toFixed(0)}%
                </span>
              </div>
              <div className="registro-card-info">
                <h4>{r.ubicacion}</h4>
                <p>{formatFecha(r.timestamp)}</p>
                <p>
                  Stato: <strong>{r.estado}</strong>
                </p>
                <p className="confianza">
                  Confidenza: {(r.confianza * 100).toFixed(1)}%
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
