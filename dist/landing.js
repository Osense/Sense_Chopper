// 첫 화면: 활용 사례 광고 배경, 활용 사례 카드, 예시 학습지 체험, 화면 아무 곳에나 끌어 놓기.
(() => {
  const USES = [
    { art: "worksheet", title: "학습지 자르기", stat: "12칸 → 12장", body: "모둠 활동지 · 칸 채우기 학습지를 칸별 그림 파일로 나눠 발표 화면 · 포트폴리오에 바로 써요." },
    { art: "emoji", title: "이모티콘 만들기 활동", stat: "1장 → 이모티콘 24개", body: "칸마다 그린 표정을 ‘나의_이모티콘_01’처럼 번호 붙은 PNG로. 투명 배경 · 정사각형으로 맞춰져요." },
    { art: "cardnews", title: "카드뉴스 자르기", stat: "긴 1장 → 카드 10장", body: "한 장으로 이어 만든 카드뉴스를 장마다 나눠 SNS · 블로그 · 가정통신문에 올려요." },
    { art: "sticker", title: "스티커 · 굿즈 시안", stat: "시트 1장 → 낱장 20개", body: "스티커 시트나 굿즈 도안을 낱장 이미지로 나눠 주문 · 공유용 시안을 만들어요." },
    { art: "flash", title: "낱말 · 플래시 카드", stat: "인쇄 시트 → 카드 16장", body: "인쇄용 카드 시트를 수업 화면에 한 장씩 띄울 카드 이미지로 바꿔요." },
    { art: "comic", title: "네컷 만화 컷 나누기", stat: "4컷 → 4장", body: "학생 만화를 컷별로 나눠 발표 자료 · 영상 편집 · 전시 게시물에 써요." },
    { art: "gallery", title: "작품 사진 나누기", stat: "게시판 1컷 → 작품 15장", body: "게시판 · 칠판에 붙은 작품을 한 번에 찍고 작품별 사진으로 나눠 기록해요. 원근 보정도 돼요." },
    { art: "sprite", title: "아이콘 · 스프라이트 시트", stat: "시트 → 프레임 PNG", body: "아이콘 묶음이나 게임 스프라이트 시트를 같은 크기의 칸별 PNG로 뽑아요." },
  ];
  const INK = "#2a2a35";
  const C = ["#F2726B", "#6AA8F0", "#5CC48A", "#F2B84B", "#B48CF2", "#4FC3D8"];

  // 활용 사례 그림 (160×120): 종이 + 내용 + 점선 자르는 선 + 튀어나온 한 조각
  function art(kind) {
    let body = "", cuts = "", pop = "";
    const grid = (x0, y0, cols, rows, w, h, gap, cell) => {
      let out = "";
      for (let r = 0; r < rows; r++)
        for (let c = 0; c < cols; c++) out += cell(x0 + c * (w + gap), y0 + r * (h + gap), r * cols + c, w, h);
      return out;
    };
    const cutGrid = (x0, y0, x1, y1, cols, rows) => {
      let s = "";
      for (let c = 1; c < cols; c++) { const x = x0 + ((x1 - x0) * c) / cols; s += `<line x1="${x}" y1="${y0 - 4}" x2="${x}" y2="${y1 + 4}"/>`; }
      for (let r = 1; r < rows; r++) { const y = y0 + ((y1 - y0) * r) / rows; s += `<line x1="${x0 - 4}" y1="${y}" x2="${x1 + 4}" y2="${y}"/>`; }
      return s;
    };
    const faceS = (cx, cy, r, i) =>
      `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${C[i % C.length]}"/><circle cx="${cx - r * 0.35}" cy="${cy - r * 0.2}" r="${r * 0.13}" fill="${INK}"/><circle cx="${cx + r * 0.35}" cy="${cy - r * 0.2}" r="${r * 0.13}" fill="${INK}"/><path d="M${cx - r * 0.45} ${cy + r * 0.2} q${r * 0.45} ${r * 0.5} ${r * 0.9} 0" stroke="${INK}" stroke-width="1.4" fill="none" stroke-linecap="round"/>`;
    switch (kind) {
      case "worksheet":
        body = `<rect x="26" y="10" width="108" height="100" rx="3" class="ua-paper"/><rect x="34" y="17" width="44" height="4" rx="2" fill="#c9cbd6"/>` +
          grid(34, 27, 4, 3, 21, 23, 2, (x, y, i, w, h) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="none" stroke="#d3d5df"/>` + (i % 3 === 0 ? `<path d="M${x + 4} ${y + 17} l6 -10 l6 10z" fill="${C[i % 6]}"/>` : i % 3 === 1 ? `<circle cx="${x + w / 2}" cy="${y + h / 2}" r="6" fill="${C[(i + 1) % 6]}"/>` : `<rect x="${x + 5}" y="${y + 6}" width="11" height="11" rx="2" fill="${C[(i + 2) % 6]}"/>`));
        cuts = cutGrid(34, 27, 125, 100, 4, 3);
        pop = `<rect x="0" y="0" width="21" height="23" class="ua-paper"/><circle cx="10.5" cy="11.5" r="6" fill="${C[2]}"/>`;
        break;
      case "emoji":
        body = `<rect x="22" y="8" width="116" height="104" rx="3" class="ua-paper"/>` + grid(30, 16, 4, 3, 23, 27, 3, (x, y, i, w, h) => faceS(x + w / 2, y + h / 2, 9, i));
        cuts = cutGrid(30, 16, 131, 103, 4, 3);
        pop = `<rect x="0" y="0" width="26" height="28" rx="3" class="ua-paper"/>${faceS(13, 14, 9, 3)}`;
        break;
      case "cardnews":
        body = grid(18, 22, 4, 1, 28, 74, 4, (x, y, i, w, h) =>
          `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="2" fill="${["#7C5CF0", "#fff", "#fff", "#38BCD8"][i]}" stroke="#d3d5df"/><rect x="${x + 4}" y="${y + 8}" width="${w - 8}" height="5" rx="1.5" fill="${i === 0 || i === 3 ? "#fff" : INK}"/><rect x="${x + 4}" y="${y + 17}" width="${w - 12}" height="3" rx="1.5" fill="${i === 0 || i === 3 ? "#ffffffb0" : "#c9cbd6"}"/><rect x="${x + 4}" y="${y + 40}" width="${w - 8}" height="22" rx="2" fill="${i === 0 || i === 3 ? "#ffffff40" : C[i]}"/>`) +
          `<rect x="146" y="22" width="0" height="0"/>`;
        cuts = `<line x1="48" y1="16" x2="48" y2="102"/><line x1="80" y1="16" x2="80" y2="102"/><line x1="112" y1="16" x2="112" y2="102"/>`;
        pop = `<rect x="0" y="0" width="28" height="74" rx="2" fill="#38BCD8"/><rect x="4" y="8" width="20" height="5" rx="1.5" fill="#fff"/><rect x="4" y="40" width="20" height="22" rx="2" fill="#ffffff40"/>`;
        break;
      case "sticker":
        body = `<rect x="22" y="8" width="116" height="104" rx="6" class="ua-paper"/>` + grid(30, 15, 5, 4, 18, 20, 4, (x, y, i, w, h) =>
          i % 2 ? `<rect x="${x}" y="${y + 1}" width="${w}" height="${h - 2}" rx="6" fill="${C[i % 6]}" stroke="#fff" stroke-width="2"/>` : `<circle cx="${x + w / 2}" cy="${y + h / 2}" r="${w / 2}" fill="${C[(i + 3) % 6]}" stroke="#fff" stroke-width="2"/>`);
        cuts = cutGrid(30, 15, 132, 107, 5, 4);
        pop = `<circle cx="11" cy="11" r="10" fill="${C[4]}" stroke="#fff" stroke-width="2.5"/>`;
        break;
      case "flash":
        body = `<rect x="22" y="8" width="116" height="104" rx="3" class="ua-paper"/>` + grid(30, 16, 4, 4, 23, 20, 3, (x, y, i, w, h) =>
          `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="3" fill="none" stroke="#c9cbd6"/><text x="${x + w / 2}" y="${y + h / 2 + 4.5}" text-anchor="middle" font-size="12" font-weight="800" fill="${C[i % 6]}">${"ㄱㄴㄷㄹABCD가나다라1234"[i]}</text>`);
        cuts = cutGrid(30, 16, 131, 105, 4, 4);
        pop = `<rect x="0" y="0" width="23" height="20" rx="3" class="ua-paper"/><text x="11.5" y="15" text-anchor="middle" font-size="12" font-weight="800" fill="${C[0]}">가</text>`;
        break;
      case "comic":
        body = `<rect x="44" y="6" width="72" height="108" rx="2" class="ua-paper"/>` + grid(50, 12, 1, 4, 60, 22, 3, (x, y, i, w, h) =>
          `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="none" stroke="${INK}" stroke-width="1.3"/><circle cx="${x + 16 + i * 6}" cy="${y + 9}" r="4" fill="none" stroke="${INK}" stroke-width="1.2"/><path d="M${x + 16 + i * 6} ${y + 13} v6" stroke="${INK}" stroke-width="1.2"/><rect x="${x + 34 - i * 4}" y="${y + 3}" width="18" height="7" rx="3.5" fill="none" stroke="${INK}" stroke-width="1"/>`);
        cuts = `<line x1="40" y1="35.5" x2="120" y2="35.5"/><line x1="40" y1="60.5" x2="120" y2="60.5"/><line x1="40" y1="85.5" x2="120" y2="85.5"/>`;
        pop = `<rect x="0" y="0" width="60" height="22" class="ua-paper" stroke="${INK}"/><circle cx="22" cy="9" r="4" fill="none" stroke="${INK}" stroke-width="1.2"/><rect x="34" y="3" width="18" height="7" rx="3.5" fill="none" stroke="${INK}"/>`;
        break;
      case "gallery":
        body = `<path d="M14 14 L146 6 L150 114 L10 108 Z" fill="#3d6b52"/>` + grid(24, 18, 5, 3, 20, 24, 4, (x, y, i, w, h) =>
          `<g transform="rotate(${(i % 3) - 1} ${x + w / 2} ${y + h / 2})"><rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#fff"/><path d="M${x + 3} ${y + h - 5} q${w / 4} -${h / 2} ${w / 2} -2 t${w / 2 - 6} -6" stroke="${C[i % 6]}" stroke-width="2.4" fill="none"/></g><circle cx="${x + w / 2}" cy="${y + 2}" r="1.6" fill="#E0712F"/>`);
        cuts = cutGrid(24, 18, 140, 100, 5, 3);
        pop = `<rect x="0" y="0" width="20" height="24" fill="#fff"/><path d="M3 19 q5 -12 10 -2 t4 -6" stroke="${C[1]}" stroke-width="2.4" fill="none"/>`;
        break;
      case "sprite":
        body = `<rect x="22" y="14" width="116" height="92" rx="3" fill="#1f1d2b"/>` + grid(28, 20, 6, 4, 15, 18, 3, (x, y, i, w, h) => {
          const col = C[(i >> 1) % 6], f = i % 6;
          return `<rect x="${x + 4}" y="${y + 3}" width="7" height="6" fill="${col}"/><rect x="${x + 3}" y="${y + 9}" width="9" height="5" fill="${col}" opacity=".8"/><rect x="${x + 3 + (f % 2) * 4}" y="${y + 14}" width="3" height="3" fill="${col}"/><rect x="${x + 9 - (f % 2) * 4}" y="${y + 14}" width="3" height="3" fill="${col}"/>`;
        });
        cuts = cutGrid(28, 20, 133, 107 - 6, 6, 4);
        pop = `<rect x="0" y="0" width="15" height="18" rx="2" fill="#1f1d2b"/><rect x="4" y="3" width="7" height="6" fill="${C[3]}"/><rect x="3" y="9" width="9" height="5" fill="${C[3]}"/>`;
        break;
    }
    const at = { worksheet: "124 2 12", emoji: "122 0 10", cardnews: "128 14 9", sticker: "130 2 0", flash: "126 4 10", comic: "96 92 -6", gallery: "130 4 9", sprite: "136 6 10" }[kind].split(" ");
    return `<svg viewBox="0 0 160 120" class="ua" aria-hidden="true"><g class="ua-body">${body}</g><g class="ua-cuts">${cuts}</g><g class="ua-pop" transform="translate(${at[0]} ${at[1]}) rotate(${at[2]})">${pop}</g></svg>`;
  }

  // 1) 광고 배경: 사례 포스터가 기울어진 줄을 따라 천천히 흘러갑니다
  const wall = $("adWall");
  if (wall) {
    const rows = [USES.slice(0, 4).concat(USES.slice(4, 6)), USES.slice(4).concat(USES.slice(0, 2)), USES.slice(2, 6).concat(USES.slice(6))];
    wall.innerHTML = '<div class="ad-tilt">' + rows
      .map((row, r) => {
        const cards = row
          .map((u) => `<div class="ad-card"><div class="ad-art">${art(u.art)}</div><div class="ad-copy"><b>${u.title}</b><span>${u.stat}</span></div></div>`)
          .join("");
        return `<div class="ad-row" style="--dur:${[70, 84, 76][r]}s;--dir:${r % 2 ? "reverse" : "normal"}"><div class="ad-track">${cards}${cards}</div></div>`;
      })
      .join("") + "</div>";
  }

  // 2) 활용 사례 카드
  const grid = $("usecaseGrid");
  if (grid)
    grid.innerHTML = USES.map(
      (u) => `<li class="usecase"><div class="usecase-art">${art(u.art)}</div><div><span class="usecase-stat">${u.stat}</span><h3>${u.title}</h3><p>${u.body}</p></div></li>`,
    ).join("");

  // 3) 예시 학습지 만들어서 바로 체험
  function sampleSheet() {
    const W = 1200, H = 1560, cv = document.createElement("canvas");
    cv.width = W; cv.height = H;
    const g = cv.getContext("2d");
    g.fillStyle = "#e9e7e1"; g.fillRect(0, 0, W, H);
    g.save();
    g.translate(W / 2, H / 2); g.rotate((-1.4 * Math.PI) / 180); g.translate(-W / 2, -H / 2);
    g.fillStyle = "#fff"; g.shadowColor = "rgba(0,0,0,.18)"; g.shadowBlur = 24; g.fillRect(70, 60, W - 140, H - 120); g.shadowBlur = 0;
    g.fillStyle = INK; g.font = "800 46px 'Pretendard Variable', sans-serif"; g.fillText("이모티콘 만들기 학습지", 120, 150);
    g.font = "500 28px 'Pretendard Variable', sans-serif"; g.fillStyle = "#666"; g.fillText("칸마다 나만의 표정을 그려 보세요.      6학년 ( )반 이름: ____________", 120, 200);
    const cols = 3, rows = 4, cw = 300, ch = 300, gx = 45, gy = 30, x0 = 135, y0 = 250;
    const mouths = ["smile", "o", "wink", "grin", "flat", "smile"];
    for (let r = 0; r < rows; r++)
      for (let c = 0; c < cols; c++) {
        const i = r * cols + c, x = x0 + c * (cw + gx), y = y0 + r * (ch + gy), cx = x + cw / 2, cy = y + ch / 2;
        g.strokeStyle = "#b9bcc8"; g.lineWidth = 3; g.setLineDash([12, 10]); g.strokeRect(x, y, cw, ch); g.setLineDash([]);
        g.fillStyle = C[i % 6]; g.strokeStyle = INK; g.lineWidth = 6;
        g.beginPath(); g.arc(cx + ((i * 7) % 11) - 5, cy + 8, 96, 0, Math.PI * 2); g.fill(); g.stroke();
        g.fillStyle = INK;
        const m = mouths[i % 6];
        g.beginPath(); g.arc(cx - 34, cy - 14, 11, 0, 7); g.fill();
        if (m === "wink") { g.beginPath(); g.moveTo(cx + 22, cy - 14); g.lineTo(cx + 48, cy - 14); g.stroke(); }
        else { g.beginPath(); g.arc(cx + 34, cy - 14, 11, 0, 7); g.fill(); }
        g.beginPath();
        if (m === "o") { g.arc(cx, cy + 40, 16, 0, 7); g.stroke(); }
        else if (m === "flat") { g.moveTo(cx - 30, cy + 44); g.lineTo(cx + 30, cy + 44); g.stroke(); }
        else if (m === "grin") { g.moveTo(cx - 44, cy + 26); g.lineTo(cx + 44, cy + 26); g.quadraticCurveTo(cx, cy + 90, cx - 44, cy + 26); g.fillStyle = "#fff"; g.fill(); g.stroke(); }
        else { g.moveTo(cx - 42, cy + 28); g.quadraticCurveTo(cx, cy + 74, cx + 42, cy + 28); g.stroke(); }
        g.fillStyle = "#999"; g.font = "500 24px 'Pretendard Variable', sans-serif"; g.fillText(String(i + 1), x + 12, y + 32);
      }
    g.restore();
    return new Promise((res) => cv.toBlob((b) => res(new File([b], "예시_이모티콘_학습지.png", { type: "image/png" })), "image/png"));
  }
  $("trySample").onclick = async () => {
    const file = await sampleSheet();
    load(file);
  };

  // 4) 첫 화면 어디에 끌어 놓아도 불러오기
  let depth = 0;
  const landing = document.querySelector(".landing");
  const isFiles = (e) => [...(e.dataTransfer?.types || [])].includes("Files");
  window.addEventListener("dragenter", (e) => {
    if (document.body.classList.contains("has-image") || !isFiles(e)) return;
    depth++; landing.classList.add("drag");
  });
  window.addEventListener("dragleave", () => {
    if (--depth <= 0) { depth = 0; landing.classList.remove("drag"); }
  });
  window.addEventListener("dragover", (e) => {
    if (!document.body.classList.contains("has-image") && isFiles(e)) e.preventDefault();
  });
  window.addEventListener("drop", (e) => {
    if (document.body.classList.contains("has-image") || !isFiles(e)) return;
    e.preventDefault(); depth = 0; landing.classList.remove("drag");
    load(e.dataTransfer.files[0]);
  });
})();
