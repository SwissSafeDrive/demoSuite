import type { DetectedObject } from "@tensorflow-models/coco-ssd";
import type { SensorSnapshot } from "./sensors";

interface State {
  frames: number;
  labels: number;
  totalBytes: number;
  classes: Map<string, number>;
  startTime: number;
  nextSync: number;
}

const state: State = {
  frames: 0,
  labels: 0,
  totalBytes: 0,
  classes: new Map(),
  startTime: 0,
  nextSync: 100,
};

const el = (id: string) => document.getElementById(id) as HTMLElement;

export function resetState(): void {
  state.frames = 0;
  state.labels = 0;
  state.totalBytes = 0;
  state.classes = new Map();
  state.startTime = 0;
  state.nextSync = 100;
}

export function setLoading(status: string, pct: number): void {
  el("loadingStatus").textContent = status;
  (el("progressFill") as HTMLElement).style.width = `${pct}%`;
}

export function showApp(): void {
  el("loadingScreen").style.display = "none";
  state.startTime = Date.now();
}

export function setSystemOnline(): void {
  el("statusDot").className = "status-dot status-dot--online";
  el("statusText").textContent = "Collecting";
}

export function hideCameraPermission(): void {
  el("cameraPermission").classList.add("hidden");
}

export function setVideoInfo(w: number, h: number): void {
  el("videoResolution").textContent = `${w}×${h}`;
}

export function updateFps(fps: number): void {
  el("videoFps").textContent = `FPS: ${fps}`;
}

export function updateSensors(snap: SensorSnapshot): void {
  el("sLat").textContent = snap.lat.toFixed(6);
  el("sLon").textContent = snap.lon.toFixed(6);
  el("sAccX").textContent = snap.accelX.toFixed(3);
  el("sAccY").textContent = snap.accelY.toFixed(3);
  el("sAccZ").textContent = snap.accelZ.toFixed(3);
  el("gpsDisplay").textContent = `GPS: ${snap.lat.toFixed(4)}, ${snap.lon.toFixed(4)}`;
}

export function updateDataset(predictions: DetectedObject[], frameBytes: number, quality: number): void {
  state.frames++;
  state.labels += predictions.length;
  state.totalBytes += frameBytes;

  predictions.forEach((p) => {
    if (p.score >= 0.35) {
      state.classes.set(p.class, (state.classes.get(p.class) ?? 0) + 1);
    }
  });

  el("statFrames").textContent = state.frames.toLocaleString();
  el("statLabels").textContent = state.labels.toLocaleString();
  el("statClasses").textContent = state.classes.size.toString();
  el("statSize").textContent = `${(state.totalBytes / 1_000_000).toFixed(1)} MB`;
  el("sQuality").textContent = `${Math.round(quality * 100)}%`;

  const qualityPct = quality * 100;
  if (qualityPct < 40) {
    el("alertBanner").className = "alert-banner alert-banner--low-quality";
    el("alertIcon").textContent = "◆";
    el("alertText").textContent = "Low quality frames — coverage insufficient";
    el("indicatorDot").className = "indicator-dot indicator-dot--low-quality";
    el("indicatorText").textContent = "LOW QUALITY";
  } else {
    el("alertBanner").className = "alert-banner alert-banner--collecting";
    el("alertIcon").textContent = "◉";
    el("alertText").textContent = `Collecting — ${state.frames.toLocaleString()} frames captured`;
    el("indicatorDot").className = "indicator-dot indicator-dot--collecting";
    el("indicatorText").textContent = "COLLECTING";
  }

  if (state.frames >= state.nextSync) {
    state.nextSync += 100;
    triggerSync();
  }

  updateClassBars();
}

function updateClassBars(): void {
  const list = el("classBars");
  if (state.classes.size === 0) {
    list.innerHTML = '<div class="no-detections">Waiting for detections...</div>';
    return;
  }

  const max = Math.max(...state.classes.values());
  const sorted = [...state.classes.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6);

  list.innerHTML = sorted
    .map(
      ([cls, count]) =>
        `<div class="class-row">
      <span class="class-name">${cls}</span>
      <div class="class-bar-wrap"><div class="class-bar" style="width:${Math.round((count / max) * 100)}%"></div></div>
      <span class="class-count">${count}</span>
    </div>`,
    )
    .join("");
}

function triggerSync(): void {
  el("syncStatus").textContent = "Sync: Uploading...";
  el("alertBanner").className = "alert-banner alert-banner--syncing";
  el("alertIcon").textContent = "↑";
  el("alertText").textContent = `Syncing batch — ${state.frames.toLocaleString()} frames to cloud`;
  el("indicatorDot").className = "indicator-dot indicator-dot--syncing";
  el("indicatorText").textContent = "SYNCING";
  logEvent("sync", `Batch sync — ${state.frames} frames, ${state.classes.size} classes, ${(state.totalBytes / 1_000_000).toFixed(1)} MB`);

  setTimeout(() => {
    el("syncStatus").textContent = "Sync: Complete";
    logEvent("sync", "Sync complete — data committed to training dataset");
    setTimeout(() => {
      el("syncStatus").textContent = "Sync: Idle";
    }, 3000);
  }, 2000);
}

export function logEvent(type: "sync" | "warning" | "info", message: string): void {
  const log = el("eventLog");
  const now = new Date();
  const t = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}:${now.getSeconds().toString().padStart(2, "0")}`;
  const entry = document.createElement("div");
  entry.className = `log-entry log-entry--${type}`;
  entry.innerHTML = `<span class="log-time">${t}</span><span class="log-message">${message}</span>`;
  log.insertBefore(entry, log.firstChild);
  while (log.children.length > 60 && log.lastChild) log.removeChild(log.lastChild);
}
