// 선 보정 돋보기: 수평 · 원근을 맞추는 선을 그을 때 포인터 아래를 크게 보여 줘요.
// 마우스는 보정 단계에서 화면 위에 있기만 해도, 손가락 · 펜은 누르고 있는 동안 나타나요.
(() => {
  const SIZE = 156;
  const el = document.createElement("div");
  el.className = "loupe";
  el.setAttribute("aria-hidden", "true");
  const cv = document.createElement("canvas");
  const zoomTag = document.createElement("span");
  zoomTag.className = "loupe-zoom";
  el.append(cv, zoomTag);
  document.body.append(el);
  const g = cv.getContext("2d");

  let last = null; // { x, y, type, down }
  let raf = 0;

  const active = () =>
    typeof correctionDrawingActive === "function" && correctionDrawingActive() && !handMode && img && img.width;

  function imagePoint(e) {
    const r = $("stage").getBoundingClientRect();
    return { x: (e.clientX - r.left) / scale, y: (e.clientY - r.top) / scale, inside: e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom };
  }

  function hide() {
    el.classList.remove("on");
    last = null;
  }

  function draw() {
    raf = 0;
    if (!last || !active()) return hide();
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    if (cv.width !== SIZE * dpr) { cv.width = cv.height = SIZE * dpr; }
    // 화면에 보이는 크기의 4배, 너무 작게 보이는 큰 사진도 최소 1:1 이상으로
    const k = Math.min(10, Math.max(scale * 4, 1.2)); // 이미지 1px → 돋보기 몇 px
    zoomTag.textContent = `×${(k / scale).toFixed(1)}`;
    const p = last.p;
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.fillStyle = "#f3f3f6";
    g.fillRect(0, 0, SIZE, SIZE);
    g.imageSmoothingEnabled = k < 3;
    g.save();
    g.translate(SIZE / 2, SIZE / 2);
    g.scale(k, k);
    g.translate(-p.x, -p.y);
    g.drawImage(img, 0, 0);
    // 그려 둔 선 · 지금 긋는 선
    const lines = correctionLines.slice();
    if (correctionStroke && correctionStroke.index == null) lines.push({ a: correctionStroke.a, b: correctionStroke.b, now: true });
    g.lineCap = "round";
    for (const l of lines) {
      g.strokeStyle = "rgba(255,255,255,.9)";
      g.lineWidth = 4 / k;
      g.beginPath(); g.moveTo(l.a.x, l.a.y); g.lineTo(l.b.x, l.b.y); g.stroke();
      g.strokeStyle = l.now ? "#38bcd8" : "#7c5cf0";
      g.lineWidth = 2 / k;
      g.beginPath(); g.moveTo(l.a.x, l.a.y); g.lineTo(l.b.x, l.b.y); g.stroke();
      for (const q of [l.a, l.b]) {
        g.beginPath(); g.arc(q.x, q.y, 4 / k, 0, Math.PI * 2);
        g.fillStyle = "#fff"; g.fill();
        g.lineWidth = 1.6 / k; g.strokeStyle = "#7c5cf0"; g.stroke();
      }
    }
    g.restore();
    // 가운데 십자선 (정확히 찍히는 지점)
    const c = SIZE / 2;
    g.lineWidth = 3; g.strokeStyle = "rgba(255,255,255,.85)";
    g.beginPath(); g.moveTo(c - 16, c); g.lineTo(c - 4, c); g.moveTo(c + 4, c); g.lineTo(c + 16, c); g.moveTo(c, c - 16); g.lineTo(c, c - 4); g.moveTo(c, c + 4); g.lineTo(c, c + 16); g.stroke();
    g.lineWidth = 1.4; g.strokeStyle = "#e5484d";
    g.stroke();
    g.fillStyle = "#e5484d";
    g.beginPath(); g.arc(c, c, 1.6, 0, Math.PI * 2); g.fill();

    // 위치: 포인터 왼쪽 위 (손가락이면 더 멀리), 화면 밖으로 나가면 반대쪽으로
    const gap = last.type === "mouse" ? 22 : 64;
    let left = last.x - SIZE - gap, top = last.y - SIZE - gap;
    if (left < 8) left = last.x + gap;
    if (top < 8) top = last.y + gap;
    left = Math.min(left, window.innerWidth - SIZE - 8);
    top = Math.min(top, window.innerHeight - SIZE - 8);
    el.style.left = left + "px";
    el.style.top = top + "px";
    el.classList.add("on");
  }

  function update(e) {
    if (!active()) return hide();
    const p = imagePoint(e);
    const down = e.type === "pointerdown" || (e.buttons & 1) === 1 || !!correctionStroke;
    if (e.pointerType !== "mouse" && !down) return hide();
    if (!p.inside && !correctionStroke) return hide();
    p.x = Math.max(0, Math.min(img.width, p.x));
    p.y = Math.max(0, Math.min(img.height, p.y));
    last = { x: e.clientX, y: e.clientY, type: e.pointerType, p };
    if (!raf) raf = requestAnimationFrame(draw);
  }

  // 보정 코드가 이벤트를 먼저 가로채므로 창 단계(capture)에서 먼저 받아요
  window.addEventListener("pointermove", update, true);
  window.addEventListener("pointerdown", update, true);
  window.addEventListener("pointerup", (e) => {
    if (e.pointerType !== "mouse") hide();
    else requestAnimationFrame(() => update(e));
  }, true);
  window.addEventListener("pointercancel", hide, true);
  $("viewport").addEventListener("pointerleave", (e) => { if (!correctionStroke) hide(); });
  window.addEventListener("blur", hide);
  window.addEventListener("wheel", () => last && !raf && (raf = requestAnimationFrame(draw)), { passive: true });

  window.Loupe = { hide };
})();
