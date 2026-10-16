import { loadModel, detect } from './detector';
import { startCamera, captureFrame, syncOverlay, getVideoTransform } from './camera';
import { analyzeDetections } from './phone-in-hand';
import { drawDetections } from './overlay';
import {
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
} from './ui-state';

async function init() {
  const video = document.getElementById('video') as HTMLVideoElement;
  const overlay = document.getElementById('overlay') as HTMLCanvasElement;

  try {
    setLoading('Requesting camera access...', 5);

    const { inferenceCanvas, cleanup } = await startCamera(video);
    hideCameraPermission();
    setVideoInfo(video.videoWidth, video.videoHeight);
    syncOverlay(video, overlay);

    await loadModel((status, pct) => setLoading(status, pct));

    showApp();
    setSystemOnline();
    logEvent('info', 'System initialized — monitoring active');

    let inferring = false;
    let frameCount = 0;
    let lastFpsTs = performance.now();

    const durationTimer = setInterval(updateDuration, 1000);

    async function loop() {
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
      requestAnimationFrame(loop);
    }

    requestAnimationFrame(loop);

    window.addEventListener('beforeunload', () => {
      clearInterval(durationTimer);
      cleanup();
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    setLoading(`Error: ${msg}`, 0);
    logEvent('incident', `Startup failed: ${msg}`);
    console.error(err);
  }
}

init();
