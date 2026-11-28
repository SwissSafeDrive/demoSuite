import type { RecordState } from "./types";

interface StateMeta {
  label: string;
  badgeClass: string;
}

const META: Record<RecordState, StateMeta> = {
  pending: { label: "Pending", badgeClass: "db-badge--pending" },
  reviewed: { label: "Reviewed", badgeClass: "db-badge--reviewed" },
  confirmed: { label: "Confirmed", badgeClass: "db-badge--confirmed" },
  discarded: { label: "Discarded", badgeClass: "db-badge--discarded" },
};

export function stateLabel(state: RecordState): string {
  return META[state].label;
}

export function stateBadgeClass(state: RecordState): string {
  return `db-badge ${META[state].badgeClass}`;
}
