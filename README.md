# 롯데자이언츠 포토배지 컬렉션 (모바일 웹)

NFC 굿즈를 태그하면 열리는 세로 모바일 웹 콘텐츠입니다.
`스플래시 → 비닐 뜯기(연타) → 뒷면 배지 3장 → 1장 선택·뒤집기·희귀도 연출 → 결과 → 저장/공유/팬톡 자랑하기` 흐름으로 동작하며, **컬렉션은 하루에 한 번만** 가능합니다.

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
- 배포: `main` 브랜치 push 시 GitHub Pages(Actions)와 Vercel에 자동 배포
  - https://bjisu.github.io/giants_photocard/
  - https://giants-photocard.vercel.app

## 2. 하루 1회 제한

- KST(Asia/Seoul) 자정 기준으로 리셋됩니다. 이미 뽑은 날 재접속하면 **오늘의 배지**가 다시 표시되고, 저장/공유/팬톡 자랑하기는 계속 가능합니다. 하단에 다음 컬렉션까지 남은 시간이 카운트다운됩니다.
- **개발/시연용 우회**: URL에 `?dev=1`을 붙이면 제한 없이 반복 뽑기가 가능합니다.
  예) `http://localhost:5173/?dev=1`
- 기록은 브라우저 localStorage(`giants.photocard.daily.v1`)에 저장됩니다. 서버 연동 시 서버 기준으로 교체하세요.

## 3. 배지 데이터 (107장 내장)

`public/data/cards.json`에 2026 선수단(감독 1 · 선수 106)이 들어 있고,
`public/assets/cards/<등번호>_<이름>.webp`에 공식 프로필 사진이 포함되어 있습니다.

- **이미지 교체**: 같은 파일명 규칙(`등번호_이름`)으로 넣고 `cards.json`의 `image` 경로를 맞추면 됩니다.
- **배지 추가/수정**: `cards.json`의 `cards` 배열 수정. 이미지가 없거나 로드에 실패해도 플레이스홀더(등번호/이니셜)로 끝까지 동작합니다.
- **희귀도**: 배지별 `rarity` = `normal | rare | epic | legendary`
  희귀도별 프레임: 브론즈(노멀) / 실버(레어) / 골드(에픽) / 다이아(레전더리) — `public/assets/frame/`

## 4. 튜닝 포인트 (`src/config.ts`)

| 설정 | 기본값 | 설명 |
|---|---|---|
| `CONFIG.TAPS_TO_OPEN` | 18 | 비닐 개봉에 필요한 탭 수 |
| `CONFIG.REVEAL_LOCK_SEC` | 5 | 결과 후 CTA 잠금(감상) 시간 |
| `CONFIG.DAILY_LIMIT` | true | 하루 1회 제한 on/off |
| `RARITY.weights` | 40/30/20/10 | 희귀도 확률(합 100 아니어도 자동 정규화) |
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

## 7. 서버 연동 지점 (후속)

- **뽑기 서버화**: `src/drawEngine.ts`의 `DrawEngine` 인터페이스 구현체(`serverDrawEngine`)를 추가하고 주입만 교체
- **일일 제한 서버화**: `src/daily.ts`를 서버 API 기반으로 교체
- **NFC 서명 검증 / OG 동적 렌더링**: 범위 밖(§13), 인터페이스만 열려 있음

## 8. 폴더 구조

```
├─ .github/workflows/deploy.yml # GitHub Pages 자동 배포
├─ public/
│  ├─ data/cards.json          # 배지 매니페스트 (107장)
│  └─ assets/
│     ├─ cards/<번호>_<이름>.webp # 선수 사진
│     ├─ frame/                # 희귀도 프레임 (bronze/silver/gold/diamond)
│     └─ card-back.webp        # 공통 배지 뒷면
├─ src/
│  ├─ main.ts                  # 진입점 + 상태머신 부트스트랩
│  ├─ config.ts                # 확률/탭수/문구/딥링크 튜닝
│  ├─ daily.ts                 # 하루 1회 제한 (KST)
│  ├─ drawEngine.ts            # 가중치 뽑기 (서버 교체 가능)
│  ├─ screens/                 # splash / tear / reveal / flip / result
│  ├─ fx/                      # particles / haptics
│  ├─ share/                   # capture(PNG 합성) / deeplink(팬톡)
│  └─ styles/                  # theme / global / card
```
