"use client";

import { useState } from "react";
import { Playbook, Play, PlaySide, PlayerTemplate } from "@/entities";
import Modal from "./feedback/Modal";
import { FeedbackStatus } from "./feedback/types";

type DialogState =
  | { type: "create-playbook" }
  | { type: "create-play" }
  | { type: "create-template" }
  | { type: "rename-playbook"; item: Playbook }
  | { type: "rename-play"; item: Play }
  | { type: "delete-playbook"; item: Playbook }
  | { type: "delete-play"; item: Play }
  | { type: "delete-template"; item: PlayerTemplate }
  | null;

interface PlaybookListProps {
  playbooks: Playbook[];
  selectedPlaybook: Playbook | null;
  selectedPlay: Play | null;
  playerTemplates: PlayerTemplate[];
  selectedPlayerTemplate: PlayerTemplate | null;
  onCreatePlaybook: (name: string) => Promise<boolean>;
  onRenamePlaybook: (id: string, name: string) => Promise<boolean>;
  onSelectPlaybook: (playbook: Playbook) => void;
  onDeletePlaybook: (id: string) => Promise<boolean>;
  onPrintPlaybook: (playbook: Playbook) => void;
  onCreatePlay: (name: string, side: PlaySide) => Promise<boolean>;
  onRenamePlay: (id: string, name: string) => Promise<boolean>;
  onSelectPlay: (play: Play) => void;
  onDeletePlay: (id: string) => Promise<boolean>;
  onCreatePlayerTemplate: (name: string) => Promise<boolean>;
  onSelectPlayerTemplate: (template: PlayerTemplate) => void;
  onDeletePlayerTemplate: (id: string) => Promise<boolean>;
}

export default function PlaybookList({
  playbooks,
  selectedPlaybook,
  selectedPlay,
  playerTemplates,
  selectedPlayerTemplate,
  onCreatePlaybook,
  onRenamePlaybook,
  onSelectPlaybook,
  onDeletePlaybook,
  onPrintPlaybook,
  onCreatePlay,
  onRenamePlay,
  onSelectPlay,
  onDeletePlay,
  onCreatePlayerTemplate,
  onSelectPlayerTemplate,
  onDeletePlayerTemplate,
}: PlaybookListProps) {
  const [isPlaybooksExpanded, setIsPlaybooksExpanded] = useState(true);
  const [isPlayerTemplatesExpanded, setIsPlayerTemplatesExpanded] = useState(true);
  const [expandedPlaybookId, setExpandedPlaybookId] = useState<string | null>(null);
  const [dialog, setDialog] = useState<DialogState>(null);
  const [inputValue, setInputValue] = useState("");
  const [newPlaySide, setNewPlaySide] = useState<PlaySide>(PlaySide.OFFENSE);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const openDialog = (nextDialog: DialogState, initialValue = "") => {
    setDialog(nextDialog);
    setInputValue(initialValue);
  };

  const closeDialog = () => {
    if (isSubmitting) return;
    setDialog(null);
    setInputValue("");
  };

  const togglePlaybookExpansion = (playbookId: string) => {
    setExpandedPlaybookId((current) => (current === playbookId ? null : playbookId));
  };

  const submitDialog = async () => {
    if (!dialog || isSubmitting) return;
    setIsSubmitting(true);

    let succeeded = false;
    const value = inputValue.trim();

    switch (dialog.type) {
      case "create-playbook":
        succeeded = await onCreatePlaybook(value);
        break;
      case "create-play":
        succeeded = await onCreatePlay(value, newPlaySide);
        break;
      case "create-template":
        succeeded = await onCreatePlayerTemplate(value);
        break;
      case "rename-playbook":
        succeeded = await onRenamePlaybook(dialog.item.id, value);
        break;
      case "rename-play":
        succeeded = await onRenamePlay(dialog.item.id, value);
        break;
      case "delete-playbook":
        succeeded = await onDeletePlaybook(dialog.item.id);
        break;
      case "delete-play":
        succeeded = await onDeletePlay(dialog.item.id);
        break;
      case "delete-template":
        succeeded = await onDeletePlayerTemplate(dialog.item.id);
        break;
    }

    setIsSubmitting(false);
    if (succeeded) {
      setDialog(null);
      setInputValue("");
    }
  };

  const isInputDialog =
    dialog?.type === "create-playbook" ||
    dialog?.type === "create-play" ||
    dialog?.type === "create-template" ||
    dialog?.type === "rename-playbook" ||
    dialog?.type === "rename-play";

  const isWarningDialog =
    dialog?.type === "delete-playbook" || dialog?.type === "delete-play" || dialog?.type === "delete-template";

  const dialogTitle =
    dialog?.type === "create-playbook"
      ? "New playbook"
      : dialog?.type === "create-play"
        ? "New play"
        : dialog?.type === "create-template"
          ? "New player template"
          : dialog?.type === "rename-playbook"
            ? "Rename playbook"
            : dialog?.type === "rename-play"
              ? "Rename play"
              : dialog?.type === "delete-playbook"
                ? "Delete playbook"
                : dialog?.type === "delete-play"
                  ? "Delete play"
                  : "Delete player template";

  return (
    <div className="flex flex-col h-full">
      {/* Playbooks section */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={() => setIsPlaybooksExpanded((prev) => !prev)}
            className="flex items-center gap-2 text-sm font-semibold text-gray-700 uppercase"
            aria-label="Toggle Playbooks section"
            aria-expanded={isPlaybooksExpanded}
          >
            <span>{isPlaybooksExpanded ? "▾" : "▸"}</span>
            <span>Playbooks</span>
          </button>
          {isPlaybooksExpanded && (
            <button
              onClick={() => openDialog({ type: "create-playbook" })}
              className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              + New
            </button>
          )}
        </div>

        {isPlaybooksExpanded && (
          <div className="space-y-1">
            {playbooks.map((pb) => (
              <div key={pb.id}>
                <div
                  onClick={() => onSelectPlaybook(pb)}
                  className={`flex items-center justify-between p-2 rounded cursor-pointer ${
                    selectedPlaybook?.id === pb.id ? "bg-blue-100 text-blue-900" : "hover:bg-gray-100"
                  }`}
                >
                  <div
                    className="flex min-w-0 flex-1 items-center gap-2"
                    onClick={(e) => {
                      e.stopPropagation();
                      togglePlaybookExpansion(pb.id);
                      onSelectPlaybook(pb);
                    }}
                  >
                    <button
                      className="p-1 text-xs hover:text-blue-600 focus:ring-2 focus:ring-blue-500 rounded"
                      aria-label={`Toggle plays list for playbook ${pb.name}`}
                      aria-expanded={expandedPlaybookId === pb.id}
                    >
                      {expandedPlaybookId === pb.id ? "▾" : "▸"}
                    </button>
                    <span className="text-sm font-medium cursor-pointer">{pb.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(event) => {
                        event.stopPropagation();
                        openDialog({ type: "rename-playbook", item: pb }, pb.name);
                      }}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                      title="Rename playbook"
                      aria-label={`Rename playbook ${pb.name}`}
                    >
                      ✎
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onPrintPlaybook(pb);
                      }}
                      className="text-gray-600 hover:text-gray-800 text-sm"
                      title="Print playbook"
                      aria-label={`Print playbook ${pb.name}`}
                    >
                      🖨️
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openDialog({ type: "delete-playbook", item: pb });
                      }}
                      className="text-red-500 hover:text-red-700 text-xs"
                      title="Delete playbook"
                      aria-label={`Delete playbook ${pb.name}`}
                    >
                      ×
                    </button>
                  </div>
                </div>

                {/* Plays for expanded playbook */}
                {expandedPlaybookId === pb.id && (
                  <div className="ml-4 mt-1 space-y-1">
                    {pb.plays.length > 0 ? (
                      pb.plays.map((play) => (
                        <div
                          key={play.id}
                          onClick={() => onSelectPlay(play)}
                          className={`flex items-center justify-between p-2 rounded cursor-pointer text-sm ${
                            selectedPlay?.id === play.id ? "bg-green-100 text-green-900" : "hover:bg-gray-50"
                          }`}
                        >
                          <div className="flex min-w-0 flex-1 items-center gap-2">
                            <span
                              className={`px-1.5 py-0.5 text-xs rounded ${
                                play.side === PlaySide.OFFENSE ? "bg-blue-200 text-blue-800" : "bg-red-200 text-red-800"
                              }`}
                            >
                              {play.side === PlaySide.OFFENSE ? "OFF" : "DEF"}
                            </span>
                            <span>{play.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={(event) => {
                                event.stopPropagation();
                                openDialog({ type: "rename-play", item: play }, play.name);
                              }}
                              className="text-blue-600 hover:text-blue-800 text-xs"
                              title="Rename play"
                              aria-label={`Rename play ${play.name}`}
                            >
                              ✎
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openDialog({ type: "delete-play", item: play });
                              }}
                              className="text-red-500 hover:text-red-700 text-xs"
                              title="Delete play"
                              aria-label={`Delete play ${play.name}`}
                            >
                              ×
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div role="status" className="p-2 text-xs text-gray-500">
                        No plays yet.
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      {/* Create Play section (only if playbook selected) */}
      {selectedPlaybook && isPlaybooksExpanded && expandedPlaybookId === selectedPlaybook.id && (
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <button
            onClick={() => openDialog({ type: "create-play" })}
            className="w-full px-3 py-2 text-sm bg-green-600 text-white rounded hover:bg-green-700"
          >
            + New Play
          </button>
        </div>
      )}

      {/* Player Templates section */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={() => setIsPlayerTemplatesExpanded((prev) => !prev)}
            className="flex items-center gap-2 text-sm font-semibold text-gray-700 uppercase"
            aria-label="Toggle Player Templates section"
            aria-expanded={isPlayerTemplatesExpanded}
          >
            <span>{isPlayerTemplatesExpanded ? "▾" : "▸"}</span>
            <span>Player Templates</span>
          </button>
          {isPlayerTemplatesExpanded && (
            <button
              onClick={() => openDialog({ type: "create-template" })}
              className="px-2 py-1 text-xs bg-purple-600 text-white rounded hover:bg-purple-700"
            >
              + New Player
            </button>
          )}
        </div>

        {isPlayerTemplatesExpanded && (
          <div className="space-y-1">
            {playerTemplates.map((template) => (
              <div
                key={template.id}
                onClick={() => onSelectPlayerTemplate(template)}
                className={`flex items-center justify-between p-2 rounded cursor-pointer ${
                  selectedPlayerTemplate?.id === template.id ? "bg-purple-100 text-purple-900" : "hover:bg-gray-100"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{template.name}</span>
                  <span className="text-xs text-gray-500">({template.routes.length} routes)</span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    openDialog({ type: "delete-template", item: template });
                  }}
                  className="text-red-500 hover:text-red-700 text-xs"
                  title="Delete player template"
                  aria-label={`Delete player template ${template.name}`}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
      <Modal
        isOpen={dialog !== null}
        status={isWarningDialog ? FeedbackStatus.WARNING : FeedbackStatus.INFO}
        title={dialogTitle}
        confirmLabel={isWarningDialog ? "Delete" : "Save"}
        isConfirmDisabled={isInputDialog && !inputValue.trim()}
        isLoading={isSubmitting}
        onConfirm={() => void submitDialog()}
        onClose={closeDialog}
      >
        {isInputDialog ? (
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void submitDialog();
            }}
            className="space-y-4"
          >
            <label className="block font-medium text-gray-700" htmlFor="dialog-name">
              Name
            </label>
            <input
              id="dialog-name"
              type="text"
              value={inputValue}
              onChange={(event) => setInputValue(event.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              autoFocus
            />
            {dialog?.type === "create-play" && (
              <div>
                <p className="mb-2 font-medium text-gray-700">Side</p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setNewPlaySide(PlaySide.OFFENSE)}
                    className={`flex-1 rounded px-3 py-2 ${
                      newPlaySide === PlaySide.OFFENSE ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700"
                    }`}
                  >
                    Offense
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewPlaySide(PlaySide.DEFENSE)}
                    className={`flex-1 rounded px-3 py-2 ${
                      newPlaySide === PlaySide.DEFENSE ? "bg-red-600 text-white" : "bg-gray-200 text-gray-700"
                    }`}
                  >
                    Defense
                  </button>
                </div>
              </div>
            )}
          </form>
        ) : (
          <p>
            This action cannot be undone. Are you sure you want to delete{" "}
            <strong>
              {dialog && "item" in dialog ? dialog.item.name : "this item"}
            </strong>
            ?
          </p>
        )}
      </Modal>
    </div>
  );
}
