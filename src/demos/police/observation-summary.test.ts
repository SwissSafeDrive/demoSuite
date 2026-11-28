import { expect, test } from "vitest";
import { observationSummary } from "./observation-summary";
import type { Pass } from "./types";

const flag = { frame: 1203, time_s: 48.12 };
const candidate = {
  classification: "Candidate",
  flagged_manually: false,
  flag_time: flag,
  behaviours: [
    {
      type: "phone_in_hand",
      start: { frame: 1190, time_s: 47.6 },
      end: { frame: 1207, time_s: 48.28 },
      duration_s: 0.72,
      label: "SIMULATED SIGNAL",
    },
  ],
  annotations: [{ ...flag, type: "phone_confidence", confidence: 0.78, label: "SIMULATED SIGNAL" }],
} satisfies Pick<Pass, "classification" | "flagged_manually" | "flag_time" | "behaviours" | "annotations">;

test("summarizes the Candidate classification, behaviour range and bridge flag with simulated labels", () => {
  expect(observationSummary(candidate, true)).toEqual([
    "Candidate · SIMULATED SIGNAL",
    "Phone in hand from 47.60 s to 48.28 s · SIMULATED SIGNAL",
    "Flag time at the bridge 48.12 s · SIMULATED SIGNAL 78%",
  ]);
});

const notAssessable = {
  classification: "Not assessable",
  flagged_manually: false,
  flag_time: null,
  behaviours: [],
  annotations: [],
} satisfies Parameters<typeof observationSummary>[0];

test("explains why a Pass with no usable windshield view is Not assessable", () => {
  expect(observationSummary(notAssessable)).toEqual(["Not assessable because there was no usable windshield view."]);
});

test("shows manual promotion while preserving why the Pass is Not assessable", () => {
  expect(observationSummary({ ...notAssessable, flagged_manually: true })).toEqual([
    "Not assessable because there was no usable windshield view.",
    "Flagged manually",
  ]);
});

test("hides bridge confidence while retaining the flag time and simulated label", () => {
  const lines = observationSummary(candidate, false);
  expect(lines).toContain("Flag time at the bridge 48.12 s · SIMULATED SIGNAL");
  expect(lines.join(" ")).not.toContain("%");
});
