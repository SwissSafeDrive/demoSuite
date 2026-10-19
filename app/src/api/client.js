import { invoke } from "@tauri-apps/api/core";

let cachedConfig = null;

async function getSessionConfig() {
  if (cachedConfig && cachedConfig.sessionToken) {
    return cachedConfig;
  }
  try {
    const cfg = await invoke("get_backend_config");
    if (cfg && cfg.session_token) {
      cachedConfig = {
        apiUrl: cfg.api_url || "http://127.0.0.1:8765",
        sessionToken: cfg.session_token,
      };
      return cachedConfig;
    }
  } catch (_err) {
    try {
      const token = await invoke("get_session_token");
      if (token) {
        cachedConfig = {
          apiUrl: "http://127.0.0.1:8765",
          sessionToken: token,
        };
        return cachedConfig;
      }
    } catch (_innerErr) {
      // Fallback only if invoked outside Tauri container
    }
  }
  return {
    apiUrl: "http://127.0.0.1:8765",
    sessionToken: "",
  };
}

async function fetchJSON(path, options = {}) {
  const { apiUrl, sessionToken } = await getSessionConfig();
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };
  if (sessionToken) {
    headers["X-SSD-Session"] = sessionToken;
  }

  const res = await fetch(`${apiUrl}${path}`, {
    ...options,
    headers,
  });
  if (!res.ok) {
    throw new Error(`Errore API: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

export async function getRegistros() {
  return fetchJSON("/api/registros");
}

export async function getEstadisticas() {
  return fetchJSON("/api/estadisticas");
}

export async function getRegistro(id) {
  return fetchJSON(`/api/registros/${id}`);
}

export async function tomarDecision(id, estado, agenteId = "agente_demo") {
  return fetchJSON(`/api/registros/${id}/decision`, {
    method: "PATCH",
    body: JSON.stringify({ estado, agente_id: agenteId }),
  });
}

export async function subirCaptura(
  blob,
  ubicacion = "Camera locale",
  confianza = 0.75
) {
  const { apiUrl, sessionToken } = await getSessionConfig();
  const formData = new FormData();
  formData.append("file", blob, "frame.jpg");
  formData.append("ubicacion", ubicacion);
  formData.append("confianza", confianza.toString());

  const headers = {};
  if (sessionToken) {
    headers["X-SSD-Session"] = sessionToken;
  }

  const res = await fetch(`${apiUrl}/api/capturas/upload`, {
    method: "POST",
    headers,
    body: formData,
  });

  if (!res.ok) {
    throw new Error(`Errore upload: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

export async function fetchImagenBlobUrl(registroId) {
  const { apiUrl, sessionToken } = await getSessionConfig();
  const headers = {};
  if (sessionToken) {
    headers["X-SSD-Session"] = sessionToken;
  }

  const res = await fetch(`${apiUrl}/api/imagenes/${registroId}`, {
    method: "GET",
    headers,
  });
  if (!res.ok) {
    throw new Error(`Immagine non disponibile (${res.status})`);
  }
  const blob = await res.blob();
  return URL.createObjectURL(blob);
}
