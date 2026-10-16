export interface CameraSetup {
  inferenceCanvas: HTMLCanvasElement;
  cleanup: () => void;
}

export async function startCamera(video: HTMLVideoElement): Promise<CameraSetup> {
  const stream = await navigator.mediaDevices.getUserMedia({
    video: { width: { ideal: 1280 }, height: { ideal: 720 } },
    audio: false,
  });
  video.srcObject = stream;
  await new Promise<void>(resolve => { video.onloadedmetadata = () => resolve(); });
  await video.play();

  const inferenceCanvas = document.createElement('canvas');
  inferenceCanvas.width = video.videoWidth;
  inferenceCanvas.height = video.videoHeight;

  return { inferenceCanvas, cleanup: () => stream.getTracks().forEach(t => t.stop()) };
}

export function captureFrame(video: HTMLVideoElement, canvas: HTMLCanvasElement): void {
  const ctx = canvas.getContext('2d');
  if (ctx) ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
}

export function syncOverlay(video: HTMLVideoElement, overlay: HTMLCanvasElement): () => void {
  function sync() { overlay.width = video.offsetWidth; overlay.height = video.offsetHeight; }
  const obs = new ResizeObserver(sync);
  obs.observe(video);
  sync();
  return () => obs.disconnect();
}

export interface VideoTransform { offsetX: number; offsetY: number; scale: number; }

export function getVideoTransform(video: HTMLVideoElement): VideoTransform {
  const dw = video.offsetWidth, dh = video.offsetHeight;
  const nw = video.videoWidth, nh = video.videoHeight;
  if (!nw || !nh) return { offsetX: 0, offsetY: 0, scale: 1 };
  const scale = Math.min(dw / nw, dh / nh);
  return { scale, offsetX: (dw - nw * scale) / 2, offsetY: (dh - nh * scale) / 2 };
}
