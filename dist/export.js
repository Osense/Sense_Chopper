// 잘라 낸 그림을 다른 형태로 내보내기: 움직이는 GIF, 발표 자료(PPT).
// 라이브러리는 필요할 때만 불러옵니다. 모두 브라우저 안에서 만들어지고 서버로 보내지 않습니다.
//   vendor/gifenc.esm.js     — GIF 인코더 (gifenc, MIT)
//   vendor/pptxgen.bundle.js — PowerPoint 작성 (PptxGenJS, MIT)
const Exporter = (() => {
  let pptxLoading = null;
  function loadPptx() {
    if (window.PptxGenJS) return Promise.resolve();
    pptxLoading ||= new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = "vendor/pptxgen.bundle.js";
      s.onload = resolve;
      s.onerror = () => reject(Error("PPT 도구를 불러오지 못했어요."));
      document.head.append(s);
    });
    return pptxLoading;
  }

  // 모든 영역을 같은 크기(w×h) 캔버스에 비율 유지로 가운데 맞춰 그립니다.
  function uniformFrames(width, background = "#ffffff") {
    const ref = boxes[0];
    const height = Math.max(1, Math.round((width * ref.h) / ref.w));
    return boxes.map((b) => {
      const c = document.createElement("canvas");
      c.width = width;
      c.height = height;
      const g = c.getContext("2d");
      g.fillStyle = background;
      g.fillRect(0, 0, width, height);
      g.imageSmoothingQuality = "high";
      const f = Math.min(width / b.w, height / b.h);
      const dw = b.w * f, dh = b.h * f;
      g.drawImage(img, b.x, b.y, b.w, b.h, (width - dw) / 2, (height - dh) / 2, dw, dh);
      return c;
    });
  }

  async function gif({ width = 360, delay = 300, order = "forward", onProgress } = {}) {
    if (!boxes.length) throw Error("영역이 없어요.");
    const { GIFEncoder, quantize, applyPalette } = await import("./vendor/gifenc.esm.js");
    let frames = uniformFrames(width);
    if (order === "pingpong" && frames.length > 2) frames = frames.concat(frames.slice(1, -1).reverse());
    const enc = GIFEncoder();
    for (let i = 0; i < frames.length; i++) {
      const c = frames[i];
      const data = c.getContext("2d").getImageData(0, 0, c.width, c.height).data;
      const palette = quantize(data, 256);
      const index = applyPalette(data, palette);
      enc.writeFrame(index, c.width, c.height, { palette, delay, repeat: 0 });
      onProgress?.(i + 1, frames.length);
      await new Promise((r) => setTimeout(r, 0));
    }
    enc.finish();
    return new Blob([enc.bytes()], { type: "image/gif" });
  }

  // perSlide: 1(한 장에 하나), 4(2×2), 6(3×2)
  async function ppt({ perSlide = 1, title = "", numbers = true, onProgress } = {}) {
    if (!boxes.length) throw Error("영역이 없어요.");
    await loadPptx();
    const pptx = new window.PptxGenJS();
    pptx.layout = "LAYOUT_16x9"; // 10 × 5.625 in
    pptx.title = title || "쎈스 초퍼";
    const W = 10, H = 5.625;
    const font = "Pretendard";
    if (title.trim()) {
      const s = pptx.addSlide();
      s.background = { color: "FFFFFF" };
      s.addText(title.trim(), { x: 0.6, y: 2.0, w: W - 1.2, h: 1.0, fontFace: font, fontSize: 36, bold: true, color: "1F1D2B", align: "center" });
      s.addText(`그림 ${boxes.length}장`, { x: 0.6, y: 3.0, w: W - 1.2, h: 0.5, fontFace: font, fontSize: 16, color: "7C5CF0", align: "center" });
    }
    const grid = { 1: [1, 1], 4: [2, 2], 6: [3, 2] }[perSlide] || [1, 1];
    const [cols, rows] = grid;
    const margin = 0.35, gap = 0.25, label = numbers ? 0.32 : 0;
    const cellW = (W - margin * 2 - gap * (cols - 1)) / cols;
    const cellH = (H - margin * 2 - gap * (rows - 1)) / rows;
    let slide = null;
    for (let i = 0; i < boxes.length; i++) {
      const k = i % perSlide;
      if (k === 0) {
        slide = pptx.addSlide();
        slide.background = { color: "FFFFFF" };
      }
      const b = boxes[i];
      const scale = Math.min(1, 1600 / Math.max(b.w, b.h));
      const c = crop(b, Math.max(1, Math.round(b.w * scale)), Math.max(1, Math.round(b.h * scale)));
      const data = c.toDataURL("image/png");
      const col = k % cols, row = Math.floor(k / cols);
      const x0 = margin + col * (cellW + gap), y0 = margin + row * (cellH + gap);
      const availH = cellH - label;
      const f = Math.min(cellW / b.w, availH / b.h);
      const w = b.w * f, h = b.h * f;
      slide.addImage({ data, x: x0 + (cellW - w) / 2, y: y0 + (availH - h) / 2, w, h });
      if (numbers)
        slide.addText(String(num("start", 0, 999999) + i).padStart(2, "0"), { x: x0, y: y0 + availH, w: cellW, h: label, fontFace: font, fontSize: 11, color: "6B6F80", align: "center" });
      onProgress?.(i + 1, boxes.length);
      await new Promise((r) => setTimeout(r, 0));
    }
    return pptx.write({ outputType: "blob" });
  }

  function baseName() {
    return filename(0).replace(/_\d+\.[^.]+$/, "");
  }
  return { gif, ppt, baseName };
})();
