// 사용법 애니메이션: 학습지 한 장을 불러와 보정하고, 선을 맞추고, 칸마다 잘라 저장하는 과정을
// SVG 한 장면으로 반복 재생합니다. [data-howto] 요소마다 하나씩 만들어지고,
// 화면에 보일 때만 재생합니다. 움직임 줄이기 설정이면 완성된 장면을 멈춘 채 보여 줍니다.
const Howto = (() => {
  const CELL = 70;
  const cellX = [60, 142, 224];
  const cellY = [92, 174, 256];
  const slotX = [362, 428, 494];
  const slotY = [96, 162, 228];
  const SLOT = 56;
  const faces = [
    ["#F2726B", "smile"], ["#6AA8F0", "o"], ["#5CC48A", "wink"],
    ["#F2B84B", "grin"], ["#B48CF2", "smile"], ["#F2726B", "flat"],
    ["#5CC48A", "smile"], ["#6AA8F0", "grin"], ["#F2B84B", "o"],
  ];
  // phase → [단계 번호, 설명]
  const PHASES = [
    [1, "학습지 사진을 불러와요"],
    [1, "비뚤어진 기울기를 반듯하게"],
    [2, "칸 수를 넣으면 가로 · 세로선이 생겨요"],
    [2, "선을 끌어 그림 가운데에 맞춰요"],
    [3, "선이 만나는 곳마다 자를 영역이 생겨요"],
    [4, "칸마다 잘라 내고"],
    [4, "번호를 붙여 파일로 저장해요"],
    [4, "ZIP 하나로 한 번에 받아요"],
  ];
  const STEP_LABELS = ["불러오기 · 보정", "선 맞추기", "영역 다듬기", "저장"];

  function face(cx, cy, color, mouth) {
    const m = {
      smile: `<path d="M${cx - 11} ${cy + 5} q11 11 22 0" />`,
      grin: `<path d="M${cx - 12} ${cy + 3} h24 q-12 15 -24 0z" class="hm-fill" />`,
      o: `<circle cx="${cx}" cy="${cy + 8}" r="4.5" />`,
      wink: `<path d="M${cx - 10} ${cy + 6} q10 8 20 0" />`,
      flat: `<path d="M${cx - 9} ${cy + 8} h18" />`,
    }[mouth];
    const eyes =
      mouth === "wink"
        ? `<circle cx="${cx - 8}" cy="${cy - 5}" r="3" class="hm-ink" /><path d="M${cx + 4} ${cy - 5} h8" />`
        : `<circle cx="${cx - 8}" cy="${cy - 5}" r="3" class="hm-ink" /><circle cx="${cx + 8}" cy="${cy - 5}" r="3" class="hm-ink" />`;
    return `<g class="hm-face"><circle cx="${cx}" cy="${cy}" r="24" fill="${color}" />${eyes}${m}</g>`;
  }

  function scene() {
    let cells = "", frames = "", pieces = "", slots = "";
    let v = "", h = "";
    faces.forEach(([color, mouth], i) => {
      const r = Math.floor(i / 3), c = i % 3;
      const x = cellX[c], y = cellY[r], cx = x + CELL / 2, cy = y + CELL / 2;
      cells += `<g class="hm-cell"><rect x="${x}" y="${y}" width="${CELL}" height="${CELL}" rx="3" class="hm-box" />${face(cx, cy, color, mouth)}</g>`;
      frames += `<rect x="${x - 4}" y="${y - 4}" width="${CELL + 8}" height="${CELL + 8}" class="hm-frame${i === 0 ? " sel" : ""}" style="--d:${i * 45}ms" />`;
      const sx = slotX[c], sy = slotY[r];
      const dx = sx + SLOT / 2 - cx, dy = sy + SLOT / 2 - cy;
      pieces += `<g class="hm-piece" style="--dx:${dx}px;--dy:${dy}px;--d:${i * 70}ms"><rect x="${x}" y="${y}" width="${CELL}" height="${CELL}" rx="3" class="hm-paper" />${face(cx, cy, color, mouth)}</g>`;
      slots += `<rect x="${sx}" y="${sy}" width="${SLOT}" height="${SLOT}" rx="6" class="hm-slot" /><text x="${sx + SLOT / 2}" y="${sy + SLOT + 8}" class="hm-num">${String(i + 1).padStart(2, "0")}</text>`;
    });
    [0, 1, 2].forEach((k) => {
      const x = cellX[k] + CELL / 2, y = cellY[k] + CELL / 2;
      v += `<g class="hm-gv" style="--off:${[16, -14, 12][k]}px;--d:${k * 80}ms"><line x1="${x}" y1="40" x2="${x}" y2="344" /><rect x="${x - 11}" y="26" width="22" height="14" rx="3" /><text x="${x}" y="36.5">X${k + 1}</text></g>`;
      h += `<g class="hm-gh" style="--off:${[-14, 12, -10][k]}px;--d:${k * 80 + 40}ms"><line x1="44" y1="${y}" x2="310" y2="${y}" /><rect x="26" y="${y - 7}" width="22" height="14" rx="3" /><text x="37" y="${y + 3.5}">Y${k + 1}</text></g>`;
    });
    return `<svg class="hm-svg" viewBox="0 0 600 380" role="img" aria-label="쎈스 초퍼 사용 과정 애니메이션: 학습지를 불러와 기울기를 보정하고, 가로 · 세로선을 그림 가운데에 맞춘 뒤, 칸마다 잘라 번호 붙은 파일과 ZIP으로 저장합니다.">
  <rect x="0" y="0" width="600" height="380" rx="16" class="hm-bg" />
  <g class="hm-tray">
    <text x="362" y="78" class="hm-tray-title">저장할 그림 9개</text>
    ${slots}
    <g class="hm-files"><text x="362" y="318" class="hm-file">나의_이모티콘_01.png</text><text x="362" y="333" class="hm-file">나의_이모티콘_02.png  ···  09.png</text></g>
    <g class="hm-zip"><rect x="362" y="302" width="188" height="44" rx="10" /><path d="M383 313v14m0 0 5-5m-5 5-5-5m-4 9h18" class="hm-zip-icon" /><text x="402" y="321" class="hm-zip-name">나의_이모티콘.zip</text><text x="402" y="336" class="hm-zip-sub">그림 9개 · 한 번에 저장</text></g>
  </g>
  <g class="hm-sheet">
    <rect x="40" y="36" width="264" height="312" rx="6" class="hm-paper hm-sheet-paper" />
    <text x="56" y="62" class="hm-sheet-title">이모티콘 만들기 학습지</text>
    <text x="288" y="62" class="hm-sheet-name">이름: ________</text>
    ${cells}
  </g>
  <g class="hm-angle"><rect x="232" y="352" width="72" height="22" rx="11" /><text x="268" y="367"><tspan class="a-from">−7°</tspan><tspan class="a-to">0°</tspan></text></g>
  <g class="hm-guides">${v}${h}</g>
  <g class="hm-frames">${frames}<g class="hm-handles"><rect x="52" y="84" width="8" height="8" /><rect x="132" y="84" width="8" height="8" /><rect x="52" y="164" width="8" height="8" /><rect x="132" y="164" width="8" height="8" /><circle cx="95" cy="127" r="5" /></g></g>
  <g class="hm-pieces">${pieces}</g>
  <g class="hm-pointer"><path d="M0 0 L0 20 L5.5 15 L9.5 24 L13 22.5 L9 13.5 L16 13.5 Z" /></g>
</svg>`;
  }

  function mount(el) {
    const compact = el.hasAttribute("data-howto-compact");
    el.innerHTML = `<div class="hm-stage">${scene()}</div>
<div class="hm-caption"><ol class="hm-steps">${STEP_LABELS.map((l, i) => `<li data-step="${i + 1}"><b>${i + 1}</b><span>${l}</span></li>`).join("")}</ol><p class="hm-line" aria-live="off"></p></div>`;
    if (compact) el.classList.add("hm-compact");
    const root = el;
    const line = el.querySelector(".hm-line");
    const items = [...el.querySelectorAll(".hm-steps li")];
    let phase = -1, timer = 0, visible = false;
    const reduce = matchMedia("(prefers-reduced-motion: reduce)");

    function show(p) {
      phase = p;
      for (let k = 0; k < PHASES.length; k++) root.classList.toggle(`p${k}`, k <= p);
      const [step, text] = PHASES[Math.max(0, p)];
      items.forEach((li) => li.classList.toggle("on", Number(li.dataset.step) === step));
      line.textContent = text;
    }
    function tick() {
      clearTimeout(timer);
      if (!visible || reduce.matches) return;
      if (phase >= PHASES.length - 1) {
        // 완성 장면을 잠시 보여 준 뒤 흐려졌다가 처음부터 다시
        root.classList.add("hm-out");
        timer = setTimeout(() => {
          root.classList.add("hm-reset");
          show(-1);
          void root.offsetWidth;
          root.classList.remove("hm-reset", "hm-out");
          timer = setTimeout(() => { show(0); timer = setTimeout(tick, 1500); }, 350);
        }, 450);
        return;
      }
      show(phase + 1);
      timer = setTimeout(tick, phase === PHASES.length - 1 ? 3000 : 1500);
    }
    function start() {
      if (reduce.matches) { show(PHASES.length - 1); return; }
      if (phase < 0) show(0);
      clearTimeout(timer);
      timer = setTimeout(tick, 1200);
    }
    // 단계 숫자를 누르면 그 장면으로 건너뛰기
    items.forEach((li) => {
      li.onclick = () => {
        const first = PHASES.findIndex(([s]) => s === Number(li.dataset.step));
        root.classList.add("hm-reset");
        show(-1);
        void root.offsetWidth;
        root.classList.remove("hm-reset");
        show(Math.max(0, first - 0));
        clearTimeout(timer);
        if (visible && !reduce.matches) timer = setTimeout(tick, 1600);
      };
    });
    new IntersectionObserver((entries) => {
      visible = entries.some((e) => e.isIntersecting);
      if (visible) start();
      else clearTimeout(timer);
    }).observe(el);
    reduce.addEventListener?.("change", start);
  }

  document.querySelectorAll("[data-howto]").forEach(mount);
  return { mount };
})();
