import {
  Playbook,
  Play,
  PlaySide,
  PlayerRoute,
  Point,
  RouteSegmentStyle,
  RouteStyle,
  RouteType,
} from "@/entities";

const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const FIELD_WIDTH = 500;
const FIELD_HEIGHT = 300;
const SCRIMMAGE_Y = 200;
const PLAYER_RADIUS = 12;
const DEFAULT_ROUTE_COLOR = "#000000";

const pointsToPath = (points: Point[]): string => {
  if (points.length === 0) return "";
  const start = `M ${points[0].x} ${points[0].y}`;
  const lines = points
    .slice(1)
    .map((point) => `L ${point.x} ${point.y}`)
    .join(" ");
  return `${start} ${lines}`;
};

const midpoint = (first: Point, second: Point): Point => ({
  x: (first.x + second.x) / 2,
  y: (first.y + second.y) / 2,
});

const createCorrugatedPath = (from: Point, to: Point): string => {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const length = Math.hypot(dx, dy);
  if (length === 0) return `M ${from.x} ${from.y}`;

  const sampleCount = Math.max(8, Math.ceil(length / 4));
  const waveCount = Math.max(1, Math.round(length / 14));
  const perpendicularX = -dy / length;
  const perpendicularY = dx / length;
  return pointsToPath(
    Array.from({ length: sampleCount + 1 }, (_, index) => {
      const progress = index / sampleCount;
      const offset = Math.sin(progress * Math.PI * 2 * waveCount) * 3;
      return {
        x: from.x + dx * progress + perpendicularX * offset,
        y: from.y + dy * progress + perpendicularY * offset,
      };
    }),
  );
};

const getRouteSegmentStyle = (route: PlayerRoute, segmentIndex: number): RouteSegmentStyle =>
  route.segmentStyles?.[segmentIndex] ??
  (route.type === RouteType.DASHED ? RouteSegmentStyle.DASHED : RouteSegmentStyle.SOLID);

const getRouteSegmentPath = (
  points: Point[],
  segmentIndex: number,
  segmentStyle: RouteSegmentStyle,
  routeGeometry: RouteStyle,
): string => {
  const from = points[segmentIndex];
  const to = points[segmentIndex + 1];
  if (!from || !to) return "";
  const usesCurvedGeometry = routeGeometry === RouteStyle.CURVED && points.length > 2;
  if (!usesCurvedGeometry) {
    return segmentStyle === RouteSegmentStyle.CORRUGATED
      ? createCorrugatedPath(from, to)
      : pointsToPath([from, to]);
  }

  const isFirst = segmentIndex === 0;
  const isLast = segmentIndex === points.length - 2;
  const visualStart = isFirst ? from : midpoint(points[segmentIndex - 1], from);
  const visualEnd = isLast ? to : midpoint(from, to);
  if (segmentStyle === RouteSegmentStyle.CORRUGATED) return createCorrugatedPath(visualStart, visualEnd);
  return `M ${visualStart.x} ${visualStart.y} Q ${from.x} ${from.y} ${visualEnd.x} ${visualEnd.y}`;
};

const buildPlaySvg = (play: Play): string => {
  const routeStyle = play.routeStyle || RouteStyle.STRAIGHT;

  const createArrowPath = (from: Point, to: Point): string => {
    const angle = Math.atan2(to.y - from.y, to.x - from.x);
    const headLength = 7.5;
    const headWidth = 6.25;

    const cosA = Math.cos(angle);
    const sinA = Math.sin(angle);

    const tip = { x: to.x, y: to.y };
    const headBase = {
      x: tip.x - cosA * headLength,
      y: tip.y - sinA * headLength,
    };

    const perpX = -Math.sin(angle);
    const perpY = Math.cos(angle);

    const upperPoint = {
      x: headBase.x + perpX * headWidth,
      y: headBase.y + perpY * headWidth,
    };

    const lowerPoint = {
      x: headBase.x - perpX * headWidth,
      y: headBase.y - perpY * headWidth,
    };

    return `M ${upperPoint.x} ${upperPoint.y} L ${tip.x} ${tip.y} L ${lowerPoint.x} ${lowerPoint.y}`;
  };

  const createArrowHeadOnly = (from: Point, to: Point): string => {
    const angle = Math.atan2(to.y - from.y, to.x - from.x);
    const headLength = 7.5;
    const headWidth = 6.25;

    const cosA = Math.cos(angle);
    const sinA = Math.sin(angle);

    const tip = { x: to.x, y: to.y };
    const headBase = {
      x: tip.x - cosA * headLength,
      y: tip.y - sinA * headLength,
    };

    const perpX = -Math.sin(angle);
    const perpY = Math.cos(angle);

    const upperPoint = {
      x: headBase.x + perpX * headWidth,
      y: headBase.y + perpY * headWidth,
    };

    const lowerPoint = {
      x: headBase.x - perpX * headWidth,
      y: headBase.y - perpY * headWidth,
    };

    return `M ${upperPoint.x} ${upperPoint.y} L ${tip.x} ${tip.y} L ${lowerPoint.x} ${lowerPoint.y}`;
  };

  const annotationsSvg = play.annotations
    .map((stroke) => {
      if (stroke.points.length === 0) return "";
      return `
        <path
          d="${pointsToPath(stroke.points)}"
          stroke="${escapeHtml(stroke.color)}"
          stroke-width="${stroke.width}"
          fill="none"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      `;
    })
    .join("");

  const routesSvg = play.routes
    .map((route) => {
      if (route.points.length === 0) return "";
      const player = play.players.find((p) => p.playerId === route.playerId);
      if (!player) return "";

      const firstRoutePoint = route.points[0];
      const angle = Math.atan2(firstRoutePoint.y - player.y, firstRoutePoint.x - player.x);
      const startPoint = {
        x: player.x + PLAYER_RADIUS * Math.cos(angle),
        y: player.y + PLAYER_RADIUS * Math.sin(angle),
      };
      const allPoints = [startPoint, ...route.points];
      const routeColor = player.color || DEFAULT_ROUTE_COLOR;
      const routeGeometry = route.routeStyle ?? routeStyle;
      const routeSegments = route.points
        .map((_, segmentIndex) => {
          const segmentStyle = getRouteSegmentStyle(route, segmentIndex);
          const segmentPath = getRouteSegmentPath(allPoints, segmentIndex, segmentStyle, routeGeometry);
          return `<path
            d="${segmentPath}"
            stroke="${escapeHtml(routeColor)}"
            stroke-width="2"
            fill="none"
            stroke-linecap="round"
            stroke-linejoin="round"
            ${segmentStyle === RouteSegmentStyle.DASHED ? 'stroke-dasharray="10,5"' : ""}
          />`;
        })
        .join("");
      const arrow =
        allPoints.length >= 2
          ? routeGeometry === RouteStyle.CURVED
            ? createArrowHeadOnly(allPoints[allPoints.length - 2], allPoints[allPoints.length - 1])
            : createArrowPath(allPoints[allPoints.length - 2], allPoints[allPoints.length - 1])
          : "";
      const routePoints = route.points
        .slice(0, -1)
        .map((point) => `<circle cx="${point.x}" cy="${point.y}" r="3" fill="${escapeHtml(routeColor)}" />`)
        .join("");

      return `
        <g>
          ${routeSegments}
          ${
            arrow
              ? `<path d="${arrow}" stroke="${escapeHtml(routeColor)}" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" />`
              : ""
          }
          ${routeGeometry === RouteStyle.CURVED ? "" : routePoints}
        </g>
      `;
    })
    .join("");

  const playersSvg = play.players
    .map((player) => {
      const label = escapeHtml(player.label);
      const playerColor = player.color ? escapeHtml(player.color) : "#ffffff";
      const playerFillOpacity = player.color ? "0.7" : "1";
      return `
        <g>
          <circle cx="${player.x}" cy="${player.y}" r="${PLAYER_RADIUS}" fill="${playerColor}" fill-opacity="${playerFillOpacity}" stroke="#000000" stroke-width="2.5" />
          <text x="${player.x}" y="${player.y + 4}" text-anchor="middle" font-size="10" font-family="Arial" fill="#111827">${label}</text>
        </g>
      `;
    })
    .join("");

  return `
    <svg class="play-diagram" viewBox="0 0 ${FIELD_WIDTH} ${FIELD_HEIGHT}" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Play diagram">
      <rect x="0" y="0" width="${FIELD_WIDTH}" height="${FIELD_HEIGHT}" fill="#ffffff" />
      <rect x="0" y="${(2 * FIELD_HEIGHT) / 3}" width="${FIELD_WIDTH}" height="${FIELD_HEIGHT / 3}" fill="#f5c5c1" opacity="0.5" />
      <line x1="0" y1="${SCRIMMAGE_Y}" x2="${FIELD_WIDTH}" y2="${SCRIMMAGE_Y}" stroke="#000000" stroke-width="1" stroke-dasharray="15" />
      ${Array.from({ length: 3 })
        .map((_, index) => {
          const y = (index * ((FIELD_HEIGHT / 3) * 2)) / 3;
          return `<line x1="0" y1="${y}" x2="${FIELD_WIDTH}" y2="${y}" stroke="grey" stroke-width="1" opacity="0.3" />`;
        })
        .join("")}
      ${annotationsSvg}
      ${routesSvg}
      ${playersSvg}
    </svg>
  `;
};

const chunkArray = <T,>(items: T[], size: number): T[][] => {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
};

export type PlaybookPrintFormat =
  | "wristband-diagram"
  | "wristband-list"
  | "call-sheet-diagram"
  | "call-sheet-list"
  | "playbook"
  | "scout-cards";

interface PlaybookPrintOptions {
  format: PlaybookPrintFormat;
  bookPlaysPerPage?: 1 | 2 | 4;
}

interface PrintLayout {
  label: string;
  orientation: "portrait" | "landscape";
  perPage: number;
  columns: number;
  rows: number;
}

const getPrintLayout = (options: PlaybookPrintOptions): PrintLayout => {
  switch (options.format) {
    case "wristband-diagram":
      return { label: "Pulsera — Diagrama", orientation: "landscape", perPage: 6, columns: 3, rows: 2 };
    case "wristband-list":
      return { label: "Pulsera — Lista", orientation: "landscape", perPage: 18, columns: 3, rows: 6 };
    case "call-sheet-diagram":
      return { label: "Hoja de llamadas — Diagrama", orientation: "portrait", perPage: 8, columns: 2, rows: 4 };
    case "call-sheet-list":
      return { label: "Hoja de llamadas — Lista", orientation: "portrait", perPage: 30, columns: 2, rows: 15 };
    case "playbook": {
      const perPage = options.bookPlaysPerPage === 4 ? 4 : options.bookPlaysPerPage === 2 ? 2 : 1;
      return {
        label: "Libro de jugadas",
        orientation: "portrait",
        perPage,
        columns: perPage === 4 ? 2 : 1,
        rows: perPage === 4 ? 2 : perPage,
      };
    }
    case "scout-cards":
      return { label: "Tarjetas scout", orientation: "portrait", perPage: 4, columns: 2, rows: 2 };
  }
};

const buildPlayCard = (
  play: { name: string; description: string; side: string; svg: string },
  format: PlaybookPrintFormat,
  playNumber: number,
): string => {
  const meta = `
    <div class="play-meta">
      <span class="play-number">${playNumber}.</span>
      <span class="play-name">${play.name}</span>
      <span class="play-side">${play.side}</span>
    </div>
  `;

  if (format === "wristband-list" || format === "call-sheet-list") {
    return `<article class="play-card list-card">${meta}</article>`;
  }

  if (format === "playbook") {
    return `
      <article class="play-card book-card">
        ${meta}
        <div class="book-content">
          <div class="diagram-wrap">${play.svg}</div>
          <div class="play-description">
            <div class="description-title">Descripción</div>
            ${play.description || '<span class="description-empty">Sin descripción.</span>'}
          </div>
        </div>
      </article>
    `;
  }

  if (format === "scout-cards") {
    return `
      <article class="play-card scout-card">
        ${meta}
        <div class="diagram-wrap">${play.svg}</div>
        <div class="scout-notes" aria-label="Scout notes">
          <span></span><span></span><span></span>
        </div>
      </article>
    `;
  }

  return `<article class="play-card diagram-card">${meta}<div class="diagram-wrap">${play.svg}</div></article>`;
};

export const buildPlaybookPrintHtml = (playbook: Playbook, options: PlaybookPrintOptions): string => {
  const layout = getPrintLayout(options);
  const sheetWidth = layout.orientation === "portrait" ? 200 : 287;
  const sheetHeight = layout.orientation === "portrait" ? 287 : 200;
  const playItems = playbook.plays.map((play) => ({
    name: escapeHtml(play.name),
    description: escapeHtml(play.description ?? ""),
    side: play.side === PlaySide.OFFENSE ? "Offense" : "Defense",
    svg: buildPlaySvg(play),
  }));
  const pages = (playItems.length > 0 ? chunkArray(playItems, layout.perPage) : [[]])
    .map((pagePlays, pageIndex) => {
      const firstPlayNumber = pageIndex * layout.perPage;
      const cards = pagePlays
        .map((play, index) => buildPlayCard(play, options.format, firstPlayNumber + index + 1))
        .join("");

      return `
        <section class="sheet">
          <header class="sheet-header">
            <strong>${escapeHtml(playbook.name)}</strong>
            <span>${layout.label} · Página ${pageIndex + 1}</span>
          </header>
          ${
            cards
              ? `<div class="play-grid" style="grid-template-columns: repeat(${layout.columns}, minmax(0, 1fr)); grid-template-rows: repeat(${layout.rows}, minmax(0, 1fr));">${cards}</div>`
              : '<div class="empty">No hay jugadas en este playbook.</div>'
          }
        </section>
      `;
    })
    .join("");

  return `
      <!doctype html>
      <html lang="es">
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <title>${escapeHtml(playbook.name)} — ${layout.label}</title>
          <style>
            * { box-sizing: border-box; }
            :root { --sheet-width: ${sheetWidth}mm; --sheet-height: ${sheetHeight}mm; }
            html, body { margin: 0; min-height: 100%; }
            body { background: #e5e7eb; color: #111827; font-family: Arial, sans-serif; }
            .toolbar { position: sticky; top: 0; z-index: 2; display: flex; align-items: center; gap: 12px; padding: 12px 16px; background: #fff; box-shadow: 0 1px 6px #0002; }
            .toolbar-title { margin-right: auto; font-size: 14px; color: #374151; }
            .button { border: 0; border-radius: 6px; padding: 8px 14px; background: #111827; color: #fff; font-weight: 600; cursor: pointer; }
            .button-secondary { background: #e5e7eb; color: #1f2937; }
            .sheet { width: var(--sheet-width); height: var(--sheet-height); margin: 12px auto; padding: 2mm; overflow: hidden; background: #fff; break-after: page; box-shadow: 0 2px 12px #0003; }
            .sheet:last-child { break-after: auto; }
            .sheet-header { display: flex; height: 7mm; align-items: center; justify-content: space-between; gap: 4mm; border-bottom: 0.3mm solid #111827; font-size: 3mm; }
            .sheet-header span { color: #4b5563; font-size: 2.6mm; }
            .play-grid { display: grid; height: calc(100% - 7mm); min-height: 0; gap: 1.5mm; padding-top: 1.5mm; }
            .play-card { min-width: 0; min-height: 0; overflow: hidden; border: 0.3mm solid #9ca3af; border-radius: 1.5mm; background: #fff; }
            .play-meta { display: flex; min-height: 6mm; align-items: center; gap: 1.5mm; padding: 1mm 1.5mm; border-bottom: 0.2mm solid #d1d5db; }
            .play-number { color: #6b7280; font-size: 2.5mm; }
            .play-name { min-width: 0; overflow: hidden; font-size: 3mm; font-weight: 700; text-overflow: ellipsis; white-space: nowrap; }
            .play-side { margin-left: auto; color: #6b7280; font-size: 2.1mm; text-transform: uppercase; }
            .diagram-card, .scout-card, .book-card { display: flex; flex-direction: column; }
            .diagram-wrap { min-height: 0; flex: 1; padding: 1mm; }
            .play-diagram { display: block; width: 100%; height: 100%; }
            .list-card { display: flex; align-items: stretch; }
            .list-card .play-meta { width: 100%; min-height: 0; border: 0; padding: 0.7mm 1.5mm; }
            .list-card .play-name { font-size: 2.8mm; }
            .book-content { display: grid; min-height: 0; flex: 1; grid-template-columns: minmax(0, 58%) minmax(0, 42%); }
            .book-content .diagram-wrap { border-right: 0.2mm solid #d1d5db; }
            .play-description { overflow: hidden; padding: 3mm; color: #374151; font-size: 3mm; line-height: 1.35; overflow-wrap: anywhere; white-space: pre-wrap; }
            .description-title { margin-bottom: 2mm; color: #111827; font-size: 3.3mm; font-weight: 700; }
            .description-empty { color: #9ca3af; font-style: italic; }
            .scout-notes { display: grid; gap: 2mm; padding: 0 2mm 2mm; }
            .scout-notes span { display: block; height: 0; border-top: 0.2mm solid #d1d5db; }
            .empty { display: grid; height: calc(100% - 7mm); place-items: center; color: #6b7280; font-style: italic; }
            @media print {
              .toolbar { display: none !important; }
              body { background: #fff; }
              .sheet { margin: 0; box-shadow: none; }
            }
          </style>
          <style id="page-style">
            @page { size: A4 ${layout.orientation}; margin: 5mm; }
          </style>
        </head>
        <body>
          <div class="toolbar">
            <span class="toolbar-title">${escapeHtml(playbook.name)} · ${layout.label} · A4 ${layout.orientation === "portrait" ? "vertical" : "horizontal"}</span>
            <button class="button button-secondary" onclick="window.close()">Cerrar</button>
            <button class="button" onclick="window.print()">Imprimir</button>
          </div>
          ${pages}
        </body>
      </html>
    `;
};
