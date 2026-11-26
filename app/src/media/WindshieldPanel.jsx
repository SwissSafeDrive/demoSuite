import { useEffect, useMemo, useState } from "react";
import { fetchWindshieldCrop, flagPass, getPass, getPassCrops } from "../api/client";

function WindshieldCrop({ frames, frame }) {
  const [zoom, setZoom] = useState(1);
  const [image, setImage] = useState(null);
  const [failedFrame, setFailedFrame] = useState(null);
  const path = frames.get(frame);

  useEffect(() => {
    if (!path) return;
    const controller = new AbortController();
    fetchWindshieldCrop(path, controller.signal).then((blob) => {
      if (!controller.signal.aborted) {
        setImage({ frame, url: URL.createObjectURL(blob) });
      }
    }, () => {
      if (!controller.signal.aborted) setFailedFrame(frame);
    });
    return () => controller.abort();
  }, [frame, path]);

  const imageUrl = image?.url;
  useEffect(() => () => {
    if (imageUrl) URL.revokeObjectURL(imageUrl);
  }, [imageUrl]);

  const visible = path && failedFrame !== frame && image && frame >= image.frame && frame - image.frame <= 2;
  return (
    <>
      <div className="windshield-viewport" tabIndex={visible && zoom > 1 ? 0 : undefined} aria-label="Windshield crop">
        {visible ? (
          <img
            src={image.url}
            alt="Windshield"
            draggable={false}
            style={{ width: `${zoom * 100}%` }}
          />
        ) : (
          <p>{path && failedFrame !== frame ? "Loading windshield…" : "Not assessable"}</p>
        )}
      </div>
      <label className="windshield-zoom">
        Zoom
        <input
          type="range" min="1" max="4" step="0.25"
          value={zoom} disabled={!frames.size}
          onChange={(event) => setZoom(Number(event.target.value))}
        />
        <output>{zoom}×</output>
      </label>
    </>
  );
}

export default function WindshieldPanel({ passId, frame }) {
  const [pass, setPass] = useState(null);
  const [crops, setCrops] = useState(null);
  const [passError, setPassError] = useState(false);
  const [saving, setSaving] = useState(false);
  const [flagError, setFlagError] = useState(false);

  useEffect(() => {
    let active = true;
    getPass(passId).then(
      (record) => { if (active) setPass(record); },
      () => { if (active) setPassError(true); },
    );
    getPassCrops(passId).then(
      (metadata) => { if (active) setCrops(metadata.frames); },
      () => { if (active) setCrops([]); },
    );
    return () => { active = false; };
  }, [passId]);

  const frames = useMemo(() => new Map(crops?.map(({ frame, url }) => [frame, url])), [crops]);

  async function promote() {
    setSaving(true);
    setFlagError(false);
    try {
      setPass(await flagPass(passId));
    } catch {
      setFlagError(true);
    } finally {
      setSaving(false);
    }
  }

  return (
    <aside className="windshield-panel" aria-label="Single Case Analysis">
      <div className="windshield-case">
        <h3>{passId}</h3>
        {pass && <p>{pass.flagged_manually ? "Candidate · Flagged manually" : pass.classification}</p>}
        {passError && <p role="alert">Case data could not be loaded.</p>}
      </div>
      {crops === null ? (
        <div className="windshield-viewport"><p>Loading windshield…</p></div>
      ) : (
        <WindshieldCrop frames={frames} frame={frame} />
      )}
      <div className="windshield-case">
        <button type="button" onClick={promote} disabled={!pass || saving || pass.flagged_manually}>
          {pass?.flagged_manually ? "Flagged manually" : "Flag manually"}
        </button>
        {flagError && <p role="alert">The manual flag could not be saved.</p>}
      </div>
    </aside>
  );
}
