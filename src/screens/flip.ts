import { RARITY } from '../config';
import { haptics } from '../fx/haptics';
import { confetti, spawnBurst } from '../fx/particles';
import { buildCardFront } from '../ui/cardView';
import type { Card } from '../types';

const RARITY_COLORS: Record<string, string[]> = {
  normal: ['#c8d3e2', '#ffffff'],
  rare: ['#4f8ef7', '#9cc1ff', '#ffffff'],
  epic: ['#b06bf7', '#d9b8ff', '#7ea6ff'],
  legendary: ['#f6c453', '#ffd98a', '#e11d3f', '#ffffff'],
};

const reduceMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * FLIPPING 단계: 선택된 뒷면 카드를 3D로 뒤집고(0.6s),
 * 프레임 반짝임 sweep + 희귀도 이펙트를 재생한다. (§4.4)
 * REVEAL_3 화면 내에서 시각적 연속성을 위해 함수로 실행된다.
 */
export async function runFlipSequence(holder: HTMLElement, card: Card): Promise<void> {
  const fx = RARITY.effect[card.rarity];
  const backEl = holder.firstElementChild as HTMLElement;

  // 3D 구조로 재구성: holder > .card3d > [back, front]
  const card3d = document.createElement('div');
  card3d.className = 'card3d';
  const front = buildCardFront(card);
  front.classList.add('face', 'face-front');
  backEl.classList.add('face', 'face-back');
  card3d.appendChild(backEl);
  card3d.appendChild(front);
  holder.appendChild(card3d);
  holder.classList.add('flipping');

  const flipMs = reduceMotion() ? 150 : 600;
  const anim = card3d.animate(
    [{ transform: 'rotateY(0deg)' }, { transform: 'rotateY(180deg)' }],
    { duration: flipMs, easing: 'cubic-bezier(.2,.7,.2,1)', fill: 'forwards' },
  );
  await anim.finished.catch(() => undefined);

  // 반짝임 sweep + 희귀도 연출
  front.classList.add('shine-run', `glow-${card.rarity}`);
  haptics.pattern(fx.vibrate);

  const rect = holder.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  spawnBurst(cx, cy, fx.particles, RARITY_COLORS[card.rarity]);

  if (fx.confetti && !reduceMotion()) {
    // 레전더리: 풀스크린 광채 + 컨페티
    const flash = document.createElement('div');
    flash.className = 'legend-flash';
    document.body.appendChild(flash);
    flash.animate(
      [{ opacity: 0 }, { opacity: 1, offset: 0.25 }, { opacity: 0 }],
      { duration: 1100, easing: 'ease-out' },
    ).finished.then(() => flash.remove()).catch(() => flash.remove());
    confetti();
  }

  // 이름 타이핑 등장
  const nameEl = front.querySelector('.name') as HTMLElement | null;
  if (nameEl && !reduceMotion()) {
    const full = nameEl.textContent ?? '';
    nameEl.textContent = '';
    nameEl.classList.add('typing');
    for (let i = 1; i <= full.length; i++) {
      nameEl.textContent = full.slice(0, i);
      await new Promise((r) => setTimeout(r, 55));
    }
    nameEl.classList.remove('typing');
  }

  await new Promise((r) => setTimeout(r, reduceMotion() ? 200 : 900));
}
