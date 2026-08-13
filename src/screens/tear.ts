import { CONFIG, COPY } from '../config';
import { localDrawEngine } from '../drawEngine';
import { saveTodayDraw } from '../daily';
import { preloadImages } from '../data';
import { haptics } from '../fx/haptics';
import { sfx } from '../fx/sfx';
import { spawnTearBits } from '../fx/particles';
import { buildCardBack } from '../ui/cardView';
import type { AppContext, ScreenController } from '../types';

const SHARD_ROWS = 4;
const SHARD_COLS = 3;

export function tearScreen(root: HTMLElement, app: AppContext): ScreenController {
  const el = document.createElement('section');
  el.className = 'screen tear';
  el.innerHTML = `
    <p class="tear-guide">${COPY.tear.guide}</p>
    <div class="pack-wrap">
      <div class="pack">
        <div class="pack-card"></div>
        <div class="vinyl" aria-hidden="true"></div>
      </div>
    </div>
    <div class="tear-bottom">
      <div class="gauge"><div class="gauge-fill"></div><span class="gauge-label">개봉 0%</span></div>
      ${CONFIG.ACCESSIBLE_OPEN ? `<button class="hold-open" type="button">${COPY.tear.holdToOpen}</button>` : ''}
    </div>
  `;
  root.appendChild(el);

  // 팩 안에 카드 뒷면
  el.querySelector('.pack-card')!.appendChild(buildCardBack(app.manifest));

  // 비닐 조각 생성
  const vinyl = el.querySelector('.vinyl') as HTMLElement;
  const shards: HTMLElement[] = [];
  for (let r = 0; r < SHARD_ROWS; r++) {
    for (let c = 0; c < SHARD_COLS; c++) {
      const s = document.createElement('i');
      s.className = 'vinyl-shard';
      s.style.left = `${(c / SHARD_COLS) * 100}%`;
      s.style.top = `${(r / SHARD_ROWS) * 100}%`;
      s.style.width = `${100 / SHARD_COLS}%`;
      s.style.height = `${100 / SHARD_ROWS}%`;
      vinyl.appendChild(s);
      shards.push(s);
    }
  }
  // 랜덤 순서로 벗겨지게 셔플
  for (let i = shards.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shards[i], shards[j]] = [shards[j], shards[i]];
  }

  const gaugeFill = el.querySelector('.gauge-fill') as HTMLElement;
  const gaugeLabel = el.querySelector('.gauge-label') as HTMLElement;
  const pack = el.querySelector('.pack') as HTMLElement;

  let taps = 0;
  let finished = false;
  let flown = 0;
  let idleTimer = 0;
  let holdTimer = 0;
  const timers: number[] = [];

  const scheduleIdleHint = () => {
    window.clearTimeout(idleTimer);
    idleTimer = window.setTimeout(() => {
      if (!finished) {
        pack.classList.add('hint');
        window.setTimeout(() => pack.classList.remove('hint'), 900);
        scheduleIdleHint();
      }
    }, 2000);
  };
  scheduleIdleHint();

  const render = (progress: number) => {
    gaugeFill.style.width = `${Math.round(progress * 100)}%`;
    gaugeLabel.textContent = COPY.tear.gauge.replace('{n}', `${Math.round(progress * 100)}`);
    const target = Math.floor(progress * shards.length);
    while (flown < target && flown < shards.length) {
      const s = shards[flown++];
      const dx = (Math.random() - 0.5) * 220;
      const dy = -80 - Math.random() * 160;
      const rot = (Math.random() - 0.5) * 140;
      s.style.transform = `translate(${dx}px, ${dy}px) rotate(${rot}deg)`;
      s.style.opacity = '0';
    }
  };

  const finish = async () => {
    if (finished) return;
    finished = true;
    window.clearTimeout(idleTimer);
    render(1);
    vinyl.classList.add('gone');
    pack.classList.add('opened');
    haptics.pattern([20, 30, 20]);

    // 개봉 완료 시점에 결과 1회 확정 (§3) — 이후 선택은 연출용
    const draw = await localDrawEngine.draw({ pool: app.manifest.cards });
    app.draw = draw;
    saveTodayDraw(draw); // 하루 1회 기록
    preloadImages([...draw.shown.map((c) => c.image), app.manifest.backImage]);

    timers.push(window.setTimeout(() => app.go('REVEAL_3'), 450));
  };

  const onTap = (e: PointerEvent) => {
    if (finished) return;
    // 보조 버튼은 별도 처리
    if ((e.target as HTMLElement).closest('.hold-open')) return;
    taps++;
    scheduleIdleHint();
    const progress = Math.min(taps / CONFIG.TAPS_TO_OPEN, 1);
    render(progress);
    spawnTearBits(e.clientX, e.clientY, 3 + Math.floor(Math.random() * 3));
    haptics.tap();
    sfx.play('tear');
    pack.classList.remove('poked');
    void pack.offsetWidth; // 리플로우로 애니 재시작
    pack.classList.add('poked');
    if (progress >= 1) void finish();
  };
  el.addEventListener('pointerdown', onTap);

  // 접근성: 길게 눌러 자동 개봉
  const holdBtn = el.querySelector('.hold-open') as HTMLButtonElement | null;
  const stopHold = () => window.clearInterval(holdTimer);
  if (holdBtn) {
    holdBtn.addEventListener('pointerdown', (e) => {
      e.stopPropagation();
      stopHold();
      holdTimer = window.setInterval(() => {
        taps += 2;
        const progress = Math.min(taps / CONFIG.TAPS_TO_OPEN, 1);
        render(progress);
        haptics.tap();
        if (progress >= 1) {
          stopHold();
          void finish();
        }
      }, 120);
    });
    for (const ev of ['pointerup', 'pointerleave', 'pointercancel'] as const) {
      holdBtn.addEventListener(ev, stopHold);
    }
  }

  return {
    destroy() {
      window.clearTimeout(idleTimer);
      stopHold();
      timers.forEach(clearTimeout);
      el.remove();
    },
  };
}
