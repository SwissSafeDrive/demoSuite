import type { Pass } from "../types";

export function behaviourStretches(pass: Pick<Pass, "behaviours">) {
  return pass.behaviours.map((stretch) => {
    const words = stretch.type.replace(/_/g, " ");
    return {
      name: words.charAt(0).toUpperCase() + words.slice(1),
      seekFrame: stretch.start.frame,
      endFrame: stretch.end.frame,
      startTime: stretch.start.time_s,
      endTime: stretch.end.time_s,
      duration: stretch.duration_s,
      label: stretch.label,
    };
  });
}

export function bridgeDecision(pass: Pick<Pass, "flag_time" | "best_snapshots">) {
  return {
    flagTime: pass.flag_time?.time_s ?? null,
    snapshots: pass.best_snapshots.map(({ frame, time_s }) => ({ frame, time: time_s })),
  };
}

export const seconds = (time: number) => `${time.toFixed(2)} s`;
