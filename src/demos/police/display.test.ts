import { expect, it } from "vitest";
import { formatSignal, signalBand } from "./display";

it("shows the simulated confidence percentage by default", () => {
  expect(formatSignal("Phone in hand", 78)).toBe("Phone in hand 78%");
});

it("keeps the label when percentages are disabled", () => {
  expect(formatSignal("Phone in hand", 78, false)).toBe("Phone in hand");
});

it.each([
  [39, null],
  [40, "Uncertain"],
  [59, "Uncertain"],
  [60, "Candidate"],
])("derives the overlay band at %i percent", (percent, band) => {
  expect(signalBand(percent)).toBe(band);
});
