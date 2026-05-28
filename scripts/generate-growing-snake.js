const fs = require("fs");
const path = require("path");

const OUT_DIR = path.join(__dirname, "..", "assets");
const CELL = 16;
const DOT = 12;
const GAP = CELL - DOT;
const COLS = 53;
const ROWS = 7;
const WIDTH = COLS * CELL + GAP;
const HEIGHT = ROWS * CELL + 72;
const DURATION = 32000;
const INITIAL_LENGTH = 4;
const STEP_COUNT = 80;
const BODY_SEGMENTS = 18;

const themes = {
  light: {
    file: "github-contribution-grid-snake-growing.svg",
    empty: "#ebedf0",
    stroke: "#1b1f230a",
    levels: ["#9be9a8", "#40c463", "#30a14e", "#216e39"],
    snake: "#8b5cf6",
    snakeHead: "#22c55e",
    food: "#f97316",
    background: "transparent",
  },
  dark: {
    file: "github-contribution-grid-snake-growing-dark.svg",
    empty: "#161b22",
    stroke: "#30363d",
    levels: ["#01311f", "#034525", "#0f6d31", "#00c647"],
    snake: "#a78bfa",
    snakeHead: "#22c55e",
    food: "#f59e0b",
    background: "transparent",
  },
};

const contributions = new Map([
  ["0,4", 1],
  ["22,4", 1],
  ["22,5", 1],
  ["24,4", 1],
  ["26,1", 1],
  ["29,4", 1],
  ["39,2", 1],
  ["41,5", 1],
  ["44,1", 1],
  ["44,2", 2],
  ["44,3", 2],
  ["44,4", 1],
  ["44,5", 3],
  ["45,2", 1],
  ["45,3", 2],
  ["45,4", 2],
  ["45,5", 1],
  ["46,0", 1],
  ["46,1", 1],
  ["46,2", 2],
  ["46,3", 3],
  ["46,4", 2],
  ["46,5", 4],
  ["47,1", 1],
  ["47,2", 2],
  ["47,3", 2],
  ["47,4", 2],
  ["47,5", 2],
  ["48,1", 1],
  ["48,2", 3],
  ["48,3", 2],
  ["48,4", 2],
  ["49,3", 2],
  ["49,4", 1],
  ["49,5", 2],
  ["49,6", 3],
  ["50,1", 3],
  ["50,2", 4],
  ["50,3", 3],
  ["50,4", 4],
  ["50,5", 3],
  ["51,1", 2],
  ["51,2", 3],
  ["51,3", 2],
  ["51,4", 2],
  ["51,5", 1],
  ["52,1", 1],
  ["52,2", 1],
  ["52,3", 1],
  ["52,4", 2],
]);

const pathPoints = [
  [0, -1],
  [0, 4],
  [22, 4],
  [22, 5],
  [24, 5],
  [24, 4],
  [29, 4],
  [29, 1],
  [26, 1],
  [26, 2],
  [41, 2],
  [41, 5],
  [43, 5],
  [43, 1],
  [48, 1],
  [48, 0],
  [46, 0],
  [46, -1],
  [52, -1],
  [52, 3],
  [53, 3],
  [53, 5],
  [51, 5],
  [51, 6],
  [50, 6],
  [50, 7],
  [45, 7],
  [45, 4],
  [43, 4],
  [45, 1],
  [45, 2],
  [46, 2],
  [46, 1],
  [49, 1],
  [49, 4],
  [48, 4],
  [48, 3],
  [47, 3],
  [47, 2],
  [44, 2],
  [44, 3],
  [45, 3],
  [47, 4],
  [47, 5],
  [49, 5],
  [49, 0],
  [51, 0],
  [51, 1],
  [52, 1],
  [52, 4],
  [51, 4],
  [51, 3],
  [48, 2],
  [48, 5],
  [44, 5],
  [50, 5],
  [50, 2],
  [8, 2],
  [8, 1],
  [6, 1],
  [6, -1],
];

function expandPath(points) {
  const expanded = [];

  for (let i = 0; i < points.length - 1; i += 1) {
    const [x1, y1] = points[i];
    const [x2, y2] = points[i + 1];
    const dx = Math.sign(x2 - x1);
    const dy = Math.sign(y2 - y1);
    const steps = Math.max(Math.abs(x2 - x1), Math.abs(y2 - y1));

    if (i === 0) {
      expanded.push({ x: x1, y: y1 });
    }

    for (let step = 1; step <= steps; step += 1) {
      expanded.push({ x: x1 + dx * step, y: y1 + dy * step });
    }
  }

  return expanded;
}

function pct(step) {
  return `${((step / STEP_COUNT) * 100).toFixed(2).replace(/\.?0+$/, "")}%`;
}

function center(point) {
  return {
    x: point.x * CELL,
    y: point.y * CELL,
  };
}

function keyframes(name, frames) {
  const body = frames.map(([offset, declarations]) => `${offset}{${declarations}}`).join("");
  return `@keyframes ${name}{${body}}`;
}

function uniquePositionKeyframes(points, transformForStep) {
  const frames = [];
  let previous = "";

  for (let step = 0; step <= STEP_COUNT; step += 1) {
    const value = transformForStep(step);
    if (value !== previous || step === 0 || step === STEP_COUNT) {
      frames.push([pct(step), value]);
      previous = value;
    }
  }

  return frames;
}

function currentLength(step, eatenSteps) {
  return INITIAL_LENGTH + eatenSteps.filter((foodStep) => foodStep <= step).length;
}

function foodEvents(points) {
  const events = [];
  const used = new Set();

  points.forEach((point, index) => {
    const key = `${point.x},${point.y}`;
    if (contributions.has(key) && !used.has(key)) {
      used.add(key);
      events.push({ key, step: index, point });
    }
  });

  return events;
}

function buildStyle(theme, points, events) {
  const eatenSteps = events.map((event) => event.step);
  const styles = [
    `:root{--empty:${theme.empty};--stroke:${theme.stroke};--snake:${theme.snake};--head:${theme.snakeHead};--food:${theme.food};--bg:${theme.background};--c1:${theme.levels[0]};--c2:${theme.levels[1]};--c3:${theme.levels[2]};--c4:${theme.levels[3]}}`,
    `.cell{shape-rendering:geometricPrecision;fill:var(--empty);stroke:var(--stroke);stroke-width:1px;width:${DOT}px;height:${DOT}px}`,
    `.lvl1{fill:var(--c1)}.lvl2{fill:var(--c2)}.lvl3{fill:var(--c3)}.lvl4{fill:var(--c4)}`,
    `.food{fill:var(--food);transform-box:fill-box;transform-origin:center;animation:${DURATION}ms linear infinite}`,
    `.body,.head{shape-rendering:geometricPrecision;animation:${DURATION}ms steps(1,end) infinite}`,
    `.body{fill:var(--snake);opacity:0}`,
    `.head{fill:var(--head)}`,
    keyframes(
      "head",
      uniquePositionKeyframes(points, (step) => {
        const { x, y } = center(points[Math.min(step, points.length - 1)]);
        return `transform:translate(${x}px,${y}px)`;
      }),
    ),
  ];

  for (let segment = 1; segment <= BODY_SEGMENTS; segment += 1) {
    styles.push(
      keyframes(
        `body${segment}`,
        uniquePositionKeyframes(points, (step) => {
          const length = currentLength(step, eatenSteps);
          const sourceIndex = step - segment;
          if (segment >= length || sourceIndex < 0) {
            return "opacity:0;transform:translate(0px,-48px)";
          }

          const { x, y } = center(points[Math.min(sourceIndex, points.length - 1)]);
          return `opacity:1;transform:translate(${x}px,${y}px)`;
        }),
      ),
    );
  }

  events.forEach((event, index) => {
    styles.push(
      keyframes(`food${index}`, [
        ["0%", "opacity:1;transform:scale(1)"],
        [pct(Math.max(event.step - 1, 0)), "opacity:1;transform:scale(1)"],
        [pct(event.step), "opacity:0;transform:scale(.2)"],
        ["100%", "opacity:0;transform:scale(.2)"],
      ]),
    );
  });

  return styles.join("");
}

function renderCells(theme) {
  const cells = [];

  for (let x = 0; x < COLS; x += 1) {
    for (let y = 0; y < ROWS; y += 1) {
      const level = contributions.get(`${x},${y}`) || 0;
      const className = level ? `cell lvl${level}` : "cell";
      cells.push(
        `<rect class="${className}" x="${x * CELL + 2}" y="${y * CELL + 2}" rx="2" ry="2"/>`,
      );
    }
  }

  return cells.join("");
}

function renderFoods(events) {
  return events
    .map((event, index) => {
      const x = event.point.x * CELL + 4;
      const y = event.point.y * CELL + 4;
      return `<circle class="food" cx="${x + 6}" cy="${y + 6}" r="5" style="animation-name:food${index}"/>`;
    })
    .join("");
}

function renderSnake() {
  const body = [];

  for (let segment = BODY_SEGMENTS; segment >= 1; segment -= 1) {
    const opacity = segment < INITIAL_LENGTH ? 1 : 0;
    body.push(
      `<rect class="body" x="2.4" y="2.4" width="11.2" height="11.2" rx="4" ry="4" style="opacity:${opacity};animation-name:body${segment}"/>`,
    );
  }

  body.push(
    `<rect class="head" x="1.2" y="1.2" width="13.6" height="13.6" rx="4.5" ry="4.5" style="animation-name:head"/>`,
  );

  return body.join("");
}

function renderSvg(theme) {
  const points = expandPath(pathPoints).slice(0, STEP_COUNT + 1);
  const events = foodEvents(points).slice(0, BODY_SEGMENTS - INITIAL_LENGTH);
  const style = buildStyle(theme, points, events);
  const cells = renderCells(theme);
  const foods = renderFoods(events);
  const snake = renderSnake();
  const progressY = ROWS * CELL + 32;

  return [
    `<svg viewBox="-16 -32 ${WIDTH + 32} ${HEIGHT}" width="${WIDTH + 32}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg" role="img" aria-labelledby="title desc">`,
    `<title id="title">Growing GitHub contribution snake</title>`,
    `<desc id="desc">A snake eats highlighted contribution cells and grows longer as it crosses the grid.</desc>`,
    `<style>${style}</style>`,
    `<rect width="${WIDTH + 32}" height="${HEIGHT}" x="-16" y="-32" fill="var(--bg)"/>`,
    cells,
    foods,
    snake,
    `<rect x="0" y="${progressY}" width="${COLS * CELL}" height="12" rx="6" fill="var(--empty)" stroke="var(--stroke)"/>`,
    `<rect x="0" y="${progressY}" width="${COLS * CELL}" height="12" rx="6" fill="var(--head)" opacity=".72">`,
    `<animate attributeName="width" values="0;${COLS * CELL};0" dur="${DURATION}ms" repeatCount="indefinite"/>`,
    `</rect>`,
    `</svg>`,
  ].join("");
}

fs.mkdirSync(OUT_DIR, { recursive: true });

for (const theme of Object.values(themes)) {
  fs.writeFileSync(path.join(OUT_DIR, theme.file), renderSvg(theme));
}
