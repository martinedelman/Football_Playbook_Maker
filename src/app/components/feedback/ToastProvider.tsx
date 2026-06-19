"use client";

import { createContext, PointerEvent, ReactNode, useCallback, useContext, useEffect, useRef, useState } from "react";
import Modal from "./Modal";
import { FeedbackStatus } from "./types";

interface ToastInput {
  status: FeedbackStatus;
  title: string;
  message?: string;
}

interface ToastItem extends ToastInput {
  id: number;
  isExiting?: boolean;
}

interface CriticalError {
  title: string;
  message: string;
}

interface FeedbackContextValue {
  showToast: (toast: ToastInput) => void;
  showCriticalError: (title: string, message: string) => void;
}

const FeedbackContext = createContext<FeedbackContextValue | null>(null);

const toastStyles: Record<FeedbackStatus, string> = {
  [FeedbackStatus.ERROR]: "border-red-500 bg-red-50 text-red-900",
  [FeedbackStatus.WARNING]: "border-amber-500 bg-amber-50 text-amber-900",
  [FeedbackStatus.INFO]: "border-blue-500 bg-blue-50 text-blue-900",
};

function Toast({ toast, onClose }: { toast: ToastItem; onClose: (id: number) => void }) {
  const startPoint = useRef<{ x: number; y: number } | null>(null);
  const offsetRef = useRef({ x: 0, y: 0 });
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (toast.status === FeedbackStatus.ERROR || toast.isExiting) return;
    const timeout = window.setTimeout(() => onClose(toast.id), 5000);
    return () => window.clearTimeout(timeout);
  }, [onClose, toast.id, toast.isExiting, toast.status]);

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    startPoint.current = { x: event.clientX, y: event.clientY };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!startPoint.current) return;
    const nextOffset = {
      x: event.clientX - startPoint.current.x,
      y: Math.min(0, event.clientY - startPoint.current.y),
    };
    offsetRef.current = nextOffset;
    setOffset(nextOffset);
  };

  const handlePointerUp = (event: PointerEvent<HTMLDivElement>) => {
    if (!startPoint.current) return;
    event.currentTarget.releasePointerCapture(event.pointerId);
    const shouldClose = Math.abs(offsetRef.current.x) > 80 || offsetRef.current.y < -60;
    startPoint.current = null;
    if (shouldClose) onClose(toast.id);
    else {
      offsetRef.current = { x: 0, y: 0 };
      setOffset({ x: 0, y: 0 });
    }
  };

  return (
    <div
      role={toast.status === FeedbackStatus.ERROR ? "alert" : "status"}
      className={toast.isExiting ? "feedback-toast-exit pointer-events-none" : "feedback-toast-enter"}
    >
      <div
        className={`pointer-events-auto w-[min(20rem,calc(100vw-2rem))] touch-none rounded-lg border-l-4 p-4 shadow-lg transition-transform ${toastStyles[toast.status]}`}
        style={{
          transform: `translate(${offset.x}px, ${offset.y}px)`,
          opacity: Math.max(0.35, 1 - Math.abs(offset.x) / 240),
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={() => {
          startPoint.current = null;
          offsetRef.current = { x: 0, y: 0 };
          setOffset({ x: 0, y: 0 });
        }}
      >
        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <p className="font-semibold">{toast.title}</p>
            {toast.message && <p className="mt-1 text-sm opacity-90">{toast.message}</p>}
          </div>
          <button
            type="button"
            onPointerDown={(event) => event.stopPropagation()}
            onClick={() => onClose(toast.id)}
            className="rounded p-1 text-xl leading-none hover:bg-black/10"
            aria-label={`Close ${toast.title} notification`}
          >
            ×
          </button>
        </div>
      </div>
    </div>
  );
}

export function FeedbackProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [criticalError, setCriticalError] = useState<CriticalError | null>(null);
  const nextId = useRef(1);
  const exitTimers = useRef(new Map<number, number>());

  const closeToast = useCallback((id: number) => {
    if (exitTimers.current.has(id)) return;

    setToasts((current) =>
      current.map((toast) => (toast.id === id ? { ...toast, isExiting: true } : toast)),
    );
    const timer = window.setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id));
      exitTimers.current.delete(id);
    }, 220);
    exitTimers.current.set(id, timer);
  }, []);

  useEffect(
    () => () => {
      exitTimers.current.forEach((timer) => window.clearTimeout(timer));
      exitTimers.current.clear();
    },
    [],
  );

  const showToast = useCallback((toast: ToastInput) => {
    const id = nextId.current++;
    setToasts((current) => [...current, { ...toast, id }]);
  }, []);

  const showCriticalError = useCallback((title: string, message: string) => {
    setCriticalError({ title, message });
  }, []);

  return (
    <FeedbackContext.Provider value={{ showToast, showCriticalError }}>
      {children}
      <div className="pointer-events-none fixed right-4 top-4 z-[60] flex flex-col gap-3" aria-live="polite">
        {toasts.map((toast) => (
          <Toast key={toast.id} toast={toast} onClose={closeToast} />
        ))}
      </div>
      <Modal
        isOpen={criticalError !== null}
        status={FeedbackStatus.ERROR}
        title={criticalError?.title ?? "Critical error"}
        onClose={() => setCriticalError(null)}
      >
        <p>{criticalError?.message}</p>
      </Modal>
    </FeedbackContext.Provider>
  );
}

export function useFeedback(): FeedbackContextValue {
  const context = useContext(FeedbackContext);
  if (!context) throw new Error("useFeedback must be used inside FeedbackProvider");
  return context;
}
