(() => {
  const DESIGN_WIDTH = 1821;
  const DESIGN_HEIGHT = 1024;
  const MANUAL_DISTANCE_THRESHOLD = 24;
  const BRUSH_WIDTH_RATIO = 1.6;
  const BRUSH_SPACING_RATIO = 0.4;
  const PAINT_BRUSH_RADIUS = 64;
  const ACT_ONE_ROOT = "output/assets/ai-opening/act-01";
  const ACT_TWO_ROOT = "output/assets/ai-opening/act-02";
  const ACT_ONE_ASSETS = {
    canvas: `${ACT_ONE_ROOT}/00-canvas.webp`,
    fullSketch: `${ACT_ONE_ROOT}/01-full-sketch.webp`,
    fullColor: `${ACT_ONE_ROOT}/04-full-color.webp`,
    framed: `${ACT_ONE_ROOT}/05-framed.webp`,
    supperBackground: `${ACT_ONE_ROOT}/06-supper-background.webp`,
    humanHand: `${ACT_ONE_ROOT}/07-human-hand.png`,
    robotHand: `${ACT_ONE_ROOT}/08-robot-hand.png`,
    brushBroad: `${ACT_ONE_ROOT}/09-brush-broad.png`,
    brushFlat: `${ACT_ONE_ROOT}/10-brush-flat.png`,
    brushDry: `${ACT_ONE_ROOT}/11-brush-dry.png`
  };
  const ACT_TWO_ASSETS = {
    peopleLeft: `${ACT_TWO_ROOT}/01-people-left.png`,
    peopleRight: `${ACT_TWO_ROOT}/02-people-right.png`,
    peopleCenter: `${ACT_TWO_ROOT}/03-people-center.png`,
    computerLeft: `${ACT_TWO_ROOT}/04-computer-left.png`,
    computerCenter: `${ACT_TWO_ROOT}/05-computer-center.png`,
    computerRight: `${ACT_TWO_ROOT}/06-computer-right.png`,
    macWallpaper: `${ACT_TWO_ROOT}/07-macos-eden.webp`
  };

  const PANORAMA_PATHS = [
    [
      [118, 884],
      [1704, 810],
      [142, 704],
      [1692, 598],
      [154, 492],
      [1678, 382],
      [170, 270],
      [1688, 142]
    ]
  ];

  let inProgress = false;

  function start(callback) {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      callback();
      return;
    }
    if (inProgress) return;

    const overlay = document.getElementById("ai-opening-act1");
    const artboard = document.getElementById("aimeAct1Artboard");
    const baseImage = document.getElementById("aimeAct1Base");
    const inkCanvas = document.getElementById("aimeAct1InkCanvas");
    const colorCanvas = document.getElementById("aimeAct1ColorCanvas");
    const framedImage = document.getElementById("aimeAct1Framed");
    const brushTip = document.getElementById("aimeAct1BrushTip");
    const humanHand = document.getElementById("aimeAct1HumanHand");
    const robotHand = document.getElementById("aimeAct1RobotHand");
    const book = document.getElementById("aimeAct1Book");
    const turningPage = document.getElementById("aimeAct1TurningPage");
    const nextPage = document.getElementById("aimeAct1NextPage");
    const pageFront = document.getElementById("aimeAct1PageFront");
    const pageBack = document.getElementById("aimeAct1PageBack");
    const skipButton = document.getElementById("aimeAct1Skip");
    const label = document.getElementById("aimeAct1Label");
    const hint = document.getElementById("aimeAct1Hint");
    const status = document.getElementById("aimeAct1Status");
    const actTwoScene = document.getElementById("aimeAct2Scene");
    const actTwoCamera = document.getElementById("aimeAct2Camera");
    const actTwoBackground = document.getElementById("aimeAct2Background");
    const peopleLeft = document.getElementById("aimeAct2PeopleLeft");
    const peopleRight = document.getElementById("aimeAct2PeopleRight");
    const peopleCenter = document.getElementById("aimeAct2PeopleCenter");
    const computerLeft = document.getElementById("aimeAct2ComputerLeft");
    const computerCenter = document.getElementById("aimeAct2ComputerCenter");
    const computerRight = document.getElementById("aimeAct2ComputerRight");
    const macScene = document.getElementById("aimeMacScene");
    const macViewport = document.getElementById("aimeMacViewport");
    const macNotification = document.getElementById("aimeMacNotification");
    const macNewsWindow = document.getElementById("aimeMacNewsWindow");
    const macTargetWord = document.getElementById("aimeMacTargetWord");
    const macTooltip = document.getElementById("aimeMacTooltip");
    const macCursor = document.getElementById("aimeMacCursor");
    const macCloseControl = document.getElementById("aimeMacCloseControl");

    if (
      !overlay || !artboard || !baseImage || !inkCanvas || !colorCanvas ||
      !framedImage || !brushTip || !humanHand || !robotHand || !book ||
      !turningPage || !nextPage ||
      !pageFront || !pageBack || !skipButton || !label || !hint || !status ||
      !actTwoScene || !actTwoCamera || !actTwoBackground || !peopleLeft ||
      !peopleRight || !peopleCenter || !computerLeft || !computerCenter ||
      !computerRight || !macScene || !macViewport || !macNotification ||
      !macNewsWindow || !macTargetWord || !macTooltip || !macCursor ||
      !macCloseControl
    ) {
      callback();
      return;
    }

    const inkContext = inkCanvas.getContext("2d");
    const colorContext = colorCanvas.getContext("2d");
    if (!inkContext || !colorContext) {
      callback();
      return;
    }

    inProgress = true;
    const controller = new AbortController();
    const pendingTimers = new Map();
    const previousBodyOverflow = document.body.style.overflow;
    const lineMask = createCanvas();
    const colorMask = createCanvas();
    const lineMaskContext = lineMask.getContext("2d");
    const colorMaskContext = colorMask.getContext("2d");
    const brushStamps = [];
    let phase = "preload";
    let finished = false;
    let callbackUsed = false;
    let imageMap = null;
    let currentPaint = null;
    let pointerSession = null;
    let pendingColorRender = false;
    let pageTurning = false;
    let currentPageAngle = 0;
    let wheelDistance = 0;
    let wheelResetTimer = null;
    let actTwoLoadPromise = null;
    let collageBeatActive = false;
    let collageBeatTilted = false;

    if (!lineMaskContext || !colorMaskContext) {
      inProgress = false;
      callback();
      return;
    }

    function createCanvas() {
      const canvas = document.createElement("canvas");
      canvas.width = DESIGN_WIDTH;
      canvas.height = DESIGN_HEIGHT;
      return canvas;
    }

    function seededRandom(seed) {
      let value = seed >>> 0;
      return () => {
        value += 0x6D2B79F5;
        let result = value;
        result = Math.imul(result ^ (result >>> 15), result | 1);
        result ^= result + Math.imul(result ^ (result >>> 7), result | 61);
        return ((result ^ (result >>> 14)) >>> 0) / 4294967296;
      };
    }

    function wait(delay) {
      return new Promise((resolve) => {
        const timer = window.setTimeout(() => {
          pendingTimers.delete(timer);
          resolve();
        }, delay);
        pendingTimers.set(timer, resolve);
      });
    }

    function releaseTimers() {
      pendingTimers.forEach((resolve, timer) => {
        window.clearTimeout(timer);
        resolve();
      });
      pendingTimers.clear();
      window.clearTimeout(wheelResetTimer);
    }

    function useCallback() {
      if (callbackUsed) return;
      callbackUsed = true;
      callback();
    }

    function setPhase(nextPhase, options = {}) {
      phase = nextPhase;
      overlay.dataset.phase = nextPhase;
      label.textContent = options.label || "Act I · The Creation of Adam";
      status.textContent = options.status || "";
      if (typeof options.hint === "string") hint.textContent = options.hint;
      overlay.classList.toggle("is-waiting", Boolean(options.waiting));
      overlay.classList.toggle("is-macos", nextPhase.startsWith("macos-"));
      artboard.classList.toggle("is-paintable", Boolean(options.paintable));
      artboard.setAttribute("aria-label", options.ariaLabel || "AI 与我开场动画");
    }

    function clearCanvas(canvasContext) {
      canvasContext.clearRect(0, 0, DESIGN_WIDTH, DESIGN_HEIGHT);
      canvasContext.globalAlpha = 1;
      canvasContext.globalCompositeOperation = "source-over";
    }

    function clearMasksAndLayers() {
      clearCanvas(inkContext);
      clearCanvas(colorContext);
      clearCanvas(lineMaskContext);
      clearCanvas(colorMaskContext);
    }

    function renderMasked(outputContext, sourceImage, maskCanvas) {
      clearCanvas(outputContext);
      outputContext.drawImage(sourceImage, 0, 0, DESIGN_WIDTH, DESIGN_HEIGHT);
      outputContext.globalCompositeOperation = "destination-in";
      outputContext.drawImage(maskCanvas, 0, 0, DESIGN_WIDTH, DESIGN_HEIGHT);
      outputContext.globalCompositeOperation = "source-over";
    }

    function queueColorRender() {
      if (pendingColorRender || !currentPaint || finished) return;
      pendingColorRender = true;
      window.requestAnimationFrame(() => {
        pendingColorRender = false;
        if (!currentPaint || finished) return;
        renderMasked(colorContext, currentPaint.image, colorMask);
      });
    }

    function pickStamp(variant) {
      const count = brushStamps.length;
      return brushStamps[((variant % count) + count) % count];
    }

    // radius 决定笔锋宽度，笔痕长度由纹理自身比例撑开，落笔方向即纹理的水平轴。
    function stampAt(maskContext, x, y, radius, opacity = 1, angle = 0, variant = 0) {
      const stamp = pickStamp(variant);
      const height = radius * BRUSH_WIDTH_RATIO;
      const width = height * (stamp.naturalWidth / stamp.naturalHeight);
      maskContext.save();
      maskContext.globalAlpha = opacity;
      maskContext.translate(x, y);
      maskContext.rotate(angle);
      maskContext.drawImage(stamp, -width / 2, -height / 2, width, height);
      maskContext.restore();
    }

    function createStroke(variant, opacity) {
      return { variant, opacity, angle: 0, point: null, leftover: 0, index: 0 };
    }

    // 沿路径按固定间距落笔，间距取笔痕长度的一小段；密集补点会把飞白叠成实心色块。
    function strokeTo(maskContext, stroke, to, radius) {
      if (!stroke.point) {
        stampAt(maskContext, to.x, to.y, radius, stroke.opacity, stroke.angle, stroke.variant);
        stroke.point = to;
        return;
      }
      const from = stroke.point;
      const deltaX = to.x - from.x;
      const deltaY = to.y - from.y;
      const distance = Math.hypot(deltaX, deltaY);
      if (distance > 2) stroke.angle = Math.atan2(deltaY, deltaX);
      const stamp = pickStamp(stroke.variant);
      const spacing = radius * BRUSH_WIDTH_RATIO * (stamp.naturalWidth / stamp.naturalHeight) * BRUSH_SPACING_RATIO;
      let travelled = spacing - stroke.leftover;
      while (travelled <= distance) {
        const ratio = travelled / distance;
        stroke.index += 1;
        const drift = (Math.random() - 0.5) * radius * 0.2;
        stampAt(
          maskContext,
          from.x + deltaX * ratio - Math.sin(stroke.angle) * drift,
          from.y + deltaY * ratio + Math.cos(stroke.angle) * drift,
          radius,
          stroke.opacity,
          stroke.angle + (Math.random() - 0.5) * 0.09,
          stroke.variant + stroke.index
        );
        travelled += spacing;
      }
      stroke.leftover = distance - (travelled - spacing);
      stroke.point = to;
    }

    function mapPointer(event) {
      const rect = artboard.getBoundingClientRect();
      return {
        x: Math.max(0, Math.min(DESIGN_WIDTH, (event.clientX - rect.left) * DESIGN_WIDTH / rect.width)),
        y: Math.max(0, Math.min(DESIGN_HEIGHT, (event.clientY - rect.top) * DESIGN_HEIGHT / rect.height))
      };
    }

    function moveBrushTip(point, coloring = false) {
      brushTip.style.left = `${point.x / DESIGN_WIDTH * 100}%`;
      brushTip.style.top = `${point.y / DESIGN_HEIGHT * 100}%`;
      brushTip.classList.toggle("is-coloring", coloring);
      brushTip.classList.add("is-visible");
    }

    function hideBrushTip() {
      brushTip.classList.remove("is-visible", "is-coloring");
    }

    function mirrorPoint(point) {
      return {
        x: DESIGN_WIDTH - point.x,
        y: DESIGN_HEIGHT - point.y
      };
    }

    function movePaintHands(point) {
      const robotPoint = mirrorPoint(point);
      humanHand.style.left = `${point.x / DESIGN_WIDTH * 100}%`;
      humanHand.style.top = `${point.y / DESIGN_HEIGHT * 100}%`;
      robotHand.style.left = `${robotPoint.x / DESIGN_WIDTH * 100}%`;
      robotHand.style.top = `${robotPoint.y / DESIGN_HEIGHT * 100}%`;
      humanHand.classList.add("is-visible");
      robotHand.classList.add("is-visible");
      artboard.classList.add("is-hands-active");
    }

    function hidePaintHands() {
      humanHand.classList.remove("is-visible");
      robotHand.classList.remove("is-visible");
      artboard.classList.remove("is-hands-active");
    }

    function samplePaths(paths, stepSize, seed) {
      const random = seededRandom(seed);
      const points = [];
      let strokeIndex = 0;
      paths.forEach((path, pathIndex) => {
        for (let segment = 1; segment < path.length; segment += 1) {
          const from = path[segment - 1];
          const to = path[segment];
          const distance = Math.hypot(to[0] - from[0], to[1] - from[1]);
          const angle = Math.atan2(to[1] - from[1], to[0] - from[0]);
          const steps = Math.max(1, Math.ceil(distance / stepSize));
          for (let step = 0; step <= steps; step += 1) {
            const ratio = step / steps;
            points.push({
              x: from[0] + (to[0] - from[0]) * ratio + (random() - 0.5) * 7,
              y: from[1] + (to[1] - from[1]) * ratio + (random() - 0.5) * 7,
              pathIndex,
              strokeIndex,
              angle
            });
          }
          strokeIndex += 1;
        }
      });
      return points;
    }

    function createCoveragePoints(seedPoint, seed) {
      const random = seededRandom(seed);
      const points = [];
      const spacing = 108;
      for (let y = -spacing / 2; y <= DESIGN_HEIGHT + spacing / 2; y += spacing) {
        for (let x = -spacing / 2; x <= DESIGN_WIDTH + spacing / 2; x += spacing) {
          const point = {
            x: x + (random() - 0.5) * 52,
            y: y + (random() - 0.5) * 52,
            radius: 96 + random() * 46,
            angle: (random() - 0.5) * 0.9,
            variant: Math.floor(random() * 3)
          };
          point.order = Math.hypot(point.x - seedPoint.x, point.y - seedPoint.y) + random() * 260;
          points.push(point);
        }
      }
      points.sort((first, second) => first.order - second.order);
      return points;
    }

    function easeInOutCubic(value) {
      return value < 0.5
        ? 4 * value * value * value
        : 1 - Math.pow(-2 * value + 2, 3) / 2;
    }

    function easeOutCubic(value) {
      return 1 - Math.pow(1 - value, 3);
    }

    function animate(duration, update) {
      return new Promise((resolve) => {
        const startedAt = performance.now();
        let lastPaintAt = 0;
        const frame = (now) => {
          if (finished) {
            resolve();
            return;
          }
          const progress = Math.min(1, (now - startedAt) / duration);
          if (now - lastPaintAt >= 30 || progress === 1) {
            lastPaintAt = now;
            update(progress);
          }
          if (progress < 1) {
            window.requestAnimationFrame(frame);
          } else {
            resolve();
          }
        };
        window.requestAnimationFrame(frame);
      });
    }

    async function runPanoramaReveal(sourceImage, duration, completionDuration, seed) {
      setPhase("panorama-sketch", {
        label: "Act I · The Creation in Lines",
        status: "画笔正在从左下向右上绘制全景素描"
      });
      clearCanvas(lineMaskContext);
      clearCanvas(inkContext);
      const sampledPoints = samplePaths(PANORAMA_PATHS, 14, seed);
      const firstPoint = sampledPoints[0] || { x: DESIGN_WIDTH / 2, y: DESIGN_HEIGHT / 2 };
      let paintedPathCount = 0;
      let sweep = null;
      moveBrushTip(firstPoint);

      await animate(duration, (progress) => {
        const targetPathCount = Math.floor(easeInOutCubic(progress) * sampledPoints.length);
        while (paintedPathCount < targetPathCount) {
          const point = sampledPoints[paintedPathCount];
          const radius = 49 + (paintedPathCount % 9) * 1.45;
          if (!sweep || sweep.variant !== point.strokeIndex) {
            sweep = createStroke(point.strokeIndex, 0.84);
            sweep.angle = point.angle;
          }
          strokeTo(lineMaskContext, sweep, point, radius);
          paintedPathCount += 1;
        }

        const tipPoint = sampledPoints[Math.max(0, Math.min(sampledPoints.length - 1, paintedPathCount - 1))];
        if (tipPoint) moveBrushTip(tipPoint);
        renderMasked(inkContext, sourceImage, lineMask);
      });

      if (finished) return;
      const lastPoint = sampledPoints[sampledPoints.length - 1] || firstPoint;
      const coveragePoints = createCoveragePoints(lastPoint, seed + 131);
      let paintedCoverageCount = 0;
      setPhase("panorama-sketch-autofill", {
        label: "Act I · The Creation in Lines",
        status: "正在自动补全全景素描"
      });
      await animate(completionDuration, (progress) => {
        const targetCoverageCount = Math.floor(easeOutCubic(progress) * coveragePoints.length);
        while (paintedCoverageCount < targetCoverageCount) {
          const point = coveragePoints[paintedCoverageCount];
          stampAt(lineMaskContext, point.x, point.y, point.radius, 0.92, point.angle, point.variant);
          paintedCoverageCount += 1;
        }
        const tipPoint = coveragePoints[Math.max(0, paintedCoverageCount - 1)];
        if (tipPoint) moveBrushTip(tipPoint);
        renderMasked(inkContext, sourceImage, lineMask);
      });

      lineMaskContext.fillStyle = "#fff";
      lineMaskContext.fillRect(0, 0, DESIGN_WIDTH, DESIGN_HEIGHT);
      renderMasked(inkContext, sourceImage, lineMask);
      baseImage.src = sourceImage.src;
      if (baseImage.decode) await baseImage.decode().catch(() => {});
      clearCanvas(inkContext);
      clearCanvas(lineMaskContext);
      hideBrushTip();
    }

    function createAutoFillPoints(seedPoints, seed) {
      const random = seededRandom(seed);
      const points = [];
      const spacing = 104;
      for (let y = -spacing / 2; y <= DESIGN_HEIGHT + spacing / 2; y += spacing) {
        for (let x = -spacing / 2; x <= DESIGN_WIDTH + spacing / 2; x += spacing) {
          const point = {
            x: x + (random() - 0.5) * 62,
            y: y + (random() - 0.5) * 62,
            radius: 104 + random() * 56,
            angle: (random() - 0.5) * 0.9,
            variant: Math.floor(random() * 3)
          };
          point.order = Math.min(...seedPoints.map((seedPoint) => Math.hypot(
            (point.x - seedPoint.x) * 0.9,
            (point.y - seedPoint.y) * 1.08
          ))) + random() * 250;
          points.push(point);
        }
      }
      points.sort((first, second) => first.order - second.order);
      return points;
    }

    async function runAutoFill(paint) {
      const points = createAutoFillPoints([paint.lastPoint, paint.mirrorPoint], paint.seed);
      let paintedCount = 0;
      await animate(paint.duration, (progress) => {
        const targetCount = Math.floor(easeOutCubic(progress) * points.length);
        while (paintedCount < targetCount) {
          const point = points[paintedCount];
          stampAt(colorMaskContext, point.x, point.y, point.radius, 0.94, point.angle, point.variant);
          paintedCount += 1;
        }
        renderMasked(colorContext, paint.image, colorMask);
      });
      colorMaskContext.fillStyle = "#fff";
      colorMaskContext.fillRect(0, 0, DESIGN_WIDTH, DESIGN_HEIGHT);
      renderMasked(colorContext, paint.image, colorMask);
    }

    function showCollaborativePaintWait(statusText = "等待用户与 AI 协作上色") {
      setPhase("collaborative-paint-wait", {
        label: "Act I · Human × AI Colour Study",
        status: statusText,
        hint: "按住并拖动\n与 AI 一起为亚当上色",
        waiting: true,
        paintable: true,
        ariaLabel: "按住并拖动，与 AI 一起完成画作上色"
      });
    }

    function prepareCollaborativePaint() {
      clearCanvas(colorMaskContext);
      clearCanvas(colorContext);
      return new Promise((resolve) => {
        const lastPoint = { x: 370, y: 610 };
        currentPaint = {
          kind: "collaborative",
          image: imageMap.fullColor,
          duration: 2400,
          seed: 8101,
          lastPoint,
          mirrorPoint: mirrorPoint(lastPoint),
          totalDistance: 0,
          completing: false,
          resolve
        };
        showCollaborativePaintWait();
        artboard.focus({ preventScroll: true });
      });
    }

    async function completeCurrentPaint() {
      const paint = currentPaint;
      if (!paint || paint.completing || finished) return;
      paint.completing = true;
      hidePaintHands();
      setPhase("collaborative-autofill", {
        label: "Act I · Human × AI Colour Study",
        status: "正在从两端自动补全画作上色"
      });
      await runAutoFill(paint);
      if (finished) return;

      baseImage.src = paint.image.src;
      clearCanvas(inkContext);
      clearCanvas(colorContext);
      clearCanvas(lineMaskContext);
      clearCanvas(colorMaskContext);
      const resolve = paint.resolve;
      currentPaint = null;
      resolve();
    }

    function onPointerDown(event) {
      if (event.button !== undefined && event.button !== 0) return;
      if (phase === "collaborative-paint-wait") {
        if (!currentPaint || currentPaint.completing) return;
        event.preventDefault();
        const point = mapPointer(event);
        const reflectedPoint = mirrorPoint(point);
        pointerSession = {
          mode: "paint",
          pointerId: event.pointerId,
          lastPoint: point,
          lastClientX: event.clientX,
          lastClientY: event.clientY,
          humanStroke: createStroke(Math.floor(Math.random() * brushStamps.length), 0.82),
          robotStroke: createStroke(Math.floor(Math.random() * brushStamps.length), 0.82)
        };
        pointerSession.robotStroke.angle = Math.PI;
        currentPaint.lastPoint = point;
        currentPaint.mirrorPoint = reflectedPoint;
        strokeTo(colorMaskContext, pointerSession.humanStroke, point, PAINT_BRUSH_RADIUS);
        strokeTo(colorMaskContext, pointerSession.robotStroke, reflectedPoint, PAINT_BRUSH_RADIUS);
        queueColorRender();
        movePaintHands(point);
        setPhase("collaborative-painting", {
          label: "Act I · Human × AI Colour Study",
          status: "人手与机械手正在同步上色",
          paintable: true,
          ariaLabel: "正在与 AI 一起完成画作上色"
        });
        artboard.setPointerCapture?.(event.pointerId);
        return;
      }

      if (phase === "page-wait" && !pageTurning) {
        event.preventDefault();
        const rect = artboard.getBoundingClientRect();
        pointerSession = {
          mode: "page",
          pointerId: event.pointerId,
          startX: event.clientX,
          startY: event.clientY,
          lastX: event.clientX,
          lastTime: performance.now(),
          startedAt: performance.now(),
          startedOnRight: event.clientX - rect.left >= rect.width * 0.5,
          dragging: false,
          rectWidth: rect.width
        };
        artboard.setPointerCapture?.(event.pointerId);
      }
    }

    function onPointerMove(event) {
      if (!pointerSession || pointerSession.pointerId !== event.pointerId) return;
      if (pointerSession.mode === "paint" && currentPaint && !currentPaint.completing) {
        event.preventDefault();
        const point = mapPointer(event);
        const reflectedPoint = mirrorPoint(point);
        const cssDistance = Math.hypot(
          event.clientX - pointerSession.lastClientX,
          event.clientY - pointerSession.lastClientY
        );
        currentPaint.totalDistance += cssDistance;
        strokeTo(colorMaskContext, pointerSession.humanStroke, point, PAINT_BRUSH_RADIUS);
        strokeTo(colorMaskContext, pointerSession.robotStroke, reflectedPoint, PAINT_BRUSH_RADIUS);
        pointerSession.lastPoint = point;
        pointerSession.lastClientX = event.clientX;
        pointerSession.lastClientY = event.clientY;
        currentPaint.lastPoint = point;
        currentPaint.mirrorPoint = reflectedPoint;
        queueColorRender();
        movePaintHands(point);
        return;
      }

      if (pointerSession.mode === "page" && phase === "page-wait" && !pageTurning) {
        const deltaX = event.clientX - pointerSession.startX;
        const deltaY = event.clientY - pointerSession.startY;
        if (!pointerSession.dragging && deltaX < -7 && Math.abs(deltaX) > Math.abs(deltaY) * 1.15) {
          pointerSession.dragging = true;
        }
        if (!pointerSession.dragging) return;
        event.preventDefault();
        const progress = Math.max(0, Math.min(1, -deltaX / (pointerSession.rectWidth * 0.65)));
        setPageAngle(-180 * progress);
        pointerSession.lastX = event.clientX;
        pointerSession.lastTime = performance.now();
      }
    }

    function onPointerEnd(event) {
      if (!pointerSession || pointerSession.pointerId !== event.pointerId) return;
      const session = pointerSession;
      pointerSession = null;
      artboard.releasePointerCapture?.(event.pointerId);
      hideBrushTip();
      hidePaintHands();

      if (session.mode === "paint" && currentPaint && !currentPaint.completing) {
        if (event.type === "pointercancel") {
          showCollaborativePaintWait("绘制已暂停，请重新按住并拖动画面");
          return;
        }
        if (currentPaint.totalDistance >= MANUAL_DISTANCE_THRESHOLD) {
          completeCurrentPaint();
        } else {
          showCollaborativePaintWait("再画一小段，松手后将从两端自动补全");
        }
        return;
      }

      if (session.mode === "page" && phase === "page-wait" && !pageTurning) {
        if (event.type === "pointercancel") {
          animatePageAngle(currentPageAngle, 0, 360);
          return;
        }
        const deltaX = event.clientX - session.startX;
        const elapsed = Math.max(1, performance.now() - session.startedAt);
        const velocity = -deltaX / elapsed;
        const distanceRatio = -deltaX / session.rectWidth;
        const isClick = Math.abs(deltaX) < 8 && Math.abs(event.clientY - session.startY) < 8;
        const shouldComplete =
          (isClick && session.startedOnRight) ||
          distanceRatio >= 0.18 ||
          velocity >= 0.55;
        if (shouldComplete) {
          completePageTurn();
        } else {
          animatePageAngle(currentPageAngle, 0, 360);
        }
      }
    }

    function onKeyDown(event) {
      if (event.key === "Escape") {
        event.preventDefault();
        exitAnimation();
        return;
      }
      if (event.key !== "Enter" && event.key !== " ") return;
      if (phase === "collaborative-paint-wait") {
        event.preventDefault();
        if (!currentPaint || currentPaint.completing) return;
        stampAt(colorMaskContext, currentPaint.lastPoint.x, currentPaint.lastPoint.y, PAINT_BRUSH_RADIUS, 0.96, 0, 0);
        stampAt(
          colorMaskContext,
          currentPaint.mirrorPoint.x,
          currentPaint.mirrorPoint.y,
          PAINT_BRUSH_RADIUS,
          0.96,
          Math.PI,
          1
        );
        queueColorRender();
        completeCurrentPaint();
      } else if (phase === "page-wait") {
        event.preventDefault();
        completePageTurn();
      }
    }

    function onWheel(event) {
      if (phase !== "page-wait" || pageTurning) return;
      if (Math.abs(event.deltaX) <= Math.abs(event.deltaY) || event.deltaX <= 0) return;
      event.preventDefault();
      wheelDistance += event.deltaX;
      window.clearTimeout(wheelResetTimer);
      wheelResetTimer = window.setTimeout(() => {
        wheelDistance = 0;
      }, 160);
      if (wheelDistance >= 70) {
        wheelDistance = 0;
        completePageTurn();
      }
    }

    function setPageAngle(angle) {
      currentPageAngle = Math.max(-180, Math.min(0, angle));
      turningPage.style.transform = `rotateY(${currentPageAngle}deg)`;
      const shadow = Math.sin(Math.abs(currentPageAngle) * Math.PI / 180) * 0.68;
      turningPage.style.setProperty("--page-shadow", String(Math.max(0, shadow)));
    }

    function animatePageAngle(from, to, duration) {
      return animate(duration, (progress) => {
        const eased = easeInOutCubic(progress);
        setPageAngle(from + (to - from) * eased);
      });
    }

    function setPieceVisible(piece) {
      piece.classList.add("is-visible");
    }

    async function runCollageBeat() {
      collageBeatActive = true;
      collageBeatTilted = false;
      actTwoCamera.classList.remove("is-tilted");
      while (collageBeatActive && !finished) {
        await wait(500);
        if (!collageBeatActive || finished) return;
        collageBeatTilted = !collageBeatTilted;
        actTwoCamera.classList.toggle("is-tilted", collageBeatTilted);
      }
    }

    async function moveMacCursorTo(target, duration, xRatio = 0.5, yRatio = 0.5) {
      const viewportRect = macViewport.getBoundingClientRect();
      const targetRect = target.getBoundingClientRect();
      const x = targetRect.left - viewportRect.left + targetRect.width * xRatio;
      const y = targetRect.top - viewportRect.top + targetRect.height * yRatio;
      macCursor.style.setProperty("--cursor-duration", `${duration}ms`);
      macCursor.style.left = `${x / viewportRect.width * 100}%`;
      macCursor.style.top = `${y / viewportRect.height * 100}%`;
      await wait(duration);
    }

    async function pulseMacCursor(times = 1) {
      for (let index = 0; index < times; index += 1) {
        if (finished) return;
        macCursor.classList.add("is-pressing");
        await wait(110);
        macCursor.classList.remove("is-pressing");
        if (index < times - 1) await wait(100);
      }
    }

    async function scrambleMacWord() {
      const glyphs = "あいうえおかきくけこサシスセソ0123456789";
      await animate(1000, (progress) => {
        const step = Math.floor(progress * 38);
        macTargetWord.textContent =
          glyphs[(step * 7) % glyphs.length] +
          glyphs[(step * 11 + 5) % glyphs.length];
      });
      if (finished) return;
      macTargetWord.textContent = "录用";
      macTargetWord.classList.add("is-hired");
    }

    function positionMacTooltip() {
      const viewportRect = macViewport.getBoundingClientRect();
      const wordRect = macTargetWord.getBoundingClientRect();
      const tooltipWidth = macTooltip.offsetWidth || 260;
      const tooltipHeight = macTooltip.offsetHeight || 52;
      const desiredLeft = wordRect.left - viewportRect.left - 10;
      const desiredTop = wordRect.top - viewportRect.top - tooltipHeight - 12;
      const left = Math.max(10, Math.min(viewportRect.width - tooltipWidth - 10, desiredLeft));
      const top = Math.max(10, Math.min(viewportRect.height - tooltipHeight - 10, desiredTop));
      macTooltip.style.left = `${left}px`;
      macTooltip.style.top = `${top}px`;
    }

    async function runMacOSScene() {
      setPhase("macos-desktop", {
        label: "Scene III · AI Daily Digest",
        status: "正在进入 macOS 新闻日报",
        ariaLabel: "macOS 新闻日报动画"
      });
      macScene.classList.add("is-visible");
      macScene.setAttribute("aria-hidden", "false");
      await wait(20);
      if (finished) return;
      macScene.classList.add("is-revealed");
      await wait(300);
      if (finished) return;
      actTwoScene.classList.remove("is-visible", "is-zooming");
      actTwoScene.setAttribute("aria-hidden", "true");

      await wait(1000);
      if (finished) return;
      setPhase("macos-notification", {
        label: "Scene III · Daily Digest Ready",
        status: "新闻日报通知已经生成",
        ariaLabel: "macOS 新闻日报动画"
      });
      macNotification.classList.add("is-visible");

      await wait(1000);
      if (finished) return;
      await moveMacCursorTo(macNotification, 800, 0.22, 0.5);
      if (finished) return;
      await pulseMacCursor(2);
      if (finished) return;
      macNotification.classList.remove("is-visible");
      macNewsWindow.classList.add("is-visible");
      setPhase("macos-news", {
        label: "Scene III · News — Daily Digest",
        status: "新闻日报窗口已经打开",
        ariaLabel: "macOS 新闻日报动画"
      });

      await wait(800);
      if (finished) return;
      await moveMacCursorTo(macTargetWord, 1200, 0.5, 0.55);
      if (finished) return;
      await wait(500);
      if (finished) return;
      setPhase("macos-word", {
        label: "Scene III · Language Assist",
        status: "正在识别新闻中的关键词",
        ariaLabel: "macOS 新闻日报动画"
      });
      await scrambleMacWord();
      if (finished) return;
      positionMacTooltip();
      macTooltip.classList.add("is-visible");
      setPhase("macos-tooltip", {
        label: "Scene III · Language Assist",
        status: "翻译浮窗已经显示",
        ariaLabel: "macOS 新闻日报动画"
      });

      await wait(1500);
      if (finished) return;
      setPhase("macos-close", {
        label: "Scene III · Close Daily Digest",
        status: "正在关闭新闻日报",
        ariaLabel: "macOS 新闻日报动画"
      });
      await moveMacCursorTo(macCloseControl, 800, 0.5, 0.5);
      if (finished) return;
      macCursor.classList.add("is-pressing");
      await wait(120);
      if (finished) return;
      completeOpening();
    }

    async function runActTwo() {
      const preloadResult = await actTwoLoadPromise;
      if (preloadResult.error) throw preloadResult.error;
      Object.assign(imageMap, preloadResult.images);
      actTwoBackground.src = imageMap.supperBackground.src;
      peopleLeft.src = imageMap.peopleLeft.src;
      peopleRight.src = imageMap.peopleRight.src;
      peopleCenter.src = imageMap.peopleCenter.src;
      computerLeft.src = imageMap.computerLeft.src;
      computerCenter.src = imageMap.computerCenter.src;
      computerRight.src = imageMap.computerRight.src;
      macViewport.style.backgroundImage = `url("${imageMap.macWallpaper.src}")`;

      book.classList.remove("is-visible");
      book.setAttribute("aria-hidden", "true");
      actTwoScene.classList.add("is-visible");
      actTwoScene.setAttribute("aria-hidden", "false");
      setPhase("act-two-background", {
        label: "Act II · The Last Supper",
        status: "第二幕背景已经出现",
        ariaLabel: "最后的晚餐剪贴动画"
      });
      runCollageBeat();

      await wait(500);
      if (finished) return;
      setPieceVisible(peopleLeft);
      setPhase("act-two-left", {
        label: "Act II · Left Ensemble",
        status: "左侧人物已经贴入",
        ariaLabel: "最后的晚餐剪贴动画"
      });

      await wait(700);
      if (finished) return;
      setPieceVisible(peopleRight);
      setPhase("act-two-right", {
        label: "Act II · Right Ensemble",
        status: "右侧人物已经贴入",
        ariaLabel: "最后的晚餐剪贴动画"
      });

      await wait(700);
      if (finished) return;
      setPieceVisible(peopleCenter);
      setPhase("act-two-center", {
        label: "Act II · The Centre",
        status: "中间人物已经贴入",
        ariaLabel: "最后的晚餐剪贴动画"
      });

      await wait(700);
      if (finished) return;
      setPieceVisible(computerLeft);
      setPieceVisible(computerCenter);
      setPieceVisible(computerRight);
      setPhase("act-two-computers", {
        label: "Act II · A Meeting Across Time",
        status: "三台电脑已经贴入",
        ariaLabel: "最后的晚餐剪贴动画"
      });

      await wait(1500);
      if (finished) return;
      collageBeatActive = false;
      collageBeatTilted = false;
      actTwoCamera.classList.remove("is-tilted");
      actTwoScene.classList.add("is-zooming");
      setPhase("screen-zoom", {
        label: "Act II · Into the Screen",
        status: "镜头正在进入中央电脑屏幕",
        ariaLabel: "正在进入中央电脑屏幕"
      });

      await wait(800);
      if (finished) return;
      await wait(180);
      if (finished) return;
      await runMacOSScene();
    }

    async function completePageTurn() {
      if (phase !== "page-wait" || pageTurning || finished) return;
      pageTurning = true;
      setPhase("page-turn", {
        label: "Plate I · Turning the Page",
        status: "正在翻到下一页"
      });
      const remaining = Math.abs(-180 - currentPageAngle) / 180;
      await animatePageAngle(currentPageAngle, -180, Math.max(360, 900 * remaining));
      if (finished) return;
      book.classList.add("is-complete");
      turningPage.hidden = true;
      pageTurning = false;
      try {
        await runActTwo();
      } catch (error) {
        console.error("AI opening act two failed", error);
        status.textContent = "第二幕素材加载失败，正在进入正文";
        exitAnimation();
      }
    }

    async function frameArtwork() {
      setPhase("framing", {
        label: "Act I · The Creation of Adam",
        status: "画作正在装裱"
      });
      await wait(600);
      if (finished) return;
      artboard.classList.add("is-framing");
      await wait(1800);
      if (finished) return;
      baseImage.src = imageMap.framed.src;
      artboard.classList.remove("is-framing");
      book.classList.add("is-visible");
      book.setAttribute("aria-hidden", "false");
      setPageAngle(0);
      setPhase("page-wait", {
        label: "Plate I · Turn the Page",
        status: "等待用户翻到下一页",
        hint: "点击右侧或向左滑动，翻开下一页",
        waiting: true,
        ariaLabel: "点击右侧或向左滑动，翻开下一页"
      });
      artboard.focus({ preventScroll: true });
    }

    async function loadImages(sources) {
      const entries = await Promise.all(Object.entries(sources).map(([key, source]) => new Promise((resolve, reject) => {
        const image = new Image();
        image.decoding = "async";
        image.onload = () => resolve([key, image]);
        image.onerror = () => reject(new Error(`Unable to load ${source}`));
        image.src = source;
      })));
      return Object.fromEntries(entries);
    }

    function resetScene() {
      clearMasksAndLayers();
      overlay.classList.remove("is-leaving", "is-waiting", "is-macos");
      overlay.classList.add("is-active");
      overlay.setAttribute("aria-hidden", "false");
      artboard.classList.remove("is-paintable", "is-framing", "is-hands-active");
      book.classList.remove("is-visible", "is-complete");
      book.setAttribute("aria-hidden", "true");
      turningPage.hidden = false;
      turningPage.style.removeProperty("transform");
      turningPage.style.removeProperty("--page-shadow");
      currentPageAngle = 0;
      pageTurning = false;
      collageBeatActive = false;
      collageBeatTilted = false;
      actTwoScene.classList.remove("is-visible", "is-zooming");
      actTwoScene.setAttribute("aria-hidden", "true");
      actTwoCamera.classList.remove("is-tilted");
      [peopleLeft, peopleRight, peopleCenter, computerLeft, computerCenter, computerRight]
        .forEach((piece) => piece.classList.remove("is-visible"));
      macScene.classList.remove("is-visible", "is-revealed");
      macScene.setAttribute("aria-hidden", "true");
      macNotification.classList.remove("is-visible");
      macNewsWindow.classList.remove("is-visible");
      macTooltip.classList.remove("is-visible");
      macTooltip.style.removeProperty("left");
      macTooltip.style.removeProperty("top");
      macTargetWord.textContent = "出卖";
      macTargetWord.classList.remove("is-hired");
      macCursor.classList.remove("is-pressing");
      macCursor.style.left = "7%";
      macCursor.style.top = "87%";
      macCursor.style.removeProperty("--cursor-duration");
      baseImage.src = imageMap.canvas.src;
      framedImage.src = imageMap.framed.src;
      humanHand.src = imageMap.humanHand.src;
      robotHand.src = imageMap.robotHand.src;
      nextPage.src = imageMap.supperBackground.src;
      pageFront.src = imageMap.framed.src;
      pageBack.src = imageMap.canvas.src;
      hideBrushTip();
      hidePaintHands();
      document.body.style.overflow = "hidden";
      setPhase("preload", {
        label: "Act I · The Creation of Adam",
        status: "第一幕素材已准备完成"
      });
      skipButton.focus({ preventScroll: true });
    }

    function teardown() {
      releaseTimers();
      if (currentPaint?.resolve) currentPaint.resolve();
      currentPaint = null;
      collageBeatActive = false;
      controller.abort();
      overlay.classList.remove("is-active", "is-leaving", "is-waiting", "is-macos");
      overlay.removeAttribute("data-phase");
      overlay.setAttribute("aria-hidden", "true");
      artboard.classList.remove("is-paintable", "is-framing", "is-hands-active");
      hidePaintHands();
      document.body.style.overflow = previousBodyOverflow;
      inProgress = false;
    }

    function completeOpening() {
      if (finished) return;
      finished = true;
      releaseTimers();
      if (currentPaint?.resolve) currentPaint.resolve();
      currentPaint = null;
      collageBeatActive = false;
      controller.abort();
      useCallback();
      teardown();
    }

    function exitAnimation() {
      if (finished) return;
      finished = true;
      releaseTimers();
      if (currentPaint?.resolve) currentPaint.resolve();
      currentPaint = null;
      collageBeatActive = false;
      controller.abort();
      hideBrushTip();
      hidePaintHands();
      overlay.classList.remove("is-waiting");
      overlay.classList.add("is-leaving");
      useCallback();
      window.setTimeout(teardown, 330);
    }

    artboard.addEventListener("pointerdown", onPointerDown, { signal: controller.signal });
    artboard.addEventListener("pointermove", onPointerMove, { signal: controller.signal });
    artboard.addEventListener("pointerup", onPointerEnd, { signal: controller.signal });
    artboard.addEventListener("pointercancel", onPointerEnd, { signal: controller.signal });
    artboard.addEventListener("wheel", onWheel, { signal: controller.signal, passive: false });
    window.addEventListener("keydown", onKeyDown, { signal: controller.signal });
    skipButton.addEventListener("click", exitAnimation, { signal: controller.signal });

    overlay.classList.add("is-active");
    overlay.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    setPhase("preload", {
      label: "Act I · Preparing the Canvas",
      status: "正在准备第一幕素材"
    });

    (async () => {
      try {
        actTwoLoadPromise = loadImages(ACT_TWO_ASSETS).then(
          (images) => ({ images, error: null }),
          (error) => ({ images: null, error })
        );
        imageMap = await loadImages(ACT_ONE_ASSETS);
        if (finished) return;
        brushStamps.push(imageMap.brushBroad, imageMap.brushFlat, imageMap.brushDry);
        resetScene();
        await wait(500);
        if (finished) return;

        await runPanoramaReveal(imageMap.fullSketch, 3000, 900, 1709);
        if (finished) return;
        await prepareCollaborativePaint();
        if (finished) return;

        await frameArtwork();
      } catch (error) {
        console.error("AI opening failed", error);
        status.textContent = "素材加载失败，正在进入正文";
        exitAnimation();
      }
    })();
  }

  window.AiOpening = { start };
})();
