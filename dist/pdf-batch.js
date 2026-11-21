// 여러 쪽 PDF(일괄 스캔한 학습지 묶음) 불러오기 · 모든 쪽 한 번에 자르기
// 1쪽을 편집 화면에 불러와 자를 영역을 정하면, 나머지 쪽도 같은 방식으로 잘라 쪽마다 폴더에 담아 ZIP 하나로 저장해요.
//  - 쎈스 초퍼 학습지: 쪽마다 네 모서리 표시를 다시 찾아 반듯하게 펴고 그 학습지의 칸으로 잘라요(스캔이 조금씩 밀려도 정확).
//  - 그 밖의 문서: 1쪽에서 정한 영역(회전 포함)을 같은 자리에 그대로 적용해요.
const PdfBatch = (() => {
  let lib = null, doc = null, info = null; // info: { name, pages }
  const DPI = 200;

  async function pdfjs() {
    if (!lib) {
      lib = await import("./vendor/pdfjs/pdf.min.mjs");
      lib.GlobalWorkerOptions.workerSrc = "vendor/pdfjs/pdf.worker.min.mjs";
    }
    return lib;
  }
  const isPdf = (f) => !!f && (f.type === "application/pdf" || /\.pdf$/i.test(f.name || ""));

  async function renderPage(n) {
    const page = await doc.getPage(n);
    let vp = page.getViewport({ scale: DPI / 72 });
    const big = Math.max(vp.width, vp.height);
    if (big > 4200) vp = page.getViewport({ scale: (DPI / 72) * (4200 / big) });
    const cv = document.createElement("canvas");
    cv.width = Math.round(vp.width);
    cv.height = Math.round(vp.height);
    const g = cv.getContext("2d");
    g.fillStyle = "#fff";
    g.fillRect(0, 0, cv.width, cv.height);
    await page.render({ canvasContext: g, viewport: vp }).promise;
    page.cleanup();
    return cv;
  }
  const toBlob = (cv, type = "image/jpeg", q = 0.93) => new Promise((r) => cv.toBlob(r, type, q));

  // ---------- 불러오기: PDF면 1쪽을 이미지로 바꿔 편집 화면에 ----------
  const loadBeforePdf = load;
  load = async function (file, ...rest) {
    if (!isPdf(file)) {
      if (file) close();
      return loadBeforePdf.call(this, file, ...rest);
    }
    toast("PDF를 여는 중…");
    let first;
    try {
      const L = await pdfjs();
      close();
      doc = await L.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise;
      first = await renderPage(1);
    } catch (e) {
      console.warn(e);
      close();
      return toast("PDF를 열지 못했어요. 암호가 걸려 있거나 손상된 파일인지 확인해 주세요.");
    }
    const base = (file.name || "문서").replace(/\.pdf$/i, "");
    const pages = doc.numPages;
    info = pages > 1 ? { name: base, pages } : null;
    if (!info) { doc.destroy(); doc = null; }
    const blob = await toBlob(first, "image/png");
    first.width = first.height = 0;
    const r = await loadBeforePdf.call(this, new File([blob], `${base}${info ? " · 1쪽" : ""}.png`, { type: "image/png" }), ...rest);
    update();
    if (info) setTimeout(() => toast(`PDF ${pages}쪽을 불러왔어요. 1쪽으로 자를 영역을 정하면 내보내기에서 모든 쪽을 한 번에 잘라요.`), 1400);
    return r;
  };
  function close() {
    try { doc?.destroy(); } catch {}
    doc = null;
    info = null;
    update();
  }

  // ---------- 작업 캔버스 위 안내 띠 ----------
  const bar = document.createElement("div");
  bar.className = "pdf-bar";
  bar.hidden = true;
  bar.innerHTML = `<span class="pdf-badge">PDF</span><span class="pdf-text"></span><button type="button" class="primary pdf-run">모든 쪽 자르기</button>`;
  const editor = document.querySelector(".editor");
  const vpEl = $("viewport");
  if (editor && vpEl) vpEl.before(bar);
  bar.querySelector(".pdf-run").onclick = () => { Coach.goStep(4); setTimeout(() => Coach.show("s4pdf"), 0); };
  function update() {
    bar.hidden = !info;
    if (info) bar.querySelector(".pdf-text").textContent = `${info.name} · ${info.pages}쪽 — 지금 보이는 1쪽으로 자를 영역을 정하면 나머지 쪽도 같은 방식으로 잘라요.`;
  }

  // ---------- 진행 창 ----------
  const prog = document.createElement("dialog");
  prog.className = "poster-progress";
  prog.innerHTML = `
    <h3>PDF 모든 쪽을 자르고 있어요</h3>
    <p class="pp-label">준비하는 중…</p>
    <div class="pp-bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><i></i></div>
    <p class="pp-meta"><span class="pp-count"></span><span class="pp-eta"></span></p>
    <div class="pp-actions"><button type="button" class="pp-cancel">취소</button></div>`;
  document.body.append(prog);
  const P = (s) => prog.querySelector(s);

  // ---------- 모든 쪽 자르기 ----------
  const pad = (n, len) => String(n).padStart(len, "0");
  async function cutAll(say) {
    if (!info || !doc) return null;
    const ctrl = new AbortController();
    const t0 = performance.now();
    P(".pp-cancel").disabled = false;
    P(".pp-cancel").textContent = "취소";
    P(".pp-cancel").onclick = () => { ctrl.abort(); P(".pp-cancel").disabled = true; P(".pp-cancel").textContent = "취소하는 중…"; };
    prog.oncancel = (e) => { e.preventDefault(); P(".pp-cancel").click(); };
    prog.onkeydown = (e) => { if (e.key === "Escape") { e.preventDefault(); if (!P(".pp-cancel").disabled) P(".pp-cancel").click(); } };
    const show = (i, n, label) => {
      const pct = Math.round((i / n) * 100);
      P(".pp-bar i").style.width = pct + "%";
      P(".pp-bar").setAttribute("aria-valuenow", pct);
      P(".pp-label").textContent = label;
      P(".pp-count").textContent = `${i} / ${n}쪽 · ${pct}%`;
      const el = (performance.now() - t0) / 1000;
      const left = i > 0 && i < n ? Math.ceil((el / i) * (n - i)) : 0;
      P(".pp-eta").textContent = left > 0 ? `남은 시간 약 ${left}초` : "";
      say?.(`자르는 중 · ${i} / ${n}쪽`);
    };
    try { prog.showModal(); } catch { prog.setAttribute("open", ""); }
    show(0, info.pages, "준비하는 중…");

    // 편집 중인 상태를 보관했다가 끝나면 그대로 되돌려요
    const keep = {
      rotationOriginal, rotationAngle,
      boxes: boxes.map((b) => ({ ...b })), vertical: vertical.slice(), horizontal: horizontal.slice(),
      freeFrames: freeFrames.map((f) => ({ ...f })), cropMode, guideAutoSize, selected,
      inputs: Object.fromEntries(["cw", "ch", "gw", "gh", "ratio", "cropMode"].map((id) => [id, $(id).value])),
      ranges: ["gw", "gh"].map((id) => $(id).max), labels: ["gwValue", "ghValue"].map((id) => $(id).textContent),
      auto: $("guideAutoSize").checked,
    };
    const raw = correctionSources.get(0) || rotationOriginal;
    const sheetMode = typeof Sheet !== "undefined" && Sheet.active();
    const manualWarp = !sheetMode && correctionSourceId !== 0;
    const files = [];
    const review = [];
    let pieces = 0;
    const width = String(info.pages).length < 2 ? 2 : String(info.pages).length;
    try {
      for (let p = 1; p <= info.pages; p++) {
        if (ctrl.signal.aborted) throw Object.assign(Error("취소"), { name: "AbortError" });
        const cv = await renderPage(p);
        let ok = false, label = "";
        // 1) 쎈스 초퍼 학습지면 그 쪽의 표시로 다시 펴고 칸을 잡음
        let found = null;
        try { found = Sheet.detect(cv); } catch {}
        if (found) {
          const { canvas, ppm } = await Sheet.rectify(cv, found);
          const T = Sheet.readTemplate(canvas, ppm);
          if (T) {
            rotationOriginal = canvas;
            rotationAngle = 0;
            paintRotation();
            Sheet.placeCells(T, ppm);
            ok = true;
            label = T.title;
          }
        }
        // 2) 일반 문서: 1쪽에서 정한 영역을 같은 자리에 (쪽 크기가 다르면 비율대로)
        if (!ok && !sheetMode) {
          rotationOriginal = cv;
          rotationAngle = keep.rotationAngle;
          paintRotation();
          const sx = cv.width / raw.width, sy = cv.height / raw.height;
          boxes = keep.boxes.map((b) => ({ ...b, x: b.x * sx, y: b.y * sy, w: b.w * sx, h: b.h * sy }));
          ok = boxes.length > 0;
        }
        const folder = `${pad(p, width)}쪽`;
        if (!ok) {
          // 학습지 표시를 못 찾은 쪽은 통째로 '확인 필요'에 담아 둬요
          review.push(p);
          files.push({ name: `확인 필요/${folder}.jpg`, blob: await toBlob(cv) });
        } else {
          for (let i = 0; i < boxes.length; i++) {
            const { w, h } = getOutputSize(boxes[i]);
            const c = crop(boxes[i], w, h);
            const blob = await toBlob(c, "image/" + $("format").value, 0.95);
            const ext = blob.type === "image/png" ? "png" : blob.type === "image/jpeg" ? "jpg" : "webp";
            files.push({ name: `${folder}/` + filename(i).replace(/\.[^.]+$/, "." + ext), blob });
            c.width = c.height = 1;
            pieces++;
          }
        }
        cv.width = cv.height = 0;
        show(p, info.pages, ok ? `${p}쪽${label ? ` · ${label}` : ""} · ${boxes.length}장` : `${p}쪽 · 학습지 표시를 못 찾아 '확인 필요'에 담았어요`);
        await new Promise((r) => setTimeout(r, 0));
      }
      P(".pp-label").textContent = "ZIP 파일로 묶는 중…";
      say?.("ZIP으로 묶는 중…");
      await new Promise((r) => setTimeout(r, 16));
      const blob = await zip(files);
      const prefix = ($("prefix").value.trim() || info.name).replace(/[<>:"/\\|?*\x00-\x1f]/g, "_");
      save(blob, `${prefix}_${info.pages}쪽.zip`);
      return { pages: info.pages, pieces, review, manualWarp };
    } catch (e) {
      if (e.name === "AbortError") { say?.("취소했어요."); return null; }
      throw e;
    } finally {
      rotationOriginal = keep.rotationOriginal;
      rotationAngle = keep.rotationAngle;
      paintRotation();
      boxes = keep.boxes; vertical = keep.vertical; horizontal = keep.horizontal; freeFrames = keep.freeFrames;
      cropMode = keep.cropMode; guideAutoSize = keep.guideAutoSize; selected = keep.selected;
      for (const [id, v] of Object.entries(keep.inputs)) $(id).value = v;
      ["gw", "gh"].forEach((id, i) => ($(id).max = keep.ranges[i]));
      ["gwValue", "ghValue"].forEach((id, i) => ($(id).textContent = keep.labels[i]));
      $("guideAutoSize").checked = keep.auto;
      rebuildPositions();
      render(false);
      prog.close?.();
      prog.removeAttribute("open");
    }
  }

  let lastRun = null;
  Coach.register("s4pdf", () => {
    const st = Coach.status();
    const sheet = typeof Sheet !== "undefined" && Sheet.active();
    return {
      step: 4,
      q: `PDF ${info?.pages ?? ""}쪽을 모두 자를까요?`,
      tip: sheet
        ? "쎈스 초퍼 학습지는 쪽마다 네 모서리 표시를 다시 찾아 반듯하게 펴고 잘라요. 쪽마다 폴더가 생기고, 표시를 못 찾은 쪽은 ‘확인 필요’ 폴더에 통째로 담겨요."
        : `1쪽에서 정한 영역 ${boxes.length}개를 모든 쪽의 같은 자리에서 잘라요. 쪽마다 폴더가 생겨요.${correctionSourceId !== 0 ? " (원근 보정은 1쪽에만 적용돼요.)" : ""}`,
      extra: () => [Coach.nameField(), Coach.segmented("형식", [["png", "PNG"], ["jpeg", "JPG"], ["webp", "WEBP"]], $("format").value, (v) => { $("format").value = v; $("format").dispatchEvent(new Event("change")); }), st],
      actions: [
        ["모든 쪽 자르기 (ZIP)", () => Coach.run(st, async (say) => { const r = await cutAll(say); if (r) { lastRun = r; Coach.show("pdfdone"); } }), true],
        ["다른 방법 고르기", () => Coach.show("s4")],
      ],
    };
  });
  Coach.register("pdfdone", () => ({
    step: 4,
    q: `${lastRun?.pages ?? ""}쪽에서 그림 ${lastRun?.pieces ?? ""}장을 잘라 ZIP으로 저장했어요!`,
    tip: lastRun?.review.length
      ? `${lastRun.review.join(", ")}쪽은 학습지 표시를 찾지 못해 ‘확인 필요’ 폴더에 통째로 담았어요. 그 쪽만 따로 불러와 잘라 주세요.`
      : "쪽마다 폴더로 나뉘어 있어요. 번호는 쪽 안에서 01부터 붙어요.",
    actions: [["다른 방법도 만들기", () => Coach.show("s4"), true]],
  }));

  return { active: () => !!info, pages: () => info?.pages ?? 0, cutAll, isPdf };
})();
