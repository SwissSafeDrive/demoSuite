import { useEffect, useRef, useState } from "react";
import { getClipPlayback } from "../api/client";
import { drawVideoOverlay, frameAtTime, vehicleAtPoint } from "./videoOverlay";
import WindshieldPanel from "./WindshieldPanel";

const CLIPS = ["Cba002", "Cba052", "Cba065"];

function ClipVideo({ playback, passId, onOpenPass }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const displayedTime = useRef(null);
  const [frame, setFrame] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const sample = document.createElement("canvas").getContext("2d", {
      willReadFrequently: true,
    });
    let frameId;
    const draw = () => {
      const time = displayedTime.current ?? video.currentTime;
      drawVideoOverlay(canvas, video, sample, playback, time);
    };
    const showFrame = (time) => {
      displayedTime.current = time;
      draw();
      setFrame(frameAtTime(time, playback.clip.fps));
    };
    const drawCurrent = () => showFrame(video.currentTime);
    const clearFrame = () => {
      displayedTime.current = null;
      setFrame(null);
    };
    const observer = new ResizeObserver(draw);
    observer.observe(video);
    video.addEventListener("loadeddata", drawCurrent);
    video.addEventListener("seeked", drawCurrent);
    video.addEventListener("seeking", clearFrame);

    function nextFrame() {
      if (video.requestVideoFrameCallback) {
        frameId = video.requestVideoFrameCallback((_, { mediaTime }) => {
          showFrame(mediaTime);
          nextFrame();
        });
      } else {
        frameId = requestAnimationFrame(() => {
          if (!video.paused && displayedTime.current !== video.currentTime) {
            showFrame(video.currentTime);
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
      video.removeEventListener("seeking", clearFrame);
      if (video.cancelVideoFrameCallback) video.cancelVideoFrameCallback(frameId);
      else cancelAnimationFrame(frameId);
    };
  }, [playback]);

  function clickVehicle(event) {
    const video = event.currentTarget;
    if (event.target !== video || video.seeking || displayedTime.current === null) return;
    const rect = video.getBoundingClientRect();
    const hit = vehicleAtPoint(
      playback, displayedTime.current, rect,
      { width: video.videoWidth, height: video.videoHeight },
      event.clientX - rect.left, event.clientY - rect.top,
    );
    if (hit) {
      event.preventDefault();
      onOpenPass(hit, playback.clip.id);
    }
  }

  return (
    <>
      {error && <p role="alert">Recorded footage could not be played.</p>}
      <div className={passId ? "recorded-analysis with-windshield" : "recorded-analysis"}>
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
            onClick={clickVehicle}
          />
          <canvas ref={canvasRef} aria-hidden="true" />
        </div>
        {passId && <WindshieldPanel key={passId} passId={passId} frame={frame} />}
      </div>
    </>
  );
}

function SelectedClip({ clipId, passId, onOpenPass }) {
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
  return <ClipVideo playback={playback} passId={passId} onOpenPass={onOpenPass} />;
}

export default function RecordedPlayer({ selection, onOpenPass, onClearPass }) {
  const [chosenClip, setChosenClip] = useState(selection?.clipId ?? CLIPS[0]);
  const clipId = selection?.clipId ?? chosenClip;
  function changeClip(event) {
    setChosenClip(event.target.value);
    onClearPass();
  }
  return (
    <section className="case-detail-footage">
      <label>
        Demo footage
        <select value={clipId} onChange={changeClip}>
          {CLIPS.map((clip) => <option key={clip}>{clip}</option>)}
        </select>
      </label>
      <SelectedClip key={clipId} clipId={clipId} passId={selection?.passId} onOpenPass={onOpenPass} />
    </section>
  );
}
