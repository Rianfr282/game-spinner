/* ============ DATA (single source of truth) ============ */
// Library of all objects that can be put on the wheel.
// Add new objects here (and a matching #icon-ID symbol in index.html).
const LIBRARY = [
  { id: "book", label: "book" },
  { id: "eraser", label: "eraser" },
  { id: "pen", label: "pen" },
  { id: "pencilcase", label: "pencil case" },
  { id: "notebook", label: "notebook" },
  { id: "bag", label: "bag" },
  { id: "ruler", label: "ruler" },
  { id: "pencil", label: "pencil" },
  { id: "chair", label: "chair" },
  { id: "desk", label: "desk" },
  { id: "whiteboard", label: "whiteboard" },
  { id: "clock", label: "clock" },
  { id: "door", label: "door" },
  { id: "window", label: "window" },
  { id: "globe", label: "globe" },
  { id: "map", label: "map" },
  { id: "crayons", label: "crayons" },
  { id: "paintbrush", label: "paintbrush" },
  { id: "scissors", label: "scissors" },
  { id: "glue", label: "glue" },
  { id: "sharpener", label: "sharpener" },
  { id: "marker", label: "marker" },
  { id: "computer", label: "computer" },
  { id: "lamp", label: "lamp" },
  { id: "trashbin", label: "trash bin" },
  { id: "waterbottle", label: "water bottle" },
  { id: "lunchbox", label: "lunch box" },
  { id: "umbrella", label: "umbrella" },
  { id: "ball", label: "ball" },
  { id: "plant", label: "plant" },
  { id: "calendar", label: "calendar" },
  { id: "folder", label: "folder" },
  { id: "headphones", label: "headphones" }
];

const DEFAULT_IDS = [
  "book", "eraser", "pen", "pencilcase",
  "notebook", "bag", "ruler", "pencil"
];

// Wheel colors always cycle, so deleting/adding items stays colorful.
const PALETTE = [
  "#F4978E", "#F8B26A", "#F9DC5C", "#B5E48C",
  "#52C9A0", "#6BB8F0", "#8E9BF0", "#B98BE0"
];

const MIN_ITEMS = 2;
const MAX_ITEMS = 14;
const STORAGE_KEY = "spinner-classroom-items";

const SVG_NS = "http://www.w3.org/2000/svg";

const wheel = document.getElementById("wheel");
const spinBtn = document.getElementById("spin-btn");
const modal = document.getElementById("modal");
const modalWord = document.getElementById("modal-word");
const modalRemaining = document.getElementById("modal-remaining");
const modalIconUse = document.querySelector("#modal-icon use");
const modalArt = document.getElementById("modal-art");
const speakBtn = document.getElementById("speak-btn");
const againBtn = document.getElementById("again-btn");
const closeBtn = document.getElementById("close-btn");

const editBtn = document.getElementById("edit-btn");
const editor = document.getElementById("editor");
const editorClose = document.getElementById("editor-close");
const activeList = document.getElementById("active-list");
const activeCount = document.getElementById("active-count");
const libraryList = document.getElementById("library-list");
const resetBtn = document.getElementById("reset-btn");
const editorStatus = document.getElementById("editor-status");

const subtitle = document.getElementById("subtitle");
const menuBtn = document.getElementById("menu-btn");
const menu = document.getElementById("menu");
const menuItems = Array.prototype.slice.call(document.querySelectorAll(".menu-item"));
const menuEdit = document.getElementById("menu-edit");
const gallery = document.getElementById("gallery");
const galleryGrid = document.getElementById("gallery-grid");
const listenBar = document.getElementById("listen-bar");
const listenWord = document.getElementById("listen-word");
const listenReplay = document.getElementById("listen-replay");
const listenNext = document.getElementById("listen-next");
const nameControls = document.getElementById("name-controls");
const imageControls = document.getElementById("image-controls");
const nameUp = document.getElementById("name-up");
const nameDown = document.getElementById("name-down");
const manualUp = document.getElementById("manual-up");
const manualDown = document.getElementById("manual-down");
const checkBtn = document.getElementById("check-btn");
const manualLabels = document.getElementById("manual-labels");
const manualInner = document.getElementById("manual-inner");
const manualHub = document.getElementById("manual-hub");
const feedback = document.getElementById("feedback");
const feedbackCard = document.getElementById("feedback-card");
const feedbackBadge = document.getElementById("feedback-badge");
const feedbackTitle = document.getElementById("feedback-title");
const feedbackNote = document.getElementById("feedback-note");
const feedbackClose = document.getElementById("feedback-close");

const reduceMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

/* ============ HELPERS ============ */
function svgEl(tag, attrs) {
  const el = document.createElementNS(SVG_NS, tag);
  for (const key in attrs) {
    el.setAttribute(key, attrs[key]);
  }
  return el;
}

function colorFor(index) {
  return PALETTE[index % PALETTE.length];
}

function findItem(id) {
  return LIBRARY.find((item) => item.id === id);
}

function getActiveItems() {
  return activeIds.map(findItem).filter(Boolean);
}

function iconSvg(id, size) {
  const svg = svgEl("svg", {
    width: size,
    height: size,
    "aria-hidden": "true"
  });
  svg.appendChild(svgEl("use", { href: "#icon-" + id }));
  return svg;
}

function trashSvg() {
  const svg = svgEl("svg", {
    width: 18,
    height: 18,
    viewBox: "0 0 24 24",
    "aria-hidden": "true",
    fill: "none",
    stroke: "currentColor",
    "stroke-width": 2,
    "stroke-linecap": "round",
    "stroke-linejoin": "round"
  });
  svg.appendChild(svgEl("path", { d: "M4 7h16" }));
  svg.appendChild(svgEl("path", { d: "M9 7V5h6v2" }));
  svg.appendChild(svgEl("path", { d: "M7 7l1 13h8l1-13" }));
  return svg;
}

// Polar to cartesian, 0 degrees = top, increasing clockwise.
function polar(cx, cy, r, deg) {
  const a = (deg * Math.PI) / 180;
  return { x: cx + r * Math.sin(a), y: cy - r * Math.cos(a) };
}

/* ============ CURVED LABELS ============ */
const LABEL_FONT_STACK =
  '"Nunito", "Quicksand", "Trebuchet MS", system-ui, sans-serif';
const labelCanvas = document.createElement("canvas");
const labelCtx = labelCanvas.getContext ? labelCanvas.getContext("2d") : null;

function measureLabelWidth(text, fontSize) {
  if (labelCtx) {
    labelCtx.font = "800 " + fontSize + "px " + LABEL_FONT_STACK;
    return labelCtx.measureText(text).width;
  }
  return text.length * fontSize * 0.6;
}

// Arc drawn left-to-right across the top of the wheel.
function makeArcPath(radius, capacity) {
  const halfRad = capacity / (2 * radius);
  const halfDeg = (halfRad * 180) / Math.PI;
  const start = polar(300, 300, radius, -halfDeg);
  const end = polar(300, 300, radius, halfDeg);
  return "M " + start.x + " " + start.y +
    " A " + radius + " " + radius + " 0 0 1 " + end.x + " " + end.y;
}

// Curved word(s): long names wrap onto a second arc below the first.
function curvedLabel(item, options) {
  const radius = options.radius;
  const fontSize = options.fontSize;
  const stepRad = options.stepRad;
  const idPrefix = options.idPrefix;
  const index = options.index;
  const lineGap = options.lineGap;
  const pad = 16;

  const group = svgEl("g", {});
  const words = item.label.split(/\s+/);
  const cap1 = Math.max(30, radius * stepRad - pad);
  const r2 = radius - lineGap;
  const cap2 = Math.max(30, r2 * stepRad - pad);

  const line1 = [];
  const line2 = [];
  words.forEach((word) => {
    if (line2.length) {
      line2.push(word);
      return;
    }
    const candidate = line1.concat(word).join(" ");
    if (line1.length && measureLabelWidth(candidate, fontSize) > cap1 * 0.88) {
      line2.push(word);
    } else {
      line1.push(word);
    }
  });

  const lines = [line1.join(" "), line2.join(" ")].filter((line) => line.length);

  lines.forEach((text, lineIndex) => {
    const r = radius - lineIndex * lineGap;
    const cap = Math.max(30, r * stepRad - pad);
    const usable = cap * 0.88;
    const naturalWidth = measureLabelWidth(text, fontSize);
    const shrunk = naturalWidth > usable;
    let size = fontSize;
    if (shrunk) {
      size = Math.max(9, (fontSize * usable) / naturalWidth);
    }

    const pathId = idPrefix + "-arc-" + index + "-" + lineIndex;
    group.appendChild(svgEl("path", {
      id: pathId,
      d: makeArcPath(r, cap),
      fill: "none"
    }));

    const label = svgEl("text", {
      "font-size": Math.round(size * 10) / 10,
      "font-weight": 800,
      fill: "#2D2D2D",
      "letter-spacing": "0.5px",
      "font-family": LABEL_FONT_STACK,
      "text-anchor": "middle",
      "dominant-baseline": "middle"
    });

    const textPath = svgEl("textPath", {
      href: "#" + pathId,
      startOffset: "50%"
    });

    if (shrunk) {
      textPath.setAttribute("textLength", Math.round(usable * 10) / 10);
      textPath.setAttribute("lengthAdjust", "spacingAndGlyphs");
    }

    textPath.textContent = text;
    label.appendChild(textPath);
    group.appendChild(label);
  });

  return group;
}

/* ============ ACTIVE ITEMS (saved in localStorage) ============ */
function sanitizeIds(ids) {
  const seen = new Set();
  const out = [];
  ids.forEach((id) => {
    if (findItem(id) && !seen.has(id)) {
      seen.add(id);
      out.push(id);
    }
  });
  return out;
}

function loadActiveIds() {
  let saved = null;
  try {
    saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
  } catch (e) {
    saved = null;
  }
  if (Array.isArray(saved)) {
    const clean = sanitizeIds(saved);
    if (clean.length >= MIN_ITEMS && clean.length <= MAX_ITEMS) {
      return clean;
    }
  }
  return DEFAULT_IDS.slice();
}

function saveActiveIds() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(activeIds));
  } catch (e) {
    // Storage may be unavailable (private mode / file://); editing still works.
  }
}

let activeIds = loadActiveIds();
let manualRotation = 0;
let labelRotation = 0;
let mode = "learn"; // "learn" | "listen" | "game" | "auto"
let innerOrder = [];

/* ============ BUILD WHEEL ============ */
function buildWheel() {
  const items = getActiveItems();
  const n = items.length;
  const step = 360 / n;
  const stepRad = (step * Math.PI) / 180;
  const cx = 300;
  const cy = 300;
  // Random and Listen share the exact same look; only the game rules differ.
  const rOuter = 290;
  const rInner = 95;

  // Content shrinks a little when more than 8 items are on the wheel.
  const fontSize = n <= 8 ? 26 : Math.max(14, Math.round((26 * 8) / n));
  const iconSize = n <= 8 ? 72 : Math.max(44, Math.round((72 * 8) / n));
  const circleR = Math.round((40 * iconSize) / 72);

  wheel.textContent = "";

  items.forEach((item, i) => {
    const center = i * step;
    const start = center - step / 2;
    const end = center + step / 2;
    const color = colorFor(i);

    const oStart = polar(cx, cy, rOuter, start);
    const oEnd = polar(cx, cy, rOuter, end);
    const iEnd = polar(cx, cy, rInner, end);
    const iStart = polar(cx, cy, rInner, start);

    const d = [
      "M " + oStart.x + " " + oStart.y,
      "A " + rOuter + " " + rOuter + " 0 0 1 " + oEnd.x + " " + oEnd.y,
      "L " + iEnd.x + " " + iEnd.y,
      "A " + rInner + " " + rInner + " 0 0 0 " + iStart.x + " " + iStart.y,
      "Z"
    ].join(" ");

    wheel.appendChild(svgEl("path", {
      d: d,
      fill: color,
      stroke: "#fff",
      "stroke-width": 3
    }));

    // Content is designed at the top position, then rotated into place.
    const content = svgEl("g", { transform: "rotate(" + center + " 300 300)" });

    content.appendChild(svgEl("circle", {
      cx: 300, cy: 150, r: circleR, fill: "#FFFFFF", opacity: 0.55
    }));

    content.appendChild(svgEl("use", {
      href: "#icon-" + item.id,
      x: 300 - iconSize / 2,
      y: 150 - iconSize / 2,
      width: iconSize,
      height: iconSize
    }));

    content.appendChild(curvedLabel(item, {
      radius: 238,
      fontSize: fontSize,
      stepRad: stepRad,
      idPrefix: "wheel",
      index: i,
      lineGap: fontSize * 1.05
    }));

    wheel.appendChild(content);
  });

  // Hub (rotates with the wheel, covers the inner edge of the wedges).
  wheel.appendChild(svgEl("circle", { cx: 300, cy: 300, r: 95, fill: "#FFFFFF" }));
  wheel.appendChild(svgEl("circle", {
    cx: 300, cy: 300, r: 95,
    fill: "none", stroke: "#2D2D2D",
    "stroke-opacity": 0.15, "stroke-width": 2
  }));

  const hubFont = '"Nunito", "Quicksand", "Trebuchet MS", system-ui, sans-serif';
  const hubLine1 = svgEl("text", {
    x: 300, y: 288,
    "text-anchor": "middle",
    "font-size": 22, "font-weight": 800,
    fill: "#2D2D2D", "font-family": hubFont
  });
  hubLine1.textContent = "Things";
  wheel.appendChild(hubLine1);

  const hubLine2 = svgEl("text", {
    x: 300, y: 310,
    "text-anchor": "middle",
    "font-size": 16, "font-weight": 700,
    fill: "#2D2D2D", "font-family": hubFont
  });
  hubLine2.textContent = "in the classroom";
  wheel.appendChild(hubLine2);

  buildManualWheel();
}

/* ============ GAME MODE WHEEL ============ */
function shuffledItems(items) {
  const copy = items.slice();
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = copy[i];
    copy[i] = copy[j];
    copy[j] = tmp;
  }
  // Never start already matching the fixed labels.
  if (copy.length > 1 && copy.every((item, i) => item.id === items[i].id)) {
    const tmp = copy[0];
    copy[0] = copy[1];
    copy[1] = tmp;
  }
  return copy;
}

function setRotation(el, deg, instant) {
  const value = "rotate(" + deg + "deg)";
  if (instant) {
    el.style.transition = "none";
    el.style.transform = value;
    void el.getBoundingClientRect();
    el.style.transition = "";
  } else {
    el.style.transform = value;
  }
}

function applyManualRotation(instant) {
  const n = Math.max(2, getActiveItems().length);
  const step = 360 / n;
  manualRotation = Math.round(manualRotation / step) * step;
  setRotation(manualInner, manualRotation, instant);
}

function applyLabelRotation(instant) {
  const n = Math.max(2, getActiveItems().length);
  const step = 360 / n;
  labelRotation = Math.round(labelRotation / step) * step;
  setRotation(manualLabels, labelRotation, instant);
}

// Outer ring: names. Inner disc: images.
// In game mode labels can be turned by the teacher, images by the student.
function buildManualWheel() {
  const items = getActiveItems();
  const n = Math.max(2, items.length);
  const step = 360 / n;
  const stepRad = (step * Math.PI) / 180;
  const rOuter = 290;
  const rInner = 205;
  const rLabel = 252;
  const rIcon = 140;

  manualLabels.textContent = "";
  manualInner.textContent = "";

  const fontSize = n <= 8 ? 30 : Math.max(16, Math.round((30 * 8) / n));

  items.forEach((item, i) => {
    const center = i * step;
    const start = center - step / 2;
    const end = center + step / 2;

    const oStart = polar(300, 300, rOuter, start);
    const oEnd = polar(300, 300, rOuter, end);
    const iEnd = polar(300, 300, rInner, end);
    const iStart = polar(300, 300, rInner, start);

    const d = [
      "M " + oStart.x + " " + oStart.y,
      "A " + rOuter + " " + rOuter + " 0 0 1 " + oEnd.x + " " + oEnd.y,
      "L " + iEnd.x + " " + iEnd.y,
      "A " + rInner + " " + rInner + " 0 0 0 " + iStart.x + " " + iStart.y,
      "Z"
    ].join(" ");

    manualLabels.appendChild(svgEl("path", {
      d: d,
      fill: colorFor(i),
      stroke: "#fff",
      "stroke-width": 3
    }));

    const labelGroup = svgEl("g", {
      transform: "rotate(" + center + " 300 300)"
    });
    labelGroup.appendChild(curvedLabel(item, {
      radius: rLabel,
      fontSize: fontSize,
      stepRad: stepRad,
      idPrefix: "manual",
      index: i,
      lineGap: fontSize * 1.05
    }));
    manualLabels.appendChild(labelGroup);
  });

  // Inner disc with shuffled images. Shuffling keeps names and pictures apart
  // so the Guess mode has something to match.
  const inner = svgEl("g", {});
  manualInner.appendChild(inner);

  inner.appendChild(svgEl("circle", {
    cx: 300, cy: 300, r: 200,
    fill: "#FFF8EC", stroke: "#E8DCC8", "stroke-width": 2
  }));

  const chord = 2 * rIcon * Math.sin(stepRad / 2) - 8;
  const circleR = Math.max(20, Math.min(42, chord / 2));
  const iconSize = Math.round(circleR * 1.6);
  innerOrder = shuffledItems(items);

  innerOrder.forEach((item, slot) => {
    const angle = slot * step;
    const position = polar(300, 300, rIcon, angle);

    inner.appendChild(svgEl("circle", {
      cx: position.x, cy: position.y, r: circleR,
      fill: "#FFF3E0", stroke: "#E8DCC8", "stroke-width": 1.5
    }));
    inner.appendChild(svgEl("use", {
      href: "#icon-" + item.id,
      x: position.x - iconSize / 2,
      y: position.y - iconSize / 2,
      width: iconSize,
      height: iconSize
    }));
  });

  // Fixed hub on top of both rings.
  manualHub.textContent = "";
  manualHub.appendChild(svgEl("circle", {
    cx: 300, cy: 300, r: 76, fill: "#FFFFFF"
  }));
  manualHub.appendChild(svgEl("circle", {
    cx: 300, cy: 300, r: 76,
    fill: "none", stroke: "#2D2D2D",
    "stroke-opacity": 0.15, "stroke-width": 2
  }));

  const hubFont = LABEL_FONT_STACK;
  const hubLine1 = svgEl("text", {
    x: 300, y: 292,
    "text-anchor": "middle",
    "font-size": 20, "font-weight": 800,
    fill: "#2D2D2D", "font-family": hubFont
  });
  hubLine1.textContent = mode === "game" ? "Guess" : "Match";
  manualHub.appendChild(hubLine1);

  const hubLine2 = svgEl("text", {
    x: 300, y: 313,
    "text-anchor": "middle",
    "font-size": 14, "font-weight": 700,
    fill: "#2D2D2D", "font-family": hubFont
  });
  hubLine2.textContent = mode === "game" ? "word & picture" : "picture & word";
  manualHub.appendChild(hubLine2);

  applyLabelRotation(true);
  applyManualRotation(true);
}

function scrambleManualWheel() {
  const n = Math.max(2, getActiveItems().length);
  const step = 360 / n;
  manualRotation = (1 + Math.floor(Math.random() * (n - 1))) * step;
  applyManualRotation(true);
}

function rotateManualWheel(direction) {
  if (mode === "auto" || mode === "learn") return;
  const step = 360 / Math.max(2, getActiveItems().length);

  if (mode === "listen") {
    // Whole wheel: name and picture move together, like Random mode.
    manualRotation += direction * step;
    setRotation(wheel, manualRotation, false);
  } else {
    manualRotation += direction * step;
    applyManualRotation(false);
  }
}

function rotateLabelWheel(direction) {
  if (mode !== "game") return;
  const step = 360 / Math.max(2, getActiveItems().length);
  labelRotation += direction * step;
  applyLabelRotation(false);
}

/* ============ SWIPE / DRAG THE WHEEL (Listen & Find) ============ */
// Students can turn the Listen wheel by dragging/touching it on phones and
// tablets. The wheel snaps to the nearest position when the finger lifts.
const wheelSvg = document.querySelector(".wheel-svg");
let dragPointerId = null;
let dragStartAngle = 0;
let dragStartRotation = 0;
let dragMoved = false;

function wheelCenterOnScreen() {
  const rect = wheelSvg.getBoundingClientRect();
  return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
}

function angleToPoint(clientX, clientY) {
  const center = wheelCenterOnScreen();
  return (Math.atan2(clientY - center.y, clientX - center.x) * 180) / Math.PI;
}

function beginWheelDrag(event) {
  if (mode !== "listen" || dragPointerId !== null) return;
  dragPointerId = event.pointerId;
  dragStartAngle = angleToPoint(event.clientX, event.clientY);
  dragStartRotation = manualRotation;
  dragMoved = false;
  wheelSvg.setPointerCapture(event.pointerId);
  wheelSvg.style.transition = "none";
}

function moveWheelDrag(event) {
  if (dragPointerId !== event.pointerId) return;
  const angle = angleToPoint(event.clientX, event.clientY);
  const delta = angle - dragStartAngle;
  if (Math.abs(delta) > 3) dragMoved = true;
  manualRotation = dragStartRotation + delta;
  setRotation(wheel, manualRotation, false);
}

function endWheelDrag(event) {
  if (dragPointerId !== event.pointerId) return;
  try {
    wheelSvg.releasePointerCapture(event.pointerId);
  } catch (e) {
    // Pointer may already be released by the browser.
  }
  dragPointerId = null;
  wheelSvg.style.transition = "transform 260ms ease";

  // Snap to the closest wedge so a picture always sits under the pointer.
  const n = Math.max(2, getActiveItems().length);
  const step = 360 / n;
  manualRotation = Math.round(manualRotation / step) * step;
  setRotation(wheel, manualRotation, false);
}

wheelSvg.addEventListener("pointerdown", beginWheelDrag);
wheelSvg.addEventListener("pointermove", moveWheelDrag);
wheelSvg.addEventListener("pointerup", endWheelDrag);
wheelSvg.addEventListener("pointercancel", endWheelDrag);

// Prevent browser panning while dragging the wheel in Listen mode.
wheelSvg.addEventListener("touchmove", (event) => {
  if (mode === "listen" && dragPointerId !== null) event.preventDefault();
}, { passive: false });

const MODES = ["learn", "listen", "game", "auto"];

const SUBTITLES = {
  auto: "Spin the wheel and say the word!",
  game: "The teacher sets the word on top. Students turn the pictures to match it, then tap Check.",
  listen: "Listen to the word, turn the wheel to bring it to the top, then tap Check.",
  learn: "Tap a picture to see its name and hear it."
};

function setMode(next) {
  mode = MODES.indexOf(next) === -1 ? "learn" : next;
  const isGame = mode === "game";
  const isListen = mode === "listen";
  const isLearn = mode === "learn";

  document.body.classList.toggle("mode-game", isGame);
  document.body.classList.toggle("mode-listen", isListen);
  document.body.classList.toggle("mode-auto", mode === "auto");
  document.body.classList.toggle("mode-learn", isLearn);
  subtitle.textContent = SUBTITLES[mode];

  menuItems.forEach((item) => {
    const isActive = item.dataset.mode === mode;
    item.classList.toggle("is-active", isActive);
    item.setAttribute("aria-checked", String(isActive));
  });

  // Guess mode lets the teacher turn words and students turn pictures.
  // Listen mode turns the whole wheel by one pair of arrows (like Random mode).
  nameControls.hidden = !isGame;
  imageControls.hidden = !(isGame || isListen);
  gallery.hidden = !isLearn;
  listenBar.hidden = !isListen;

  // Random and Listen share one solid wheel; Guess uses the split rings.
  wheel.setAttribute("display", isGame ? "none" : "inline");
  manualInner.setAttribute("display", isGame ? "inline" : "none");
  manualLabels.setAttribute("display", isGame ? "inline" : "none");
  manualHub.setAttribute("display", isGame ? "inline" : "none");

  if (isGame) {
    buildManualWheel();
    scrambleManualWheel();
  } else if (isListen) {
    // Shuffle the order each time so the answer is never in the same spot.
    activeIds = shuffledItems(getActiveItems()).map((item) => item.id);
    buildWheel();
    manualRotation = 0;
    wheel.style.transition = "transform 260ms ease";
    setRotation(wheel, manualRotation, true);
  } else if (mode === "auto") {
    buildWheel();
    wheel.style.transition = "";
    wheel.style.transform = "rotate(" + currentRotation + "deg)";
    manualRotation = 0;
  } else if (isLearn) {
    renderGallery();
  }

  if (isListen) {
    newListenRound();
  }
}

/* ============ MENU (top-left dropdown) ============ */
function openMenu() {
  menu.hidden = false;
  menuBtn.setAttribute("aria-expanded", "true");
  const first = menu.querySelector(".menu-item");
  if (first) first.focus();
}

function closeMenu(returnFocus) {
  if (menu.hidden) return;
  menu.hidden = true;
  menuBtn.setAttribute("aria-expanded", "false");
  if (returnFocus) menuBtn.focus();
}

function toggleMenu() {
  if (menu.hidden) {
    openMenu();
  } else {
    closeMenu(true);
  }
}

/* ============ LEARN MODE (gallery) ============ */
function renderGallery() {
  galleryGrid.textContent = "";

  LIBRARY.forEach((item, index) => {
    const card = document.createElement("button");
    card.type = "button";
    card.className = "gallery-card";
    card.dataset.item = item.id;
    card.setAttribute("aria-label", item.label);

    const thumb = document.createElement("span");
    thumb.className = "gallery-thumb";
    thumb.style.background = colorFor(index);
    thumb.appendChild(iconSvg(item.id, 72));

    const name = document.createElement("span");
    name.className = "gallery-name";
    name.textContent = item.label;

    card.appendChild(thumb);
    card.appendChild(name);

    if (activeIds.includes(item.id)) {
      const badge = document.createElement("span");
      badge.className = "gallery-in";
      badge.textContent = "on spinner";
      card.appendChild(badge);
    }

    card.addEventListener("click", () => openLearnCard(item, index));
    galleryGrid.appendChild(card);
  });
}

function openLearnCard(item, index) {
  speak(item.label);
  openModal(item, index, "");
}

/* ============ SPIN ============ */
let currentRotation = 0;
let isSpinning = false;

function spin() {
  if (isSpinning) return;
  isSpinning = true;
  spinBtn.disabled = true;
  editBtn.disabled = true;
  menuBtn.disabled = true;

  const items = getActiveItems();
  const n = items.length;
  const step = 360 / n;
  const k = Math.floor(Math.random() * n);
  const reduced = reduceMotionQuery.matches;
  const turns = reduced ? 1 : 5 + Math.floor(Math.random() * 3);
  const jitter = (Math.random() - 0.5) * step * 0.6;

  const base = currentRotation - (currentRotation % 360);
  let target = base + turns * 360 + ((360 - k * step) % 360) + jitter;

  const minAdvance = reduced ? 360 : 360 * 3;
  while (target <= currentRotation + minAdvance) {
    target += 360;
  }

  const duration = reduced ? 1000 : 4200;

  wheel.style.transition =
    "transform " + duration + "ms cubic-bezier(0.17, 0.67, 0.12, 0.99)";
  // Force a reflow so the transition is applied before the transform change.
  void wheel.getBoundingClientRect();
  wheel.style.transform = "rotate(" + target + "deg)";
  currentRotation = target;

  const finishedItem = items[k];
  let done = false;

  function finish() {
    if (done) return;
    done = true;
    wheel.removeEventListener("transitionend", onTransitionEnd);
    clearTimeout(fallbackTimer);
    isSpinning = false;
    spinBtn.disabled = false;
    editBtn.disabled = false;
    menuBtn.disabled = false;
    const note = removePicked(finishedItem);
    openModal(finishedItem, k, note);
  }

  function onTransitionEnd(event) {
    if (event.propertyName !== "transform") return;
    finish();
  }

  const fallbackTimer = setTimeout(finish, duration + 300);
  wheel.addEventListener("transitionend", onTransitionEnd);
}

/* ============ RESULT MODAL ============ */
// The picked object leaves the wheel, so the next spin uses what is left.
function removePicked(item) {
  const index = activeIds.indexOf(item.id);
  if (index === -1) return "";

  if (activeIds.length <= 2) {
    activeIds = DEFAULT_IDS.slice();
    saveActiveIds();
    buildWheel();
    return "Spinner refilled (" + activeIds.length + " objects).";
  }

  activeIds.splice(index, 1);
  saveActiveIds();
  buildWheel();
  return activeIds.length + " objects left on the spinner.";
}

function openModal(item, colorIndex, note) {
  const index = typeof colorIndex === "number" ? colorIndex : activeIds.indexOf(item.id);
  // "Spin again" only makes sense in Random mode.
  const showAgain = mode === "auto";
  modalWord.textContent = item.label;
  modalIconUse.setAttribute("href", "#icon-" + item.id);
  modalArt.style.background = colorFor(index < 0 ? 0 : index);
  modalRemaining.textContent = note || "";
  againBtn.hidden = !showAgain;
  closeBtn.classList.toggle("spin-btn--small", !showAgain);
  closeBtn.classList.toggle("link-btn", showAgain);
  modal.hidden = false;
  (showAgain ? againBtn : closeBtn).focus();
}

function closeModal(returnFocus) {
  if (modal.hidden) return;
  modal.hidden = true;
  if (!returnFocus) return;
  // Return focus to whatever opened the popup.
  if (mode === "learn") {
    menuBtn.focus();
  } else {
    spinBtn.focus();
  }
}

function spinAgain() {
  closeModal(false);
  spin();
}

/* ============ GAME CHECK (Guess Mode) ============ */
let audioCtx = null;

function getAudioContext() {
  const Ctx = window.AudioContext || window.webkitAudioContext;
  if (!Ctx) return null;
  if (!audioCtx) audioCtx = new Ctx();
  if (audioCtx.state === "suspended") audioCtx.resume();
  return audioCtx;
}

// Plays a list of notes; a small synth keeps the page fully offline.
function playNotes(notes, waveform) {
  const ctx = getAudioContext();
  if (!ctx) return;
  const now = ctx.currentTime;
  notes.forEach((note) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = waveform || "triangle";
    osc.frequency.setValueAtTime(note.freq, now + note.at);
    gain.gain.setValueAtTime(0.0001, now + note.at);
    gain.gain.exponentialRampToValueAtTime(0.22, now + note.at + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + note.at + note.dur);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now + note.at);
    osc.stop(now + note.at + note.dur + 0.05);
  });
}

// "Yeeeeeey" — happy rising chime.
function playCorrectSound() {
  playNotes([
    { freq: 523.25, at: 0, dur: 0.19 },
    { freq: 659.25, at: 0.14, dur: 0.19 },
    { freq: 783.99, at: 0.28, dur: 0.24 },
    { freq: 1046.5, at: 0.44, dur: 0.18 },
    { freq: 783.99, at: 0.62, dur: 0.14 },
    { freq: 1046.5, at: 0.76, dur: 0.42 }
  ], "triangle");
}

// "Ooooooo" — sliding sad trombone.
function playWrongSound() {
  const ctx = getAudioContext();
  if (!ctx) return;
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sawtooth";
  osc.frequency.setValueAtTime(360, now);
  osc.frequency.exponentialRampToValueAtTime(130, now + 0.85);
  gain.gain.setValueAtTime(0.15, now);
  gain.gain.setValueAtTime(0.15, now + 0.6);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.95);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(now);
  osc.stop(now + 1);
}

// Index of the label currently under the top pointer.
function currentLabelIndex() {
  const n = Math.max(2, getActiveItems().length);
  const step = 360 / n;
  const normalized = ((-labelRotation % 360) + 360) % 360;
  const k = Math.round(normalized / step) % n;
  return k;
}

// Index of the image currently under the top pointer.
function currentImageIndex() {
  const n = Math.max(2, getActiveItems().length);
  const step = 360 / n;
  const normalized = ((-manualRotation % 360) + 360) % 360;
  const k = Math.round(normalized / step) % n;
  return k;
}

function openFeedback(isCorrect, label, imageItem) {
  feedbackCard.classList.toggle("is-good", isCorrect);
  feedbackCard.classList.toggle("is-bad", !isCorrect);
  feedbackBadge.textContent = isCorrect ? "\u2713" : "!";
  feedbackTitle.textContent = isCorrect ? "Yeeeey, correct!" : "Ooooooo, wrong!";
  if (isCorrect) {
    feedbackNote.textContent = '"' + label + '" matches the picture.';
  } else if (mode === "listen") {
    feedbackNote.textContent = 'You heard "' + label + '", but the picture is "' + imageItem.label + '".';
  } else {
    feedbackNote.textContent = 'The word on top is "' + label + '", but the picture is "' + imageItem.label + '".';
  }
  feedback.hidden = false;
  feedbackClose.focus();
}

function closeFeedback() {
  if (feedback.hidden) return;
  feedback.hidden = true;
  checkBtn.focus();
}

// Index of the whole wheel under the top pointer (Random/Listen style wheel).
function currentWheelIndex() {
  const n = Math.max(2, getActiveItems().length);
  const step = 360 / n;
  const normalized = ((-manualRotation % 360) + 360) % 360;
  return Math.round(normalized / step) % n;
}

function checkAnswer() {
  if (mode !== "game" && mode !== "listen") return;

  const items = getActiveItems();
  const n = items.length;
  if (!n) return;

  if (mode === "listen") {
    // The wheel is one solid piece: the item under the pointer is the answer.
    const picked = items[currentWheelIndex()];
    const isCorrect = picked && listenTarget && picked.id === listenTarget.id;

    if (isCorrect) {
      playCorrectSound();
    } else {
      playWrongSound();
    }
    openFeedback(isCorrect, listenTarget ? listenTarget.label : "", picked || listenTarget);
    return;
  }

  const imageItem = innerOrder[currentImageIndex()];
  const target = items[currentLabelIndex()];
  const isCorrect = target && imageItem && target.id === imageItem.id;

  if (isCorrect) {
    playCorrectSound();
  } else {
    playWrongSound();
  }
  openFeedback(isCorrect, target ? target.label : "", imageItem || target);
}

/* ============ LISTEN MODE ============ */
let listenTarget = null;

function newListenRound() {
  const items = getActiveItems();
  if (!items.length) return;
  listenTarget = items[Math.floor(Math.random() * items.length)];
  listenWord.textContent = listenTarget.label;
  speak(listenTarget.label);
}

function repeatListenWord() {
  if (mode !== "listen" || !listenTarget) return;
  speak(listenTarget.label);
}

function nextListenRound() {
  if (mode !== "listen") return;
  // Reshuffle the wheel and start from a random position for a new puzzle.
  const n = Math.max(2, getActiveItems().length);
  activeIds = shuffledItems(getActiveItems()).map((item) => item.id);
  buildWheel();
  manualRotation = Math.floor(Math.random() * n) * (360 / n);
  setRotation(wheel, manualRotation, true);
  newListenRound();
}

/* ============ EDITOR ============ */
let statusTimer = null;

function setStatus(text) {
  clearTimeout(statusTimer);
  editorStatus.textContent = text;
  if (text) {
    statusTimer = setTimeout(() => {
      editorStatus.textContent = "";
    }, 2600);
  }
}

function focusInEditor(selector) {
  const el = editor.querySelector(selector);
  if (el) el.focus();
}

function renderEditor(focusSelector) {
  activeCount.textContent = activeIds.length;

  activeList.textContent = "";
  activeIds.forEach((id, index) => {
    const item = findItem(id);
    if (!item) return;

    const row = document.createElement("div");
    row.className = "edit-row";

    const thumb = document.createElement("span");
    thumb.className = "edit-thumb";
    thumb.style.background = colorFor(index);
    thumb.appendChild(iconSvg(item.id, 28));

    const label = document.createElement("span");
    label.className = "edit-label";
    label.textContent = item.label;

    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "remove-btn";
    remove.dataset.remove = item.id;
    remove.setAttribute("aria-label", "Remove " + item.label);
    remove.title = "Remove " + item.label;
    remove.appendChild(trashSvg());
    remove.addEventListener("click", () => removeItem(item.id));

    row.appendChild(thumb);
    row.appendChild(label);
    row.appendChild(remove);
    activeList.appendChild(row);
  });

  libraryList.textContent = "";
  LIBRARY.forEach((item) => {
    const isActive = activeIds.includes(item.id);
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "lib-item" + (isActive ? " is-active" : "");
    btn.dataset.add = item.id;
    btn.disabled = isActive;
    btn.title = isActive ? item.label + " is already on the spinner" : "Add " + item.label;
    btn.appendChild(iconSvg(item.id, 34));

    const span = document.createElement("span");
    span.textContent = item.label;
    btn.appendChild(span);

    btn.addEventListener("click", () => addItem(item.id));
    libraryList.appendChild(btn);
  });

  if (focusSelector) {
    focusInEditor(focusSelector);
  }
}

function removeItem(id) {
  if (activeIds.length <= MIN_ITEMS) {
    setStatus("Keep at least " + MIN_ITEMS + " objects on the spinner.");
    return;
  }
  activeIds = activeIds.filter((itemId) => itemId !== id);
  saveActiveIds();
  buildWheel();
  setStatus("Object removed.");
  renderEditor('[data-add="' + id + '"]');
}

function addItem(id) {
  if (activeIds.includes(id)) return;
  if (activeIds.length >= MAX_ITEMS) {
    setStatus("Keep at most " + MAX_ITEMS + " objects on the spinner.");
    return;
  }
  activeIds.push(id);
  saveActiveIds();
  buildWheel();
  setStatus("Object added.");
  renderEditor('[data-remove="' + id + '"]');
}

function openEditor() {
  if (isSpinning) return;
  setStatus("");
  renderEditor();
  editor.hidden = false;
  editorClose.focus();
}

function closeEditor(returnFocus) {
  if (editor.hidden) return;
  editor.hidden = true;
  if (returnFocus) editBtn.focus();
}

function resetEditor() {
  activeIds = DEFAULT_IDS.slice();
  saveActiveIds();
  buildWheel();
  renderEditor();
  setStatus("Back to the 8 starter objects.");
}

/* ============ SPEECH ============ */
let cachedVoices = [];

function refreshVoices() {
  if (!("speechSynthesis" in window)) return;
  cachedVoices = window.speechSynthesis.getVoices() || [];
}

// Prefer a bright, clear English voice. There is no guaranteed "child" voice
// in browsers, so we pick the closest pleasant voice and raise the pitch.
function pickEnglishVoice() {
  let voices = window.speechSynthesis.getVoices();
  if (!voices || !voices.length) voices = cachedVoices;
  if (!voices || !voices.length) return null;

  const english = voices.filter((v) => /^en/i.test(v.lang || ""));
  if (!english.length) return null;

  const preferred = [
    "child", "kid", "google us english", "samantha", "aria",
    "jenny", "zira", "karen", "ana", "female", "natural"
  ];
  for (const name of preferred) {
    const hit = english.find((v) => v.name.toLowerCase().includes(name));
    if (hit) return hit;
  }
  return english.find((v) => /^en[-_]us/i.test(v.lang)) || english[0];
}

function speak(text) {
  if (!("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "en-US";
  u.rate = 0.78;
  u.pitch = 1.4;
  const voice = pickEnglishVoice();
  if (voice) u.voice = voice;
  window.speechSynthesis.speak(u);
}

if (!("speechSynthesis" in window)) {
  speakBtn.hidden = true;
} else {
  refreshVoices();
  if (typeof window.speechSynthesis.addEventListener === "function") {
    window.speechSynthesis.addEventListener("voiceschanged", refreshVoices);
  } else {
    window.speechSynthesis.onvoiceschanged = refreshVoices;
  }
}

/* ============ EVENTS ============ */
// Block the browser's double-tap zoom on touch screens (pinch zoom is kept).
document.addEventListener("dblclick", (event) => {
  event.preventDefault();
}, { passive: false });

let lastTouchEnd = 0;
document.addEventListener("touchend", (event) => {
  const now = Date.now();
  if (now - lastTouchEnd <= 320) {
    event.preventDefault();
  }
  lastTouchEnd = now;
}, { passive: false });

spinBtn.addEventListener("click", spin);
againBtn.addEventListener("click", spinAgain);
closeBtn.addEventListener("click", () => closeModal(true));

speakBtn.addEventListener("click", () => speak(modalWord.textContent));

modal.addEventListener("click", (event) => {
  if (event.target === modal) closeModal(true);
});

menuBtn.addEventListener("click", (event) => {
  event.stopPropagation();
  toggleMenu();
});

menu.addEventListener("click", (event) => {
  const button = event.target.closest(".menu-item");
  if (!button) return;

  if (button.dataset.mode) {
    setMode(button.dataset.mode);
  } else if (button === menuEdit) {
    closeMenu(false);
    openEditor();
    return;
  }
  closeMenu(false);
});

document.addEventListener("click", (event) => {
  if (!menu.hidden && !event.target.closest(".topbar")) closeMenu(false);
});

// Edit stays reachable from the menu; the floating button is a hidden fallback.
editBtn.addEventListener("click", openEditor);
editorClose.addEventListener("click", () => closeEditor(true));
resetBtn.addEventListener("click", resetEditor);

nameUp.addEventListener("click", () => rotateLabelWheel(-1));
nameDown.addEventListener("click", () => rotateLabelWheel(1));
manualUp.addEventListener("click", () => rotateManualWheel(-1));
manualDown.addEventListener("click", () => rotateManualWheel(1));
checkBtn.addEventListener("click", checkAnswer);
feedbackClose.addEventListener("click", closeFeedback);
listenReplay.addEventListener("click", repeatListenWord);
listenNext.addEventListener("click", nextListenRound);

feedback.addEventListener("click", (event) => {
  if (event.target === feedback) closeFeedback();
});

editor.addEventListener("click", (event) => {
  if (event.target === editor) closeEditor(true);
});

document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") return;
  if (!editor.hidden) {
    closeEditor(true);
  } else if (!modal.hidden) {
    closeModal(true);
  } else if (!menu.hidden) {
    closeMenu(true);
  }
});

// Built once on load; runs after the DOM because the script is deferred.
buildWheel();
setMode("learn");
