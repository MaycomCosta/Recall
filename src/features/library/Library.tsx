import { type ChangeEvent, useState } from "react";
import { BookMark, Button, ErrorMessage } from "../../components/UI";
import { download, validateData } from "../../lib/storage";
import type { Passage } from "../../types";
import { displayDate, isDue } from "../reviews/schedule";
export function Library({
  items,
  dueOnly,
  onFilter,
  onNew,
  onPractice,
  onEdit,
  onDelete,
  onToggle,
  onImport,
}: {
  items: Passage[];
  dueOnly: boolean;
  onFilter: (v: boolean) => void;
  onNew: () => void;
  onPractice: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onToggle: (id: string) => void;
  onImport: (items: Passage[]) => boolean;
}) {
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const filtered = items.filter(
    (item) =>
      (!dueOnly || isDue(item)) &&
      `${item.title} ${item.source} ${item.text}`
        .toLocaleLowerCase()
        .includes(search.toLocaleLowerCase()),
  );
  async function importFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    try {
      if (file.size > 5_000_000)
        throw new Error("Choose a JSON backup smaller than 5 MB.");
      const data = validateData(JSON.parse(await file.text()));
      if (onImport(data.items)) setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not read this file.");
    }
  }
  return (
    <section className="library-page">
      <div className="section-heading">
        <div>
          <h1 className="page-title">Your words, kept close.</h1>
          <p>
            {items.length} {items.length === 1 ? "passage" : "passages"} in your
            library · {items.filter((i) => isDue(i)).length} due for review
          </p>
        </div>
        <Button variant="primary" onClick={onNew}>
          ＋ Add passage
        </Button>
      </div>
      <div className="library-toolbar">
        <label className="search-label">
          Search your library
          <input
            type="search"
            placeholder="Search words, titles, or sources"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
        <label className="check-label">
          <input
            type="checkbox"
            checked={dueOnly}
            onChange={(e) => onFilter(e.target.checked)}
          />{" "}
          Due for review only
        </label>
      </div>
      {filtered.length === 0 ? (
        <div className="empty-state">
          <BookMark />
          <h2>
            {items.length === 0
              ? "A home for the words you love."
              : "Nothing here just yet."}
          </h2>
          <p>
            {items.length === 0
              ? "Save your first passage and make a little room for practice."
              : dueOnly
                ? "No matching passages are due. Try all passages or return later."
                : "Try a different search."}
          </p>
          {items.length === 0 ? (
            <Button variant="primary" onClick={onNew}>
              Add your first passage
            </Button>
          ) : (
            <Button
              onClick={() => {
                setSearch("");
                onFilter(false);
              }}
            >
              Show all passages
            </Button>
          )}
        </div>
      ) : (
        <div className="library-list">
          {filtered.map((item) => (
            <article className="library-item" key={item.id}>
              <div className="flex flex-wrap justify-between items-center gap-3">
                <h2>{item.title || "Untitled passage"}</h2>
                <span className={`badge ${isDue(item) ? "due" : ""}`}>
                  {item.learned
                    ? "Learned"
                    : isDue(item)
                      ? "Due for review"
                      : "In practice"}
                </span>
              </div>
              {item.source && (
                <p className="text-sm muted mt-1">{item.source}</p>
              )}
              <p className="library-excerpt">{item.text}</p>
              <div className="review-dates">
                <span>
                  Last practice{" "}
                  <strong>{displayDate(item.progress.lastPractice)}</strong>
                </span>
                <span>
                  Next review{" "}
                  <strong>
                    {item.learned
                      ? "Paused while learned"
                      : displayDate(item.nextReview)}
                  </strong>
                </span>
                <span>
                  {item.chunks.length}{" "}
                  {item.chunks.length === 1 ? "chunk" : "chunks"}
                </span>
              </div>
              <div className="flex flex-wrap gap-2 mt-5">
                <Button variant="primary" onClick={() => onPractice(item.id)}>
                  {item.progress.stage === "read" &&
                  item.progress.chunkIndex === 0
                    ? "Practise"
                    : "Resume practice"}
                </Button>
                <Button onClick={() => onEdit(item.id)}>Edit</Button>
                <Button onClick={() => onToggle(item.id)}>
                  {item.learned ? "Undo learned" : "Mark as learned"}
                </Button>
                <Button variant="quiet" onClick={() => setDeleteId(item.id)}>
                  Delete
                </Button>
              </div>
              {deleteId === item.id && (
                <div className="warning mt-4" role="alert">
                  <p>
                    Delete this passage and its practice history? This cannot be
                    undone.
                  </p>
                  <div className="flex flex-wrap gap-2 mt-3">
                    <Button
                      variant="danger"
                      onClick={() => {
                        onDelete(item.id);
                        setDeleteId(null);
                      }}
                    >
                      Delete permanently
                    </Button>
                    <Button onClick={() => setDeleteId(null)}>
                      Keep passage
                    </Button>
                  </div>
                </div>
              )}
              {item.history.length > 0 && (
                <details className="history">
                  <summary>Review history ({item.history.length})</summary>
                  <ul>
                    {item.history
                      .slice()
                      .reverse()
                      .map((r) => (
                        <li key={r.date}>
                          {displayDate(r.date)} — {r.rating}
                          {r.assisted ? " (assisted)" : " (unaided)"}; next
                          review {displayDate(r.nextReview)}
                        </li>
                      ))}
                  </ul>
                </details>
              )}
            </article>
          ))}
        </div>
      )}
      <div className="backup-panel">
        <div>
          <h2>Keep a copy of your words.</h2>
          <p>
            Saved in this browser on this device. Clearing browser data may
            remove your library.
          </p>
          <p className="text-sm mt-2">
            Import adds copies without replacing existing passages. Up to 500
            passages; backups under 5 MB.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={() =>
              download(
                "recall-backup.json",
                JSON.stringify({ version: 1, items }, null, 2),
              )
            }
          >
            Export JSON
          </Button>
          <label className="button secondary import-button">
            Import JSON
            <input
              type="file"
              accept="application/json,.json"
              aria-label="Import JSON backup"
              onChange={importFile}
            />
          </label>
        </div>
        {error && <ErrorMessage>{error}</ErrorMessage>}
      </div>
    </section>
  );
}
