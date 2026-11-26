import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { vehicleAtPoint } from "../src/media/videoOverlay.js";

test("clicking a second box at the displayed time switches from the Candidate to its neighbour", () => {
  const passes = JSON.parse(readFileSync(new URL("../../backend/fixtures/passes.json", import.meta.url)));
  const clip = passes[0].clip;
  const frame = 1203;
  const vehicles = passes.filter((pass) => pass.clip.id === "Cba002").flatMap((pass) =>
    pass.geometry.filter(([index]) => index === frame)
      .map(([, box]) => ({ passId: pass.passId, box })),
  );
  const playback = { clip, frames: { [frame]: vehicles } };
  const viewport = { width: clip.width / 2, height: clip.height / 2 + 40 };
  const hit = (x, y) => vehicleAtPoint(
    playback, 48.12, viewport, clip, x / 2, y / 2 + 20,
  );

  assert.equal(hit(3250, 2000), "Cba002-068");
  assert.equal(hit(2225, 320), "Cba002-090");
  assert.equal(vehicleAtPoint(playback, 48.12, viewport, clip, 10, 10), null);
});
