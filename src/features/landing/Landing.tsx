import { useState } from "react";
import { Button } from "../../components/UI";
import { firstLetters } from "../../lib/text";
export const EXAMPLE =
  "A little progress, every day, adds up to something remarkable.";
export function Landing({
  due,
  onReviews,
}: {
  due: number;
  onReviews: () => void;
}) {
  const [clues, setClues] = useState(false);
  return (
    <>
      {due > 0 && (
        <div className="due-banner">
          <span>
            <strong>
              {due} {due === 1 ? "passage is" : "passages are"} ready for
              review.
            </strong>{" "}
            A little practice keeps the words close.
          </span>
          <Button onClick={onReviews}>Review now</Button>
        </div>
      )}
      <section className="hero" aria-labelledby="welcome-title">
        <div className="hero-copy">
          <h1 id="welcome-title">
            Make the words you love easier to remember.
          </h1>
          <p className="intro">
            A verse. A good idea. A few words worth keeping.
            <br className="desktop-break" /> Read, practise with clues, then see
            what comes back.
          </p>
          <Button
            variant="primary"
            onClick={() => {
              document.getElementById("new-passage")?.scrollIntoView({
                behavior: window.matchMedia("(prefers-reduced-motion: reduce)")
                  .matches
                  ? "instant"
                  : "smooth",
              });
              document
                .getElementById("passage-text")
                ?.focus({ preventScroll: true });
            }}
          >
            Start practising <span aria-hidden="true">↗</span>
          </Button>
          <p className="micro">Your words, your pace. No account needed.</p>
        </div>
        <div className="example-sheet">
          <div className="flex items-center justify-between gap-3">
            <span className="small-label">A small moment of practice</span>
            <span className="sheet-symbol" aria-hidden="true">
              “
            </span>
          </div>
          <p className="example-quote" aria-live="polite">
            {clues ? firstLetters(EXAMPLE) : EXAMPLE}
          </p>
          <div className="example-bottom">
            <span>
              {clues
                ? "Let the initials lead you."
                : "Read it once. Then try the clues."}
            </span>
            <Button variant="quiet" onClick={() => setClues(!clues)}>
              {clues ? "Show full text" : "Show first letters"}{" "}
              <span aria-hidden="true">↔</span>
            </Button>
          </div>
        </div>
      </section>
      <section className="method-steps" aria-label="The practice process">
        <div>
          <span>1</span>
          <p>
            <strong>Read slowly</strong>
            <br />
            Give the words your attention.
          </p>
        </div>
        <div>
          <span>2</span>
          <p>
            <strong>Lean on clues</strong>
            <br />
            Reduce the help as you go.
          </p>
        </div>
        <div>
          <span>3</span>
          <p>
            <strong>Recall & revisit</strong>
            <br />
            Try from memory. Return later.
          </p>
        </div>
      </section>
    </>
  );
}
export function AboutMethod() {
  return (
    <details className="about">
      <summary>About the method</summary>
      <div className="prose">
        <p>
          Kūsho means ‘air writing’: tracing written characters with your
          finger. Research has found a modest benefit for recalling unfamiliar
          Japanese character shapes. Recall offers an optional tracing exercise
          alongside text-recall practice and spaced review.
        </p>
        <p>
          These exercises are an adaptation, not an established Japanese
          three-step system. The review intervals are practical defaults, not a
          scientifically exact schedule. There is no fixed number of repetitions
          and no promise of perfect retention.
        </p>
        <p>
          <a
            href="https://doi.org/10.1111/lang.12128"
            target="_blank"
            rel="noreferrer"
          >
            Read the Kūsho study ↗
          </a>
          <a
            href="https://www.retrievalpractice.org/spacing/"
            target="_blank"
            rel="noreferrer"
          >
            Learn about spaced practice ↗
          </a>
        </p>
      </div>
    </details>
  );
}
