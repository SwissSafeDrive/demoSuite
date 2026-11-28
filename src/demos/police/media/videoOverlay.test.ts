import { expect, test } from "vitest";
import fixture from "../../../../backend/fixtures/passes.json";
import type { ClipPlayback } from "../types";
import { overlayLabel, vehiclesAtTime, vehicleAtPoint } from "./videoOverlay";

const clip = fixture[0].clip;
const frame = 1203;
const vehicles = fixture
  .filter((pass) => pass.clip.id === "Cba002")
  .flatMap((pass) =>
    pass.geometry.flatMap(([index, box, quad]) =>
      index === frame
        ? [
            {
              passId: pass.passId,
              box: box as ClipPlayback["frames"][number][number]["box"],
              quad: quad as ClipPlayback["frames"][number][number]["quad"],
              boxColor: "#3B82F6",
              quadColor: "#F97316",
              signal: null,
            },
          ]
        : [],
    ),
  );
const playback = { clip, frames: { [frame]: vehicles } };

test("clicking a neighbouring box at the displayed time opens its own Pass", () => {
  const viewport = { width: clip.width / 2, height: clip.height / 2 + 40 };
  const hit = (x: number, y: number) => vehicleAtPoint(playback, 48.12, viewport, clip, x / 2, y / 2 + 20);

  expect(hit(3250, 2000)).toBe("Cba002-068");
  expect(hit(2225, 320)).toBe("Cba002-090");
  expect(vehicleAtPoint(playback, 48.12, viewport, clip, 10, 10)).toBeNull();
});

test("overlay selects the matching boxes and quads only for the displayed frame", () => {
  expect(vehiclesAtTime(playback, 48.12)).toEqual(vehicles);
  expect(vehiclesAtTime(playback, 48.08)).toEqual([]);
});

test("hiding overlay confidence leaves the simulated signal tag visible", () => {
  const signal = { label: "SIMULATED SIGNAL", percent: 68 } as const;
  expect(overlayLabel(signal, false)).toBe("SIMULATED SIGNAL");
  expect(overlayLabel(signal, true)).toBe("SIMULATED SIGNAL 68%");
});
