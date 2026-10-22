import { useState } from "react";
import { Button, ErrorMessage } from "../../components/UI";
import { compareAnswer, firstLetters, partialClues } from "../../lib/text";
import type { Passage, Progress, Rating } from "../../types";
import { schedule } from "../reviews/schedule";
import { TracingPad } from "./TracingPad";
export function Practice({
  item,
  onUpdate,
  onFinish,
  onExit,
}: {
  item: Passage;
  onUpdate: (item: Passage) => boolean;
  onFinish: (item: Passage, rating: Rating) => void;
  onExit: () => void;
}) {
  const [support, setSupport] = useState(1);
  const [revealed, setRevealed] = useState(false);
  const [answer, setAnswer] = useState(item.progress.answer);
  const [error, setError] = useState("");
  const p = item.progress;
  const whole = p.chunkIndex === item.chunks.length;
  const text = whole ? item.text : item.chunks[p.chunkIndex];
  const update = (patch: Partial<Progress>) =>
    onUpdate({
      ...item,
      updatedAt: new Date().toISOString(),
      progress: { ...p, ...patch },
    });
  function next() {
    if (update({ stage: "read", chunkIndex: p.chunkIndex + 1, answer: "" })) {
      setAnswer("");
      setRevealed(false);
      setSupport(1);
    }
  }
  const diffs = p.stage === "feedback" ? compareAnswer(text, answer) : [];
  const counts = {
    missing: diffs.filter((d) => d.kind === "missing").length,
    extra: diffs.filter((d) => d.kind === "extra").length,
    different: diffs.filter((d) => d.kind === "different").length,
  };
  return (
    <section className="practice-page" aria-labelledby="practice-title">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-8">
        <Button variant="quiet" onClick={onExit}>
          ← Back to library
        </Button>
        <span className="small-label">
          {whole
            ? "Whole passage"
            : `Chunk ${p.chunkIndex + 1} of ${item.chunks.length}`}
        </span>
      </div>
      <h1 id="practice-title" className="page-title">
        {item.title || "Your passage"}
      </h1>
      {item.source && <p className="muted mt-2">{item.source}</p>}
      <ol className="stage-list" aria-label="Practice stages">
        {(["read", "clues", "recall"] as const).map((stage, i) => (
          <li
            key={stage}
            className={
              p.stage === stage ||
              (i === 2 && ["feedback", "review"].includes(p.stage))
                ? "active"
                : ""
            }
            aria-current={p.stage === stage ? "step" : undefined}
          >
            <span>{i + 1}</span>
            {["Read", "Use clues", "Recall"][i]}
          </li>
        ))}
      </ol>
      <div className="practice-card">
        {p.stage === "read" && (
          <>
            <div className="practice-instruction">
              <h2>Let the words settle.</h2>
              <p>Read aloud if you like. Take all the time you need.</p>
            </div>
            <p className="passage-display">{text}</p>
            <div className="card-footer">
              <span className="muted text-sm">
                No repetition count. Move on when you’re ready.
              </span>
              <Button
                variant="primary"
                onClick={() => update({ stage: "clues" })}
              >
                Continue to clues
              </Button>
            </div>
          </>
        )}
        {p.stage === "clues" && (
          <>
            <div className="practice-instruction">
              <h2>A little less help, at your pace.</h2>
              <p>Say the passage aloud, then reduce the support.</p>
            </div>
            <fieldset className="support-controls" aria-label="Clue level">
              {[
                "Full text",
                "Some words hidden",
                "First-letter clues",
                "All text hidden",
              ].map((label, i) => (
                <Button
                  key={label}
                  aria-pressed={support === i}
                  className={support === i ? "selected" : ""}
                  onClick={() => {
                    setSupport(i);
                    setRevealed(false);
                  }}
                >
                  {label}
                </Button>
              ))}
            </fieldset>
            <div className="passage-display" aria-live="polite">
              {revealed || support === 0 ? (
                text
              ) : support === 1 ? (
                partialClues(text)
              ) : support === 2 ? (
                firstLetters(text)
              ) : (
                <span className="hidden-passage">
                  The words are yours to find.
                  <br />
                  <small>Try saying this chunk from memory.</small>
                </span>
              )}
            </div>
            <Button
              onClick={() => {
                if (!revealed && !update({ assisted: true })) return;
                setRevealed(!revealed);
              }}
            >
              {revealed ? "Hide reveal" : "Reveal"}
            </Button>
            {p.assisted && (
              <p className="assistance-note">
                Reveal used in this session. Your review interval will not
                advance.
              </p>
            )}
            <TracingPad />
            <div className="card-footer">
              <span className="text-sm muted">Ready to try without clues?</span>
              <Button
                variant="primary"
                onClick={() => {
                  setRevealed(false);
                  update({ stage: "recall" });
                }}
              >
                Try from memory
              </Button>
            </div>
          </>
        )}
        {p.stage === "recall" && (
          <>
            <div className="practice-instruction">
              <h2>What comes back to you?</h2>
              <p>The original is hidden. Write what you remember.</p>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!answer.trim()) {
                  setError(
                    "Type what you remember before checking. Even a few words are a start.",
                  );
                  return;
                }
                update({ stage: "feedback", answer });
              }}
            >
              <label htmlFor="recall-answer">Your answer</label>
              <textarea
                id="recall-answer"
                autoComplete="off"
                spellCheck={false}
                rows={7}
                maxLength={10000}
                value={answer}
                onChange={(e) => {
                  setAnswer(e.target.value);
                  setError("");
                  update({ answer: e.target.value });
                }}
                aria-describedby="comparison-rules"
              />
              <p id="comparison-rules" className="text-sm muted mt-2">
                Comparison ignores capitalization, repeated spaces, and most
                punctuation. Accents and word differences count.
              </p>
              {error && <ErrorMessage>{error}</ErrorMessage>}
              <div className="flex flex-wrap gap-2 mt-4">
                <Button
                  onClick={() => {
                    if (!revealed && !update({ assisted: true, answer }))
                      return;
                    setRevealed(!revealed);
                  }}
                >
                  {revealed ? "Hide original" : "Reveal original"}
                </Button>
                {p.assisted && (
                  <span className="assistance-note">
                    Reveal used • assisted session
                  </span>
                )}
              </div>
              {revealed && <p className="revealed-text">{text}</p>}
              <div className="card-footer">
                <span className="text-sm muted">
                  A missed word is a place to practise.
                </span>
                <Button variant="primary" type="submit">
                  Check my answer
                </Button>
              </div>
            </form>
          </>
        )}
        {p.stage === "feedback" && (
          <>
            <div className="practice-instruction">
              <h2>
                {counts.missing + counts.extra + counts.different === 0
                  ? "The words came back."
                  : "Here’s where to focus."}
              </h2>
              <p>
                {counts.missing} missing · {counts.extra} extra ·{" "}
                {counts.different} different words
              </p>
            </div>
            <div className="feedback-columns">
              <div>
                <h3>Original passage</h3>
                <p className="original-feedback">{text}</p>
              </div>
              <div>
                <h3>Your answer</h3>
                <p className="original-feedback">{answer}</p>
              </div>
            </div>
            <h3 className="mt-6">Word-by-word comparison</h3>
            <p className="comparison">
              {diffs.map((d, i) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: stateless comparison tokens retain sequence positions.
                <span key={`${i}-${d.kind}`} className={`diff ${d.kind}`}>
                  {d.kind === "same" ? (
                    d.actual
                  ) : d.kind === "missing" ? (
                    <>
                      <small>Missing</small> {d.expected}
                    </>
                  ) : d.kind === "extra" ? (
                    <>
                      <small>Extra</small> {d.actual}
                    </>
                  ) : (
                    <>
                      <small>Different</small> <s>{d.actual}</s> → {d.expected}
                    </>
                  )}
                </span>
              ))}
            </p>
            <div className="card-footer">
              <Button
                onClick={() => {
                  setRevealed(false);
                  update({ stage: "recall", assisted: true });
                }}
              >
                Try this part again
              </Button>
              {!whole && p.chunkIndex < item.chunks.length - 1 ? (
                <Button variant="primary" onClick={next}>
                  Next chunk
                </Button>
              ) : (
                <Button
                  variant="primary"
                  onClick={() => update({ stage: "review" })}
                >
                  Finish practice
                </Button>
              )}
            </div>
            <p className="text-sm muted mt-3">
              Retrying after feedback is recorded as assisted practice for this
              session.
            </p>
          </>
        )}
        {p.stage === "review" && (
          <>
            <div className="practice-instruction">
              <h2>A little practice, well spent.</h2>
              <p>How did recalling the passage feel?</p>
            </div>
            {!whole && item.chunks.length > 1 && (
              <div className="whole-offer">
                <p>You’ve practised every chunk. Bring them together?</p>
                <Button onClick={next}>Practise the whole passage</Button>
              </div>
            )}
            {p.assisted && (
              <p className="warning">
                You used assistance. “Good” will schedule an earlier review
                without advancing your interval.
              </p>
            )}
            <div className="rating-options">
              {(["Again", "Hard", "Good"] as const).map((rating) => {
                const s = schedule(p.reviewStep, rating, p.assisted);
                return (
                  <Button
                    key={rating}
                    variant={rating === "Good" ? "primary" : "secondary"}
                    onClick={() => onFinish(item, rating)}
                  >
                    <strong>{rating}</strong>
                    <span>
                      {s.days === 0
                        ? "Try again today"
                        : `Review in ${s.days} ${s.days === 1 ? "day" : "days"}`}
                    </span>
                  </Button>
                );
              })}
            </div>
            <p className="text-sm muted mt-6">
              Unaided “Good” reviews move through 1, 3, 7, 14, then 30 days.
              “Hard” reviews come earlier without advancing. “Again” stays due
              today. These are practical defaults, not an exact science.
            </p>
          </>
        )}
      </div>
    </section>
  );
}
