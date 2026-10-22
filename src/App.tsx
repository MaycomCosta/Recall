import { useEffect, useRef, useState } from "react";
import { BookMark, Button, ErrorMessage } from "./components/UI";
import { AboutMethod, Landing } from "./features/landing/Landing";
import { Library } from "./features/library/Library";
import { PassageForm } from "./features/library/PassageForm";
import { Practice } from "./features/practice/Practice";
import { displayDate, isDue, schedule } from "./features/reviews/schedule";
import { download, LibraryStorage } from "./lib/storage";
import { freshProgress, type Passage, type Rating } from "./types";

type View = "home" | "library" | "practice" | "edit";
export default function App() {
  const storage = useRef(new LibraryStorage());
  const [items, setItems] = useState<Passage[]>([]);
  const [view, setView] = useState<View>("home");
  const [activeId, setActiveId] = useState("");
  const [dueOnly, setDueOnly] = useState(false);
  const [storageError, setStorageError] = useState("");
  const [blocked, setBlocked] = useState(false);
  const [notice, setNotice] = useState("");
  function load() {
    try {
      setItems(storage.current.load().items);
      setStorageError("");
      setBlocked(false);
    } catch (e) {
      setStorageError(
        e instanceof Error ? e.message : "Could not load your library.",
      );
      setBlocked(true);
    }
  }
  // Load once; storage stays behind a typed service.
  // biome-ignore lint/correctness/useExhaustiveDependencies: load is intentionally used only at mount.
  useEffect(() => {
    load();
  }, []);
  function navigate(next: View) {
    setView(next);
    window.scrollTo({ top: 0, behavior: "instant" });
    requestAnimationFrame(() =>
      document.getElementById("main")?.focus({ preventScroll: true }),
    );
  }
  function persist(next: Passage[]) {
    try {
      storage.current.save({ version: 1, items: next });
      setItems(next);
      setStorageError("");
      return true;
    } catch (e) {
      setStorageError(
        e instanceof Error
          ? e.message
          : "Could not save. Your changes have not been saved.",
      );
      return false;
    }
  }
  function update(item: Passage) {
    return persist(items.map((i) => (i.id === item.id ? item : i)));
  }
  function save(item: Passage, practice: boolean) {
    const exists = items.some((i) => i.id === item.id);
    if (
      !persist(
        exists
          ? items.map((i) => (i.id === item.id ? item : i))
          : [item, ...items],
      )
    )
      return false;
    setActiveId(item.id);
    setNotice(practice ? "Passage saved. Let’s practise." : "Changes saved.");
    navigate(practice ? "practice" : "library");
    return true;
  }
  function finish(item: Passage, rating: Rating) {
    const now = new Date();
    const result = schedule(
      item.progress.reviewStep,
      rating,
      item.progress.assisted,
      now,
    );
    const updated: Passage = {
      ...item,
      updatedAt: now.toISOString(),
      nextReview: result.nextReview,
      learned: false,
      progress: {
        ...freshProgress(),
        reviewStep: result.reviewStep,
        lastPractice: now.toISOString(),
      },
      history: [
        ...item.history,
        {
          date: now.toISOString(),
          rating,
          assisted: item.progress.assisted,
          nextReview: result.nextReview,
        },
      ].slice(-1000),
    };
    if (update(updated)) {
      setNotice(
        `Practice saved. ${result.days === 0 ? "Ready for another attempt today." : `Next review: ${displayDate(result.nextReview)}.`}`,
      );
      navigate("library");
    }
  }
  const active = items.find((i) => i.id === activeId);
  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <header className="site-header">
        <div className="header-inner">
          <button
            type="button"
            className="brand"
            onClick={() => navigate("home")}
            aria-label="Recall home"
          >
            <BookMark />
            <span>recall</span>
          </button>
          <nav aria-label="Main navigation">
            <Button
              variant="quiet"
              aria-current={view === "home" ? "page" : undefined}
              onClick={() => navigate("home")}
            >
              New passage
            </Button>
            <Button
              className={view === "library" ? "selected" : ""}
              onClick={() => {
                setDueOnly(false);
                navigate("library");
              }}
            >
              My library{" "}
              {items.length > 0 && (
                <span className="count">{items.length}</span>
              )}
            </Button>
          </nav>
        </div>
      </header>
      <main id="main" tabIndex={-1} className="page-shell">
        {storageError && (
          <div className="storage-warning">
            <ErrorMessage>{storageError}</ErrorMessage>
            {blocked && (
              <div className="flex flex-wrap gap-2">
                <Button onClick={load}>Retry storage</Button>
                <Button
                  onClick={() => {
                    try {
                      download(
                        "recall-original-data.json",
                        storage.current.original(),
                      );
                    } catch {
                      setStorageError(
                        "Browser storage is inaccessible. No original data could be downloaded.",
                      );
                    }
                  }}
                >
                  Download original data
                </Button>
                <Button
                  variant="danger"
                  onClick={() => {
                    if (
                      window.confirm(
                        "Reset the local library? This deletes the unreadable stored data. Download the original data first.",
                      )
                    ) {
                      try {
                        setItems(storage.current.reset().items);
                        setBlocked(false);
                        setStorageError("");
                        setNotice(
                          "Local library reset. You can now import a valid backup.",
                        );
                      } catch {
                        setStorageError(
                          "Could not reset storage. Enable site storage in your browser.",
                        );
                      }
                    }
                  }}
                >
                  Reset local library
                </Button>
              </div>
            )}
          </div>
        )}
        {notice && (
          <div className="notice" role="status">
            <span>{notice}</span>
            <Button
              variant="quiet"
              aria-label="Dismiss message"
              onClick={() => setNotice("")}
            >
              ×
            </Button>
          </div>
        )}
        {view === "home" && (
          <>
            <Landing
              due={items.filter((i) => isDue(i)).length}
              onReviews={() => {
                setDueOnly(true);
                navigate("library");
              }}
            />
            <PassageForm onSave={save} />
            <AboutMethod />
          </>
        )}
        {view === "library" && (
          <Library
            items={items}
            dueOnly={dueOnly}
            onFilter={setDueOnly}
            onNew={() => navigate("home")}
            onPractice={(id) => {
              setActiveId(id);
              navigate("practice");
            }}
            onEdit={(id) => {
              setActiveId(id);
              navigate("edit");
            }}
            onDelete={(id) => {
              if (persist(items.filter((i) => i.id !== id)))
                setNotice("Passage deleted.");
            }}
            onToggle={(id) => {
              const item = items.find((i) => i.id === id);
              if (item)
                update({
                  ...item,
                  learned: !item.learned,
                  updatedAt: new Date().toISOString(),
                });
            }}
            onImport={(incoming) => {
              if (
                persist([
                  ...incoming.map((item) => ({
                    ...item,
                    id: crypto.randomUUID(),
                  })),
                  ...items,
                ])
              ) {
                setNotice(
                  `Imported ${incoming.length} ${incoming.length === 1 ? "passage" : "passages"} as new copies.`,
                );
                return true;
              }
              return false;
            }}
          />
        )}
        {view === "edit" && active && (
          <PassageForm
            key={active.id}
            existing={active}
            onSave={save}
            onCancel={() => navigate("library")}
          />
        )}
        {view === "practice" && active && (
          <Practice
            key={active.id}
            item={active}
            onUpdate={update}
            onFinish={finish}
            onExit={() => navigate("library")}
          />
        )}
      </main>
      <footer className="site-footer">
        <span className="footer-brand">recall</span>
        <span>A little practice. Words that stay with you.</span>
        <span>Private by design. Stored on your device.</span>
      </footer>
    </>
  );
}
