import { useEffect, useRef, useState } from "react";
import { getClipPlayback, getPass } from "../api/client";
import { drawVideoOverlay, frameAtTime, vehicleAtPoint } from "./videoOverlay";
import WindshieldPanel from "./WindshieldPanel";
import PassTimeline from "./PassTimeline";

const CLIPS = ["Cba002", "Cba052", "Cba065"];

function ClipVideo({ playback, pass, seekTime, onOpenPass }) {
  const passId = pass?.passId;
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const displayedTime = useRef(null);
  const [frame, setFrame] = useState(null);
  const [seekFrame, setSeekFrame] = useState(null);
  const [error, setError] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [playError, setPlayError] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const sample = document.createElement("canvas").getContext("2d", {
      willReadFrequently: true,
    });
    let frameId;
    const draw = () => {
      const time = displayedTime.current ?? video.currentTime;
      drawVideoOverlay(canvas, video, sample, playback, time, passId);
    };
    const showFrame = (time) => {
      displayedTime.current = time;
      draw();
      const shownFrame = frameAtTime(time, playback.clip.fps);
      setFrame(shownFrame);
      if (pass && !video.paused && shownFrame >= pass.end.frame) {
        video.pause();
        if (shownFrame > pass.end.frame) video.currentTime = pass.end.time_s;
      }
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
  }, [playback, pass, passId]);

  function seek(time) {
    const video = videoRef.current;
    video.pause();
    if (video.currentTime !== time || video.seeking) {
      setFrame(null);
      setSeekFrame(frameAtTime(time, playback.clip.fps));
      video.currentTime = time;
    }
  }

  async function togglePlayback() {
    const video = videoRef.current;
    if (!video.paused) {
      video.pause();
      return;
    }
    setPlayError(false);
    if (video.currentTime >= pass.end.time_s) seek(pass.start.time_s);
    try {
      await video.play();
    } catch (error) {
      if (error.name !== "AbortError") setPlayError(true);
    }
  }

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
      onOpenPass({ passId: hit, clipId: playback.clip.id, seekTime: displayedTime.current });
    }
  }

  return (
    <>
      {(error || playError) && <p role="alert">Recorded footage could not be played.</p>}
      <div className={passId ? "recorded-analysis with-windshield" : "recorded-analysis"}>
        <div className="recorded-player">
          <video
            ref={videoRef}
            crossOrigin="anonymous"
            src={playback.mediaUrl}
            aria-label={`Recorded footage ${playback.clip.id}`}
            controls={!pass}
            controlsList="nofullscreen nodownload noremoteplayback"
            disablePictureInPicture
            disableRemotePlayback
            playsInline
            preload="auto"
            onLoadedMetadata={() => {
              if (pass) seek(seekTime ?? pass.start.time_s);
            }}
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
            onEnded={() => setPlaying(false)}
            onError={() => setError(true)}
            onClick={clickVehicle}
          />
          <canvas ref={canvasRef} aria-hidden="true" />
        </div>
        {pass && <WindshieldPanel pass={pass} frame={frame} playing={playing} onSeek={seek} />}
        {pass && <PassTimeline pass={pass} frame={frame ?? seekFrame} playing={playing} onTogglePlayback={togglePlayback} onSeek={seek} />}
      </div>
    </>
  );
}

function SelectedClip({ clipId, passId, seekTime, onOpenPass }) {
  const [playback, setPlayback] = useState(null);
  const [pass, setPass] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    getClipPlayback(clipId).then(
      (result) => { if (active) setPlayback(result); },
      () => { if (active) setError(true); },
    );
    if (passId) {
      getPass(passId).then(
        (result) => { if (active) setPass(result); },
        () => { if (active) setError(true); },
      );
    }
    return () => { active = false; };
  }, [clipId, passId]);

  if (error) return <p role="alert">Recorded footage is unavailable.</p>;
  if (!playback || (passId && !pass)) return <p role="status">Loading recorded footage…</p>;
  return <ClipVideo playback={playback} pass={pass} seekTime={seekTime} onOpenPass={onOpenPass} />;
}

export default function RecordedPlayer({ passId, initialClipId, seekTime, onOpenPass }) {
  const [chosenClip, setClipId] = useState(CLIPS[0]);
  const clipId = initialClipId ?? chosenClip;
  return (
    <section className="case-detail-footage">
      {!passId && (
        <label>
          Demo footage
          <select value={clipId} onChange={(event) => setClipId(event.target.value)}>
            {CLIPS.map((clip) => <option key={clip}>{clip}</option>)}
          </select>
        </label>
      )}
      <SelectedClip key={passId ?? clipId} clipId={clipId} passId={passId} seekTime={seekTime} onOpenPass={onOpenPass} />
    </section>
  );
}
