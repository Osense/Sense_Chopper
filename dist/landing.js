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
    { art: "poster", title: "포스터 크게 인쇄", stat: "그림 1장 → A4 9장", body: "한 그림을 여러 장에 나눠 인쇄하고 풀칠 영역에 이어 붙이면 교실 벽을 채우는 큰 작품이 돼요. 여백 없는 인쇄가 안 되는 프린터도 괜찮아요." },
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
    // 자르는 선은 칸 배치와 같은 값으로 계산해 언제나 칸 사이 틈 한가운데에 와요
    const gridCuts = (x0, y0, cols, rows, w, h, gap, pad = 4) => {
      const W = cols * w + (cols - 1) * gap, H = rows * h + (rows - 1) * gap;
      let s = "";
      for (let c = 1; c < cols; c++) { const x = x0 + c * (w + gap) - gap / 2; s += `<line x1="${x}" y1="${y0 - pad}" x2="${x}" y2="${y0 + H + pad}"/>`; }
      for (let r = 1; r < rows; r++) { const y = y0 + r * (h + gap) - gap / 2; s += `<line x1="${x0 - pad}" y1="${y}" x2="${x0 + W + pad}" y2="${y}"/>`; }
      return s;
    };
    // 종이(px, py, pw, ph) 가운데에 격자를 놓을 때의 시작점
    const center = (px, pw, n, size, gap) => px + (pw - (n * size + (n - 1) * gap)) / 2;
    const faceS = (cx, cy, r, i) =>
      `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${C[i % C.length]}"/><circle cx="${cx - r * 0.35}" cy="${cy - r * 0.2}" r="${r * 0.13}" fill="${INK}"/><circle cx="${cx + r * 0.35}" cy="${cy - r * 0.2}" r="${r * 0.13}" fill="${INK}"/><path d="M${cx - r * 0.45} ${cy + r * 0.2} q${r * 0.45} ${r * 0.5} ${r * 0.9} 0" stroke="${INK}" stroke-width="1.4" fill="none" stroke-linecap="round"/>`;
    switch (kind) {
      case "worksheet":
        body = `<rect x="26" y="10" width="108" height="100" rx="3" class="ua-paper"/><rect x="34" y="17" width="44" height="4" rx="2" fill="#c9cbd6"/>` +
          grid(center(26, 108, 4, 21, 2), 27, 4, 3, 21, 23, 2, (x, y, i, w, h) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="none" stroke="#d3d5df"/>` + (i % 3 === 0 ? `<path d="M${x + 4} ${y + 17} l6 -10 l6 10z" fill="${C[i % 6]}"/>` : i % 3 === 1 ? `<circle cx="${x + w / 2}" cy="${y + h / 2}" r="6" fill="${C[(i + 1) % 6]}"/>` : `<rect x="${x + 5}" y="${y + 6}" width="11" height="11" rx="2" fill="${C[(i + 2) % 6]}"/>`));
        cuts = gridCuts(center(26, 108, 4, 21, 2), 27, 4, 3, 21, 23, 2);
        pop = `<rect x="0" y="0" width="21" height="23" class="ua-paper"/><circle cx="10.5" cy="11.5" r="6" fill="${C[2]}"/>`;
        break;
      case "emoji":
        body = `<rect x="22" y="8" width="116" height="104" rx="3" class="ua-paper"/>` + grid(center(22, 116, 4, 23, 3), center(8, 104, 3, 27, 3), 4, 3, 23, 27, 3, (x, y, i, w, h) => faceS(x + w / 2, y + h / 2, 9, i));
        cuts = gridCuts(center(22, 116, 4, 23, 3), center(8, 104, 3, 27, 3), 4, 3, 23, 27, 3);
        pop = `<rect x="0" y="0" width="26" height="28" rx="3" class="ua-paper"/>${faceS(13, 14, 9, 3)}`;
        break;
      case "cardnews":
        body = grid(18, 22, 4, 1, 28, 74, 4, (x, y, i, w, h) =>
          `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="2" fill="${["#7C5CF0", "#fff", "#fff", "#38BCD8"][i]}" stroke="#d3d5df"/><rect x="${x + 4}" y="${y + 8}" width="${w - 8}" height="5" rx="1.5" fill="${i === 0 || i === 3 ? "#fff" : INK}"/><rect x="${x + 4}" y="${y + 17}" width="${w - 12}" height="3" rx="1.5" fill="${i === 0 || i === 3 ? "#ffffffb0" : "#c9cbd6"}"/><rect x="${x + 4}" y="${y + 40}" width="${w - 8}" height="22" rx="2" fill="${i === 0 || i === 3 ? "#ffffff40" : C[i]}"/>`) +
          `<rect x="146" y="22" width="0" height="0"/>`;
        cuts = gridCuts(18, 22, 4, 1, 28, 74, 4, 6);
        pop = `<rect x="0" y="0" width="28" height="74" rx="2" fill="#38BCD8"/><rect x="4" y="8" width="20" height="5" rx="1.5" fill="#fff"/><rect x="4" y="40" width="20" height="22" rx="2" fill="#ffffff40"/>`;
        break;
      case "sticker":
        body = `<rect x="22" y="8" width="116" height="104" rx="6" class="ua-paper"/>` + grid(center(22, 116, 5, 18, 4), center(8, 104, 4, 20, 4), 5, 4, 18, 20, 4, (x, y, i, w, h) =>
          i % 2 ? `<rect x="${x}" y="${y + 1}" width="${w}" height="${h - 2}" rx="6" fill="${C[i % 6]}" stroke="#fff" stroke-width="2"/>` : `<circle cx="${x + w / 2}" cy="${y + h / 2}" r="${w / 2}" fill="${C[(i + 3) % 6]}" stroke="#fff" stroke-width="2"/>`);
        cuts = gridCuts(center(22, 116, 5, 18, 4), center(8, 104, 4, 20, 4), 5, 4, 18, 20, 4);
        pop = `<circle cx="11" cy="11" r="10" fill="${C[4]}" stroke="#fff" stroke-width="2.5"/>`;
        break;
      case "flash":
        body = `<rect x="22" y="8" width="116" height="104" rx="3" class="ua-paper"/>` + grid(center(22, 116, 4, 23, 3), center(8, 104, 4, 20, 3), 4, 4, 23, 20, 3, (x, y, i, w, h) =>
          `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="3" fill="none" stroke="#c9cbd6"/><text x="${x + w / 2}" y="${y + h / 2 + 4.5}" text-anchor="middle" font-size="12" font-weight="800" fill="${C[i % 6]}">${"ㄱㄴㄷㄹABCD가나다라1234"[i]}</text>`);
        cuts = gridCuts(center(22, 116, 4, 23, 3), center(8, 104, 4, 20, 3), 4, 4, 23, 20, 3);
        pop = `<rect x="0" y="0" width="23" height="20" rx="3" class="ua-paper"/><text x="11.5" y="15" text-anchor="middle" font-size="12" font-weight="800" fill="${C[0]}">가</text>`;
        break;
      case "comic":
        body = `<rect x="44" y="6" width="72" height="108" rx="2" class="ua-paper"/>` + grid(50, 12, 1, 4, 60, 22, 3, (x, y, i, w, h) =>
          `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="none" stroke="${INK}" stroke-width="1.3"/><circle cx="${x + 10 + i * 4}" cy="${y + 9}" r="4" fill="none" stroke="${INK}" stroke-width="1.2"/><path d="M${x + 10 + i * 4} ${y + 13} v6" stroke="${INK}" stroke-width="1.2"/><rect x="${x + 34}" y="${y + 3}" width="18" height="7" rx="3.5" fill="none" stroke="${INK}" stroke-width="1"/>`);
        cuts = gridCuts(50, 12, 1, 4, 60, 22, 3, 10);
        pop = `<rect x="0" y="0" width="60" height="22" class="ua-paper" stroke="${INK}"/><circle cx="22" cy="9" r="4" fill="none" stroke="${INK}" stroke-width="1.2"/><rect x="34" y="3" width="18" height="7" rx="3.5" fill="none" stroke="${INK}"/>`;
        break;
      case "gallery":
        body = `<path d="M14 14 L146 6 L150 114 L10 108 Z" fill="#3d6b52"/>` + grid(center(10, 140, 5, 20, 4), center(10, 100, 3, 24, 4), 5, 3, 20, 24, 4, (x, y, i, w, h) =>
          `<g transform="rotate(${(i % 3) - 1} ${x + w / 2} ${y + h / 2})"><rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#fff"/><path d="M${x + 3} ${y + h - 5} q${w / 4} -${h / 2} ${w / 2} -2 t${w / 2 - 6} -6" stroke="${C[i % 6]}" stroke-width="2.4" fill="none"/></g><circle cx="${x + w / 2}" cy="${y + 2}" r="1.6" fill="#E0712F"/>`);
        cuts = gridCuts(center(10, 140, 5, 20, 4), center(10, 100, 3, 24, 4), 5, 3, 20, 24, 4);
        pop = `<rect x="0" y="0" width="20" height="24" fill="#fff"/><path d="M3 19 q5 -12 10 -2 t4 -6" stroke="${C[1]}" stroke-width="2.4" fill="none"/>`;
        break;
      case "poster":
        body = grid(20, 6, 3, 3, 38, 34, 3, (x, y, i, w, h) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" class="ua-paper"/><rect x="${x + w - 5}" y="${y}" width="5" height="${h}" fill="#f6e7c8"/>`) +
          `<circle cx="80" cy="60" r="40" fill="${C[3]}" stroke="${INK}" stroke-width="3" opacity=".95"/><circle cx="66" cy="50" r="5" fill="${INK}"/><circle cx="94" cy="50" r="5" fill="${INK}"/><path d="M60 70 q20 20 40 0" stroke="${INK}" stroke-width="3.5" fill="none" stroke-linecap="round"/>`;
        cuts = gridCuts(20, 6, 3, 3, 38, 34, 3);
        pop = `<rect x="0" y="0" width="38" height="34" class="ua-paper"/><path d="M0 30 q14 -18 30 -10 l0 14 h-30z" fill="${C[3]}" stroke="${INK}" stroke-width="2"/>`;
        break;
      case "sprite":
        body = `<rect x="22" y="14" width="116" height="92" rx="3" fill="#1f1d2b"/>` + grid(center(22, 116, 6, 15, 3), center(14, 92, 4, 18, 3), 6, 4, 15, 18, 3, (x, y, i, w, h) => {
          const col = C[(i >> 1) % 6], f = i % 6;
          return `<rect x="${x + 4}" y="${y + 3}" width="7" height="6" fill="${col}"/><rect x="${x + 3}" y="${y + 9}" width="9" height="5" fill="${col}" opacity=".8"/><rect x="${x + 3 + (f % 2) * 4}" y="${y + 14}" width="3" height="3" fill="${col}"/><rect x="${x + 9 - (f % 2) * 4}" y="${y + 14}" width="3" height="3" fill="${col}"/>`;
        });
        cuts = gridCuts(center(22, 116, 6, 15, 3), center(14, 92, 4, 18, 3), 6, 4, 15, 18, 3);
        pop = `<rect x="0" y="0" width="15" height="18" rx="2" fill="#1f1d2b"/><rect x="4" y="3" width="7" height="6" fill="${C[3]}"/><rect x="3" y="9" width="9" height="5" fill="${C[3]}"/>`;
        break;
    }
    const at = { poster: "120 84 -8", worksheet: "124 2 12", emoji: "122 0 10", cardnews: "128 14 9", sticker: "130 2 0", flash: "126 4 10", comic: "96 92 -6", gallery: "130 4 9", sprite: "136 6 10" }[kind].split(" ");
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

  // 3) 예시 체험: 인식 표시가 있는 학습지를 비스듬히 찍은 사진 → 자동 보정까지 바로 보여 줌
  $("trySample").onclick = async () => load(await Sheet.samplePhoto());

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

  // 5) 처음 화면으로 가기 · 작업으로 돌아가기 (작업 중인 이미지와 영역은 그대로 둬요)
  const goHome = () => {
    document.body.classList.add("at-home");
    render();
    window.scrollTo({ top: 0 });
  };
  const backToWork = () => {
    document.body.classList.remove("at-home");
    render();
    requestAnimationFrame(() => fit());
  };
  $("goHome").onclick = goHome;
  $("backToWork").onclick = backToWork;
  const loadBeforeHome = load;
  load = function (...args) {
    document.body.classList.remove("at-home");
    return loadBeforeHome.apply(this, args);
  };
})();
