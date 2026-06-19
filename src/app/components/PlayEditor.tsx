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
  RouteSegmentStyle,
  RouteType,
  RouteStyle,
} from "@/entities";
import { playService } from "@/services/playService";
import { formationService } from "@/services/formationService";
import { playerTemplateService } from "@/services/playerTemplateService";
import FieldCanvas from "./FieldCanvas";
import Toolbar from "./Toolbar";
import Modal from "./feedback/Modal";
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
  const [isDirty, setIsDirty] = useState(false);
  const [isAnnotationEraserActive, setIsAnnotationEraserActive] = useState(false);
  const [annotationColor, setAnnotationColor] = useState("#000000");
  const [isDescriptionOpen, setIsDescriptionOpen] = useState(false);
  const [descriptionDraft, setDescriptionDraft] = useState(play.description ?? "");
  const [isSavingDescription, setIsSavingDescription] = useState(false);
  const [pendingRouteStyles, setPendingRouteStyles] = useState<Record<string, RouteStyle>>({});
  const [selectedRouteSegments, setSelectedRouteSegments] = useState<
    Array<{ playerId: string; segmentIndex: number }>
  >([]);
  const [playerTemplates, setPlayerTemplates] = useState<PlayerTemplate[]>([]);
  const legacyRouteStyle = play.routeStyle || RouteStyle.STRAIGHT;
  const selectedRoute = play.routes.find((route) => route.playerId === selectedPlayerId);
  const selectedRouteStyle = selectedPlayerId
    ? pendingRouteStyles[selectedPlayerId] ?? selectedRoute?.routeStyle ?? legacyRouteStyle
    : legacyRouteStyle;

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

  useEffect(() => {
    setSelectedRouteSegments([]);
    setPendingRouteStyles({});
    setDescriptionDraft("");
    setIsDescriptionOpen(false);
  }, [play.id]);

  const openDescriptionModal = () => {
    setDescriptionDraft(play.description ?? "");
    setIsDescriptionOpen(true);
  };

  const handleSaveDescription = async () => {
    if (isSavingDescription) return;
    setIsSavingDescription(true);
    try {
      const updated = await playService.updatePlayDescription(play.id, descriptionDraft);
      onUpdate(updated);
      setDescriptionDraft(updated.description ?? "");
      setIsDescriptionOpen(false);
      showToast({ status: FeedbackStatus.INFO, title: "Play description saved" });
    } catch (error) {
      console.error("Failed to update play description:", error);
      showToast({ status: FeedbackStatus.ERROR, title: "Play description was not saved" });
    } finally {
      setIsSavingDescription(false);
    }
  };

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
      setSelectedRouteSegments((current) =>
        current.filter((selection) => {
          const route = routes.find((item) => item.playerId === selection.playerId);
          return route !== undefined && selection.segmentIndex < route.points.length;
        }),
      );
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

  const handleClearLastAnnotation = async () => {
    if (play.annotations.length === 0) return;
    const updatedAnnotations = [...play.annotations];
    updatedAnnotations.pop();
    await handleAnnotationsChange(updatedAnnotations);
  };

  const handleToolModeChange = (mode: ToolMode) => {
    setToolMode(mode);
    if (mode !== "pen") setIsAnnotationEraserActive(false);
    if (mode !== "route") setSelectedRouteSegments([]);
  };

  const handleRouteSegmentToggle = (playerId: string, segmentIndex: number) => {
    setSelectedPlayerId(playerId);
    setSelectedRouteSegments((current) => {
      const isSelected = current.some(
        (selection) => selection.playerId === playerId && selection.segmentIndex === segmentIndex,
      );
      return isSelected
        ? current.filter(
            (selection) => selection.playerId !== playerId || selection.segmentIndex !== segmentIndex,
          )
        : [...current, { playerId, segmentIndex }];
    });
  };

  const handleRouteSegmentStyleChange = async (style: RouteSegmentStyle) => {
    if (selectedRouteSegments.length === 0) return;

    const updatedRoutes = play.routes.map((route) => {
      const selectedIndexes = selectedRouteSegments
        .filter((selection) => selection.playerId === route.playerId)
        .map((selection) => selection.segmentIndex);
      if (selectedIndexes.length === 0) return route;

      const legacyStyle = route.type === RouteType.DASHED ? RouteSegmentStyle.DASHED : RouteSegmentStyle.SOLID;
      const segmentStyles = Array.from(
        { length: route.points.length },
        (_, index) => route.segmentStyles?.[index] ?? legacyStyle,
      );
      selectedIndexes.forEach((index) => {
        if (index >= 0 && index < segmentStyles.length) segmentStyles[index] = style;
      });

      return { ...route, type: undefined, segmentStyles };
    });

    await handleRoutesChange(updatedRoutes);
  };

  const handleRouteStyleChange = async (routeStyle: RouteStyle) => {
    if (!selectedPlayerId) return;
    setPendingRouteStyles((current) => ({ ...current, [selectedPlayerId]: routeStyle }));

    if (!selectedRoute) return;
    const updatedRoutes = play.routes.map((route) =>
      route.playerId === selectedPlayerId ? { ...route, routeStyle } : route,
    );
    await handleRoutesChange(updatedRoutes);
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
      routeStyle: selectedRouteStyle,
    };

    await handleRoutesChange([...existingRoutes, newRoute]);
  };

  const selectedPlayer = play.players.find((p) => p.playerId === selectedPlayerId);

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="truncate text-xl font-bold text-gray-800">{play.name}</h2>
              <button
                type="button"
                onClick={openDescriptionModal}
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-base transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  play.description
                    ? "bg-blue-600 text-white hover:bg-blue-700"
                    : "bg-blue-100 text-blue-700 hover:bg-blue-200"
                }`}
                title="View or edit play description"
                aria-label={`View or edit description for ${play.name}`}
              >
                ⓘ
              </button>
            </div>
            <p className="text-sm text-gray-500">{play.side === PlaySide.OFFENSE ? "Offensive" : "Defensive"} Play</p>
            {play.description && <p className="mt-1 line-clamp-2 text-sm text-gray-600">{play.description}</p>}
          </div>
          {isDirty && <span className="text-sm text-orange-600">Unsaved changes</span>}
        </div>
      </div>

      {/* Toolbar */}
      <Toolbar
        toolMode={toolMode}
        onToolModeChange={handleToolModeChange}
        routeStyle={selectedRouteStyle}
        onRouteStyleChange={handleRouteStyleChange}
        selectedRouteSegmentCount={selectedRouteSegments.length}
        onRouteSegmentStyleChange={handleRouteSegmentStyleChange}
        playSide={play.side}
        selectedPlayerId={selectedPlayerId}
        selectedPlayerLabel={selectedPlayer?.label}
        selectedPlayerColor={selectedPlayer?.color}
        onPlayerColorChange={handlePlayerColorChange}
        onSaveFormation={handleSaveFormation}
        onLoadFormation={handleLoadFormation}
        onClearAnnotations={handleClearAnnotations}
        onClearLastAnnotation={handleClearLastAnnotation}
        isAnnotationEraserActive={isAnnotationEraserActive}
        onAnnotationEraserChange={setIsAnnotationEraserActive}
        annotationColor={annotationColor}
        onAnnotationColorChange={setAnnotationColor}
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
          routeStyle={legacyRouteStyle}
          drawingRouteStyle={selectedRouteStyle}
          selectedPlayerId={selectedPlayerId}
          playSide={play.side}
          onPlayersChange={handlePlayersChange}
          onRoutesChange={handleRoutesChange}
          onAnnotationsChange={handleAnnotationsChange}
          onSelectPlayer={setSelectedPlayerId}
          isAnnotationEraserActive={isAnnotationEraserActive}
          annotationColor={annotationColor}
          selectedRouteSegments={selectedRouteSegments}
          onRouteSegmentToggle={handleRouteSegmentToggle}
        />
      </div>
      <Modal
        isOpen={isDescriptionOpen}
        status={FeedbackStatus.INFO}
        title="Play description"
        confirmLabel="Save"
        isLoading={isSavingDescription}
        onConfirm={() => void handleSaveDescription()}
        onClose={() => !isSavingDescription && setIsDescriptionOpen(false)}
      >
        <label htmlFor="play-description" className="mb-2 block font-medium text-gray-700">
          Comments and instructions
        </label>
        <textarea
          id="play-description"
          value={descriptionDraft}
          onChange={(event) => setDescriptionDraft(event.target.value)}
          rows={7}
          placeholder="Describe the objective, reads, timing, adjustments, or any other notes for this play..."
          className="w-full resize-y rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
          autoFocus
        />
        <p className="mt-2 text-xs text-gray-500">Leave the field empty and save to remove the description.</p>
      </Modal>
    </div>
  );
}
