// 휴대폰 세로 화면 전용 배치:
//  - 아래쪽 막대 하나에 [이전] [단계 진행 표시] [다음]을 모읍니다 (단계 탭 · 제목 줄 대신)
//  - 되돌리기 버튼을 화면 이동 · 확대 줄로 옮겨 캔버스 위 도구 줄을 한 줄로 줄입니다
// 휴대폰이 아니면 원래 자리로 돌려 둡니다. 버튼을 옮겨도 동작은 그대로입니다.
(() => {
  const phone = matchMedia("(max-width: 720px)");
  const prev = $("mobilePrevious"), next = $("mobileNext"), undo = $("undo");
  const stepActions = document.querySelector(".step-actions");
  const nav = document.querySelector(".canvas-navigation");
  const tools = document.querySelector(".toolbar .tools");
  const names = ["불러오기", "선 맞추기", "영역 정하기", "내보내기"];

  const bar = document.createElement("nav");
  bar.className = "phone-bar";
  bar.setAttribute("aria-label", "단계 이동");
  bar.innerHTML = `<div class="pb-progress"><div class="pb-dots">${names.map((n, i) => `<button type="button" aria-label="${i + 1}단계 ${n}로 가기"></button>`).join("")}</div><span class="pb-label"></span></div>`;
  const dots = [...bar.querySelectorAll(".pb-dots button")];
  const label = bar.querySelector(".pb-label");
  const tabs = () => [...document.querySelectorAll("#stepNav button")];
  dots.forEach((d, i) => (d.onclick = () => tabs()[i]?.click()));

  function sync() {
    const step = Number(document.body.dataset.mobileStep) || 1;
    dots.forEach((d, i) => {
      d.classList.toggle("done", i < step - 1);
      d.classList.toggle("on", i === step - 1);
      d.disabled = tabs()[i]?.disabled ?? false;
    });
    label.textContent = `${step}/4 · ${names[step - 1]}`;
  }
  new MutationObserver(sync).observe(document.body, { attributes: true, attributeFilter: ["data-mobile-step"] });

  function place() {
    if (phone.matches) {
      bar.prepend(prev);
      bar.append(next);
      if (!bar.isConnected) document.body.append(bar);
      if (nav && undo) nav.prepend(undo);
    } else {
      stepActions?.append(prev, next);
      bar.remove();
      if (tools && undo) tools.prepend(undo);
    }
    sync();
  }
  place();
  phone.addEventListener("change", place);
})();
