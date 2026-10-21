import type { ScoredHazard, HazardLevel } from "./hazard-scorer";
import type { VideoTransform } from "./camera";

const CATEGORY_COLORS: Record<string, string> = {
  person: "#e30613",
  cyclist: "#ff9800",
  vehicle: "#f9a825",
  animal: "#ff7043",
};

export function drawHazards(canvas: HTMLCanvasElement, hazards: ScoredHazard[], level: HazardLevel, transform: VideoTransform): void {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (const h of hazards) {
    const [bx, by, bw, bh] = h.bbox;
    const x = bx * transform.scale + transform.offsetX;
    const y = by * transform.scale + transform.offsetY;
    const w = bw * transform.scale;
    const hh = bh * transform.scale;

    const color = CATEGORY_COLORS[h.category] ?? "#ffffff";
    const alpha = 0.5 + h.proximityScore * 0.5;

    ctx.strokeStyle = color;
    ctx.lineWidth = level === "danger" ? 2.5 : 1.5;
    ctx.globalAlpha = alpha;
    ctx.strokeRect(x, y, w, hh);
    ctx.globalAlpha = 1;

    const label = `${h.class}  ${Math.round(h.score * 100)}%`;
    ctx.font = '11px "JetBrains Mono", monospace';
    const tw = ctx.measureText(label).width;
    const ly = y > 20 ? y : y + hh + 18;

    ctx.fillStyle = color;
    ctx.globalAlpha = alpha;
    ctx.fillRect(x, ly - 16, tw + 8, 17);
    ctx.globalAlpha = 1;
    ctx.fillStyle = "#fff";
    ctx.fillText(label, x + 4, ly - 3);

    if (h.proximityScore > 0.5) {
      drawWarningCorners(ctx, x, y, w, hh, color);
    }
  }
}

function drawWarningCorners(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string) {
  const len = Math.min(14, w * 0.2, h * 0.2);
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(x, y + len);
  ctx.lineTo(x, y);
  ctx.lineTo(x + len, y);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x + w - len, y);
  ctx.lineTo(x + w, y);
  ctx.lineTo(x + w, y + len);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x, y + h - len);
  ctx.lineTo(x, y + h);
  ctx.lineTo(x + len, y + h);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x + w - len, y + h);
  ctx.lineTo(x + w, y + h);
  ctx.lineTo(x + w, y + h - len);
  ctx.stroke();
}
