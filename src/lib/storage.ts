import type { LibraryData, Passage, Progress, Review } from "../types";
export const STORAGE_KEY = "recall:library:v1";
const object = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === "object" && !Array.isArray(v);
const str = (v: unknown, max: number): v is string =>
  typeof v === "string" && v.length <= max;
const date = (v: unknown): v is string =>
  typeof v === "string" &&
  /^\d{4}-\d\d-\d\dT/.test(v) &&
  Number.isFinite(Date.parse(v));
const integer = (v: unknown, min: number, max: number): v is number =>
  typeof v === "number" && Number.isInteger(v) && v >= min && v <= max;
function validProgress(v: unknown, count: number): v is Progress {
  return (
    object(v) &&
    integer(v.chunkIndex, 0, count > 1 ? count : 0) &&
    ["read", "clues", "recall", "feedback", "review"].includes(
      String(v.stage),
    ) &&
    str(v.answer, 10000) &&
    typeof v.assisted === "boolean" &&
    integer(v.reviewStep, 0, 5) &&
    (v.lastPractice === null || date(v.lastPractice))
  );
}
function validReview(v: unknown): v is Review {
  return (
    object(v) &&
    date(v.date) &&
    ["Again", "Hard", "Good"].includes(String(v.rating)) &&
    typeof v.assisted === "boolean" &&
    date(v.nextReview)
  );
}
function validPassage(v: unknown): v is Passage {
  return (
    object(v) &&
    str(v.id, 100) &&
    v.id.length > 0 &&
    str(v.title, 200) &&
    str(v.text, 5000) &&
    !!v.text.trim() &&
    str(v.source, 300) &&
    Array.isArray(v.chunks) &&
    v.chunks.length > 0 &&
    v.chunks.length <= 5000 &&
    v.chunks.every((c) => str(c, 5000) && !!c.trim()) &&
    v.chunks.join("") === v.text &&
    date(v.createdAt) &&
    date(v.updatedAt) &&
    date(v.nextReview) &&
    typeof v.learned === "boolean" &&
    validProgress(v.progress, v.chunks.length) &&
    Array.isArray(v.history) &&
    v.history.length <= 1000 &&
    v.history.every(validReview)
  );
}
export function validateData(value: unknown): LibraryData {
  if (
    !object(value) ||
    value.version !== 1 ||
    !Array.isArray(value.items) ||
    value.items.length > 500 ||
    !value.items.every(validPassage) ||
    new Set(value.items.map((i) => i.id)).size !== value.items.length
  )
    throw new Error(
      "This file is not a valid Recall v1 backup. Check the file and try again.",
    );
  return { version: 1, items: value.items };
}
export interface StoragePort {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}
export class LibraryStorage {
  private baseline: string | null = null;
  private ready = false;
  constructor(
    private readonly port: () => StoragePort = () => window.localStorage,
  ) {}
  load(): LibraryData {
    try {
      this.baseline = this.port().getItem(STORAGE_KEY);
    } catch {
      throw new Error(
        "Browser storage is unavailable. Enable site storage, then retry. Your unsaved text stays on this page.",
      );
    }
    if (this.baseline === null) {
      this.ready = true;
      return { version: 1, items: [] };
    }
    try {
      const data = validateData(JSON.parse(this.baseline));
      this.ready = true;
      return data;
    } catch {
      this.ready = false;
      throw new Error(
        "Saved data could not be read. It has not been overwritten. Download the original data before resetting, or restore a valid backup after reset.",
      );
    }
  }
  save(data: LibraryData): void {
    validateData(data);
    if (!this.ready)
      throw new Error(
        "Storage is not ready. Resolve the storage warning before saving.",
      );
    let current: string | null;
    try {
      current = this.port().getItem(STORAGE_KEY);
    } catch {
      throw new Error(
        "Browser storage is unavailable. Your changes have not been saved.",
      );
    }
    if (current !== this.baseline)
      throw new Error(
        "Your library changed in another tab. Reload this page before saving to avoid overwriting it. Copy any unsaved text first.",
      );
    const raw = JSON.stringify(data);
    try {
      this.port().setItem(STORAGE_KEY, raw);
    } catch {
      throw new Error(
        "Could not save. Browser storage may be full or disabled. Export your library and free space, then try again.",
      );
    }
    this.baseline = raw;
  }
  original(): string {
    return this.port().getItem(STORAGE_KEY) ?? "";
  }
  reset(): LibraryData {
    this.port().removeItem(STORAGE_KEY);
    this.baseline = null;
    this.ready = true;
    return { version: 1, items: [] };
  }
}
export function download(name: string, contents: string) {
  const url = URL.createObjectURL(
    new Blob([contents], { type: "application/json" }),
  );
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = name;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
