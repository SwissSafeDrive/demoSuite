export type AssetStatus = {
  state: "idle" | "missing_sas" | "checking" | "downloading" | "error" | "sas_rejected" | "ready";
  sas_configured: boolean;
  sas_source: "env" | "pasted" | null;
  bytes_done: number;
  bytes_total: number;
  bytes_downloaded: number;
  files_done: number;
  files_total: number;
  current_file: string | null;
  error: { code: string; message: string } | null;
};

export type ReviewState = "pending" | "reviewed" | "confirmed" | "discarded";

export type Decision = {
  passId: string;
  state: ReviewState;
  operator_id: string | null;
  decision_at: string | null;
};

export type ManualFlag = { passId: string; flagged_manually: boolean };

type Clip = { id: string; filename: string; fps: number; width: number; height: number };
type Moment = { frame: number; time_s: number };
type Box = [number, number, number, number];
type Point = [number, number];
type Quad = [Point, Point, Point, Point];
type Signal = { percent: number; label: "SIMULATED SIGNAL" };

export type Candidate = ManualFlag & {
  clipId: string;
  seekTime: number;
  state: ReviewState;
  signal: (Signal & { color: string }) | null;
};

export type PassSelection = Pick<Candidate, "passId" | "clipId" | "seekTime">;

export type Pass = ManualFlag & {
  clip: Clip;
  start: Moment;
  end: Moment;
  track_ids: number[];
  class: string;
  geometry: [frame: number, box: Box, quad: Quad | null][];
  windshield_visibility: string;
  best_snapshots: (Moment & { box_px: Box; windshield_quad_px: Quad })[];
  flag_time: Moment | null;
  classification: "Candidate" | "Not assessable" | "unflagged";
  annotations: (Moment & { type: "phone_confidence"; confidence: number; label: Signal["label"] })[];
  behaviours: { type: string; start: Moment; end: Moment; duration_s: number; label: Signal["label"] }[];
};

export type ClipPlayback = {
  clip: Clip;
  mediaPath: string;
  frames: Record<
    number,
    {
      passId: string;
      box: Box;
      quad: Quad | null;
      boxColor: string;
      quadColor: string;
      signal: Signal | null;
    }[]
  >;
};

export type PassCrops = {
  passId: string;
  clipId: string;
  trackIds: number[];
  fps: number;
  status: "available" | "Not assessable";
  frames: (Moment & { url: string })[];
};
