import type { Pass } from "../types";
import "./media.css";

type PassTimelineProps = {
  pass: Pass;
  frame: number | null;
  playing: boolean;
  onTogglePlayback: () => void;
  onSeek: (time: number) => void;
};

import { behaviourStretches, seconds } from "./passAnalysis";

export default function PassTimeline({ pass, frame, playing, onTogglePlayback, onSeek }: PassTimelineProps) {
  const { start, end, clip } = pass;
  const stretches = behaviourStretches(pass);
  const currentFrame = frame ?? start.frame;
  const span = end.frame - start.frame + 1;

  return (
    <section className="pass-timeline" aria-label="Whole Pass timeline">
      <h3>Whole Pass</h3>
      <div className="pass-playback">
        <button type="button" onClick={onTogglePlayback}>
          {playing ? "Pause" : "Play"}
        </button>
        <span>Clip time {seconds(currentFrame / clip.fps)}</span>
        <button type="button" onClick={() => onSeek(start.time_s)}>
          Go to Pass start
        </button>
      </div>
      <input
        aria-label="Whole Pass scrubber"
        aria-valuetext={seconds(currentFrame / clip.fps)}
        type="range"
        min={start.frame}
        max={end.frame}
        value={Math.min(end.frame, Math.max(start.frame, currentFrame))}
        onChange={(event) => onSeek(Number(event.target.value) / clip.fps)}
      />
      {stretches.length > 0 && (
        <div className="pass-stretch-track">
          {stretches.map((stretch) => (
            <button
              type="button"
              aria-label={`Seek to ${stretch.name.toLowerCase()} · ${stretch.label}`}
              aria-current={currentFrame >= stretch.seekFrame && currentFrame <= stretch.endFrame ? "true" : undefined}
              title={`${stretch.name} · ${stretch.label}`}
              onClick={() => onSeek(stretch.startTime)}
              key={`${stretch.name}-${stretch.seekFrame}`}
              style={{
                left: `${(100 * (stretch.seekFrame - start.frame)) / span}%`,
                width: `${(100 * (stretch.endFrame - stretch.seekFrame + 1)) / span}%`,
              }}
            />
          ))}
        </div>
      )}
      <div className="pass-time-bounds">
        <span>Start {seconds(start.time_s)}</span>
        <span>End {seconds(end.time_s)}</span>
      </div>
      {pass.flag_time && <p>Far approach footage provides context for the bridge decision.</p>}
      {stretches.length > 0 && (
        <ul className="pass-stretches">
          {stretches.map((stretch) => (
            <li key={`${stretch.name}-${stretch.seekFrame}`}>
              <button type="button" onClick={() => onSeek(stretch.startTime)}>
                <strong>{stretch.name}</strong>
                <span>
                  Start {seconds(stretch.startTime)} · End {seconds(stretch.endTime)} · Duration {seconds(stretch.duration)}
                </span>
                <span className="simulated-signal">{stretch.label}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
