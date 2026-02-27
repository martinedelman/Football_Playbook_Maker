"use client";

import { useState, useEffect } from "react";
import { Formation, PlaySide, PlayerTemplate, RouteStyle } from "@/entities";
import { formationService } from "@/services/formationService";
import { ToolMode } from "./PlayEditor";

interface ToolbarProps {
  toolMode: ToolMode;
  onToolModeChange: (mode: ToolMode) => void;
  routeStyle: RouteStyle;
  onRouteStyleChange: (style: RouteStyle) => void;
  playSide: PlaySide;
  selectedPlayerId: string | null;
  selectedPlayerLabel: string | undefined;
  selectedPlayerColor: string | undefined;
  onPlayerColorChange: (color: string) => void;
  onSaveFormation: (name: string) => void;
  onLoadFormation: (formationId: string) => void;
  onClearAnnotations: () => void;
  playerTemplates: PlayerTemplate[];
  onApplyTemplateRoute: (templateId: string, routeId: string) => void;
}

export default function Toolbar({
  toolMode,
  onToolModeChange,
  routeStyle,
  onRouteStyleChange,
  playSide,
  selectedPlayerId,
  selectedPlayerLabel,
  selectedPlayerColor,
  onPlayerColorChange,
  onSaveFormation,
  onLoadFormation,
  onClearAnnotations,
  playerTemplates,
  onApplyTemplateRoute,
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

  // Get templates that match the selected player's label
  const matchingTemplates = selectedPlayerLabel
    ? playerTemplates.filter((t) => t.playerLabel === selectedPlayerLabel)
    : [];

  const handleApplyRoute = (value: string) => {
    if (!value) return;
    const [templateId, routeId] = value.split(":");
    onApplyTemplateRoute(templateId, routeId);
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

        {/* Route style selection - only in route mode */}
        {toolMode === "route" && (
          <>
            <div className="h-8 w-px bg-gray-300"></div>

            <div className="flex gap-2">
              <button
                onClick={() => onRouteStyleChange(RouteStyle.STRAIGHT)}
                className={`px-4 py-2 text-sm font-medium rounded ${
                  routeStyle === RouteStyle.STRAIGHT
                    ? "bg-green-600 text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                📏 Recto
              </button>
              <button
                onClick={() => onRouteStyleChange(RouteStyle.CURVED)}
                className={`px-4 py-2 text-sm font-medium rounded ${
                  routeStyle === RouteStyle.CURVED
                    ? "bg-green-600 text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                〰️ Curvo
              </button>
            </div>
          </>
        )}

        {/* Formation actions - only in select mode */}
        {toolMode === "select" && (
          <>
            <div className="h-8 w-px bg-gray-300"></div>

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
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                    e.target.value && onLoadFormation(e.target.value)
                  }
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
          </>
        )}

        {/* Player color picker */}
        {selectedPlayerId && toolMode === "select" && (
          <>
            <div className="h-8 w-px bg-gray-300"></div>

            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">Player Color:</label>
              <input
                type="color"
                value={selectedPlayerColor || "#000000"}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => onPlayerColorChange(e.target.value)}
                className="w-10 h-10 border rounded cursor-pointer"
                title="Choose player color"
              />
            </div>
          </>
        )}

        {/* Template route picker */}
        {selectedPlayerId && toolMode === "route" && matchingTemplates.length > 0 && (
          <>
            <div className="h-8 w-px bg-gray-300"></div>

            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">Load Route:</label>
              <select
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                  handleApplyRoute(e.target.value);
                  e.target.value = ""; // Reset selection
                }}
                className="px-3 py-2 text-sm border rounded bg-white"
                defaultValue=""
              >
                <option value="">Select a route...</option>
                {matchingTemplates.map((template) =>
                  template.routes.map((route) => (
                    <option key={`${template.id}:${route.id}`} value={`${template.id}:${route.id}`}>
                      {template.name} - {route.name}
                    </option>
                  )),
                )}
              </select>
            </div>
          </>
        )}

        {/* Annotation actions - only in pen mode */}
        {toolMode === "pen" && (
          <>
            <div className="h-8 w-px bg-gray-300"></div>

            <button
              onClick={onClearAnnotations}
              className="px-4 py-2 text-sm bg-red-600 text-white rounded hover:bg-red-700"
            >
              🗑️ Clear Annotations
            </button>
          </>
        )}
      </div>

      {/* Hints */}
      <div className="mt-2 text-xs text-gray-500">
        {toolMode === "select" && "• Drag players to reposition them"}
        {toolMode === "route" &&
          selectedPlayerId &&
          matchingTemplates.length > 0 &&
          "• Load a pre-made route from dropdown, or click to draw route points manually. Double-click to finish."}
        {toolMode === "route" &&
          (!selectedPlayerId || matchingTemplates.length === 0) &&
          "• Click a player, then click to draw route points. Double-click to finish."}
        {toolMode === "pen" && "• Click and drag to draw freehand annotations"}
      </div>
    </div>
  );
}
