// Keep the existing controls and their handlers; steps only change visibility.
(() => {
  const mobile = window.matchMedia("(max-width: 720px)");
  let current = 1;
  const mark = (node, steps) => {
    if (node) node.dataset.mobileSteps = steps;
  };
  const cropSection = $("ratio").closest(".section");
  const sections = document.querySelectorAll("aside > .section");
  cropSection.querySelector("h2 i").textContent = "03";
  sections[2].querySelector("h2 i").textContent = "04";
  mark(sections[0], "1");
  mark(sections[2], "4");
  mark(cropSection, "2 3");
  mark(cropSection.querySelector("h2"), "3");
  mark($("cropMode").parentElement, "2 3");
  for (const child of cropSection.children) {
    if (child.contains($("cropMode")) || child.tagName === "H2") continue;
    mark(
      child,
      child.contains($("cols")) || ["grid", "gridReset"].includes(child.id)
        ? "2"
        : "3",
    );
  }
  for (const child of $("guideControls").children) {
    mark(
      child,
      child.contains($("addVertical")) ||
        child.id === "guidePositions" ||
        child === $("guideControls").firstElementChild
        ? "2"
        : "3",
    );
  }
  mark(document.querySelector(".canvas-rotation"), "1");
  mark(document.querySelector(".correction-panel"), "1");
  mark(document.querySelector(".editor"), "1 2 3");
  for (const selector of [".previewhead", "#previews", ".exportbar"])
    mark(document.querySelector(selector), "4");

  const titles = [
    "불러오기 · 기울기 보정",
    "가로 · 세로선 맞추기",
    "자를 영역 다듬기",
    "저장하기",
  ];
  const hints = [
    "이미지를 불러오고, 비뚤어졌다면 기울기를 바로잡아 주세요.",
    "칸 수를 넣어 격자를 만들고, 파란 선을 각 그림의 가운데로 끌어 맞춰 주세요.",
    "가운데 점으로 가로·세로선을 함께 옮기고, 테두리 손잡이로 크기를 조절하세요.",
    "파일 이름 · 형식 · 크기를 정하고 한 번에 저장하세요.",
  ];
  const heading = document.createElement("div");
  heading.className = "mobile-step-heading";
  heading.innerHTML =
    '<div><small id="mobileStepCount"></small><h1 id="mobileStepTitle" tabindex="-1"></h1><p id="mobileStepHint"></p></div>';
  const previousButton = document.createElement("button");
  previousButton.id = "mobilePrevious";
  previousButton.className = "step-action";
  previousButton.textContent = "‹ 이전";
  const nextButton = document.createElement("button");
  nextButton.id = "mobileNext";
  nextButton.className = "step-action primary";
  nextButton.textContent = "다음 ›";
  // Previous/next live beside the step title; the step tabs live in the header.
  const stepActions = document.createElement("div");
  stepActions.className = "step-actions";
  stepActions.append(previousButton, nextButton);
  heading.append(stepActions);
  document.querySelector(".layout").before(heading);
  const tabs = $("stepNav");
  ["불러오기", "선 정렬", "영역", "저장"].forEach((title, i) => {
    const button = document.createElement("button");
    button.type = "button";
    button.innerHTML = `<span>${i + 1}</span>${title}`;
    button.setAttribute("aria-label", `${i + 1}단계 ${titles[i]}`);
    button.onclick = () => selectStep(i + 1, true);
    tabs.append(button);
  });

  // Place frequently used guide controls before the canvas on phones.
  const guideTools = document.createElement("div");
  guideTools.className = "mobile-guide-tools";
  mark(guideTools, "2");
  const gridRow = document.createElement("div");
  gridRow.className = "mobile-grid-row";
  const lineRow = document.createElement("div");
  lineRow.className = "mobile-line-row";
  guideTools.append(gridRow, lineRow);
  document.querySelector(".layout").prepend(guideTools);
  const details = document.createElement("details");
  details.className = "mobile-guide-details";
  mark(details, "2");
  const summary = document.createElement("summary");
  summary.textContent = "선 위치 미세 조절 · 배치 방식";
  details.append(summary);
  cropSection.append(details);
  const moves = [
    [$("cols").closest(".pair"), gridRow],
    [$("grid"), gridRow],
    [$("addVertical").closest(".pair"), lineRow],
    [$("guidePositions"), details],
    [$("cropMode").parentElement, details],
    [$("gridReset"), details],
  ].map(([node, target]) => ({ node, target }));
  // Step 2 uses the same compact grid tools on every screen: above the canvas
  // on phones, at the top of the side panel on tablets and desktops.
  function arrangeControls() {
    for (const { node, target } of moves) target.append(node);
    if (mobile.matches) document.querySelector(".layout").prepend(guideTools);
    else cropSection.insertBefore(guideTools, cropSection.children[1]);
    details.open = !mobile.matches;
  }
  arrangeControls();
  mobile.addEventListener("change", arrangeControls);
  function selectStep(step, focus = false) {
    if (typeof correctionBusy !== "undefined" && correctionBusy) return;
    if (step > 1 && !img) return toast("먼저 이미지를 불러와 주세요.");
    // Suspend drawing tools while retaining correction lines and all crop data.
    if (step !== current) {
      cancelCorrectionStroke();
      guideDrag = null;
      drag = null;
    }
    current = step;
    document.body.dataset.mobileStep = String(step);
    $("mobileStepCount").textContent = `${step}/4`;
    $("mobileStepTitle").textContent = titles[step - 1];
    $("mobileStepHint").textContent = hints[step - 1];
    $("mobilePrevious").disabled = step === 1;
    $("mobileNext").disabled = step === 4 || !img;
    [...tabs.children].forEach((button, i) => {
      if (i + 1 === step) button.setAttribute("aria-current", "step");
      else button.removeAttribute("aria-current");
    });
    if (focus) {
      window.scrollTo({ top: 0, behavior: "instant" });
      $("mobileStepTitle").focus({ preventScroll: true });
    }
    requestAnimationFrame(() => {
      if (img) fit();
    });
  }
  // Ignore correction gestures outside the correction step, without clearing work.
  const drawing = correctionDrawingActive;
  correctionDrawingActive = () => drawing() && current === 1;
  $("mobilePrevious").onclick = () =>
    selectStep(Math.max(1, current - 1), true);
  $("mobileNext").onclick = () => selectStep(Math.min(4, current + 1), true);
  mobile.addEventListener("change", () => selectStep(current));
  let hadImage = false;
  function updateImageEntry() {
    const hasImage = Boolean(img);
    document.body.classList.toggle("has-image", hasImage);
    $("mobileNext").disabled = current === 4 || !hasImage;
    if (hasImage !== hadImage) {
      hadImage = hasImage;
      if (hasImage) requestAnimationFrame(() => fit());
    }
  }
  const renderBeforeEntry = render;
  render = function (...args) {
    updateImageEntry();
    return renderBeforeEntry(...args);
  };
  updateImageEntry();
  selectStep(1);
})();
