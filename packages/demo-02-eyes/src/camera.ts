export async function startCamera(video: HTMLVideoElement): Promise<() => void> {
  const stream = await navigator.mediaDevices.getUserMedia({
    video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
    audio: false,
  });
  video.srcObject = stream;
  await new Promise<void>(resolve => { video.onloadedmetadata = () => resolve(); });
  await video.play();
  return () => stream.getTracks().forEach(t => t.stop());
}

export function syncOverlay(video: HTMLVideoElement, overlay: HTMLCanvasElement): () => void {
  function sync() {
    overlay.width = video.offsetWidth;
    overlay.height = video.offsetHeight;
  }
  const obs = new ResizeObserver(sync);
  obs.observe(video);
  sync();
  return () => obs.disconnect();
}
