import type { DetectedObject } from '@tensorflow-models/coco-ssd';
import type { AlertLevel } from './phone-in-hand';

export interface VideoTransform {
  offsetX: number;
  offsetY: number;
  scale: number;
}

const BOX_COLORS: Record<string, string> = {
  person: '#1976d2',
  'cell phone': '#f9a825',
  distracted: '#e30613',
};

const FONT = '11px "JetBrains Mono", monospace';

export function drawDetections(
  canvas: HTMLCanvasElement,
  predictions: DetectedObject[],
  level: AlertLevel,
  transform: VideoTransform,
): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const isDistracted = level === 'driver-distracted';

  for (const pred of predictions) {
    if (!['person', 'cell phone'].includes(pred.class)) continue;
    if (pred.score < 0.3) continue;

    const [bx, by, bw, bh] = pred.bbox;
    const x = bx * transform.scale + transform.offsetX;
    const y = by * transform.scale + transform.offsetY;
    const w = bw * transform.scale;
    const h = bh * transform.scale;

    const color = isDistracted
      ? BOX_COLORS['distracted']
      : BOX_COLORS[pred.class] ?? '#ffffff';

    ctx.strokeStyle = color;
    ctx.lineWidth = isDistracted ? 2.5 : 1.5;
    ctx.strokeRect(x, y, w, h);

    if (isDistracted && pred.class === 'cell phone') {
      drawCorners(ctx, x, y, w, h, color);
    }

    const label = `${pred.class}  ${Math.round(pred.score * 100)}%`;
    ctx.font = FONT;
    const textW = ctx.measureText(label).width;
    const labelY = y > 20 ? y : y + h + 18;

    ctx.fillStyle = color;
    ctx.fillRect(x, labelY - 16, textW + 8, 17);
    ctx.fillStyle = '#fff';
    ctx.fillText(label, x + 4, labelY - 3);
  }
}

function drawCorners(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
  color: string,
) {
  const len = Math.min(16, w * 0.2, h * 0.2);
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;

  // top-left
  ctx.beginPath(); ctx.moveTo(x, y + len); ctx.lineTo(x, y); ctx.lineTo(x + len, y); ctx.stroke();
  // top-right
  ctx.beginPath(); ctx.moveTo(x + w - len, y); ctx.lineTo(x + w, y); ctx.lineTo(x + w, y + len); ctx.stroke();
  // bottom-left
  ctx.beginPath(); ctx.moveTo(x, y + h - len); ctx.lineTo(x, y + h); ctx.lineTo(x + len, y + h); ctx.stroke();
  // bottom-right
  ctx.beginPath(); ctx.moveTo(x + w - len, y + h); ctx.lineTo(x + w, y + h); ctx.lineTo(x + w, y + h - len); ctx.stroke();
}
