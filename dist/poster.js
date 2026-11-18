// 포스터 분할 인쇄: 이미지 한 장을 여러 종이에 크게 나눠 인쇄하고, 이어 붙여 큰 작품을 만듭니다.
//
// 여백 없이 인쇄가 안 되는 보통 프린터를 기준으로 합니다.
//  - 종이마다 가장자리 '프린터 여백'(기본 7mm)은 비워 둡니다. 이 안쪽(인쇄 영역)에만 그림을 그립니다.
//  - 이웃한 장이 있는 오른쪽 · 아래쪽에는 '풀칠 영역'(기본 10mm)을 빗금으로 인쇄합니다.
//    다음 장은 왼쪽 · 위쪽 점선(그림 가장자리)을 따라 흰 여백을 잘라 내고, 풀칠 영역 위에 겹쳐 붙입니다.
//    풀칠 영역은 다음 장 그림이 덮으므로 그림이 끊기지 않고 이어집니다.
//  - 풀칠 영역을 '없음'으로 하면 모든 맞닿는 가장자리에 자르는 선을 넣고, 맞대어 뒤에서 테이프로 붙입니다.
// 보정 없이 그대로 인쇄합니다. 장마다 200dpi로 그려 JPEG로 담은 PDF를 직접 만듭니다(라이브러리 없음).
const Poster = (() => {
  const PAPERS = {
    A4: [210, 297],
    A3: [297, 420],
    B4: [257, 364],
    B5: [182, 257],
    Letter: [215.9, 279.4],
  };
  const PAPER_NAMES = { A4: "A4", A3: "A3", B4: "B4", B5: "B5", Letter: "레터" };
  const RENDER_DPI = 200;
  const state = { on: false, paper: "A4", orient: "auto", cols: 2, margin: 7, glue: 10, labels: true, guide: true };
  const listeners = new Set();
  const rowName = (j) => String.fromCharCode(65 + (j % 26)) + (j >= 26 ? Math.floor(j / 26) : "");
  const label = (i, j) => `${rowName(j)}${i + 1}`;

  // ---------- 배치 계산 (단위 mm) ----------
  function layout() {
    if (!img) return null;
    const iw = img.width, ih = img.height;
    let [w, h] = PAPERS[state.paper];
    const orient = state.orient === "auto" ? (iw > ih ? "landscape" : "portrait") : state.orient;
    if (orient === "landscape") [w, h] = [h, w];
    const m = Math.max(0, Math.min(25, state.margin));
    const pw = w - 2 * m, ph = h - 2 * m;
    const g = Math.max(0, Math.min(Math.min(pw, ph) / 3, state.glue));
    const C = Math.max(1, Math.min(20, Math.round(state.cols)));
    const totalW = C * pw - (C - 1) * g;
    const imgW = totalW, imgH = (totalW * ih) / iw;
    const R = Math.max(1, Math.ceil((imgH - g) / (ph - g) - 1e-9));
    const totalH = R * ph - (R - 1) * g;
    const offX = 0, offY = (totalH - imgH) / 2;
    const dpi = iw / (imgW / 25.4);
    return { w, h, orient, m, pw, ph, g, C, R, imgW, imgH, offX, offY, totalW, totalH, dpi, k: iw / imgW };
  }
  // 장 (i, j)의 포스터 좌표(mm): 그림이 놓이는 칸과 풀칠 띠
  function page(L, i, j) {
    const x = i * (L.pw - L.g), y = j * (L.ph - L.g);
    const right = i < L.C - 1 && L.g > 0, bottom = j < L.R - 1 && L.g > 0;
    return { i, j, x, y, cw: L.pw - (right ? L.g : 0), ch: L.ph - (bottom ? L.g : 0), right, bottom, name: label(i, j) };
  }
  function quality(dpi) {
    if (dpi >= 150) return ["좋음", "good"];
    if (dpi >= 100) return ["보통", "ok"];
    return ["흐릴 수 있어요", "low"];
  }
  function summary(L = layout()) {
    if (!L) return "";
    const [q] = quality(L.dpi);
    return `${PAPER_NAMES[state.paper]} ${L.orient === "landscape" ? "가로" : "세로"} · 가로 ${L.C}장 × 세로 ${L.R}장 = ${L.C * L.R}장 · 완성 약 ${(L.imgW / 10).toFixed(1)} × ${(L.imgH / 10).toFixed(1)} cm · 선명도 ${q} (${Math.round(L.dpi)}dpi)`;
  }

  // ---------- 캔버스 위 미리보기 (종이 나뉘는 선 · 풀칠 띠 · 장 번호) ----------
  const svgNS = "http://www.w3.org/2000/svg";
  const overlay = document.createElementNS(svgNS, "svg");
  overlay.id = "posterOverlay";
  overlay.setAttribute("aria-hidden", "true");
  $("stage").append(overlay);
  function drawOverlay() {
    const L = state.on ? layout() : null;
    if (!L) { overlay.replaceChildren(); return; }
    overlay.setAttribute("viewBox", `0 0 ${img.width} ${img.height}`);
    const k = L.k, px = (xmm) => (xmm - L.offX) * k, py = (ymm) => (ymm - L.offY) * k;
    const sw = Math.max(1.5, img.width / 500);
    let out = `<defs><pattern id="posterHatch" width="${sw * 6}" height="${sw * 6}" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="${sw * 6}" height="${sw * 6}" fill="rgba(227,154,45,.22)"/><line x1="0" y1="0" x2="0" y2="${sw * 6}" stroke="rgba(227,154,45,.8)" stroke-width="${sw}"/></pattern></defs>`;
    out += `<rect x="${px(0)}" y="${py(0)}" width="${L.totalW * k}" height="${L.totalH * k}" fill="none" stroke="rgba(29,28,42,.35)" stroke-width="${sw}"/>`;
    for (let j = 0; j < L.R; j++)
      for (let i = 0; i < L.C; i++) {
        const P = page(L, i, j);
        if (P.right) out += `<rect x="${px(P.x + P.cw)}" y="${py(P.y)}" width="${L.g * k}" height="${L.ph * k}" fill="url(#posterHatch)"/>`;
        if (P.bottom) out += `<rect x="${px(P.x)}" y="${py(P.y + P.ch)}" width="${L.pw * k}" height="${L.g * k}" fill="url(#posterHatch)"/>`;
      }
    for (let j = 0; j < L.R; j++)
      for (let i = 0; i < L.C; i++) {
        const P = page(L, i, j);
        out += `<rect x="${px(P.x)}" y="${py(P.y)}" width="${L.pw * k}" height="${L.ph * k}" fill="none" stroke="#7c5cf0" stroke-width="${sw * 1.6}" stroke-dasharray="${sw * 8} ${sw * 5}"/>`;
        const fs = Math.min(L.pw, L.ph) * k * 0.12;
        out += `<g><rect x="${px(P.x + 4)}" y="${py(P.y + 4)}" width="${fs * 2.1}" height="${fs * 1.35}" rx="${fs * 0.3}" fill="#7c5cf0"/><text x="${px(P.x + 4) + fs * 1.05}" y="${py(P.y + 4) + fs * 1.02}" font-size="${fs}" font-weight="800" fill="#fff" text-anchor="middle" font-family="Pretendard Variable, sans-serif">${P.name}</text></g>`;
      }
    overlay.innerHTML = out;
  }

  // ---------- 인쇄용 장 그리기 ----------
  function canvasFor(L) {
    const dpm = RENDER_DPI / 25.4;
    const c = document.createElement("canvas");
    c.width = Math.round(L.w * dpm);
    c.height = Math.round(L.h * dpm);
    const g = c.getContext("2d");
    g.fillStyle = "#fff";
    g.fillRect(0, 0, c.width, c.height);
    g.scale(dpm, dpm); // 이제 단위는 mm
    return [c, g];
  }
  function hatch(g, x, y, w, h) {
    g.save();
    g.beginPath();
    g.rect(x, y, w, h);
    g.clip();
    g.fillStyle = "#fbf6ec";
    g.fillRect(x, y, w, h);
    g.strokeStyle = "#e3c896";
    g.lineWidth = 0.3;
    for (let d = -h; d < w + h; d += 2.4) {
      g.beginPath();
      g.moveTo(x + d, y);
      g.lineTo(x + d + h, y + h);
      g.stroke();
    }
    g.restore();
  }
  function cutLine(g, x1, y1, x2, y2) {
    g.save();
    g.strokeStyle = "#555";
    g.lineWidth = 0.3;
    g.setLineDash([2, 1.4]);
    g.beginPath();
    g.moveTo(x1, y1);
    g.lineTo(x2, y2);
    g.stroke();
    g.restore();
  }
  const FONT = "'Pretendard Variable', Pretendard, 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif";
  function text(g, s, x, y, size, { weight = 600, color = "#1d1c2a", align = "left", rotate = 0 } = {}) {
    g.save();
    g.translate(x, y);
    if (rotate) g.rotate(rotate);
    g.font = `${weight} ${size}px ${FONT}`;
    g.fillStyle = color;
    g.textAlign = align;
    g.textBaseline = "middle";
    g.fillText(s, 0, 0);
    g.restore();
  }
  function renderPage(L, P) {
    const [c, g] = canvasFor(L);
    const ox = L.m, oy = L.m; // 인쇄 영역 시작
    // 그림
    g.save();
    g.beginPath();
    g.rect(ox, oy, P.cw, P.ch);
    g.clip();
    g.imageSmoothingEnabled = true;
    g.imageSmoothingQuality = "high";
    g.drawImage(img, ox + L.offX - P.x, oy + L.offY - P.y, L.imgW, L.imgH);
    g.restore();
    // 풀칠 띠
    const next = (di, dj) => label(P.i + di, P.j + dj);
    if (P.right) {
      hatch(g, ox + P.cw, oy, L.g, L.ph);
      const cx = ox + P.cw + L.g / 2, mid = oy + L.ph / 2;
      text(g, "풀칠 영역", cx, mid - 22, 3.2, { weight: 700, color: "#b07a1c", align: "center", rotate: Math.PI / 2 });
      text(g, `여기에 ${next(1, 0)} 겹쳐 붙이기`, cx, mid + 18, 2.6, { color: "#8a6a30", align: "center", rotate: Math.PI / 2 });
    }
    if (P.bottom) {
      hatch(g, ox, oy + P.ch, P.right ? P.cw : L.pw, L.g);
      const cy = oy + P.ch + L.g / 2, mid = ox + P.cw / 2;
      text(g, "풀칠 영역", mid - 22, cy, 3.2, { weight: 700, color: "#b07a1c", align: "center" });
      text(g, `여기에 ${next(0, 1)} 겹쳐 붙이기`, mid + 20, cy, 2.6, { color: "#8a6a30", align: "center" });
    }
    if (P.right && P.bottom) hatch(g, ox + P.cw, oy + P.ch, L.g, L.g);
    // 장 번호 (풀칠 띠가 있으면 띠 안, 없으면 그림 오른쪽 아래 작게)
    if (state.labels) {
      if (P.right) {
        const cx = ox + P.cw + L.g / 2;
        g.fillStyle = "#7c5cf0";
        g.beginPath();
        g.roundRect(cx - Math.min(L.g * 0.42, 4.5), oy + 4, Math.min(L.g * 0.84, 9), 7, 1.5);
        g.fill();
        text(g, P.name, cx, oy + 7.5, 3, { weight: 800, color: "#fff", align: "center" });
      } else if (P.bottom) {
        g.fillStyle = "#7c5cf0";
        g.beginPath();
        g.roundRect(ox + 4, oy + P.ch + (L.g - Math.min(L.g * 0.84, 7)) / 2, 10, Math.min(L.g * 0.84, 7), 1.5);
        g.fill();
        text(g, P.name, ox + 9, oy + P.ch + L.g / 2, 3, { weight: 800, color: "#fff", align: "center" });
      } else {
        g.fillStyle = "rgba(255,255,255,.85)";
        g.beginPath();
        g.roundRect(ox + P.cw - 12, oy + P.ch - 7, 10, 5, 1.2);
        g.fill();
        text(g, P.name, ox + P.cw - 7, oy + P.ch - 4.5, 2.6, { weight: 800, color: "#7c5cf0", align: "center" });
      }
    }
    // 자르는 선: 풀칠로 붙일 때는 왼쪽 · 위쪽(앞 장 위에 올라가는 쪽), 맞대어 붙일 때는 맞닿는 모든 가장자리
    const butt = L.g <= 0;
    if (P.i > 0) cutLine(g, ox, oy - 0.01, ox, oy + L.ph);
    if (P.j > 0) cutLine(g, ox, oy, ox + L.pw, oy);
    if (butt && P.i < L.C - 1) cutLine(g, ox + L.pw, oy, ox + L.pw, oy + L.ph);
    if (butt && P.j < L.R - 1) cutLine(g, ox, oy + L.ph, ox + L.pw, oy + L.ph);
    return c;
  }
  function wrap(g, s, x, y, maxW, size, lh, opts) {
    g.font = `${opts?.weight || 500} ${size}px ${FONT}`;
    const words = s.split(" ");
    let line = "", yy = y;
    for (const w of words) {
      const t = line ? line + " " + w : w;
      if (g.measureText(t).width > maxW && line) {
        text(g, line, x, yy, size, opts);
        line = w;
        yy += lh;
      } else line = t;
    }
    if (line) text(g, line, x, yy, size, opts);
    return yy + lh;
  }
  function renderGuide(L) {
    // 안내 장은 늘 세로로
    const LL = { ...L, w: Math.min(L.w, L.h), h: Math.max(L.w, L.h) };
    const [c, g] = canvasFor(LL);
    const x0 = L.m + 6, wAvail = LL.w - 2 * (L.m + 6);
    let y = L.m + 10;
    text(g, "포스터 붙이는 방법", x0, y, 7.5, { weight: 800 });
    y += 8;
    text(g, `쎈스 초퍼 · ${PAPER_NAMES[state.paper]} ${L.orient === "landscape" ? "가로" : "세로"} ${L.C * L.R}장 · 완성 크기 약 ${(L.imgW / 10).toFixed(1)} × ${(L.imgH / 10).toFixed(1)} cm`, x0, y, 3.6, { color: "#6c6d7c", weight: 500 });
    y += 8;
    // 미리보기 지도
    const mapMaxW = wAvail, mapMaxH = LL.h * 0.42;
    const sc = Math.min(mapMaxW / L.totalW, mapMaxH / L.totalH);
    const mx = x0 + (wAvail - L.totalW * sc) / 2, my = y;
    g.fillStyle = "#f3f3f8";
    g.fillRect(mx, my, L.totalW * sc, L.totalH * sc);
    g.drawImage(img, mx + L.offX * sc, my + L.offY * sc, L.imgW * sc, L.imgH * sc);
    for (let j = 0; j < L.R; j++)
      for (let i = 0; i < L.C; i++) {
        const P = page(L, i, j);
        g.fillStyle = "rgba(255,255,255,.35)";
        if (P.right) g.fillRect(mx + (P.x + P.cw) * sc, my + P.y * sc, L.g * sc, L.ph * sc);
        if (P.bottom) g.fillRect(mx + P.x * sc, my + (P.y + P.ch) * sc, L.pw * sc, L.g * sc);
        g.strokeStyle = "#7c5cf0";
        g.lineWidth = 0.5;
        g.strokeRect(mx + P.x * sc, my + P.y * sc, L.pw * sc, L.ph * sc);
        const fs = Math.max(3, Math.min(8, Math.min(L.pw, L.ph) * sc * 0.16));
        g.fillStyle = "#7c5cf0";
        g.beginPath();
        g.roundRect(mx + P.x * sc + 2, my + P.y * sc + 2, fs * 2.2, fs * 1.5, 1);
        g.fill();
        text(g, P.name, mx + P.x * sc + 2 + fs * 1.1, my + P.y * sc + 2 + fs * 0.78, fs, { weight: 800, color: "#fff", align: "center" });
      }
    y = my + L.totalH * sc + 12;
    const steps = [
      "인쇄할 때 배율을 ‘실제 크기(100%)’로 고르고, ‘용지에 맞춤 · 페이지 맞춤’은 꺼 주세요. 여백 없는 인쇄는 켜지 않아도 됩니다.",
      L.g > 0
        ? "왼쪽이나 위쪽에 점선이 있는 장은 점선을 따라 흰 가장자리를 잘라 내세요. 점선이 없는 쪽은 자르지 않아요."
        : "모든 장의 맞닿는 가장자리 점선을 따라 흰 여백을 잘라 내세요.",
      L.g > 0
        ? "빗금 친 ‘풀칠 영역’에 풀을 바르고, 적힌 번호의 장을 그림이 이어지도록 겹쳐 붙이세요."
        : "잘라 낸 장을 그림이 이어지게 맞대고, 뒷면에서 테이프로 붙이세요.",
      `${label(0, 0)}부터 오른쪽으로 한 줄씩 붙인 뒤, 줄끼리 위에서 아래로 붙이면 쉬워요.`,
    ];
    steps.forEach((s, n) => {
      g.fillStyle = "#7c5cf0";
      g.beginPath();
      g.arc(x0 + 3, y, 3, 0, Math.PI * 2);
      g.fill();
      text(g, String(n + 1), x0 + 3, y + 0.2, 3.4, { weight: 800, color: "#fff", align: "center" });
      y = wrap(g, s, x0 + 10, y, wAvail - 10, 3.9, 6, { weight: 500 }) + 3;
    });
    y += 2;
    text(g, `선명도: ${quality(L.dpi)[0]} (약 ${Math.round(L.dpi)}dpi). 포스터는 조금 떨어져서 보면 더 또렷해 보여요.`, x0, y, 3.2, { color: "#6c6d7c", weight: 500 });
    text(g, "WSNS studio · 쎈스 초퍼  osense.github.io/Sense_Chopper", x0, LL.h - L.m - 5, 2.8, { color: "#9a9bab", weight: 500 });
    return [c, LL];
  }

  // ---------- 아주 작은 PDF 만들기 (장마다 JPEG 한 장) ----------
  const enc = new TextEncoder();
  const toJpeg = (c) => new Promise((r) => c.toBlob(async (b) => r(new Uint8Array(await b.arrayBuffer())), "image/jpeg", 0.92));
  function buildPdf(pages) {
    const chunks = [];
    let size = 0;
    const offsets = [];
    const push = (x) => { const b = typeof x === "string" ? enc.encode(x) : x; chunks.push(b); size += b.length; };
    const obj = (n, body) => { offsets[n] = size; push(`${n} 0 obj\n`); body(); push("\nendobj\n"); };
    push("%PDF-1.4\n%\xE2\xE3\xCF\xD3\n");
    const n = pages.length;
    const kids = pages.map((_, i) => `${3 + i * 3} 0 R`).join(" ");
    obj(1, () => push("<< /Type /Catalog /Pages 2 0 R /ViewerPreferences << /PrintScaling /None >> >>"));
    obj(2, () => push(`<< /Type /Pages /Kids [${kids}] /Count ${n} >>`));
    pages.forEach((p, i) => {
      const pn = 3 + i * 3, cn = pn + 1, im = pn + 2;
      const wpt = ((p.wmm * 72) / 25.4).toFixed(2), hpt = ((p.hmm * 72) / 25.4).toFixed(2);
      obj(pn, () => push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${wpt} ${hpt}] /Resources << /XObject << /Im0 ${im} 0 R >> >> /Contents ${cn} 0 R >>`));
      const content = `q ${wpt} 0 0 ${hpt} 0 0 cm /Im0 Do Q`;
      obj(cn, () => push(`<< /Length ${content.length} >>\nstream\n${content}\nendstream`));
      obj(im, () => {
        push(`<< /Type /XObject /Subtype /Image /Width ${p.pxW} /Height ${p.pxH} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${p.jpeg.length} >>\nstream\n`);
        push(p.jpeg);
        push("\nendstream");
      });
    });
    const xref = size;
    const total = 3 + n * 3;
    let x = `xref\n0 ${total}\n0000000000 65535 f \n`;
    for (let i = 1; i < total; i++) x += String(offsets[i]).padStart(10, "0") + " 00000 n \n";
    push(x);
    push(`trailer\n<< /Size ${total} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`);
    return new Blob(chunks, { type: "application/pdf" });
  }
  async function pdf(onProgress) {
    const L = layout();
    if (!L) throw Error("이미지가 없어요.");
    await document.fonts?.ready;
    const pages = [];
    const total = L.C * L.R + (state.guide ? 1 : 0);
    let done = 0;
    if (state.guide) {
      const [c, LL] = renderGuide(L);
      pages.push({ wmm: LL.w, hmm: LL.h, pxW: c.width, pxH: c.height, jpeg: await toJpeg(c) });
      onProgress?.(++done, total);
    }
    for (let j = 0; j < L.R; j++)
      for (let i = 0; i < L.C; i++) {
        const c = renderPage(L, page(L, i, j));
        pages.push({ wmm: L.w, hmm: L.h, pxW: c.width, pxH: c.height, jpeg: await toJpeg(c) });
        c.width = c.height = 0;
        onProgress?.(++done, total);
        await new Promise((r) => setTimeout(r, 0));
      }
    return buildPdf(pages);
  }

  // ---------- 상태 · 옆 패널 ----------
  function set(patch) {
    Object.assign(state, patch);
    document.body.classList.toggle("poster-mode", state.on);
    syncPanel();
    drawOverlay();
    relabelSteps();
    listeners.forEach((fn) => fn(state));
  }
  const panel = document.createElement("div");
  panel.className = "section poster-section";
  panel.dataset.mobileSteps = "2 3 4";
  panel.innerHTML = `
    <h2><i>P</i> 포스터 인쇄</h2>
    <div class="pair">
      <label>종이<select id="posterPaper">${Object.keys(PAPERS).map((k) => `<option value="${k}">${PAPER_NAMES[k]}</option>`).join("")}</select></label>
      <label>방향<select id="posterOrient"><option value="auto">자동</option><option value="portrait">세로</option><option value="landscape">가로</option></select></label>
    </div>
    <label>가로 장수<input id="posterCols" type="number" min="1" max="20" step="1"></label>
    <div class="pair">
      <label>프린터 여백 · mm<input id="posterMargin" type="number" min="0" max="25" step="1"></label>
      <label>풀칠 영역 · mm<input id="posterGlue" type="number" min="0" max="30" step="1"></label>
    </div>
    <p class="hint">여백 없이 인쇄가 안 되는 프린터가 많아서, 종이 가장자리는 비워 두고 붙일 때 잘라 내요.</p>
    <label class="link-label"><input id="posterLabels" type="checkbox">장 번호 넣기 (A1, A2 …)</label>
    <label class="link-label"><input id="posterGuide" type="checkbox">붙이는 방법 안내 장 넣기</label>
    <output id="posterSummary"></output>
    <button id="posterPdf" class="primary wide" type="button">인쇄용 PDF 만들기</button>
    <p class="poster-status" id="posterStatus"></p>
    <button id="posterExit" class="wide" type="button">칸마다 자르기로 바꾸기</button>`;
  document.querySelector("aside").append(panel);
  const F = {
    paper: $("posterPaper"), orient: $("posterOrient"), cols: $("posterCols"), margin: $("posterMargin"), glue: $("posterGlue"), labels: $("posterLabels"), guide: $("posterGuide"),
  };
  function syncPanel() {
    F.paper.value = state.paper;
    F.orient.value = state.orient;
    F.cols.value = state.cols;
    F.margin.value = state.margin;
    F.glue.value = state.glue;
    F.labels.checked = state.labels;
    F.guide.checked = state.guide;
    $("posterSummary").textContent = summary();
    const L = layout();
    $("posterSummary").dataset.quality = L ? quality(L.dpi)[1] : "";
  }
  F.paper.onchange = () => set({ paper: F.paper.value });
  F.orient.onchange = () => set({ orient: F.orient.value });
  F.cols.oninput = () => set({ cols: Math.max(1, Math.min(20, Number(F.cols.value) || 1)) });
  F.margin.oninput = () => set({ margin: Math.max(0, Math.min(25, Number(F.margin.value) || 0)) });
  F.glue.oninput = () => set({ glue: Math.max(0, Math.min(30, Number(F.glue.value) || 0)) });
  F.labels.onchange = () => set({ labels: F.labels.checked });
  F.guide.onchange = () => set({ guide: F.guide.checked });
  $("posterExit").onclick = () => set({ on: false });
  async function savePdf(say) {
    const blob = await pdf((i, n) => say?.(`만드는 중 · ${i} / ${n}`));
    save(blob, (($("prefix").value || "포스터").trim() || "포스터") + "_포스터.pdf");
    say?.("저장했어요. 인쇄할 때 ‘실제 크기(100%)’를 골라 주세요.");
    return blob;
  }
  $("posterPdf").onclick = async () => {
    const b = $("posterPdf");
    b.disabled = true;
    try {
      await savePdf((s) => ($("posterStatus").textContent = s));
    } catch (e) {
      console.error(e);
      $("posterStatus").textContent = "PDF를 만들지 못했어요. 장수를 줄여 다시 시도해 주세요.";
    } finally {
      b.disabled = false;
    }
  };

  // 포스터 모드일 때 단계 이름 바꾸기
  const CHOP_TABS = ["불러오기", "선 정렬", "영역", "내보내기"];
  const POSTER_TABS = ["불러오기", "종이 · 크기", "풀칠 · 여백", "인쇄"];
  function relabelSteps() {
    const names = state.on ? POSTER_TABS : CHOP_TABS;
    document.querySelectorAll("#stepNav button").forEach((b, i) => {
      const last = b.lastChild;
      if (last && last.nodeType === 3) last.textContent = names[i];
    });
    document.querySelectorAll(".pb-dots button").forEach((b, i) => b.setAttribute("aria-label", `${i + 1}단계 ${names[i]}로 가기`));
    window.dispatchEvent(new Event("chopper-mode"));
  }

  // 화면을 다시 그릴 때 미리보기도
  const renderBeforePoster = render;
  render = function (...args) {
    const r = renderBeforePoster(...args);
    if (state.on) drawOverlay();
    return r;
  };
  $("file").addEventListener("change", () => setTimeout(() => set({ on: false }), 0));
  syncPanel();

  return {
    state, set, layout, summary, quality, pdf, savePdf, stepNames: () => (state.on ? POSTER_TABS : CHOP_TABS),
    onChange: (fn) => listeners.add(fn),
    PAPERS, PAPER_NAMES,
  };
})();
