import { loadFaceDetector, detectFace, analyzeGaze, updateAlertLevel } from './face';
import { drawFaceMesh, clearOverlay } from './overlay';
import { startCamera, syncOverlay } from './camera';
import {
  setLoading, showApp, setSystemOnline, hideCameraPermission,
  setVideoInfo, updateFps, updateDuration, updateEyeMeters,
  updateGazeCompass, updateAlert, logEvent,
} from './ui-state';

async function init() {
  const video = document.getElementById('video') as HTMLVideoElement;
  const overlay = document.getElementById('overlay') as HTMLCanvasElement;

  try {
    setLoading('Requesting camera access...', 5);
    const cleanup = await startCamera(video);
    hideCameraPermission();
    setVideoInfo(video.videoWidth, video.videoHeight);
    syncOverlay(video, overlay);

    await loadFaceDetector((status, pct) => setLoading(status, pct));

    showApp();
    setSystemOnline();
    logEvent('info', 'Face detection active — monitoring driver attention');

    let inferring = false;
    let frameCount = 0;
    let lastFpsTick = performance.now();

    const durationTimer = setInterval(updateDuration, 1000);

    async function loop() {
      const ts = performance.now();

      if (!inferring && video.readyState === 4) {
        inferring = true;

        const result = detectFace(video, ts);
        const gaze = analyzeGaze(result.blendshapes);
        const level = updateAlertLevel(gaze, result.detected);

        if (result.detected && result.landmarks[0]) {
          drawFaceMesh(overlay, result.landmarks[0], level);
        } else {
          clearOverlay(overlay);
        }

        updateAlert(level, gaze.state);
        updateEyeMeters(gaze);
        updateGazeCompass(gaze.state);

        frameCount++;
        const now = performance.now();
        if (now - lastFpsTick >= 1000) {
          updateFps(Math.round((frameCount * 1000) / (now - lastFpsTick)));
          frameCount = 0;
          lastFpsTick = now;
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
    console.error(err);
  }
}

init();
