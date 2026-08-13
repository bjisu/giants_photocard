import type { Rarity } from './types';

export const CONFIG = {
  /** 비닐 개봉에 필요한 탭 수 */
  TAPS_TO_OPEN: 18,
  /** 결과 후 CTA 잠금 시간(초) */
  REVEAL_LOCK_SEC: 5,
  /** 스플래시 최소 노출(ms) */
  SPLASH_MS: 2000,
  /** 5초 건너뛰기 노출 */
  SHOW_SKIP: true,
  /** 연타 보조(길게 눌러 한 번에 열기) 버튼 */
  ACCESSIBLE_OPEN: true,
  /** 하루 1회 컬렉션 제한 */
  DAILY_LIMIT: true,
  /** 일일 제한 리셋 기준 타임존 (KST) */
  RESET_TIMEZONE: 'Asia/Seoul',
} as const;

export const RARITY = {
  order: ['normal', 'rare', 'epic', 'legendary'] as const,
  weights: { normal: 60, rare: 25, epic: 12, legendary: 3 } as Record<Rarity, number>,
  label: { normal: '노멀 · Normal', rare: '레어 · Rare', epic: '에픽 · Epic', legendary: '레전더리 · Legendary' } as Record<Rarity, string>,
  effect: {
    normal: { glow: 12, particles: 0, confetti: false, vibrate: [10] },
    rare: { glow: 20, particles: 20, confetti: false, vibrate: [15] },
    epic: { glow: 30, particles: 40, confetti: false, vibrate: [20, 40, 20] },
    legendary: { glow: 44, particles: 80, confetti: true, vibrate: [30, 60, 30, 120] },
  } as const,
} as const;

export const COPY = {
  splash: {
    loading: '포토카드 팩을 여는 중…',
    tapToStart: '탭하여 시작',
    title: '선수단 포토카드',
    subtitle: '2026 SEASON · PLAYER CARD COLLECTION',
  },
  tear: {
    guide: '마구 탭해서 포장을 뜯어보세요!',
    gauge: '개봉 {n}%',
    holdToOpen: '꾹 눌러서 한 번에 열기',
  },
  reveal: {
    guide: '운명의 한 장을 선택하세요',
  },
  result: {
    badge: '{RARITY}',
    legendary: '레전더리 카드 획득!',
    todayChip: '오늘의 카드',
    skip: '건너뛰기',
    countdown: '다음 컬렉션까지 {t}',
    comeBack: '컬렉션은 하루에 한 번! 내일 다시 만나요',
  },
  share: {
    text: '{player} 카드를 뽑았어요! #롯데자이언츠 #포토카드컬렉션',
    save: '저장',
    share: '공유',
    fanTalk: '팬톡에 자랑하기',
    redraw: '다시 뽑기',
    saved: '갤러리에 저장할 이미지를 내려받았어요',
    fanTalkPending: '팬톡 연동 준비 중이에요! 저장·공유로 먼저 자랑해 보세요',
  },
} as const;

export const LINKS = {
  /** 팬톡 딥링크 확정 전까지 false → 버튼은 안내 토스트로 폴백 */
  fanTalkEnabled: false,
  /** TODO: 롯데 앱팀 확정값으로 교체 */
  fanTalkDeepLink: 'giantsapp://fantalk/compose?card={cardId}&img={imgUrl}',
  /** TODO: 미설치 시 이동할 스토어/원링크 */
  storeFallback: 'https://giantsclub.com',
  /** OG 공유 링크(서버 연동 시) */
  shareBaseUrl: '',
} as const;
