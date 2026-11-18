// 가이드 선 자동 맞춤: 이미지에서 그림(바탕색과 다른 부분)이 몰려 있는 곳을 찾아
// 세로선 · 가로선을 각 그림 덩어리의 가운데로 옮깁니다.
//  1) 작게 줄인 이미지에서 가장 흔한 색을 바탕색으로 보고, 바탕과 충분히 다른 화소를 '그림'으로 셉니다.
//  2) 길게 이어진 줄(표 테두리 · 밑줄)은 그림이 아니므로 셈에서 뺍니다.
//  3) 가로 · 세로 방향 그림 양을 1차원 분포로 만들고, 지금 선 위치에서 시작해
//     가까운 선끼리 나눈 뒤 '가중 중앙값'으로 옮기기를 되풀이합니다(제목 글자 같은 치우침에 강함).
// 맞추지 못하면 선을 그대로 두고 false를 돌려줍니다. 되돌리기(Ctrl+Z · 되돌리기 버튼)로 원래대로 돌아갑니다.
function autoAlignGuides() {
  if (!img || typeof cropMode === "undefined" || cropMode !== "guide" || !vertical.length || !horizontal.length) return false;
  const S = Math.min(1, 520 / Math.max(img.width, img.height));
  const W = Math.max(8, Math.round(img.width * S)), H = Math.max(8, Math.round(img.height * S));
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const g = c.getContext("2d", { willReadFrequently: true });
  g.fillStyle = "#fff";
  g.fillRect(0, 0, W, H);
  g.drawImage(img, 0, 0, W, H);
  const px = g.getImageData(0, 0, W, H).data;

  // 바탕색: 가장 많이 나오는 색 묶음의 평균
  const hist = new Map();
  for (let i = 0; i < px.length; i += 4) {
    const k = ((px[i] >> 4) << 8) | ((px[i + 1] >> 4) << 4) | (px[i + 2] >> 4);
    const e = hist.get(k);
    if (e) { e[0]++; e[1] += px[i]; e[2] += px[i + 1]; e[3] += px[i + 2]; }
    else hist.set(k, [1, px[i], px[i + 1], px[i + 2]]);
  }
  let best = null;
  for (const e of hist.values()) if (!best || e[0] > best[0]) best = e;
  const bg = [best[1] / best[0], best[2] / best[0], best[3] / best[0]];

  const ink = new Uint8Array(W * H);
  for (let y = 0, p = 0; y < H; y++)
    for (let x = 0; x < W; x++, p++) {
      const i = p * 4;
      const d = Math.abs(px[i] - bg[0]) + Math.abs(px[i + 1] - bg[1]) + Math.abs(px[i + 2] - bg[2]);
      ink[p] = d > 90 ? 1 : 0;
    }
  // 길게 이어진 줄(가장 긴 연속 구간이 길이의 35%를 넘는 행 · 열)은 빼기
  const lineRow = new Uint8Array(H), lineCol = new Uint8Array(W);
  for (let y = 0; y < H; y++) {
    let run = 0, longest = 0;
    for (let x = 0; x < W; x++) { run = ink[y * W + x] ? run + 1 : 0; if (run > longest) longest = run; }
    lineRow[y] = longest > W * 0.35 ? 1 : 0;
  }
  for (let x = 0; x < W; x++) {
    let run = 0, longest = 0;
    for (let y = 0; y < H; y++) { run = ink[y * W + x] ? run + 1 : 0; if (run > longest) longest = run; }
    lineCol[x] = longest > H * 0.35 ? 1 : 0;
  }
  const colProfile = new Float64Array(W), rowProfile = new Float64Array(H);
  for (let y = 0; y < H; y++) {
    if (lineRow[y]) continue;
    for (let x = 0; x < W; x++) {
      if (lineCol[x] || !ink[y * W + x]) continue;
      colProfile[x]++;
      rowProfile[y]++;
    }
  }
  const total = colProfile.reduce((a, b) => a + b, 0);
  if (total < W * H * 0.002) return false; // 그림이 거의 없음

  function fit1d(profile, centers) {
    let cs = centers.map((v) => v * S).sort((a, b) => a - b);
    for (let iter = 0; iter < 20; iter++) {
      const groups = cs.map(() => []);
      for (let x = 0; x < profile.length; x++) {
        if (!profile[x]) continue;
        let k = 0, dBest = Infinity;
        for (let j = 0; j < cs.length; j++) {
          const d = Math.abs(x - cs[j]);
          if (d < dBest) { dBest = d; k = j; }
        }
        groups[k].push(x);
      }
      const next = cs.map((v, j) => {
        const xs = groups[j];
        if (!xs.length) return v;
        const sum = xs.reduce((a, x) => a + profile[x], 0);
        let acc = 0;
        for (const x of xs) {
          acc += profile[x];
          if (acc >= sum / 2) return x + 0.5;
        }
        return v;
      });
      const moved = next.some((v, j) => Math.abs(v - cs[j]) > 0.5);
      cs = next.sort((a, b) => a - b);
      if (!moved) break;
    }
    return cs.map((v) => v / S);
  }
  snapshot();
  vertical = fit1d(colProfile, vertical);
  horizontal = fit1d(rowProfile, horizontal);
  syncGuideBoxes();
  rebuildPositions();
  render();
  return true;
}
