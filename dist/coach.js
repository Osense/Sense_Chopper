// 작업 안내 카드: 단계마다 "이제 무엇을 하면 되는지"를 질문으로 묻고, 대답 버튼으로 다음 할 일을 이어 줍니다.
// 카드 왼쪽(또는 위)에는 그 단계 장면만 반복하는 작은 애니메이션이 함께 나옵니다.
// 넓은 화면은 옆 패널 맨 위, 휴대폰은 캔버스 위에 놓이고, 접어 둘 수 있습니다(접은 상태는 기억).
(() => {
  const FOLD_KEY = "sense-chopper:coach-folded";
  const coach = document.createElement("section");
  coach.className = "coach";
  coach.setAttribute("aria-label", "단계별 안내");
  coach.innerHTML = `
    <div class="coach-anim" data-howto data-howto-step="1" aria-hidden="true"></div>
    <div class="coach-body">
      <div class="coach-top"><span class="coach-kicker"></span><button type="button" class="coach-fold ghost">접기</button></div>
      <h3 class="coach-q" tabindex="-1"></h3>
      <p class="coach-tip"></p>
      <div class="coach-extra"></div>
      <div class="coach-actions"></div>
    </div>`;
  const anim = coach.querySelector(".coach-anim");
  const kicker = coach.querySelector(".coach-kicker");
  const q = coach.querySelector(".coach-q");
  const tip = coach.querySelector(".coach-tip");
  const extra = coach.querySelector(".coach-extra");
  const actions = coach.querySelector(".coach-actions");
  const foldBtn = coach.querySelector(".coach-fold");
  Howto.mount(anim);

  const STEP_NAMES = ["불러오기 · 보정", "선 맞추기", "영역 다듬기", "저장"];
  const goNext = () => $("mobileNext").click();
  const fire = (el, type) => el.dispatchEvent(new Event(type, { bubbles: true }));

  function stepper(id, label) {
    const input = $(id);
    const wrap = document.createElement("div");
    wrap.className = "coach-stepper";
    wrap.innerHTML = `<span>${label}</span><div><button type="button" aria-label="${label} 줄이기">−</button><output></output><button type="button" aria-label="${label} 늘리기">+</button></div>`;
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

  function button(text, onClick, primary) {
    const b = document.createElement("button");
    b.type = "button";
    b.textContent = text;
    if (primary) b.className = "primary";
    b.onclick = onClick;
    return b;
  }

  // 상태마다: [단계, 질문, 도움말, 추가 요소 만들기, 버튼들]
  const STATES = {
    s1: () => [1, "불러온 학습지가 반듯한가요?",
      "조금 기울어져 있어도 괜찮아요. 기준선 하나만 그어 주면 반듯하게 펴 드려요.", null,
      [["반듯해요, 다음으로", goNext, true], ["기울어졌어요", () => show("s1b")]]],
    s1b: () => [1, "기울어진 선을 따라 한 번 그어 주세요",
      "제목 밑줄이나 표 테두리처럼 원래 수평이어야 할 선을 캔버스에서 끌어 그은 뒤 ‘보정 시작’을 누르세요. 기울기 숫자를 직접 바꿔도 돼요.", null,
      [["보정 끝, 다음으로", goNext, true], ["처음 질문으로", () => show("s1")]]],
    s2a: () => [2, "그림이 가로로 몇 개, 세로로 몇 줄 있나요?",
      "세어 보고 숫자만 넣으면 그 수만큼 선을 고르게 그려 드려요.",
      () => [stepper("cols", "가로"), stepper("rows", "세로")],
      [["선 만들기", () => { $("grid").click(); }, true]]],
    s2b: () => [2, "파란 선이 그림 가운데를 지나나요?",
      "어긋난 선은 X1 · Y1 같은 이름표를 잡고 끌어 그림 가운데로 옮겨 주세요. 조금 어긋나도 다음 단계에서 다듬을 수 있어요.", null,
      [["네, 다음으로", goNext, true], ["칸 수 다시 정하기", () => show("s2a")]]],
    s3: () => [3, "자를 영역이 그림을 잘 감싸고 있나요?",
      "넘치거나 잘린 칸은 모서리 손잡이로 크기를, 가운데 점으로 위치를 고쳐 주세요. 잘린 모습은 다음 단계에서 미리 볼 수 있어요.", null,
      [["네, 저장하러 가기", goNext, true]]],
    s4: () => [4, "파일 이름을 뭐라고 붙일까요?",
      "형식과 크기는 그대로 두어도 괜찮아요. 번호는 정한 시작 번호부터 차례로 붙어요.",
      () => {
        const box = document.createElement("label");
        box.className = "coach-name";
        box.innerHTML = `<input type="text" maxlength="80" aria-label="파일 제목"><small></small>`;
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
        return [box];
      },
      [["ZIP으로 한 번에 저장", () => { $("zip").click(); show("s4done"); }, true], ["하나씩 저장", () => { $("individual").click(); show("s4done"); }]]],
    s4done: () => [4, "다 됐어요! 저장한 파일을 확인해 보세요",
      "다른 학습지도 잘라 볼까요? 새 이미지를 불러오면 처음 단계부터 다시 안내해 드려요.", null,
      [["새 이미지 불러오기", () => $("file").click(), true], ["다시 저장하기", () => show("s4")]]],
  };

  let current = "";
  function show(key, focus) {
    current = key;
    const [step, question, help, makeExtra, buttons] = STATES[key]();
    coach.dataset.state = key;
    document.body.dataset.coach = key;
    kicker.textContent = `${step}/4 · ${STEP_NAMES[step - 1]}`;
    q.textContent = question;
    tip.textContent = help;
    extra.replaceChildren(...(makeExtra ? makeExtra() : []));
    actions.replaceChildren(...buttons.map(([t, fn, p]) => button(t, fn, p)));
    if (anim.howto && anim.dataset.playing !== String(step)) {
      anim.dataset.playing = String(step);
      anim.howto.play(step);
    }
    // 1단계 '기울어졌어요'를 고르면 기준선 그리기를 바로 켜고 보정 도구를 강조
    document.body.classList.toggle("coach-correct", key === "s1b");
    if (key === "s1b" && $("straightenOne")?.getAttribute("aria-pressed") !== "true") $("straightenOne")?.click();
    if (focus) q.focus({ preventScroll: true });
  }

  function stateForStep(step) {
    if (step === 1) return "s1";
    if (step === 2) return (typeof boxes !== "undefined" && boxes.length) || (typeof vertical !== "undefined" && vertical.length) ? "s2b" : "s2a";
    if (step === 3) return "s3";
    return "s4";
  }

  // 단계가 바뀌면 그 단계 질문으로
  let lastStep = 0;
  new MutationObserver(() => {
    const step = Number(document.body.dataset.mobileStep) || 1;
    if (step !== lastStep) {
      lastStep = step;
      show(stateForStep(step));
    }
  }).observe(document.body, { attributes: true, attributeFilter: ["data-mobile-step"] });
  // 옆 패널의 '격자로 가이드 만들기'를 직접 눌러도 다음 질문으로
  $("grid").addEventListener("click", () => {
    setTimeout(() => {
      if (current === "s2a" && ((typeof boxes !== "undefined" && boxes.length) || (typeof vertical !== "undefined" && vertical.length))) show("s2b");
    }, 0);
  });
  // 새 이미지를 불러오면 처음 질문부터
  $("file").addEventListener("change", () => {
    lastStep = 0;
    setTimeout(() => show("s1"), 0);
  });

  // 접기 · 펼치기
  function setFolded(folded) {
    coach.classList.toggle("folded", folded);
    document.body.classList.toggle("coach-folded", folded);
    foldBtn.textContent = folded ? "안내 펼치기" : "접기";
    foldBtn.setAttribute("aria-expanded", String(!folded));
    try {
      localStorage.setItem(FOLD_KEY, folded ? "1" : "0");
    } catch {}
  }
  foldBtn.onclick = () => setFolded(!coach.classList.contains("folded"));
  let folded = false;
  try {
    folded = localStorage.getItem(FOLD_KEY) === "1";
  } catch {}
  setFolded(folded);

  // 넓은 화면은 옆 패널 맨 위, 휴대폰은 캔버스 위
  const phone = matchMedia("(max-width: 720px)");
  function place() {
    if (phone.matches) document.querySelector(".layout").before(coach);
    else document.querySelector("aside").prepend(coach);
  }
  place();
  phone.addEventListener("change", place);

  lastStep = Number(document.body.dataset.mobileStep) || 1;
  show(stateForStep(lastStep));
})();
