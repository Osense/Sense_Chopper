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
