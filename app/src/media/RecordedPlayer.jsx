import { useEffect, useRef, useState } from "react";
import { getClipPlayback } from "../api/client";
import { drawVideoOverlay } from "./videoOverlay";

const CLIPS = ["Cba002", "Cba052", "Cba065"];

function ClipVideo({ playback }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const sample = document.createElement("canvas").getContext("2d", {
      willReadFrequently: true,
    });
    let frameId;
    let displayedTime;
    const draw = () => drawVideoOverlay(
      canvas, video, sample, playback, displayedTime ?? video.currentTime,
    );
    const drawCurrent = () => {
      displayedTime = undefined;
      draw();
    };
    const observer = new ResizeObserver(draw);
    observer.observe(video);
    video.addEventListener("loadeddata", drawCurrent);
    video.addEventListener("seeked", drawCurrent);

    function nextFrame() {
      if (video.requestVideoFrameCallback) {
        frameId = video.requestVideoFrameCallback((_, { mediaTime }) => {
          displayedTime = mediaTime;
          draw();
          nextFrame();
        });
      } else {
        frameId = requestAnimationFrame(() => {
          if (!video.paused && displayedTime !== video.currentTime) {
            displayedTime = video.currentTime;
            draw();
          }
          nextFrame();
        });
      }
    }
    nextFrame();

    return () => {
      observer.disconnect();
      video.removeEventListener("loadeddata", drawCurrent);
      video.removeEventListener("seeked", drawCurrent);
      if (video.cancelVideoFrameCallback) video.cancelVideoFrameCallback(frameId);
      else cancelAnimationFrame(frameId);
    };
  }, [playback]);

  return (
    <>
      {error && <p role="alert">Recorded footage could not be played.</p>}
      <div className="recorded-player">
        <video
          ref={videoRef}
          crossOrigin="anonymous"
          src={playback.mediaUrl}
          aria-label={`Recorded footage ${playback.clip.id}`}
          controls
          controlsList="nofullscreen nodownload noremoteplayback"
          disablePictureInPicture
          disableRemotePlayback
          playsInline
          preload="auto"
          onError={() => setError(true)}
        />
        <canvas ref={canvasRef} aria-hidden="true" />
      </div>
    </>
  );
}

function SelectedClip({ clipId }) {
  const [playback, setPlayback] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    getClipPlayback(clipId).then(
      (result) => { if (active) setPlayback(result); },
      () => { if (active) setError(true); },
    );
    return () => { active = false; };
  }, [clipId]);

  if (error) return <p role="alert">Recorded footage is unavailable.</p>;
  if (!playback) return <p role="status">Loading recorded footage…</p>;
  return <ClipVideo playback={playback} />;
}

export default function RecordedPlayer() {
  const [clipId, setClipId] = useState(CLIPS[0]);
  return (
    <section className="case-detail-footage">
      <label>
        Demo footage
        <select value={clipId} onChange={(event) => setClipId(event.target.value)}>
          {CLIPS.map((clip) => <option key={clip}>{clip}</option>)}
        </select>
      </label>
      <SelectedClip key={clipId} clipId={clipId} />
    </section>
  );
}
