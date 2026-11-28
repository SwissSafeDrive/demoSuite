import type { RecordState, DashboardRecord } from "./types";

type FourImages = readonly [string, string, string, string];

const SEED_DATA = [
  {
    event_id: "INF-2024-0042",
    confidence: 0.91,
    location: "Via Lugano 14, Bellinzona",
    notice: "Art. 31 SVG/LCR — Distracted driving",
  },
  {
    event_id: "INF-2024-0041",
    confidence: 0.78,
    location: "Piazza Grande, Locarno",
    notice: "Art. 31 SVG/LCR — Distracted driving",
  },
  {
    event_id: "INF-2024-0040",
    confidence: 0.85,
    location: "Corso Elvezia 12, Lugano",
    notice: "Art. 31 SVG/LCR — Distracted driving",
  },
  {
    event_id: "INF-2024-0039",
    confidence: 0.62,
    location: "Via San Gottardo 8, Airolo",
    notice: "Art. 31 SVG/LCR — Distracted driving",
  },
] as const;

const OFFSETS_MIN = [8, 15, 27, 45] as const;

export function seedDataset(images?: FourImages): DashboardRecord[] {
  return SEED_DATA.map((s, i) => ({
    id: i + 1,
    event_id: s.event_id,
    timestamp: new Date(Date.now() - OFFSETS_MIN[i] * 60_000),
    confidence: s.confidence,
    location: s.location,
    demo_id: s.event_id,
    image_path: images ? images[i] : null,
    state: "pending" as const,
    operator_id: null,
    decision_at: null,
    origin: "simulated" as const,
    notice: s.notice,
  }));
}

export function applyDecision(records: DashboardRecord[], id: number, state: RecordState, operatorId: string): DashboardRecord[] {
  return records.map((r) => (r.id === id ? { ...r, state, operator_id: operatorId, decision_at: new Date() } : r));
}

export function addSimulatedRecord(records: DashboardRecord[], imageUrl: string): DashboardRecord[] {
  const nextId = Math.max(0, ...records.map((r) => r.id)) + 1;
  const event_id = `INF-2024-${String(nextId + 38).padStart(4, "0")}`;
  const newRecord: DashboardRecord = {
    id: nextId,
    event_id,
    timestamp: new Date(),
    confidence: 0.75,
    location: "Camera capture",
    demo_id: event_id,
    image_path: imageUrl,
    state: "pending",
    operator_id: null,
    decision_at: null,
    origin: "camera",
    notice: "Art. 31 SVG/LCR — Distracted driving",
  };
  return [newRecord, ...records];
}
