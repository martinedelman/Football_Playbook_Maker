"use client";

import { KeyboardEvent, PointerEvent, ReactNode, useCallback, useEffect, useRef, useState } from "react";

const DEFAULT_WIDTH = 320;
const MIN_WIDTH = 240;
const MAX_WIDTH = 560;
const MAIN_CONTENT_MIN_WIDTH = 420;
const STORAGE_KEY = "ffpb:sidebarWidth";

interface ResizableSidebarProps {
  children: ReactNode;
}

const getMaximumWidth = (): number => {
  if (typeof window === "undefined") return MAX_WIDTH;
  return Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, window.innerWidth - MAIN_CONTENT_MIN_WIDTH));
};

const clampWidth = (width: number): number => Math.max(MIN_WIDTH, Math.min(getMaximumWidth(), width));

export default function ResizableSidebar({ children }: ResizableSidebarProps) {
  const [width, setWidth] = useState(DEFAULT_WIDTH);
  const [isResizing, setIsResizing] = useState(false);
  const dragStart = useRef<{ pointerX: number; width: number } | null>(null);
  const currentWidth = useRef(DEFAULT_WIDTH);

  const updateWidth = useCallback((nextWidth: number) => {
    const clampedWidth = clampWidth(nextWidth);
    currentWidth.current = clampedWidth;
    setWidth(clampedWidth);
  }, []);

  const persistWidth = (nextWidth: number) => {
    localStorage.setItem(STORAGE_KEY, String(nextWidth));
  };

  useEffect(() => {
    const storedWidth = Number(localStorage.getItem(STORAGE_KEY));
    if (Number.isFinite(storedWidth) && storedWidth > 0) updateWidth(storedWidth);

    const handleWindowResize = () => updateWidth(currentWidth.current);
    window.addEventListener("resize", handleWindowResize);
    return () => window.removeEventListener("resize", handleWindowResize);
  }, [updateWidth]);

  useEffect(() => {
    if (!isResizing) return;
    const previousCursor = document.body.style.cursor;
    const previousUserSelect = document.body.style.userSelect;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";

    return () => {
      document.body.style.cursor = previousCursor;
      document.body.style.userSelect = previousUserSelect;
    };
  }, [isResizing]);

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    dragStart.current = { pointerX: event.clientX, width: currentWidth.current };
    event.currentTarget.setPointerCapture(event.pointerId);
    setIsResizing(true);
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!dragStart.current) return;
    updateWidth(dragStart.current.width + event.clientX - dragStart.current.pointerX);
  };

  const finishResize = (event: PointerEvent<HTMLDivElement>) => {
    if (!dragStart.current) return;
    dragStart.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    setIsResizing(false);
    persistWidth(currentWidth.current);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    const step = event.shiftKey ? 32 : 16;
    const direction = event.key === "ArrowLeft" ? -1 : 1;
    const nextWidth = clampWidth(currentWidth.current + step * direction);
    updateWidth(nextWidth);
    persistWidth(nextWidth);
  };

  const resetWidth = () => {
    updateWidth(DEFAULT_WIDTH);
    persistWidth(DEFAULT_WIDTH);
  };

  return (
    <aside
      className="sticky top-0 flex h-screen shrink-0 flex-col border-r border-gray-200 bg-white shadow-sm"
      style={{
        width,
        transition: isResizing ? "none" : "width 160ms ease-out",
      }}
    >
      <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
      <div
        role="separator"
        aria-label="Resize sidebar"
        aria-orientation="vertical"
        aria-valuemin={MIN_WIDTH}
        aria-valuemax={getMaximumWidth()}
        aria-valuenow={Math.round(width)}
        tabIndex={0}
        title="Drag to resize. Double-click to reset. Use arrow keys when focused."
        className={`group absolute -right-1 top-0 z-30 h-full w-2 cursor-col-resize touch-none focus:outline-none ${
          isResizing ? "bg-blue-500/10" : ""
        }`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={finishResize}
        onPointerCancel={finishResize}
        onDoubleClick={resetWidth}
        onKeyDown={handleKeyDown}
      >
        <span
          className={`absolute left-1/2 top-1/2 h-14 -translate-x-1/2 -translate-y-1/2 rounded-full transition-all duration-150 ${
            isResizing ? "w-1 bg-blue-500" : "w-0.5 bg-gray-300 group-hover:w-1 group-hover:bg-blue-400 group-focus:w-1 group-focus:bg-blue-500"
          }`}
          aria-hidden="true"
        />
      </div>
    </aside>
  );
}
