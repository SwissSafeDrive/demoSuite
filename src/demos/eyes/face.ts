import { FaceLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";
import type { NormalizedLandmark, Classifications } from "@mediapipe/tasks-vision";

let landmarker: FaceLandmarker | null = null;

export async function loadFaceDetector(onProgress: (status: string, pct: number) => void): Promise<void> {
  onProgress("Loading MediaPipe WASM runtime...", 20);

  const filesetResolver = await FilesetResolver.forVisionTasks("https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm");

  onProgress("Downloading face landmark model...", 55);

  landmarker = await FaceLandmarker.createFromOptions(filesetResolver, {
    baseOptions: {
      modelAssetPath: "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
      delegate: "GPU",
    },
    outputFaceBlendshapes: true,
    runningMode: "VIDEO",
    numFaces: 1,
  });

  onProgress("Face detector ready", 100);
}

export interface FaceResult {
  detected: boolean;
  landmarks: NormalizedLandmark[][];
  blendshapes: Classifications[];
}

export function detectFace(video: HTMLVideoElement, timestampMs: number): FaceResult {
  if (!landmarker) return { detected: false, landmarks: [], blendshapes: [] };
  const result = landmarker.detectForVideo(video, timestampMs);
  return {
    detected: result.faceLandmarks.length > 0,
    landmarks: result.faceLandmarks,
    blendshapes: result.faceBlendshapes,
  };
}

export type GazeState = "forward" | "side" | "up" | "down" | "closed";

export interface GazeResult {
  state: GazeState;
  blinkLeft: number;
  blinkRight: number;
  lookOut: number;
  lookUp: number;
}

function blendshapeScore(blendshapes: Classifications[], name: string): number {
  return blendshapes[0]?.categories.find((c) => c.categoryName === name)?.score ?? 0;
}

const BLINK_THRESHOLD = 0.55;
const GAZE_THRESHOLD = 0.35;

export function analyzeGaze(blendshapes: Classifications[]): GazeResult {
  if (blendshapes.length === 0) {
    return { state: "forward", blinkLeft: 0, blinkRight: 0, lookOut: 0, lookUp: 0 };
  }

  const blinkLeft = blendshapeScore(blendshapes, "eyeBlinkLeft");
  const blinkRight = blendshapeScore(blendshapes, "eyeBlinkRight");
  const lookOutLeft = blendshapeScore(blendshapes, "eyeLookOutLeft");
  const lookOutRight = blendshapeScore(blendshapes, "eyeLookOutRight");
  const lookOut = Math.max(lookOutLeft, lookOutRight);
  const lookUp = Math.max(blendshapeScore(blendshapes, "eyeLookUpLeft"), blendshapeScore(blendshapes, "eyeLookUpRight"));
  const lookDown = Math.max(blendshapeScore(blendshapes, "eyeLookDownLeft"), blendshapeScore(blendshapes, "eyeLookDownRight"));

  let state: GazeState;
  if ((blinkLeft + blinkRight) / 2 > BLINK_THRESHOLD) {
    state = "closed";
  } else if (lookOut > GAZE_THRESHOLD) {
    state = "side";
  } else if (lookUp > GAZE_THRESHOLD) {
    state = "up";
  } else if (lookDown > GAZE_THRESHOLD) {
    state = "down";
  } else {
    state = "forward";
  }

  return { state, blinkLeft, blinkRight, lookOut, lookUp };
}

export type AlertLevel = "clear" | "drowsy" | "gaze-off" | "danger";

interface AlertTracker {
  eyesClosedMs: number;
  gazeOffMs: number;
  lastTs: number;
}

const tracker: AlertTracker = { eyesClosedMs: 0, gazeOffMs: 0, lastTs: 0 };

export function resetTracker(): void {
  tracker.eyesClosedMs = 0;
  tracker.gazeOffMs = 0;
  tracker.lastTs = 0;
}

export function updateAlertLevel(gaze: GazeResult, detected: boolean): AlertLevel {
  const now = Date.now();
  const dt = tracker.lastTs ? Math.min(now - tracker.lastTs, 200) : 0;
  tracker.lastTs = now;

  if (!detected) {
    tracker.eyesClosedMs = Math.max(0, tracker.eyesClosedMs - dt * 2);
    tracker.gazeOffMs = Math.max(0, tracker.gazeOffMs - dt * 2);
  } else if (gaze.state === "closed") {
    tracker.eyesClosedMs += dt;
    tracker.gazeOffMs = Math.max(0, tracker.gazeOffMs - dt * 3);
  } else if (gaze.state === "side" || gaze.state === "up") {
    tracker.gazeOffMs += dt;
    tracker.eyesClosedMs = Math.max(0, tracker.eyesClosedMs - dt * 3);
  } else {
    tracker.eyesClosedMs = Math.max(0, tracker.eyesClosedMs - dt * 4);
    tracker.gazeOffMs = Math.max(0, tracker.gazeOffMs - dt * 4);
  }

  if (tracker.eyesClosedMs > 1800 || tracker.gazeOffMs > 3000) return "danger";
  if (tracker.eyesClosedMs > 500) return "drowsy";
  if (tracker.gazeOffMs > 1500) return "gaze-off";
  return "clear";
}
