import { formatSignal, SHOW_CONFIDENCE_PERCENT } from "../display";
import type { ClipPlayback } from "../types";

type OverlayFrames = Pick<ClipPlayback, "clip" | "frames">;
type Dimensions = { width: number; height: number };

export function frameAtTime(time: number, fps: number) {
  return Math.floor(time * fps + 1e-7);
}

function videoProjection(viewport: Dimensions, source: Dimensions, clip: Dimensions) {
  const scale = Math.min(viewport.width / source.width, viewport.height / source.height);
  const width = source.width * scale;
  const height = source.height * scale;
  return {
    left: (viewport.width - width) / 2,
    top: (viewport.height - height) / 2,
    scaleX: width / clip.width,
    scaleY: height / clip.height,
  };
}

export function vehicleAtPoint(playback: OverlayFrames, time: number, viewport: Dimensions, source: Dimensions, x: number, y: number) {
  const { clip } = playback;
  if (!source.width || !source.height) return null;
  const { left, top, scaleX, scaleY } = videoProjection(viewport, source, clip);
  const sourceX = (x - left) / scaleX;
  const sourceY = (y - top) / scaleY;
  if (sourceX < 0 || sourceX > clip.width || sourceY < 0 || sourceY > clip.height) return null;

  let hit = null;
  let smallestArea = Infinity;
  for (const {
    passId,
    box: [x1, y1, x2, y2],
  } of vehiclesAtTime(playback, time)) {
    if (sourceX < x1 || sourceX > x2 || sourceY < y1 || sourceY > y2) continue;
    const area = (x2 - x1) * (y2 - y1);
    if (area < smallestArea) {
      hit = passId;
      smallestArea = area;
    }
  }
  return hit;
}

export function vehiclesAtTime({ clip, frames }: OverlayFrames, time: number) {
  return frames[frameAtTime(time, clip.fps)] ?? [];
}

type OverlayVehicle = ClipPlayback["frames"][number][number];

export function overlayLabel(signal: NonNullable<OverlayVehicle["signal"]>, showPercent = SHOW_CONFIDENCE_PERCENT) {
  return formatSignal(signal.label, signal.percent, showPercent);
}

function blurPass(source: Uint8ClampedArray, target: Uint8ClampedArray, width: number, height: number, radius: number, horizontal: boolean) {
  const length = horizontal ? width : height;
  const lines = horizontal ? height : width;
  const step = horizontal ? 4 : width * 4;
  const stride = horizontal ? width * 4 : 4;
  const count = radius * 2 + 1;

  for (let line = 0; line < lines; line++) {
    for (let channel = 0; channel < 3; channel++) {
      const start = line * stride + channel;
      let sum = source[start] * (radius + 1);
      for (let i = 1; i <= radius; i++) {
        sum += source[start + Math.min(i, length - 1) * step];
      }
      for (let i = 0; i < length; i++) {
        target[start + i * step] = sum / count;
        sum -= source[start + Math.max(0, i - radius) * step];
        sum += source[start + Math.min(length - 1, i + radius + 1) * step];
      }
    }
  }
}

function blurPlate(
  context: CanvasRenderingContext2D,
  video: HTMLVideoElement,
  sample: CanvasRenderingContext2D | null,
  box: OverlayVehicle["box"],
  clip: Dimensions,
) {
  const [x1, y1, x2, y2] = box;
  const left = Math.max(0, x1);
  const top = Math.max(0, y1 + 0.65 * (y2 - y1));
  const width = Math.min(clip.width, x2) - left;
  const height = Math.min(clip.height, y2 + 8) - top;
  if (width <= 0 || height <= 0) return;

  if (sample) {
    try {
      const sampleScale = Math.min(1, 96 / Math.max(width, height));
      const sampleWidth = Math.max(1, Math.round(width * sampleScale));
      const sampleHeight = Math.max(1, Math.round(height * sampleScale));
      const scaleX = video.videoWidth / clip.width;
      const scaleY = video.videoHeight / clip.height;
      sample.canvas.width = sampleWidth;
      sample.canvas.height = sampleHeight;
      sample.drawImage(video, left * scaleX, top * scaleY, width * scaleX, height * scaleY, 0, 0, sampleWidth, sampleHeight);

      // Approximate the v5 Gaussian with a separable box blur on the sampled pixels.
      const pixels = sample.getImageData(0, 0, sampleWidth, sampleHeight);
      const intermediate = new Uint8ClampedArray(pixels.data.length);
      const sigma = Math.max(8, (x2 - x1) * 0.045);
      const radius = Math.max(1, Math.round(Math.sqrt(3) * sigma * sampleScale));
      blurPass(pixels.data, intermediate, sampleWidth, sampleHeight, radius, true);
      blurPass(intermediate, pixels.data, sampleWidth, sampleHeight, radius, false);
      sample.putImageData(pixels, 0, 0);
      context.drawImage(sample.canvas, left, top, width, height);
      return;
    } catch (error) {
      if (!(error instanceof DOMException)) throw error;
    }
  }
  context.fillStyle = "#1a1a1a";
  context.fillRect(left, top, width, height);
}

export function drawVideoOverlay(
  canvas: HTMLCanvasElement,
  video: HTMLVideoElement,
  sample: CanvasRenderingContext2D | null,
  playback: ClipPlayback,
  time: number,
  selectedPassId: string,
) {
  const context = canvas.getContext("2d");
  if (!context) return;
  const width = Math.round(canvas.clientWidth * window.devicePixelRatio);
  const height = Math.round(canvas.clientHeight * window.devicePixelRatio);
  if (canvas.width !== width) canvas.width = width;
  if (canvas.height !== height) canvas.height = height;
  context.resetTransform();
  context.clearRect(0, 0, width, height);
  if (!width || !height || !video.videoWidth || video.readyState < 2) return;

  const { clip } = playback;
  const { left, top, scaleX, scaleY } = videoProjection({ width, height }, { width: video.videoWidth, height: video.videoHeight }, clip);
  const vehicles = vehiclesAtTime(playback, time);

  context.save();
  try {
    context.translate(left, top);
    context.scale(scaleX, scaleY);
    context.beginPath();
    context.rect(0, 0, clip.width, clip.height);
    context.clip();

    for (const { box } of vehicles) {
      blurPlate(context, video, sample, box, clip);
    }

    const vehiclesWithSignalsLast = [...vehicles].sort((a, b) => Number(!!a.signal) - Number(!!b.signal));
    const unit = window.devicePixelRatio / scaleX;
    context.lineWidth = 2 * unit;
    context.font = `600 ${12 * unit}px Inter, sans-serif`;
    for (const { box, quad, boxColor, quadColor, signal } of vehiclesWithSignalsLast) {
      const [x1, y1, x2, y2] = box;
      context.strokeStyle = boxColor;
      context.strokeRect(x1, y1, x2 - x1, y2 - y1);
      if (quad) {
        context.beginPath();
        context.moveTo(...quad[0]);
        for (const point of quad.slice(1)) context.lineTo(...point);
        context.closePath();
        context.strokeStyle = quadColor;
        context.stroke();
      }
      if (signal) {
        const label = overlayLabel(signal);
        const labelWidth = context.measureText(label).width + 10 * unit;
        const labelX = Math.max(0, Math.min(x1, clip.width - labelWidth));
        const labelY = Math.max(0, y1 - 22 * unit);
        context.fillStyle = "#1a1a1a";
        context.fillRect(labelX, labelY, labelWidth, 20 * unit);
        context.fillStyle = "#FFFFFF";
        context.fillText(label, labelX + 5 * unit, labelY + 14 * unit);
      }
    }

    const selected = vehicles.find(({ passId }) => passId === selectedPassId);
    if (selected) {
      const [x1, y1, x2, y2] = selected.box;
      const outlineWidth = 5 * unit;
      const outset = 2 * unit + outlineWidth / 2;
      const outline: [number, number, number, number] = [x1 - outset, y1 - outset, x2 - x1 + 2 * outset, y2 - y1 + 2 * outset];
      context.strokeStyle = "#1a1a1a";
      context.lineWidth = outlineWidth;
      context.strokeRect(...outline);
      context.strokeStyle = "#FFFFFF";
      context.lineWidth = 2 * unit;
      context.strokeRect(...outline);
    }
  } finally {
    context.restore();
  }
}
