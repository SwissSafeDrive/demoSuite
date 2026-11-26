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
    sessionToken: import.meta.env.DEV ? import.meta.env.VITE_SSD_SESSION_TOKEN || "" : "",
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
    throw new Error(`API error: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

export async function getRecords() {
  return fetchJSON("/api/records");
}

export async function getStatistics() {
  return fetchJSON("/api/statistics");
}

export async function getRecord(id) {
  return fetchJSON(`/api/records/${id}`);
}

export async function submitDecision(id, state, operatorId = "demo_operator") {
  return fetchJSON(`/api/records/${id}/decision`, {
    method: "PATCH",
    body: JSON.stringify({ state, operator_id: operatorId }),
  });
}

export async function uploadCapture(
  blob,
  location = "Local camera",
  confidence = 0.75
) {
  const { apiUrl, sessionToken } = await getSessionConfig();
  const formData = new FormData();
  formData.append("file", blob, "frame.jpg");
  formData.append("location", location);
  formData.append("confidence", confidence.toString());

  const headers = {};
  if (sessionToken) {
    headers["X-SSD-Session"] = sessionToken;
  }

  const res = await fetch(`${apiUrl}/api/captures/upload`, {
    method: "POST",
    headers,
    body: formData,
  });

  if (!res.ok) {
    throw new Error(`Upload error: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

export async function fetchImageBlobUrl(recordId) {
  const { apiUrl, sessionToken } = await getSessionConfig();
  const headers = {};
  if (sessionToken) {
    headers["X-SSD-Session"] = sessionToken;
  }

  const res = await fetch(`${apiUrl}/api/images/${recordId}`, {
    method: "GET",
    headers,
  });
  if (!res.ok) {
    throw new Error(`Image unavailable (${res.status})`);
  }
  const blob = await res.blob();
  return URL.createObjectURL(blob);
}

export async function getPass(id) {
  return fetchJSON(`/api/passes/${encodeURIComponent(id)}`);
}

export async function getClipPlayback(clipId) {
  const { apiUrl } = await getSessionConfig();
  const playback = await fetchJSON(`/api/clips/${encodeURIComponent(clipId)}/playback`);
  return { ...playback, mediaUrl: new URL(playback.mediaPath, apiUrl).href };
}

export async function getCandidates() {
  return fetchJSON("/api/candidates");
}

export async function openPassRecord(passId) {
  return fetchJSON(`/api/passes/${encodeURIComponent(passId)}/record`, { method: "POST" });
}
