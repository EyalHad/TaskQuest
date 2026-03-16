import { describe, it, expect } from "vitest";
import { MILESTONES, getMilestone } from "../milestones";

describe("MILESTONES", () => {
  it("contains at least 10 milestone definitions", () => {
    expect(MILESTONES.length).toBeGreaterThanOrEqual(10);
  });

  it("all milestones have required fields", () => {
    for (const m of MILESTONES) {
      expect(m.key).toBeTruthy();
      expect(m.title).toBeTruthy();
      expect(m.description).toBeTruthy();
      expect(m.icon).toBeTruthy();
    }
  });

  it("all milestone keys are unique", () => {
    const keys = MILESTONES.map((m) => m.key);
    expect(new Set(keys).size).toBe(keys.length);
  });
});

describe("getMilestone", () => {
  it("returns milestone for a known key", () => {
    const m = getMilestone("first_quest");
    expect(m).toBeDefined();
    expect(m?.title).toBe("First Blood");
  });

  it("returns undefined for unknown key", () => {
    expect(getMilestone("nonexistent_key")).toBeUndefined();
  });

  it("finds all defined milestones by key", () => {
    for (const milestone of MILESTONES) {
      expect(getMilestone(milestone.key)).toBe(milestone);
    }
  });
});
