import { useEffect, useState } from "react";
import { getAssetStatus, getHealth } from "./api";
import { deriveAssetState } from "./asset-state";
import type { AssetStatus } from "./types";

export function useAssetStatus() {
  const [status, setStatus] = useState<AssetStatus | null>();
  const [statusFailed, setStatusFailed] = useState(false);
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;
    let timer: number | undefined;

    async function poll() {
      try {
        const nextStatus = await getAssetStatus(signal);
        if (signal.aborted) return;
        setStatus(nextStatus);
        setStatusFailed(false);
        if (deriveAssetState(nextStatus).kind === "progress") {
          timer = window.setTimeout(poll, 1000);
        }
      } catch {
        if (!signal.aborted) setStatusFailed(true);
      }
    }

    async function connect() {
      try {
        await getHealth(signal);
      } catch {
        if (!signal.aborted) setStatus(null);
        return;
      }
      if (!signal.aborted) await poll();
    }

    void connect();
    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [revision]);

  return { status, statusFailed, refresh: () => setRevision((previous) => previous + 1) };
}
