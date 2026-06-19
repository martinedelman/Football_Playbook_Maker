"use client";

import { ReactNode, useEffect } from "react";
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
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isLoading) onClose();
    };

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isLoading, isOpen, onClose]);

  if (!isOpen) return null;

  const styles = statusStyles[status];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isLoading) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="feedback-modal-title"
        className="w-full max-w-md overflow-hidden rounded-xl bg-white shadow-2xl"
      >
        <div className={`flex items-center gap-3 border-l-4 px-5 py-4 ${styles.accent}`}>
          <span
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 border-current font-bold"
            aria-hidden="true"
          >
            {styles.icon}
          </span>
          <h2 id="feedback-modal-title" className="text-lg font-semibold">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="ml-auto rounded p-1 text-xl leading-none hover:bg-black/10 disabled:opacity-50"
            aria-label="Close modal"
          >
            ×
          </button>
        </div>

        <div className="px-5 py-5 text-sm text-gray-700">{children}</div>

        <div className="flex justify-end gap-3 border-t border-gray-200 bg-gray-50 px-5 py-4">
          {status !== FeedbackStatus.ERROR && (
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="rounded-md border border-gray-300 bg-white px-4 py-2 font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50"
            >
              {cancelLabel}
            </button>
          )}
          <button
            type="button"
            onClick={onConfirm ?? onClose}
            disabled={isConfirmDisabled || isLoading}
            className={`rounded-md px-4 py-2 font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${styles.button}`}
          >
            {isLoading ? "Saving..." : status === FeedbackStatus.ERROR ? "Close" : confirmLabel}
          </button>
        </div>
      </section>
    </div>
  );
}

