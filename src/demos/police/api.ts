import type { AssetStatus, Candidate, ClipPlayback, Decision, ManualFlag, Pass, PassCrops, ReviewState } from "./types";

const API_BASE = "/api";

async function request(path: string, options: RequestInit = {}) {
  const headers = new Headers(options.headers);
  const token = import.meta.env.DEV ? import.meta.env.VITE_SSD_SESSION_TOKEN : undefined;
  if (token) headers.set("X-SSD-Session", token);
  if (options.body) headers.set("Content-Type", "application/json");

  const response = await fetch(`${API_BASE}${path}`, { ...options, headers, redirect: "error" });
  if (!response.ok) throw new Error(`Demo API request failed (${response.status}).`);
  return response;
}

async function fetchJson<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await request(path, options);
  if (!response.headers.get("content-type")?.includes("application/json")) {
    throw new Error("The demo API returned an unexpected response.");
  }
  return response.json();
}

const passPath = (passId: string) => `/passes/${encodeURIComponent(passId)}`;

export async function getHealth(signal?: AbortSignal) {
  const health = await fetchJson<{ ok: true }>("/health", { signal });
  if (health?.ok !== true) throw new Error("The demo API is unavailable.");
  return health;
}

export function getAssetStatus(signal?: AbortSignal) {
  return fetchJson<AssetStatus>("/assets/status", { signal });
}

export function pasteSas(url: string) {
  return fetchJson<{ ok: true }>("/assets/sas", { method: "POST", body: JSON.stringify({ url }) });
}

export function retryAssets() {
  return fetchJson<{ ok: true }>("/assets/retry", { method: "POST" });
}

export function getCandidates() {
  return fetchJson<Candidate[]>("/candidates");
}

export function getPass(passId: string) {
  return fetchJson<Pass & Decision>(passPath(passId));
}

export function submitDecision(passId: string, state: ReviewState) {
  return fetchJson<Decision>(`${passPath(passId)}/decision`, {
    method: "PATCH",
    body: JSON.stringify({ state, operator_id: "demo_operator" }),
  });
}

export function flagPass(passId: string) {
  return fetchJson<ManualFlag>(`${passPath(passId)}/flag`, {
    method: "PATCH",
    body: JSON.stringify({ flagged_manually: true }),
  });
}

export function getClipPlayback(clipId: string) {
  return fetchJson<ClipPlayback>(`/clips/${encodeURIComponent(clipId)}/playback`);
}

export function getPassCrops(passId: string) {
  return fetchJson<PassCrops>(`${passPath(passId)}/crops`);
}

export async function fetchWindshieldCrop(url: string, signal?: AbortSignal) {
  if (!url.startsWith(`${API_BASE}/passes/`)) throw new Error("Invalid crop image path.");
  const response = await request(url.slice(API_BASE.length), { signal });
  return response.blob();
}
