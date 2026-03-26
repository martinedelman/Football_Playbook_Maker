"use client";

import { useState } from "react";
import { Playbook, Play, PlaySide, PlayerTemplate } from "@/entities";

interface PlaybookListProps {
  playbooks: Playbook[];
  selectedPlaybook: Playbook | null;
  selectedPlay: Play | null;
  playerTemplates: PlayerTemplate[];
  selectedPlayerTemplate: PlayerTemplate | null;
  onCreatePlaybook: (name: string) => void;
  onSelectPlaybook: (playbook: Playbook) => void;
  onDeletePlaybook: (id: string) => void;
  onPrintPlaybook: (playbook: Playbook) => void;
  onCreatePlay: (name: string, side: PlaySide) => void;
  onSelectPlay: (play: Play) => void;
  onDeletePlay: (id: string) => void;
  onCreatePlayerTemplate: (name: string) => void;
  onSelectPlayerTemplate: (template: PlayerTemplate) => void;
  onDeletePlayerTemplate: (id: string) => void;
}

export default function PlaybookList({
  playbooks,
  selectedPlaybook,
  selectedPlay,
  playerTemplates,
  selectedPlayerTemplate,
  onCreatePlaybook,
  onSelectPlaybook,
  onDeletePlaybook,
  onPrintPlaybook,
  onCreatePlay,
  onSelectPlay,
  onDeletePlay,
  onCreatePlayerTemplate,
  onSelectPlayerTemplate,
  onDeletePlayerTemplate,
}: PlaybookListProps) {
  const [isCreatingPlaybook, setIsCreatingPlaybook] = useState(false);
  const [isCreatingPlay, setIsCreatingPlay] = useState(false);
  const [isCreatingPlayerTemplate, setIsCreatingPlayerTemplate] = useState(false);
  const [isPlaybooksExpanded, setIsPlaybooksExpanded] = useState(true);
  const [isPlayerTemplatesExpanded, setIsPlayerTemplatesExpanded] = useState(true);
  const [expandedPlaybookId, setExpandedPlaybookId] = useState<string | null>(null);
  const [newPlaybookName, setNewPlaybookName] = useState("");
  const [newPlayName, setNewPlayName] = useState("");
  const [newPlayerTemplateName, setNewPlayerTemplateName] = useState("");
  const [newPlaySide, setNewPlaySide] = useState<PlaySide>(PlaySide.OFFENSE);

  const handleCreatePlaybook = () => {
    if (newPlaybookName.trim()) {
      onCreatePlaybook(newPlaybookName.trim());
      setNewPlaybookName("");
      setIsCreatingPlaybook(false);
    }
  };

  const handleCreatePlay = () => {
    if (newPlayName.trim()) {
      onCreatePlay(newPlayName.trim(), newPlaySide);
      setNewPlayName("");
      setIsCreatingPlay(false);
    }
  };

  const handleCreatePlayerTemplate = () => {
    if (newPlayerTemplateName.trim()) {
      onCreatePlayerTemplate(newPlayerTemplateName.trim());
      setNewPlayerTemplateName("");
      setIsCreatingPlayerTemplate(false);
    }
  };

  const togglePlaybookExpansion = (playbookId: string) => {
    setExpandedPlaybookId((current) => (current === playbookId ? null : playbookId));
  };

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
              onClick={() => setIsCreatingPlaybook(true)}
              className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              + New
            </button>
          )}
        </div>

        {isPlaybooksExpanded && isCreatingPlaybook && (
          <div className="mb-3 p-2 bg-gray-50 rounded">
            <input
              type="text"
              value={newPlaybookName}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewPlaybookName(e.target.value)}
              onKeyDown={(e: React.KeyboardEvent) => e.key === "Enter" && handleCreatePlaybook()}
              placeholder="Playbook name"
              className="w-full px-2 py-1 text-sm border rounded mb-2"
              autoFocus
            />
            <div className="flex gap-2">
              <button
                onClick={handleCreatePlaybook}
                className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
              >
                Save
              </button>
              <button
                onClick={() => {
                  setIsCreatingPlaybook(false);
                  setNewPlaybookName("");
                }}
                className="px-3 py-1 text-xs bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

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
                    className="flex items-center gap-2 w-full"
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
                        if (confirm("Delete this playbook?")) {
                          onDeletePlaybook(pb.id);
                        }
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
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-1.5 py-0.5 text-xs rounded ${
                                play.side === PlaySide.OFFENSE ? "bg-blue-200 text-blue-800" : "bg-red-200 text-red-800"
                              }`}
                            >
                              {play.side === PlaySide.OFFENSE ? "OFF" : "DEF"}
                            </span>
                            <span>{play.name}</span>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirm("Delete this play?")) {
                                onDeletePlay(play.id);
                              }
                            }}
                            className="text-red-500 hover:text-red-700 text-xs"
                            title="Delete play"
                            aria-label={`Delete play ${play.name}`}
                          >
                            ×
                          </button>
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
          {isCreatingPlay ? (
            <div className="space-y-2">
              <input
                type="text"
                value={newPlayName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewPlayName(e.target.value)}
                onKeyDown={(e: React.KeyboardEvent) => e.key === "Enter" && handleCreatePlay()}
                placeholder="Play name"
                className="w-full px-2 py-1 text-sm border rounded"
                autoFocus
              />
              <div className="flex gap-2">
                <button
                  onClick={() => setNewPlaySide(PlaySide.OFFENSE)}
                  className={`flex-1 px-2 py-1 text-xs rounded ${
                    newPlaySide === PlaySide.OFFENSE ? "bg-blue-600 text-white" : "bg-gray-200"
                  }`}
                >
                  Offense
                </button>
                <button
                  onClick={() => setNewPlaySide(PlaySide.DEFENSE)}
                  className={`flex-1 px-2 py-1 text-xs rounded ${
                    newPlaySide === PlaySide.DEFENSE ? "bg-red-600 text-white" : "bg-gray-200"
                  }`}
                >
                  Defense
                </button>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleCreatePlay}
                  className="flex-1 px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
                >
                  Create
                </button>
                <button
                  onClick={() => {
                    setIsCreatingPlay(false);
                    setNewPlayName("");
                  }}
                  className="flex-1 px-3 py-1 text-xs bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setIsCreatingPlay(true)}
              className="w-full px-3 py-2 text-sm bg-green-600 text-white rounded hover:bg-green-700"
            >
              + New Play
            </button>
          )}
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
              onClick={() => setIsCreatingPlayerTemplate(true)}
              className="px-2 py-1 text-xs bg-purple-600 text-white rounded hover:bg-purple-700"
            >
              + New Player
            </button>
          )}
        </div>

        {isPlayerTemplatesExpanded && isCreatingPlayerTemplate && (
          <div className="mb-3 p-2 bg-gray-50 rounded">
            <input
              type="text"
              value={newPlayerTemplateName}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewPlayerTemplateName(e.target.value)}
              onKeyDown={(e: React.KeyboardEvent) => e.key === "Enter" && handleCreatePlayerTemplate()}
              placeholder="Player template name"
              className="w-full px-2 py-1 text-sm border rounded mb-2"
              autoFocus
            />
            <div className="flex gap-2">
              <button
                onClick={handleCreatePlayerTemplate}
                className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
              >
                Save
              </button>
              <button
                onClick={() => {
                  setIsCreatingPlayerTemplate(false);
                  setNewPlayerTemplateName("");
                }}
                className="px-3 py-1 text-xs bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

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
                    if (confirm("Delete this player template?")) {
                      onDeletePlayerTemplate(template.id);
                    }
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
    </div>
  );
}
