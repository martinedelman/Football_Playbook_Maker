"use client";

import { useState, useEffect } from "react";
import { Formation, PlaySide } from "@/entities";
import { formationService } from "@/services/formationService";
import { ToolMode } from "./PlayEditor";

interface ToolbarProps {
  toolMode: ToolMode;
  onToolModeChange: (mode: ToolMode) => void;
  playSide: PlaySide;
  onSaveFormation: (name: string) => void;
  onLoadFormation: (formationId: string) => void;
  onClearAnnotations: () => void;
}

export default function Toolbar({
  toolMode,
  onToolModeChange,
  playSide,
  onSaveFormation,
  onLoadFormation,
  onClearAnnotations,
}: ToolbarProps) {
  const [formations, setFormations] = useState<Formation[]>([]);
  const [showSaveFormation, setShowSaveFormation] = useState(false);
  const [formationName, setFormationName] = useState("");

  useEffect(() => {
    loadFormations();
  }, []);

  const loadFormations = async () => {
    const data = await formationService.getAllFormations();
    setFormations(data.filter((f) => f.side === playSide));
  };

  const handleSaveFormation = () => {
    if (formationName.trim()) {
      onSaveFormation(formationName.trim());
      setFormationName("");
      setShowSaveFormation(false);
      loadFormations();
    }
  };

  return (
    <div className="bg-white border-b border-gray-200 px-6 py-3 shadow-sm">
      <div className="flex items-center gap-4 flex-wrap">
        {/* Tool selection */}
        <div className="flex gap-2">
          <button
            onClick={() => onToolModeChange("select")}
            className={`px-4 py-2 text-sm font-medium rounded ${
              toolMode === "select" ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            ✋ Select/Drag
          </button>
          <button
            onClick={() => onToolModeChange("route")}
            className={`px-4 py-2 text-sm font-medium rounded ${
              toolMode === "route" ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            🏈 Route
          </button>
          <button
            onClick={() => onToolModeChange("pen")}
            className={`px-4 py-2 text-sm font-medium rounded ${
              toolMode === "pen" ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            ✏️ Pen
          </button>
        </div>

        <div className="h-8 w-px bg-gray-300"></div>

        {/* Formation actions */}
        <div className="flex items-center gap-2">
          {showSaveFormation ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={formationName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormationName(e.target.value)}
                onKeyDown={(e: React.KeyboardEvent) => e.key === "Enter" && handleSaveFormation()}
                placeholder="Formation name"
                className="px-3 py-2 text-sm border rounded"
                autoFocus
              />
              <button
                onClick={handleSaveFormation}
                className="px-3 py-2 text-sm bg-green-600 text-white rounded hover:bg-green-700"
              >
                Save
              </button>
              <button
                onClick={() => {
                  setShowSaveFormation(false);
                  setFormationName("");
                }}
                className="px-3 py-2 text-sm bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowSaveFormation(true)}
              className="px-4 py-2 text-sm bg-green-600 text-white rounded hover:bg-green-700"
            >
              💾 Save Formation
            </button>
          )}

          {formations.length > 0 && (
            <select
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => e.target.value && onLoadFormation(e.target.value)}
              className="px-3 py-2 text-sm border rounded bg-white"
              defaultValue=""
            >
              <option value="">Load Formation...</option>
              {formations.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="h-8 w-px bg-gray-300"></div>

        {/* Annotation actions */}
        <button
          onClick={onClearAnnotations}
          className="px-4 py-2 text-sm bg-red-600 text-white rounded hover:bg-red-700"
        >
          🗑️ Clear Annotations
        </button>
      </div>

      {/* Hints */}
      <div className="mt-2 text-xs text-gray-500">
        {toolMode === "select" && "• Drag players to reposition them"}
        {toolMode === "route" && "• Click a player, then click to draw route points. Double-click to finish."}
        {toolMode === "pen" && "• Click and drag to draw freehand annotations"}
      </div>
    </div>
  );
}
