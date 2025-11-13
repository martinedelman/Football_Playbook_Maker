import { useMemo } from "react";
import type { Coordinate, Player } from "./types";

const FIELD_WIDTH = 800;
const FIELD_HEIGHT = 500;
const LINE_SPACING = 60;

export type PlayFieldProps = {
  players: Player[];
  highlightPlayerId?: string;
  onFieldClick?: (coordinate: Coordinate) => void;
};

function yardLines() {
  const lines = [];
  for (let y = 60; y < FIELD_HEIGHT; y += LINE_SPACING) {
    lines.push(y);
  }
  return lines;
}

function buildPolyline(start: Coordinate, path?: Coordinate[]) {
  if (!path || path.length === 0) {
    return "";
  }
  const points = [start, ...path];
  return points.map((point) => `${point.x},${point.y}`).join(" ");
}

export function PlayField({ players, highlightPlayerId, onFieldClick }: PlayFieldProps) {
  const lines = useMemo(() => yardLines(), []);

  const handleClick = (event: React.MouseEvent<SVGSVGElement, MouseEvent>) => {
    if (!onFieldClick) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const scaleX = FIELD_WIDTH / rect.width;
    const scaleY = FIELD_HEIGHT / rect.height;
    const x = (event.clientX - rect.left) * scaleX;
    const y = (event.clientY - rect.top) * scaleY;
    onFieldClick({ x, y });
  };

  return (
    <svg
      width="100%"
      height="100%"
      viewBox={`0 0 ${FIELD_WIDTH} ${FIELD_HEIGHT}`}
      className="rounded-3xl shadow-lg bg-green-700"
      onClick={handleClick}
    >
      <rect width={FIELD_WIDTH} height={FIELD_HEIGHT} fill="#176437" rx={28} />
      {lines.map((y) => (
        <line
          key={y}
          x1={40}
          x2={FIELD_WIDTH - 40}
          y1={y}
          y2={y}
          stroke="#ffffff44"
          strokeWidth={2}
          strokeDasharray="10 10"
        />
      ))}
      <rect
        x={40}
        y={40}
        width={FIELD_WIDTH - 80}
        height={FIELD_HEIGHT - 80}
        stroke="#ffffffaa"
        strokeWidth={4}
        fill="none"
        rx={24}
      />
      {players.map((player) => {
        const isHighlight = highlightPlayerId === player.id;
        const polyline = buildPolyline(player.position, player.path);

        return (
          <g key={player.id}>
            {polyline && player.routeName !== "Block" && (
              <polyline
                points={polyline}
                fill="none"
                stroke={isHighlight ? "#facc15" : "#fef9c3"}
                strokeWidth={isHighlight ? 5 : 4}
                markerEnd="url(#arrowhead)"
              />
            )}
            <circle
              cx={player.position.x}
              cy={player.position.y}
              r={isHighlight ? 20 : 16}
              fill={isHighlight ? "#facc15" : "#1f2937"}
              stroke="#fef3c7"
              strokeWidth={3}
            />
            <text
              x={player.position.x}
              y={player.position.y + 5}
              textAnchor="middle"
              fontSize={isHighlight ? 16 : 14}
              fill="#fefce8"
              fontWeight="600"
            >
              {player.label}
            </text>
          </g>
        );
      })}
      <defs>
        <marker
          id="arrowhead"
          markerWidth="10"
          markerHeight="10"
          refX="6"
          refY="3"
          orient="auto"
          markerUnits="strokeWidth"
        >
          <path d="M0,0 L0,6 L6,3 z" fill="#fef08a" />
        </marker>
      </defs>
    </svg>
  );
}
