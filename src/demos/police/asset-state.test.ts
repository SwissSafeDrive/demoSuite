import { expect, it } from "vitest";
import { deriveAssetState } from "./asset-state";

it("shows local setup when the API is unavailable", () => {
  expect(deriveAssetState(null)).toEqual({ kind: "run-locally" });
});

it("reports progress by bytes rather than by completed file count", () => {
  expect(
    deriveAssetState({
      state: "downloading",
      sas_configured: true,
      bytes_downloaded: 250,
      error: null,
      bytes_done: 250,
      bytes_total: 1000,
      files_done: 1,
      files_total: 2,
      current_file: "clip.mp4",
    }),
  ).toEqual({ kind: "progress", percent: 25 });
});
