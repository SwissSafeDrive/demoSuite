import { useEffect, useMemo, useState } from "react";
import { fetchWindshieldCrop, flagPass, getPassCrops } from "../api";
import type { Pass, PassCrops } from "../types";
import "./media.css";

type CropFrames = Map<number, string>;
type Seek = (time: number) => void;
type WindshieldPanelProps = {
  pass: Pass;
  frame: number | null;
  playing: boolean;
  onSeek: Seek;
};

import { bridgeDecision, seconds } from "./passAnalysis";

function useWindshieldImage(frames: CropFrames, frame: number | null, tolerance = 0) {
  const [image, setImage] = useState<{ frame: number; url: string } | null>(null);
  const [failedFrame, setFailedFrame] = useState<number | null>(null);
  const path = frame === null ? undefined : frames.get(frame);

  useEffect(() => {
    if (!path || frame === null) return;
    const controller = new AbortController();
    fetchWindshieldCrop(path, controller.signal).then(
      (blob) => {
        if (!controller.signal.aborted) {
          setFailedFrame(null);
          setImage({ frame, url: URL.createObjectURL(blob) });
        }
      },
      () => {
        if (!controller.signal.aborted) setFailedFrame(frame);
      },
    );
    return () => controller.abort();
  }, [frame, path]);

  const imageUrl = image?.url;
  useEffect(
    () => () => {
      if (imageUrl) URL.revokeObjectURL(imageUrl);
    },
    [imageUrl],
  );

  const visible = frame !== null && path && failedFrame !== frame && image && frame >= image.frame && frame - image.frame <= tolerance;
  return { url: visible ? image?.url : null, loading: path && failedFrame !== frame };
}

function WindshieldCrop({ frames, frame, playing }: { frames: CropFrames } & Pick<WindshieldPanelProps, "frame" | "playing">) {
  const [zoom, setZoom] = useState(1);
  const { url, loading } = useWindshieldImage(frames, frame, playing ? 2 : 0);
  return (
    <>
      <div className="windshield-viewport" tabIndex={url && zoom > 1 ? 0 : undefined} aria-label="Windshield crop">
        {url ? (
          <img src={url} alt="Windshield" draggable={false} style={{ width: `${zoom * 100}%` }} />
        ) : (
          <p>{loading ? "Loading windshield…" : "Not assessable"}</p>
        )}
      </div>
      <label className="windshield-zoom">
        Zoom
        <input
          type="range"
          min="1"
          max="4"
          step="0.25"
          value={zoom}
          disabled={!frames.size}
          onChange={(event) => setZoom(Number(event.target.value))}
        />
        <output>{zoom}×</output>
      </label>
    </>
  );
}

function Snapshot({ frames, snapshot, onSeek }: { frames: CropFrames; snapshot: { frame: number; time: number }; onSeek: Seek }) {
  const { url, loading } = useWindshieldImage(frames, snapshot.frame);
  return (
    <figure className="bridge-snapshot">
      {url ? <img src={url} alt="Best windshield Snapshot" /> : <p>{loading ? "Loading Snapshot…" : "Snapshot unavailable"}</p>}
      <figcaption>
        <button type="button" onClick={() => onSeek(snapshot.time)}>
          Best Snapshot · Seek to {seconds(snapshot.time)}
        </button>
      </figcaption>
    </figure>
  );
}

export default function WindshieldPanel({ pass, frame, playing, onSeek }: WindshieldPanelProps) {
  const { passId, classification } = pass;
  const [flaggedManually, setFlaggedManually] = useState(pass.flagged_manually);
  const [crops, setCrops] = useState<PassCrops["frames"] | null>(null);
  const [cropError, setCropError] = useState(false);
  const [saving, setSaving] = useState(false);
  const [flagError, setFlagError] = useState(false);

  useEffect(() => {
    let active = true;
    getPassCrops(passId).then(
      (metadata) => {
        if (active) setCrops(metadata.status === "available" ? metadata.frames : []);
      },
      () => {
        if (active) setCropError(true);
      },
    );
    return () => {
      active = false;
    };
  }, [passId]);

  const frames = useMemo(() => new Map(crops?.map(({ frame, url }) => [frame, url])), [crops]);

  async function promote() {
    setSaving(true);
    setFlagError(false);
    try {
      const updated = await flagPass(passId);
      setFlaggedManually(updated.flagged_manually);
    } catch {
      setFlagError(true);
    } finally {
      setSaving(false);
    }
  }

  const { flagTime, snapshots } = bridgeDecision(pass);

  return (
    <aside className="windshield-panel" aria-label="Single Case Analysis">
      <div className="windshield-case">
        <h3>{passId}</h3>
        <p>{flaggedManually ? "Candidate · Flagged manually" : classification === "unflagged" ? "Unflagged" : classification}</p>
      </div>
      {cropError ? (
        <div className="windshield-viewport">
          <p role="alert">Windshield crops are unavailable.</p>
        </div>
      ) : crops === null ? (
        <div className="windshield-viewport">
          <p>Loading windshield…</p>
        </div>
      ) : (
        <WindshieldCrop frames={frames} frame={frame} playing={playing} />
      )}
      <div className="windshield-case">
        <button type="button" onClick={promote} disabled={saving || flaggedManually}>
          {flaggedManually ? "Flagged manually" : "Flag manually"}
        </button>
        {flagError && <p role="alert">The manual flag could not be saved.</p>}
      </div>
      {(flagTime !== null || snapshots.length > 0) && (
        <section className="windshield-case">
          <h3>{flagTime === null ? "Best Snapshots" : "Candidate decision at the bridge"}</h3>
          {flagTime !== null && (
            <p>
              Flag time {seconds(flagTime)} <span className="simulated-signal">SIMULATED SIGNAL</span>
            </p>
          )}
          {crops !== null && snapshots.map((snapshot) => <Snapshot key={snapshot.frame} frames={frames} snapshot={snapshot} onSeek={onSeek} />)}
        </section>
      )}
    </aside>
  );
}
