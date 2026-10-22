import type { Passage, Rating } from "../../types";
export const INTERVALS = [1, 3, 7, 14, 30] as const;
export function schedule(
  step: number,
  rating: Rating,
  assisted: boolean,
  now = new Date(),
) {
  const next = new Date(now);
  let newStep = step;
  let days = 0;
  if (rating === "Good" && !assisted) {
    days = INTERVALS[Math.min(step, 4)];
    newStep = Math.min(step + 1, 5);
  } else if (rating === "Hard" || (rating === "Good" && assisted))
    days = Math.max(1, Math.floor(INTERVALS[Math.max(0, step - 1)] / 2));
  next.setDate(next.getDate() + days);
  return { reviewStep: newStep, nextReview: next.toISOString(), days };
}
export const isDue = (item: Passage, now = new Date()) =>
  !item.learned && new Date(item.nextReview).getTime() <= now.getTime();
export const displayDate = (date: string | null) =>
  date
    ? new Intl.DateTimeFormat("en", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }).format(new Date(date))
    : "Not yet";
