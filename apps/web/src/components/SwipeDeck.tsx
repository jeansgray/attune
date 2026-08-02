"use client";

import { useCallback, useEffect, useRef, useState, type ReactElement } from "react";

type Props<T extends { userId: string }> = {
  items: T[];
  disabled?: boolean;
  onLike: (item: T) => Promise<void> | void;
  onPass: (item: T) => void;
  renderCard: (item: T) => ReactElement;
}

const THRESHOLD = 110;
const MAX_ROTATION = 14;

export function SwipeDeck<T extends { userId: string }>({
  items,
  disabled,
  onLike,
  onPass,
  renderCard,
}: Props<T>) {
  const [dragX, setDragX] = useState(0);
  const [dragY, setDragY] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [exit, setExit] = useState<"left" | "right" | null>(null);
  const [busy, setBusy] = useState(false);
  const start = useRef<{ x: number; y: number } | null>(null);
  const dragXRef = useRef(0);
  const top = items[0];

  const settle = useCallback(() => {
    setDragX(0);
    setDragY(0);
    setDragging(false);
    setExit(null);
    start.current = null;
    dragXRef.current = 0;
  }, []);

  const commit = useCallback(
    async (dir: "left" | "right") => {
      if (!top || busy || disabled) return;
      setBusy(true);
      setExit(dir);
      setDragX(dir === "right" ? 480 : -480);
      await new Promise((r) => setTimeout(r, 220));
      try {
        if (dir === "right") await onLike(top);
        else onPass(top);
      } finally {
        settle();
        setBusy(false);
      }
    },
    [busy, disabled, onLike, onPass, settle, top],
  );

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (busy || disabled || !top) return;
      if (e.key === "ArrowRight") void commit("right");
      if (e.key === "ArrowLeft") void commit("left");
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [busy, commit, disabled, top]);

  function onPointerDown(e: React.PointerEvent) {
    if (busy || disabled || !top) return;
    // Don't start a swipe from interactive controls (gallery/buttons/media)
    const target = e.target as HTMLElement;
    if (target.closest("button, a, input, textarea, select, audio, video, label")) return;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    start.current = { x: e.clientX, y: e.clientY };
    setDragging(true);
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!start.current || busy) return;
    const dx = e.clientX - start.current.x;
    const dy = e.clientY - start.current.y;
    dragXRef.current = dx;
    setDragX(dx);
    setDragY(dy * 0.35);
  }

  function onPointerUp() {
    if (!start.current || busy) return;
    const dx = dragXRef.current;
    if (dx > THRESHOLD) void commit("right");
    else if (dx < -THRESHOLD) void commit("left");
    else settle();
  }

  if (!top) return null;

  const rotation = Math.max(-MAX_ROTATION, Math.min(MAX_ROTATION, dragX / 18));
  const likeOpacity = Math.min(1, Math.max(0, dragX / THRESHOLD));
  const passOpacity = Math.min(1, Math.max(0, -dragX / THRESHOLD));
  const next = items[1];

  return (
    <div className="swipe-deck">
      <p className="meta swipe-hint">Swipe right to like · left to pass · or use the buttons</p>
      <div className="swipe-stage">
        {next ? (
          <div className="swipe-card swipe-card-next" aria-hidden>
            {renderCard(next)}
          </div>
        ) : null}
        <div
          className={`swipe-card swipe-card-top ${dragging ? "dragging" : ""} ${exit ? `exit-${exit}` : ""}`}
          style={{
            transform: `translate3d(${dragX}px, ${dragY}px, 0) rotate(${rotation}deg)`,
            transition: dragging ? "none" : "transform 220ms ease",
          }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={settle}
        >
          <div className="swipe-stamp like" style={{ opacity: likeOpacity }}>
            Like
          </div>
          <div className="swipe-stamp pass" style={{ opacity: passOpacity }}>
            Pass
          </div>
          {renderCard(top)}
        </div>
      </div>
      <div className="swipe-actions">
        <button
          className="btn secondary swipe-pass"
          type="button"
          disabled={busy || disabled}
          onClick={() => void commit("left")}
        >
          Pass
        </button>
        <button
          className="btn swipe-like"
          type="button"
          disabled={busy || disabled}
          onClick={() => void commit("right")}
        >
          Like
        </button>
      </div>
    </div>
  );
}
