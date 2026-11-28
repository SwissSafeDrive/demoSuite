export type RecordState = "pending" | "reviewed" | "confirmed" | "discarded";

export interface DashboardRecord {
  id: number;
  event_id: string;
  timestamp: Date;
  confidence: number;
  location: string;
  demo_id: string;
  image_path: string | null;
  state: RecordState;
  operator_id: string | null;
  decision_at: Date | null;
  origin: "simulated" | "camera";
  notice: string;
}
