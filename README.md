# 쎈스 초퍼 (Sense Chopper)

WSNS studio [웨스엔에스 스튜디오]의 웹앱입니다. 학습지나 스캔한 종이 한 장에 그린 여러 그림을 격자에 맞춰 칸마다 잘라 내고, 이름을 붙여 한 번에 저장합니다. 이미지 처리는 모두 브라우저 안에서 하며 서버 · 데이터베이스 · API 키가 없습니다. 무료입니다.

- 서비스 주소: https://osense.github.io/Sense_Chopper/
- 제품 소개: https://osense.github.io/WesNS/products/sense-chopper/

## 작업 흐름 (4단계)

| 단계 | 하는 일 | 주요 파일 |
|---|---|---|
| 1. 불러오기 · 기울기 보정 | 이미지 불러오기, 회전 각도 조절, 선 1개(수평) · 선 4개(원근) 보정 | `app.js`, `rotation.js`, `correction*.js` |
| 2. 가로 · 세로선 맞추기 | 칸 수로 격자 만들기, 가이드 선을 그림 가운데로 끌기 | `guides.js` |
| 3. 자를 영역 다듬기 | 교점마다 생긴 영역을 가운데 점 · 테두리 손잡이로 조절 | `frame-resize.js`, `dimensions.js` |
| 4. 저장하기 | 파일 이름 · 형식 · 크기, 개별 · 선택 · ZIP 저장 | `app.js`, `file-save.js` |

가로 화면(PC · 가로로 든 태블릿, 너비 900px 이상)은 한 화면에 꽉 차는 작업 공간입니다. 단계 탭은 머리글 가운데, 옆 패널은 따로 스크롤되고, 캔버스가 남은 높이를 모두 씁니다. 기울기 · 원근 보정 도구는 옆 패널에 들어갑니다. 세로로 든 태블릿과 휴대폰은 단계 탭이 화면 아래에 고정되고, 휴대폰에서는 캔버스가 위, 설정이 아래로 쌓입니다.

이미지를 불러오기 전 첫 화면은 활용 사례(학습지 · 이모티콘 활동 · 카드뉴스 · 스티커 · 낱말 카드 · 네컷 만화 · 작품 사진 · 스프라이트)를 광고처럼 흘려 보여 주는 배경, 사용법 애니메이션, 예시 학습지 체험 버튼으로 구성됩니다.

## 실행

Node.js 20 이상이 필요합니다. 외부 패키지가 없어 `npm install`은 필요 없습니다.

```sh
npm run dev   # http://localhost:5173
npm test      # 회귀검사
```

원근 보정은 Web Worker를 쓰므로 HTML을 더블 클릭하지 말고 위 방법으로 실행하세요.

## 파일 구조

`dist` 폴더가 원본이자 배포본입니다. 빌드 과정이 없습니다.

| 파일 | 역할 |
|---|---|
| `dist/index.html` | 화면 구성, 머리글(WSNS studio 로고 · 발음 표기), 사용법 창 |
| `dist/style.css` | 전체 스타일 하나로 통합 (WSNS 디자인 토큰, 밝게 · 어둡게, 반응형) |
| `dist/app.js` | 이미지 불러오기, 영역, 미리보기, 출력 크기, PNG · ZIP 저장 |
| `dist/guides.js` | 가이드 선 · 격자, 영역 자동 맞춤 |
| `dist/dimensions.js` | 영역 크기 · 비율 입력 |
| `dist/rotation.js` | 회전 · 캔버스 확장 |
| `dist/navigation.js` | 화면 이동 · 확대 · 터치 |
| `dist/correction.js`, `correction-math.js`, `correction-worker.js` | 기준선 보정 UI · 계산 · 백그라운드 처리 |
| `dist/mobile-steps.js` | 4단계 흐름 (단계 탭, 이전 · 다음, 단계별 보이기) |
| `dist/frame-resize.js` | 영역 가운데 점 · 테두리 손잡이 |
| `dist/file-save.js` | 휴대폰 · 앱 안 브라우저 저장(공유해서 저장) |
| `dist/shell.js` | 밝게 · 어둡게 전환, 사용법 창, 보정 도구 패널 배치, 캔버스 크기 변화 감지 |
| `dist/howto.js` | 사용법 애니메이션 (첫 화면 · 사용법 창, 화면에 보일 때만 재생, 움직임 줄이기 설정 존중) |
| `dist/landing.js` | 첫 화면 활용 사례 배경 · 카드, 예시 학습지 생성, 화면 전체 끌어 놓기 |
| `dist/brand/wsns-mark.svg` | WSNS 정사각형 로고 (WesNS 레포 `public/brand`와 같은 파일) |
| `dist/fonts/` | Pretendard · JetBrains Mono (OFL) |
| `verify*.cjs` | 회귀검사 |

## 배포

`main`에 푸시하면 `.github/workflows/pages.yml`이 검사를 통과한 뒤 `dist`를 GitHub Pages에 배포합니다. 레포 **Settings → Pages → Source: GitHub Actions**가 켜져 있어야 합니다.

## 버전

0.2.0 — 가로 화면(PC · 태블릿) 꽉 찬 작업 공간, 사용법 애니메이션, 활용 사례 첫 화면

0.1.0 — 크롭노트(배포 버전 7)를 쎈스 초퍼로 이름을 바꾸고 WSNS 디자인으로 다시 정리
