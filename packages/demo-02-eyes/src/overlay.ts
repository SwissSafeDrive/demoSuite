import type { NormalizedLandmark } from '@mediapipe/tasks-vision';
import type { AlertLevel } from './face';

const LEFT_EYE = [33, 7, 163, 144, 145, 153, 154, 155, 133, 173, 157, 158, 159, 160, 161, 246];
const RIGHT_EYE = [362, 382, 381, 380, 374, 373, 390, 249, 263, 466, 388, 387, 386, 385, 384, 398];
const FACE_OVAL = [10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379, 378, 400, 377, 152, 148, 176, 149, 150, 136, 172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109];

const LEVEL_COLORS: Record<AlertLevel, string> = {
  clear: '#4caf50',
  drowsy: '#ff9800',
  'gaze-off': '#ffa726',
  danger: '#e30613',
};

export function drawFaceMesh(
  canvas: HTMLCanvasElement,
  landmarks: NormalizedLandmark[],
  level: AlertLevel,
): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const color = LEVEL_COLORS[level];
  const w = canvas.width;
  const h = canvas.height;

  const pt = (idx: number) => ({
    x: landmarks[idx].x * w,
    y: landmarks[idx].y * h,
  });

  // Face oval (subtle)
  ctx.strokeStyle = 'rgba(255,255,255,0.15)';
  ctx.lineWidth = 1;
  drawPolyline(ctx, FACE_OVAL.map(i => pt(i)), true);

  // Eye outlines (colored by alert level)
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  drawPolyline(ctx, LEFT_EYE.map(i => pt(i)), true);
  drawPolyline(ctx, RIGHT_EYE.map(i => pt(i)), true);

  // Eye center dots
  const leftCenter = avgPoints(LEFT_EYE.slice(0, 8).map(i => pt(i)));
  const rightCenter = avgPoints(RIGHT_EYE.slice(0, 8).map(i => pt(i)));
  ctx.fillStyle = color;
  fillCircle(ctx, leftCenter.x, leftCenter.y, 3);
  fillCircle(ctx, rightCenter.x, rightCenter.y, 3);
}

export function clearOverlay(canvas: HTMLCanvasElement): void {
  const ctx = canvas.getContext('2d');
  if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function drawPolyline(
  ctx: CanvasRenderingContext2D,
  pts: Array<{ x: number; y: number }>,
  closed: boolean,
) {
  if (pts.length < 2) return;
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
  if (closed) ctx.closePath();
  ctx.stroke();
}

function fillCircle(ctx: CanvasRenderingContext2D, x: number, y: number, r: number) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

function avgPoints(pts: Array<{ x: number; y: number }>) {
  const sum = pts.reduce((a, p) => ({ x: a.x + p.x, y: a.y + p.y }), { x: 0, y: 0 });
  return { x: sum.x / pts.length, y: sum.y / pts.length };
}
