import { describe, expect, it } from "vitest";
import { freshProgress, type LibraryData } from "../types";
import {
  LibraryStorage,
  STORAGE_KEY,
  type StoragePort,
  validateData,
} from "./storage";

const date = "2026-10-22T12:00:00.000Z";
function fixture(): LibraryData {
  return {
    version: 1,
    items: [
      {
        id: "test",
        title: "Title",
        text: "Café.\nHello!",
        source: "Source",
        chunks: ["Café.\n", "Hello!"],
        createdAt: date,
        updatedAt: date,
        progress: freshProgress(),
        history: [],
        nextReview: date,
        learned: false,
      },
    ],
  };
}
function memory(): StoragePort {
  const data = new Map<string, string>();
  return {
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => {
      data.set(key, value);
    },
    removeItem: (key) => {
      data.delete(key);
    },
  };
}
describe("validated, failure-safe storage", () => {
  it("round-trips saved content and progress", () => {
    const port = memory();
    const service = new LibraryStorage(() => port);
    service.load();
    const data = fixture();
    data.items[0].progress = {
      ...freshProgress(),
      stage: "recall",
      chunkIndex: 1,
      answer: "Hello",
    };
    service.save(data);
    expect(new LibraryStorage(() => port).load()).toEqual(data);
  });
  it("rejects bad versions, chunks, progress, dates, IDs and ratings", () => {
    for (const mutate of [
      (d: LibraryData) => {
        d.items[0].chunks = ["changed"];
      },
      (d: LibraryData) => {
        d.items[0].progress.chunkIndex = 99;
      },
      (d: LibraryData) => {
        d.items[0].updatedAt = "bad";
      },
      (d: LibraryData) => {
        d.items.push(d.items[0]);
      },
      (d: LibraryData) => {
        d.items[0].history = [
          {
            date,
            rating: "invalid" as "Good",
            assisted: false,
            nextReview: date,
          },
        ];
      },
    ]) {
      const d = fixture();
      mutate(d);
      expect(() => validateData(d)).toThrow();
    }
    expect(() => validateData({ version: 2, items: [] })).toThrow();
    expect(() => validateData({ version: 1, items: [null] })).toThrow();
  });
  it("does not overwrite corrupted data", () => {
    const port = memory();
    port.setItem(STORAGE_KEY, "broken");
    const service = new LibraryStorage(() => port);
    expect(() => service.load()).toThrow();
    expect(() => service.save(fixture())).toThrow();
    expect(port.getItem(STORAGE_KEY)).toBe("broken");
  });
  it("reports quota failure without claiming a successful save", () => {
    const port = memory();
    const service = new LibraryStorage(() => port);
    service.load();
    port.setItem = () => {
      throw new Error("QuotaExceededError");
    };
    expect(() => service.save(fixture())).toThrow("Could not save");
    expect(port.getItem(STORAGE_KEY)).toBeNull();
  });
  it("reports unavailable storage", () => {
    const service = new LibraryStorage(() => {
      throw new Error("SecurityError");
    });
    expect(() => service.load()).toThrow("unavailable");
  });
  it("detects concurrent changes", () => {
    const port = memory();
    const a = new LibraryStorage(() => port),
      b = new LibraryStorage(() => port);
    a.load();
    b.load();
    a.save(fixture());
    expect(() => b.save({ version: 1, items: [] })).toThrow("another tab");
  });
  it("treats imported markup as ordinary text", () => {
    const d = fixture();
    d.items[0].text = "<script>alert(1)</script>";
    d.items[0].chunks = [d.items[0].text];
    expect(validateData(d).items[0].text).toBe(d.items[0].text);
  });
});
