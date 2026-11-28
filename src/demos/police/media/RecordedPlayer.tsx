import { useEffect, useRef, useState, type MouseEvent } from "react";
import { getClipPlayback } from "../api";
import type { ClipPlayback, Pass, PassSelection } from "../types";
import { drawVideoOverlay, frameAtTime, vehicleAtPoint } from "./videoOverlay";
import WindshieldPanel, { type FlagControls } from "./WindshieldPanel";
import PassTimeline from "./PassTimeline";
import "./media.css";

type RecordedPlayerProps = {
  pass: Pass;
  seekTime: number;
  onOpenPass: (target: PassSelection) => void;
  flagControls: FlagControls;
};

function ClipVideo({ playback, pass, seekTime, onOpenPass, flagControls }: RecordedPlayerProps & { playback: ClipPlayback }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const displayedTime = useRef<number | null>(null);
  const [frame, setFrame] = useState<number | null>(null);
  const [playing, setPlaying] = useState(false);
  const [error, setError] = useState(false);
  const { fps } = playback.clip;
  const { passId, end } = pass;

  useEffect(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const sample = document.createElement("canvas").getContext("2d", { willReadFrequently: true });
    const hasVideoCallbacks = typeof video.requestVideoFrameCallback === "function";
    let frameId = 0;

    function draw() {
      if (!video || !canvas || displayedTime.current === null) return;
      drawVideoOverlay(canvas, video, sample, playback, displayedTime.current, passId);
    }

    function showFrame(time: number) {
      if (!video || video.seeking || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) return;
      displayedTime.current = time;
      draw();
      const shownFrame = frameAtTime(time, fps);
      setFrame(shownFrame);
      if (!video.paused && shownFrame >= end.frame) {
        video.pause();
        if (shownFrame > end.frame) video.currentTime = end.time_s;
      }
    }

    const drawCurrent = () => showFrame(video.currentTime);
    const startSeek = () => {
      displayedTime.current = null;
      setFrame(null);
    };
    const nextFrame = () => {
      frameId = video.requestVideoFrameCallback((_, { mediaTime }) => {
        showFrame(mediaTime);
        nextFrame();
      });
    };

    const observer = new ResizeObserver(draw);
    observer.observe(video);
    video.addEventListener("loadeddata", drawCurrent);
    video.addEventListener("seeked", drawCurrent);
    video.addEventListener("seeking", startSeek);
    if (hasVideoCallbacks) nextFrame();
    else video.addEventListener("timeupdate", drawCurrent);
    drawCurrent();

    return () => {
      observer.disconnect();
      video.removeEventListener("loadeddata", drawCurrent);
      video.removeEventListener("seeked", drawCurrent);
      video.removeEventListener("seeking", startSeek);
      video.removeEventListener("timeupdate", drawCurrent);
      if (hasVideoCallbacks) video.cancelVideoFrameCallback(frameId);
    };
  }, [end, fps, passId, playback]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const seekToSelection = () => {
      video.pause();
      video.currentTime = seekTime;
    };
    if (video.readyState >= HTMLMediaElement.HAVE_METADATA) seekToSelection();
    else video.addEventListener("loadedmetadata", seekToSelection, { once: true });
    return () => video.removeEventListener("loadedmetadata", seekToSelection);
  }, [seekTime]);

  function seek(time: number) {
    const video = videoRef.current;
    if (!video) return;
    video.pause();
    if (video.currentTime !== time) video.currentTime = time;
  }

  async function togglePlayback() {
    const video = videoRef.current;
    if (!video) return;
    if (!video.paused) {
      video.pause();
      return;
    }
    setError(false);
    if (video.currentTime >= pass.end.time_s) seek(pass.start.time_s);
    try {
      await video.play();
    } catch (error) {
      if (!(error instanceof DOMException && error.name === "AbortError")) setError(true);
    }
  }

  function clickVehicle(event: MouseEvent<HTMLVideoElement>) {
    const video = event.currentTarget;
    const time = displayedTime.current;
    if (video.seeking || time === null) return;
    const rect = video.getBoundingClientRect();
    const passId = vehicleAtPoint(
      playback,
      time,
      rect,
      { width: video.videoWidth, height: video.videoHeight },
      event.clientX - rect.left,
      event.clientY - rect.top,
    );
    if (passId) onOpenPass({ passId, clipId: playback.clip.id, seekTime: time });
  }

  return (
    <>
      {error && <p role="alert">Recorded footage could not be played.</p>}
      <div className="recorded-analysis">
        <div className="recorded-player">
          <video
            ref={videoRef}
            crossOrigin="anonymous"
            src={playback.mediaPath}
            aria-label={`Recorded footage ${playback.clip.id}`}
            disablePictureInPicture
            disableRemotePlayback
            playsInline
            preload="auto"
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
            onEnded={() => setPlaying(false)}
            onError={() => setError(true)}
            onClick={clickVehicle}
          />
          <canvas ref={canvasRef} aria-hidden="true" />
        </div>
        <WindshieldPanel pass={pass} frame={frame} playing={playing} onSeek={seek} {...flagControls} />
        <PassTimeline pass={pass} frame={frame} playing={playing} onTogglePlayback={togglePlayback} onSeek={seek} />
      </div>
    </>
  );
}

export default function RecordedPlayer(props: RecordedPlayerProps) {
  const clipId = props.pass.clip.id;
  const [result, setResult] = useState<ClipPlayback | "error" | null>(null);

  useEffect(() => {
    let active = true;
    void getClipPlayback(clipId).then(
      (playback) => {
        if (active) setResult(playback);
      },
      () => {
        if (active) setResult("error");
      },
    );
    return () => {
      active = false;
    };
  }, [clipId]);

  return (
    <section className="case-detail-footage" aria-label="Recorded Pass playback">
      {result === "error" ? (
        <p role="alert">Recorded footage is unavailable.</p>
      ) : result ? (
        <ClipVideo {...props} playback={result} />
      ) : (
        <p role="status">Loading recorded footage…</p>
      )}
    </section>
  );
}
