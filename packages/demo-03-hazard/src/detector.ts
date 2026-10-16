import * as tf from '@tensorflow/tfjs';
import * as cocoSsd from '@tensorflow-models/coco-ssd';

let model: cocoSsd.ObjectDetection | null = null;

export async function loadModel(onProgress: (s: string, p: number) => void): Promise<void> {
  onProgress('Loading TensorFlow.js...', 20);
  await tf.ready();
  onProgress('Downloading detection model...', 50);
  model = await cocoSsd.load({ base: 'mobilenet_v2' });
  onProgress('Model ready', 100);
}

export async function detect(canvas: HTMLCanvasElement): Promise<cocoSsd.DetectedObject[]> {
  if (!model) return [];
  return model.detect(canvas);
}
