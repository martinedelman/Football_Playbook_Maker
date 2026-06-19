"use client";

import { useEffect, useState } from "react";
import { Playbook } from "@/entities";
import type { PlaybookPrintFormat } from "./PlaybookPrintPage";
import Modal from "./feedback/Modal";
import { FeedbackStatus } from "./feedback/types";

const PRINT_FORMATS: Array<{
  value: PlaybookPrintFormat;
  label: string;
  detail: string;
}> = [
  { value: "wristband-diagram", label: "Pulsera — Diagrama", detail: "6 diagramas por hoja, horizontal" },
  { value: "wristband-list", label: "Pulsera — Lista", detail: "18 jugadas por hoja, horizontal" },
  { value: "call-sheet-diagram", label: "Hoja de llamadas — Diagrama", detail: "8 diagramas por hoja" },
  { value: "call-sheet-list", label: "Hoja de llamadas — Lista", detail: "30 jugadas por hoja" },
  { value: "playbook", label: "Libro de jugadas", detail: "Diagramas grandes con descripción" },
  { value: "scout-cards", label: "Tarjetas scout", detail: "4 tarjetas por hoja con espacio para notas" },
];

interface PrintOptionsModalProps {
  playbook: Playbook | null;
  onClose: () => void;
  onPrint: (playbook: Playbook, format: PlaybookPrintFormat, bookPlaysPerPage: 1 | 2 | 4) => void;
}

export default function PrintOptionsModal({ playbook, onClose, onPrint }: PrintOptionsModalProps) {
  const [format, setFormat] = useState<PlaybookPrintFormat>("wristband-diagram");
  const [bookPlaysPerPage, setBookPlaysPerPage] = useState<1 | 2 | 4>(1);

  useEffect(() => {
    if (!playbook) return;
    setFormat("wristband-diagram");
    setBookPlaysPerPage(1);
  }, [playbook]);

  return (
    <Modal
      isOpen={playbook !== null}
      status={FeedbackStatus.INFO}
      title="Print playbook"
      confirmLabel="Open print preview"
      onConfirm={() => playbook && onPrint(playbook, format, bookPlaysPerPage)}
      onClose={onClose}
    >
      <fieldset>
        <legend className="mb-3 font-medium text-gray-800">Choose a print format</legend>
        <div className="space-y-2">
          {PRINT_FORMATS.map((option) => (
            <label
              key={option.value}
              className={`flex cursor-pointer items-start gap-3 rounded-lg border px-3 py-2.5 transition-colors ${
                format === option.value
                  ? "border-blue-500 bg-blue-50 ring-1 ring-blue-200"
                  : "border-gray-200 hover:border-blue-300 hover:bg-gray-50"
              }`}
            >
              <input
                type="radio"
                name="print-format"
                value={option.value}
                checked={format === option.value}
                onChange={() => setFormat(option.value)}
                className="mt-1 h-4 w-4 accent-blue-600"
              />
              <span>
                <span className="block font-medium text-gray-900">{option.label}</span>
                <span className="block text-xs text-gray-500">{option.detail}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      {format === "playbook" && (
        <fieldset className="mt-4 rounded-lg border border-blue-100 bg-blue-50 p-3">
          <legend className="px-1 font-medium text-blue-900">Plays per A4 page</legend>
          <div className="mt-2 flex gap-5">
            {([1, 2, 4] as const).map((amount) => (
              <label key={amount} className="flex cursor-pointer items-center gap-2 text-blue-900">
                <input
                  type="radio"
                  name="book-plays-per-page"
                  checked={bookPlaysPerPage === amount}
                  onChange={() => setBookPlaysPerPage(amount)}
                  className="h-4 w-4 accent-blue-600"
                />
                {amount} play{amount === 1 ? "" : "s"}
              </label>
            ))}
          </div>
        </fieldset>
      )}

      <p className="mt-4 text-xs text-gray-500">
        Every layout uses A4 paper (210 × 297 mm) with a 5 mm print margin.
      </p>
    </Modal>
  );
}
