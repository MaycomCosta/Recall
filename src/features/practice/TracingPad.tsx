import { type PointerEvent, useRef, useState } from "react";
import { Button } from "../../components/UI";
export function TracingPad() {
  const [open, setOpen] = useState(false);
  const canvas = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  function point(event: PointerEvent<HTMLCanvasElement>) {
    const box = event.currentTarget.getBoundingClientRect();
    return {
      x: ((event.clientX - box.left) * 800) / box.width,
      y: ((event.clientY - box.top) * 260) / box.height,
    };
  }
  function start(event: PointerEvent<HTMLCanvasElement>) {
    const ctx = canvas.current?.getContext("2d");
    if (!ctx) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    drawing.current = true;
    const p = point(event);
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    ctx.strokeStyle = "#285942";
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
  }
  function move(event: PointerEvent<HTMLCanvasElement>) {
    if (!drawing.current) return;
    const ctx = canvas.current?.getContext("2d");
    const p = point(event);
    ctx?.lineTo(p.x, p.y);
    ctx?.stroke();
  }
  return (
    <div className="tracing">
      <Button
        variant="quiet"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
      >
        {open ? "Hide tracing pad" : "Try finger tracing (optional)"}{" "}
        <span aria-hidden="true">✎</span>
      </Button>
      {open && (
        <div>
          <p className="text-sm muted mb-3">
            Trace initials or words with a finger, mouse, or stylus. This is
            ungraded; nothing is recognised or saved. You can skip it.
          </p>
          <canvas
            ref={canvas}
            width={800}
            height={260}
            aria-label="Optional drawing pad. Use the skip button to continue without drawing."
            onPointerDown={start}
            onPointerMove={move}
            onPointerUp={() => {
              drawing.current = false;
            }}
            onPointerCancel={() => {
              drawing.current = false;
            }}
            onLostPointerCapture={() => {
              drawing.current = false;
            }}
          />
          <div className="flex flex-wrap gap-2 mt-3">
            <Button
              onClick={() =>
                canvas.current?.getContext("2d")?.clearRect(0, 0, 800, 260)
              }
            >
              Clear drawing
            </Button>
            <Button onClick={() => setOpen(false)}>Skip tracing</Button>
          </div>
        </div>
      )}
    </div>
  );
}
