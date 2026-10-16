import type { DetectedObject } from '@tensorflow-models/coco-ssd';
import type { VideoTransform } from './camera';

const CLASS_COLORS: Record<string, string> = {
  person: '#42a5f5',
  car: '#66bb6a',
  truck: '#66bb6a',
  bus: '#66bb6a',
  bicycle: '#ffa726',
  motorcycle: '#ffa726',
  'traffic light': '#ef5350',
  'stop sign': '#ef5350',
};

export function drawLabels(
  canvas: HTMLCanvasElement,
  predictions: DetectedObject[],
  transform: VideoTransform,
): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (const pred of predictions) {
    if (pred.score < 0.35) continue;

    const [bx, by, bw, bh] = pred.bbox;
    const x = bx * transform.scale + transform.offsetX;
    const y = by * transform.scale + transform.offsetY;
    const w = bw * transform.scale;
    const h = bh * transform.scale;

    const color = CLASS_COLORS[pred.class] ?? '#90a4ae';

    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    ctx.strokeRect(x, y, w, h);
    ctx.setLineDash([]);

    const label = `${pred.class} ${Math.round(pred.score * 100)}%`;
    ctx.font = '10px "JetBrains Mono", monospace';
    const tw = ctx.measureText(label).width;
    const ly = y > 18 ? y : y + h + 16;

    ctx.fillStyle = color;
    ctx.globalAlpha = 0.85;
    ctx.fillRect(x, ly - 14, tw + 6, 15);
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#000';
    ctx.fillText(label, x + 3, ly - 2);

    // Label ID badge (simulates dataset annotation ID)
    const idLabel = `#${Math.floor(Math.random() * 9999).toString().padStart(4, '0')}`;
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(x + w - 38, y, 38, 14);
    ctx.fillStyle = '#fff';
    ctx.font = '9px "JetBrains Mono", monospace';
    ctx.fillText(idLabel, x + w - 36, y + 10);
  }
}
