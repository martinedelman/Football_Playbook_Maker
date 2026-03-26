"use client";

import { useState } from "react";
import { PlayerTemplate, PlayerState, PlayerRoute, NamedRoute, Point, PlaySide, RouteStyle } from "@/entities";
import { playerTemplateService } from "@/services/playerTemplateService";
import FieldCanvas from "./FieldCanvas";
import { ToolMode } from "./PlayEditor";

const FIELD_WIDTH = 500;
const FIELD_HEIGHT = 300;

interface PlayerTemplateEditorProps {
  template: PlayerTemplate;
  onUpdate: (template: PlayerTemplate) => void;
}

export default function PlayerTemplateEditor({ template, onUpdate }: PlayerTemplateEditorProps) {
  const [toolMode, setToolMode] = useState<ToolMode>("select");
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [routeStyle, setRouteStyle] = useState<RouteStyle>(RouteStyle.STRAIGHT);
  const [currentRouteName, setCurrentRouteName] = useState("");
  const [routeBeingDrawn, setRouteBeingDrawn] = useState<PlayerRoute | null>(null);
  const [editingRouteId, setEditingRouteId] = useState<string | null>(null);
  const [editingRouteName, setEditingRouteName] = useState("");

  // Create a single player at the saved initial position or center of the field
  const centerPlayer: PlayerState = {
    playerId: "template-player",
    x: template.initialX !== undefined ? template.initialX : FIELD_WIDTH / 2,
    y: template.initialY !== undefined ? template.initialY : FIELD_HEIGHT / 2,
    label: template.playerLabel,
    color: template.playerColor,
  };

  const handlePlayersChange = async (players: PlayerState[]) => {
    // Update the label, color, and position from the player
    if (players.length > 0) {
      const player = players[0];
      try {
        let updated = template;
        if (player.label !== template.playerLabel) {
          updated = await playerTemplateService.updatePlayerTemplateLabel(template.id, player.label);
        }
        if (player.color !== template.playerColor) {
          updated = await playerTemplateService.updatePlayerTemplateColor(template.id, player.color || "");
        }
        // Update position if changed
        if (player.x !== centerPlayer.x || player.y !== centerPlayer.y) {
          updated = await playerTemplateService.updatePlayerTemplatePosition(template.id, player.x, player.y);
        }
        onUpdate(updated);
      } catch (error) {
        console.error("Failed to update player template:", error);
      }
    }
  };

  const handleRoutesChange = (routes: PlayerRoute[]) => {
    // Update the route being drawn
    if (routes.length > 0) {
      setRouteBeingDrawn(routes[0]);
    }
  };

  const handleSaveRoute = async () => {
    if (!currentRouteName.trim()) {
      alert("Please enter a route name");
      return;
    }

    if (!routeBeingDrawn || routeBeingDrawn.points.length === 0) {
      alert("Please draw a route first");
      return;
    }

    try {
      const newRoute: NamedRoute = {
        id: `route-${Date.now()}`,
        name: currentRouteName.trim(),
        points: routeBeingDrawn.points,
      };

      const updatedRoutes = [...template.routes, newRoute];
      const updated = await playerTemplateService.updatePlayerTemplateRoutes(template.id, updatedRoutes);
      onUpdate(updated);

      // Reset
      setCurrentRouteName("");
      setRouteBeingDrawn(null);
    } catch (error) {
      console.error("Failed to save route:", error);
      alert("Error saving route");
    }
  };

  const handleDeleteRoute = async (routeId: string) => {
    try {
      const updatedRoutes = template.routes.filter((r) => r.id !== routeId);
      const updated = await playerTemplateService.updatePlayerTemplateRoutes(template.id, updatedRoutes);
      onUpdate(updated);
    } catch (error) {
      console.error("Failed to delete route:", error);
      alert("Error deleting route");
    }
  };

  const handleStartEditRoute = (routeId: string, currentName: string) => {
    setEditingRouteId(routeId);
    setEditingRouteName(currentName);
  };

  const handleSaveRouteName = async (routeId: string) => {
    if (!editingRouteName.trim()) {
      return;
    }

    try {
      const updatedRoutes = template.routes.map((r) =>
        r.id === routeId ? { ...r, name: editingRouteName.trim() } : r,
      );
      const updated = await playerTemplateService.updatePlayerTemplateRoutes(template.id, updatedRoutes);
      onUpdate(updated);
      setEditingRouteId(null);
      setEditingRouteName("");
    } catch (error) {
      console.error("Failed to update route name:", error);
    }
  };

  const handleClearCurrentRoute = () => {
    setRouteBeingDrawn(null);
  };

  const handlePlayerColorChange = async (color: string) => {
    try {
      const updated = await playerTemplateService.updatePlayerTemplateColor(template.id, color);
      onUpdate(updated);
    } catch (error) {
      console.error("Failed to update player color:", error);
    }
  };

  // Convert saved NamedRoutes to display on the field
  const savedRoutesForDisplay: PlayerRoute[] = template.routes.map((namedRoute) => ({
    playerId: "template-player",
    points: namedRoute.points,
  }));

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-800">{template.name}</h2>
            <p className="text-sm text-gray-500">
              Player Template - In Select mode: move player, edit label (double-click), change color. In Route mode:
              draw routes
            </p>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white border-b border-gray-200 px-6 py-3 shadow-sm">
        <div className="flex items-center gap-4">
          {/* Tool Mode Buttons */}
          <div className="flex items-center gap-2 border-r border-gray-300 pr-4">
            <button
              onClick={() => setToolMode("select")}
              className={`px-4 py-2 rounded font-medium text-sm ${
                toolMode === "select" ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              Select
            </button>
            <button
              onClick={() => setToolMode("route")}
              className={`px-4 py-2 rounded font-medium text-sm ${
                toolMode === "route" ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              Route
            </button>
          </div>

          {/* Color Picker (only when player selected in select mode) */}
          {selectedPlayerId && toolMode === "select" && (
            <div className="flex items-center gap-2 border-r border-gray-300 pr-4">
              <label className="text-sm font-medium text-gray-700">Player Color:</label>
              <input
                type="color"
                value={template.playerColor || "#000000"}
                onChange={(e) => handlePlayerColorChange(e.target.value)}
                className="w-10 h-8 rounded border border-gray-300 cursor-pointer"
              />
            </div>
          )}

          {/* Route Controls */}
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Route Name:</label>
            <input
              type="text"
              value={currentRouteName}
              onChange={(e) => setCurrentRouteName(e.target.value)}
              placeholder="Enter route name"
              className="px-3 py-1 border border-gray-300 rounded text-sm"
            />
            <button
              onClick={handleSaveRoute}
              className="px-4 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
            >
              Save Route
            </button>
            <button
              onClick={handleClearCurrentRoute}
              className="px-4 py-1 bg-gray-600 text-white rounded hover:bg-gray-700 text-sm"
            >
              Clear Route
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Canvas */}
        <div className="flex-1 overflow-hidden p-4">
          <FieldCanvas
            players={[centerPlayer]}
            routes={routeBeingDrawn ? [routeBeingDrawn] : savedRoutesForDisplay}
            annotations={[]}
            toolMode={toolMode}
            routeStyle={routeStyle}
            selectedPlayerId={selectedPlayerId}
            playSide={PlaySide.OFFENSE}
            onPlayersChange={handlePlayersChange}
            onRoutesChange={handleRoutesChange}
            onAnnotationsChange={() => {}}
            onSelectPlayer={setSelectedPlayerId}
          />
        </div>

        {/* Saved Routes List */}
        <div className="w-80 bg-white border-l border-gray-200 overflow-y-auto">
          <div className="p-4">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Saved Routes ({template.routes.length})</h3>
            {template.routes.length === 0 ? (
              <p className="text-sm text-gray-500">No routes saved yet. Draw a route and give it a name!</p>
            ) : (
              <div className="space-y-2">
                {template.routes.map((route) => (
                  <div key={route.id} className="p-3 bg-gray-50 border border-gray-200 rounded">
                    {editingRouteId === route.id ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={editingRouteName}
                          onChange={(e) => setEditingRouteName(e.target.value)}
                          className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleSaveRouteName(route.id);
                            if (e.key === "Escape") {
                              setEditingRouteId(null);
                              setEditingRouteName("");
                            }
                          }}
                        />
                        <button
                          onClick={() => handleSaveRouteName(route.id)}
                          className="px-2 py-1 bg-blue-600 text-white rounded text-xs"
                        >
                          Save
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-800">{route.name}</span>
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleStartEditRoute(route.id, route.name)}
                            className="px-2 py-1 text-xs text-blue-600 hover:bg-blue-50 rounded"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteRoute(route.id)}
                            className="px-2 py-1 text-xs text-red-600 hover:bg-red-50 rounded"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    )}
                    <p className="text-xs text-gray-500 mt-1">{route.points.length} points</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
