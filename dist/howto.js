// 사용법 애니메이션: 학습지 한 장을 불러와 기준선으로 기울기를 펴고, 가이드 선을 하나씩 끌어
// 그림 가운데에 맞추고, 영역 크기 · 위치를 다듬은 뒤 칸마다 잘라 ZIP으로 저장하는 과정을 보여 줍니다.
// 장면 하나(SVG)에 단계별 클래스(p0, p1, …)를 차례로 붙여 CSS 전환으로 움직입니다.
//
// [data-howto]               전체 과정 + 아래 단계 표시 (첫 화면 · 사용법 창)
// [data-howto-compact]       글자를 조금 작게
// [data-howto-step="2"]      그 단계 장면만 반복, 캡션 없이 (작업 중 안내 카드)
//
// 화면에 보일 때만 재생하고, 움직임 줄이기 설정이면 완성 장면을 멈춘 채 보여 줍니다.
const Howto = (() => {
  const CELL = 70;
  const cellX = [60, 142, 224];
  const cellY = [92, 174, 256];
  const cx = cellX.map((x) => x + CELL / 2); // 95 177 259
  const cy = cellY.map((y) => y + CELL / 2); // 127 209 291
  const xOff = [-20, 16, -18];
  const yOff = [-24, 14, -16];
  const slotX = [362, 428, 494];
  const slotY = [96, 162, 228];
  const SLOT = 56;
  const faces = [
    ["#F2726B", "smile"], ["#6AA8F0", "o"], ["#5CC48A", "wink"],
    ["#F2B84B", "grin"], ["#B48CF2", "smile"], ["#F2726B", "flat"],
    ["#5CC48A", "smile"], ["#6AA8F0", "grin"], ["#F2B84B", "o"],
  ];
  // [단계, 설명, 머무는 시간(ms), 위쪽 도구 표시]
  const PHASES = [
    [1, "학습지 사진을 불러와요", 1500, "학습지.png 불러오기"],
    [1, "기울어진 선을 따라 기준선을 그어요", 650, "선 1개로 수평 맞추기"],
    [1, "기울어진 선을 따라 기준선을 그어요", 1300, "선 1개로 수평 맞추기"],
    [1, "기준선이 수평이 되도록 반듯하게 펴져요", 1900, "기울기 −6.0° → 0°"],
    [2, "칸 수를 넣으면 가로 · 세로선이 생겨요", 1500, "격자 3 × 3 만들기"],
    [2, "선을 끌어 그림 가운데에 맞춰요", 600, "세로선 X1 이동"],
    [2, "선을 끌어 그림 가운데에 맞춰요", 900, "세로선 X1 이동"],
    [2, "선을 끌어 그림 가운데에 맞춰요", 550, "세로선 X2 이동"],
    [2, "선을 끌어 그림 가운데에 맞춰요", 900, "세로선 X2 이동"],
    [2, "선을 끌어 그림 가운데에 맞춰요", 550, "세로선 X3 이동"],
    [2, "선을 끌어 그림 가운데에 맞춰요", 900, "세로선 X3 이동"],
    [2, "가로선도 똑같이 맞춰요", 600, "가로선 Y1 · Y2 · Y3 이동"],
    [2, "가로선도 똑같이 맞춰요", 1400, "가로선 Y1 · Y2 · Y3 이동"],
    [3, "선이 만나는 곳마다 자를 영역이 생겨요", 1500, "자를 영역 9개"],
    [3, "모서리 손잡이로 크기를 조절하고", 600, "영역 01 크기 조절"],
    [3, "모서리 손잡이로 크기를 조절하고", 1300, "영역 01 · 280 × 280 → 320 × 320"],
    [3, "가운데 점을 끌어 위치를 옮겨요", 650, "영역 05 위치 이동"],
    [3, "가운데 점을 끌어 위치를 옮겨요", 1200, "영역 05 위치 이동"],
    [4, "칸마다 잘라 내고", 1300, "칸마다 자르기"],
    [4, "번호를 붙여 파일로 저장해요", 1800, "나의_이모티콘_01 ~ 09.png"],
    [4, "ZIP 하나로 한 번에 받아요", 3200, "ZIP 저장 완료"],
  ];
  const STEP_LABELS = ["불러오기 · 보정", "선 맞추기", "영역 다듬기", "저장"];

  function face(x, y, color, mouth) {
    const m = {
      smile: `<path d="M${x - 11} ${y + 5} q11 11 22 0" />`,
      grin: `<path d="M${x - 12} ${y + 3} h24 q-12 15 -24 0z" class="hm-fill" />`,
      o: `<circle cx="${x}" cy="${y + 8}" r="4.5" />`,
      wink: `<path d="M${x - 10} ${y + 6} q10 8 20 0" />`,
      flat: `<path d="M${x - 9} ${y + 8} h18" />`,
    }[mouth];
    const eyes =
      mouth === "wink"
        ? `<circle cx="${x - 8}" cy="${y - 5}" r="3" class="hm-ink" /><path d="M${x + 4} ${y - 5} h8" />`
        : `<circle cx="${x - 8}" cy="${y - 5}" r="3" class="hm-ink" /><circle cx="${x + 8}" cy="${y - 5}" r="3" class="hm-ink" />`;
    return `<g class="hm-face"><circle cx="${x}" cy="${y}" r="24" fill="${color}" />${eyes}${m}</g>`;
  }
  const handles = (x, y, w) =>
    `<rect class="hm-h tl" x="${x - 4}" y="${y - 4}" width="8" height="8" /><rect class="hm-h tr" x="${x + w - 4}" y="${y - 4}" width="8" height="8" /><rect class="hm-h bl" x="${x - 4}" y="${y + w - 4}" width="8" height="8" /><rect class="hm-h br" x="${x + w - 4}" y="${y + w - 4}" width="8" height="8" />`;

  function scene() {
    let cells = "", frames = "", pieces = "", slots = "", targets = "", v = "", h = "";
    faces.forEach(([color, mouth], i) => {
      const r = Math.floor(i / 3), c = i % 3;
      const x = cellX[c], y = cellY[r];
      cells += `<g class="hm-cell"><rect x="${x}" y="${y}" width="${CELL}" height="${CELL}" rx="3" class="hm-box" />${face(cx[c], cy[r], color, mouth)}</g>`;
      targets += `<path class="hm-target" d="M${cx[c] - 6} ${cy[r]} h12 M${cx[c]} ${cy[r] - 6} v12" />`;
      const fx = x - 4, fy = y - 4, fw = CELL + 8;
      const rect = `<rect x="${fx}" y="${fy}" width="${fw}" height="${fw}" class="hm-frame" />`;
      if (i === 0)
        frames += `<g class="hm-f hm-f1" style="--d:0ms">${rect}${handles(fx, fy, fw)}<circle class="hm-dot" cx="${cx[c]}" cy="${cy[r]}" r="5" /></g>`;
      else if (i === 4)
        frames += `<g class="hm-f hm-f5" style="--d:${i * 45}ms">${rect}<circle class="hm-dot" cx="${cx[c]}" cy="${cy[r]}" r="5" /></g>`;
      else frames += `<g class="hm-f" style="--d:${i * 45}ms">${rect}</g>`;
      const sx = slotX[c], sy = slotY[r];
      const dx = sx + SLOT / 2 - cx[c], dy = sy + SLOT / 2 - cy[r];
      pieces += `<g class="hm-piece" style="--dx:${dx}px;--dy:${dy}px;--d:${i * 70}ms"><rect x="${x}" y="${y}" width="${CELL}" height="${CELL}" rx="3" class="hm-paper" />${face(cx[c], cy[r], color, mouth)}</g>`;
      slots += `<rect x="${sx}" y="${sy}" width="${SLOT}" height="${SLOT}" rx="6" class="hm-slot" /><text x="${sx + SLOT / 2}" y="${sy + SLOT + 8}" class="hm-num">${String(i + 1).padStart(2, "0")}</text>`;
    });
    [0, 1, 2].forEach((k) => {
      v += `<g class="hm-gv x${k}" style="--off:${xOff[k]}px"><line x1="${cx[k]}" y1="40" x2="${cx[k]}" y2="344" /><rect x="${cx[k] - 11}" y="40" width="22" height="14" rx="3" /><text x="${cx[k]}" y="50.5">X${k + 1}</text></g>`;
      h += `<g class="hm-gh y${k}" style="--off:${yOff[k]}px;--d:${k * 90}ms"><line x1="44" y1="${cy[k]}" x2="300" y2="${cy[k]}" /><rect x="22" y="${cy[k] - 7}" width="22" height="14" rx="3" /><text x="33" y="${cy[k] + 3.5}">Y${k + 1}</text></g>`;
    });
    return `<svg class="hm-svg" viewBox="0 0 600 380" role="img" aria-label="쎈스 초퍼 사용 과정 애니메이션: 학습지를 불러와 기준선으로 기울기를 펴고, 가로 · 세로선을 하나씩 끌어 그림 가운데에 맞추고, 영역 크기와 위치를 다듬은 뒤 칸마다 잘라 번호 붙은 파일과 ZIP으로 저장합니다.">
  <rect x="0" y="0" width="600" height="380" rx="16" class="hm-bg" />
  <g class="hm-cam">
    <g class="hm-tray">
      <text x="362" y="78" class="hm-tray-title">저장할 그림 9개</text>
      ${slots}
      <g class="hm-files"><text x="362" y="318" class="hm-file">나의_이모티콘_01.png</text><text x="362" y="333" class="hm-file">나의_이모티콘_02.png  ···  09.png</text></g>
      <g class="hm-zip"><rect x="362" y="302" width="188" height="44" rx="10" /><path d="M383 313v14m0 0 5-5m-5 5-5-5m-4 9h18" class="hm-zip-icon" /><text x="402" y="321" class="hm-zip-name">나의_이모티콘.zip</text><text x="402" y="336" class="hm-zip-sub">그림 9개 · 한 번에 저장</text></g>
    </g>
    <line class="hm-level" x1="28" y1="78" x2="316" y2="78" />
    <g class="hm-sheet">
      <rect x="40" y="36" width="264" height="312" rx="6" class="hm-paper hm-sheet-paper" />
      <text x="56" y="70" class="hm-sheet-title">이모티콘 만들기 학습지</text>
      <text x="288" y="70" class="hm-sheet-name">이름: ________</text>
      ${cells}
      <g class="hm-ref"><line x1="56" y1="78" x2="288" y2="78" pathLength="100" /><circle cx="56" cy="78" r="4" /><circle cx="288" cy="78" r="4" class="end" /></g>
    </g>
    <g class="hm-targets">${targets}</g>
    <g class="hm-guides">${v}${h}</g>
    <g class="hm-frames">${frames}</g>
    <g class="hm-pieces">${pieces}</g>
    <g class="hm-pointer"><circle class="hm-press" cx="0" cy="0" r="11" /><path d="M0 0 L0 20 L5.5 15 L9.5 24 L13 22.5 L9 13.5 L16 13.5 Z" /></g>
  </g>
  <g class="hm-chip"><rect x="14" y="14" width="10" height="26" rx="13" /><circle cx="29" cy="27" r="4" /><text x="40" y="31.5"></text></g>
</svg>`;
  }

  function mount(el) {
    const only = Number(el.dataset.howtoStep) || 0; // 0 = 전체 과정
    el.innerHTML = only
      ? `<div class="hm-stage">${scene()}</div>`
      : `<div class="hm-stage">${scene()}</div>
<div class="hm-caption"><ol class="hm-steps">${STEP_LABELS.map((l, i) => `<li data-step="${i + 1}"><b>${i + 1}</b><span>${l}</span></li>`).join("")}</ol><p class="hm-line"></p></div>`;
    el.classList.add("hm");
    if (el.hasAttribute("data-howto-compact")) el.classList.add("hm-compact");
    if (only) el.classList.add("hm-bare");
    const root = el;
    const line = el.querySelector(".hm-line");
    const items = [...el.querySelectorAll(".hm-steps li")];
    const chipRect = el.querySelector(".hm-chip rect");
    const chipText = el.querySelector(".hm-chip text");
    const reduce = matchMedia("(prefers-reduced-motion: reduce)");
    let range = [0, PHASES.length - 1];
    let phase = -1, timer = 0, visible = false;

    function setStep(step) {
      if (!step) range = [0, PHASES.length - 1];
      else {
        const first = PHASES.findIndex(([s]) => s === step);
        let lastIdx = first;
        while (PHASES[lastIdx + 1] && PHASES[lastIdx + 1][0] === step) lastIdx++;
        range = [first, lastIdx];
      }
    }
    setStep(only);

    function show(p) {
      phase = p;
      for (let k = 0; k < PHASES.length; k++) root.classList.toggle(`p${k}`, k <= p);
      root.dataset.ph = String(p);
      const [step, text, , chip] = PHASES[Math.max(0, p)];
      items.forEach((li) => li.classList.toggle("on", Number(li.dataset.step) === step));
      if (line) line.textContent = text;
      chipText.textContent = chip;
      try {
        chipRect.setAttribute("width", String(Math.ceil(chipText.getComputedTextLength()) + 40));
      } catch {}
    }
    // 전환 없이 p 상태로 되돌린 뒤 이어서 재생
    function jump(p) {
      root.classList.add("hm-reset");
      show(p);
      void root.offsetWidth;
      root.classList.remove("hm-reset", "hm-out");
    }
    const loopStart = () => Math.max(0, range[0] - 1);
    function tick() {
      clearTimeout(timer);
      if (!visible || reduce.matches) return;
      if (phase >= range[1]) {
        root.classList.add("hm-out");
        timer = setTimeout(() => {
          jump(range[0] === 0 ? -1 : loopStart());
          timer = setTimeout(tick, 400);
        }, 450);
        return;
      }
      show(phase + 1);
      timer = setTimeout(tick, PHASES[phase][2]);
    }
    function start() {
      clearTimeout(timer);
      if (reduce.matches) {
        show(range[1]);
        return;
      }
      if (phase < range[0] - 1 || phase > range[1]) jump(loopStart());
      timer = setTimeout(tick, 500);
    }
    // 단계 숫자를 누르면 그 장면으로 건너뛰기
    items.forEach((li) => {
      li.onclick = () => {
        const first = PHASES.findIndex(([s]) => s === Number(li.dataset.step));
        clearTimeout(timer);
        jump(Math.max(-1, first - 1));
        if (visible && !reduce.matches) timer = setTimeout(tick, 250);
        else show(first);
      };
    });
    new IntersectionObserver((entries) => {
      visible = entries.some((e) => e.isIntersecting);
      if (visible) start();
      else clearTimeout(timer);
    }).observe(el);
    reduce.addEventListener?.("change", start);
    // 안내 카드가 단계를 바꿀 때 쓰는 손잡이
    el.howto = {
      play(step) {
        setStep(step);
        clearTimeout(timer);
        jump(loopStart());
        if (visible && !reduce.matches) timer = setTimeout(tick, 400);
        else if (reduce.matches) show(range[1]);
      },
    };
  }

  document.querySelectorAll("[data-howto]").forEach(mount);
  return { mount };
})();
