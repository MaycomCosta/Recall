import { describe, expect, it } from "vitest";
import { schedule } from "./schedule";

const now = new Date("2026-10-22T12:00:00Z");
describe("transparent review schedule", () => {
  it("advances successful unaided reviews through the default intervals", () => {
    for (const [step, days] of [1, 3, 7, 14, 30, 30].entries()) {
      const result = schedule(step, "Good", false, now);
      expect(result.days).toBe(days);
      expect(result.reviewStep).toBe(Math.min(step + 1, 5));
    }
  });
  it("keeps Again due today without advancing", () => {
    expect(schedule(3, "Again", false, now)).toEqual({
      reviewStep: 3,
      nextReview: now.toISOString(),
      days: 0,
    });
  });
  it("schedules Hard earlier without advancing", () => {
    expect(schedule(3, "Hard", false, now)).toMatchObject({
      reviewStep: 3,
      days: 3,
    });
  });
  it("does not advance reveal-assisted Good practice", () => {
    expect(schedule(3, "Good", true, now)).toMatchObject({
      reviewStep: 3,
      days: 3,
    });
    expect(schedule(0, "Good", true, now)).toMatchObject({
      reviewStep: 0,
      days: 1,
    });
  });
});
