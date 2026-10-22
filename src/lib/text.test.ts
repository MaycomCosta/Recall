import { describe, expect, it } from "vitest";
import { chunkText, compareAnswer, firstLetters, splitChunk } from "./text";

describe("chunking without rewriting", () => {
  it("preserves punctuation, accents, whitespace and line breaks exactly", () => {
    const text = "\n  Olá, mundo!  Café.\n\nKeep going?\nLast line  ";
    expect(chunkText(text).join("")).toBe(text);
    expect(chunkText(text).every((c) => !!c.trim())).toBe(true);
  });
  it("splits sentences and lines", () => {
    expect(chunkText("First sentence. Second one!\nThird line")).toHaveLength(
      3,
    );
  });
  it("falls back to bounded word groups", () => {
    const text = Array.from({ length: 90 }, (_, i) => `word${i}`).join(" ");
    const chunks = chunkText(text);
    expect(chunks).toHaveLength(3);
    expect(chunks.join("")).toBe(text);
    expect(chunks.every((c) => c.trim().split(/\s+/).length <= 35)).toBe(true);
  });
  it("does not drop punctuation-only runs", () => {
    for (const text of [
      "!!!",
      "\nhello\n",
      "“Quote.”\nNext — line.",
      "你好。世界！",
      "a\t b\r\nc",
    ])
      expect(chunkText(text).join("")).toBe(text);
  });
  it("rejects blank and lets boundaries move losslessly", () => {
    expect(chunkText("  \n")).toEqual([]);
    expect(splitChunk(" One  two\nthree", 2)).toEqual([" One  two\n", "three"]);
  });
});
describe("clues", () => {
  it("keeps accents, punctuation, line breaks and word boundaries", () => {
    expect(firstLetters("Élan, déjà vu!\nCafé  42.")).toBe("É, d v!\nC  4.");
    expect(firstLetters("E\u0301lan")).toBe("É");
  });
});
describe("sequence-aware comparison", () => {
  it("does not cascade a missing word", () => {
    const diff = compareAnswer(
      "One small step for a person",
      "One step for a person",
    );
    expect(diff.filter((d) => d.kind !== "same")).toEqual([
      { kind: "missing", expected: "small" },
    ]);
  });
  it("identifies extra and different words", () => {
    expect(
      compareAnswer("the green tree", "the very green tree").filter(
        (d) => d.kind !== "same",
      ),
    ).toEqual([{ kind: "extra", actual: "very" }]);
    expect(compareAnswer("a green tree", "a blue tree")[1].kind).toBe(
      "different",
    );
  });
  it("ignores case, whitespace and punctuation but preserves accents", () => {
    expect(
      compareAnswer("Hello, WORLD!", " hello  world ").every(
        (d) => d.kind === "same",
      ),
    ).toBe(true);
    expect(compareAnswer("Café", "cafe")[0].kind).toBe("different");
    expect(compareAnswer("Café", "Cafe\u0301")[0].kind).toBe("same");
    expect(
      compareAnswer("Don't stop.", "dont stop").every((d) => d.kind === "same"),
    ).toBe(true);
  });
  it("handles empty answers and repeated words", () => {
    expect(compareAnswer("a b", "").map((d) => d.kind)).toEqual([
      "missing",
      "missing",
    ]);
    expect(
      compareAnswer("go go home", "go home").filter(
        (d) => d.kind === "missing",
      ),
    ).toHaveLength(1);
  });
});
