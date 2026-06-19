"use client";

import { useCallback, useState, useEffect } from "react";
import {
  Play,
  PlayerState,
  PlayerRoute,
  AnnotationStroke,
  Point,
  PlaySide,
  PlayerTemplate,
  RouteStyle,
} from "@/entities";
import { playService } from "@/services/playService";
import { formationService } from "@/services/formationService";
import { playerTemplateService } from "@/services/playerTemplateService";
import FieldCanvas from "./FieldCanvas";
import Toolbar from "./Toolbar";
import { useFeedback } from "./feedback/ToastProvider";
import { FeedbackStatus } from "./feedback/types";

export type ToolMode = "select" | "route" | "pen";

interface PlayEditorProps {
  play: Play;
  onUpdate: (play: Play) => void;
}

export default function PlayEditor({ play, onUpdate }: PlayEditorProps) {
  const { showToast } = useFeedback();
  const [toolMode, setToolMode] = useState<ToolMode>("select");
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [routeStyle, setRouteStyle] = useState<RouteStyle>(play.routeStyle || RouteStyle.STRAIGHT);
  const [isDirty, setIsDirty] = useState(false);
  const [playerTemplates, setPlayerTemplates] = useState<PlayerTemplate[]>([]);

  const loadPlayerTemplates = useCallback(async () => {
    try {
      const templates = await playerTemplateService.getAllPlayerTemplates();
      setPlayerTemplates(templates);
    } catch (error) {
      console.error("Failed to load player templates:", error);
      showToast({ status: FeedbackStatus.ERROR, title: "Unable to load player templates" });
    }
  }, [showToast]);

  useEffect(() => {
    void loadPlayerTemplates();
  }, [loadPlayerTemplates]);

  // Sync routeStyle when play changes
  useEffect(() => {
    setRouteStyle(play.routeStyle || RouteStyle.STRAIGHT);
  }, [play.id, play.routeStyle]);

  const handlePlayersChange = async (players: PlayerState[]) => {
    try {
      const updated = await playService.updatePlayPlayers(play.id, players);
      onUpdate(updated);
      setIsDirty(false);
    } catch (error) {
      console.error("Failed to update players:", error);
      showToast({ status: FeedbackStatus.ERROR, title: "Player changes were not saved" });
    }
  };

  const handleRoutesChange = async (routes: PlayerRoute[]) => {
    try {
      const updated = await playService.updatePlayRoutes(play.id, routes);
      onUpdate(updated);
      setIsDirty(false);
    } catch (error) {
      console.error("Failed to update routes:", error);
      showToast({ status: FeedbackStatus.ERROR, title: "Route changes were not saved" });
    }
  };

  const handleAnnotationsChange = async (annotations: AnnotationStroke[]) => {
    try {
      const updated = await playService.updatePlayAnnotations(play.id, annotations);
      onUpdate(updated);
      setIsDirty(false);
    } catch (error) {
      console.error("Failed to update annotations:", error);
      showToast({ status: FeedbackStatus.ERROR, title: "Annotations were not saved" });
    }
  };

  const handleClearAnnotations = async () => {
    await handleAnnotationsChange([]);
  };

  const handleRouteStyleChange = async (newRouteStyle: RouteStyle) => {
    setRouteStyle(newRouteStyle);
    try {
      const updated = await playService.updatePlayRouteStyle(play.id, newRouteStyle);
      onUpdate(updated);
    } catch (error) {
      console.error("Failed to update route style:", error);
      showToast({ status: FeedbackStatus.ERROR, title: "Route style was not saved" });
    }
  };

  const handleSaveFormation = async (name: string) => {
    if (!name.trim()) {
      showToast({ status: FeedbackStatus.WARNING, title: "Formation name is required" });
      return;
    }

    try {
      await formationService.saveFormation(name, play.side, play.players);
      showToast({ status: FeedbackStatus.INFO, title: "Formation saved", message: name.trim() });
    } catch (error) {
      console.error("Failed to save formation:", error);
      showToast({ status: FeedbackStatus.ERROR, title: "Formation was not saved" });
    }
  };

  const handleLoadFormation = async (formationId: string) => {
    try {
      const updated = await playService.applyFormationToPlay(play.id, formationId);
      onUpdate(updated);
    } catch (error) {
      console.error("Failed to load formation:", error);
      showToast({ status: FeedbackStatus.ERROR, title: "Formation could not be loaded" });
    }
  };

  const handlePlayerColorChange = async (color: string) => {
    if (!selectedPlayerId) return;

    const updatedPlayers = play.players.map((p) => (p.playerId === selectedPlayerId ? { ...p, color } : p));
    await handlePlayersChange(updatedPlayers);
  };

  const handleApplyTemplateRoute = async (templateId: string, routeId: string) => {
    if (!selectedPlayerId) return;

    const template = playerTemplates.find((t) => t.id === templateId);
    if (!template) return;

    const namedRoute = template.routes.find((r) => r.id === routeId);
    if (!namedRoute) return;

    const player = play.players.find((p) => p.playerId === selectedPlayerId);
    if (!player) return;

    // Calculate offset between template player position and current player position
    const templateX = template.initialX !== undefined ? template.initialX : 250;
    const templateY = template.initialY !== undefined ? template.initialY : 150;
    const offsetX = player.x - templateX;
    const offsetY = player.y - templateY;

    // Apply offset to all route points
    const adjustedPoints = namedRoute.points.map((point) => ({
      x: point.x + offsetX,
      y: point.y + offsetY,
    }));

    // Remove existing route for this player and add new one
    const existingRoutes = play.routes.filter((r) => r.playerId !== selectedPlayerId);
    const newRoute: PlayerRoute = {
      playerId: selectedPlayerId,
      points: adjustedPoints,
    };

    await handleRoutesChange([...existingRoutes, newRoute]);
  };

  const selectedPlayer = play.players.find((p) => p.playerId === selectedPlayerId);

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-800">{play.name}</h2>
            <p className="text-sm text-gray-500">{play.side === PlaySide.OFFENSE ? "Offensive" : "Defensive"} Play</p>
          </div>
          {isDirty && <span className="text-sm text-orange-600">Unsaved changes</span>}
        </div>
      </div>

      {/* Toolbar */}
      <Toolbar
        toolMode={toolMode}
        onToolModeChange={setToolMode}
        routeStyle={routeStyle}
        onRouteStyleChange={handleRouteStyleChange}
        playSide={play.side}
        selectedPlayerId={selectedPlayerId}
        selectedPlayerLabel={selectedPlayer?.label}
        selectedPlayerColor={selectedPlayer?.color}
        onPlayerColorChange={handlePlayerColorChange}
        onSaveFormation={handleSaveFormation}
        onLoadFormation={handleLoadFormation}
        onClearAnnotations={handleClearAnnotations}
        playerTemplates={playerTemplates}
        onApplyTemplateRoute={handleApplyTemplateRoute}
      />

      {/* Canvas */}
      <div className="flex-1 overflow-hidden p-4">
        <FieldCanvas
          players={play.players}
          routes={play.routes}
          annotations={play.annotations}
          toolMode={toolMode}
          routeStyle={routeStyle}
          selectedPlayerId={selectedPlayerId}
          playSide={play.side}
          onPlayersChange={handlePlayersChange}
          onRoutesChange={handleRoutesChange}
          onAnnotationsChange={handleAnnotationsChange}
          onSelectPlayer={setSelectedPlayerId}
        />
      </div>
    </div>
  );
}
