import { expect, test } from "vitest";
import { formatCandidateRow, minimumSignalLabel } from "./candidate-display";
import type { Candidate } from "./types";

const candidate: Candidate = {
  passId: "Cba002-068",
  clipId: "Cba002",
  seekTime: 12,
  state: "pending",
  flagged_manually: false,
  signal: { percent: 76, color: "#e30613", label: "SIMULATED SIGNAL" },
};

test("the display flag hides percentages and the minimum filter while keeping labels and simulated-signal tagging", () => {
  expect(formatCandidateRow(candidate, true)).toEqual({
    stateLabel: "Pending",
    signalText: "Signal 76%",
    signalTag: "SIMULATED SIGNAL",
  });
  expect(minimumSignalLabel(60, true)).toBe("Minimum simulated signal · 60%");

  expect(formatCandidateRow(candidate, false)).toEqual({
    stateLabel: "Pending",
    signalText: "Signal",
    signalTag: "SIMULATED SIGNAL",
  });
  expect(minimumSignalLabel(60, false)).toBeNull();
});
