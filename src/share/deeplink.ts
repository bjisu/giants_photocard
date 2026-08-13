import { COPY, LINKS } from '../config';
import { toast } from '../ui/toast';
import type { Card } from '../types';

declare global {
  interface Window {
    GiantsBridge?: {
      openFanTalk?: (payload: { cardId: string; imgUrl?: string }) => void;
    };
  }
}

/**
 * 팬톡 딥링크.
 * - 앱 웹뷰 내부면 window.GiantsBridge.openFanTalk 우선 사용
 * - 딥링크 시도 → 일정 시간 내 미전환이면 storeFallback로 이동(설치 유도)
 * - LINKS.fanTalkEnabled=false(기본)면 "연동 예정" 토스트 폴백
 */
export function openFanTalk(card: Card, imgUrl?: string): void {
  const payload = { cardId: card.id, imgUrl };

  if (window.GiantsBridge?.openFanTalk) {
    window.GiantsBridge.openFanTalk(payload);
    return;
  }

  if (!LINKS.fanTalkEnabled) {
    toast(COPY.share.fanTalkPending);
    return;
  }

  const url = LINKS.fanTalkDeepLink
    .replace('{cardId}', encodeURIComponent(card.id))
    .replace('{imgUrl}', encodeURIComponent(imgUrl ?? ''));

  const timer = window.setTimeout(() => {
    if (!document.hidden) location.href = LINKS.storeFallback;
  }, 1600);
  const cancel = () => window.clearTimeout(timer);
  window.addEventListener('pagehide', cancel, { once: true });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) cancel();
  }, { once: true });

  location.href = url;
}
