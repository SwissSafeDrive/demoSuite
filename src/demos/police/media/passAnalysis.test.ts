import { expect, test } from "vitest";
import { behaviourStretches } from "./passAnalysis";

test("a stretch seeks to its start time within the source clip", () => {
  const [stretch] = behaviourStretches({
    behaviours: [
      {
        type: "phone_use",
        start: { frame: 1198, time_s: 47.92 },
        end: { frame: 1203, time_s: 48.12 },
        duration_s: 0.24,
        label: "SIMULATED SIGNAL",
      },
    ],
  });
  expect(stretch.startTime).toBe(47.92);
  expect(stretch.seekFrame).toBe(1198);
});
