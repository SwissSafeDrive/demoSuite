import type { DetectedObject } from '@tensorflow-models/coco-ssd';

export type AlertLevel = 'clear' | 'phone-detected' | 'driver-distracted';

export interface AnalysisResult {
  level: AlertLevel;
  phoneScore: number;
  message: string;
}

interface Rect { x: number; y: number; w: number; h: number; }

function toRect([x, y, w, h]: [number, number, number, number]): Rect {
  return { x, y, w, h };
}

function intersects(a: Rect, b: Rect): boolean {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

const PHONE_THRESHOLD = 0.35;
const PERSON_THRESHOLD = 0.50;

export function analyzeDetections(predictions: DetectedObject[]): AnalysisResult {
  const phones = predictions.filter(p => p.class === 'cell phone' && p.score >= PHONE_THRESHOLD);
  const persons = predictions.filter(p => p.class === 'person' && p.score >= PERSON_THRESHOLD);

  if (phones.length === 0) {
    return { level: 'clear', phoneScore: 0, message: 'No phone detected' };
  }

  const topPhone = phones.reduce((a, b) => (a.score > b.score ? a : b));
  const phoneRect = toRect(topPhone.bbox);

  if (persons.length === 0) {
    return {
      level: 'phone-detected',
      phoneScore: topPhone.score,
      message: 'Phone detected — no driver in frame',
    };
  }

  const driverHasPhone = persons.some(p => intersects(phoneRect, toRect(p.bbox)));

  if (driverHasPhone) {
    return {
      level: 'driver-distracted',
      phoneScore: topPhone.score,
      message: 'WARNING: Driver holding phone',
    };
  }

  return {
    level: 'phone-detected',
    phoneScore: topPhone.score,
    message: 'Phone in frame — not held by driver',
  };
}
