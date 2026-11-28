import { expect, test } from "vitest";
import { behaviourStretches } from "./passAnalysis";

test("a stretch projects clip timings and its simulated signal label", () => {
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
  expect(stretch).toEqual({
    name: "Phone use",
    seekFrame: 1198,
    endFrame: 1203,
    startTime: 47.92,
    endTime: 48.12,
    duration: 0.24,
    label: "SIMULATED SIGNAL",
  });
});
