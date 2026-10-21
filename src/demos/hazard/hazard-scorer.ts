import type { DetectedObject } from "@tensorflow-models/coco-ssd";

export type HazardLevel = "clear" | "caution" | "warning" | "danger";

const HAZARD_WEIGHTS: Record<string, number> = {
  person: 1.0,
  bicycle: 0.8,
  motorcycle: 0.8,
  car: 0.55,
  truck: 0.55,
  bus: 0.55,
  dog: 0.7,
  cat: 0.6,
};

const HAZARD_CATEGORIES: Record<string, string> = {
  person: "person",
  bicycle: "cyclist",
  motorcycle: "cyclist",
  car: "vehicle",
  truck: "vehicle",
  bus: "vehicle",
  dog: "animal",
  cat: "animal",
};

export interface ScoredHazard {
  class: string;
  category: string;
  score: number;
  proximityScore: number;
  hazardScore: number;
  bbox: [number, number, number, number];
}

export interface HazardAnalysis {
  level: HazardLevel;
  totalScore: number;
  hazards: ScoredHazard[];
  message: string;
}

export function scoreHazards(predictions: DetectedObject[], frameHeight: number): HazardAnalysis {
  const hazards: ScoredHazard[] = predictions
    .filter((p) => p.class in HAZARD_WEIGHTS && p.score >= 0.4)
    .map((p) => {
      const proximityScore = Math.min(p.bbox[3] / frameHeight, 1);
      const hazardScore = proximityScore * HAZARD_WEIGHTS[p.class];
      return {
        class: p.class,
        category: HAZARD_CATEGORIES[p.class],
        score: p.score,
        proximityScore,
        hazardScore,
        bbox: p.bbox,
      };
    })
    .sort((a, b) => b.hazardScore - a.hazardScore);

  const totalScore = Math.min(
    hazards.reduce((acc, h) => acc + h.hazardScore, 0),
    1,
  );

  let level: HazardLevel;
  let message: string;

  if (totalScore === 0) {
    level = "clear";
    message = "Road clear — no hazards detected";
  } else if (totalScore < 0.25) {
    level = "caution";
    message = "Objects detected — monitoring proximity";
  } else if (totalScore < 0.55) {
    level = "warning";
    message = "Hazard approaching — maintain safe distance";
  } else {
    level = "danger";
    message = "DANGER: Imminent collision risk detected";
  }

  return { level, totalScore, hazards, message };
}

let speed = 52;
export function simulateSpeed(): number {
  speed += (Math.random() - 0.5) * 3;
  speed = Math.max(0, Math.min(130, speed));
  return Math.round(speed);
}
