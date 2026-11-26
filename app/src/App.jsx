import { useState } from "react";
import Dashboard from "./pages/Dashboard";
import CaseDetail from "./pages/CaseDetail";
import CamaraEnVivo from "./pages/CamaraEnVivo";

export default function App() {
  const [vista, setVista] = useState("dashboard");
  const [registroSeleccionado, setRegistroSeleccionado] = useState(null);

  const [passSelection, setPassSelection] = useState(null);

  function openPass(passId, clipId) {
    setPassSelection({ passId, clipId });
    setVista("case-detail");
  }

  function clearPass() {
    setPassSelection(null);
  }

  const abrirRegistro = (registro) => {
    clearPass();
    setRegistroSeleccionado(registro);
    setVista("case-detail");
  };

  const volverDashboard = () => {
    clearPass();
    setRegistroSeleccionado(null);
    setVista("dashboard");
  };

  const irACamara = () => {
    clearPass();
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
        {vista === "case-detail" && (
          <CaseDetail
            record={registroSeleccionado}
            selection={passSelection}
            onOpenPass={openPass}
            onClearPass={clearPass}
            onBack={volverDashboard}
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
