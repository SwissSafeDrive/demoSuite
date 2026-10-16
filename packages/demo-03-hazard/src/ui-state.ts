import type { HazardLevel, HazardAnalysis } from './hazard-scorer';

interface State {
  warnings: number;
  maxScore: number;
  startTime: number;
  currentLevel: HazardLevel;
}

const state: State = { warnings: 0, maxScore: 0, startTime: 0, currentLevel: 'clear' };

const el = (id: string) => document.getElementById(id) as HTMLElement;

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

export function setVideoInfo(w: number, h: number): void {
  el('videoResolution').textContent = `${w}×${h}`;
}

export function updateFps(fps: number): void {
  el('videoFps').textContent = `FPS: ${fps}`;
  el('statFps').textContent = fps.toString();
}

export function updateSimSpeed(kmh: number): void {
  el('simSpeed').textContent = `Speed: ${kmh} km/h`;
}

export function updateDuration(): void {
  const s = Math.floor((Date.now() - state.startTime) / 1000);
  el('statDuration').textContent = `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;
}

const LEVEL_CONFIGS: Record<HazardLevel, { bannerCls: string; icon: string; dotCls: string; label: string }> = {
  clear: { bannerCls: 'alert-banner alert-banner--clear', icon: '●', dotCls: 'indicator-dot indicator-dot--clear', label: 'CLEAR' },
  caution: { bannerCls: 'alert-banner alert-banner--caution', icon: '◆', dotCls: 'indicator-dot indicator-dot--caution', label: 'CAUTION' },
  warning: { bannerCls: 'alert-banner alert-banner--warning', icon: '▲', dotCls: 'indicator-dot indicator-dot--warning', label: 'WARNING' },
  danger: { bannerCls: 'alert-banner alert-banner--danger', icon: '▲', dotCls: 'indicator-dot indicator-dot--danger', label: 'DANGER' },
};

export function updateHazardDisplay(analysis: HazardAnalysis): void {
  const { level, totalScore, hazards, message } = analysis;
  const pct = Math.round(totalScore * 100);

  if (pct > state.maxScore) {
    state.maxScore = pct;
    el('statMaxScore').textContent = `${pct}%`;
  }

  if (level !== state.currentLevel) {
    if (level === 'warning' || level === 'danger') {
      state.warnings++;
      el('statWarnings').textContent = state.warnings.toString();
      logEvent(level === 'danger' ? 'incident' : 'warning', message);
      playBeep(level === 'danger' ? 1100 : 700);
    } else if (level === 'clear' && state.currentLevel !== 'clear') {
      logEvent('info', 'Road clear');
    }
    state.currentLevel = level;
  }

  const cfg = LEVEL_CONFIGS[level];
  el('alertBanner').className = cfg.bannerCls;
  el('alertIcon').textContent = cfg.icon;
  el('alertText').textContent = message;
  el('indicatorDot').className = cfg.dotCls;
  el('indicatorText').textContent = cfg.label;

  const gaugeFill = el('gaugeFill') as HTMLElement;
  gaugeFill.style.width = `${100 - pct}%`;
  el('gaugeValue').textContent = `${pct}%`;

  const list = el('hazardsList');
  if (hazards.length === 0) {
    list.innerHTML = '<div class="no-detections">No hazards detected</div>';
    return;
  }
  list.innerHTML = hazards.slice(0, 5).map(h => {
    const proxPct = Math.round(h.proximityScore * 100);
    const cls = `hazard-item hazard-item--${h.category}`;
    return `<div class="${cls}">
      <span class="hazard-class">${h.class}</span>
      <div class="hazard-bar-wrap"><div class="hazard-bar" style="width:${proxPct}%"></div></div>
      <span class="hazard-prox">${proxPct}%</span>
    </div>`;
  }).join('');
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

function playBeep(freq: number): void {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.25, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
    osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.4);
  } catch { /* unavailable */ }
}
