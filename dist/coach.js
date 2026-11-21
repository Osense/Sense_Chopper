// 단계별 안내(마법사): 단계마다 한 가지를 질문으로 묻고, 대답 버튼을 누르면 실제 설정이 바뀌고 다음 질문으로 넘어갑니다.
//   1 불러오기 · 보정   반듯한가요? → (기울었으면) 기준선 긋기
//   2 선 맞추기         가로 · 세로 몇 개인가요? → 선이 가운데를 지나나요?
//   3 영역 정하기       자를 영역은 어떤 모습인가요? → 영역 크기를 맞춰 주세요
//   4 내보내기          총 N장이 나왔어요. 이걸 어떻게 할까요? → 낱장 저장 · GIF · PPT
// 넓은 화면: 작업 공간 맨 위 '안내 막대' — 왼쪽 질문, 아래 줄 대답 도구 · 버튼, 오른쪽 이전 · 다음.
//            옆 패널에는 그 단계의 실제 설정이 늘 보입니다. 단계 애니메이션은 '사용법 보기'로 펼칩니다.
// 휴대폰: 캔버스 아래 질문 카드 (세부 설정은 기본으로 숨기고 버튼으로 엽니다).
(() => {
  const FOLD_KEY = "sense-chopper:coach-folded";
  const DETAIL_KEY = "sense-chopper:details-open";
  const coach = document.createElement("section");
  coach.className = "coach";
  coach.setAttribute("aria-label", "단계별 안내");
  coach.innerHTML = `
    <div class="coach-anim" data-howto data-howto-step="1" aria-hidden="true"></div>
    <div class="coach-head">
      <div class="coach-text"><span class="coach-kicker"></span><h3 class="coach-q" tabindex="-1"></h3><p class="coach-tip"></p></div>
      <div class="coach-tools"><button type="button" class="coach-how ghost" aria-expanded="false">사용법 보기</button><button type="button" class="coach-fold ghost">접기</button></div>
      <div class="coach-nav"></div>
    </div>
    <div class="coach-row"><div class="coach-extra"></div><div class="coach-actions"></div></div>`;
  const anim = coach.querySelector(".coach-anim");
  const kicker = coach.querySelector(".coach-kicker");
  const q = coach.querySelector(".coach-q");
  const tip = coach.querySelector(".coach-tip");
  const extra = coach.querySelector(".coach-extra");
  const actions = coach.querySelector(".coach-actions");
  const foldBtn = coach.querySelector(".coach-fold");
  const howBtn = coach.querySelector(".coach-how");
  Howto.mount(anim);
  // 단계 애니메이션은 접어 두고 '사용법 보기'로 펼침 (넓은 화면은 안내 막대 아래 작은 창)
  howBtn.onclick = () => {
    const open = coach.classList.toggle("show-anim");
    howBtn.textContent = open ? "그림 닫기" : "사용법 보기";
    howBtn.setAttribute("aria-expanded", String(open));
  };

  const CHOP_NAMES = ["불러오기 · 보정", "선 맞추기", "영역 정하기", "내보내기"];
  const POSTER_NAMES = ["불러오기 · 보정", "종이 · 크기", "풀칠 · 여백", "인쇄"];
  const stepNames = () => (Poster.state.on ? POSTER_NAMES : CHOP_NAMES);
  const goNext = () => $("mobileNext").click();
  const fire = (el, type) => el.dispatchEvent(new Event(type, { bubbles: true }));
  const h = (tag, cls, html) => {
    const el = document.createElement(tag);
    if (cls) el.className = cls;
    if (html != null) el.innerHTML = html;
    return el;
  };
  const hasGuides = () =>
    (typeof boxes !== "undefined" && boxes.length > 0) || (typeof vertical !== "undefined" && vertical.length > 0);

  // ---------- 작은 입력 부품 ----------
  function stepper(id, label) {
    const input = $(id);
    const wrap = h("div", "coach-stepper", `<span>${label}</span><div><button type="button" aria-label="${label} 줄이기">−</button><output></output><button type="button" aria-label="${label} 늘리기">+</button></div>`);
    const out = wrap.querySelector("output");
    const [minus, plus] = wrap.querySelectorAll("button");
    const sync = () => (out.textContent = input.value + "개");
    const set = (v) => {
      input.value = String(Math.max(1, Math.min(50, v)));
      fire(input, "input");
      fire(input, "change");
      sync();
    };
    minus.onclick = () => set(Number(input.value) - 1);
    plus.onclick = () => set(Number(input.value) + 1);
    sync();
    return wrap;
  }
  // 여러 개 중 하나 고르기 (작은 버튼 줄)
  function segmented(label, options, value, onChange) {
    const wrap = h("div", "coach-seg");
    wrap.append(h("span", "", label));
    const row = h("div", "coach-seg-row");
    row.setAttribute("role", "radiogroup");
    row.setAttribute("aria-label", label);
    for (const [v, text] of options) {
      const b = h("button", "", text);
      b.type = "button";
      b.setAttribute("role", "radio");
      b.setAttribute("aria-checked", String(v === value));
      b.onclick = () => {
        row.querySelectorAll("button").forEach((x) => x.setAttribute("aria-checked", String(x === b)));
        onChange(v);
      };
      row.append(b);
    }
    wrap.append(row);
    return wrap;
  }
  // 큰 선택 카드 (그림 + 제목 + 설명)
  function optionCards(items, cls = "") {
    const grid = h("div", "coach-options " + cls);
    for (const it of items) {
      const b = h("button", "coach-opt" + (it.on ? " on" : ""), `${it.visual || ""}<b>${it.title}</b><small>${it.desc}</small>`);
      b.type = "button";
      b.onclick = it.pick;
      grid.append(b);
    }
    return grid;
  }
  function button(text, onClick, primary) {
    const b = h("button", primary ? "primary" : "", text);
    b.type = "button";
    b.onclick = onClick;
    return b;
  }
  const status = () => h("p", "coach-status");

  // ---------- 3단계: 영역 모양 · 크기 ----------
  const SHAPES = [
    { r: "auto", title: "칸에 꼭 맞게", desc: "선 사이를 빈틈없이 · 추천", box: [1, 1], dashed: true },
    { r: "1", title: "정사각형 1:1", desc: "이모티콘 · 프로필 · 인스타", box: [1, 1] },
    { r: "0.75", title: "세로 3:4", desc: "카드 · 증명사진 · 인물", box: [3, 4] },
    { r: "1.333333", title: "가로 4:3", desc: "사진 · 그림 · 작품", box: [4, 3] },
    { r: "1.777778", title: "와이드 16:9", desc: "발표 화면 · 유튜브", box: [16, 9] },
    { r: "0.5625", title: "세로 9:16", desc: "쇼츠 · 스토리 · 릴스", box: [9, 16] },
  ];
  let shape = "auto";
  function cellLimits() {
    if (!img) return { w: 300, h: 300 };
    if (typeof cropMode !== "undefined" && cropMode === "guide" && vertical.length && horizontal.length) {
      const vs = guideCells(vertical, img.width), hs = guideCells(horizontal, img.height);
      return { w: Math.min(...vs.map((c) => c.length)), h: Math.min(...hs.map((c) => c.length)) };
    }
    return { w: img.width, h: img.height };
  }
  function maxWidthFor(r) {
    const c = cellLimits();
    return Math.max(10, Math.floor(Math.min(c.w, c.h * r)));
  }
  let sizePct = 92;
  function applySize(pct) {
    sizePct = pct;
    const r = Number(shape);
    const w = Math.max(10, Math.round((maxWidthFor(r) * pct) / 100));
    const hgt = Math.max(10, Math.round(w / r));
    for (const [id, v] of [["gw", w], ["gh", hgt]]) {
      if (v > Number($(id).max)) $(id).max = v;
      $(id).value = v;
    }
    $("cw").value = w;
    $("ch").value = hgt;
    if (cropMode === "guide") syncDimensions("w");
    else if (boxes.length) $("size").click();
  }
  function applyShape(r) {
    snapshot();
    shape = r;
    if (r === "auto") {
      $("guideAutoSize").checked = true;
      fire($("guideAutoSize"), "change");
    } else {
      $("ratio").value = r;
      applySize(92);
    }
    previews();
  }
  const sizeText = () => {
    const b = boxes[Math.max(0, selected)];
    return b ? `${Math.round(b.w)} × ${Math.round(b.h)} px` : "";
  };

  // ---------- 4단계: 내보내기 ----------
  let gifOpts = { delay: 300, width: 360, order: "forward" };
  let pptOpts = { perSlide: 1, title: "", numbers: true };
  let lastGif = null;
  function nameField() {
    const box = h("label", "coach-name", `<span>파일 이름</span><input type="text" maxlength="80"><small></small>`);
    const input = box.querySelector("input");
    const hintEl = box.querySelector("small");
    input.value = $("prefix").value;
    const syncHint = () => (hintEl.textContent = $("filename").textContent);
    input.oninput = () => {
      $("prefix").value = input.value;
      fire($("prefix"), "input");
      fire($("prefix"), "change");
      requestAnimationFrame(syncHint);
    };
    syncHint();
    return box;
  }
  async function run(statusEl, work) {
    const all = actions.querySelectorAll("button");
    all.forEach((b) => (b.disabled = true));
    try {
      await work((text) => (statusEl.textContent = text));
    } catch (e) {
      console.error(e);
      statusEl.textContent = "만들지 못했어요. 크기를 줄이거나 다시 시도해 주세요.";
    } finally {
      all.forEach((b) => (b.disabled = false));
    }
  }

  // ---------- 질문들 ----------
  // 각 상태: { step, q, tip, extra(), actions: [[글자, 동작, 강조]] }
  // 포스터: 종이 그림
  const paperIcon = (k) => {
    const [w, hh] = Poster.PAPERS[k];
    return `<i class="paper" style="aspect-ratio:${w}/${hh}"></i>`;
  };
  function posterStepper() {
    const wrap = h("div", "coach-stepper", `<span>가로 장수</span><div><button type="button" aria-label="가로 장수 줄이기">−</button><output></output><button type="button" aria-label="가로 장수 늘리기">+</button></div>`);
    const out = wrap.querySelector("output");
    const [minus, plus] = wrap.querySelectorAll("button");
    const sync = () => (out.textContent = Poster.state.cols + "장");
    minus.onclick = () => { Poster.set({ cols: Math.max(1, Poster.state.cols - 1) }); sync(); };
    plus.onclick = () => { Poster.set({ cols: Math.min(20, Poster.state.cols + 1) }); sync(); };
    sync();
    return wrap;
  }
  function posterReadout() {
    const box = h("div", "coach-poster-info");
    const paint = () => {
      const L = Poster.layout();
      if (!L) return;
      const [q, tone] = Poster.quality(L.dpi);
      box.innerHTML = `<b>가로 ${L.C}장 × 세로 ${L.R}장 = ${L.C * L.R}장</b><span>완성 약 ${(L.imgW / 10).toFixed(1)} × ${(L.imgH / 10).toFixed(1)} cm · ${Poster.PAPER_NAMES[Poster.state.paper]} ${L.orient === "landscape" ? "가로" : "세로"}</span><em class="q-${tone}">선명도 ${q} · ${Math.round(L.dpi)}dpi</em>`;
    };
    paint();
    Poster.onChange(paint);
    return box;
  }

  const STATES = {
    s0: () => ({ step: 1, q: "이 이미지로 무엇을 만들까요?",
      tip: "한 장에 여러 그림이 있으면 칸마다 자르고, 한 그림을 크게 만들려면 여러 장에 나눠 인쇄해요.",
      extra: () => [optionCards([
        { title: "칸마다 잘라 저장", desc: "학습지 · 이모티콘 · 카드뉴스", visual: '<i class="ex ex-img"><em></em><em></em><em></em></i>', on: !Poster.state.on, pick: () => { Poster.set({ on: false }); show("s1"); } },
        { title: "크게 나눠 인쇄 (포스터)", desc: "여러 장에 나눠 붙이면 큰 작품", visual: '<i class="ex ex-poster"><em></em><em></em><em></em><em></em></i>', on: Poster.state.on, pick: () => { Poster.set({ on: true }); show("s1"); } },
      ], "exports")],
      actions: [] }),
    pp1: () => ({ step: 2, q: "어떤 종이에 인쇄할까요?",
      tip: "가지고 있는 프린터에 들어가는 종이를 골라 주세요. 캔버스에 종이가 나뉘는 선이 바로 보여요.",
      extra: () => [
        optionCards(Object.keys(Poster.PAPERS).map((k) => ({
          title: Poster.PAPER_NAMES[k], desc: `${Poster.PAPERS[k][0] / 10} × ${Poster.PAPERS[k][1] / 10} cm`, on: Poster.state.paper === k, visual: paperIcon(k),
          pick: () => { Poster.set({ paper: k }); show("pp1"); },
        })), "papers"),
        segmented("방향", [["auto", "자동"], ["portrait", "세로"], ["landscape", "가로"]], Poster.state.orient, (v) => Poster.set({ orient: v })),
      ],
      actions: [["다음: 크기 정하기", () => show("pp2"), true], ["칸마다 자르기로 바꾸기", () => { Poster.set({ on: false }); show(stateForStep(2)); }]] }),
    pp2: () => ({ step: 2, q: "얼마나 크게 만들까요?",
      tip: "가로로 몇 장을 이어 붙일지 정하면, 세로 장수는 그림 비율에 맞춰 정해져요.",
      extra: () => [posterStepper(), posterReadout()],
      actions: [["다음으로", goNext, true], ["종이 다시 고르기", () => show("pp1")]] }),
    pp3: () => ({ step: 3, q: "풀칠 영역을 만들까요?",
      tip: "이웃한 장이 겹쳐 붙을 자리를 빗금으로 인쇄해요. 풀을 바르고 다음 장을 올리면 그림이 끊기지 않고 이어져요.",
      extra: () => [
        segmented("풀칠 영역", [[0, "없음 · 맞대기"], [10, "1cm"], [15, "1.5cm"]], Poster.state.glue, (v) => Poster.set({ glue: v })),
        segmented("프린터 여백", [[5, "5mm"], [7, "7mm · 추천"], [10, "10mm"]], Poster.state.margin, (v) => Poster.set({ margin: v })),
        h("p", "coach-note", "여백 없이 인쇄가 안 되는 프린터가 많아서, 종이 가장자리는 비워 두고 붙일 때 잘라 내요. 가장자리가 잘려 나오면 여백을 늘려 주세요."),
        posterReadout(),
      ],
      actions: [["다음으로", goNext, true]] }),
    pp4: () => {
      const st = status();
      const L = Poster.layout();
      const pages = L ? L.C * L.R + (Poster.state.guide ? 1 : 0) : 0;
      return { step: 4, q: "인쇄용 PDF를 만들까요?",
        tip: "장마다 번호와 풀칠 영역 · 자르는 선이 들어가고, 맨 앞에 붙이는 방법을 그림으로 넣어 드려요.",
        extra: () => [
          segmented("장 번호", [[true, "넣기"], [false, "빼기"]], Poster.state.labels, (v) => Poster.set({ labels: v })),
          segmented("붙이는 방법 안내 장", [[true, "넣기"], [false, "빼기"]], Poster.state.guide, (v) => { Poster.set({ guide: v }); show("pp4"); }),
          h("p", "coach-readout", `PDF ${pages}쪽${Poster.state.guide ? " (안내 1 + 포스터 " + (pages - 1) + ")" : ""}`),
          st,
        ],
        actions: [["PDF 만들기", () => run(st, async (say) => { if (await Poster.savePdf(say)) show("pdone"); }), true]] };
    },
    pdone: () => ({ step: 4, q: "PDF를 저장했어요! 이제 인쇄해 볼까요?",
      tip: "인쇄할 때 배율은 ‘실제 크기(100%)’로, ‘용지에 맞춤’은 꺼 주세요. 첫 장 안내대로 점선을 자르고 풀칠 영역에 붙이면 돼요.",
      actions: [["다시 만들기", () => show("pp4"), true], ["새 이미지 불러오기", () => $("file").click()]] }),
    s1: () => ({ step: 1, q: "불러온 이미지가 반듯한가요?",
      tip: "조금 기울어져 있어도 괜찮아요. 기준선 하나만 그어 주면 반듯하게 펴 드려요.",
      actions: [["반듯해요, 다음으로", goNext, true], ["기울어졌어요", () => show("s1b")]] }),
    s1b: () => ({ step: 1, q: "기울어진 선을 따라 한 번 그어 주세요",
      tip: "제목 밑줄이나 표 테두리처럼 원래 수평이어야 할 선을 캔버스에서 끌어 그은 뒤 ‘보정 시작’을 누르세요.",
      actions: [["보정 끝, 다음으로", goNext, true], ["처음 질문으로", () => show("s1")]] }),
    s2a: () => ({ step: 2, q: "그림이 가로로 몇 개, 세로로 몇 줄 있나요?",
      tip: "세어 보고 숫자만 넣으면 그 수만큼 선을 고르게 그려 드려요.",
      extra: () => [stepper("cols", "가로"), stepper("rows", "세로")],
      actions: [["선 만들기", () => { $("grid").click(); autoAlignGuides(); show("s2b", { auto: true }); }, true]] }),
    s2b: ({ auto } = {}) => ({ step: 2, q: "파란 선이 그림 가운데를 지나나요?",
      tip: (auto ? "그림을 찾아 선을 가운데로 맞춰 두었어요. " : "") + "어긋난 선은 X1 · Y1 같은 이름표를 잡고 끌어 그림 가운데로 옮겨 주세요.",
      actions: [["네, 다음으로", goNext, true], ["자동으로 다시 맞추기", () => { autoAlignGuides(); show("s2b", { auto: true }); }], ["칸 수 다시 정하기", () => show("s2a")]] }),
    s3a: () => ({ step: 3, q: "자를 영역은 어떤 모습인가요?",
      tip: "어디에 쓸지 떠올려 보세요. 고르면 캔버스에 바로 보여요.",
      extra: () => [optionCards(SHAPES.map((s) => ({
        title: s.title, desc: s.desc, on: s.r === shape,
        visual: `<i class="shape${s.dashed ? " dashed" : ""}" style="aspect-ratio:${s.box[0]}/${s.box[1]}"></i>`,
        pick: () => { applyShape(s.r); show("s3b"); },
      })), "shapes")],
      actions: [] }),
    s3b: () => {
      const auto = shape === "auto";
      return { step: 3, q: "영역의 크기를 맞춰 주세요!",
        tip: auto
          ? "칸마다 빈틈없이 나눴어요. 넘치거나 모자란 칸만 그 영역을 눌러 모서리 손잡이로 고쳐 주세요."
          : "그림이 잘리지 않을 만큼 넉넉하게 키워 주세요. 하나만 다르면 그 영역을 눌러 모서리 손잡이로, 가운데 점으로 위치를 옮겨요.",
        extra: () => {
          if (auto) return [h("p", "coach-readout", `영역 ${boxes.length}개 · 칸 크기에 맞춤`)];
          const wrap = h("label", "coach-range", `<span>영역 크기</span><input type="range" min="20" max="100" step="1"><output></output>`);
          const range = wrap.querySelector("input"), out = wrap.querySelector("output");
          range.value = String(sizePct);
          out.textContent = sizeText();
          range.onpointerdown = () => snapshot();
          range.oninput = () => { applySize(Number(range.value)); out.textContent = sizeText(); };
          range.onchange = () => previews();
          const quick = h("div", "coach-quick");
          for (const [pct, text] of [[70, "작게"], [85, "보통"], [100, "칸 가득"]])
            quick.append(button(text, () => { snapshot(); range.value = String(pct); range.oninput(); previews(); }));
          return [wrap, quick];
        },
        actions: [["다 맞췄어요, 다음으로", goNext, true], ["모양 다시 고르기", () => show("s3a")]] };
    },
    s4: () => ({ step: 4, q: `총 ${boxes.length}장의 이미지가 나왔어요. 이제 이걸 어떻게 할까요?`,
      tip: "미리보기에서 잘린 모습을 확인할 수 있어요. 여러 가지로 만들어도 돼요.",
      extra: () => [optionCards([
        { title: "낱장 이미지로 저장", desc: "PNG · JPG를 ZIP 하나로", visual: '<i class="ex ex-img"><em></em><em></em><em></em></i>', pick: () => show("s4img") },
        { title: "움직이는 GIF 만들기", desc: "차례로 넘어가는 애니메이션", visual: '<i class="ex ex-gif"><em></em><em></em><em></em></i>', pick: () => show("s4gif") },
        { title: "발표 자료(PPT) 만들기", desc: "한 장에 하나씩 또는 모아서", visual: '<i class="ex ex-ppt"><em></em></i>', pick: () => show("s4ppt") },
        ...(typeof PdfBatch !== "undefined" && PdfBatch.active() ? [{ title: `PDF ${PdfBatch.pages()}쪽 모두 자르기`, desc: "쪽마다 폴더로 · ZIP 하나", visual: '<i class="ex ex-img"><em></em><em></em><em></em></i>', pick: () => show("s4pdf") }] : []),
      ], "exports")],
      actions: [] }),
    s4img: () => {
      const st = status();
      return { step: 4, q: "파일 이름과 형식을 정해 주세요",
        tip: "번호는 01부터 차례로 붙어요. 투명 배경이 필요하면 PNG를 고르세요.",
        extra: () => [nameField(), segmented("형식", [["png", "PNG"], ["jpeg", "JPG"], ["webp", "WEBP"]], $("format").value, (v) => { $("format").value = v; fire($("format"), "change"); }), st],
        actions: [
          ["ZIP으로 한 번에 저장", () => { $("zip").click(); show("done", { what: "ZIP 파일" }); }, true],
          ["하나씩 저장", () => { $("individual").click(); show("done", { what: "낱장 파일" }); }],
          ["다른 방법 고르기", () => show("s4")],
        ] };
    },
    s4gif: () => {
      const st = status();
      return { step: 4, q: "어떤 GIF로 만들까요?",
        tip: `그림 ${boxes.length}장이 차례로 넘어가는 움직이는 그림을 만들어요. 플립북이나 표정이 바뀌는 이모티콘에 좋아요.`,
        extra: () => [
          segmented("빠르기", [[150, "빠르게"], [300, "보통"], [600, "천천히"], [1000, "아주 천천히"]], gifOpts.delay, (v) => (gifOpts.delay = v)),
          segmented("크기", [[240, "작게"], [360, "보통"], [480, "크게"]], gifOpts.width, (v) => (gifOpts.width = v)),
          segmented("순서", [["forward", "처음부터 반복"], ["pingpong", "왔다 갔다"]], gifOpts.order, (v) => (gifOpts.order = v)),
          st,
        ],
        actions: [
          ["GIF 만들기", () => run(st, async (say) => {
            const blob = await Exporter.gif({ ...gifOpts, onProgress: (i, n) => say(`만드는 중 · ${i} / ${n}`) });
            if (lastGif) URL.revokeObjectURL(lastGif.url);
            lastGif = { blob, url: URL.createObjectURL(blob) };
            show("s4gifready");
          }), true],
          ["다른 방법 고르기", () => show("s4")],
        ] };
    },
    s4gifready: () => {
      const preview = h("div", "coach-preview");
      preview.append(Object.assign(new Image(), { src: lastGif.url, alt: "만든 GIF 미리보기" }));
      const kb = Math.max(1, Math.round(lastGif.blob.size / 1024));
      return { step: 4, q: "GIF가 완성됐어요! 마음에 드나요?",
        tip: `파일 크기 ${kb >= 1024 ? (kb / 1024).toFixed(1) + " MB" : kb + " KB"} · 빠르기나 크기를 바꿔 다시 만들 수도 있어요.`,
        extra: () => [preview],
        actions: [
          ["GIF 저장", () => { save(lastGif.blob, Exporter.baseName() + ".gif"); show("done", { what: "GIF" }); }, true],
          ["설정 바꿔 다시 만들기", () => show("s4gif")],
          ["다른 방법 고르기", () => show("s4")],
        ] };
    },
    s4ppt: () => {
      const st = status();
      const title = h("label", "coach-name", `<span>첫 장 제목 · 비워도 돼요</span><input type="text" maxlength="60" placeholder="예: 우리 반 이모티콘 전시회">`);
      const ti = title.querySelector("input");
      ti.value = pptOpts.title;
      const readout = h("p", "coach-readout");
      const count = () => (readout.textContent = `슬라이드 ${Math.ceil(boxes.length / pptOpts.perSlide) + (pptOpts.title.trim() ? 1 : 0)}장`);
      ti.oninput = () => { pptOpts.title = ti.value; count(); };
      count();
      return { step: 4, q: "발표 자료를 어떻게 만들까요?",
        tip: "16:9 슬라이드로 만들어요. PowerPoint, Keynote, Google 슬라이드에서 열 수 있어요.",
        extra: () => [
          optionCards([1, 4, 6].map((n) => ({
            title: n === 1 ? "한 장에 하나씩" : `한 장에 ${n}개`, desc: n === 1 ? "크게 보여 주기" : n === 4 ? "2 × 2로 모아 보기" : "3 × 2로 모아 보기",
            on: pptOpts.perSlide === n, visual: `<i class="slide s${n}">${"<em></em>".repeat(n)}</i>`,
            pick: () => { pptOpts.perSlide = n; show("s4ppt"); },
          })), "slides"),
          title,
          segmented("번호 표시", [[true, "넣기"], [false, "빼기"]], pptOpts.numbers, (v) => (pptOpts.numbers = v)),
          readout,
          st,
        ],
        actions: [
          ["PPT 만들기", () => run(st, async (say) => {
            const blob = await Exporter.ppt({ ...pptOpts, onProgress: (i, n) => say(`만드는 중 · ${i} / ${n}`) });
            save(blob, Exporter.baseName() + ".pptx");
            show("done", { what: "PPT 파일" });
          }), true],
          ["다른 방법 고르기", () => show("s4")],
        ] };
    },
    done: ({ what = "파일" } = {}) => ({ step: 4, q: `${what}을 저장했어요! 또 무엇을 할까요?`,
      tip: "같은 그림으로 GIF나 발표 자료도 만들 수 있어요. 새 이미지를 불러오면 처음부터 다시 안내해 드려요.",
      actions: [["다른 형태로도 만들기", () => show("s4"), true], ["새 이미지 불러오기", () => $("file").click()]] }),
  };

  let current = "";
  function show(key, arg, focus = true) {
    current = key;
    const st = STATES[key](arg);
    coach.dataset.state = key;
    document.body.dataset.coach = key;
    kicker.textContent = `${st.step}/4 · ${stepNames()[st.step - 1]}`;
    q.textContent = st.q;
    tip.textContent = st.tip;
    extra.replaceChildren(...(st.extra ? st.extra() : []));
    actions.replaceChildren(...st.actions.map(([t, fn, p]) => button(t, fn, p)));
    if (anim.howto && anim.dataset.playing !== String(st.step)) {
      anim.dataset.playing = String(st.step);
      anim.howto.play(st.step);
    }
    document.body.classList.toggle("coach-correct", key === "s1b");
    if (key === "s1b" && $("straightenOne")?.getAttribute("aria-pressed") !== "true") $("straightenOne")?.click();
    coach.classList.toggle("no-row", !st.actions.length && !extra.childElementCount);
    if (focus && !coach.classList.contains("folded")) q.focus({ preventScroll: true });
  }

  function stateForStep(step) {
    if (step === 1) return "s1";
    if (Poster.state.on) return step === 2 ? "pp1" : step === 3 ? "pp3" : "pp4";
    if (step === 2) return hasGuides() ? "s2b" : "s2a";
    if (step === 3) return "s3a";
    return "s4";
  }

  let lastStep = 0;
  new MutationObserver(() => {
    const step = Number(document.body.dataset.mobileStep) || 1;
    if (step !== lastStep) {
      lastStep = step;
      show(stateForStep(step), undefined, false);
    }
  }).observe(document.body, { attributes: true, attributeFilter: ["data-mobile-step"] });
  $("grid").addEventListener("click", () => {
    setTimeout(() => {
      if (current === "s2a" && hasGuides()) show("s2b");
    }, 0);
  });
  // 새 이미지(파일 고르기 · 끌어 놓기 · 예시)를 불러오면 "무엇을 만들까요?"부터
  const loadBeforeCoach = load;
  load = function (...args) {
    const r = loadBeforeCoach.apply(this, args);
    shape = "auto";
    Poster.set({ on: false });
    Promise.resolve(r).then(() => {
      if (!img) return;
      if (Number(document.body.dataset.mobileStep) !== 1) document.querySelector("#stepNav button")?.click();
      setTimeout(() => { lastStep = 1; show("s0", undefined, false); }, 0);
    });
    return r;
  };
  // 4단계 첫 질문에 나온 그림 수를 영역 수에 맞춰 바로 고침
  new MutationObserver(() => {
    if (current === "s4") q.textContent = STATES.s4().q;
  }).observe($("count"), { childList: true, characterData: true, subtree: true });

  // ---------- 접기 · 세부 설정 ----------
  function setFolded(folded) {
    coach.classList.toggle("folded", folded);
    document.body.classList.toggle("coach-folded", folded);
    foldBtn.textContent = folded ? "안내 펼치기" : "접기";
    foldBtn.setAttribute("aria-expanded", String(!folded));
    try { localStorage.setItem(FOLD_KEY, folded ? "1" : "0"); } catch {}
  }
  foldBtn.onclick = () => setFolded(!coach.classList.contains("folded"));
  let folded = false;
  try { folded = localStorage.getItem(FOLD_KEY) === "1"; } catch {}
  setFolded(folded);

  const detailBtn = h("button", "detail-toggle");
  detailBtn.type = "button";
  function setDetails(open) {
    document.body.classList.toggle("simple", !open);
    detailBtn.textContent = open ? "세부 설정 숨기기" : "세부 설정 열기";
    detailBtn.setAttribute("aria-expanded", String(open));
    try { localStorage.setItem(DETAIL_KEY, open ? "1" : "0"); } catch {}
  }
  detailBtn.onclick = () => setDetails(document.body.classList.contains("simple"));
  let detailsOpen = false;
  try { detailsOpen = localStorage.getItem(DETAIL_KEY) === "1"; } catch {}
  setDetails(detailsOpen);

  // 넓은 화면은 옆 패널 맨 위, 휴대폰은 캔버스 위
  const phone = matchMedia("(max-width: 720px)");
  // 안내는 어느 화면에서나 작업 공간 위(휴대폰은 CSS로 캔버스 아래로), 세부 설정 버튼은 휴대폰만
  function place() {
    document.querySelector(".layout").before(coach);
    if (phone.matches) document.querySelector("aside").prepend(detailBtn);
    else detailBtn.remove();
  }
  place();
  phone.addEventListener("change", place);

  lastStep = Number(document.body.dataset.mobileStep) || 1;
  show(img ? stateForStep(lastStep) : "s0", undefined, false);

  // 다른 모듈(학습지 자동 인식 등)이 질문을 더하고 띄울 수 있게
  window.Coach = {
    show: (key, arg) => show(key, arg),
    register: (key, fn) => { STATES[key] = fn; },
    nameField: () => nameField(),
    segmented: (...a) => segmented(...a),
    status: () => status(),
    run: (st, work) => run(st, work),
    goStep: (n) => {
      const b = document.querySelectorAll("#stepNav button")[n - 1];
      if (b) b.click();
      else show(stateForStep(n));
    },
    h,
  };
})();
