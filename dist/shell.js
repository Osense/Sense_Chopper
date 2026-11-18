// 화면 테마(밝게 · 어둡게)와 사용법 창. 편집 기능과는 따로 동작합니다.
(() => {
  const THEME_KEY = "sense-chopper:theme";
  const root = document.documentElement;
  const toggle = $("themeToggle");

  function paintThemeButton() {
    const dark = root.dataset.theme === "dark";
    toggle.querySelector("use").setAttribute("href", dark ? "#i-sun" : "#i-moon");
    toggle.querySelector("span").textContent = dark ? "밝게" : "어둡게";
    toggle.title = dark ? "밝은 화면으로" : "어두운 화면으로";
  }
  toggle.onclick = () => {
    const next = root.dataset.theme === "dark" ? "light" : "dark";
    if (next === "dark") root.dataset.theme = "dark";
    else delete root.dataset.theme;
    try {
      localStorage.setItem(THEME_KEY, next);
    } catch {}
    paintThemeButton();
  };
  paintThemeButton();

  const help = $("helpDialog");
  $("help").onclick = () => help.showModal();
  $("helpClose").onclick = () => help.close();
  help.addEventListener("click", (e) => {
    if (e.target === help) help.close();
  });
})();

// 두 칸 화면(태블릿 · PC)에서는 기울기 · 원근 보정 도구를 옆 패널로 옮겨 캔버스를 넓게 씁니다.
// 휴대폰에서는 원래대로 캔버스 위에 둡니다. 옮겨도 버튼 동작은 그대로입니다.
(() => {
  const rotateBar = document.querySelector(".canvas-rotation");
  const correction = document.querySelector(".correction-panel");
  const toolbar = document.querySelector(".toolbar");
  if (!rotateBar || !correction || !toolbar) return;
  const panel = document.createElement("div");
  panel.className = "panel-tools";
  panel.innerHTML = "<h3>기울기 · 원근 보정</h3>";
  const twoColumn = matchMedia("(min-width: 721px)");
  function place() {
    if (twoColumn.matches) {
      panel.append(rotateBar, correction);
      if (!panel.isConnected) document.querySelector("aside .section").append(panel);
    } else {
      toolbar.after(rotateBar);
      rotateBar.after(correction);
      panel.remove();
    }
    if (typeof img !== "undefined" && img) requestAnimationFrame(() => fit());
  }
  place();
  twoColumn.addEventListener("change", place);

  // 캔버스 크기가 바뀌면(단계 이동 · 화면 회전 · 패널 열림) 화면 맞춤을 다시 계산
  const viewport = $("viewport");
  let lastW = 0, lastH = 0, raf = 0;
  new ResizeObserver(() => {
    const w = viewport.clientWidth, h = viewport.clientHeight;
    if (Math.abs(w - lastW) < 2 && Math.abs(h - lastH) < 2) return;
    lastW = w; lastH = h;
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => {
      if (img && ["fit", "width", "height"].includes($("zoom").value)) fit();
    });
  }).observe(viewport);
})();
