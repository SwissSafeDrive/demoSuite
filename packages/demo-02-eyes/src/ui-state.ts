import type { AlertLevel, GazeResult } from './face';

interface State {
  incidents: number;
  gazeOffTotalMs: number;
  startTime: number;
  currentLevel: AlertLevel;
  lastLevelChange: number;
}

const state: State = {
  incidents: 0,
  gazeOffTotalMs: 0,
  startTime: 0,
  currentLevel: 'clear',
  lastLevelChange: 0,
};

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

export function updateDuration(): void {
  const s = Math.floor((Date.now() - state.startTime) / 1000);
  el('statDuration').textContent = `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;
  el('statGazeOff').textContent = `${Math.floor(state.gazeOffTotalMs / 1000)}s`;
}

export function updateEyeMeters(gaze: GazeResult): void {
  const leftPct = Math.round(gaze.blinkLeft * 100);
  const rightPct = Math.round(gaze.blinkRight * 100);

  const barL = el('eyeBarLeft') as HTMLElement;
  barL.style.width = `${leftPct}%`;
  barL.className = `eye-bar eye-bar--left${leftPct > 55 ? ' closed' : ''}`;
  el('eyePctLeft').textContent = `${leftPct}%`;

  const barR = el('eyeBarRight') as HTMLElement;
  barR.style.width = `${rightPct}%`;
  barR.className = `eye-bar eye-bar--right${rightPct > 55 ? ' closed' : ''}`;
  el('eyePctRight').textContent = `${rightPct}%`;
}

export function updateGazeCompass(state_arg: string): void {
  const zoneMap: Record<string, string> = {
    forward: 'compass-zone--mc',
    side: 'compass-zone--ml',
    up: 'compass-zone--tc',
    down: 'compass-zone--bc',
    closed: 'compass-zone--mc',
  };

  const all = el('gazeCompass').querySelectorAll('.compass-zone');
  all.forEach(z => { z.classList.remove('active', 'danger'); });

  const zoneClass = zoneMap[state_arg] ?? 'compass-zone--mc';
  const zone = el('gazeCompass').querySelector(`.${zoneClass}`);
  if (zone) {
    zone.classList.add(state_arg === 'side' || state_arg === 'up' ? 'danger' : 'active');
  }

  const labels: Record<string, string> = {
    forward: 'Looking forward',
    side: 'Looking to the side',
    up: 'Looking up / mirror',
    down: 'Looking down',
    closed: 'Eyes closed',
  };
  el('gazeState').textContent = labels[state_arg] ?? '—';
}

const ALERT_CONFIGS: Record<AlertLevel, { bannerCls: string; icon: string; text: string; dotCls: string; label: string }> = {
  clear: {
    bannerCls: 'alert-banner alert-banner--clear',
    icon: '●', text: 'Driver attention normal — eyes on road',
    dotCls: 'indicator-dot indicator-dot--clear', label: 'ATTENTIVE',
  },
  drowsy: {
    bannerCls: 'alert-banner alert-banner--drowsy',
    icon: '◆', text: 'Drowsiness detected — eyes closing',
    dotCls: 'indicator-dot indicator-dot--drowsy', label: 'DROWSY',
  },
  'gaze-off': {
    bannerCls: 'alert-banner alert-banner--gaze-off',
    icon: '◆', text: 'Gaze off road — driver distracted',
    dotCls: 'indicator-dot indicator-dot--gaze-off', label: 'GAZE OFF ROAD',
  },
  danger: {
    bannerCls: 'alert-banner alert-banner--danger',
    icon: '▲', text: 'DANGER: Driver not watching the road',
    dotCls: 'indicator-dot indicator-dot--danger', label: 'DANGER',
  },
};

export function updateAlert(level: AlertLevel, gazeState: string): void {
  if (level !== state.currentLevel) {
    if (level === 'danger' || (level === 'gaze-off' && state.currentLevel === 'clear')) {
      state.incidents++;
      logEvent('incident', ALERT_CONFIGS[level].text);
      playBeep(level === 'danger' ? 1200 : 880);
    } else if (level === 'clear' && state.currentLevel !== 'clear') {
      logEvent('info', 'Driver attention restored');
    }

    if (state.currentLevel !== 'clear') {
      state.gazeOffTotalMs += Date.now() - state.lastLevelChange;
    }
    state.lastLevelChange = Date.now();
    state.currentLevel = level;
    el('statIncidents').textContent = state.incidents.toString();
  }

  const cfg = ALERT_CONFIGS[level];
  el('alertBanner').className = cfg.bannerCls;
  el('alertIcon').textContent = cfg.icon;
  el('alertText').textContent = cfg.text;
  el('indicatorDot').className = cfg.dotCls;
  el('indicatorText').textContent =
    level !== 'clear' ? cfg.label : (gazeState === 'forward' ? 'ATTENTIVE' : cfg.label);
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
    osc.frequency.value = freq; osc.type = 'sine';
    gain.gain.setValueAtTime(0.25, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
    osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.5);
  } catch { /* unavailable */ }
}
