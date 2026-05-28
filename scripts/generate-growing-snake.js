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
const DURATION = 20000;
const INITIAL_LENGTH = 1;
const MAX_LENGTH = 18;
let STEP_COUNT = 0;

const themes = {
  light: {
    file: "github-contribution-grid-snake-growing.svg",
    empty: "#ebedf0",
    stroke: "#1b1f230a",
    levels: ["#9be9a8", "#40c463", "#30a14e", "#216e39"],
    snake: "#8b5cf6",
    snakeHead: "#22c55e",
    background: "transparent",
  },
  dark: {
    file: "github-contribution-grid-snake-growing-dark.svg",
    empty: "#161b22",
    stroke: "#30363d",
    levels: ["#01311f", "#034525", "#0f6d31", "#00c647"],
    snake: "#a78bfa",
    snakeHead: "#22c55e",
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
  [0, 1],
  [0, 2],
  [0, 3],
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
  [6, 0],
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

STEP_COUNT = expandPath(pathPoints).length - 1;

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

function uniquePositionKeyframes(transformForStep) {
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
  return Math.min(
    MAX_LENGTH,
    INITIAL_LENGTH + eatenSteps.filter((foodStep) => foodStep <= step).length,
  );
}

function pointAt(points, index) {
  if (index >= 0) {
    return points[Math.min(index, points.length - 1)];
  }

  const first = points[0];
  const second = points[1] || first;
  const backX = first.x - second.x;
  const backY = first.y - second.y;
  const distance = Math.abs(index);

  return {
    x: first.x + backX * distance,
    y: first.y + backY * distance,
  };
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

function selectFoodEvents(events) {
  return events;
}

function buildStyle(theme, points, events, totalSegments) {
  const eatenSteps = events.map((event) => event.step);
  const styles = [
    `:root{--empty:${theme.empty};--stroke:${theme.stroke};--snake:${theme.snake};--head:${theme.snakeHead};--bg:${theme.background};--c1:${theme.levels[0]};--c2:${theme.levels[1]};--c3:${theme.levels[2]};--c4:${theme.levels[3]}}`,
    `.cell{shape-rendering:geometricPrecision;fill:var(--empty);stroke:var(--stroke);stroke-width:1px;width:${DOT}px;height:${DOT}px}`,
    `.lvl1{fill:var(--c1)}.lvl2{fill:var(--c2)}.lvl3{fill:var(--c3)}.lvl4{fill:var(--c4)}`,
    `.eaten{animation:${DURATION}ms linear infinite}`,
    `.body,.head{shape-rendering:geometricPrecision}`,
    `.body{fill:var(--snake);opacity:0;filter:drop-shadow(0 0 2px color-mix(in srgb, var(--snake) 55%, white))}`,
    `.head{fill:var(--head);filter:drop-shadow(0 0 4px color-mix(in srgb, var(--head) 60%, white))}`,
    keyframes(
      "head",
      uniquePositionKeyframes((step) => {
        const { x, y } = center(pointAt(points, step));
        return `transform:translate(${x}px,${y}px)`;
      }),
    ),
  ];

  for (let segment = 1; segment <= totalSegments; segment += 1) {
    const moveFrames = uniquePositionKeyframes((step) => {
      const sourceIndex = step - segment;
      const { x, y } = center(pointAt(points, sourceIndex));
      return `transform:translate(${x}px,${y}px)`;
    });
    const opacityFrames = [];
    let previousOpacity = "";

    for (let step = 0; step <= STEP_COUNT; step += 1) {
      const length = currentLength(step, eatenSteps);
      const sourceIndex = step - segment;
      const visible = segment < length && (sourceIndex >= 0 || segment < INITIAL_LENGTH);
      const opacity = visible ? "opacity:1" : "opacity:0";

      if (opacity !== previousOpacity || step === 0 || step === STEP_COUNT) {
        opacityFrames.push([pct(step), opacity]);
        previousOpacity = opacity;
      }
    }

    styles.push(keyframes(`bodyMove${segment}`, moveFrames));
    styles.push(keyframes(`bodyShow${segment}`, opacityFrames));
  }

  events.forEach((event, index) => {
    const level = contributions.get(event.key) || 1;
    const colorVar = `var(--c${Math.min(level, 4)})`;
    styles.push(
      keyframes(`eatCell${index}`, [
        ["0%", `fill:${colorVar};opacity:1`],
        [pct(Math.max(event.step - 1, 0)), `fill:${colorVar};opacity:1`],
        [pct(event.step), `fill:var(--head);opacity:1`],
        [pct(Math.min(event.step + 1, STEP_COUNT)), `fill:var(--empty);opacity:1`],
        ["100%", "fill:var(--empty);opacity:1"],
      ]),
    );
  });

  styles.push(
    keyframes("foodProgress", [
      ["0%", "transform:scaleX(0)"],
      ["75%", "transform:scaleX(1)"],
      ["100%", "transform:scaleX(0)"],
    ]),
  );

  return styles.join("");
}

function renderCells(events) {
  const cells = [];
  const eatenCells = new Map(events.map((event, index) => [event.key, index]));

  for (let x = 0; x < COLS; x += 1) {
    for (let y = 0; y < ROWS; y += 1) {
      const key = `${x},${y}`;
      const level = contributions.get(key) || 0;
      const eatenIndex = eatenCells.has(key) ? eatenCells.get(key) : -1;
      const classes = ["cell"];
      if (level) {
        classes.push(`lvl${level}`);
      }
      if (eatenIndex !== -1) {
        classes.push("eaten");
      }
      const style = eatenIndex !== -1 ? ` style="animation-name:eatCell${eatenIndex}"` : "";
      cells.push(
        `<rect class="${classes.join(" ")}" x="${x * CELL + 2}" y="${y * CELL + 2}" rx="2" ry="2"${style}/>`,
      );
    }
  }

  return cells.join("");
}

function renderSnake(totalSegments) {
  const body = [];

  for (let segment = totalSegments; segment >= 1; segment -= 1) {
    const opacity = segment < INITIAL_LENGTH ? 1 : 0;
    body.push(
      `<rect class="body" x="2.4" y="2.4" width="11.2" height="11.2" rx="4" ry="4" style="opacity:${opacity};animation-name:bodyMove${segment},bodyShow${segment};animation-duration:${DURATION}ms,${DURATION}ms;animation-timing-function:linear,steps(1,end);animation-iteration-count:infinite,infinite"/>`,
    );
  }

  body.push(
    `<rect class="head" x="1.2" y="1.2" width="13.6" height="13.6" rx="4.5" ry="4.5" style="animation:${DURATION}ms linear infinite;animation-name:head"/>`,
  );

  return body.join("");
}

function renderSvg(theme) {
  const points = expandPath(pathPoints);
  const events = selectFoodEvents(foodEvents(points));
  const totalSegments = MAX_LENGTH;
  const style = buildStyle(theme, points, events, totalSegments);
  const cells = renderCells(events);
  const snake = renderSnake(totalSegments);
  const progressY = ROWS * CELL + 32;

  return [
    `<svg viewBox="-16 -32 ${WIDTH + 32} ${HEIGHT}" width="${WIDTH + 32}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg" role="img" aria-labelledby="title desc">`,
    `<title id="title">Growing GitHub contribution snake</title>`,
    `<desc id="desc">A snake eats highlighted contribution cells and grows longer as it crosses the grid.</desc>`,
    `<style>${style}</style>`,
    `<rect width="${WIDTH + 32}" height="${HEIGHT}" x="-16" y="-32" fill="var(--bg)"/>`,
    cells,
    snake,
    `<rect x="0" y="${progressY}" width="${COLS * CELL}" height="12" rx="6" fill="var(--empty)" stroke="var(--stroke)"/>`,
    `<rect x="0" y="${progressY}" width="${COLS * CELL}" height="12" rx="6" fill="var(--head)" opacity=".72" style="transform-origin:0 ${progressY}px;animation:foodProgress ${DURATION}ms ease-in-out infinite">`,
    `</rect>`,
    `</svg>`,
  ].join("");
}

fs.mkdirSync(OUT_DIR, { recursive: true });

for (const theme of Object.values(themes)) {
  fs.writeFileSync(path.join(OUT_DIR, theme.file), renderSvg(theme));
}
