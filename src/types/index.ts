export type Stage = "read" | "clues" | "recall" | "feedback" | "review";
export type Rating = "Again" | "Hard" | "Good";
export interface Progress {
  chunkIndex: number;
  stage: Stage;
  answer: string;
  assisted: boolean;
  reviewStep: number;
  lastPractice: string | null;
}
export interface Review {
  date: string;
  rating: Rating;
  assisted: boolean;
  nextReview: string;
}
export interface Passage {
  id: string;
  title: string;
  text: string;
  source: string;
  chunks: string[];
  createdAt: string;
  updatedAt: string;
  progress: Progress;
  history: Review[];
  nextReview: string;
  learned: boolean;
}
export interface LibraryData {
  version: 1;
  items: Passage[];
}
export const freshProgress = (): Progress => ({
  chunkIndex: 0,
  stage: "read",
  answer: "",
  assisted: false,
  reviewStep: 0,
  lastPractice: null,
});
