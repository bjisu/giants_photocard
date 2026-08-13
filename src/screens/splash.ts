import { CONFIG, COPY } from '../config';
import type { AppContext, ScreenController } from '../types';

export function splashScreen(root: HTMLElement, app: AppContext): ScreenController {
  const el = document.createElement('section');
  el.className = 'screen splash';
  el.innerHTML = `
    <div class="splash-inner">
      <p class="splash-eyebrow">${COPY.splash.subtitle}</p>
      <h1 class="splash-logo">Giants</h1>
      <h2 class="splash-title">${COPY.splash.title}<br/>컬렉션</h2>
      <div class="splash-loading">
        <div class="loading-bar"><i></i></div>
        <p class="loading-text">${COPY.splash.loading}</p>
      </div>
      <p class="splash-tap hidden">${COPY.splash.tapToStart}</p>
    </div>
  `;
  root.appendChild(el);

  let done = false;
  let minDelayPassed = false;
  const timers: number[] = [];

  const proceed = () => {
    if (done) return;
    done = true;
    app.go('TEARING');
  };

  const readyUp = () => {
    el.querySelector('.splash-loading')?.classList.add('hidden');
    el.querySelector('.splash-tap')?.classList.remove('hidden');
  };

  timers.push(
    window.setTimeout(() => {
      minDelayPassed = true;
      readyUp();
      // 자동 진행: 2s 경과 후 잠시 뒤 자동 전환 (탭하면 즉시)
      timers.push(window.setTimeout(proceed, 1800));
    }, CONFIG.SPLASH_MS),
  );

  const onTap = () => {
    if (minDelayPassed) proceed();
  };
  el.addEventListener('pointerdown', onTap);

  return {
    destroy() {
      timers.forEach(clearTimeout);
      el.removeEventListener('pointerdown', onTap);
      el.remove();
    },
  };
}
