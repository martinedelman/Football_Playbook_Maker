"use client";

import { ReactNode, useEffect, useRef, useState } from "react";
import { FeedbackStatus } from "./types";

interface ModalProps {
  isOpen: boolean;
  status: FeedbackStatus;
  title: string;
  children: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  isConfirmDisabled?: boolean;
  isLoading?: boolean;
  onConfirm?: () => void;
  onClose: () => void;
}

const statusStyles: Record<FeedbackStatus, { accent: string; icon: string; button: string }> = {
  [FeedbackStatus.ERROR]: {
    accent: "border-red-500 text-red-700 bg-red-50",
    icon: "!",
    button: "bg-red-600 hover:bg-red-700 focus:ring-red-500",
  },
  [FeedbackStatus.WARNING]: {
    accent: "border-amber-500 text-amber-800 bg-amber-50",
    icon: "!",
    button: "bg-amber-600 hover:bg-amber-700 focus:ring-amber-500",
  },
  [FeedbackStatus.INFO]: {
    accent: "border-blue-500 text-blue-700 bg-blue-50",
    icon: "i",
    button: "bg-blue-600 hover:bg-blue-700 focus:ring-blue-500",
  },
};

export default function Modal({
  isOpen,
  status,
  title,
  children,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  isConfirmDisabled = false,
  isLoading = false,
  onConfirm,
  onClose,
}: ModalProps) {
  const [shouldRender, setShouldRender] = useState(isOpen);
  const [isVisible, setIsVisible] = useState(false);
  const displayedContent = useRef({
    status,
    title,
    children,
    confirmLabel,
    cancelLabel,
    isConfirmDisabled,
    isLoading,
  });

  if (isOpen) {
    displayedContent.current = {
      status,
      title,
      children,
      confirmLabel,
      cancelLabel,
      isConfirmDisabled,
      isLoading,
    };
  }

  useEffect(() => {
    let frame: number | undefined;
    let timeout: number | undefined;

    if (isOpen) {
      setShouldRender(true);
      frame = window.requestAnimationFrame(() => setIsVisible(true));
    } else {
      setIsVisible(false);
      timeout = window.setTimeout(() => setShouldRender(false), 220);
    }

    return () => {
      if (frame !== undefined) window.cancelAnimationFrame(frame);
      if (timeout !== undefined) window.clearTimeout(timeout);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!shouldRender) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isOpen && !isLoading) onClose();
    };

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isLoading, isOpen, onClose, shouldRender]);

  if (!shouldRender) return null;

  const displayed = displayedContent.current;
  const styles = statusStyles[displayed.status];

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 ${
        isVisible ? "feedback-modal-backdrop-enter" : "feedback-modal-backdrop-exit pointer-events-none"
      }`}
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !displayed.isLoading) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="feedback-modal-title"
        className={`w-full max-w-md overflow-hidden rounded-xl bg-white shadow-2xl ${
          isVisible ? "feedback-modal-panel-enter" : "feedback-modal-panel-exit"
        }`}
      >
        <div className={`flex items-center gap-3 border-l-4 px-5 py-4 ${styles.accent}`}>
          <span
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 border-current font-bold"
            aria-hidden="true"
          >
            {styles.icon}
          </span>
          <h2 id="feedback-modal-title" className="text-lg font-semibold">
            {displayed.title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={displayed.isLoading}
            className="ml-auto rounded p-1 text-xl leading-none hover:bg-black/10 disabled:opacity-50"
            aria-label="Close modal"
          >
            ×
          </button>
        </div>

        <div className="px-5 py-5 text-sm text-gray-700">{displayed.children}</div>

        <div className="flex justify-end gap-3 border-t border-gray-200 bg-gray-50 px-5 py-4">
          {displayed.status !== FeedbackStatus.ERROR && (
            <button
              type="button"
              onClick={onClose}
              disabled={displayed.isLoading}
              className="rounded-md border border-gray-300 bg-white px-4 py-2 font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50"
            >
              {displayed.cancelLabel}
            </button>
          )}
          <button
            type="button"
            onClick={onConfirm ?? onClose}
            disabled={displayed.isConfirmDisabled || displayed.isLoading}
            className={`rounded-md px-4 py-2 font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${styles.button}`}
          >
            {displayed.isLoading
              ? "Saving..."
              : displayed.status === FeedbackStatus.ERROR
                ? "Close"
                : displayed.confirmLabel}
          </button>
        </div>
      </section>
    </div>
  );
}
