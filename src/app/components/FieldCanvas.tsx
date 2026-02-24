"use client";

import { useState, useRef, useEffect, MouseEvent, PointerEvent } from "react";
import { PlayerState, PlayerRoute, AnnotationStroke, Point, PlaySide } from "@/entities";
import { ToolMode } from "./PlayEditor";
import { generateUUID } from "@/utils/uuid";

interface FieldCanvasProps {
  players: PlayerState[];
  routes: PlayerRoute[];
  annotations: AnnotationStroke[];
  toolMode: ToolMode;
  selectedPlayerId: string | null;
  playSide: PlaySide;
  onPlayersChange: (players: PlayerState[]) => void;
  onRoutesChange: (routes: PlayerRoute[]) => void;
  onAnnotationsChange: (annotations: AnnotationStroke[]) => void;
  onSelectPlayer: (playerId: string | null) => void;
}

const FIELD_WIDTH = 500;
const FIELD_HEIGHT = 300;
const PLAYER_RADIUS = 12;
const PLAYER_LABELS = ["X", "Y", "Z", "QB", "F"];

const COLORS = {
  FIELD_BG: "#FFFFFF",
  FORMATION_ZONE: "#f5c5c1",
  SCRIMMAGE_LINE: "#000000",
  YARD_LINES: "grey",
  ROUTE_LINE: "#000000",
  ROUTE_POINT: "#000000",
  ANNOTATION: "#000000",
  ARROW: "#000000",
  PLAYER_BG_IDLE: "#FFFFFF",
  PLAYER_BG_SELECTED: "#3B82F6",
  PLAYER_STROKE_IDLE: "#000000",
  PLAYER_STROKE_SELECTED: "#1D4ED8",
  PLAYER_TEXT_IDLE: "#000000",
  PLAYER_TEXT_SELECTED: "#FFFFFF",
} as const;

export default function FieldCanvas({
  players,
  routes,
  annotations,
  toolMode,
  selectedPlayerId,
  playSide,
  onPlayersChange,
  onRoutesChange,
  onAnnotationsChange,
  onSelectPlayer,
}: FieldCanvasProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [draggedPlayer, setDraggedPlayer] = useState<string | null>(null);
  const [currentRoute, setCurrentRoute] = useState<Point[]>([]);
  const [currentAnnotation, setCurrentAnnotation] = useState<Point[]>([]);
  const [isDrawingAnnotation, setIsDrawingAnnotation] = useState(false);
  const [editingPlayerId, setEditingPlayerId] = useState<string | null>(null);
  const [editingLabel, setEditingLabel] = useState<string>("");

  // Convertir coordenadas de pantalla a SVG
  const screenToSVG = (clientX: number, clientY: number): Point => {
    if (!svgRef.current) return { x: 0, y: 0 };
    const rect = svgRef.current.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * FIELD_WIDTH;
    const y = ((clientY - rect.top) / rect.height) * FIELD_HEIGHT;
    return { x: Math.max(0, Math.min(FIELD_WIDTH, x)), y: Math.max(0, Math.min(FIELD_HEIGHT, y)) };
  };

  // Handle player drag
  const handlePlayerPointerDown = (e: PointerEvent<SVGCircleElement>, playerId: string) => {
    if (toolMode !== "select") return;
    e.stopPropagation();
    setDraggedPlayer(playerId);
    onSelectPlayer(playerId);
    (e.target as SVGCircleElement).setPointerCapture(e.pointerId);
  };

  const handlePlayerPointerMove = (e: PointerEvent<SVGCircleElement>) => {
    if (!draggedPlayer || toolMode !== "select") return;
    e.preventDefault();
    let point = screenToSVG(e.clientX, e.clientY);

    // Restrict drag area based on play side
    const FORMATION_ZONE_START = (2 * FIELD_HEIGHT) / 3; // y = 200
    if (playSide === PlaySide.DEFENSE) {
      point.y = Math.max(PLAYER_RADIUS, Math.min(FORMATION_ZONE_START - PLAYER_RADIUS, point.y));
    } else if (playSide === PlaySide.OFFENSE) {
      point.y = Math.max(FORMATION_ZONE_START + PLAYER_RADIUS, Math.min(FIELD_HEIGHT - PLAYER_RADIUS, point.y));
    }

    const updatedPlayers = players.map((p) => (p.playerId === draggedPlayer ? { ...p, x: point.x, y: point.y } : p));
    onPlayersChange(updatedPlayers);
  };

  const handlePlayerPointerUp = (e: PointerEvent<SVGCircleElement>) => {
    if (draggedPlayer) {
      setDraggedPlayer(null);
      (e.target as SVGCircleElement).releasePointerCapture(e.pointerId);
    }
  };

  // Snap point to grid (align to horizontal/vertical within 5px threshold)
  const snapToGrid = (point: Point, referencePoints: Point[], threshold = 5): Point => {
    if (referencePoints.length === 0) return point;

    const lastPoint = referencePoints[referencePoints.length - 1];
    let snappedPoint = { ...point };

    // Snap to horizontal (same Y) if within threshold
    const deltaY = Math.abs(point.y - lastPoint.y);
    if (deltaY < threshold) {
      snappedPoint.y = lastPoint.y;
    }

    // Snap to vertical (same X) if within threshold
    const deltaX = Math.abs(point.x - lastPoint.x);
    if (deltaX < threshold) {
      snappedPoint.x = lastPoint.x;
    }

    return snappedPoint;
  };

  // Handle route drawing
  const handleCanvasClick = (e: MouseEvent<SVGSVGElement>) => {
    const point = screenToSVG(e.clientX, e.clientY);

    if (toolMode === "route") {
      if (!selectedPlayerId) {
        alert("Please select a player first (click on a player token)");
        return;
      }

      // Use player position as reference for first point, otherwise use current route
      const referencePoints =
        currentRoute.length === 0 ? [players.find((p) => p.playerId === selectedPlayerId)!] : currentRoute;

      const snappedPoint = snapToGrid(point, referencePoints);
      setCurrentRoute([...currentRoute, snappedPoint]);
    }
  };

  const handleCanvasDoubleClick = (e: MouseEvent<SVGSVGElement>) => {
    if (toolMode === "route" && currentRoute.length > 0 && selectedPlayerId) {
      const endPoint = screenToSVG(e.clientX, e.clientY);
      const updatedPoints = [...currentRoute];
      const last = updatedPoints[updatedPoints.length - 1];

      if (!pointsEqual(last, endPoint)) {
        updatedPoints.push(endPoint);
      }

      // Remove trailing duplicates so the arrow uses a valid segment
      const cleanedPoints = removeTrailingDuplicates(updatedPoints);

      // Save route
      const newRoute: PlayerRoute = {
        playerId: selectedPlayerId,
        points: cleanedPoints,
      };

      // Replace existing route for this player or add new
      const updatedRoutes = routes.filter((r) => r.playerId !== selectedPlayerId);
      updatedRoutes.push(newRoute);
      onRoutesChange(updatedRoutes);
      setCurrentRoute([]);
    }
  };

  const handlePlayerClickForRoute = (e: MouseEvent<SVGCircleElement>, playerId: string) => {
    if (toolMode === "route") {
      e.stopPropagation();
      onSelectPlayer(playerId);
      setCurrentRoute([]);
    }
  };

  // Handle player label editing
  const handleLabelDoubleClick = (playerId: string, currentLabel: string) => {
    if (toolMode === "route") {
      if (currentRoute.length === 0) {
        // No hay ruta en drawing, eliminar la ruta guardada
        const updatedRoutes = routes.filter((r) => r.playerId !== playerId);
        onRoutesChange(updatedRoutes);
        onSelectPlayer(null);
      } else {
        // Hay ruta en drawing, finalizarla
        const updatedPoints = [...currentRoute];
        const last = updatedPoints[updatedPoints.length - 1];

        // Remove trailing duplicates so the arrow uses a valid segment
        const cleanedPoints = removeTrailingDuplicates(updatedPoints);

        // Save route
        const newRoute: PlayerRoute = {
          playerId: playerId,
          points: cleanedPoints,
        };

        // Replace existing route for this player or add new
        const filteredRoutes = routes.filter((r) => r.playerId !== playerId);
        filteredRoutes.push(newRoute);
        onRoutesChange(filteredRoutes);
        setCurrentRoute([]);
      }
    } else if (toolMode === "select") {
      // En modo select, permite editar el nombre
      setEditingPlayerId(playerId);
      setEditingLabel(currentLabel);
    }
  };

  const handleLabelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditingLabel(e.target.value);
  };

  const handleLabelBlur = () => {
    if (editingPlayerId && editingLabel.trim()) {
      const updatedPlayers = players.map((p) =>
        p.playerId === editingPlayerId ? { ...p, label: editingLabel.trim() } : p,
      );
      onPlayersChange(updatedPlayers);
    }
    setEditingPlayerId(null);
    setEditingLabel("");
  };

  const handleLabelKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleLabelBlur();
    } else if (e.key === "Escape") {
      setEditingPlayerId(null);
      setEditingLabel("");
    }
  };

  // Handle freehand annotation drawing
  const handleAnnotationPointerDown = (e: PointerEvent<SVGSVGElement>) => {
    if (toolMode !== "pen") return;
    const point = screenToSVG(e.clientX, e.clientY);
    setIsDrawingAnnotation(true);
    setCurrentAnnotation([point]);
  };

  const handleAnnotationPointerMove = (e: PointerEvent<SVGSVGElement>) => {
    if (!isDrawingAnnotation || toolMode !== "pen") return;
    const point = screenToSVG(e.clientX, e.clientY);
    setCurrentAnnotation([...currentAnnotation, point]);
  };

  const handleAnnotationPointerUp = () => {
    if (isDrawingAnnotation && currentAnnotation.length > 1) {
      const newStroke: AnnotationStroke = {
        id: generateUUID(),
        color: COLORS.ANNOTATION,
        width: 3,
        points: currentAnnotation,
      };
      onAnnotationsChange([...annotations, newStroke]);
    }
    setIsDrawingAnnotation(false);
    setCurrentAnnotation([]);
  };

  // Points to SVG path
  const pointsToPath = (points: Point[]): string => {
    if (points.length === 0) return "";
    const start = `M ${points[0].x} ${points[0].y}`;
    const lines = points
      .slice(1)
      .map((p) => `L ${p.x} ${p.y}`)
      .join(" ");
    return `${start} ${lines}`;
  };

  const pointsEqual = (a: Point, b: Point, epsilon = 0.5): boolean => {
    return Math.abs(a.x - b.x) < epsilon && Math.abs(a.y - b.y) < epsilon;
  };

  const removeTrailingDuplicates = (points: Point[]): Point[] => {
    if (points.length < 2) return points;
    const cleaned = [...points];
    while (cleaned.length >= 2) {
      const last = cleaned[cleaned.length - 1];
      const prev = cleaned[cleaned.length - 2];
      if (!pointsEqual(last, prev)) break;
      cleaned.pop();
    }
    return cleaned;
  };

  const createArrowPath = (from: Point, to: Point): string => {
    const angle = Math.atan2(to.y - from.y, to.x - from.x);
    const headLength = 7.5;
    const headWidth = 6.25;

    const cosA = Math.cos(angle);
    const sinA = Math.sin(angle);

    // Punta
    const tip = { x: to.x, y: to.y };

    // Base de la cabeza (punto hacia atrás)
    const headBase = {
      x: tip.x - cosA * headLength,
      y: tip.y - sinA * headLength,
    };

    // Perpendicular para calcular los puntos de la V
    const perpX = -Math.sin(angle);
    const perpY = Math.cos(angle);

    // Puntos de la punta (V)
    const upperPoint = {
      x: headBase.x + perpX * headWidth,
      y: headBase.y + perpY * headWidth,
    };

    const lowerPoint = {
      x: headBase.x - perpX * headWidth,
      y: headBase.y - perpY * headWidth,
    };

    return `M ${from.x} ${from.y} L ${tip.x} ${tip.y} L ${upperPoint.x} ${upperPoint.y} M ${tip.x} ${tip.y} L ${lowerPoint.x} ${lowerPoint.y}`;
  };

  return (
    <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded-lg">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${FIELD_WIDTH} ${FIELD_HEIGHT}`}
        preserveAspectRatio="xMidYMid meet"
        className="max-w-full max-h-full border-2 border-gray-300 rounded shadow-lg"
        style={{ cursor: toolMode === "pen" ? "crosshair" : toolMode === "route" ? "pointer" : "default" }}
        onClick={handleCanvasClick}
        onDoubleClick={handleCanvasDoubleClick}
        onPointerDown={handleAnnotationPointerDown}
        onPointerMove={handleAnnotationPointerMove}
        onPointerUp={handleAnnotationPointerUp}
      >
        {/* Field background */}
        <rect width={FIELD_WIDTH} height={FIELD_HEIGHT} fill={COLORS.FIELD_BG} />

        {/* Zona de formación (primer tercio desde abajo) - color más oscuro */}
        <rect
          x={0}
          y={(2 * FIELD_HEIGHT) / 3}
          width={FIELD_WIDTH}
          height={FIELD_HEIGHT / 3}
          fill={COLORS.FORMATION_ZONE}
          opacity={0.5}
        />

        {/* Línea de scrimmage (separación primer tercio desde abajo) */}
        <line
          x1={0}
          y1={(2 * FIELD_HEIGHT) / 3}
          x2={FIELD_WIDTH}
          y2={(2 * FIELD_HEIGHT) / 3}
          stroke={COLORS.SCRIMMAGE_LINE}
          strokeWidth={1}
          strokeDasharray="15"
        />

        {/* Yard lines en zona de rutas (cada 5 yards) - horizontales */}
        {Array.from({ length: 3 }).map((_, i) => {
          const y = (i * ((FIELD_HEIGHT / 3) * 2)) / 3;
          return (
            <line
              key={`yard-${i}`}
              x1={0}
              y1={y}
              x2={FIELD_WIDTH}
              y2={y}
              stroke={COLORS.YARD_LINES}
              strokeWidth={1}
              opacity={0.3}
            />
          );
        })}

        {/* Annotations */}
        {annotations.map((stroke) => (
          <path
            key={stroke.id}
            d={pointsToPath(stroke.points)}
            stroke={stroke.color}
            strokeWidth={stroke.width}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ))}

        {/* Current annotation being drawn */}
        {isDrawingAnnotation && currentAnnotation.length > 0 && (
          <path
            d={pointsToPath(currentAnnotation)}
            stroke={COLORS.ANNOTATION}
            strokeWidth={3}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {/* Routes */}
        {routes.map((route, routeIdx) => {
          const player = players.find((p) => p.playerId === route.playerId);
          if (!player || route.points.length === 0) return null;

          // Calculate starting point on player circle perimeter
          const firstRoutePoint = route.points[0];
          const angle = Math.atan2(firstRoutePoint.y - player.y, firstRoutePoint.x - player.x);
          const startPoint = {
            x: player.x + PLAYER_RADIUS * Math.cos(angle),
            y: player.y + PLAYER_RADIUS * Math.sin(angle),
          };

          // Draw route from player perimeter through all points
          const allPoints = [startPoint, ...route.points];
          const routeColor = player.color || COLORS.ROUTE_LINE;

          return (
            <g key={`route-${route.playerId}-${routeIdx}`}>
              <path
                d={pointsToPath(allPoints)}
                stroke={routeColor}
                strokeWidth={2}
                fill="none"
                strokeDasharray={route.type === "dashed" ? "10,5" : undefined}
              />
              {allPoints.length >= 2 && (
                <path
                  d={createArrowPath(allPoints[allPoints.length - 2], allPoints[allPoints.length - 1])}
                  stroke={routeColor}
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                />
              )}
              {/* Route points (exclude last point so arrow is clean) */}
              {route.points.slice(0, -1).map((point, idx) => (
                <circle
                  key={`route-point-${route.playerId}-${routeIdx}-${idx}`}
                  cx={point.x}
                  cy={point.y}
                  r={3}
                  fill={routeColor}
                />
              ))}
            </g>
          );
        })}

        {/* Current route being drawn */}
        {toolMode === "route" && selectedPlayerId && currentRoute.length > 0 && (
          <g opacity={0.5}>
            {(() => {
              const player = players.find((p) => p.playerId === selectedPlayerId);
              if (!player) return null;

              // Calculate starting point on player circle perimeter
              const firstRoutePoint = currentRoute[0];
              const angle = Math.atan2(firstRoutePoint.y - player.y, firstRoutePoint.x - player.x);
              const startPoint = {
                x: player.x + PLAYER_RADIUS * Math.cos(angle),
                y: player.y + PLAYER_RADIUS * Math.sin(angle),
              };

              const allPoints = [startPoint, ...currentRoute];
              const routeColor = player.color || COLORS.ROUTE_LINE;
              return (
                <>
                  <path d={pointsToPath(allPoints)} stroke={routeColor} strokeWidth={2} fill="none" />
                  {allPoints.length >= 2 && (
                    <path
                      d={createArrowPath(allPoints[allPoints.length - 2], allPoints[allPoints.length - 1])}
                      stroke={routeColor}
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      fill="none"
                    />
                  )}
                  {currentRoute.slice(0, -1).map((point, idx) => (
                    <circle key={`current-point-${idx}`} cx={point.x} cy={point.y} r={3} fill={routeColor} />
                  ))}
                </>
              );
            })()}
          </g>
        )}

        {/* Players */}
        {players.map((player) => {
          const playerColor = player.color;
          const isSelected = selectedPlayerId === player.playerId;

          return (
            <g key={player.playerId}>
              <circle
                cx={player.x}
                cy={player.y}
                r={PLAYER_RADIUS}
                fill={isSelected ? COLORS.PLAYER_BG_SELECTED : playerColor || COLORS.PLAYER_BG_IDLE}
                fillOpacity={isSelected ? 1 : playerColor ? 0.7 : 1}
                stroke="#000000"
                strokeWidth={2.5}
                style={{ cursor: toolMode === "select" ? "move" : "pointer" }}
                onPointerDown={(e) => handlePlayerPointerDown(e, player.playerId)}
                onPointerMove={handlePlayerPointerMove}
                onPointerUp={handlePlayerPointerUp}
                onClick={(e) => handlePlayerClickForRoute(e, player.playerId)}
                onDoubleClick={() => handleLabelDoubleClick(player.playerId, player.label)}
              />
              {editingPlayerId === player.playerId ? (
                <foreignObject x={player.x - 20} y={player.y - 12} width={40} height={24}>
                  <input
                    type="text"
                    value={editingLabel}
                    onChange={handleLabelChange}
                    onBlur={handleLabelBlur}
                    onKeyDown={handleLabelKeyDown}
                    autoFocus
                    className="w-full h-full text-center text-sm font-semibold border border-blue-500 rounded"
                    style={{ outline: "none" }}
                  />
                </foreignObject>
              ) : (
                <text
                  x={player.x}
                  y={player.y}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize="14"
                  fontWeight="semibold"
                  fill={isSelected ? COLORS.PLAYER_TEXT_SELECTED : playerColor ? "#000000" : COLORS.PLAYER_TEXT_IDLE}
                  style={{ pointerEvents: "none", userSelect: "none" }}
                >
                  {player.label}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
