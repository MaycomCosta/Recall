import { useState } from "react";
import { Button, ErrorMessage } from "../../components/UI";
import { chunkText, splitChunk } from "../../lib/text";
import { freshProgress, type Passage } from "../../types";
import { EXAMPLE } from "../landing/Landing";
export function PassageForm({
  existing,
  onSave,
  onCancel,
}: {
  existing?: Passage;
  onSave: (item: Passage, practice: boolean) => boolean;
  onCancel?: () => void;
}) {
  const [title, setTitle] = useState(existing?.title ?? "");
  const [text, setText] = useState(existing?.text ?? "");
  const [source, setSource] = useState(existing?.source ?? "");
  const [chunks, setChunks] = useState(existing?.chunks ?? []);
  const [error, setError] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const textChanged = !!existing && text !== existing.text;
  const boundariesChanged =
    !!existing && chunks.join("\u0000") !== existing.chunks.join("\u0000");
  const reset = textChanged || boundariesChanged;
  function changeText(value: string) {
    setText(value);
    setChunks(chunkText(value));
    setConfirmed(false);
    setError("");
  }
  function save(practice: boolean) {
    if (!text.trim()) {
      setError("Add a few words you would like to remember.");
      return;
    }
    if (text.length > 5000) {
      setError("Keep your passage within 5,000 characters.");
      return;
    }
    if (reset && !confirmed) {
      setError("Confirm the progress reset below before saving changes.");
      return;
    }
    const now = new Date().toISOString();
    const item: Passage = {
      id: existing?.id ?? crypto.randomUUID(),
      title,
      text,
      source,
      chunks,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
      progress: existing && !reset ? existing.progress : freshProgress(),
      history: existing && !reset ? existing.history : [],
      nextReview: existing && !reset ? existing.nextReview : now,
      learned: existing && !reset ? existing.learned : false,
    };
    if (onSave(item, practice) && !existing) {
      setTitle("");
      setText("");
      setSource("");
      setChunks([]);
    }
  }
  return (
    <section
      id="new-passage"
      className="editor-section"
      aria-labelledby="editor-title"
    >
      <div className="section-heading">
        <div>
          <h2 id="editor-title">
            {existing
              ? "Edit your passage"
              : "What would you like to remember?"}
          </h2>
          <p>
            {existing
              ? "Make it yours. Your original wording stays intact."
              : "Bring a passage that means something to you."}
          </p>
        </div>
        {!existing && (
          <Button
            variant="quiet"
            onClick={() => {
              changeText(EXAMPLE);
              setTitle("A little progress");
              setSource("");
            }}
          >
            Try an example <span aria-hidden="true">＋</span>
          </Button>
        )}
      </div>
      <form
        className="editor"
        onSubmit={(e) => {
          e.preventDefault();
          save(!existing);
        }}
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <label>
            Title <span className="optional">(optional)</span>
            <input
              maxLength={200}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="A name to find it by"
            />
          </label>
          <label>
            Source or reference <span className="optional">(optional)</span>
            <input
              maxLength={300}
              value={source}
              onChange={(e) => setSource(e.target.value)}
              placeholder="e.g. Psalm 23:1"
            />
          </label>
        </div>
        <label className="block mt-5" htmlFor="passage-text">
          Your passage
        </label>
        <textarea
          id="passage-text"
          className="passage-input"
          value={text}
          onChange={(e) => changeText(e.target.value)}
          maxLength={5000}
          rows={5}
          placeholder="Paste or write the words you want to keep…"
          aria-describedby="text-count passage-error"
          aria-invalid={!!error}
        />
        <div className="field-meta">
          <span>
            Verses, quotes, definitions, speeches. Anything worth remembering.
          </span>
          <span id="text-count">{text.length.toLocaleString()} / 5,000</span>
        </div>
        {chunks.length > 0 && (
          <details className="chunk-editor">
            <summary>
              Inspect & adjust practice chunks{" "}
              <span className="badge">{chunks.length}</span>
            </summary>
            <p className="muted text-sm mt-3">
              Split at a word boundary or join neighbouring chunks. Your text is
              never rewritten.
            </p>
            {chunks.map((chunk, i) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: boundary edits intentionally recreate stateless chunk rows.
              <div className="chunk-row" key={`${i}-${chunk.length}`}>
                <div className="chunk-label">Chunk {i + 1}</div>
                <p className="whitespace-pre-wrap break-words">{chunk}</p>
                <div className="flex flex-wrap gap-2 mt-3">
                  {(chunk.match(/\S+/g)?.length ?? 0) > 1 && (
                    <label className="split-label">
                      Split after
                      <select
                        aria-label={`Split chunk ${i + 1} after word`}
                        value=""
                        onChange={(e) => {
                          const pair = splitChunk(
                            chunk,
                            Number(e.target.value),
                          );
                          setChunks([
                            ...chunks.slice(0, i),
                            ...pair,
                            ...chunks.slice(i + 1),
                          ]);
                          setConfirmed(false);
                        }}
                      >
                        <option value="">Choose a word</option>
                        {[...chunk.matchAll(/\S+/g)]
                          .slice(0, -1)
                          .map((word, n) => (
                            <option key={word.index} value={n + 1}>
                              {n + 1}: {word[0]}
                            </option>
                          ))}
                      </select>
                    </label>
                  )}
                  {i < chunks.length - 1 && (
                    <Button
                      onClick={() => {
                        setChunks([
                          ...chunks.slice(0, i),
                          chunk + chunks[i + 1],
                          ...chunks.slice(i + 2),
                        ]);
                        setConfirmed(false);
                      }}
                    >
                      Join with next
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </details>
        )}
        {reset && (
          <div className="warning mt-4">
            <strong>
              Changing the passage or its chunks resets practice progress,
              learned status, and review history.
            </strong>
            <label className="check-label">
              <input
                type="checkbox"
                checked={confirmed}
                onChange={(e) => setConfirmed(e.target.checked)}
              />{" "}
              Reset progress when I save
            </label>
          </div>
        )}
        <div id="passage-error">
          {error && <ErrorMessage>{error}</ErrorMessage>}
        </div>
        <div className="editor-actions">
          <p className="text-sm muted">
            Saved in this browser on this device.
            <br />
            Clearing browser data may remove your library.
          </p>
          <div className="flex flex-wrap gap-2">
            {onCancel && <Button onClick={onCancel}>Cancel</Button>}
            <Button type="submit" variant="primary">
              {existing ? "Save changes" : "Save and practise"}{" "}
              <span aria-hidden="true">↗</span>
            </Button>
          </div>
        </div>
      </form>
    </section>
  );
}
