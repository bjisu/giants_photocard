import { CONFIG, COPY, RARITY } from '../config';
import { formatCountdown, isDevBypass, msUntilReset } from '../daily';
import { captureCard, downloadBlob } from '../share/capture';
import { openFanTalk } from '../share/deeplink';
import { buildCardFront, rarityBadgeText } from '../ui/cardView';
import { toast } from '../ui/toast';
import type { AppContext, ScreenController } from '../types';

export function resultScreen(root: HTMLElement, app: AppContext): ScreenController {
  const draw = app.draw;
  const el = document.createElement('section');
  el.className = 'screen result';
  root.appendChild(el);

  if (!draw) {
    // 방어: 결과 없이 진입하면 스플래시로
    app.go('SPLASH');
    return { destroy: () => el.remove() };
  }

  const card = draw.result;
  const canRedraw = !CONFIG.DAILY_LIMIT || isDevBypass();

  el.innerHTML = `
    ${app.returning ? `<span class="today-chip">${COPY.result.todayChip}</span>` : ''}
    <div class="rarity-badge rb-${card.rarity}">${rarityBadgeText(card)}</div>
    ${card.rarity === 'legendary' && !app.returning ? `<p class="legend-caption">${COPY.result.legendary}</p>` : ''}
    <div class="result-card-slot"></div>
    <div class="cta hidden">
      <button class="btn btn-fantalk" type="button">${COPY.share.fanTalk}</button>
      <div class="btn-row">
        <button class="btn btn-save" type="button">${COPY.share.save}</button>
        <button class="btn btn-share" type="button">${COPY.share.share}</button>
      </div>
      <div class="redraw-slot"></div>
    </div>
    <div class="lock-row">
      <span class="lock-count"></span>
      ${CONFIG.SHOW_SKIP ? `<button class="skip" type="button">${COPY.result.skip}</button>` : ''}
    </div>
  `;

  const slot = el.querySelector('.result-card-slot') as HTMLElement;
  const front = buildCardFront(card);
  front.classList.add(`glow-${card.rarity}`, 'idle-glow');
  slot.appendChild(front);

  const cta = el.querySelector('.cta') as HTMLElement;
  const lockRow = el.querySelector('.lock-row') as HTMLElement;
  const lockCount = el.querySelector('.lock-count') as HTMLElement;
  const timers: number[] = [];
  let countdownTimer = 0;

  // ---- CTA 잠금 (5초 감상, 재방문 시 즉시 해제) ----
  const unlock = () => {
    lockRow.classList.add('hidden');
    cta.classList.remove('hidden');
  };
  if (app.returning || !CONFIG.REVEAL_LOCK_SEC) {
    unlock();
  } else {
    let remain = CONFIG.REVEAL_LOCK_SEC;
    lockCount.textContent = `${remain}`;
    const tick = window.setInterval(() => {
      remain--;
      if (remain <= 0) {
        window.clearInterval(tick);
        unlock();
      } else {
        lockCount.textContent = `${remain}`;
      }
    }, 1000);
    timers.push(tick);
    el.querySelector('.skip')?.addEventListener('click', () => {
      window.clearInterval(tick);
      unlock();
    });
  }

  // ---- 다시 뽑기 / 카운트다운 ----
  const redrawSlot = el.querySelector('.redraw-slot') as HTMLElement;
  const mountRedraw = () => {
    redrawSlot.innerHTML = `<button class="btn btn-redraw" type="button">${COPY.share.redraw}</button>`;
    redrawSlot.querySelector('.btn-redraw')?.addEventListener('click', () => {
      app.draw = null;
      app.returning = false;
      app.go('SPLASH');
    });
  };
  if (canRedraw) {
    mountRedraw();
  } else {
    redrawSlot.innerHTML = `<p class="countdown"></p>`;
    const cd = redrawSlot.querySelector('.countdown') as HTMLElement;
    const update = () => {
      const ms = msUntilReset();
      if (ms <= 1000) {
        window.clearInterval(countdownTimer);
        mountRedraw();
        return;
      }
      cd.textContent = COPY.result.countdown.replace('{t}', formatCountdown(ms));
    };
    update();
    countdownTimer = window.setInterval(update, 1000);
  }

  // ---- 저장 / 공유 / 팬톡 ----
  const filename = `giants-photobadge-${card.id}.png`;

  el.querySelector('.btn-save')?.addEventListener('click', async () => {
    try {
      const blob = await captureCard(card);
      downloadBlob(blob, filename);
      toast(COPY.share.saved);
    } catch (e) {
      console.warn('[share] capture 실패', e);
      toast('저장에 실패했어요. 잠시 후 다시 시도해 주세요');
    }
  });

  el.querySelector('.btn-share')?.addEventListener('click', async () => {
    const text = COPY.share.text.replace('{player}', card.player);
    try {
      const blob = await captureCard(card);
      const file = new File([blob], filename, { type: 'image/png' });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: '롯데자이언츠 포토배지', text });
      } else if (navigator.share) {
        await navigator.share({ title: '롯데자이언츠 포토배지', text, url: location.href });
      } else {
        downloadBlob(blob, filename); // 폴백: 저장
        toast(COPY.share.saved);
      }
    } catch (e) {
      if ((e as Error)?.name !== 'AbortError') console.warn('[share] 공유 실패', e);
    }
  });

  el.querySelector('.btn-fantalk')?.addEventListener('click', () => {
    openFanTalk(card);
  });

  return {
    destroy() {
      timers.forEach(clearInterval);
      window.clearInterval(countdownTimer);
      el.remove();
    },
  };
}
