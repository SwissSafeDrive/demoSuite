import { loadModel, detect } from "./detector";
import { startCamera, captureFrame, syncOverlay, getVideoTransform } from "./camera";
import { analyzeDetections } from "./phone-in-hand";
import { drawDetections } from "./overlay";
import {
  resetState,
  setLoading,
  showApp,
  setSystemOnline,
  hideCameraPermission,
  updateAlert,
  updateDetections,
  incrementFrames,
  updateFps,
  updateDuration,
  setVideoInfo,
  logEvent,
} from "./ui-state";

export async function init(signal: AbortSignal): Promise<void> {
  resetState();
  let alive = true;
  signal.addEventListener("abort", () => {
    alive = false;
  });

  const video = document.getElementById("video") as HTMLVideoElement;
  const overlay = document.getElementById("overlay") as HTMLCanvasElement;

  try {
    setLoading("Requesting camera access...", 5);

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
    logEvent("info", "System initialized — monitoring active");

    let inferring = false;
    let frameCount = 0;
    let lastFpsTs = performance.now();

    const durationTimer = setInterval(updateDuration, 1000);

    signal.addEventListener("abort", () => {
      clearInterval(durationTimer);
      cleanup();
    });

    async function loop() {
      if (!alive) return;

      if (!inferring && video.readyState === 4) {
        inferring = true;

        captureFrame(video, inferenceCanvas);
        const predictions = await detect(inferenceCanvas);
        const result = analyzeDetections(predictions);
        const transform = getVideoTransform(video);

        drawDetections(overlay, predictions, result.level, transform);
        updateAlert(result);
        updateDetections(predictions);
        incrementFrames();

        frameCount++;
        const now = performance.now();
        if (now - lastFpsTs >= 1000) {
          updateFps(Math.round((frameCount * 1000) / (now - lastFpsTs)));
          frameCount = 0;
          lastFpsTs = now;
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
    logEvent("incident", `Startup failed: ${msg}`);
    console.error(err);
  }
}
