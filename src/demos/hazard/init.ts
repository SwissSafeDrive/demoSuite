import { loadModel, detect } from "./detector";
import { startCamera, captureFrame, syncOverlay, getVideoTransform } from "./camera";
import { scoreHazards, simulateSpeed } from "./hazard-scorer";
import { drawHazards } from "./overlay";
import {
  resetState,
  setLoading,
  showApp,
  setSystemOnline,
  hideCameraPermission,
  setVideoInfo,
  updateFps,
  updateSimSpeed,
  updateDuration,
  updateHazardDisplay,
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
    logEvent("info", "Hazard detection active — monitoring road ahead");

    let inferring = false;
    let frameCount = 0;
    let lastFpsTick = performance.now();
    let speedTick = 0;

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
        const analysis = scoreHazards(predictions, inferenceCanvas.height);
        const transform = getVideoTransform(video);

        drawHazards(overlay, analysis.hazards, analysis.level, transform);
        updateHazardDisplay(analysis);

        frameCount++;
        speedTick++;
        if (speedTick % 15 === 0) updateSimSpeed(simulateSpeed());

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
