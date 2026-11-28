import { formatSignal } from "./display";
import { behaviourStretches, seconds } from "./media/passAnalysis";
import type { Pass } from "./types";

type ObservationPass = Pick<Pass, "classification" | "behaviours" | "flag_time" | "flagged_manually" | "annotations">;

const classificationLabels: Record<Pass["classification"], string> = {
  Candidate: "Candidate · SIMULATED SIGNAL",
  "Not assessable": "Not assessable because there was no usable windshield view.",
  unflagged: "Unflagged",
};

export function observationSummary(pass: ObservationPass, showPercent?: boolean) {
  const lines = [classificationLabels[pass.classification]];
  if (pass.flagged_manually) lines.push("Flagged manually");
  for (const stretch of behaviourStretches(pass)) {
    lines.push(`${stretch.name} from ${seconds(stretch.startTime)} to ${seconds(stretch.endTime)} · ${stretch.label}`);
  }

  const flagTime = pass.flag_time;
  if (flagTime) {
    const signal = pass.annotations.find(({ frame }) => frame === flagTime.frame);
    const label = signal ? formatSignal(signal.label, Math.round(signal.confidence * 100), showPercent) : "SIMULATED SIGNAL";
    lines.push(`Flag time at the bridge ${seconds(flagTime.time_s)} · ${label}`);
  }
  return lines;
}
