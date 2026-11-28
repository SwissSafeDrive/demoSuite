import { formatSignal, SHOW_CONFIDENCE_PERCENT } from "./display";
import type { Candidate, ReviewState } from "./types";

export const reviewStateLabels: Record<ReviewState, string> = {
  pending: "Pending",
  reviewed: "Reviewed",
  confirmed: "Confirmed",
  discarded: "Discarded",
};

export function formatCandidateRow({ state, signal }: Candidate, showPercent = SHOW_CONFIDENCE_PERCENT) {
  return {
    stateLabel: reviewStateLabels[state],
    signalText: signal ? formatSignal("Signal", signal.percent, showPercent) : null,
    signalTag: signal?.label,
  };
}

export function minimumSignalLabel(minimum: number, showPercent = SHOW_CONFIDENCE_PERCENT) {
  return showPercent ? formatSignal("Minimum simulated signal ·", minimum, showPercent) : null;
}
