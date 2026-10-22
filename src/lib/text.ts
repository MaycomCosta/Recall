const WORD = /[\p{L}\p{M}\p{N}]+(?:['’][\p{L}\p{M}\p{N}]+)*/gu;
export const words = (text: string): string[] => text.match(WORD) ?? [];
export function firstLetters(text: string): string {
  return text.replace(WORD, (word) => Array.from(word.normalize("NFC"))[0]);
}
export function partialClues(text: string): string {
  let n = 0;
  return text.replace(WORD, (word) => (++n % 3 === 0 ? "____" : word));
}
/** Every character stays in exactly one chunk, including separators. */
export function chunkText(text: string, maxWords = 35): string[] {
  if (!text.trim()) return [];
  const sentences = text.match(
    /[^.!?。！？\n]+[.!?。！？]*[ \t]*\n*|[.!?。！？\n]+/gu,
  ) ?? [text];
  const result: string[] = [];
  for (const sentence of sentences) {
    const tokens = [...sentence.matchAll(/\S+\s*/gu)];
    if (tokens.length <= maxWords) {
      result.push(sentence);
      continue;
    }
    let start = 0;
    for (let i = maxWords; i < tokens.length; i += maxWords) {
      const end = tokens[i].index;
      result.push(sentence.slice(start, end));
      start = end;
    }
    result.push(sentence.slice(start));
  }
  // Attach whitespace-only pieces without ever discarding the original text.
  const clean: string[] = [];
  let leading = "";
  for (const part of result) {
    if (!part.trim()) {
      if (clean.length) clean[clean.length - 1] += part;
      else leading += part;
    } else {
      clean.push(leading + part);
      leading = "";
    }
  }
  return clean;
}
export function splitChunk(text: string, after: number): [string, string] {
  const tokens = [...text.matchAll(/\S+\s*/gu)];
  const at = tokens[after]?.index;
  return at === undefined ? [text, ""] : [text.slice(0, at), text.slice(at)];
}
export type Difference = {
  kind: "same" | "missing" | "extra" | "different";
  expected?: string;
  actual?: string;
};
const normalize = (word: string) =>
  word.normalize("NFC").toLocaleLowerCase().replace(/['’]/g, "");
/** Word-level edit distance keeps omissions from shifting every subsequent word. */
export function compareAnswer(original: string, answer: string): Difference[] {
  const a = words(original),
    b = words(answer),
    na = a.map(normalize),
    nb = b.map(normalize);
  const width = b.length + 1;
  const costs = new Uint16Array((a.length + 1) * width);
  for (let i = 0; i <= a.length; i++) costs[i * width] = i;
  for (let j = 0; j <= b.length; j++) costs[j] = j;
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++)
      costs[i * width + j] = Math.min(
        costs[(i - 1) * width + j] + 1,
        costs[i * width + j - 1] + 1,
        costs[(i - 1) * width + j - 1] + (na[i - 1] === nb[j - 1] ? 0 : 1),
      );
  const out: Difference[] = [];
  let i = a.length,
    j = b.length;
  while (i || j) {
    const v = costs[i * width + j];
    if (i && j && na[i - 1] === nb[j - 1]) {
      out.push({ kind: "same", expected: a[--i], actual: b[--j] });
    } else if (i && v === costs[(i - 1) * width + j] + 1)
      out.push({ kind: "missing", expected: a[--i] });
    else if (j && v === costs[i * width + j - 1] + 1)
      out.push({ kind: "extra", actual: b[--j] });
    else {
      out.push({ kind: "different", expected: a[--i], actual: b[--j] });
    }
  }
  return out.reverse();
}
