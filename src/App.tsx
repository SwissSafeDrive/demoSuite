import { lazy, Suspense } from "react";
import { HashRouter, Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing";

const Demo01Camera = lazy(() => import("./pages/Demo01Camera"));
const Demo02Eyes = lazy(() => import("./pages/Demo02Eyes"));
const Demo03Hazard = lazy(() => import("./pages/Demo03Hazard"));
const Demo04Data = lazy(() => import("./pages/Demo04Data"));

function LoadingFallback() {
  return (
    <div className="app-loading">
      <div className="app-loading__inner">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="40" height="40">
          <rect width="32" height="32" fill="#e30613" rx="2" />
          <rect x="6" y="13" width="20" height="6" fill="white" />
          <rect x="13" y="6" width="6" height="20" fill="white" />
        </svg>
        <span>Loading…</span>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <HashRouter>
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/demo-01" element={<Demo01Camera />} />
          <Route path="/demo-02" element={<Demo02Eyes />} />
          <Route path="/demo-03" element={<Demo03Hazard />} />
          <Route path="/demo-04" element={<Demo04Data />} />
        </Routes>
      </Suspense>
    </HashRouter>
  );
}
