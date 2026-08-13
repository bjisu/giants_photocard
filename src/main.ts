import './styles/theme.css';
import './styles/global.css';
import './styles/card.css';

import { loadManifest, preloadImages } from './data';
import { getTodayDraw } from './daily';
import { clearParticles } from './fx/particles';
import { splashScreen } from './screens/splash';
import { tearScreen } from './screens/tear';
import { revealScreen } from './screens/reveal';
import { resultScreen } from './screens/result';
import type { AppContext, Screen, ScreenController } from './types';

const root = document.getElementById('app')!;

async function boot(): Promise<void> {
  const manifest = await loadManifest();
  preloadImages([manifest.backImage]);

  let current: ScreenController | null = null;

  const app: AppContext = {
    manifest,
    draw: null,
    returning: false,
    go(next: Screen) {
      current?.destroy();
      clearParticles();

      // 하루 1회: 스플래시→뜯기 전이 시 오늘 이미 뽑았으면 결과 재표시 (§일일제한)
      if (next === 'TEARING') {
        const today = getTodayDraw(manifest);
        if (today) {
          app.draw = today;
          app.returning = true;
          current = resultScreen(root, app);
          return;
        }
        app.returning = false;
      }

      switch (next) {
        case 'SPLASH':
          current = splashScreen(root, app);
          break;
        case 'TEARING':
          current = tearScreen(root, app);
          break;
        case 'REVEAL_3':
          current = revealScreen(root, app);
          break;
        case 'RESULT':
          current = resultScreen(root, app);
          break;
      }
    },
  };

  app.go('SPLASH');
}

void boot();
