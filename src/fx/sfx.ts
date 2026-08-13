import { CONFIG } from '../config';

/**
 * 사운드 매니저 — public/assets/sfx/{tear,reveal,legendary}.mp3 가 있으면 재생,
 * 없으면 무음 폴백. 최초 사용자 제스처 이후에만 재생(자동재생 정책).
 */
const FILES: Record<string, string> = {
  tear: 'assets/sfx/tear.mp3',
  reveal: 'assets/sfx/reveal.mp3',
  legendary: 'assets/sfx/legendary.mp3',
};

const SOUND_KEY = 'giants.photocard.sound';
let enabled = (() => {
  try {
    const v = localStorage.getItem(SOUND_KEY);
    return v === null ? CONFIG.SOUND_DEFAULT : v === '1';
  } catch {
    return CONFIG.SOUND_DEFAULT;
  }
})();

const cache = new Map<string, HTMLAudioElement>();
const broken = new Set<string>();

export const sfx = {
  get enabled(): boolean {
    return enabled;
  },
  toggle(): boolean {
    enabled = !enabled;
    try {
      localStorage.setItem(SOUND_KEY, enabled ? '1' : '0');
    } catch {
      /* noop */
    }
    return enabled;
  },
  play(name: string | null): void {
    if (!name || !enabled || broken.has(name) || !(name in FILES)) return;
    try {
      let audio = cache.get(name);
      if (!audio) {
        audio = new Audio(FILES[name]);
        audio.preload = 'auto';
        audio.addEventListener('error', () => broken.add(name), { once: true });
        cache.set(name, audio);
      }
      audio.currentTime = 0;
      void audio.play().catch(() => broken.add(name));
    } catch {
      broken.add(name);
    }
  },
};
