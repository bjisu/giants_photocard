# 롯데자이언츠 포토카드 카드깡 (모바일 웹)

NFC 굿즈를 태그하면 열리는 세로 모바일 웹 콘텐츠입니다.
`스플래시 → 비닐 뜯기(연타) → 뒷면 카드 3장 → 1장 선택·뒤집기·희귀도 연출 → 결과 → 저장/공유/팬톡 자랑하기` 흐름으로 동작하며, **카드깡은 하루에 한 번만** 가능합니다.

제작: 비글즈(Bigglz) · 대상: 롯데자이언츠 · v1.0

---

## 1. 실행 방법

```bash
npm install
npm run dev        # 개발 서버 (http://localhost:5173)
npm run build      # 프로덕션 빌드 → dist/
npm run preview    # 빌드 결과 로컬 확인
```

- 모바일 확인: `npm run dev` 실행 후 같은 Wi-Fi의 휴대폰에서 `http://<PC IP>:5173` 접속
- 배포: `dist/`를 정적 호스팅에 업로드 (**HTTPS 필수** — NFC/Web Share 정책)

## 2. 하루 1회 제한

- KST(Asia/Seoul) 자정 기준으로 리셋됩니다. 이미 뽑은 날 재접속하면 **오늘의 카드**가 다시 표시되고, 저장/공유/팬톡 자랑하기는 계속 가능합니다. 하단에 다음 카드깡까지 남은 시간이 카운트다운됩니다.
- **개발/시연용 우회**: URL에 `?dev=1`을 붙이면 제한 없이 반복 뽑기가 가능합니다.
  예) `http://localhost:5173/?dev=1`
- 기록은 브라우저 localStorage(`giants.photocard.daily.v1`)에 저장됩니다. 서버 연동 시 서버 기준으로 교체하세요.

## 3. 카드 데이터 (137장 내장)

`public/data/cards.json`에 2026 선수단 전원(감독 1 · 코치 32 · 선수 104)이 들어 있고,
`public/assets/cards/card-001.png ~ card-137.png`에 PDF에서 추출한 실제 사진이 포함되어 있습니다.

- **고해상도 이미지 교체**: 같은 파일명으로 덮어쓰기만 하면 됩니다 (권장 750×1050px, 5:7)
- **카드 추가/수정**: `cards.json`의 `cards` 배열 수정. 이미지가 없거나 로드에 실패해도 플레이스홀더(등번호/이니셜)로 끝까지 동작합니다.
- **희귀도**: 카드별 `rarity` = `normal | rare | epic | legendary`
  현재 레전더리 4장(김태형 감독, 박세웅, 전준우, 윤동희 — 싸인 카드 표시 ✦), 에픽 13장, 레어 27장, 나머지 노멀.

## 4. 튜닝 포인트 (`src/config.ts`)

| 설정 | 기본값 | 설명 |
|---|---|---|
| `CONFIG.TAPS_TO_OPEN` | 18 | 비닐 개봉에 필요한 탭 수 |
| `CONFIG.REVEAL_LOCK_SEC` | 5 | 결과 후 CTA 잠금(감상) 시간 |
| `CONFIG.DAILY_LIMIT` | true | 하루 1회 제한 on/off |
| `RARITY.weights` | 60/25/12/3 | 희귀도 확률(합 100 아니어도 자동 정규화) |
| `COPY.*` | — | 모든 화면 문구 |
| `LINKS.fanTalkEnabled` | false | 팬톡 딥링크 활성화 스위치 |
| `LINKS.fanTalkDeepLink` | 템플릿 | 롯데 앱팀 확정값으로 교체 |

## 5. 팬톡 연동 (Stub)

- 현재 `LINKS.fanTalkEnabled=false` → 버튼은 "연동 준비 중" 토스트로 폴백합니다.
- 딥링크 스킴이 확정되면 `fanTalkEnabled: true`로 바꾸고 `fanTalkDeepLink`/`storeFallback`을 교체하세요.
- 앱 웹뷰 내부라면 `window.GiantsBridge.openFanTalk(payload)`가 있을 경우 자동으로 우선 사용합니다.

## 6. NFC 진입 파라미터

NFC 태그에는 웹 URL이 기록됩니다: `https://<host>/?g=PC26-SW-0421&s=2026`
- `g`: 굿즈 ID (현재 로그만), `s`: 시즌, `sig`: 서명(서버 연동 시 검증)

## 7. 사운드 (옵션)

`public/assets/sfx/`에 `tear.mp3`, `reveal.mp3`, `legendary.mp3`를 넣으면 자동 재생됩니다. 없으면 무음으로 동작합니다. 우상단 🔊 버튼으로 on/off.

## 8. 서버 연동 지점 (후속)

- **뽑기 서버화**: `src/drawEngine.ts`의 `DrawEngine` 인터페이스 구현체(`serverDrawEngine`)를 추가하고 주입만 교체
- **일일 제한 서버화**: `src/daily.ts`를 서버 API 기반으로 교체
- **NFC 서명 검증 / OG 동적 렌더링**: 범위 밖(§13), 인터페이스만 열려 있음

## 9. 폴더 구조

```
├─ public/
│  ├─ data/cards.json          # 카드 매니페스트 (137장)
│  └─ assets/
│     ├─ cards/card-XXX.png    # 선수/코치 사진
│     ├─ card-back.png         # 공통 카드 뒷면
│     └─ sfx/                  # (옵션) 효과음
├─ src/
│  ├─ main.ts                  # 진입점 + 상태머신 부트스트랩
│  ├─ config.ts                # 확률/탭수/문구/딥링크 튜닝
│  ├─ daily.ts                 # 하루 1회 제한 (KST)
│  ├─ drawEngine.ts            # 가중치 뽑기 (서버 교체 가능)
│  ├─ screens/                 # splash / tear / reveal / flip / result
│  ├─ fx/                      # particles / haptics / sfx
│  ├─ share/                   # capture(PNG 합성) / deeplink(팬톡)
│  └─ styles/                  # theme / global / card
```
