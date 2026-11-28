import type { AssetStatus } from "./types";

export function deriveAssetState(status: AssetStatus | null | undefined) {
  if (status === null) return { kind: "run-locally" } as const;
  if (status === undefined) return { kind: "loading" } as const;

  switch (status.state) {
    case "idle":
    case "checking":
    case "downloading":
      return {
        kind: "progress",
        percent: status.bytes_total > 0 ? Math.min(100, Math.floor((100 * status.bytes_done) / status.bytes_total)) : null,
      } as const;
    default:
      return { kind: status.state } as const;
  }
}
