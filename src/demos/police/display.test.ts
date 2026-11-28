import { expect, it } from "vitest";
import { formatSignal } from "./display";

it("shows the simulated confidence percentage by default", () => {
  expect(formatSignal("Phone in hand", 78)).toBe("Phone in hand 78%");
});

it("keeps the label when percentages are disabled", () => {
  expect(formatSignal("Phone in hand", 78, false)).toBe("Phone in hand");
});
