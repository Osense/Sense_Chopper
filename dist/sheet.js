// 쎈스 초퍼 학습지: 네 모서리 기준 마커(피듀셜 마커)로 사진을 자동으로 반듯하게 펴고 칸을 잡아 줍니다.
//   왼쪽 위 · 오른쪽 위 · 왼쪽 아래: QR 코드와 같은 파인더 패턴(검정 1 : 흰 1 : 검정 3 : 흰 1 : 검정 1)
//   오른쪽 아래: 정렬 패턴(1 : 1 : 1 : 1 : 1) — 모양이 달라서 사진을 돌려 찍어도 방향을 알 수 있어요.
// 1) 학습지 견본 만들기(PDF · PNG)  2) 불러온 사진에서 마커 찾기 → 원근 보정 → 칸마다 영역 배치
const Sheet = (() => {
  // ---------- 학습지 설계 (단위 mm, A4 세로) ----------
  const PAGE = { w: 210, h: 297 };
  const MOD = 2; // 마커 한 칸 = 2 mm → 파인더 14 mm, 정렬 패턴 10 mm
  const MARK = { tl: { x: 17, y: 17 }, tr: { x: 193, y: 17 }, bl: { x: 17, y: 280 }, br: { x: 193, y: 280 } };
  const GRID = { cols: 3, rows: 4, cell: 50, gap: 8, x: 22, y: 44, inset: 1.4 };
  const INK = "#23232b";
  const FONT = "'Pretendard Variable', Pretendard, 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif";

  function cellRect(c, r) {
    return { x: GRID.x + c * (GRID.cell + GRID.gap), y: GRID.y + r * (GRID.cell + GRID.gap), w: GRID.cell, h: GRID.cell };
  }

  // 학습지 한 장을 캔버스에 그림 (ppm: 1 mm당 픽셀 수)
  function renderSheet(ppm, { faces = false } = {}) {
    const cv = document.createElement("canvas");
    cv.width = Math.round(PAGE.w * ppm);
    cv.height = Math.round(PAGE.h * ppm);
    const g = cv.getContext("2d");
    g.scale(ppm, ppm);
    g.fillStyle = "#fff";
    g.fillRect(0, 0, PAGE.w, PAGE.h);

    // 기준 마커
    g.fillStyle = "#000";
    const sq = (cx, cy, s, color) => { g.fillStyle = color; g.fillRect(cx - s / 2, cy - s / 2, s, s); };
    for (const k of ["tl", "tr", "bl"]) {
      const { x, y } = MARK[k];
      sq(x, y, 7 * MOD, "#000"); sq(x, y, 5 * MOD, "#fff"); sq(x, y, 3 * MOD, "#000");
    }
    sq(MARK.br.x, MARK.br.y, 5 * MOD, "#000"); sq(MARK.br.x, MARK.br.y, 3 * MOD, "#fff"); sq(MARK.br.x, MARK.br.y, MOD, "#000");

    // 제목 · 이름 칸
    g.textAlign = "center";
    g.textBaseline = "alphabetic";
    g.fillStyle = INK;
    g.font = `800 8px ${FONT}`;
    g.fillText("이모티콘 만들기", PAGE.w / 2, 21);
    g.fillStyle = "#6b6e7c";
    g.font = `500 3.4px ${FONT}`;
    g.fillText("네모 칸마다 나만의 표정을 하나씩 그려 보세요", PAGE.w / 2, 27.5);
    g.fillStyle = INK;
    g.font = `600 3.6px ${FONT}`;
    g.textAlign = "left";
    const label = [["학년", 14], ["반", 14], ["번", 14], ["이름", 40]];
    let x = 42;
    g.strokeStyle = "#9aa0b4";
    g.lineWidth = 0.3;
    for (const [t, w] of label) {
      if (t === "이름") { g.fillText(t, x, 37.5); x += 8; }
      g.beginPath(); g.moveTo(x, 38.3); g.lineTo(x + w, 38.3); g.stroke();
      x += w + 1;
      if (t !== "이름") { g.fillText(t, x, 37.5); x += g.measureText(t).width + 5; }
    }

    // 그림 칸
    for (let r = 0; r < GRID.rows; r++)
      for (let c = 0; c < GRID.cols; c++) {
        const b = cellRect(c, r);
        g.strokeStyle = "#8e93a6";
        g.lineWidth = 0.45;
        g.beginPath();
        g.roundRect(b.x, b.y, b.w, b.h, 2.2);
        g.stroke();
        // 칸 번호는 칸 바깥 왼쪽 위 (잘리는 그림에 들어가지 않게)
        g.fillStyle = "#a3a7b6";
        g.font = `700 2.6px ${FONT}`;
        g.textAlign = "right";
        g.fillText(String(r * GRID.cols + c + 1), b.x - 1, b.y + 2.6);
        g.textAlign = "left";
        if (faces) drawFace(g, b.x + b.w / 2, b.y + b.h / 2, b.w * 0.36, r * GRID.cols + c);
      }

    // 안내 문구 (아래 두 마커 사이)
    g.textAlign = "center";
    g.fillStyle = "#6b6e7c";
    g.font = `500 2.9px ${FONT}`;
    g.fillText("칸 밖으로 나가지 않게 진하게 그려요 · 다 그리면 네 모서리 표시가 모두 보이게 사진을 찍어", PAGE.w / 2, 278.5);
    g.fillText("쎈스 초퍼에 불러오면 자동으로 반듯하게 펴고 칸마다 잘라 줘요", PAGE.w / 2, 283);
    g.fillStyle = "#a3a7b6";
    g.font = `700 2.5px ${FONT}`;
    g.fillText("SENSE CHOPPER · WSNS studio", PAGE.w / 2, 288.5);
    return cv;
  }

  // 예시용 표정 (색칠한 얼굴)
  const FACE_COLORS = ["#F2B84B", "#F2726B", "#5CC48A", "#6AA8F0", "#B48CF2", "#F59AC1"];
  function drawFace(g, cx, cy, r, i) {
    g.save();
    g.lineCap = "round";
    g.lineJoin = "round";
    g.fillStyle = FACE_COLORS[i % FACE_COLORS.length];
    g.strokeStyle = INK;
    g.lineWidth = r * 0.07;
    g.beginPath(); g.arc(cx, cy, r, 0, Math.PI * 2); g.fill(); g.stroke();
    g.fillStyle = INK;
    const kind = i % 6, e = r * 0.36, ey = cy - r * 0.18;
    const eye = (x) => { g.beginPath(); g.arc(x, ey, r * 0.1, 0, Math.PI * 2); g.fill(); };
    if (kind === 2) { eye(cx - e); g.beginPath(); g.moveTo(cx + e - r * 0.14, ey); g.lineTo(cx + e + r * 0.14, ey); g.stroke(); }
    else if (kind === 4) { for (const s of [-1, 1]) { g.beginPath(); g.arc(cx + s * e, ey + r * 0.06, r * 0.13, Math.PI * 1.1, Math.PI * 1.9); g.stroke(); } }
    else { eye(cx - e); eye(cx + e); }
    g.beginPath();
    if (kind === 1) { g.arc(cx, cy + r * 0.38, r * 0.17, 0, Math.PI * 2); g.stroke(); }
    else if (kind === 3) { g.moveTo(cx - r * 0.45, cy + r * 0.22); g.lineTo(cx + r * 0.45, cy + r * 0.22); g.quadraticCurveTo(cx, cy + r * 0.9, cx - r * 0.45, cy + r * 0.22); g.fillStyle = "#fff"; g.fill(); g.stroke(); }
    else if (kind === 5) { g.moveTo(cx - r * 0.35, cy + r * 0.5); g.quadraticCurveTo(cx, cy + r * 0.2, cx + r * 0.35, cy + r * 0.5); g.stroke(); }
    else { g.moveTo(cx - r * 0.42, cy + r * 0.25); g.quadraticCurveTo(cx, cy + r * 0.7, cx + r * 0.42, cy + r * 0.25); g.stroke(); }
    if (kind === 0 || kind === 4) {
      g.fillStyle = "rgba(242,114,107,.45)";
      for (const s of [-1, 1]) { g.beginPath(); g.ellipse(cx + s * r * 0.6, cy + r * 0.15, r * 0.14, r * 0.09, 0, 0, Math.PI * 2); g.fill(); }
    }
    g.restore();
  }

  // ---------- 견본 내려받기 ----------
  async function ready() { try { await document.fonts?.ready; } catch {} }
  const NAME = "쎈스초퍼_이모티콘_학습지";
  function saveBlob(blob, name) {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = name;
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  }
  async function downloadPng() {
    await ready();
    const cv = renderSheet(300 / 25.4);
    const blob = await new Promise((r) => cv.toBlob(r, "image/png"));
    saveBlob(blob, NAME + ".png");
  }
  async function downloadPdf() {
    await ready();
    const cv = renderSheet(300 / 25.4);
    const jpeg = await Poster.toJpeg(cv);
    const blob = Poster.buildPdf([{ wmm: PAGE.w, hmm: PAGE.h, pxW: cv.width, pxH: cv.height, jpeg }]);
    saveBlob(blob, NAME + ".pdf");
  }

  // ---------- 예시 사진: 다 그린 학습지를 비스듬히 찍은 것처럼 ----------
  async function samplePhoto() {
    await ready();
    const sheet = renderSheet(6, { faces: true });
    const sw = sheet.width, sh = sheet.height;
    const W = 1400, H = 1800;
    // 책상 위에 살짝 돌아가고 원근이 생긴 종이 (시계 방향: 왼쪽 위, 오른쪽 위, 오른쪽 아래, 왼쪽 아래)
    const quad = [{ x: 205, y: 118 }, { x: 1196, y: 172 }, { x: 1262, y: 1692 }, { x: 118, y: 1640 }];
    const m = CorrectionMath.homography(quad, [{ x: 0, y: 0 }, { x: sw, y: 0 }, { x: sw, y: sh }, { x: 0, y: sh }]);
    const src = sheet.getContext("2d").getImageData(0, 0, sw, sh).data;
    const cv = document.createElement("canvas");
    cv.width = W; cv.height = H;
    const g = cv.getContext("2d");
    const out = g.createImageData(W, H), d = out.data;
    for (let y = 0; y < H; y++)
      for (let x = 0; x < W; x++) {
        const n = (y * W + x) * 4;
        const den = m[6] * x + m[7] * y + m[8];
        const sx = (m[0] * x + m[1] * y + m[2]) / den, sy = (m[3] * x + m[4] * y + m[5]) / den;
        const light = 1 - 0.1 * (x / W) - 0.07 * (y / H); // 한쪽이 살짝 어두운 조명
        if (sx >= 0 && sy >= 0 && sx < sw - 1 && sy < sh - 1) {
          const i = ((sy | 0) * sw + (sx | 0)) * 4;
          d[n] = src[i] * light; d[n + 1] = src[i + 1] * light; d[n + 2] = src[i + 2] * light * 0.98;
        } else {
          const wood = 150 + 18 * Math.sin(y / 23 + Math.sin(x / 140) * 2);
          d[n] = wood * light; d[n + 1] = wood * 0.78 * light; d[n + 2] = wood * 0.58 * light;
        }
        d[n + 3] = 255;
      }
    g.putImageData(out, 0, 0);
    const blob = await new Promise((r) => cv.toBlob(r, "image/jpeg", 0.9));
    return new File([blob], "예시_이모티콘_학습지_사진.jpg", { type: "image/jpeg" });
  }

  // ---------- 마커 찾기 ----------
  // 회색조로 줄인 뒤, 주변 밝기 평균보다 어두운 곳을 검정으로 (그림자 · 조명 차이에 강함)
  function binarize(source, maxSide = 1100) {
    const s = Math.min(1, maxSide / Math.max(source.width, source.height));
    const w = Math.max(1, Math.round(source.width * s)), h = Math.max(1, Math.round(source.height * s));
    const cv = document.createElement("canvas");
    cv.width = w; cv.height = h;
    const g = cv.getContext("2d", { willReadFrequently: true });
    g.drawImage(source, 0, 0, w, h);
    const px = g.getImageData(0, 0, w, h).data;
    const gray = new Float32Array(w * h);
    for (let i = 0; i < w * h; i++) gray[i] = px[i * 4] * 0.299 + px[i * 4 + 1] * 0.587 + px[i * 4 + 2] * 0.114;
    const W1 = w + 1, sum = new Float64Array(W1 * (h + 1));
    for (let y = 0; y < h; y++) {
      let row = 0;
      for (let x = 0; x < w; x++) {
        row += gray[y * w + x];
        sum[(y + 1) * W1 + x + 1] = sum[y * W1 + x + 1] + row;
      }
    }
    const r = Math.max(8, Math.round(Math.max(w, h) / 28));
    const bits = new Uint8Array(w * h);
    for (let y = 0; y < h; y++) {
      const y0 = Math.max(0, y - r), y1 = Math.min(h, y + r + 1);
      for (let x = 0; x < w; x++) {
        const x0 = Math.max(0, x - r), x1 = Math.min(w, x + r + 1);
        const area = (x1 - x0) * (y1 - y0);
        const mean = (sum[y1 * W1 + x1] - sum[y0 * W1 + x1] - sum[y1 * W1 + x0] + sum[y0 * W1 + x0]) / area;
        const v = gray[y * w + x];
        bits[y * w + x] = v < mean * 0.82 && v < 170 ? 1 : 0;
      }
    }
    return { bits, w, h, scale: 1 / s };
  }

  // 5개 구간(검 · 흰 · 검 · 흰 · 검)이 기대 비율과 맞는지
  function ratioOk(c, pat, loose = 0.5) {
    const total = c[0] + c[1] + c[2] + c[3] + c[4];
    const units = pat.reduce((a, b) => a + b, 0);
    if (total < units * 1.6) return false;
    const u = total / units;
    for (let i = 0; i < 5; i++) if (Math.abs(c[i] - pat[i] * u) > pat[i] * u * loose) return false;
    return true;
  }
  // (x, y)에서 한 방향(dx, dy)으로 가운데 검정 → 흰 → 검정 길이를 셈
  function walk(B, x, y, dx, dy, limit) {
    const { bits, w, h } = B;
    const at = (i) => { const X = x + dx * i, Y = y + dy * i; return X < 0 || Y < 0 || X >= w || Y >= h ? -1 : bits[Y * w + X]; };
    let i = 0, center = 0, white = 0, black = 0;
    while (at(i) === 1 && center <= limit) { center++; i++; }
    while (at(i) === 0 && white <= limit) { white++; i++; }
    while (at(i) === 1 && black <= limit) { black++; i++; }
    return { center, white, black, ended: at(i) !== 1 };
  }
  // 가로로 찾은 후보를 세로(또는 가로)로 다시 확인하고 정확한 가운데를 돌려줌
  function crossCheck(B, x, y, vertical, pat, expect) {
    const [dx, dy] = vertical ? [0, 1] : [1, 0];
    const limit = expect * 1.6;
    const a = walk(B, x, y, -dx, -dy, limit), b = walk(B, x, y, dx, dy, limit);
    if (!a.ended || !b.ended) return null;
    const c = [a.black, a.white, a.center + b.center - 1, b.white, b.black];
    if (!ratioOk(c, pat)) return null;
    const total = c.reduce((s, v) => s + v, 0);
    if (total < expect * 0.35 || total > expect * 2.2) return null; // 원근으로 가로 · 세로 길이가 달라질 수 있어요
    const start = (vertical ? y : x) - a.center + 1;
    return { mid: start + c[2] / 2, total };
  }

  function findPatterns(B, pat, area = null, unitRange = null) {
    const { bits, w, h } = B;
    const x0 = area ? Math.max(0, area.x0 | 0) : 0, x1 = area ? Math.min(w, area.x1 | 0) : w;
    const y0 = area ? Math.max(0, area.y0 | 0) : 0, y1 = area ? Math.min(h, area.y1 | 0) : h;
    const units = pat.reduce((a, b) => a + b, 0);
    const found = [];
    const starts = [], lens = [];
    for (let y = y0; y < y1; y++) {
      starts.length = 0; lens.length = 0;
      let x = x0;
      // 첫 구간이 검정이 되도록 흰색은 건너뜀
      while (x < x1 && !bits[y * w + x]) x++;
      while (x < x1) {
        const v = bits[y * w + x];
        let s = x;
        while (x < x1 && bits[y * w + x] === v) x++;
        starts.push(s); lens.push(x - s);
      }
      for (let k = 0; k + 4 < lens.length; k += 2) {
        const c = [lens[k], lens[k + 1], lens[k + 2], lens[k + 3], lens[k + 4]];
        if (!ratioOk(c, pat)) continue;
        const total = c[0] + c[1] + c[2] + c[3] + c[4];
        const unit = total / units;
        if (unitRange && (unit < unitRange[0] || unit > unitRange[1])) continue;
        const cx = Math.round(starts[k + 2] + lens[k + 2] / 2);
        const v = crossCheck(B, cx, y, true, pat, total);
        if (!v) continue;
        const hz = crossCheck(B, cx, Math.round(v.mid), false, pat, total);
        if (!hz) continue;
        const p = { x: hz.mid, y: v.mid, unit: (hz.total + v.total) / 2 / units, n: 1 };
        const same = found.find((f) => Math.abs(f.x - p.x) < f.unit * 2.5 && Math.abs(f.y - p.y) < f.unit * 2.5 && Math.abs(f.unit - p.unit) < f.unit * 0.6);
        if (same) {
          same.x = (same.x * same.n + p.x) / (same.n + 1);
          same.y = (same.y * same.n + p.y) / (same.n + 1);
          same.unit = (same.unit * same.n + p.unit) / (same.n + 1);
          same.n++;
        } else found.push(p);
      }
    }
    return found.filter((f) => f.n >= 2).sort((a, b) => b.n - a.n);
  }

  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  // 정렬 패턴이 정말 '네모 고리 + 가운데 점'인지 8방향으로 확인
  function ringOk(B, p) {
    const { bits, w, h } = B;
    const at = (dx, dy) => { const X = Math.round(p.x + dx), Y = Math.round(p.y + dy); return X < 0 || Y < 0 || X >= w || Y >= h ? -1 : bits[Y * w + X]; };
    const u = p.unit;
    let good = 0, all = 0;
    const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];
    for (const [dx, dy] of dirs) {
      all += 2;
      if (at(dx * u * 2, dy * u * 2) === 1) good++;
      if (at(dx * u, dy * u) === 0) good++;
    }
    all++; if (at(0, 0) === 1) good++;
    return good / all >= 0.8;
  }
  const EXPECT = (MARK.tr.x - MARK.tl.x) / (MARK.bl.y - MARK.tl.y); // 가로 : 세로 마커 간격 ≈ 0.67

  // 파인더 세 개를 골라 왼쪽 위 · 오른쪽 위 · 왼쪽 아래로 이름 붙임
  function pickCorners(cands) {
    const list = cands.slice(0, 12);
    let best = null;
    for (let i = 0; i < list.length; i++)
      for (let j = i + 1; j < list.length; j++)
        for (let k = j + 1; k < list.length; k++) {
          const ps = [list[i], list[j], list[k]];
          const units = ps.map((p) => p.unit);
          if (Math.max(...units) / Math.min(...units) > 2.8) continue; // 원근이 심하면 가까운 쪽 표시가 훨씬 커 보여요
          // 가장 긴 변의 맞은편 꼭짓점이 왼쪽 위(직각)
          const d = [dist(ps[1], ps[2]), dist(ps[0], ps[2]), dist(ps[0], ps[1])];
          const a = d.indexOf(Math.max(...d));
          const A = ps[a], [P, Q] = ps.filter((_, n) => n !== a);
          const u = { x: P.x - A.x, y: P.y - A.y }, v = { x: Q.x - A.x, y: Q.y - A.y };
          const cross = u.x * v.y - u.y * v.x;
          // 화면 좌표(아래로 +y)에서 cross > 0 이면 P가 오른쪽 위
          const [TR, BL] = cross > 0 ? [P, Q] : [Q, P];
          const lu = dist(A, TR), lv = dist(A, BL);
          const unit = (A.unit + TR.unit + BL.unit) / 3;
          if (lu < Math.max(...units) * 30) continue; // 마커 간격은 88칸쯤
          const cos = Math.abs((u.x * v.x + u.y * v.y) / (lu * lv));
          const ratio = lu / lv;
          if (cos > 0.5 || ratio < 0.4 || ratio > 0.92) continue; // 정사각형(QR 코드 등)은 제외
          const score = cos * 2 + Math.abs(ratio - EXPECT) * 1.5 + (Math.max(...units) / Math.min(...units) - 1) * 0.5 - Math.min(Math.min(A.n, TR.n, BL.n), 20) * 0.03;
          if (!best || score < best.score) best = { score, tl: A, tr: TR, bl: BL, unit };
        }
    return best;
  }

  // 사진에서 학습지 마커 네 개를 찾아 원본 해상도 좌표로 돌려줌 (못 찾으면 null)
  function detect(source) {
    if (!source || !source.width) return null;
    const B = binarize(source);
    const finders = findPatterns(B, [1, 1, 3, 1, 1]);
    if (finders.length < 3) return null;
    const c = pickCorners(finders);
    if (!c) return null;
    // 오른쪽 아래 정렬 패턴: 사진 전체에서 찾아 TR–BL 선 건너편(TL 반대쪽)에 있는 것 중 고름
    const est = { x: c.tr.x + c.bl.x - c.tl.x, y: c.tr.y + c.bl.y - c.tl.y };
    const lo = Math.min(c.tr.unit, c.bl.unit) * 0.4, hi = Math.max(c.tr.unit, c.bl.unit) * 2.4;
    const side = (p) => (c.tr.x - c.bl.x) * (p.y - c.bl.y) - (c.tr.y - c.bl.y) * (p.x - c.bl.x);
    const tlSide = Math.sign(side(c.tl));
    const span = dist(c.tl, c.tr);
    let br = null, bestScore = Infinity;
    for (const a of findPatterns(B, [1, 1, 1, 1, 1], null, [lo, hi])) {
      if (Math.sign(side(a)) === tlSide || !ringOk(B, a)) continue;
      if (Math.min(dist(a, c.tr), dist(a, c.bl)) < span * 0.3) continue;
      const score = dist(a, est) / span - Math.min(a.n, 15) * 0.02;
      if (score < bestScore) { bestScore = score; br = a; }
    }
    const s = B.scale, up = (p) => ({ x: p.x * s, y: p.y * s });
    return { tl: up(c.tl), tr: up(c.tr), bl: up(c.bl), br: up(br || est), exact: !!br, unit: c.unit * s };
  }

  // ---------- 찾았으면: 반듯하게 펴고 칸마다 영역 ----------
  let busy = false;
  async function rectify(source, found) {
    const ppm = Math.max(4, Math.min(12, dist(found.tl, found.tr) / (MARK.tr.x - MARK.tl.x)));
    const W = Math.round(PAGE.w * ppm), H = Math.round(PAGE.h * ppm);
    const from = ["tl", "tr", "br", "bl"].map((k) => ({ x: MARK[k].x * ppm, y: MARK[k].y * ppm }));
    const to = ["tl", "tr", "br", "bl"].map((k) => found[k]);
    const matrix = CorrectionMath.homography(from, to); // 학습지 좌표 → 사진 좌표
    const sw = source.width, sh = source.height;
    const cv = document.createElement("canvas");
    cv.width = sw; cv.height = sh;
    const g = cv.getContext("2d", { willReadFrequently: true });
    g.drawImage(source, 0, 0);
    const pixels = g.getImageData(0, 0, sw, sh);
    const worker = new Worker("correction-worker.js");
    try {
      const result = await new Promise((resolve, reject) => {
        worker.onmessage = ({ data }) => { if (data.error) reject(Error(data.error)); else if (data.buffer) resolve(data); };
        worker.onerror = () => reject(Error("보정하지 못했어요."));
        worker.postMessage({ sw, sh, w: W, h: H, matrix, buffer: pixels.data.buffer }, [pixels.data.buffer]);
      });
      const out = document.createElement("canvas");
      out.width = result.w; out.height = result.h;
      const og = out.getContext("2d");
      og.fillStyle = "#fff";
      og.fillRect(0, 0, out.width, out.height);
      const tmp = document.createElement("canvas");
      tmp.width = result.w; tmp.height = result.h;
      tmp.getContext("2d").putImageData(new ImageData(new Uint8ClampedArray(result.buffer), result.w, result.h), 0, 0);
      og.drawImage(tmp, 0, 0);
      return { canvas: out, ppm };
    } finally {
      worker.terminate();
    }
  }

  function placeCells(ppm) {
    const size = Math.round((GRID.cell - GRID.inset * 2) * ppm);
    vertical = Array.from({ length: GRID.cols }, (_, c) => (cellRect(c, 0).x + GRID.cell / 2) * ppm);
    horizontal = Array.from({ length: GRID.rows }, (_, r) => (cellRect(0, r).y + GRID.cell / 2) * ppm);
    freeFrames = [];
    cropMode = "guide";
    $("cropMode").value = "guide";
    guideAutoSize = false;
    $("guideAutoSize").checked = false;
    $("ratio").value = "1";
    for (const [n, r, o] of [["cw", "gw", "gwValue"], ["ch", "gh", "ghValue"]]) {
      if (size > Number($(r).max)) $(r).max = size;
      $(n).value = $(r).value = size;
      $(o).textContent = size + " px";
    }
    syncGuideBoxes();
    rebuildPositions();
  }

  let lastResult = null;
  async function apply(source, found) {
    busy = true;
    try {
      const { canvas, ppm } = await rectify(source, found);
      snapshot();
      correctionSourceId = ++correctionSequence;
      correctionSources.set(correctionSourceId, canvas);
      rotationOriginal = canvas;
      setRotation(0, false, false);
      placeCells(ppm);
      selected = 0;
      render();
      previews();
      lastResult = { exact: found.exact, count: boxes.length };
      toast("학습지 표시를 찾아 반듯하게 펴고 칸마다 영역을 잡았어요.");
      Coach.show("sheet");
      return true;
    } catch (e) {
      console.warn(e);
      return false;
    } finally {
      busy = false;
    }
  }

  function revert() {
    if (!correctionSources.has(0)) return;
    snapshot();
    correctionSourceId = 0;
    rotationOriginal = correctionSources.get(0);
    vertical = []; horizontal = []; freeFrames = [];
    boxes = []; selected = -1;
    enableGuideAutoSize();
    setRotation(0, false, false);
    syncGuideBoxes();
    rebuildPositions();
    render();
    previews();
  }

  // 새 이미지를 불러오면 자동으로 학습지 마커를 찾아봄
  const loadBeforeSheet = load;
  load = function (...args) {
    // img는 회전 캔버스로 다시 바뀌므로, 원본(보정 출처 0번)이 바뀌었는지로 새 이미지를 알아챔
    const before = correctionSources.get(0);
    const r = loadBeforeSheet.apply(this, args);
    let tries = 0;
    const timer = setInterval(() => {
      if (++tries > 300) return clearInterval(timer);
      const now = correctionSources.get(0);
      if (!img || !now || now === before || rotationOriginal !== now) return;
      clearInterval(timer);
      // 다른 load 후처리(가이드 초기화 등)가 끝난 다음
      setTimeout(() => {
        if (busy) return;
        const source = correctionSources.get(0);
        let found = null;
        try { found = detect(source); } catch (e) { console.warn(e); }
        if (found) apply(source, found);
      }, 80);
    }, 30);
    return r;
  };

  // 안내 막대에 '학습지를 찾았어요' 질문 추가
  Coach.register("sheet", () => ({
    step: 1,
    q: "쎈스 초퍼 학습지를 찾았어요!",
    tip: `네 모서리 표시로 사진을 반듯하게 펴고, 그림 칸 ${lastResult?.count ?? 12}개에 영역을 잡아 두었어요. 미리보기를 확인하고 바로 저장하세요.${lastResult && !lastResult.exact ? " (오른쪽 아래 표시가 흐려서 어림으로 맞췄어요.)" : ""}`,
    extra: () => [Coach.h("p", "coach-readout", `자동 원근 보정 · 영역 ${boxes.length}개`)],
    actions: [
      ["바로 저장하러 가기", () => Coach.goStep(4), true],
      ["영역 크기 조정하기", () => Coach.goStep(3)],
      ["보정 없이 원래 사진 쓰기", () => { revert(); Coach.show("s0"); }],
    ],
  }));

  // ---------- 화면에 견본 내려받기 버튼 ----------
  document.querySelectorAll("[data-sheet-pdf]").forEach((b) => (b.onclick = downloadPdf));
  document.querySelectorAll("[data-sheet-png]").forEach((b) => (b.onclick = downloadPng));
  document.querySelectorAll("[data-sheet-try]").forEach((b) => (b.onclick = async () => load(await samplePhoto())));
  // 첫 화면 견본 미리보기
  const thumb = document.querySelector("[data-sheet-thumb]");
  if (thumb)
    ready().then(() => {
      const cv = renderSheet(3);
      cv.setAttribute("aria-hidden", "true");
      thumb.replaceChildren(cv);
    });

  return { renderSheet, detect, samplePhoto, downloadPdf, downloadPng, MARK, GRID, PAGE };
})();
