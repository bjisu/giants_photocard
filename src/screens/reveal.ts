import { COPY } from '../config';
import { buildCardBack } from '../ui/cardView';
import { runFlipSequence } from './flip';
import type { AppContext, ScreenController } from '../types';

/**
 * REVEAL_3: 뒷면 카드 3장 표시 → 1장 선택(SELECTED) → FLIPPING → RESULT.
 * 3장은 이미 draw()로 확정된 [결과+미끼2] — 어떤 걸 눌러도 결과 카드로 뒤집힌다. (§4.3)
 */
export function revealScreen(root: HTMLElement, app: AppContext): ScreenController {
  const el = document.createElement('section');
  el.className = 'screen reveal';
  el.innerHTML = `
    <p class="reveal-guide">${COPY.reveal.guide}</p>
    <div class="fan"></div>
  `;
  root.appendChild(el);

  const fan = el.querySelector('.fan') as HTMLElement;
  const holders: HTMLElement[] = [];
  let selected = false;
  let destroyed = false;

  for (let i = 0; i < 3; i++) {
    const holder = document.createElement('button');
    holder.type = 'button';
    holder.className = `card-holder pos-${i}`;
    holder.setAttribute('aria-label', `카드 ${i + 1} 선택`);
    holder.appendChild(buildCardBack(app.manifest));
    holder.style.animationDelay = `${i * 80}ms`;
    fan.appendChild(holder);
    holders.push(holder);

    holder.addEventListener('click', async () => {
      if (selected || !app.draw) return;
      selected = true;
      el.classList.add('picked');
      holder.classList.add('chosen');
      holders.forEach((h) => h !== holder && h.classList.add('dismissed'));

      // SELECTED: 나머지 2장 퇴장(0.35s) → 중앙 이동 → FLIPPING
      await new Promise((r) => setTimeout(r, 380));
      if (destroyed) return;
      await runFlipSequence(holder, app.draw.result);
      if (destroyed) return;
      app.go('RESULT');
    });
  }

  return {
    destroy() {
      destroyed = true;
      el.remove();
    },
  };
}
