import { useState } from "react";
import Dashboard from "./pages/Dashboard";
import RegistroDetalle from "./pages/RegistroDetalle";
import CamaraEnVivo from "./pages/CamaraEnVivo";

export default function App() {
  const [vista, setVista] = useState("dashboard");
  const [registroSeleccionado, setRegistroSeleccionado] = useState(null);

  const abrirRegistro = (registro) => {
    setRegistroSeleccionado(registro);
    setVista("detalle");
  };

  const volverDashboard = () => {
    setRegistroSeleccionado(null);
    setVista("dashboard");
  };

  const irACamara = () => {
    setRegistroSeleccionado(null);
    setVista("camara");
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>SwissSafeDrive — Pannello Agenti</h1>
        <nav className="app-nav">
          <button
            className={vista === "dashboard" ? "nav-btn active" : "nav-btn"}
            onClick={volverDashboard}
          >
            Registri
          </button>
          <button
            className={vista === "camara" ? "nav-btn active" : "nav-btn"}
            onClick={irACamara}
          >
            Camera in diretta
          </button>
        </nav>
        <span className="app-header-info">SwissSafeDrive — Demo istituzionale</span>
      </header>

      <main className="app-main">
        {vista === "dashboard" && (
          <Dashboard onAbrirRegistro={abrirRegistro} />
        )}
        {vista === "detalle" && registroSeleccionado && (
          <RegistroDetalle
            registro={registroSeleccionado}
            onVolver={volverDashboard}
          />
        )}
        {vista === "camara" && <CamaraEnVivo onVolver={volverDashboard} />}
      </main>

      <footer className="app-footer">
        <span>SwissSafeDrive v0.2.2 — Demo non destinata a uso operativo</span>
        <span className="aviso-legal">
          Privacy by Design · Dati minimizzati nel contesto della dimostrazione
        </span>
      </footer>
    </div>
  );
}
