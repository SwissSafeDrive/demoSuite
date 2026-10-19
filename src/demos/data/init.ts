import { loadModel, detect } from "./detector";
import { startCamera, captureFrame, syncOverlay, getVideoTransform } from "./camera";
import { readSensors, dataQuality, estimateFrameBytes, resetSensors } from "./sensors";
import { drawLabels } from "./overlay";
import {
  resetState,
  setLoading,
  showApp,
  setSystemOnline,
  hideCameraPermission,
  setVideoInfo,
  updateFps,
  updateSensors,
  updateDataset,
  logEvent,
} from "./ui-state";

export async function init(signal: AbortSignal): Promise<void> {
  resetState();
  resetSensors();
  let alive = true;
  signal.addEventListener("abort", () => {
    alive = false;
  });

  const video = document.getElementById("video") as HTMLVideoElement;
  const overlay = document.getElementById("overlay") as HTMLCanvasElement;

  try {
    setLoading("Activating data collection device...", 5);
    const { inferenceCanvas, cleanup } = await startCamera(video);
    if (!alive) {
      cleanup();
      return;
    }

    hideCameraPermission();
    setVideoInfo(video.videoWidth, video.videoHeight);
    syncOverlay(video, overlay);

    await loadModel((status, pct) => setLoading(status, pct));
    if (!alive) {
      cleanup();
      return;
    }

    showApp();
    setSystemOnline();
    logEvent("info", "Data collector initialized — pipeline active");

    let inferring = false;
    let frameCount = 0;
    let lastFpsTick = performance.now();
    let sensorTick = 0;

    signal.addEventListener("abort", () => cleanup());

    async function loop() {
      if (!alive) return;

      if (!inferring && video.readyState === 4) {
        inferring = true;

        captureFrame(video, inferenceCanvas);
        const predictions = await detect(inferenceCanvas);
        const transform = getVideoTransform(video);

        drawLabels(overlay, predictions, transform);

        const quality = dataQuality(predictions);
        const bytes = estimateFrameBytes(predictions.length, inferenceCanvas.width, inferenceCanvas.height);
        updateDataset(predictions, bytes, quality);

        sensorTick++;
        if (sensorTick % 5 === 0) updateSensors(readSensors());

        frameCount++;
        const now = performance.now();
        if (now - lastFpsTick >= 1000) {
          updateFps(Math.round((frameCount * 1000) / (now - lastFpsTick)));
          frameCount = 0;
          lastFpsTick = now;
        }

        inferring = false;
      }

      if (alive) requestAnimationFrame(loop);
    }

    requestAnimationFrame(loop);
  } catch (err) {
    if (!alive) return;
    const msg = err instanceof Error ? err.message : String(err);
    setLoading(`Error: ${msg}`, 0);
    console.error(err);
  }
}
