import type { DetectedObject } from '@tensorflow-models/coco-ssd';
import type { AlertLevel, AnalysisResult } from './phone-in-hand';

interface State {
  frames: number;
  incidents: number;
  startTime: number;
  currentLevel: AlertLevel;
}

const state: State = {
  frames: 0,
  incidents: 0,
  startTime: 0,
  currentLevel: 'clear',
};

function el(id: string): HTMLElement {
  return document.getElementById(id) as HTMLElement;
}

export function setLoading(status: string, pct: number): void {
  el('loadingStatus').textContent = status;
  (el('progressFill') as HTMLElement).style.width = `${pct}%`;
}

export function showApp(): void {
  el('loadingScreen').style.display = 'none';
  state.startTime = Date.now();
}

export function setSystemOnline(): void {
  el('statusDot').className = 'status-dot status-dot--online';
  el('statusText').textContent = 'Live';
}

export function hideCameraPermission(): void {
  el('cameraPermission').classList.add('hidden');
}

export function updateAlert(result: AnalysisResult): void {
  const changed = result.level !== state.currentLevel;

  if (changed) {
    if (result.level === 'driver-distracted') {
      state.incidents++;
      logEvent('incident', result.message);
      playBeep();
    } else if (result.level === 'phone-detected' && state.currentLevel === 'clear') {
      logEvent('warning', result.message);
    } else if (result.level === 'clear' && state.currentLevel !== 'clear') {
      logEvent('info', 'All clear — no incidents');
    }
    state.currentLevel = result.level;
  }

  const configs: Record<AlertLevel, { bannerCls: string; icon: string; text: string; dotCls: string; label: string }> = {
    clear: {
      bannerCls: 'alert-banner alert-banner--clear',
      icon: '●',
      text: 'Monitoring active — no incidents detected',
      dotCls: 'indicator-dot indicator-dot--clear',
      label: 'CLEAR',
    },
    'phone-detected': {
      bannerCls: 'alert-banner alert-banner--warning',
      icon: '◆',
      text: 'Cell phone detected in frame',
      dotCls: 'indicator-dot indicator-dot--warning',
      label: 'PHONE DETECTED',
    },
    'driver-distracted': {
      bannerCls: 'alert-banner alert-banner--danger',
      icon: '▲',
      text: 'WARNING: Distracted driver detected',
      dotCls: 'indicator-dot indicator-dot--danger',
      label: 'DISTRACTED DRIVER',
    },
  };

  const cfg = configs[result.level];
  el('alertBanner').className = cfg.bannerCls;
  el('alertIcon').textContent = cfg.icon;
  el('alertText').textContent = cfg.text;
  el('indicatorDot').className = cfg.dotCls;
  el('indicatorText').textContent = cfg.label;
  el('statIncidents').textContent = state.incidents.toString();
}

export function updateDetections(predictions: DetectedObject[]): void {
  const list = el('detectionsList');
  const relevant = predictions
    .filter(p => ['cell phone', 'person'].includes(p.class) && p.score > 0.3)
    .sort((a, b) => b.score - a.score);

  if (relevant.length === 0) {
    list.innerHTML = '<div class="no-detections">No relevant objects detected</div>';
    return;
  }

  list.innerHTML = relevant.map(p => {
    const pct = Math.round(p.score * 100);
    const cls = p.class === 'cell phone' ? 'detection-item--phone' : 'detection-item--person';
    return `<div class="detection-item ${cls}">
      <span class="detection-class">${p.class}</span>
      <div class="detection-bar-wrapper"><div class="detection-bar" style="width:${pct}%"></div></div>
      <span class="detection-score">${pct}%</span>
    </div>`;
  }).join('');
}

export function incrementFrames(): void {
  state.frames++;
  el('statFrames').textContent = state.frames.toLocaleString();
}

export function updateFps(fps: number): void {
  el('statFps').textContent = fps.toString();
  el('videoFps').textContent = `FPS: ${fps}`;
}

export function updateDuration(): void {
  const s = Math.floor((Date.now() - state.startTime) / 1000);
  el('statDuration').textContent = `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;
}

export function setVideoInfo(w: number, h: number): void {
  el('videoResolution').textContent = `${w}×${h}`;
}

export function logEvent(type: 'info' | 'warning' | 'incident', message: string): void {
  const log = el('eventLog');
  const now = new Date();
  const t = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;

  const entry = document.createElement('div');
  entry.className = `log-entry log-entry--${type}`;
  entry.innerHTML = `<span class="log-time">${t}</span><span class="log-message">${message}</span>`;
  log.insertBefore(entry, log.firstChild);

  while (log.children.length > 60) log.removeChild(log.lastChild!);
}

function playBeep(): void {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 880;
    osc.type = 'sine';
    gain.gain.setValueAtTime(0.25, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.45);
  } catch { /* audio context unavailable */ }
}
