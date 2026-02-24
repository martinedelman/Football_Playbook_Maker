import { Playbook, Play, PlaySide } from "@/entities";

const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const buildPlaySvg = (play: Play): string => {
  const width = 500;
  const height = 300;
  const scrimmageY = 200;
  const playerRadius = 12;

  const createArrowPath = (from: { x: number; y: number }, to: { x: number; y: number }): string => {
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

  const routesSvg = play.routes
    .map((route) => {
      if (route.points.length < 2) return "";
      const player = play.players.find((p) => p.playerId === route.playerId);
      if (!player) return "";
      const firstRoutePoint = route.points[0];
      const angle = Math.atan2(firstRoutePoint.y - player.y, firstRoutePoint.x - player.x);
      const startPoint = {
        x: player.x + playerRadius * Math.cos(angle),
        y: player.y + playerRadius * Math.sin(angle),
      };
      const allPoints = [startPoint, ...route.points];
      const segments = allPoints
        .slice(1)
        .map((point, index) => {
          const prev = allPoints[index];
          return `<line x1="${prev.x}" y1="${prev.y}" x2="${point.x}" y2="${point.y}" />`;
        })
        .join("");
      const last = allPoints[allPoints.length - 1];
      const prev = allPoints[allPoints.length - 2];
      const arrow = createArrowPath(prev, last);
      const routePoints = route.points
        .slice(0, -1)
        .map((point) => `<circle cx="${point.x}" cy="${point.y}" r="3" fill="#111827" />`)
        .join("");
      return `
        <g fill="none" stroke="#111827" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          ${segments}
          <path d="${arrow}" />
        </g>
        ${routePoints}
      `;
    })
    .join("");

  const playersSvg = play.players
    .map((player) => {
      const label = escapeHtml(player.label);
      return `
        <g>
          <circle cx="${player.x}" cy="${player.y}" r="${playerRadius}" fill="#ffffff" stroke="#111827" stroke-width="2" />
          <text x="${player.x}" y="${player.y + 4}" text-anchor="middle" font-size="10" font-family="Arial" fill="#111827">${label}</text>
        </g>
      `;
    })
    .join("");

  return `
    <svg class="play-diagram" viewBox="0 0 ${width} ${height}" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Play diagram">
      <rect x="0" y="0" width="${width}" height="${height}" fill="#ffffff" stroke="#e5e7eb" />
      <rect x="0" y="${scrimmageY}" width="${width}" height="${height - scrimmageY}" fill="#fef3c7" opacity="0.4" />
      <line x1="0" y1="${scrimmageY}" x2="${width}" y2="${scrimmageY}" stroke="#9ca3af" stroke-dasharray="4 4" />
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

const getLayoutGrid = (perPage: number): { columns: number; rows: number } => {
  switch (perPage) {
    case 1:
      return { columns: 1, rows: 1 };
    case 2:
      return { columns: 1, rows: 2 };
    case 4:
      return { columns: 2, rows: 2 };
    case 8:
      return { columns: 2, rows: 4 };
    case 12:
    default:
      return { columns: 3, rows: 4 };
  }
};

export const buildPlaybookPrintHtml = (playbook: Playbook): string => {
  const layouts = [1, 2, 4, 8, 12];
  const defaultLayout = 1;
  const defaultOrientation = "portrait";
  const playItems = playbook.plays.map((play) => ({
    id: play.id,
    name: escapeHtml(play.name),
    side: play.side === PlaySide.OFFENSE ? "Offense" : "Defense",
    svg: buildPlaySvg(play),
  }));

  const sections = layouts
    .map((perPage) => {
      const { columns, rows } = getLayoutGrid(perPage);
      const pages = chunkArray(playItems, perPage)
        .map((pagePlays, pageIndex) => {
          const cards = pagePlays
            .map(
              (play) => `
                  <div class="play-card">
                    <div class="play-name">${play.name}</div>
                    <div class="play-side">${play.side}</div>
                    ${play.svg}
                  </div>
                `,
            )
            .join("");

          return `
              <div class="print-page">
                <div class="page-header">${perPage} jugada${perPage === 1 ? "" : "s"} por hoja - Pagina ${
                  pageIndex + 1
                }</div>
                <div class="play-grid" style="grid-template-columns: repeat(${columns}, 1fr); grid-template-rows: repeat(${rows}, 1fr);">
                  ${cards}
                </div>
              </div>
            `;
        })
        .join("");

      return `
          <section class="layout-section layout-${perPage}" data-layout="${perPage}">
            ${pages || '<p class="empty">No hay jugadas en este playbook.</p>'}
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
          <title>Imprimir Playbook</title>
          <style>
            * { box-sizing: border-box; }
            body { font-family: Arial, sans-serif; margin: 0; padding: 8px; color: #111827; }
            h1 { font-size: 24px; margin-bottom: 8px; }
            h2 { font-size: 18px; margin: 32px 0 12px; }
            p { margin: 0 0 12px; color: #4b5563; }
            .example-list { margin: 12px 0 20px; padding-left: 18px; color: #374151; }
            .toolbar { display: flex; flex-wrap: wrap; gap: 12px; margin-bottom: 20px; align-items: center; }
            .button { background: #111827; color: #fff; border: none; padding: 8px 12px; border-radius: 6px; cursor: pointer; }
            .control { display: flex; align-items: center; gap: 6px; font-size: 14px; color: #374151; }
            select { border: 1px solid #d1d5db; border-radius: 6px; padding: 6px 10px; }
            .layout-section { page-break-after: always; display: none; }
            body[data-layout="1"] .layout-1,
            body[data-layout="2"] .layout-2,
            body[data-layout="4"] .layout-4,
            body[data-layout="8"] .layout-8,
            body[data-layout="12"] .layout-12 { display: block; }
            .print-page { border: 1px solid #e5e7eb; padding: 12px; margin-bottom: 16px; break-inside: avoid; }
            .page-header { font-size: 12px; text-transform: uppercase; letter-spacing: 0.06em; color: #6b7280; margin-bottom: 8px; }
            .play-grid { display: grid; gap: 12px; min-height: 520px; }
            .play-card { border: 1px dashed #9ca3af; border-radius: 8px; padding: 12px; display: flex; flex-direction: column; gap: 8px; text-align: center; }
            .play-name { font-size: 16px; font-weight: 600; margin-bottom: 6px; }
            .play-side { font-size: 12px; text-transform: uppercase; color: #6b7280; }
            .play-diagram { width: 100%; height: 100%; min-height: 160px; }
            .empty { font-style: italic; }
            @media print {
              .toolbar, .no-print { display: none !important; }
              body { margin: 0; padding: 0; }
              .layout-section { page-break-after: always; }
            }
          </style>
          <style id="page-style">
            @page { size: A4 portrait; margin: 0; }
          </style>
        </head>
        <body data-layout="${defaultLayout}" data-orientation="${defaultOrientation}">
          <h1 class="no-print">${escapeHtml(playbook.name)}</h1>
          <p class="no-print">Ejemplos de como imprimir este playbook:</p>
          <ul class="example-list no-print">
            <li>1 jugada por hoja</li>
            <li>2 jugadas por hoja</li>
            <li>4 jugadas por hoja</li>
            <li>8 jugadas por hoja</li>
            <li>12 jugadas por hoja</li>
          </ul>
          <div class="toolbar no-print">
            <button class="button" onclick="window.print()">Imprimir</button>
            <label class="control" for="layout-select">Jugadas por hoja</label>
            <select id="layout-select">
              <option value="1">1</option>
              <option value="2">2</option>
              <option value="4">4</option>
              <option value="8">8</option>
              <option value="12">12</option>
            </select>
            <label class="control" for="orientation-select">Orientacion</label>
            <select id="orientation-select">
              <option value="portrait">Vertical</option>
              <option value="landscape">Horizontal</option>
            </select>
          </div>
          ${sections}
          <script>
            const layoutSelect = document.getElementById("layout-select");
            const orientationSelect = document.getElementById("orientation-select");
            const pageStyle = document.getElementById("page-style");

            const applyLayout = (value) => {
              document.body.dataset.layout = value;
            };

            const applyOrientation = (value) => {
              document.body.dataset.orientation = value;
              pageStyle.textContent = "@page { size: letter " + value + "; margin: 0.5in; }";
            };

            layoutSelect.value = "${defaultLayout}";
            orientationSelect.value = "${defaultOrientation}";
            applyLayout(layoutSelect.value);
            applyOrientation(orientationSelect.value);

            layoutSelect.addEventListener("change", (event) => applyLayout(event.target.value));
            orientationSelect.addEventListener("change", (event) => applyOrientation(event.target.value));
          </script>
        </body>
      </html>
    `;
};
