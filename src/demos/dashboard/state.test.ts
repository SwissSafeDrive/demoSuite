import { describe, it, expect, beforeEach } from "vitest";
import { seedDataset, applyDecision, addSimulatedRecord } from "./state";
import type { DashboardRecord } from "./types";

describe("seedDataset", () => {
  it("returns exactly 4 records", () => {
    expect(seedDataset()).toHaveLength(4);
  });

  it("gives all records a pending state", () => {
    for (const r of seedDataset()) {
      expect(r.state).toBe("pending");
    }
  });

  it("all timestamps are within the last 60 minutes", () => {
    const now = Date.now();
    for (const r of seedDataset()) {
      const age = now - r.timestamp.getTime();
      expect(age).toBeGreaterThan(0);
      expect(age).toBeLessThanOrEqual(60 * 60_000);
    }
  });
});

describe("applyDecision", () => {
  let records: DashboardRecord[];

  beforeEach(() => {
    records = seedDataset();
  });

  it("updates the target record state", () => {
    const updated = applyDecision(records, 1, "confirmed", "operator-01");
    const target = updated.find((r) => r.id === 1);
    expect(target?.state).toBe("confirmed");
  });

  it("sets operator_id on the target record", () => {
    const updated = applyDecision(records, 2, "discarded", "operator-02");
    const target = updated.find((r) => r.id === 2);
    expect(target?.operator_id).toBe("operator-02");
  });

  it("sets decision_at to a recent date", () => {
    const before = new Date();
    const updated = applyDecision(records, 1, "reviewed", "operator-01");
    const after = new Date();
    const target = updated.find((r) => r.id === 1);
    const decisionTime = target?.decision_at?.getTime();
    expect(decisionTime).toBeGreaterThanOrEqual(before.getTime());
    expect(decisionTime).toBeLessThanOrEqual(after.getTime());
  });

  it("leaves all other records unchanged", () => {
    const updated = applyDecision(records, 1, "confirmed", "operator-01");
    const others = updated.filter((r) => r.id !== 1);
    const origOthers = records.filter((r) => r.id !== 1);
    for (let i = 0; i < others.length; i++) {
      expect(others[i].state).toBe(origOthers[i].state);
      expect(others[i].operator_id).toBe(origOthers[i].operator_id);
    }
  });

  it("does not mutate the original array", () => {
    const original = [...records];
    applyDecision(records, 1, "confirmed", "operator-01");
    expect(records[0].state).toBe(original[0].state);
  });
});

describe("addSimulatedRecord", () => {
  let records: DashboardRecord[];

  beforeEach(() => {
    records = seedDataset();
  });

  it("prepends a new record at index 0", () => {
    const updated = addSimulatedRecord(records, "blob:test");
    expect(updated).toHaveLength(records.length + 1);
    expect(updated[0].origin).toBe("camera");
  });

  it("gives the new record the supplied image_path", () => {
    const updated = addSimulatedRecord(records, "blob:abc123");
    expect(updated[0].image_path).toBe("blob:abc123");
  });

  it("gives the new record a pending state", () => {
    const updated = addSimulatedRecord(records, "blob:test");
    expect(updated[0].state).toBe("pending");
  });

  it("does not mutate the original array", () => {
    const originalLength = records.length;
    addSimulatedRecord(records, "blob:test");
    expect(records).toHaveLength(originalLength);
  });
});
